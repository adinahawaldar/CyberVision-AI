import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['investigator', 'analyst', 'admin', 'viewer'],
    default: 'investigator',
  },
  isEmailVerified: { type: Boolean, default: true },
  emailVerificationCode: { type: String },
  emailVerificationExpires: { type: Date },
  organization: { type: String, default: '' },
  settings: {
    theme: { type: String, default: 'dark' },
    // AI Engine
    aiProvider: { type: String, default: 'mistral' },
    aiModel: { type: String, default: 'mistral-small-latest' },
    aiApiKey: { type: String, default: '' },
    aiTemperature: { type: Number, default: 0.3, min: 0, max: 1 },
    aiMaxTokens: { type: Number, default: 2048 },
    aiTone: { type: String, default: 'neutral' },
    aiAutoGenerate: { type: Boolean, default: false },
    aiRequireApproval: { type: Boolean, default: true },
    // Threat Intelligence
    abuseIpDbApiKey: { type: String, default: '' },
    virusTotalApiKey: { type: String, default: '' },
    threatSeverityThreshold: { type: Number, default: 50, min: 0, max: 100 },
    // RAG Context
    ragContextLimit: { type: Number, default: 25, min: 5, max: 100 },
    // Security
    twoFactorEnabled: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 },
    // Notifications
    notifCaseUpdates: { type: Boolean, default: true },
    notifEvidenceProcessing: { type: Boolean, default: true },
    notifAiReports: { type: Boolean, default: true },
    notifIntegrityAlerts: { type: Boolean, default: true },
    notifSecurityEvents: { type: Boolean, default: false },
    notifMaintenance: { type: Boolean, default: false },
  },
  passkeys: [{
    credentialId: { type: String, required: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    transports: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

userSchema.index({ email: 1 })

export default mongoose.model('User', userSchema)
