import express from 'express'
import { body, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import Case from '../models/Case.js'
import Evidence from '../models/Evidence.js'
import User from '../models/User.js'
import { generateChatResponse } from '../services/aiService.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

const router = express.Router()

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Extract the string id from a value that may be an ObjectId, a populated doc, or a string */
function toId(val) {
  if (!val) return null
  if (val._id) return val._id.toString()
  return val.toString()
}

/**
 * Resolve the request user. If authenticated returns { id, role }.
 * Falls back to the first DB user for single-user / unauthenticated mode.
 */
async function getReqUser(req) {
  if (req.user && req.user.id) return req.user
  if (process.env.NODE_ENV !== 'production') {
    const dbUser = await User.findOne().lean()
    if (dbUser) return { id: dbUser._id.toString(), role: dbUser.role }
  }
  return null
}

/**
 * Build a Mongoose filter that returns only cases the user can see:
 * - admins see everything
 * - everyone else sees cases they created OR were shared with
 */
function buildAccessFilter(userId, role) {
  if (role === 'admin') return {}
  // Convert string userId to ObjectId for proper MongoDB array matching
  let uid
  try { uid = new mongoose.Types.ObjectId(userId) } catch { uid = userId }
  return {
    $or: [
      { createdBy: uid },
      { sharedWith: uid },
    ],
  }
}

/**
 * Check whether a user may access a specific case document.
 * Returns true for admins, owners, or users in sharedWith.
 * Handles both populated and unpopulated sharedWith/createdBy fields.
 */
function canAccessCase(caseDoc, userId, role) {
  if (role === 'admin') return true
  const creatorId = toId(caseDoc.createdBy)
  if (!creatorId) return false // unowned legacy case — only admins
  if (creatorId === userId.toString()) return true
  return (caseDoc.sharedWith || []).some(entry => toId(entry) === userId.toString())
}

function isOwnerOrAdmin(caseDoc, userId, role) {
  if (role === 'admin') return true
  const creatorId = toId(caseDoc.createdBy)
  if (!creatorId) return false
  return creatorId === userId.toString()
}

// ─── Routes ────────────────────────────────────────────────────────────────

// GET /api/cases — List cases accessible to the current user
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 20, sort = '-createdAt' } = req.query
    const reqUser = await getReqUser(req)

    const accessFilter = reqUser ? buildAccessFilter(reqUser.id, reqUser.role) : {}
    const filter = { ...accessFilter }

    if (status && status !== 'all') filter.status = status
    if (priority) filter.priority = priority
    if (search) {
      const searchOr = [
        { title: { $regex: search, $options: 'i' } },
        { caseNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
      // Merge search with existing $or if present
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }]
        delete filter.$or
      } else {
        filter.$or = searchOr
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Case.countDocuments(filter)
    const cases = await Case.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    res.json({
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (err) {
    next(err)
  }
})



// GET /api/cases/:id — Get single case (with sharedWith populated)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)

    const caseDoc = await Case.findById(req.params.id)
      .populate('evidence')
      .populate('reports')
      .populate('sharedWith', 'name email role')

    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    if (reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    res.json(caseDoc)
  } catch (err) {
    next(err)
  }
})

// POST /api/cases — Create new case (viewers cannot create)
router.post('/', optionalAuth, [
  body('title').notEmpty().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot create cases' })
    }

    const { title, description, priority, assigneeName, tags } = req.body

    // Resolve assignee name — prefer provided name, fallback to logged-in user's name
    let resolvedAssigneeName = assigneeName || ''
    if (!resolvedAssigneeName && reqUser?.id) {
      const userDoc = await User.findById(reqUser.id, 'name').lean()
      if (userDoc) resolvedAssigneeName = userDoc.name
    }

    const newCase = await Case.create({
      title,
      description: description || '',
      priority: priority || 'medium',
      assigneeName: resolvedAssigneeName,
      assignee: reqUser?.id,
      createdBy: reqUser?.id,
      tags: tags || [],
      status: 'draft',
    })

    await logAudit('case_created', 'case', newCase._id, `Case ${newCase.caseNumber} created: ${title}`, req)

    res.status(201).json(newCase)
  } catch (err) {
    next(err)
  }
})

// PUT /api/cases/:id — Update case (viewers cannot update)
router.put('/:id', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot update cases' })
    }

    const caseDoc = await Case.findById(req.params.id)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    if (reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    const { title, description, status, priority, assigneeName, tags, notes } = req.body
    const updates = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (assigneeName !== undefined) updates.assigneeName = assigneeName
    if (tags !== undefined) updates.tags = tags
    if (notes !== undefined) updates.notes = notes
    if (status === 'closed') updates.closedAt = new Date()

    const updated = await Case.findByIdAndUpdate(req.params.id, updates, { new: true })

    const action = status === 'closed' ? 'case_closed' : 'case_updated'
    await logAudit(action, 'case', updated._id, `Case ${updated.caseNumber} updated`, req)

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/cases/:id — Archive case (viewers cannot delete)
router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot delete cases' })
    }

    const caseDoc = await Case.findById(req.params.id)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    if (reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    )

    await logAudit('case_updated', 'case', updated._id, `Case ${updated.caseNumber} archived`, req)

    res.json({ message: 'Case archived', case: updated })
  } catch (err) {
    next(err)
  }
})

// POST /api/cases/:id/share — Share case with another user by email (owner/admin only)
router.post('/:id/share', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    const caseDoc = await Case.findById(req.params.id)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    if (!reqUser || !isOwnerOrAdmin(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Only the case owner or admin can share this case' })
    }

    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (!targetUser) return res.status(404).json({ error: `No user found with email: ${email}` })

    const alreadyShared = (caseDoc.sharedWith || []).some(id => id.toString() === targetUser._id.toString())
    if (alreadyShared) return res.status(409).json({ error: 'Case is already shared with this user' })

    const isOwner = caseDoc.createdBy && caseDoc.createdBy.toString() === targetUser._id.toString()
    if (isOwner) return res.status(409).json({ error: 'Cannot share case with its owner' })

    await Case.findByIdAndUpdate(req.params.id, { $push: { sharedWith: targetUser._id } })
    await logAudit('case_shared', 'case', caseDoc._id, `Case shared with ${targetUser.email}`, req)

    const updated = await Case.findById(req.params.id).populate('sharedWith', 'name email role')
    res.json({ message: `Case shared with ${targetUser.name}`, sharedWith: updated.sharedWith })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/cases/:id/share/:userId — Revoke case access (owner/admin only)
router.delete('/:id/share/:userId', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    const caseDoc = await Case.findById(req.params.id)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    if (!reqUser || !isOwnerOrAdmin(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Only the case owner or admin can revoke access' })
    }

    // Convert to ObjectId for proper $pull matching
    let revokeUid
    try { revokeUid = new mongoose.Types.ObjectId(req.params.userId) } catch { revokeUid = req.params.userId }

    await Case.findByIdAndUpdate(req.params.id, { $pull: { sharedWith: revokeUid } })
    await logAudit('case_share_revoked', 'case', caseDoc._id, `Access revoked for user ${req.params.userId}`, req)

    const updated = await Case.findById(req.params.id).populate('sharedWith', 'name email role')
    res.json({ message: 'Access revoked', sharedWith: updated.sharedWith })
  } catch (err) {
    next(err)
  }
})

// POST /api/cases/:id/chat — RAG Chat (access-checked; all roles including viewer may chat)
router.post('/:id/chat', optionalAuth, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body
    if (!message) return res.status(400).json({ error: 'Message is required' })

    const reqUser = await getReqUser(req)
    const caseDoc = await Case.findById(req.params.id)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    if (reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    // 1. Gather all parsed events for this case
    const evidenceList = await Evidence.find({ caseId: caseDoc._id })
    const allEvents = []
    for (const ev of evidenceList) {
      if (ev.parsedData && ev.parsedData.events) {
        for (const event of ev.parsedData.events) {
          allEvents.push({
            ...event.toObject(),
            evidenceName: ev.originalName
          })
        }
      }
    }

    // 2. Keyword-based RAG ranking
    const keywords = message.toLowerCase()
      .replace(/[^a-z0-9\s.]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)

    let matchedEvents = []

    // Get dynamic RAG context limit from user settings
    let ragContextLimit = 25
    try {
      const settingsUser = await User.findOne()
      if (settingsUser && settingsUser.settings.ragContextLimit) {
        ragContextLimit = settingsUser.settings.ragContextLimit
      }
    } catch (err) {
      console.error('Error loading RAG context limit:', err.message)
    }

    if (keywords.length === 0) {
      matchedEvents = allEvents
        .sort((a, b) => (b.severity === 'critical' || b.severity === 'danger' ? 1 : -1))
        .slice(0, ragContextLimit)
    } else {
      const scored = allEvents.map(event => {
        let score = 0
        const detailLower = (event.detail || '').toLowerCase()
        const rawLower = (event.raw || '').toLowerCase()
        const sourceLower = (event.source || '').toLowerCase()

        for (const kw of keywords) {
          if (detailLower.includes(kw)) score += 5
          if (rawLower.includes(kw)) score += 3
          if (sourceLower.includes(kw)) score += 2
          if (event.mitreAttack?.techniqueId?.toLowerCase().includes(kw)) score += 10
          if (event.mitreAttack?.techniqueName?.toLowerCase().includes(kw)) score += 8
          if (event.threatIntel?.details?.toLowerCase().includes(kw)) score += 8
        }

        if (score > 0) {
          if (event.severity === 'critical') score += 5
          if (event.severity === 'danger') score += 3
          if (event.severity === 'warning') score += 1
        }

        return { event, score }
      })

      matchedEvents = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.event)
        .slice(0, ragContextLimit)
    }

    // 3. Call AI Service
    const answer = await generateChatResponse(caseDoc.title, history, matchedEvents, message)

    await logAudit('case_chat_queried', 'case', caseDoc._id, `Query: "${message.substring(0, 40)}..."`, req)

    res.json({
      message: answer,
      sources: matchedEvents.map(e => ({
        timestamp: e.timestamp,
        source: e.source,
        detail: e.detail,
        severity: e.severity,
        mitreAttack: e.mitreAttack,
        threatIntel: e.threatIntel,
        evidenceName: e.evidenceName
      }))
    })
  } catch (err) {
    next(err)
  }
})
export default router
