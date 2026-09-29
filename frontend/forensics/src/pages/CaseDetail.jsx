import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Upload, Clock, Shield, Hash,
  Download, Eye, Trash2, CheckCircle, AlertTriangle,
  Brain, Edit3, Save, X, Loader, User, RefreshCw,
  MessageSquare, Send, Globe, Database, Share2, UserPlus, UserMinus, Lock
} from 'lucide-react'
import { getCase, updateCase, getTimeline, getReports, getAuditLogs, generateReport, parseAllEvidence, sendCaseChatMessage, getHealthStatus, shareCase, revokeCaseShare } from '../api'
import { useAuth } from '../context/AuthContext'

export function renderMarkdown(text) {
  if (!text) return ''
  
  let cleanText = text.trim()
  if (cleanText.startsWith('```markdown')) {
    cleanText = cleanText.substring(11)
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3)
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3)
  }
  cleanText = cleanText.trim()

  const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // 1. Escape HTML of the text first for security.
  let processedText = escapeHtml(cleanText)

  // 2. Extract code blocks
  const codeBlocks = []
  processedText = processedText.replace(/```([\s\S]*?)```/g, (match, p1) => {
    const idx = codeBlocks.length
    codeBlocks.push(p1.trim())
    return `\n\n===CODEBLOCK_${idx}===\n\n`
  })

  // 3. Extract inline code blocks
  const inlineCodes = []
  processedText = processedText.replace(/`([^`]+)`/g, (match, p1) => {
    const idx = inlineCodes.length
    inlineCodes.push(p1)
    return `===INLINECODE_${idx}===`
  })

  // 4. Block-level parsing
  const lines = processedText.split(/\r?\n/)
  const output = []
  let inUl = false
  let inOl = false
  let paragraphLines = []

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      output.push(`<p class="chat-p">${paragraphLines.join(' ')}</p>`)
      paragraphLines = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph()
      if (inUl) { output.push('</ul>'); inUl = false }
      if (inOl) { output.push('</ol>'); inOl = false }

      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      i-- // decrement so the outer loop doesn't skip the non-table line

      const parsedCells = (row) => row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
      const isSeparator = (row) => /^[\s|:\-]+$/.test(row)
      
      let tableHtml = '<div class="chat-table-container"><table class="chat-table">'
      let headerDone = false
      
      for (const tl of tableLines) {
        if (isSeparator(tl)) {
          headerDone = true
          continue
        }
        const cells = parsedCells(tl)
        if (!headerDone) {
          tableHtml += '<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>'
          headerDone = true
        } else {
          tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>'
        }
      }
      tableHtml += '</tbody></table></div>'
      output.push(tableHtml)
      continue
    }

    const headerMatch = line.match(/^([#]{1,6})\s+(.*)$/)
    const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/)
    const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/)

    if (headerMatch || ulMatch || olMatch || trimmed === '') {
      flushParagraph()
    }

    if (inUl && !ulMatch) {
      output.push('</ul>')
      inUl = false
    }
    if (inOl && !olMatch) {
      output.push('</ol>')
      inOl = false
    }

    if (headerMatch) {
      const level = headerMatch[1].length
      const content = headerMatch[2]
      output.push(`<h${level} class="chat-h${level}">${content}</h${level}>`)
    } else if (ulMatch) {
      if (!inUl) {
        output.push('<ul class="chat-ul">')
        inUl = true
      }
      output.push(`<li class="chat-li">${ulMatch[1]}</li>`)
    } else if (olMatch) {
      if (!inOl) {
        output.push('<ol class="chat-ol">')
        inOl = true
      }
      output.push(`<li class="chat-li">${olMatch[2]}</li>`)
    } else if (trimmed === '') {
      if (output.length > 0 && output[output.length - 1] !== '<div class="chat-paragraph-spacer"></div>') {
        output.push('<div class="chat-paragraph-spacer"></div>')
      }
    } else {
      paragraphLines.push(trimmed)
    }
  }
  flushParagraph()

  if (inUl) output.push('</ul>')
  if (inOl) output.push('</ol>')

  let html = output.join('\n')

  // 5. Parse inline tags
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')

  // Custom highlights
  html = html.replace(/\b((?:[0-9]{1,3}\.){3}[0-9]{1,3})\b/g, '<span class="chat-ip-highlight">$1</span>')
  html = html.replace(/\b(T[0-9]{4}(?:\.[0-9]{4}|(?:\.[0-9]{3}))?)\b/g, '<span class="chat-mitre-highlight">$1</span>')
  html = html.replace(/\b(critical|danger|warning|suspicious|malicious)\b/gi, (match) => {
    const cls = match.toLowerCase() === 'warning' || match.toLowerCase() === 'suspicious' ? 'chat-sev-warning' : 'chat-sev-critical'
    return `<span class="${cls}">${match}</span>`
  })

  // 6. Restore code blocks & inline code
  inlineCodes.forEach((code, idx) => {
    html = html.replace(`===INLINECODE_${idx}===`, () => `<code class="inline-code">${code}</code>`)
  })

  codeBlocks.forEach((code, idx) => {
    html = html.replace(`===CODEBLOCK_${idx}===`, () => `<pre class="code-block"><code>${code}</code></pre>`)
  })

  return <div className="chat-markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
}

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const [activeTab, setActiveTab] = useState('evidence')
  const [loading, setLoading] = useState(true)
  const [caseData, setCaseData] = useState(null)
  const [evidence, setEvidence] = useState([])
  const [timelineData, setTimelineData] = useState(null)
  const [reports, setReports] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [reparsing, setReparsing] = useState(false)
  const [toast, setToast] = useState('')

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [sharedWith, setSharedWith] = useState([])

  // Case Chatbot State (RAG)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [selectedSources, setSelectedSources] = useState(null)

  // Load chat history if case ID changes
  useEffect(() => {
    if (!id) {
      setChatMessages([])
      return
    }
    const saved = localStorage.getItem(`forensicai_chat_history_${id}`)
    if (saved) {
      try {
        setChatMessages(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved chat history:', e)
        setChatMessages([])
      }
    } else {
      setChatMessages([])
    }
  }, [id])

  const handleSendChatMessage = async (e, directMessage = '') => {
    if (e) e.preventDefault()
    const msg = directMessage || chatInput
    if (!msg.trim() || chatLoading) return

    const userMsg = { role: 'user', content: msg }
    const updatedMessagesWithUser = [...chatMessages, userMsg]
    setChatMessages(updatedMessagesWithUser)
    localStorage.setItem(`forensicai_chat_history_${id}`, JSON.stringify(updatedMessagesWithUser))
    if (!directMessage) setChatInput('')
    setChatLoading(true)

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await sendCaseChatMessage(id, msg, history)
      
      const assistantMsg = {
        role: 'assistant',
        content: res.message,
        sources: res.sources
      }
      const updatedMessagesWithAssistant = [...updatedMessagesWithUser, assistantMsg]
      setChatMessages(updatedMessagesWithAssistant)
      localStorage.setItem(`forensicai_chat_history_${id}`, JSON.stringify(updatedMessagesWithAssistant))
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ Failed to query Case Chatbot: ${err.message}`
      }
      const updatedMessagesWithError = [...updatedMessagesWithUser, errorMsg]
      setChatMessages(updatedMessagesWithError)
      localStorage.setItem(`forensicai_chat_history_${id}`, JSON.stringify(updatedMessagesWithError))
    }
    chatLoadingChange(false)
  }

  const handleClearHistory = () => {
    if (!id) return
    localStorage.removeItem(`forensicai_chat_history_${id}`)
    setChatMessages([])
  }

  // To prevent lint warning/error, define helper variable or just invoke it directly.
  // Wait, let's just use a normal state updater.
  const chatLoadingChange = (val) => setChatLoading(val)

  // Editable fields
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPriority, setEditPriority] = useState('')
  const [editAssignee, setEditAssignee] = useState('')
  const [intelStatus, setIntelStatus] = useState({ abuseIpDbConfigured: false, virusTotalConfigured: false })

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // Fetch case detail
  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const c = await getCase(id)
        setCaseData(c)
        setEvidence(c.evidence || [])
        setSharedWith(c.sharedWith || [])
        setEditTitle(c.title)
        setEditDesc(c.description || '')
        setEditStatus(c.status)
        setEditPriority(c.priority)
        setEditAssignee(c.assigneeName || '')
        // Use populated reports from case (instant, no extra API call)
        if (c.reports && c.reports.length > 0) setReports(c.reports)
        
        // Fetch health status to verify API configuration
        const health = await getHealthStatus().catch(() => null)
        if (health && health.threatIntel) {
          setIntelStatus(health.threatIntel)
        }
      } catch (err) {
        console.error('Failed to load case:', err)
        setCaseData(null)
      }
      setLoading(false)
    }
    fetchAll()
  }, [id])

  // Fetch tab-specific data
  useEffect(() => {
    if (!caseData) return
    if (activeTab === 'timeline') {
      getTimeline(id).then(d => setTimelineData(d))
        .catch(() => setTimelineData(null))
    } else if (activeTab === 'reports') {
      getReports({ caseId: id }).then(d => setReports(d.reports || d || []))
        .catch(() => setReports([]))
    } else if (activeTab === 'audit') {
      getAuditLogs({ entityId: id, limit: 20 }).then(d => setAuditLogs(d.logs || d || []))
        .catch(() => setAuditLogs([]))
    }
  }, [activeTab, caseData, id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateCase(id, {
        title: editTitle, description: editDesc,
        status: editStatus, priority: editPriority,
        assigneeName: editAssignee,
      })
      setCaseData(updated)
      setEditing(false)
      showToast('Case updated successfully')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const handleAiAnalyze = async () => {
    setAnalyzing(true)
    try {
      await generateReport(id)
      showToast('AI analysis started — check Reports tab')
      setActiveTab('reports')
      getReports({ caseId: id }).then(d => setReports(d.reports || d || []))
    } catch (err) { showToast('Error: ' + err.message) }
    setAnalyzing(false)
  }

  const handleReparse = async () => {
    setReparsing(true)
    try {
      const result = await parseAllEvidence(id)
      showToast(`✅ Re-parsed ${result.parsed} file(s) — timeline updated`)
      // Refresh case data to get updated event counts
      const c = await getCase(id)
      setEvidence(c.evidence || [])
      // Refresh timeline if on that tab
      getTimeline(id).then(d => setTimelineData(d))
        .catch(() => {})
    } catch (err) { showToast('Error: ' + err.message) }
    setReparsing(false)
  }

  // Determine if current user is owner or admin (may share the case)
  const isOwner = user?.role === 'admin' ||
    !caseData?.createdBy ||
    (caseData?.createdBy && (
      caseData.createdBy === user?.id ||
      caseData.createdBy?._id === user?.id ||
      caseData.createdBy?.toString?.() === user?.id
    ))

  const handleShare = async (e) => {
    e.preventDefault()
    if (!shareEmail.trim()) return
    setShareLoading(true)
    try {
      const res = await shareCase(id, shareEmail.trim())
      setSharedWith(res.sharedWith || [])
      setShareEmail('')
      showToast(`✅ Case shared with ${shareEmail.trim()}`)
    } catch (err) {
      showToast('Error: ' + err.message)
    }
    setShareLoading(false)
  }

  const handleRevokeShare = async (userId) => {
    setShareLoading(true)
    try {
      const res = await revokeCaseShare(id, userId)
      setSharedWith(res.sharedWith || [])
      showToast('Access revoked')
    } catch (err) {
      showToast('Error: ' + err.message)
    }
    setShareLoading(false)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
  const formatFileSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
    return (bytes / 1073741824).toFixed(1) + ' GB'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80, color: 'var(--text-muted)', gap: 10 }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading case...
      </div>
    )
  }

  if (!caseData) {
    return (
      <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Cases
        </Link>
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div className="empty-state-icon"><AlertTriangle size={32} /></div>
          <div className="empty-state-title">Case Not Found</div>
          <div className="empty-state-text">The case you're looking for doesn't exist or couldn't be loaded.</div>
        </div>
      </motion.div>
    )
  }

  return (
    <>
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

      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Cases
        </Link>
      </div>

      {/* Case Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
              {caseData.caseNumber || caseData._id}
            </span>
            {editing ? (
              <select className="form-select" style={{ width: 120, padding: '2px 8px', fontSize: '0.8rem' }}
                value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="review">Review</option>
                <option value="closed">Closed</option>
              </select>
            ) : (
              <span className={`status-badge ${caseData.status}`}>{caseData.status}</span>
            )}
            {editing ? (
              <select className="form-select" style={{ width: 110, padding: '2px 8px', fontSize: '0.8rem' }}
                value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            ) : (
              <span className={`tag ${caseData.priority === 'critical' ? 'cyan' : caseData.priority === 'high' ? 'purple' : ''}`}>
                {caseData.priority}
              </span>
            )}
          </div>
          {editing ? (
            <>
              <input className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }} />
              <textarea className="form-input" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                rows={3} style={{ fontSize: '0.88rem' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Assignee</label>
                  <input className="form-input" value={editAssignee} onChange={e => setEditAssignee(e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 8 }}>{caseData.title}</h1>
              <p className="page-description">{caseData.description || 'No description provided.'}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span><User size={12} style={{ marginRight: 4 }} />{caseData.assigneeName || 'Unassigned'}</span>
                <span><Clock size={12} style={{ marginRight: 4 }} />Created {formatDate(caseData.createdAt)}</span>
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}><X size={15} /> Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save
              </button>
            </>
          ) : (
            <>
              {/* Viewer badge */}
              {isViewer && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600,
                  color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', padding: '4px 10px',
                }}>
                  <Lock size={12} /> View Only
                </span>
              )}
              {/* Share button — owner/admin only */}
              {isOwner && !isViewer && (
                <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
                  <Share2 size={15} /> Share
                  {sharedWith.length > 0 && (
                    <span style={{
                      marginLeft: 4, background: 'var(--accent-primary)', color: '#000',
                      borderRadius: '50%', width: 16, height: 16, fontSize: '0.65rem',
                      fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{sharedWith.length}</span>
                  )}
                </button>
              )}
              {/* Edit — hidden for viewers */}
              {!isViewer && (
                <button className="btn btn-secondary" onClick={() => setEditing(true)}><Edit3 size={15} /> Edit</button>
              )}
              {reports.length > 0 && (
                <Link to={`/reports/${reports[0]._id}`} className="btn btn-secondary">
                  <FileText size={15} /> View Report
                </Link>
              )}
              {/* AI Analyze — hidden for viewers */}
              {!isViewer && (
                <button className="btn btn-primary" onClick={handleAiAnalyze} disabled={analyzing}>
                  {analyzing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={15} />} AI Analyze
                </button>
              )}
            </>
          )}
        </div>
      </div>


      {/* Stats Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { icon: Upload, label: 'Evidence Files', value: evidence.length, color: 'cyan' },
          { icon: Shield, label: 'Verified', value: evidence.filter(e => e.status === 'verified').length, color: 'green' },
          { icon: Clock, label: 'Created', value: formatDate(caseData.createdAt), color: 'purple' },
          { icon: FileText, label: 'Reports', value: reports.length || '—', color: 'red' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div className="glow-card" key={i}>
              <div className="glow-card-inner" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className={`stat-card-icon ${s.color}`} style={{ width: 38, height: 38, marginBottom: 0 }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'evidence', label: 'Evidence' },
          { id: 'timeline', label: 'Timeline' },
          { id: 'mitre', label: 'MITRE ATT&CK' },
          { id: 'chat', label: 'Forensic Chat' },
          { id: 'threatIntel', label: 'Threat Intelligence' },
          { id: 'reports', label: 'Reports' },
          { id: 'audit', label: 'Audit Log' }
        ].map(tab => (
          <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Evidence Tab */}
      {activeTab === 'evidence' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header">
            <div className="section-title">Evidence Files ({evidence.length})</div>
            {!isViewer && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleReparse}
                  disabled={reparsing}
                  title="Re-parse all evidence files to extract timeline events"
                >
                  {reparsing
                    ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <RefreshCw size={14} />}
                  {reparsing ? 'Re-parsing...' : 'Re-parse All'}
                </button>
                <Link to="/evidence" className="btn btn-primary btn-sm"><Upload size={14} /> Upload Evidence</Link>
              </div>
            )}
          </div>

          {evidence.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><Upload size={32} /></div>
              <div className="empty-state-title">No Evidence Yet</div>
              <div className="empty-state-text">Upload evidence files to begin the investigation.</div>
              <Link to="/evidence" className="btn btn-primary"><Upload size={16} /> Upload Evidence</Link>
            </div>
          ) : (
            <div className="file-list">
              {evidence.map((file, i) => (
                <div className="file-item" key={file._id || i}>
                  <div className={`file-icon ${(file.fileType || '').split('/')[1] || 'log'}`}>
                    <FileText size={18} />
                  </div>
                  <div className="file-info">
                    <div className="file-name">{file.originalName || file.fileName || 'Unknown file'}</div>
                    <div className="file-meta">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDateTime(file.createdAt || file.uploadedAt)}</span>
                    </div>
                  </div>
                  {file.sha256Hash && (
                    <div className="hash-badge">
                      <Hash size={14} />
                      SHA-256: {file.sha256Hash.slice(0, 16)}...{file.sha256Hash.slice(-4)}
                    </div>
                  )}
                  <span className={`status-badge ${file.status === 'verified' || file.status === 'parsed' ? 'active' : 'pending'}`}>
                    {file.status === 'verified' || file.status === 'parsed'
                      ? <><CheckCircle size={10} /> Verified</>
                      : <><AlertTriangle size={10} /> {file.status || 'Pending'}</>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'timeline' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header">
            <div className="section-title">Event Timeline ({timelineData?.totalEvents || 0} events)</div>
          </div>
          {timelineData?.attackAlerts?.length > 0 && (
            <div className="glow-card" style={{ marginBottom: 18 }}>
              <div className="glow-card-inner" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <AlertTriangle size={17} style={{ color: 'var(--accent-danger)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Correlated Attack Alerts</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Multi-event detections generated from the reconstructed timeline.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                  {timelineData.attackAlerts.slice(0, 6).map(alert => {
                    const sevColors = {
                      critical: { bg: 'rgba(255,82,82,0.1)', text: '#ff5252', border: 'rgba(255,82,82,0.25)' },
                      danger: { bg: 'rgba(255,82,82,0.07)', text: 'var(--accent-danger)', border: 'rgba(255,82,82,0.18)' },
                      warning: { bg: 'rgba(255,171,64,0.07)', text: 'var(--accent-warning)', border: 'rgba(255,171,64,0.18)' },
                    }
                    const colors = sevColors[alert.severity] || sevColors.warning
                    return (
                      <div key={alert.id} style={{ border: `1px solid ${colors.border}`, background: colors.bg, borderRadius: 'var(--radius-sm)', padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                          <strong style={{ fontSize: '0.84rem' }}>{alert.title}</strong>
                          <span style={{ color: colors.text, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{alert.riskScore}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{alert.description}</div>
                        <div style={{ marginTop: 8, fontSize: '0.7rem', color: colors.text, fontFamily: 'var(--font-mono)' }}>
                          {alert.mitreAttack?.techniqueId || alert.ruleId} · {alert.eventCount} events
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          {!timelineData || !timelineData.dateGroups || timelineData.dateGroups.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><Clock size={32} /></div>
              <div className="empty-state-title">No Timeline Events</div>
              <div className="empty-state-text">Upload and parse evidence, then click "Re-parse All" to reconstruct the timeline.</div>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 32, marginTop: 12 }}>
              {/* Vertical timeline line */}
              <div style={{
                position: 'absolute', left: 12, top: 0, bottom: 0,
                width: 2, background: 'linear-gradient(180deg, var(--accent-primary), var(--accent-secondary), transparent)',
              }} />

              {timelineData.dateGroups.map((group, gi) => (
                <div key={gi} style={{ marginBottom: 28 }}>
                  {/* Date header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, position: 'relative' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--bg-card)', border: '2px solid var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'absolute', left: -20,
                    }}>
                      <Clock size={11} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div style={{ marginLeft: 18 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700,
                        color: 'var(--text-primary)', background: 'var(--bg-card)',
                        padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-primary)',
                      }}>{group.date}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                        {group.eventCount} event{group.eventCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Events in this date group */}
                  {group.events.map((event, ei) => {
                    const sev = event.severity || 'info'
                    const sevColors = {
                      critical: { bg: 'rgba(255,82,82,0.08)', text: '#ff5252', border: 'rgba(255,82,82,0.2)' },
                      danger: { bg: 'rgba(255,82,82,0.06)', text: 'var(--accent-danger)', border: 'rgba(255,82,82,0.15)' },
                      warning: { bg: 'rgba(255,171,64,0.06)', text: 'var(--accent-warning)', border: 'rgba(255,171,64,0.15)' },
                      info: { bg: 'rgba(0,212,255,0.06)', text: 'var(--accent-primary)', border: 'rgba(0,212,255,0.15)' },
                    }
                    const colors = sevColors[sev] || sevColors.info
                    const ts = event.timestamp ? String(event.timestamp).trim() : ''
                    const timeDisplay = ts.includes(' ') ? ts.split(' ')[1]?.substring(0, 8) : ts.substring(11, 19) || ''
                    return (
                      <motion.div
                        key={ei}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ei * 0.03 }}
                        style={{
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          marginBottom: 8,
                          marginLeft: 18,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Shield size={13} style={{ color: colors.text }} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              {event.detail || event.eventType || 'Event'}
                            </span>

                            {event.threatIntel && event.threatIntel.score > 0 && (
                              <span className={`threat-badge ${event.threatIntel.score >= 75 ? 'critical' : 'warning'}`}>
                                IOC: {event.threatIntel.score}%
                              </span>
                            )}

                            {event.mitreAttack && event.mitreAttack.techniqueId && (
                              <span style={{
                                fontSize: '0.68rem', color: '#d1b3ff', background: 'rgba(136,0,255,0.08)',
                                border: '1px solid rgba(136,0,255,0.2)', padding: '2px 6px', borderRadius: 4,
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {event.mitreAttack.techniqueId} - {event.mitreAttack.techniqueName}
                              </span>
                            )}
                          </div>
                          <span style={{
                            fontSize: '0.7rem', color: colors.text, fontFamily: 'var(--font-mono)',
                            background: colors.bg, padding: '2px 8px', borderRadius: 4,
                            border: `1px solid ${colors.border}`,
                          }}>{sev}</span>
                        </div>
                        {event.threatIntel && event.threatIntel.details && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--accent-warning)', marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                            <Globe size={11} /> {event.threatIntel.details}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {timeDisplay && <span><Clock size={11} style={{ marginRight: 3 }} />{timeDisplay}</span>}
                          {event.source && <span style={{ fontFamily: 'var(--font-mono)' }}>{event.source}</span>}
                          {event.evidenceName && <span style={{ opacity: 0.7 }}>{event.evidenceName}</span>}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* MITRE ATT&CK Tab */}
      {activeTab === 'mitre' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header">
            <div className="section-title">MITRE ATT&CK TTP Correlation</div>
          </div>
          
          <div className="mitre-matrix-grid">
            {(() => {
              const activeTechniques = {}
              evidence.forEach(ev => {
                if (ev.parsedData?.events) {
                  ev.parsedData.events.forEach(e => {
                    if (e.mitreAttack?.techniqueId) {
                      activeTechniques[e.mitreAttack.techniqueId] = {
                        id: e.mitreAttack.techniqueId,
                        name: e.mitreAttack.techniqueName,
                        tactic: e.mitreAttack.tactic,
                        count: (activeTechniques[e.mitreAttack.techniqueId]?.count || 0) + 1
                      }
                    }
                  })
                }
              })
              
              const tactics = [
                { name: 'Execution', techniques: [{ id: 'T1059', name: 'Command & Scripting Interpreter' }] },
                { name: 'Privilege Escalation', techniques: [{ id: 'T1548.001', name: 'Sudo/Su Abuse' }] },
                { name: 'Credential Access', techniques: [{ id: 'T1110', name: 'Brute Force' }] },
                { name: 'Defense Evasion', techniques: [{ id: 'T1078', name: 'Valid Accounts' }] },
                { name: 'Discovery', techniques: [{ id: 'T1033', name: 'System Owner Discovery' }, { id: 'T1046', name: 'Network Service Discovery' }] },
                { name: 'Command & Control', techniques: [{ id: 'T1105', name: 'Ingress Tool Transfer' }] },
                { name: 'Exfiltration', techniques: [{ id: 'T1041', name: 'Exfiltration over C2' }] }
              ]
              
              return tactics.map((tac, ti) => (
                <div key={ti} className="mitre-tactic-column">
                  <div className="mitre-tactic-header">{tac.name}</div>
                  {tac.techniques.map((tech, tei) => {
                    const active = activeTechniques[tech.id]
                    return (
                      <div key={tei} className={`mitre-technique-card ${active ? 'active' : ''}`}>
                        <span className="mitre-technique-id">{tech.id}</span>
                        <div style={{ fontWeight: active ? 600 : 400 }}>{tech.name}</div>
                        {active && (
                          <div style={{ fontSize: '0.68rem', color: '#d1b3ff', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                            {active.count} matches detected
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            })()}
          </div>
        </motion.div>
      )}

      {/* Forensic Chat Tab */}
      {activeTab === 'chat' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title">Forensic Chat Copilot (RAG)</div>
            {chatMessages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>
          
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', gap: 10, padding: 20 }}>
                  <MessageSquare size={32} style={{ color: 'var(--accent-primary)', opacity: 0.7 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Interactive Log Assistant</div>
                    <div style={{ fontSize: '0.82rem', marginTop: 4, maxWidth: 360 }}>Ask questions directly about IP addresses, brute-force logs, or privilege escalations in this case.</div>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.role}`}>
                    <div className="chat-message-meta">{msg.role === 'user' ? 'Investigator' : 'Forensic Copilot'}</div>
                    <div className="chat-message-content">{renderMarkdown(msg.content)}</div>
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div className="chat-sources-header">Retrieved Evidence Citations ({msg.sources.length})</div>
                        <div className="chat-sources-list">
                          {msg.sources.map((src, si) => (
                            <div key={si} className="chat-source-badge" onClick={() => setSelectedSources(src)} title={src.detail}>
                              {src.mitreAttack?.techniqueId ? `${src.mitreAttack.techniqueId} ` : ''}{src.source} · {src.timestamp?.split(' ')[1] || 'log'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="chat-message assistant" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing case files...
                </div>
              )}
            </div>
            
            {chatMessages.length === 0 && (
              <div className="chat-suggested">
                {[
                  'Did you detect any brute force logins?',
                  'Show all events with high threat scores',
                  'Find any privilege escalation commands',
                  'Give me a summary of the timeline'
                ].map((chip, ci) => (
                  <div key={ci} className="chat-suggested-chip" onClick={() => handleSendChatMessage(null, chip)}>
                    {chip}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendChatMessage} className="chat-input-container">
              <input
                className="form-input"
                style={{ flex: 1, marginBottom: 0 }}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about logins, IPs, specific tools..."
                disabled={chatLoading}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }} disabled={chatLoading}>
                <Send size={15} />
              </button>
            </form>
          </div>

          {selectedSources && (
            <div className="modal-backdrop" onClick={() => setSelectedSources(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
              <div className="glow-card" style={{ maxWidth: 600, width: '100%' }} onClick={e => e.stopPropagation()}>
                <div className="glow-card-inner" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Evidence Citation Details</h3>
                    <button className="btn btn-secondary btn-sm" style={{ padding: 4 }} onClick={() => setSelectedSources(null)}><X size={16} /></button>
                  </div>
                  <div style={{ display: 'grid', gap: 12, fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Evidence File:</strong> {selectedSources.evidenceName}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Source / Host:</strong> {selectedSources.source}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Timestamp:</strong> {selectedSources.timestamp}
                    </div>
                    {selectedSources.severity && (
                      <div>
                        <strong style={{ color: 'var(--text-muted)' }}>Severity:</strong> <span className="tag">{selectedSources.severity}</span>
                      </div>
                    )}
                    {selectedSources.mitreAttack?.techniqueId && (
                      <div>
                        <strong style={{ color: 'var(--text-muted)' }}>MITRE ATT&CK:</strong> <span style={{ color: '#d1b3ff', background: 'rgba(136,0,255,0.08)', padding: '2px 8px', borderRadius: 4 }}>{selectedSources.mitreAttack.techniqueId} - {selectedSources.mitreAttack.techniqueName} ({selectedSources.mitreAttack.tactic})</span>
                      </div>
                    )}
                    {selectedSources.threatIntel?.score > 0 && (
                      <div>
                        <strong style={{ color: 'var(--text-muted)' }}>Threat Intelligence:</strong> <span className="tag danger">Score {selectedSources.threatIntel.score}% - {selectedSources.threatIntel.details}</span>
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <strong style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Event Log Detail:</strong>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)', padding: 12, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                        {selectedSources.detail}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Threat Intelligence Tab */}
      {activeTab === 'threatIntel' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header">
            <div className="section-title">Threat Intelligence & Reputation Feed</div>
          </div>

          {/* API Keys status banner */}
          {intelStatus.abuseIpDbConfigured && intelStatus.virusTotalConfigured ? (
            <div className="glow-card" style={{ marginBottom: 24, border: '1px solid rgba(0,230,118,0.2)' }}>
              <div className="glow-card-inner" style={{ padding: '12px 20px', background: 'rgba(0,230,118,0.02)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <CheckCircle size={18} style={{ color: '#00e676', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Threat Intelligence Integrations Active:</strong> Real-time checks with AbuseIPDB and VirusTotal are operational.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glow-card" style={{ marginBottom: 24, border: '1px solid rgba(255,171,64,0.15)' }}>
              <div className="glow-card-inner" style={{ padding: '16px 20px', background: 'rgba(255,171,64,0.02)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>Threat Intelligence API Setup</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      To configure real-time reputation queries, specify the following free API keys in your server's <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 4px', borderRadius: 3 }}>.env</code> file:
                      <ul style={{ margin: '6px 0', paddingLeft: 18 }}>
                        <li><strong style={{ color: 'var(--text-primary)' }}>ABUSEIPDB_API_KEY</strong> {intelStatus.abuseIpDbConfigured ? '✅ Detected' : '(Free: 1,000 requests/day at abuseipdb.com)'} — For validating public IP address reputations.</li>
                        <li><strong style={{ color: 'var(--text-primary)' }}>VIRUSTOTAL_API_KEY</strong> {intelStatus.virusTotalConfigured ? '✅ Detected' : '(Free: 4 requests/min, 500 requests/day at virustotal.com)'} — For analyzing file md5/sha256 signature reputations.</li>
                      </ul>
                      Currently, the application is performing automated detection using local threat signatures, Tor exit-node caches, and deterministic simulation fallbacks.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List of detected Threat IOCs */}
          {(() => {
            const iocs = []
            const seen = new Set()

            evidence.forEach(ev => {
              if (ev.parsedData?.events) {
                ev.parsedData.events.forEach(e => {
                  if (e.threatIntel && e.threatIntel.score > 0) {
                    let value = 'Unknown IOC'
                    let type = 'Malicious Hash'
                    
                    const ipMatch = e.detail.match(/\b((?:[0-9]{1,3}\.){3}[0-9]{1,3})\b/)
                    if (ipMatch) {
                      value = ipMatch[1]
                      type = 'IP Reputation'
                    } else {
                      const hashMatch = e.detail.match(/\b([a-fA-F0-9]{32})\b/)
                      if (hashMatch) {
                        value = hashMatch[1]
                        type = 'Malware Hash'
                      }
                    }

                    const key = `${type}-${value}`
                    if (!seen.has(key)) {
                      seen.add(key)
                      iocs.push({
                        value,
                        type,
                        score: e.threatIntel.score,
                        details: e.threatIntel.details,
                        evidenceName: ev.name,
                        timestamp: e.timestamp
                      })
                    }
                  }
                })
              }
            })

            if (iocs.length === 0) {
              return (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="empty-state-icon"><Globe size={32} /></div>
                  <div className="empty-state-title">No Malicious IOCs Detected</div>
                  <div className="empty-state-text">No IP addresses or file hashes scored above the threshold in this case's evidence logs.</div>
                </div>
              )
            }

            return (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>IOC Indicator</th>
                      <th>Type</th>
                      <th>Risk Score</th>
                      <th>Reputation Details</th>
                      <th>Evidence File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iocs.map((ioc, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                          {ioc.value}
                        </td>
                        <td><span className="tag">{ioc.type}</span></td>
                        <td>
                          <span className={`threat-badge ${ioc.score >= 75 ? 'critical' : 'warning'}`}>
                            {ioc.score}% Risk
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ioc.details}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ioc.evidenceName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header">
            <div className="section-title">Reports</div>
            <button className="btn btn-primary btn-sm" onClick={handleAiAnalyze} disabled={analyzing}>
              {analyzing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={14} />}
              Generate Report
            </button>
          </div>
          {reports.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><FileText size={32} /></div>
              <div className="empty-state-title">No Reports Yet</div>
              <div className="empty-state-text">Click "AI Analyze" or "Generate Report" to create a forensic report from the evidence.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {(Array.isArray(reports) ? reports : []).map((report) => (
                <div className="glow-card" key={report._id} onClick={() => navigate(`/reports/${report._id}`)} style={{ cursor: 'pointer' }}>
                  <div className="glow-card-inner" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: 4 }}>
                        {report.reportNumber || report._id}
                      </div>
                      <div style={{ fontWeight: 600 }}>{report.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(report.createdAt)} · {report.sections?.length || 0} sections
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                      <Eye size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {auditLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><Shield size={32} /></div>
              <div className="empty-state-title">No Audit Logs</div>
              <div className="empty-state-text">Actions on this case will appear here.</div>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={log._id || i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(log.createdAt || log.timestamp)}
                      </td>
                      <td><span className="tag">{log.action}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.description || log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>

      {/* ─── Share Case Modal ─── */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9000,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                width: 480, background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-primary)',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(123,97,255,0.05))',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '1.05rem' }}>
                    <Share2 size={18} style={{ color: 'var(--accent-primary)' }} />
                    Share Case
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {caseData?.caseNumber} — {caseData?.title}
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Add user */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Invite by email address
                </div>
                <form onSubmit={handleShare} style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="investigator@example.com"
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    style={{ flex: 1 }}
                    disabled={shareLoading}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={shareLoading || !shareEmail.trim()}
                    style={{ flexShrink: 0 }}
                  >
                    {shareLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
                    {shareLoading ? '' : ' Add'}
                  </button>
                </form>
              </div>

              {/* Current shared users */}
              <div style={{ padding: '0 24px 20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Currently shared with ({sharedWith.length})
                </div>
                {sharedWith.length === 0 ? (
                  <div style={{
                    padding: '16px', textAlign: 'center', color: 'var(--text-muted)',
                    fontSize: '0.83rem', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)', border: '1px dashed var(--border-subtle)',
                  }}>
                    This case is not shared with anyone yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sharedWith.map((u) => {
                      const uid = u._id || u
                      const uName = u.name || 'Unknown'
                      const uEmail = u.email || ''
                      const uRole = u.role || 'investigator'
                      return (
                        <div
                          key={uid}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                            }}>
                              {uName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{uName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{uEmail}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                              padding: '2px 8px', borderRadius: 4,
                              background: uRole === 'admin' ? 'rgba(255,107,107,0.15)' : 'rgba(0,212,255,0.1)',
                              color: uRole === 'admin' ? '#ff6b6b' : 'var(--accent-primary)',
                              border: `1px solid ${uRole === 'admin' ? 'rgba(255,107,107,0.3)' : 'rgba(0,212,255,0.2)'}`,
                            }}>
                              {uRole}
                            </span>
                            <button
                              onClick={() => handleRevokeShare(uid)}
                              disabled={shareLoading}
                              title="Revoke access"
                              style={{
                                background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)',
                                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                                color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'}
                            >
                              <UserMinus size={13} /> Revoke
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
