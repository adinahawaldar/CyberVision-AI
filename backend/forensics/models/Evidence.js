import mongoose from 'mongoose'

const evidenceSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  size: { type: Number, required: true },
  sha256Hash: { type: String, default: '' },
  filePath: { type: String, required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  status: {
    type: String,
    enum: ['uploading', 'queued', 'hashing', 'encrypted', 'verified', 'parsing', 'parsed', 'error'],
    default: 'queued',
  },
  storage: {
    provider: { type: String, default: 'local' },
    encryptedPath: { type: String, default: '' },
    algorithm: { type: String, default: '' },
    iv: { type: String, default: '' },
    authTag: { type: String, default: '' },
    keyId: { type: String, default: '' },
    isEncrypted: { type: Boolean, default: false },
  },
  processing: {
    queueJobId: { type: String, default: '' },
    progress: { type: Number, default: 0 },
    message: { type: String, default: '' },
    parserType: { type: String, default: '' },
    normalizerType: { type: String, default: '' },
    artifactType: { type: String, default: '' },
    normalizedAt: { type: Date },
    lastError: { type: String, default: '' },
  },
  metadata: {
    fileType: { type: String },
    encoding: { type: String },
    lineCount: { type: Number },
    dateRange: {
      start: { type: Date },
      end: { type: Date },
    },
  },
  parsedData: {
    events: [{
      timestamp: { type: String },
      eventType: { type: String },
      source: { type: String },
      sourceType: { type: String },
      host: { type: String },
      user: { type: String },
      sourceIp: { type: String },
      destinationIp: { type: String },
      process: { type: String },
      filePath: { type: String },
      registryKey: { type: String },
      registryValue: { type: String },
      detail: { type: String },
      severity: { type: String, enum: ['info', 'warning', 'danger', 'critical'] },
      raw: { type: String },
      normalized: { type: Boolean, default: true },
      parserType: { type: String },
      normalizerType: { type: String },
      riskScore: { type: Number, default: 0 },
      riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
      riskReasons: [{ type: String }],
      mlAnomaly: {
        isAnomaly: { type: Boolean, default: false },
        score: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        model: { type: String, default: '' },
        reasons: [{ type: String }],
      },
      threatIntel: {
        score: { type: Number, default: 0 },
        isMalicious: { type: Boolean, default: false },
        details: { type: String, default: '' }
      },
      mitreAttack: {
        techniqueId: { type: String, default: '' },
        techniqueName: { type: String, default: '' },
        tactic: { type: String, default: '' }
      }
    }],
    summary: { type: String },
    anomalies: [{ type: String }],
    mlSummary: {
      model: { type: String, default: '' },
      status: { type: String, default: '' },
      totalEvents: { type: Number, default: 0 },
      anomaliesDetected: { type: Number, default: 0 },
      contamination: { type: Number, default: 0 },
      generatedAt: { type: Date },
      error: { type: String, default: '' },
    },
    mlAnomalies: [{
      timestamp: { type: String, default: '' },
      eventType: { type: String, default: 'system' },
      source: { type: String, default: '' },
      sourceType: { type: String, default: '' },
      host: { type: String, default: '' },
      user: { type: String, default: '' },
      sourceIp: { type: String, default: '' },
      destinationIp: { type: String, default: '' },
      detail: { type: String, default: '' },
      severity: { type: String, enum: ['info', 'warning', 'danger', 'critical'], default: 'info' },
      riskScore: { type: Number, default: 0 },
      riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
      mlScore: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      reasons: [{ type: String }],
      evidenceName: { type: String, default: '' },
      mitreAttack: {
        techniqueId: { type: String, default: '' },
        techniqueName: { type: String, default: '' },
        tactic: { type: String, default: '' }
      }
    }],
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  hashVerifications: [{
    verifiedAt: { type: Date, default: Date.now },
    verifiedBy: { type: String },
    result: { type: String, enum: ['match', 'mismatch'] },
  }],
}, { timestamps: true })

evidenceSchema.index({ caseId: 1 })
evidenceSchema.index({ sha256Hash: 1 })
evidenceSchema.index({ status: 1 })

export default mongoose.model('Evidence', evidenceSchema)
