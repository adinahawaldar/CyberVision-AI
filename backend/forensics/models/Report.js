import mongoose from 'mongoose'

const reportSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  order: { type: Number, required: true },
  aiGenerated: { type: Boolean, default: false },
  confidence: { type: Number, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['empty', 'draft', 'reviewed', 'approved', 'needs-review', 'regenerating', 'active'],
    default: 'empty',
  },
  editHistory: [{
    editedBy: { type: String },
    editedAt: { type: Date, default: Date.now },
    previousContent: { type: String },
  }],
})

const reportSchema = new mongoose.Schema({
  reportNumber: { type: String, required: true, unique: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  title: { type: String, required: true },
  sections: [reportSectionSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'review', 'final', 'exported'],
    default: 'draft',
  },
  generatedBy: { type: String, default: 'AI + Human' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedByName: { type: String },
  approvedAt: { type: Date },
  exportedAt: { type: Date },
  exportPath: { type: String },
  overallConfidence: { type: Number, min: 0, max: 100 },
  metadata: {
    totalSections: { type: Number },
    reviewedSections: { type: Number },
    aiGeneratedSections: { type: Number },
    wordCount: { type: Number },
  },
  finalProductSecurity: {
    sha256Hash: { type: String, default: '' },
    hashAlgorithm: { type: String, default: 'SHA-256' },
    format: { type: String, default: '' },
    classification: { type: String, default: 'Confidential' },
    watermark: { type: String, default: 'CONFIDENTIAL - FOR AUTHORIZED PERSONNEL ONLY' },
    version: { type: String, default: '1.0' },
    immutable: { type: Boolean, default: false },
    signedBy: { type: String, default: '' },
    signatureMethod: { type: String, default: '' },
    securedAt: { type: Date },
  },
}, { timestamps: true })

reportSchema.index({ caseId: 1 })
reportSchema.index({ status: 1 })
reportSchema.index({ reportNumber: 1 })

// Compute overall confidence from sections
reportSchema.pre('save', function (next) {
  if (this.sections && this.sections.length > 0) {
    const aiSections = this.sections.filter(s => s.aiGenerated && s.confidence != null)
    if (aiSections.length > 0) {
      this.overallConfidence = Math.round(
        aiSections.reduce((sum, s) => sum + s.confidence, 0) / aiSections.length
      )
    }
    this.metadata = {
      totalSections: this.sections.length,
      reviewedSections: this.sections.filter(s => s.status === 'reviewed' || s.status === 'approved').length,
      aiGeneratedSections: this.sections.filter(s => s.aiGenerated).length,
      wordCount: this.sections.reduce((sum, s) => sum + (s.content || '').split(/\s+/).length, 0),
    }
  }
  next()
})

export default mongoose.model('Report', reportSchema)
