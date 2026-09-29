import express from 'express'
import mongoose from 'mongoose'
import PDFDocument from 'pdfkit'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import Report from '../models/Report.js'
import Case from '../models/Case.js'
import Evidence from '../models/Evidence.js'
import User from '../models/User.js'
import { generateSummary, generateFindings, generateReportSection } from '../services/aiService.js'
import { buildTimeline } from '../utils/parser.js'
import { detectAttackAlerts } from '../analysis/correlationEngine.js'
import { detectEventAnomalies } from '../ml/anomalyDetector.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

const router = express.Router()

// ─── Access helpers ────────────────────────────────────────────────────────────
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

async function getAccessibleCaseIds(userId, role) {
  if (role === 'admin') {
    const all = await Case.find({}, '_id').lean()
    return all.map(c => c._id)
  }
  let uid
  try { uid = new mongoose.Types.ObjectId(userId) } catch { uid = userId }
  const cases = await Case.find({
    $or: [{ createdBy: uid }, { sharedWith: uid }],
  }, '_id').lean()
  return cases.map(c => c._id)
}

// GET /api/reports — List reports for cases accessible to current user
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    const { status, caseId, page = 1, limit = 20 } = req.query
    const filter = {}
    if (status && status !== 'all') filter.status = status

    if (caseId) {
      // If specific caseId requested, verify access first
      if (reqUser) {
        const caseDoc = await Case.findById(caseId)
        if (caseDoc && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
          return res.status(403).json({ error: 'Access denied to this case' })
        }
      }
      filter.caseId = caseId
    } else if (reqUser) {
      // Scope to accessible cases
      const accessibleIds = await getAccessibleCaseIds(reqUser.id, reqUser.role)
      filter.caseId = { $in: accessibleIds }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Report.countDocuments(filter)
    const reports = await Report.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    res.json({ reports, pagination: { page: parseInt(page), limit: parseInt(limit), total } })
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/:id — Get report detail (access-checked)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    const report = await Report.findById(req.params.id).populate('caseId')
    if (!report) return res.status(404).json({ error: 'Report not found' })

    if (reqUser && report.caseId) {
      if (!canAccessCase(report.caseId, reqUser.id, reqUser.role)) {
        return res.status(403).json({ error: 'Access denied to this report' })
      }
    }

    res.json(report)
  } catch (err) {
    next(err)
  }
})

// POST /api/reports/generate — Generate report with AI assistance (viewers blocked)
router.post('/generate', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot generate reports' })
    }

    const { caseId } = req.body
    if (!caseId) return res.status(400).json({ error: 'caseId is required' })

    const caseDoc = await Case.findById(caseId)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    // Check case access
    if (reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    // Gather evidence — use .lean() to get plain JS objects (avoids Mongoose subdoc spread issues)
    const evidenceList = await Evidence.find({ caseId, status: { $in: ['verified', 'parsed'] } }).lean()
    const timeline = buildTimeline(evidenceList)
    const attackAlerts = detectAttackAlerts(timeline.events)
    const mlResult = await detectEventAnomalies(timeline.events)

    // Generate AI sections
    const [summaryResult, findingsResult, recommendationsResult] = await Promise.all([
      generateSummary({ case: caseDoc.toObject(), evidenceCount: evidenceList.length, timeline: timeline.events.slice(0, 20), attackAlerts: attackAlerts.slice(0, 10), mlAnomalies: mlResult.mlAnomalies.slice(0, 10) }),
      generateFindings(
        evidenceList.map(e => ({ name: e.originalName, type: e.metadata?.fileType, parsedEvents: e.parsedData?.events?.length || 0, anomalies: e.parsedData?.anomalies || [], mlAnomalies: e.parsedData?.mlAnomalies || [] })),
        { ...timeline, attackAlerts, mlAnomalies: mlResult.mlAnomalies }
      ),
      generateReportSection('recommendations', { case: caseDoc.toObject(), evidenceCount: evidenceList.length, attackAlerts: attackAlerts.slice(0, 10), mlAnomalies: mlResult.mlAnomalies.slice(0, 10) }),
    ])

    // Build evidence inventory section
    const evidenceInventory = evidenceList.map((e, i) =>
      `${i + 1}. ${e.originalName} (${(e.size / 1024).toFixed(1)} KB)\n   SHA-256: ${e.sha256Hash}\n   Status: ${e.status}`
    ).join('\n\n')

    // Build timeline section — formatted markdown table
    let timelineSection = ''
    if (timeline.events.length === 0) {
      timelineSection = 'No timeline events found. Upload and parse evidence files to generate a timeline.'
    } else {
      const timelineRows = timeline.events.slice(0, 30).map(e => {
        const ts = e.timestamp ? String(e.timestamp).trim() : 'Unknown'
        const evType = e.eventType || 'system'
        const src = (e.source || '—').replace(/\|/g, ',')
        // Escape pipes in detail so they don't create extra table columns
        const detail = (e.detail || e.raw || 'Event').replace(/\|/g, ',').replace(/\n/g, ' ')
        return `| ${ts} | ${evType.charAt(0).toUpperCase() + evType.slice(1).replace('_', ' ')} | ${src} | ${detail} |`
      }).join('\n')
      timelineSection = `The timeline of key events spans from **${timeline.events[0]?.timestamp || '?'}** to **${timeline.events[timeline.events.length - 1]?.timestamp || '?'}**. A total of **${timeline.events.length}** events were reconstructed from ${evidenceList.length} evidence file(s).

| Timestamp | Event Type | Source / Module | Observation |
|-----------|------------|-----------------|-------------|
${timelineRows}`
    }

    let attackAlertsSection = ''
    if (attackAlerts.length === 0) {
      attackAlertsSection = 'No multi-event attack correlations were detected from the available parsed evidence.'
    } else {
      const alertRows = attackAlerts.slice(0, 20).map(alert => {
        const safeTitle = alert.title.replace(/\|/g, ',')
        const safeDescription = alert.description.replace(/\|/g, ',').replace(/\n/g, ' ')
        const entities = [
          alert.entities.users.length ? `Users: ${alert.entities.users.join(', ')}` : '',
          alert.entities.sourceIps.length ? `Source IPs: ${alert.entities.sourceIps.join(', ')}` : '',
          alert.entities.hosts.length ? `Hosts: ${alert.entities.hosts.join(', ')}` : '',
        ].filter(Boolean).join('; ') || 'N/A'
        return `| ${alert.severity.toUpperCase()} | ${alert.riskScore} | ${safeTitle} | ${alert.mitreAttack.techniqueId} | ${entities.replace(/\|/g, ',')} | ${safeDescription} |`
      }).join('\n')
      attackAlertsSection = `The following attack-level alerts were produced by deterministic correlation rules over the reconstructed timeline:

| Severity | Risk | Alert | MITRE | Entities | Correlation Basis |
|---|---:|---|---|---|---|
${alertRows}`
    }

    let mlAnomalySection = ''
    if (mlResult.mlAnomalies.length === 0) {
      mlAnomalySection = `Isolation Forest anomaly detection completed with no anomalous events flagged. Model status: ${mlResult.mlSummary.status || 'completed'}.`
    } else {
      const anomalyRows = mlResult.mlAnomalies.slice(0, 20).map(item => {
        const safeDetail = (item.detail || '').replace(/\|/g, ',').replace(/\n/g, ' ')
        const reasons = (item.reasons || []).join('; ').replace(/\|/g, ',')
        return `| ${item.timestamp || 'Unknown'} | ${item.mlScore} | ${item.eventType} | ${item.source || 'N/A'} | ${safeDetail} | ${reasons || 'Model outlier'} |`
      }).join('\n')
      mlAnomalySection = `Isolation Forest detected ${mlResult.mlAnomalies.length} anomalous event(s) from ${mlResult.mlSummary.totalEvents || timeline.events.length} normalized event(s). These results are unsupervised ML signals and require investigator review.

| Timestamp | ML Score | Event Type | Source | Observation | Model Reasons |
|---|---:|---|---|---|---|
${anomalyRows}`
    }

    // Aggregate Threat Indicators (IOCs)
    const iocMap = new Map() // indicator -> { type, score, details, count }
    for (const event of timeline.events) {
      const ips = (event.detail || event.raw || '').match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || []
      const hashes = (event.detail || event.raw || '').match(/\b[a-fA-F0-9]{32}\b|\b[a-fA-F0-9]{64}\b/g) || []

      const score = event.threatIntel?.score || 0
      const isMalicious = event.threatIntel?.isMalicious || false
      const details = event.threatIntel?.details || 'Detected in logs'

      if (score > 0 || isMalicious) {
        const indicators = [...new Set([...ips, ...hashes])]
        for (const ind of indicators) {
          const isIp = ips.includes(ind)
          if (iocMap.has(ind)) {
            const current = iocMap.get(ind)
            current.count++
            if (score > current.score) {
              current.score = score
              current.details = details
            }
          } else {
            iocMap.set(ind, {
              type: isIp ? 'IP Address' : 'Cryptographic Hash',
              score,
              details,
              count: 1
            })
          }
        }
      }
    }

    let iocsSection = ''
    if (iocMap.size === 0) {
      iocsSection = 'No malicious indicators of compromise (IOCs) were flagged in the threat intelligence databases during log analysis.'
    } else {
      const iocRows = Array.from(iocMap.entries()).map(([indicator, info]) => {
        const safeDetails = info.details.replace(/\|/g, ',').replace(/\n/g, ' ')
        return `| \`${indicator}\` | ${info.type} | ${info.score} / 100 | ${safeDetails} | ${info.count} |`
      }).join('\n')
      iocsSection = `The following high-risk Indicators of Compromise (IOCs) were identified in the logs and verified against Threat Intelligence databases:

| Indicator (IOC) | Type | Threat Score | Details / Reputation | Occurrences |
|---|---|---|---|---|
${iocRows}`
    }

    // Aggregate MITRE ATT&CK Matrix
    const mitreMap = new Map() // techniqueId -> { tactic, name, count }
    for (const event of timeline.events) {
      if (event.mitreAttack && event.mitreAttack.techniqueId) {
        const { techniqueId, techniqueName, tactic } = event.mitreAttack
        if (mitreMap.has(techniqueId)) {
          mitreMap.get(techniqueId).count++
        } else {
          mitreMap.set(techniqueId, {
            tactic: tactic || 'Unknown Tactic',
            name: techniqueName || 'Unknown Technique',
            count: 1
          })
        }
      }
    }

    let mitreSection = ''
    if (mitreMap.size === 0) {
      mitreSection = 'No MITRE ATT&CK techniques were mapped from the analyzed evidence files.'
    } else {
      const mitreRows = Array.from(mitreMap.entries()).map(([techId, info]) => {
        const safeTactic = info.tactic.replace(/\|/g, ',').replace(/\n/g, ' ')
        const safeName = info.name.replace(/\|/g, ',').replace(/\n/g, ' ')
        return `| ${safeTactic} | ${techId} | ${safeName} | ${info.count} |`
      }).join('\n')
      mitreSection = `The following MITRE ATT&CK techniques were mapped from the analyzed log events:

| Tactic | Technique ID | Technique Name | Detections |
|---|---|---|---|
${mitreRows}`
    }

    // Create report number
    const reportCount = await Report.countDocuments({ caseId })
    const reportNumber = `${caseDoc.caseNumber}-R${reportCount + 1}`

    const report = await Report.create({
      reportNumber,
      caseId,
      title: `${caseDoc.title} — Investigation Report`,
      status: 'draft',
      generatedBy: 'AI + Human',
      sections: [
        { title: 'Executive Summary', content: summaryResult.content, order: 1, aiGenerated: true, confidence: summaryResult.confidence, status: 'draft' },
        { title: 'Evidence Inventory', content: evidenceInventory, order: 2, aiGenerated: false, confidence: 100, status: 'draft' },
        { title: 'Timeline of Events', content: timelineSection || 'No events found. Upload and parse evidence to generate timeline.', order: 3, aiGenerated: true, confidence: 85, status: 'draft' },
        { title: 'Key Findings', content: findingsResult.content, order: 4, aiGenerated: true, confidence: findingsResult.confidence, status: 'needs-review' },
        { title: 'Correlated Attack Alerts', content: attackAlertsSection, order: 5, aiGenerated: false, confidence: 100, status: attackAlerts.length ? 'needs-review' : 'draft' },
        { title: 'ML Anomaly Detection', content: mlAnomalySection, order: 6, aiGenerated: false, confidence: 100, status: mlResult.mlAnomalies.length ? 'needs-review' : 'draft' },
        { title: 'Threat Indicators (IOCs)', content: iocsSection, order: 7, aiGenerated: true, confidence: 90, status: 'draft' },
        { title: 'MITRE ATT&CK Matrix', content: mitreSection, order: 8, aiGenerated: true, confidence: 90, status: 'draft' },
        { title: 'Recommendations', content: recommendationsResult.content, order: 9, aiGenerated: true, confidence: recommendationsResult.confidence, status: 'draft' },
      ],
    })

    // Link to case
    caseDoc.reports.push(report._id)
    await caseDoc.save()

    await logAudit('report_generated', 'report', report._id, `Report ${reportNumber} generated with AI assistance`, req)

    res.status(201).json(report)
  } catch (err) {
    next(err)
  }
})

// PUT /api/reports/:id — Edit report (viewers blocked)
router.put('/:id', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot edit reports' })
    }

    const { sections, status, title } = req.body
    const report = await Report.findById(req.params.id).populate('caseId')
    if (!report) return res.status(404).json({ error: 'Report not found' })

    // Check case access
    if (reqUser && report.caseId && !canAccessCase(report.caseId, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this report' })
    }

    if (title) report.title = title
    if (status) report.status = status

    if (sections) {
      for (const update of sections) {
        const section = report.sections.id(update._id) || report.sections.find(s => s.order === update.order)
        if (section) {
          if (update.content !== undefined) {
            section.editHistory.push({
              editedBy: req.user?.name || 'Unknown',
              editedAt: new Date(),
              previousContent: section.content,
            })
            section.content = update.content
          }
          if (update.status) section.status = update.status
        }
      }
    }

    if (status === 'final') {
      report.approvedAt = new Date()
      report.reviewedByName = req.user?.name || 'Unknown'
    }

    await report.save()

    const action = status === 'final' ? 'report_approved' : 'report_edited'
    await logAudit(action, 'report', report._id, `Report ${report.reportNumber} ${action.split('_')[1]}`, req)

    res.json(report)
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/:id/export — Export report as PDF
router.get('/:id/export', optionalAuth, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('caseId')
    if (!report) return res.status(404).json({ error: 'Report not found' })

    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const chunks = []
    const pdfBufferPromise = new Promise((resolve, reject) => {
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
    })

    // Header
    doc.fontSize(10).fillColor('#666')
      .text('CONFIDENTIAL — FOR AUTHORIZED PERSONNEL ONLY', { align: 'center' })
      .moveDown(0.5)

    doc.fontSize(22).fillColor('#000')
      .text('Digital Forensics Investigation Report', { align: 'center' })
      .moveDown(0.3)

    doc.fontSize(14).fillColor('#333')
      .text(report.title, { align: 'center' })
      .moveDown(1)

    // Report Metadata
    doc.fontSize(10).fillColor('#666')
    doc.text(`Report #: ${report.reportNumber}`)
    doc.text(`Case #: ${report.caseId?.caseNumber || 'N/A'}`)
    doc.text(`Status: ${report.status.toUpperCase()}`)
    doc.text(`Generated: ${report.createdAt?.toISOString().split('T')[0]}`)
    doc.text(`Generated By: ${report.generatedBy}`)
    if (report.reviewedByName) doc.text(`Reviewed By: ${report.reviewedByName}`)
    doc.moveDown(1)

    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#ccc')
    doc.moveDown(1)

    // Sections
    for (const section of report.sections.sort((a, b) => a.order - b.order)) {
      doc.fontSize(14).fillColor('#000')
        .text(`${section.order}. ${section.title}`)
      doc.moveDown(0.3)

      if (section.aiGenerated) {
        doc.fontSize(8).fillColor('#888')
          .text(`[AI-Generated — Confidence: ${section.confidence || 'N/A'}% — Requires Human Verification]`)
        doc.moveDown(0.3)
      }

      const content = section.content || '[No content]'
      const contentLines = content.split(/\r?\n/)
      for (const line of contentLines) {
        if (line.trim().startsWith('|')) {
          doc.font('Courier').fontSize(8.5).fillColor('#333')
            .text(line, { lineGap: 1 })
        } else {
          doc.font('Helvetica').fontSize(10).fillColor('#333')
            .text(line, { lineGap: 3 })
        }
      }
      doc.font('Helvetica') // Reset to default font
      doc.moveDown(1)
    }

    // Footer disclaimer
    doc.moveDown(2)
    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#ccc')
    doc.moveDown(0.5)
    doc.fontSize(8).fillColor('#888')
      .text('DISCLAIMER: AI-generated sections are provided as drafts to assist the investigation. All findings and conclusions must be independently verified by a qualified investigator. This report does not constitute legal advice.', { align: 'center' })

    doc.end()

    const pdfBuffer = await pdfBufferPromise
    const sha256Hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')
    const exportDir = path.resolve(process.env.REPORT_EXPORT_DIR || './tmp/exports')
    await fs.promises.mkdir(exportDir, { recursive: true })
    const exportPath = path.join(exportDir, `${report.reportNumber}.pdf`)
    await fs.promises.writeFile(exportPath, pdfBuffer, { mode: 0o600 })

    const currentSecurity = report.finalProductSecurity?.toObject?.() || report.finalProductSecurity || {}
    report.exportedAt = new Date()
    report.exportPath = exportPath
    report.finalProductSecurity = {
      ...currentSecurity,
      sha256Hash,
      hashAlgorithm: 'SHA-256',
      format: 'pdf',
      classification: 'Confidential',
      watermark: 'CONFIDENTIAL - FOR AUTHORIZED PERSONNEL ONLY',
      immutable: report.status === 'final',
      signedBy: report.reviewedByName || req.user?.name || '',
      signatureMethod: report.status === 'final' ? 'reviewer-attestation' : '',
      securedAt: new Date(),
    }
    await report.save()

    await logAudit('report_exported', 'report', report._id,
      `Report ${report.reportNumber} exported as PDF (SHA-256: ${sha256Hash.substring(0, 16)}...)`, req)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportNumber}.pdf"`)
    res.send(pdfBuffer)

  } catch (err) {
    next(err)
  }
})

export default router
