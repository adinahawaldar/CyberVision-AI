import mongoose from 'mongoose'

const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'active', 'review', 'closed', 'archived'],
    default: 'draft',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigneeName: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
  tags: [{ type: String }],
  notes: { type: String, default: '' },
  closedAt: { type: Date },
}, { timestamps: true })

caseSchema.index({ caseNumber: 1 })
caseSchema.index({ status: 1 })
caseSchema.index({ createdAt: -1 })

// Auto-generate case number before saving
caseSchema.pre('save', async function (next) {
  if (this.isNew && !this.caseNumber) {
    const year = new Date().getFullYear()
    const prefix = `FR-${year}-`
    
    // Find the case with the highest caseNumber starting with prefix
    const latestCase = await mongoose.model('Case').findOne(
      { caseNumber: new RegExp('^' + prefix) },
      { caseNumber: 1 },
      { sort: { caseNumber: -1 } }
    ).lean()
    
    let nextNum = 1
    if (latestCase && latestCase.caseNumber) {
      const parts = latestCase.caseNumber.split('-')
      const lastSeq = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1
      }
    }
    
    let unique = false
    while (!unique) {
      const candidate = `${prefix}${String(nextNum).padStart(4, '0')}`
      const existing = await mongoose.model('Case').findOne({ caseNumber: candidate }, { _id: 1 }).lean()
      if (!existing) {
        this.caseNumber = candidate
        unique = true
      } else {
        nextNum++
      }
    }
  }
  next()
})

export default mongoose.model('Case', caseSchema)
