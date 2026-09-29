import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'case_created', 'case_updated', 'case_closed',
      'case_shared', 'case_share_revoked', 'case_chat_queried',
      'evidence_uploaded', 'evidence_parsed', 'evidence_verified',
      'evidence_processing_queued', 'evidence_processing_started', 'evidence_processing_completed',
      'evidence_hash_check', 'evidence_deleted',
      'report_generated', 'report_edited', 'report_reviewed',
      'report_approved', 'report_exported',
      'ai_summary_generated', 'ai_findings_generated', 'ai_section_generated',
      'user_login', 'user_login_2fa', 'user_logout', 'user_created',
      'settings_changed', 'security_updated',
      'passkey_registered', 'passkey_removed',
      'migration_run',
    ],
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: 'System' },
  entityType: {
    type: String,
    enum: ['case', 'evidence', 'report', 'user', 'system'],
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true })

auditLogSchema.index({ entityType: 1, entityId: 1 })
auditLogSchema.index({ userId: 1 })
auditLogSchema.index({ createdAt: -1 })

export default mongoose.model('AuditLog', auditLogSchema)
