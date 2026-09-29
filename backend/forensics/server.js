import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import casesRouter from './routes/cases.js'
import evidenceRouter from './routes/evidence.js'
import reportsRouter from './routes/reports.js'
import aiRouter from './routes/ai.js'
import authRouter from './routes/auth.js'
import timelineRouter from './routes/timeline.js'
import auditRouter from './routes/audit.js'
import dashboardRouter from './routes/dashboard.js'
import settingsRouter from './routes/settings.js'
import jobsRouter from './routes/jobs.js'
import parseRouter from './routes/parse.js'
import anomaliesRouter from './routes/anomalies.js'
import { getEvidenceSecurityStatus } from './utils/fileSecurity.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

function isUsableApiKey(apiKey) {
  if (!apiKey) return false
  const value = String(apiKey).trim()
  if (!value || value.startsWith('••••')) return false
  return !/^your[_-]/i.test(value) && !/api[_-]?key[_-]?here/i.test(value)
}

// Trust proxy for express-rate-limit behind reverse proxy (e.g. Render)
app.set('trust proxy', 1)

// ─── Ensure upload directory exists ───
const uploadDir = process.env.UPLOAD_DIR || './uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}
const evidenceStoreDir = process.env.EVIDENCE_STORE_DIR || './evidence-store'
if (!fs.existsSync(evidenceStoreDir)) {
  fs.mkdirSync(evidenceStoreDir, { recursive: true })
}
const workingDir = process.env.WORKING_DIR || './tmp/processing'
if (!fs.existsSync(workingDir)) {
  fs.mkdirSync(workingDir, { recursive: true })
}

// ─── Security Middleware ───
app.use(helmet())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000','https://forensicai-app.vercel.app'],
  credentials: true,
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

// ─── Body Parsing ───
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Logging ───
app.use(morgan('dev'))

// ─── Serve uploads as static ───
// Evidence files are not exposed as public static assets. Access must go
// through authenticated routes/jobs so artifacts remain auditable.

// ─── API Routes ───
app.use('/api/auth', authRouter)
app.use('/api/cases', casesRouter)
app.use('/api/evidence', evidenceRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/ai', aiRouter)
app.use('/api/timeline', timelineRouter)
app.use('/api/audit', auditRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/parse', parseRouter)
app.use('/api/anomalies', anomaliesRouter)

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'ForensicAI Server',
    version: '1.0.2',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    threatIntel: {
      abuseIpDbConfigured: isUsableApiKey(process.env.ABUSEIPDB_API_KEY),
      virusTotalConfigured: isUsableApiKey(process.env.VIRUSTOTAL_API_KEY),
    },
    jobs: {
      queueProvider: 'BullMQ',
      redisConfigured: !!(process.env.REDIS_URL || process.env.REDIS_HOST),
    },
    evidenceSecurity: getEvidenceSecurityStatus(),
  })
})

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message)
  console.error(err.stack)

  // MongoDB disconnected / topology errors
  if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoServerSelectionError'
    || err.name === 'MongoNetworkError' || err.name === 'MongoNotConnectedError'
    || err.message?.includes('Client must be connected') || err.message?.includes('buffering timed out')) {
    return res.status(503).json({ error: 'Database not connected. Please try again later.' })
  }

  if (err.name === 'ValidationError') {
    // Show field-level details from Mongoose validation
    const details = err.errors
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message
    return res.status(400).json({ error: `Validation error: ${details}` })
  }
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' })
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

// ─── Database Connection & Server Start ───
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/forensicai'
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    app.listen(PORT, () => {
      console.log(`🚀 ForensicAI Server running on port ${PORT}`)
      console.log(`📡 API: http://localhost:${PORT}/api`)
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message)
    console.log('⚠️  Starting server without database connection...')

    app.listen(PORT, () => {
      console.log(`🚀 ForensicAI Server running on port ${PORT} (no database)`)
    })
  }
}

startServer()

export default app
