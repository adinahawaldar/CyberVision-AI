import express from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { computeFileHash } from '../utils/hash.js'
import { parseLogFile } from '../utils/parser.js'
import { detectAttackAlerts } from '../analysis/correlationEngine.js'
import { detectEventAnomalies } from '../ml/anomalyDetector.js'
import { removeFileQuietly } from '../utils/fileSecurity.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

const router = express.Router()

const parseableExts = new Set(['.log', '.txt', '.csv', '.json', '.xml', '.reg', '.pcap', '.evtx'])

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads')
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (parseableExts.has(ext)) return cb(null, true)
    cb(new Error(`File type ${ext} not parseable. Allowed: ${[...parseableExts].join(', ')}`), false)
  },
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120', 10) },
})

router.post('/', optionalAuth, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 10 },
]), async (req, res, next) => {
  const uploadedFiles = [
    ...(req.files?.file || []),
    ...(req.files?.files || []),
  ]

  try {
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'Upload a file using form field "file" or "files".' })
    }

    const results = []
    const maxRecords = parseInt(req.query.limit || req.body?.limit || process.env.PARSER_MAX_RECORDS || '5000', 10)
    for (const file of uploadedFiles) {
      const sha256Hash = await computeFileHash(file.path)
      const parsed = await parseLogFile(file.path, { originalName: file.originalname, maxRecords })
      const mlResult = await detectEventAnomalies(parsed.events)
      const attackAlerts = detectAttackAlerts(mlResult.events)

      results.push({
        originalName: file.originalname,
        size: file.size,
        sha256Hash,
        artifactType: parsed.artifactType,
        parser: parsed.parser,
        normalizer: parsed.normalizer,
        parsedCount: parsed.parsedCount,
        summary: parsed.summary,
        warnings: parsed.warnings || [],
        mlSummary: mlResult.mlSummary,
        mlAnomalies: mlResult.mlAnomalies,
        attackAlerts,
        events: mlResult.events,
      })

      await logAudit('evidence_parsed', 'system', null,
        `Direct parse API parsed "${file.originalname}" with ${parsed.parser}`, req)
    }

    res.json({
      count: results.length,
      files: results,
    })
  } catch (err) {
    next(err)
  } finally {
    await Promise.all(uploadedFiles.map(file => removeFileQuietly(file.path)))
  }
})

export default router
