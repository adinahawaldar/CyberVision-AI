import express from 'express'
import mongoose from 'mongoose'
import Case from '../models/Case.js'
import Evidence from '../models/Evidence.js'
import Report from '../models/Report.js'
import AuditLog from '../models/AuditLog.js'
import User from '../models/User.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// ─── Access helpers ──────────────────────────────────────────────────────
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

// GET /api/dashboard/stats — aggregated dashboard statistics (scoped to accessible cases)
router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    const accessibleIds = reqUser ? await getAccessibleCaseIds(reqUser.id, reqUser.role) : []
    const caseFilter = reqUser ? { _id: { $in: accessibleIds } } : {}
    const evidFilter = reqUser ? { caseId: { $in: accessibleIds } } : {}
    const reportFilter = reqUser ? { caseId: { $in: accessibleIds } } : {}

    const [totalCases, activeCases, reviewCases, closedCases, draftCases] = await Promise.all([
      Case.countDocuments(caseFilter),
      Case.countDocuments({ ...caseFilter, status: 'active' }),
      Case.countDocuments({ ...caseFilter, status: 'review' }),
      Case.countDocuments({ ...caseFilter, status: 'closed' }),
      Case.countDocuments({ ...caseFilter, status: 'draft' }),
    ])

    const [totalEvidence, totalReports, draftReports, integrityAlerts] = await Promise.all([
      Evidence.countDocuments(evidFilter),
      Report.countDocuments(reportFilter),
      Report.countDocuments({ ...reportFilter, status: 'draft' }),
      Evidence.countDocuments({ ...evidFilter, status: 'error' }),
    ])

    // IOC / Critical Threat counts (scoped to accessible evidence)
    const evidenceList = await Evidence.find(evidFilter, 'parsedData.events').lean()
    let totalIocs = 0
    let criticalThreats = 0
    const uniqueIocs = new Set()

    for (const ev of evidenceList) {
      if (ev.parsedData?.events) {
        for (const e of ev.parsedData.events) {
          if (e.threatIntel && e.threatIntel.score > 0) {
            let value = null
            const ipMatch = e.sourceIp || e.detail?.match(/\b((?:[0-9]{1,3}\.){3}[0-9]{1,3})\b/)?.[1] || e.raw?.match(/\b((?:[0-9]{1,3}\.){3}[0-9]{1,3})\b/)?.[1]
            if (ipMatch) {
              value = ipMatch
            } else {
              const hashMatch = e.detail?.match(/\b([a-fA-F0-9]{32})\b|\b([a-fA-F0-9]{64})\b/) ||
                e.raw?.match(/\b([a-fA-F0-9]{32})\b|\b([a-fA-F0-9]{64})\b/)
              if (hashMatch) value = hashMatch[1] || hashMatch[2]
            }
            if (value) {
              uniqueIocs.add(value)
              if (e.threatIntel.score >= 90) criticalThreats++
            }
          }
        }
      }
    }
    totalIocs = uniqueIocs.size

    // Monthly case activity for chart (last 7 months, scoped)
    const now = new Date()
    const months = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const label = d.toLocaleString('default', { month: 'short' })
      const casesCount = await Case.countDocuments({ ...caseFilter, createdAt: { $gte: d, $lte: end } })
      const reportsCount = await Report.countDocuments({ ...reportFilter, createdAt: { $gte: d, $lte: end } })
      months.push({ month: label, cases: casesCount, reports: reportsCount })
    }

    // Evidence type distribution (scoped)
    const evidenceAgg = await Evidence.aggregate([
      ...(reqUser ? [{ $match: evidFilter }] : []),
      { $group: { _id: '$metadata.fileType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ])

    const typeColorMap = { log: '#00d4ff', json: '#7b61ff', csv: '#ff6b6b', txt: '#00e676', xml: '#ffab40', pcap: '#e040fb' }
    const evidenceTypes = evidenceAgg.map(e => ({
      name: (e._id || 'unknown').toUpperCase(),
      value: e.count,
      color: typeColorMap[e._id] || '#888',
    }))

    res.json({
      stats: {
        activeCases, totalEvidence, totalReports, integrityAlerts,
        totalCases, reviewCases, closedCases, draftCases, draftReports,
        totalIocs, criticalThreats,
      },
      caseActivity: months,
      evidenceTypes: evidenceTypes.length > 0 ? evidenceTypes : [
        { name: 'No data', value: 1, color: '#555' },
      ],
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/dashboard/activity — recent activity feed from audit log (scoped to current user)
router.get('/activity', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)

    // Build filter: only show the logged-in user's own activity
    const filter = {}
    if (reqUser) {
      let uid
      try { uid = new mongoose.Types.ObjectId(reqUser.id) } catch { uid = reqUser.id }
      filter.userId = uid
    }

    const logs = await AuditLog.find(filter)
      .sort('-createdAt')
      .limit(10)
      .lean()

    const activities = logs.map(log => {
      const name = log.userName || 'System'
      const initials = name === 'System' ? 'SYS'
        : name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      return {
        user: log.userId ? initials : 'AI',
        text: log.action,
        time: timeAgo(log.createdAt),
      }
    })

    if (activities.length === 0) {
      activities.push(
        { user: 'SYS', text: 'No activity yet. Create your first case to get started.', time: 'just now' }
      )
    }

    res.json({ activities })
  } catch (err) {
    next(err)
  }
})

// GET /api/dashboard/iocs — threat IOCs scoped to accessible cases
router.get('/iocs', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    const accessibleIds = reqUser ? await getAccessibleCaseIds(reqUser.id, reqUser.role) : []
    const evidFilter = reqUser ? { caseId: { $in: accessibleIds } } : {}

    const evidenceList = await Evidence.find(evidFilter)
      .populate('caseId', 'title caseNumber')
      .lean()

    const iocs = []
    const seen = new Set()

    for (const ev of evidenceList) {
      if (ev.parsedData?.events) {
        for (const e of ev.parsedData.events) {
          if (e.threatIntel && e.threatIntel.score > 0) {
            let value = 'Unknown IOC'
            let type = 'Malicious Hash'
            
            // Extract IP
            const ipMatch = e.sourceIp || e.detail?.match(/\b((?:[0-9]{1,3}\.){3}[0-9]{1,3})\b/)?.[1] || e.raw?.match(/\b((?:[0-9]{1,3}\.){3}[0-9]{1,3})\b/)?.[1]
            if (ipMatch) {
              value = ipMatch
              type = 'IP Reputation'
            } else {
              // Extract MD5/SHA256 Hash
              const hashMatch = e.detail?.match(/\b([a-fA-F0-9]{32})\b|\b([a-fA-F0-9]{64})\b/) ||
                e.raw?.match(/\b([a-fA-F0-9]{32})\b|\b([a-fA-F0-9]{64})\b/)
              if (hashMatch) {
                value = hashMatch[1] || hashMatch[2]
                type = 'Malware Hash'
              }
            }

            const key = `${type}-${value}-${ev.caseId?._id || 'none'}`
            if (!seen.has(key)) {
              seen.add(key)
              iocs.push({
                value,
                type,
                score: e.threatIntel.score,
                details: e.threatIntel.details,
                caseId: ev.caseId?._id,
                caseNumber: ev.caseId?.caseNumber || 'N/A',
                caseTitle: ev.caseId?.title || 'Unknown Case',
                evidenceId: ev._id,
                evidenceName: ev.originalName,
                timestamp: e.timestamp
              })
            }
          }
        }
      }
    }

    // Sort by risk score descending, then by timestamp descending
    iocs.sort((a, b) => b.score - a.score || new Date(b.timestamp) - new Date(a.timestamp))

    res.json({ iocs })
  } catch (err) {
    next(err)
  }
})

// GET /api/dashboard/notifications — notifications for bell icon (scoped to current user)
router.get('/notifications', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)

    // Notification-worthy actions
    const notifActions = [
      'case_created', 'case_updated', 'case_closed',
      'evidence_uploaded', 'evidence_parsed', 'evidence_verified',
      'report_generated', 'report_edited', 'report_reviewed', 'report_approved',
      'ai_summary_generated', 'ai_findings_generated',
      'evidence_hash_check',
    ]

    // Only show notifications for the logged-in user's own actions
    const filter = { action: { $in: notifActions } }
    if (reqUser) {
      let uid
      try { uid = new mongoose.Types.ObjectId(reqUser.id) } catch { uid = reqUser.id }
      filter.userId = uid
    }

    const logs = await AuditLog.find(filter)
      .sort('-createdAt')
      .limit(15)
      .lean()

    const actionMessages = {
      case_created: 'New case was created',
      case_updated: 'Case was updated',
      case_closed: 'Case has been closed',
      evidence_uploaded: 'Evidence file was uploaded',
      evidence_parsed: 'Evidence parsing completed',
      evidence_verified: 'Evidence integrity verified',
      evidence_hash_check: 'Hash verification performed',
      report_generated: 'AI report was generated',
      report_edited: 'Report section was edited',
      report_reviewed: 'Report was marked as reviewed',
      report_approved: 'Report was approved',
      ai_summary_generated: 'AI generated executive summary',
      ai_findings_generated: 'AI generated key findings',
    }

    const notifications = logs.map((log, i) => ({
      id: log._id.toString(),
      text: `${actionMessages[log.action] || log.action}${log.details ? ' — ' + log.details.substring(0, 80) : ''}`,
      time: timeAgo(log.createdAt),
      unread: i < 5,
      action: log.action,
    }))

    res.json({ notifications })
  } catch (err) {
    next(err)
  }
})

// GET /api/dashboard/search?q=query — global search scoped to accessible cases
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q || q.length < 2) return res.json({ results: [] })

    const reqUser = await getReqUser(req)
    const accessibleIds = reqUser ? await getAccessibleCaseIds(reqUser.id, reqUser.role) : []
    const caseFilter = reqUser ? { _id: { $in: accessibleIds } } : {}
    const evidFilter = reqUser ? { caseId: { $in: accessibleIds } } : {}
    const reportFilter = reqUser ? { caseId: { $in: accessibleIds } } : {}

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')

    const [cases, reports, evidence] = await Promise.all([
      Case.find({
        ...caseFilter,
        $or: [
          { title: regex },
          { caseNumber: regex },
          { description: regex },
        ],
      }).limit(5).lean(),
      Report.find({
        ...reportFilter,
        $or: [
          { title: regex },
          { reportNumber: regex },
        ],
      }).limit(5).lean(),
      Evidence.find({
        ...evidFilter,
        originalName: regex,
      }).limit(5).lean(),
    ])

    const results = [
      ...cases.map(c => ({ label: `${c.caseNumber} — ${c.title}`, path: `/cases/${c._id}`, category: 'Case' })),
      ...reports.map(r => ({ label: `${r.reportNumber} — ${r.title}`, path: `/reports/${r._id}`, category: 'Report' })),
      ...evidence.map(e => ({ label: e.originalName, path: `/cases/${e.caseId}`, category: 'Evidence' })),
    ]

    res.json({ results })
  } catch (err) {
    next(err)
  }
})

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export default router
