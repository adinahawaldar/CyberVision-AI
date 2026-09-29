import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  FileText, Plus, Download, Eye, Brain, Calendar,
  CheckCircle, Clock, Edit3, ArrowUpRight, Sparkles, X, Loader
} from 'lucide-react'
import { getReports, getCases, generateReport as apiGenerateReport } from '../api'

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [reports, setReports] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState('')

  // Form fields
  const [selectedCase, setSelectedCase] = useState('')

  const fetchReports = async () => {
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const data = await getReports(params)
      setReports(data.reports || [])
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [statusFilter])

  useEffect(() => {
    getCases({ limit: 50 }).then(data => setCases(data.cases || [])).catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!selectedCase) return
    setGenerating(true)
    setGenStep('Collecting parsed evidence...')

    const steps = [
      'Analyzing timeline events...',
      'Identifying key findings...',
      'Generating AI sections with Mistral...',
      'Building recommendations...',
      'Finalizing report draft...',
    ]

    let stepIdx = 0
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setGenStep(steps[stepIdx])
        stepIdx++
      }
    }, 1200)

    try {
      await apiGenerateReport(selectedCase)
      clearInterval(interval)
      setGenerating(false)
      setShowModal(false)
      setSelectedCase('')
      await fetchReports()
    } catch (err) {
      clearInterval(interval)
      setGenerating(false)
      alert('Failed to generate report: ' + err.message)
    }
  }

  const handleExportPDF = (report) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return alert('Please allow popups to export PDF.')

    const sections = (report.sections || []).sort((a, b) => a.order - b.order)
    const sectionsHTML = sections.map(s => `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:16px;margin:0 0 6px;">${s.order}. ${s.title}</h2>
        ${s.aiGenerated ? '<p style="font-size:10px;color:#888;">[AI-Generated — Confidence: ' + (s.confidence || 'N/A') + '% — Requires Human Verification]</p>' : ''}
        <p style="font-size:13px;line-height:1.8;white-space:pre-wrap;">${s.content || '[No content]'}</p>
      </div>
    `).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${report.reportNumber} — Forensic Report</title>
      <style>@media print { body { -webkit-print-color-adjust: exact; } } body { font-family: 'Segoe UI', sans-serif; max-width: 750px; margin: 0 auto; padding: 40px; color: #222; }
      .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #000; padding-bottom: 20px; }
      .header h1 { font-size: 22px; margin: 0 0 6px; } .header p { font-size: 12px; color: #555; margin: 3px 0; }
      .meta { font-size: 11px; color: #666; margin-bottom: 24px; } .meta span { margin-right: 16px; }
      .disclaimer { font-size: 10px; color: #888; text-align: center; border-top: 1px solid #ccc; margin-top: 40px; padding-top: 16px; }</style></head>
      <body>
        <div class="header">
          <p style="font-size:10px;color:#c00;text-transform:uppercase;letter-spacing:2px;">Confidential — For Authorized Personnel Only</p>
          <h1>Digital Forensics Investigation Report</h1>
          <p>${report.title}</p>
        </div>
        <div class="meta">
          <span><strong>Report #:</strong> ${report.reportNumber}</span>
          <span><strong>Status:</strong> ${report.status?.toUpperCase()}</span>
          <span><strong>Date:</strong> ${report.createdAt ? new Date(report.createdAt).toISOString().split('T')[0] : ''}</span>
          <span><strong>Confidence:</strong> ${report.overallConfidence || 'N/A'}%</span>
          ${report.reviewedByName ? '<span><strong>Reviewed:</strong> ' + report.reviewedByName + '</span>' : ''}
        </div>
        ${sectionsHTML}
        <div class="disclaimer">DISCLAIMER: AI-generated sections are drafts. All findings must be independently verified.</div>
      </body></html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 400)
  }

  const filtered = reports

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Forensic Reports</h1>
          <p className="page-description">
            AI-assisted report generation with human-in-the-loop review. All reports are auditable and exportable as PDF.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Brain size={16} /> Generate Report
        </button>
      </div>

      {/* Generate Report Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={(e) => { if (e.target === e.currentTarget && !generating) setShowModal(false) }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', width: 520, maxHeight: '85vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid var(--border-primary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Brain size={18} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Generate AI Report</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>Select a case to generate from</p>
                </div>
              </div>
              {!generating && <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>}
            </div>

            <div style={{ padding: 24 }}>
              {!generating ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, marginBottom: 6 }}>Select Case *</label>
                    <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-primary)' }}>
                      <option value="">— Choose a case —</option>
                      {cases.map(c => (
                        <option key={c._id} value={c._id}>{c.caseNumber} — {c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ background: 'rgba(255,171,64,0.06)', border: '1px solid rgba(255,171,64,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 20, fontSize: '0.75rem', color: 'var(--accent-warning)', lineHeight: 1.5 }}>
                    ⚠ AI-generated reports use Mistral AI and require human review before finalization.
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedCase} style={{ opacity: selectedCase ? 1 : 0.5 }}>
                      <Sparkles size={15} /> Generate with AI
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s ease infinite' }}>
                    <Brain size={28} color="white" />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>AI Report Generation</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>{genStep}</p>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all', 'draft', 'review', 'final'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All Reports' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--text-muted)', gap: 10 }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading reports...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No reports yet. Generate your first report from a case.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {filtered.map((report, i) => (
            <motion.div key={report._id} className="glow-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="glow-card-inner" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-primary)' }}>{report.reportNumber}</span>
                  <span className={`status-badge ${report.status}`}>{report.status}</span>
                </div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 10, lineHeight: 1.4, minHeight: 44, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{report.title}</h3>

                <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span><Calendar size={12} style={{ marginRight: 4 }} />{report.createdAt ? new Date(report.createdAt).toISOString().split('T')[0] : ''}</span>
                  <span><FileText size={12} style={{ marginRight: 4 }} />{report.metadata?.totalSections || report.sections?.length || 0} sections</span>
                </div>

                {/* Confidence bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>AI Confidence</span>
                    <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{report.overallConfidence || 'N/A'}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${report.overallConfidence || 0}%` }}></div></div>
                </div>

                {report.reviewedByName && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                    <CheckCircle size={12} style={{ color: 'var(--accent-success)', marginRight: 4 }} />
                    Reviewed by <strong style={{ color: 'var(--text-primary)' }}>{report.reviewedByName}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/reports/${report._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    <Eye size={14} /> View
                  </Link>
                  {report.status === 'final' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => handleExportPDF(report)} style={{ flex: 1, justifyContent: 'center' }}>
                      <Download size={14} /> Export PDF
                    </button>
                  ) : (
                    <Link to={`/reports/${report._id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      <Edit3 size={14} /> Edit
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
