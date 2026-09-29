import express from 'express'
import { generateSummary, generateFindings, generateReportSection } from '../services/aiService.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

const router = express.Router()

// POST /api/ai/summarize — Generate an AI summary
router.post('/summarize', optionalAuth, async (req, res, next) => {
  try {
    const { evidenceData } = req.body

    if (!evidenceData) {
      return res.status(400).json({ error: 'evidenceData is required' })
    }

    const result = await generateSummary(evidenceData)

    await logAudit('ai_summary_generated', 'system', null, 'AI summary generated', req)

    res.json({
      ...result,
      disclaimer: 'AI-generated content requires human review and verification before use in any official capacity.',
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/ai/findings — Generate key findings
router.post('/findings', optionalAuth, async (req, res, next) => {
  try {
    const { parsedData, timelineData } = req.body

    const result = await generateFindings(parsedData || {}, timelineData || {})

    await logAudit('ai_findings_generated', 'system', null, 'AI findings generated', req)

    res.json({
      ...result,
      disclaimer: 'AI-generated findings require independent verification by a qualified forensic investigator.',
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/ai/section — Generate a specific report section
router.post('/section', optionalAuth, async (req, res, next) => {
  try {
    const { sectionType, data } = req.body

    if (!sectionType) {
      return res.status(400).json({ error: 'sectionType is required' })
    }

    const result = await generateReportSection(sectionType, data || {})

    await logAudit('ai_section_generated', 'system', null, `AI section "${sectionType}" generated`, req)

    res.json({
      ...result,
      disclaimer: 'This AI-generated section is a draft and must be reviewed before inclusion in the final report.',
    })
  } catch (err) {
    next(err)
  }
})

export default router
