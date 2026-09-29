import express from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import Evidence from '../models/Evidence.js'
import Case from '../models/Case.js'
import User from '../models/User.js'
import { computeFileHash } from '../utils/hash.js'
import { withPlaintextEvidence } from '../utils/fileSecurity.js'
import { enqueueEvidenceProcessing } from '../jobs/enqueue.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

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

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.log', '.txt', '.csv', '.json', '.xml', '.reg', '.pcap', '.evtx', '.img', '.dd', '.raw', '.zip', '.gz']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowedExts.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed: ${allowedExts.join(', ')}`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120', 10) },
})

router.post('/upload', optionalAuth, upload.array('files', 10), async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot upload evidence' })
    }

    const { caseId } = req.body
    if (!caseId) return res.status(400).json({ error: 'caseId is required' })

    const caseDoc = await Case.findById(caseId)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    if (reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    const results = []
    const jobs = []

    for (const file of req.files) {
      const evidence = await Evidence.create({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath: file.path,
        caseId,
        status: 'queued',
        uploadedBy: reqUser?.id,
        metadata: {
          fileType: path.extname(file.originalname).replace('.', ''),
        },
        processing: {
          progress: 0,
          message: 'Processing evidence...',
        },
      })

      caseDoc.evidence.push(evidence._id)

      // Try BullMQ first; fall back to synchronous inline processing
      let queued = false
      try {
        const jobPromise = enqueueEvidenceProcessing({
          evidenceId: evidence._id,
          caseId: caseDoc._id,
          requestedBy: reqUser?.id,
          reason: 'upload',
        })
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Queue timeout')), 2000))
        const job = await Promise.race([jobPromise, timeoutPromise])
        evidence.processing.queueJobId = String(job.id)
        evidence.processing.message = 'Queued for background processing'
        await evidence.save()
        jobs.push({ evidenceId: evidence._id, jobId: String(job.id) })
        queued = true
      } catch (queueErr) {
        console.warn(`BullMQ unavailable, processing "${file.originalname}" inline:`, queueErr.message)
      }

      // Synchronous fallback: parse + hash + enrich directly
      if (!queued) {
        try {
          const { computeFileHash } = await import('../utils/hash.js')
          const { parseLogFile } = await import('../utils/parser.js')
          const { detectEventAnomalies } = await import('../ml/anomalyDetector.js')

          // 1. SHA-256 hash
          evidence.status = 'hashing'
          await evidence.save()
          const sha256Hash = await computeFileHash(file.path)
          evidence.sha256Hash = sha256Hash
          evidence.verifiedAt = new Date()

          // 2. Parse & normalize
          const ext = path.extname(file.originalname).toLowerCase()
          const PARSEABLE = new Set(['.log', '.txt', '.csv', '.json', '.xml', '.evtx', '.pcap', '.reg'])

          if (PARSEABLE.has(ext)) {
            evidence.status = 'parsing'
            await evidence.save()
            const parsedResult = await parseLogFile(file.path, { originalName: file.originalname })

            // 3. ML anomaly detection
            const mlResult = await detectEventAnomalies(parsedResult.events)

            evidence.parsedData = {
              events: mlResult.events.map(e => ({
                timestamp: e.timestamp || '',
                eventType: e.eventType || 'system',
                source: e.source || file.originalname,
                sourceType: e.sourceType || '',
                host: e.host || '',
                user: e.user || '',
                sourceIp: e.sourceIp || '',
                destinationIp: e.destinationIp || '',
                process: e.process || '',
                filePath: e.filePath || '',
                registryKey: e.registryKey || '',
                registryValue: e.registryValue || '',
                detail: e.detail || '',
                severity: e.severity || 'info',
                raw: e.raw || '',
                normalized: e.normalized !== false,
                parserType: e.parserType || parsedResult.parser,
                normalizerType: e.normalizerType || parsedResult.normalizer,
                riskScore: e.riskScore || 0,
                riskLevel: e.riskLevel || 'low',
                riskReasons: e.riskReasons || [],
                mlAnomaly: e.mlAnomaly || { isAnomaly: false, score: 0, confidence: 0, model: 'IsolationForest', reasons: [] },
                threatIntel: e.threatIntel || { score: 0, isMalicious: false, details: '' },
                mitreAttack: e.mitreAttack || { techniqueId: '', techniqueName: '', tactic: '' },
              })),
              summary: parsedResult.summary,
              anomalies: mlResult.events
                .filter(e => e.severity === 'danger' || e.severity === 'critical' || (e.riskScore || 0) >= 61)
                .map(e => e.detail),
              mlSummary: {
                ...mlResult.mlSummary,
                generatedAt: mlResult.mlSummary?.generatedAt ? new Date(mlResult.mlSummary.generatedAt) : new Date(),
              },
              mlAnomalies: mlResult.mlAnomalies,
            }

            evidence.metadata.lineCount = parsedResult.lineCount
            evidence.processing.parserType = parsedResult.parser
            evidence.processing.normalizerType = parsedResult.normalizer
            evidence.processing.artifactType = parsedResult.artifactType
            evidence.processing.normalizedAt = new Date()
            evidence.status = parsedResult.events.length > 0 ? 'parsed' : 'verified'
          } else {
            evidence.status = 'verified'
            evidence.parsedData = { events: [], summary: 'Binary artifact stored securely.', anomalies: [] }
          }

          evidence.processing.progress = 100
          evidence.processing.message = 'Processing complete'
          await evidence.save()
          jobs.push({ evidenceId: evidence._id, mode: 'inline' })
        } catch (processErr) {
          console.error(`Inline processing failed for "${file.originalname}":`, processErr.message)
          evidence.status = 'error'
          evidence.processing.lastError = processErr.message
          evidence.processing.message = 'Processing failed'
          await evidence.save()
        }
      }

      await logAudit('evidence_uploaded', 'evidence', evidence._id,
        `Evidence "${file.originalname}" uploaded and processed`, req)

      results.push(evidence)
    }

    await caseDoc.save()

    res.status(201).json({
      message: `${results.length} evidence file(s) uploaded and processed`,
      evidence: results,
      jobs,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/evidence?caseId=xxx — List evidence for a case
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { caseId, limit = 50 } = req.query
    if (!caseId) return res.status(400).json({ error: 'caseId query parameter is required' })

    const evidenceList = await Evidence.find({ caseId })
      .sort('-createdAt')
      .limit(parseInt(limit))
      .select('-parsedData.events.raw') // skip heavy raw field for listing
      .lean()

    res.json({ evidence: evidenceList })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const evidence = await Evidence.findById(req.params.id)
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' })
    res.json(evidence)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/evidence/:id — Remove evidence file and record
router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot delete evidence' })
    }

    const evidence = await Evidence.findById(req.params.id)
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' })

    const caseDoc = await Case.findById(evidence.caseId)
    if (caseDoc && reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    // Remove file from disk
    if (evidence.filePath) {
      const fs = await import('fs')
      try { fs.unlinkSync(evidence.filePath) } catch {}
    }

    // Remove from case's evidence array
    if (caseDoc) {
      caseDoc.evidence = caseDoc.evidence.filter(id => id.toString() !== evidence._id.toString())
      await caseDoc.save()
    }

    const name = evidence.originalName || evidence.filename
    await Evidence.findByIdAndDelete(req.params.id)

    await logAudit('evidence_deleted', 'evidence', req.params.id,
      `Evidence "${name}" deleted`, req)

    res.json({ message: `Evidence "${name}" deleted successfully` })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/parse', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot parse evidence' })
    }

    const evidence = await Evidence.findById(req.params.id)
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' })

    const caseDoc = await Case.findById(evidence.caseId)
    if (caseDoc && reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    // Try BullMQ first, fall back to inline
    let queued = false
    try {
      const jobPromise = enqueueEvidenceProcessing({
        evidenceId: evidence._id,
        caseId: evidence.caseId,
        requestedBy: reqUser?.id,
        reason: 'manual_parse',
      })
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Queue timeout')), 2000))
      const job = await Promise.race([jobPromise, timeoutPromise])
      evidence.status = 'queued'
      evidence.processing.queueJobId = String(job.id)
      evidence.processing.progress = 0
      evidence.processing.message = 'Manual parse queued'
      evidence.processing.lastError = ''
      await evidence.save()
      queued = true

      return res.status(202).json({
        message: 'Evidence processing job queued',
        evidenceId: evidence._id,
        jobId: String(job.id),
      })
    } catch (queueErr) {
      console.warn('BullMQ unavailable for re-parse, processing inline:', queueErr.message)
    }

    // Sync fallback
    if (!queued) {
      const { computeFileHash } = await import('../utils/hash.js')
      const { parseLogFile } = await import('../utils/parser.js')
      const { detectEventAnomalies } = await import('../ml/anomalyDetector.js')

      if (!evidence.sha256Hash && evidence.filePath) {
        try {
          evidence.sha256Hash = await computeFileHash(evidence.filePath)
          evidence.verifiedAt = new Date()
        } catch {}
      }

      const ext = path.extname(evidence.originalName || '').toLowerCase()
      const PARSEABLE = new Set(['.log', '.txt', '.csv', '.json', '.xml', '.evtx', '.pcap', '.reg'])

      if (PARSEABLE.has(ext) && evidence.filePath) {
        evidence.status = 'parsing'
        await evidence.save()

        const filePath = evidence.filePath
        const parsedResult = await parseLogFile(filePath, { originalName: evidence.originalName })
        const mlResult = await detectEventAnomalies(parsedResult.events)

        evidence.parsedData = {
          events: mlResult.events.map(e => ({
            timestamp: e.timestamp || '', eventType: e.eventType || 'system',
            source: e.source || evidence.originalName, sourceType: e.sourceType || '',
            host: e.host || '', user: e.user || '', sourceIp: e.sourceIp || '',
            destinationIp: e.destinationIp || '', process: e.process || '',
            filePath: e.filePath || '', registryKey: e.registryKey || '',
            registryValue: e.registryValue || '', detail: e.detail || '',
            severity: e.severity || 'info', raw: e.raw || '',
            normalized: e.normalized !== false,
            parserType: e.parserType || parsedResult.parser,
            normalizerType: e.normalizerType || parsedResult.normalizer,
            riskScore: e.riskScore || 0, riskLevel: e.riskLevel || 'low',
            riskReasons: e.riskReasons || [],
            mlAnomaly: e.mlAnomaly || { isAnomaly: false, score: 0, confidence: 0, model: 'IsolationForest', reasons: [] },
            threatIntel: e.threatIntel || { score: 0, isMalicious: false, details: '' },
            mitreAttack: e.mitreAttack || { techniqueId: '', techniqueName: '', tactic: '' },
          })),
          summary: parsedResult.summary,
          anomalies: mlResult.events
            .filter(e => e.severity === 'danger' || e.severity === 'critical' || (e.riskScore || 0) >= 61)
            .map(e => e.detail),
          mlSummary: { ...mlResult.mlSummary, generatedAt: new Date() },
          mlAnomalies: mlResult.mlAnomalies,
        }

        evidence.metadata.lineCount = parsedResult.lineCount
        evidence.processing.parserType = parsedResult.parser
        evidence.processing.normalizerType = parsedResult.normalizer
        evidence.processing.artifactType = parsedResult.artifactType
        evidence.processing.normalizedAt = new Date()
        evidence.status = parsedResult.events.length > 0 ? 'parsed' : 'verified'
      } else {
        evidence.status = 'verified'
      }

      evidence.processing.progress = 100
      evidence.processing.message = 'Re-processing complete'
      evidence.processing.lastError = ''
      await evidence.save()

      return res.json({
        message: 'Evidence re-processed successfully',
        evidenceId: evidence._id,
        status: evidence.status,
        events: evidence.parsedData?.events?.length || 0,
      })
    }
  } catch (err) {
    next(err)
  }
})

router.post('/:id/verify', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot verify evidence' })
    }

    const evidence = await Evidence.findById(req.params.id)
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' })

    const caseDoc = await Case.findById(evidence.caseId)
    if (caseDoc && reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    if (!evidence.sha256Hash) {
      return res.status(409).json({ error: 'Evidence hash is not available yet. Wait for the processing job to complete.' })
    }

    const computedHash = await withPlaintextEvidence(evidence, plainPath => computeFileHash(plainPath))
    const result = {
      match: computedHash === evidence.sha256Hash,
      computedHash,
      expectedHash: evidence.sha256Hash,
    }

    evidence.hashVerifications.push({
      verifiedAt: new Date(),
      verifiedBy: req.user?.name || 'System',
      result: result.match ? 'match' : 'mismatch',
    })

    await evidence.save()

    await logAudit('evidence_hash_check', 'evidence', evidence._id,
      `Hash verification: ${result.match ? 'MATCH' : 'MISMATCH'}`, req)

    res.json({
      match: result.match,
      computedHash: result.computedHash,
      storedHash: result.expectedHash,
      verifiedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/parse-all/:caseId', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot re-parse evidence' })
    }

    const caseDoc = await Case.findById(req.params.caseId)
    if (caseDoc && reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    const evidenceList = await Evidence.find({ caseId: req.params.caseId })
    if (evidenceList.length === 0) {
      return res.json({ message: 'No evidence found for this case', queued: 0 })
    }

    const results = []

    for (const evidence of evidenceList) {
      const job = await enqueueEvidenceProcessing({
        evidenceId: evidence._id,
        caseId: evidence.caseId,
        requestedBy: reqUser?.id,
        reason: 'parse_all',
      })

      evidence.status = 'queued'
      evidence.processing.queueJobId = String(job.id)
      evidence.processing.progress = 0
      evidence.processing.message = 'Bulk re-processing queued'
      evidence.processing.lastError = ''
      await evidence.save()

      results.push({ file: evidence.originalName, status: 'queued', jobId: String(job.id) })
    }

    res.status(202).json({
      message: `Queued ${results.length} evidence processing job(s)`,
      queued: results.length,
      results,
    })
  } catch (err) {
    next(err)
  }
})

export default router
