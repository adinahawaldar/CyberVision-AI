import mongoose from 'mongoose'

const processingJobSchema = new mongoose.Schema({
  queueJobId: { type: String, required: true, index: true },
  queueName: { type: String, required: true, index: true },
  type: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'retrying'],
    default: 'queued',
    index: true,
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  message: { type: String, default: '' },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  evidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attempts: { type: Number, default: 0 },
  error: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true })

processingJobSchema.index({ caseId: 1, createdAt: -1 })
processingJobSchema.index({ evidenceId: 1, createdAt: -1 })
processingJobSchema.index({ reportId: 1, createdAt: -1 })

export default mongoose.model('ProcessingJob', processingJobSchema)
