import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Brain, Sparkles, CheckCircle, Edit3, Download,
  AlertTriangle, RotateCcw, Save, Eye, Bold, Italic,
  Underline, List, AlignLeft, FileText, Shield, Clock, Loader, X
} from 'lucide-react'
import { getReport, updateReport } from '../api'

// ─── Markdown → HTML renderer ───
function mdToHtml(md) {
  if (!md) return ''

  const lines = md.split('\n')
  const output = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'))
        i++
      }
      output.push(`<pre style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:12px;overflow-x:auto;font-size:0.8rem;line-height:1.5;margin:10px 0;"><code>${codeLines.join('\n')}</code></pre>`)
      i++
      continue
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      output.push('<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:16px 0;" />')
      i++
      continue
    }

    // Table detection — line starts and ends with |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const parsedCells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
      const isSeparator = (row) => /^[\s|:\-]+$/.test(row)
      let html = '<div style="overflow-x:auto;margin:12px 0;"><table style="width:100%;border-collapse:collapse;font-size:0.82rem;">'
      let headerDone = false
      for (const tl of tableLines) {
        if (isSeparator(tl)) { headerDone = true; continue }
        const cells = parsedCells(tl)
        if (!headerDone) {
          html += '<thead><tr>' + cells.map(c => `<th style="padding:8px 12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,212,255,0.08);text-align:left;font-weight:700;color:var(--accent-primary);">${inlineFormat(c)}</th>`).join('') + '</tr></thead><tbody>'
          headerDone = true
        } else {
          html += '<tr>' + cells.map(c => `<td style="padding:7px 12px;border:1px solid rgba(255,255,255,0.08);vertical-align:top;">${inlineFormat(c)}</td>`).join('') + '</tr>'
        }
      }
      html += '</tbody></table></div>'
      output.push(html)
      continue
    }

    // Headings
    const h4 = line.match(/^#{4}\s+(.+)/)
    const h3 = line.match(/^#{3}\s+(.+)/)
    const h2 = line.match(/^#{2}\s+(.+)/)
    const h1 = line.match(/^#\s+(.+)/)
    if (h4) { output.push(`<h5 style="margin:12px 0 4px;font-size:0.92rem;font-weight:700;color:var(--text-primary);">${inlineFormat(h4[1])}</h5>`); i++; continue }
    if (h3) { output.push(`<h4 style="margin:14px 0 6px;font-size:1rem;font-weight:700;color:var(--text-primary);">${inlineFormat(h3[1])}</h4>`); i++; continue }
    if (h2) { output.push(`<h3 style="margin:16px 0 8px;font-size:1.08rem;font-weight:700;color:var(--accent-primary);">${inlineFormat(h2[1])}</h3>`); i++; continue }
    if (h1) { output.push(`<h2 style="margin:18px 0 10px;font-size:1.18rem;font-weight:700;color:var(--accent-primary);">${inlineFormat(h1[1])}</h2>`); i++; continue }

    // Bullet list block
    if (/^[-*]\s/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      output.push('<ul style="margin:6px 0 10px;padding-left:22px;">' + items.map(it => `<li style="margin:3px 0;line-height:1.6;">${inlineFormat(it)}</li>`).join('') + '</ul>')
      continue
    }

    // Numbered list block
    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      output.push('<ol style="margin:6px 0 10px;padding-left:22px;">' + items.map(it => `<li style="margin:3px 0;line-height:1.6;">${inlineFormat(it)}</li>`).join('') + '</ol>')
      continue
    }

    // Empty line → small spacer
    if (line.trim() === '') {
      output.push('<div style="height:6px;"></div>')
      i++
      continue
    }

    // Regular paragraph line
    output.push(`<p style="margin:3px 0;line-height:1.7;">${inlineFormat(line)}</p>`)
    i++
  }

  return output.join('\n')
}

function inlineFormat(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3);padding:1px 5px;border-radius:3px;font-size:0.85em;">$1</code>')
}

export default function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const textareaRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // ─── Toolbar formatting helpers ───
  const wrapSelection = useCallback((before, after) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = editContent.substring(start, end)
    const replacement = before + (selected || 'text') + (after || before)
    const newContent = editContent.substring(0, start) + replacement + editContent.substring(end)
    setEditContent(newContent)
    // Restore focus & selection after state update
    setTimeout(() => {
      ta.focus()
      const newStart = start + before.length
      const newEnd = newStart + (selected || 'text').length
      ta.setSelectionRange(newStart, newEnd)
    }, 0)
  }, [editContent])

  const insertPrefix = useCallback((prefix) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    // Find the beginning of the current line
    const lineStart = editContent.lastIndexOf('\n', start - 1) + 1
    const lineEnd = editContent.indexOf('\n', end)
    const actualEnd = lineEnd === -1 ? editContent.length : lineEnd
    const lineText = editContent.substring(lineStart, actualEnd)
    const newContent = editContent.substring(0, lineStart) + prefix + lineText + editContent.substring(actualEnd)
    setEditContent(newContent)
    setTimeout(() => { ta.focus() }, 0)
  }, [editContent])

  const handleBold = () => wrapSelection('**', '**')
  const handleItalic = () => wrapSelection('*', '*')
  const handleUnderline = () => wrapSelection('__', '__')
  const handleList = () => insertPrefix('- ')
  const handleNumberedList = () => insertPrefix('1. ')

  // Fetch report
  useEffect(() => {
    setLoading(true)
    getReport(id).then(data => {
      setReport(data)
      setSections((data.sections || []).sort((a, b) => a.order - b.order))
    }).catch(err => {
      console.error('Failed to load report:', err)
      setReport(null)
    }).finally(() => setLoading(false))
  }, [id])

  const startEdit = (section) => {
    setEditingSection(section._id || section.order)
    setEditContent(section.content)
  }

  const saveEdit = async (section) => {
    setSaving(true)
    try {
      const updated = await updateReport(id, {
        sections: [{ _id: section._id, order: section.order, content: editContent, status: 'reviewed' }],
      })
      setReport(updated)
      setSections((updated.sections || []).sort((a, b) => a.order - b.order))
      setEditingSection(null)
      showToast('Section saved')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateReport(id, { sections: sections.map(s => ({ _id: s._id, order: s.order, content: s.content, status: s.status })) })
      setReport(updated)
      setSections((updated.sections || []).sort((a, b) => a.order - b.order))
      showToast('Report saved successfully')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const regenerateSection = (section) => {
    setSections(prev => prev.map(s =>
      (s._id || s.order) === (section._id || section.order) ? { ...s, status: 'regenerating' } : s
    ))
    setTimeout(() => {
      setSections(prev => prev.map(s =>
        (s._id || s.order) === (section._id || section.order) ? { ...s, status: 'draft' } : s
      ))
      showToast('Section regenerated')
    }, 2000)
  }

  const handleExportPDF = () => {
    if (!report) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return alert('Please allow popups to export PDF.')

    const sectionsHTML = sections.map(s => `
      <div style="margin-bottom:34px;">
        <h2 style="font-size:20px;color:#0a0a0a;margin-bottom:10px;border-bottom:1px solid #ddd;padding-bottom:10px;">
          ${s.order}. ${s.title}
          ${s.aiGenerated ? '<span style="font-size:12px;color:#888;margin-left:8px;">[AI-Generated — Confidence: ' + (s.confidence || 'N/A') + '%]</span>' : ''}
        </h2>
        <div style="font-size:14px;line-height:1.9;color:#333;">${s.content ? mdToHtml(s.content) : '<em>Section not yet completed.</em>'}</div>
      </div>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>${report.reportNumber} — Forensic Report</title>
        <style>
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 40px; color: #222; font-size: 15px; }
          .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .header h1 { font-size: 26px; margin: 0 0 8px; }
          .header p { font-size: 14px; color: #555; margin: 3px 0; }
          .confidential { font-size: 10px; color: #c00; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
          .meta { font-size: 11px; color: #666; margin-bottom: 32px; } .meta span { margin-right: 24px; }
          .disclaimer { font-size: 10px; color: #888; text-align: center; border-top: 1px solid #ccc; margin-top: 40px; padding-top: 16px; line-height: 1.6; }
          strong { font-weight: 700; }
          ul, ol { margin: 8px 0; padding-left: 24px; }
          li { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
          th { padding: 8px 12px; background-color: #f5f5f5 !important; border: 1px solid #ccc !important; color: #000 !important; font-weight: 700; text-align: left; }
          td { padding: 8px 12px; border: 1px solid #ddd !important; vertical-align: top; color: #333 !important; }
        </style></head><body>
        <div class="header">
          <div class="confidential">Confidential — For Authorized Personnel Only</div>
          <h1>Digital Forensics Investigation Report</h1>
          <p>${report.title}</p>
        </div>
        <div class="meta">
          <span><strong>Report #:</strong> ${report.reportNumber}</span>
          <span><strong>Case #:</strong> ${report.caseId?.caseNumber || report.caseId || ''}</span>
          <span><strong>Status:</strong> ${report.status?.toUpperCase()}</span>
          <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
          <span><strong>Generated By:</strong> ${report.generatedBy || 'AI + Human'}</span>
        </div>
        ${sectionsHTML}
        <div class="disclaimer">
          DISCLAIMER: AI-generated sections are provided as drafts to assist the investigation. All findings and conclusions
          must be independently verified by a qualified investigator. This report does not constitute legal advice.
        </div>
      </body></html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 400)
  }

  const handlePreview = () => {
    if (!report) return
    const previewWindow = window.open('', '_blank')
    if (!previewWindow) return alert('Please allow popups to preview the report.')

    const reviewedCount = sections.filter(s => s.status === 'reviewed').length
    const sectionsHTML = sections.map(s => `
      <div style="margin-bottom:28px;">
        <h3 style="font-size:22px;color:#111;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #eee;">
          ${s.order}. ${s.title}
          ${s.aiGenerated ? '<span style="font-size:11px;color:#888;margin-left:8px;">✦ AI-Generated (Confidence: ' + (s.confidence || 'N/A') + '%)</span>' : ''}
        </h3>
        ${s.status === 'needs-review' ? '<div style="background:#fff3e0;border-left:3px solid #ff9800;padding:8px 12px;margin-bottom:10px;font-size:12px;color:#e65100;">⚠ This section needs human review</div>' : ''}
        <div style="font-size:15px;line-height:1.85;color:#333;">${s.content ? mdToHtml(s.content) : '<em style="color:#999;">This section has not been completed yet.</em>'}</div>
      </div>
    `).join('')

    previewWindow.document.write(`
      <!DOCTYPE html><html><head><title>Preview — ${report.reportNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 820px; margin: 0 auto; padding: 40px; color: #222; background: #fafafa; }
          .banner { background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 12px 18px; margin-bottom: 28px; font-size: 13px; color: #1565c0; }
          .header { text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #222; }
          .header h1 { font-size: 24px; margin: 0 0 6px; } .header p { font-size: 13px; color: #666; margin: 2px 0; }
          .meta { display: flex; gap: 24px; flex-wrap: wrap; font-size: 12px; color: #666; margin-bottom: 28px; padding: 12px 16px; background: #f5f5f5; border-radius: 8px; }
          .progress-bar { height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden; margin-bottom: 24px; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #00b0ff, #7c4dff); border-radius: 3px; }
          strong { font-weight: 700; }
          ul, ol { margin: 8px 0; padding-left: 24px; }
          li { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
          th { padding: 8px 12px; background-color: #eee !important; border: 1px solid #ccc !important; color: #111 !important; font-weight: 700; text-align: left; }
          td { padding: 8px 12px; border: 1px solid #ddd !important; vertical-align: top; color: #444 !important; }
        </style></head><body>
        <div class="banner">👁 Preview Mode — This is a read-only preview of the report draft.</div>
        <div class="header">
          <h1>Digital Forensics Investigation Report</h1>
          <p>${report.title}</p>
        </div>
        <div class="meta">
          <span><strong>Report #:</strong> ${report.reportNumber}</span>
          <span><strong>Status:</strong> ${report.status}</span>
          <span><strong>Sections reviewed:</strong> ${reviewedCount}/${sections.length}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${sections.length ? (reviewedCount / sections.length) * 100 : 0}%"></div></div>
        ${sectionsHTML}
      </body></html>
    `)
    previewWindow.document.close()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80, color: 'var(--text-muted)', gap: 10 }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading report...
      </div>
    )
  }

  if (!report) {
    return (
      <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Reports
        </Link>
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div className="empty-state-icon"><AlertTriangle size={32} /></div>
          <div className="empty-state-title">Report Not Found</div>
          <div className="empty-state-text">The report you're looking for doesn't exist or couldn't be loaded.</div>
        </div>
      </motion.div>
    )
  }

  const reviewedCount = sections.filter(s => s.status === 'reviewed').length
  const caseNumber = report.caseId?.caseNumber || ''
  const isEditing = editingSection !== null

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.startsWith('Error') ? 'rgba(255,82,82,0.95)' : 'rgba(0,230,118,0.95)',
          color: '#fff', padding: '10px 18px', borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <CheckCircle size={16} /> {toast}
        </motion.div>
      )}

      {/* Back nav */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Reports
        </Link>
      </div>

      {/* Report Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
              {report.reportNumber}
            </span>
            <span className={`status-badge ${report.status}`}>{report.status}</span>
            {report.generatedBy?.includes('AI') && (
              <div className="ai-badge"><Sparkles size={10} /> AI-Assisted</div>
            )}
          </div>
          <h1 className="page-title" style={{ fontSize: '1.4rem' }}>{report.title}</h1>
          <p className="page-description">
            {caseNumber ? `Case ${caseNumber}` : ''}
            {report.createdAt && ` · ${new Date(report.createdAt).toLocaleDateString()}`}
            {` · ${report.generatedBy || 'AI + Human'}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={handlePreview}><Eye size={15} /> Preview</button>
          <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF}><Download size={15} /> Export PDF</button>
        </div>
      </div>

      {/* Progress */}
      <div className="glow-card" style={{ marginBottom: 28 }}>
        <div className="glow-card-inner" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Report Completion</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
              {reviewedCount}/{sections.length} sections reviewed
            </span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${sections.length ? (reviewedCount / sections.length) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="report-editor">
        {/* Toolbar — functional when editing */}
        <div className="report-editor-toolbar">
          <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, opacity: isEditing ? 1 : 0.4 }} onClick={handleBold} disabled={!isEditing} title="Bold (**text**)"><Bold size={14} /></button>
          <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, opacity: isEditing ? 1 : 0.4 }} onClick={handleItalic} disabled={!isEditing} title="Italic (*text*)"><Italic size={14} /></button>
          <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, opacity: isEditing ? 1 : 0.4 }} onClick={handleUnderline} disabled={!isEditing} title="Underline (__text__)"><Underline size={14} /></button>
          <div style={{ width: 1, height: 20, background: 'var(--border-primary)', margin: '0 4px' }}></div>
          <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, opacity: isEditing ? 1 : 0.4 }} onClick={handleList} disabled={!isEditing} title="Bullet list (- item)"><List size={14} /></button>
          <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, opacity: isEditing ? 1 : 0.4 }} onClick={handleNumberedList} disabled={!isEditing} title="Numbered list (1. item)"><AlignLeft size={14} /></button>
          <div style={{ flex: 1 }} />
          {isEditing && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 8 }}>
              Select text then click a format button
            </span>
          )}
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-primary)' }}>
            <Brain size={14} /> AI Regenerate All
          </button>
        </div>

        {/* Sections */}
        <div className="report-editor-body">
          {sections.map((section) => {
            const sectionKey = section._id || section.order
            return (
              <div className="report-section" key={sectionKey}>
                <div className="report-section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="report-section-title">{section.order}. {section.title}</span>
                    {section.aiGenerated && (
                      <div className="ai-badge"><Sparkles size={10} /> AI Generated</div>
                    )}
                    {section.status === 'reviewed' && (
                      <span style={{ color: 'var(--accent-success)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem' }}>
                        <CheckCircle size={12} /> Reviewed
                      </span>
                    )}
                    {section.status === 'needs-review' && (
                      <span style={{ color: 'var(--accent-warning)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem' }}>
                        <AlertTriangle size={12} /> Needs Review
                      </span>
                    )}
                    {section.status === 'regenerating' && (
                      <span className="pulse" style={{ color: 'var(--accent-primary)', fontSize: '0.72rem' }}>⟳ Regenerating...</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {section.aiGenerated && (
                      <button className="btn btn-ghost btn-sm" onClick={() => regenerateSection(section)} style={{ fontSize: '0.75rem' }}>
                        <RotateCcw size={12} /> Regenerate
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => editingSection === sectionKey ? saveEdit(section) : startEdit(section)}
                      disabled={saving}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {editingSection === sectionKey
                        ? <>{saving ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />} Save</>
                        : <><Edit3 size={12} /> Edit</>}
                    </button>
                  </div>
                </div>

                {editingSection === sectionKey ? (
                  <>
                    {/* Inline toolbar — only visible when this section is being edited */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      padding: '6px 10px', marginBottom: 6,
                      background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-primary)',
                    }}>
                      <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={handleBold} title="Bold (**text**)"><Bold size={13} /></button>
                      <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={handleItalic} title="Italic (*text*)"><Italic size={13} /></button>
                      <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={handleUnderline} title="Underline (__text__)"><Underline size={13} /></button>
                      <div style={{ width: 1, height: 18, background: 'var(--border-primary)', margin: '0 4px' }} />
                      <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={handleList} title="Bullet list (- item)"><List size={13} /></button>
                      <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={handleNumberedList} title="Numbered list (1. item)"><AlignLeft size={13} /></button>
                      <div style={{ flex: 1 }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Select text → click format</span>
                    </div>
                    <textarea
                      ref={textareaRef}
                      className="form-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{ minHeight: 200, fontFamily: 'var(--font-mono)', lineHeight: 1.7, fontSize: '0.85rem' }}
                    />
                  </>
                ) : (
                  <div
                    className="md-rendered"
                    style={{
                      fontSize: '0.88rem',
                      color: section.content ? 'var(--text-secondary)' : 'var(--text-muted)',
                      lineHeight: 1.8,
                      fontStyle: section.content ? 'normal' : 'italic',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: section.content
                        ? mdToHtml(section.content)
                        : 'This section is empty. Click Edit to add content manually, or use AI to generate it.'
                    }}
                  />
                )}

                {/* Confidence bar */}
                {section.confidence != null && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Confidence</span>
                      <span style={{
                        fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                        color: section.confidence > 90 ? 'var(--accent-success)' : section.confidence > 80 ? 'var(--accent-primary)' : 'var(--accent-warning)'
                      }}>
                        {section.confidence}%
                      </span>
                    </div>
                    <div className="confidence-bar">
                      <div className="confidence-bar-fill" style={{ width: `${section.confidence}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Human Review Disclaimer */}
      <div className="glow-card" style={{ marginTop: 28 }}>
        <div className="glow-card-inner">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div className="stat-card-icon purple" style={{ marginBottom: 0, flexShrink: 0 }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>Human-in-the-Loop Review Required</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                AI-generated sections are provided as drafts to assist the investigation. All findings, conclusions, and recommendations
                must be reviewed, verified, and approved by a qualified human investigator before the report is finalized.
                AI-generated content should not be treated as conclusive without independent verification.
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
