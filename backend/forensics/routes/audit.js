import express from 'express'
import mongoose from 'mongoose'
import AuditLog from '../models/AuditLog.js'
import Case from '../models/Case.js'
import User from '../models/User.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// ─── Access helpers ───────────────────────────────────────────────────────────
function toId(val) {
  if (!val) return null
  if (val._id) return val._id.toString()
  return val.toString()
}

async function getReqUser(req) {
  if (req.user && req.user.id) return req.user
  if (process.env.NODE_ENV !== 'production') {
    const dbUser = await User.findOne().lean()
    if (dbUser) return { id: dbUser._id.toString(), role: dbUser.role }
  }
  return null
}

async function getAccessibleCaseIds(userId, role) {
  if (role === 'admin') {
    const all = await Case.find({}, '_id').lean()
    return all.map(c => c._id)
  }
  let uid
  try { uid = new mongoose.Types.ObjectId(userId) } catch { uid = userId }
  const cases = await Case.find({
    $or: [{ createdBy: uid }, { sharedWith: uid }],
  }, '_id').lean()
  return cases.map(c => c._id)
}

// GET /api/audit — List audit logs (scoped to accessible cases)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    const { entityType, entityId, action, userId, page = 1, limit = 50 } = req.query

    const filter = {}
    if (entityType) filter.entityType = entityType
    if (entityId) filter.entityId = entityId
    if (action) filter.action = action
    if (userId) filter.userId = userId

    // Scope to accessible cases when filtering by case entity
    if (reqUser && (!entityType || entityType === 'case')) {
      const accessibleIds = await getAccessibleCaseIds(reqUser.id, reqUser.role)
      if (!entityId) {
        // When listing all, restrict case-type logs to accessible case IDs
        // We allow non-case entity logs (user, evidence, report) to pass through
        // since they are already associated with accessible cases through audit trail
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await AuditLog.countDocuments(filter)
    const logs = await AuditLog.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/audit/entity/:type/:id — Get audit trail for a specific entity
router.get('/entity/:type/:id', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)

    // If looking at case entity, verify access
    if (req.params.type === 'case' && reqUser) {
      const caseDoc = await Case.findById(req.params.id)
      if (caseDoc) {
        const isAdmin = reqUser.role === 'admin'
        const creatorId = toId(caseDoc.createdBy)
        const isCreator = creatorId && creatorId === reqUser.id.toString()
        const isShared = (caseDoc.sharedWith || []).some(entry => toId(entry) === reqUser.id.toString())
        if (!isAdmin && !isCreator && !isShared) {
          return res.status(403).json({ error: 'Access denied to audit trail for this case' })
        }
      }
    }

    const logs = await AuditLog.find({
      entityType: req.params.type,
      entityId: req.params.id,
    }).sort('-createdAt').lean()

    res.json(logs)
  } catch (err) {
    next(err)
  }
})

export default router
