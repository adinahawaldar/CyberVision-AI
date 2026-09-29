import express from 'express'
import mongoose from 'mongoose'
import Case from '../models/Case.js'
import Evidence from '../models/Evidence.js'
import User from '../models/User.js'
import { buildTimeline } from '../utils/parser.js'
import { detectAttackAlerts } from '../analysis/correlationEngine.js'
import { detectEventAnomalies } from '../ml/anomalyDetector.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

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

function canAccessCase(caseDoc, userId, role) {
  if (role === 'admin') return true
  const creatorId = toId(caseDoc.createdBy)
  if (!creatorId) return false
  if (creatorId === userId.toString()) return true
  return (caseDoc.sharedWith || []).some(entry => toId(entry) === userId.toString())
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

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    const { caseId, limit = 50 } = req.query

    let caseFilter = {}
    let selectedCase = null

    if (caseId) {
      selectedCase = await Case.findById(caseId).lean()
      if (!selectedCase) return res.status(404).json({ error: 'Case not found' })
      if (reqUser && !canAccessCase(selectedCase, reqUser.id, reqUser.role)) {
        return res.status(403).json({ error: 'Access denied to this case' })
      }
      caseFilter = { caseId }
    } else if (reqUser) {
      const accessibleIds = await getAccessibleCaseIds(reqUser.id, reqUser.role)
      caseFilter = { caseId: { $in: accessibleIds } }
    }

    const evidenceList = await Evidence.find({
      ...caseFilter,
      status: { $in: ['parsed', 'verified'] },
    }).populate('caseId', 'title caseNumber').lean()

    const timeline = buildTimeline(evidenceList)
    const mlResult = await detectEventAnomalies(timeline.events)
    const attackAlerts = detectAttackAlerts(timeline.events)

    const anomalyLimit = Math.max(1, parseInt(limit, 10))
    const scoreBuckets = {
      critical: mlResult.mlAnomalies.filter(item => item.mlScore >= 90).length,
      high: mlResult.mlAnomalies.filter(item => item.mlScore >= 75 && item.mlScore < 90).length,
      medium: mlResult.mlAnomalies.filter(item => item.mlScore >= 50 && item.mlScore < 75).length,
      low: mlResult.mlAnomalies.filter(item => item.mlScore < 50).length,
    }
    const anomalies = mlResult.mlAnomalies.slice(0, anomalyLimit).map(item => ({
      ...item,
      detail: item.detail.length > 500 ? `${item.detail.slice(0, 497)}...` : item.detail,
    }))

    res.json({
      case: selectedCase ? {
        _id: selectedCase._id,
        caseNumber: selectedCase.caseNumber,
        title: selectedCase.title,
      } : null,
      summary: {
        ...mlResult.mlSummary,
        totalCases: new Set(evidenceList.map(ev => toId(ev.caseId?._id || ev.caseId))).size,
        totalEvidence: evidenceList.length,
        totalAttackAlerts: attackAlerts.length,
        scoreBuckets,
      },
      anomalies,
      attackAlerts: attackAlerts.slice(0, anomalyLimit),
    })
  } catch (err) {
    next(err)
  }
})

export default router
