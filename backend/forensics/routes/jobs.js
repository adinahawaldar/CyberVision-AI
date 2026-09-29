import express from 'express'
import ProcessingJob from '../models/ProcessingJob.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { caseId, evidenceId, reportId, status, limit = 20 } = req.query
    const filter = {}
    if (caseId) filter.caseId = caseId
    if (evidenceId) filter.evidenceId = evidenceId
    if (reportId) filter.reportId = reportId
    if (status) filter.status = status
    if (req.user && req.user.role !== 'admin') filter.requestedBy = req.user.id

    const jobs = await ProcessingJob.find(filter)
      .sort('-createdAt')
      .limit(parseInt(limit, 10))
      .lean()

    res.json({ jobs })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const job = await ProcessingJob.findById(req.params.id).lean()
    if (!job) return res.status(404).json({ error: 'Job not found' })
    if (req.user && req.user.role !== 'admin' && job.requestedBy?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this job' })
    }
    res.json(job)
  } catch (err) {
    next(err)
  }
})

export default router
