import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Send, Loader, Brain, Trash2, X,
  ArrowRight, Paperclip, ChevronDown, Check, Bot,
  Sparkles, Shield, Zap, Search, FileSearch
} from 'lucide-react'
import { getCases, sendCaseChatMessage } from '../api'
import { renderMarkdown } from './CaseDetail'

/* ─── Auto-resize textarea hook ─── */
function useAutoResize({ minHeight = 56, maxHeight = 260 } = {}) {
  const ref = useRef(null)
  const adjust = useCallback((reset) => {
    const el = ref.current
    if (!el) return
    if (reset) { el.style.height = `${minHeight}px`; return }
    el.style.height = `${minHeight}px`
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [minHeight, maxHeight])
  useEffect(() => {
    if (ref.current) ref.current.style.height = `${minHeight}px`
  }, [minHeight])
  return { ref, adjust }
}

/* ─── Suggestion chips ─── */
const SUGGESTIONS = [
  { icon: Search, text: 'Did you detect any brute force logins?' },
  { icon: Zap, text: 'Show all events with high threat scores' },
  { icon: Shield, text: 'Find any privilege escalation commands' },
  { icon: FileSearch, text: 'Give me a timeline summary' },
]

/* ─── AI Models ─── */
const AI_MODELS = [
  { id: 'mistral', label: 'Mistral (Active)', available: true, color: '#f59e0b', desc: 'Core forensic AI engine' },
  { id: 'gpt4o', label: 'GPT-4o', available: false, color: '#10a37f', desc: 'Requires OpenAI API key' },
  { id: 'gemini', label: 'Gemini 2.5 Flash', available: false, color: '#4285f4', desc: 'Requires Google API key' },
  { id: 'claude', label: 'Claude 3.5 Sonnet', available: false, color: '#c96442', desc: 'Requires Anthropic API key' },
]

/* ─── Message bubble ─── */
function ChatBubble({ msg, onSourceClick }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {!isUser && (
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={12} color="white" />
          </div>
        )}
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {isUser ? 'Investigator' : 'Forensic Copilot'}
        </span>
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '80%', padding: '12px 16px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser
          ? 'var(--gradient-primary)'
          : 'rgba(255,255,255,0.04)',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
        color: isUser ? 'white' : 'var(--text-primary)',
        fontSize: '0.88rem', lineHeight: 1.65,
        boxShadow: isUser ? '0 4px 20px rgba(99,102,241,0.25)' : 'none',
      }}>
        {isUser ? msg.content : renderMarkdown(msg.content)}
      </div>

      {/* Sources */}
      {msg.sources && msg.sources.length > 0 && (
        <div style={{ marginTop: 8, maxWidth: '80%' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {msg.sources.length} Evidence Citation{msg.sources.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {msg.sources.map((src, si) => (
              <button
                key={si}
                onClick={() => onSourceClick(src)}
                style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  color: 'var(--accent-secondary)', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-mono)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)' }}
              >
                {src.mitreAttack?.techniqueId ? `${src.mitreAttack.techniqueId} · ` : ''}{src.source}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Typing indicator ─── */
function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Brain size={12} color="white" />
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }}
            animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, delay: i * 0.18, repeat: Infinity }} />
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Source detail modal ─── */
function SourceModal({ source, onClose }) {
  if (!source) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}
        style={{ maxWidth: 580, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 16, padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSearch size={16} color="var(--accent-primary)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Evidence Citation</h3>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          ><X size={14} /></button>
        </div>
        <div style={{ display: 'grid', gap: 12, fontSize: '0.84rem' }}>
          {[
            ['Evidence File', source.evidenceName],
            ['Source / Host', source.source],
            ['Timestamp', source.timestamp],
            ['Severity', source.severity],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, alignItems: 'start' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: 2 }}>{k}</span>
              <span style={{ color: 'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
          {source.mitreAttack?.techniqueId && (
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: 2 }}>MITRE ATT&CK</span>
              <span style={{ color: '#d1b3ff', background: 'rgba(136,0,255,0.08)', padding: '2px 10px', borderRadius: 6, display: 'inline-block' }}>
                {source.mitreAttack.techniqueId} — {source.mitreAttack.techniqueName} ({source.mitreAttack.tactic})
              </span>
            </div>
          )}
          {source.detail && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Event Log</div>
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-primary)', padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', wordBreak: 'break-all', lineHeight: 1.7, color: 'rgba(161,161,170,0.9)' }}>
                {source.detail}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN CASE CHAT PAGE
══════════════════════════════════════════════ */
export default function CaseChat() {
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [selectedSources, setSelectedSources] = useState(null)
  const [selectedModel, setSelectedModel] = useState('mistral')
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const { ref: textareaRef, adjust } = useAutoResize({ minHeight: 56, maxHeight: 260 })

  useEffect(() => {
    getCases({ limit: 50 }).then(data => {
      const c = data.cases || []
      setCases(c)
      if (c.length > 0) setSelectedCaseId(c[0]._id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCaseId) { setChatMessages([]); return }
    try {
      const saved = localStorage.getItem(`forensicai_chat_history_${selectedCaseId}`)
      setChatMessages(saved ? JSON.parse(saved) : [])
    } catch { setChatMessages([]) }
  }, [selectedCaseId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  const sendMessage = async (text) => {
    const msg = text || chatInput
    if (!msg.trim() || chatLoading || !selectedCaseId) return

    const userMsg = { role: 'user', content: msg }
    const withUser = [...chatMessages, userMsg]
    setChatMessages(withUser)
    localStorage.setItem(`forensicai_chat_history_${selectedCaseId}`, JSON.stringify(withUser))
    setChatInput('')
    adjust(true)
    setChatLoading(true)

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await sendCaseChatMessage(selectedCaseId, msg, history)
      const aiMsg = { role: 'assistant', content: res.message, sources: res.sources }
      const withAI = [...withUser, aiMsg]
      setChatMessages(withAI)
      localStorage.setItem(`forensicai_chat_history_${selectedCaseId}`, JSON.stringify(withAI))
    } catch (err) {
      const errMsg = { role: 'assistant', content: `⚠️ Failed to query: ${err.message}` }
      const withErr = [...withUser, errMsg]
      setChatMessages(withErr)
      localStorage.setItem(`forensicai_chat_history_${selectedCaseId}`, JSON.stringify(withErr))
    }
    setChatLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClearHistory = () => {
    if (!selectedCaseId) return
    localStorage.removeItem(`forensicai_chat_history_${selectedCaseId}`)
    setChatMessages([])
  }

  const selectedCase = cases.find(c => c._id === selectedCaseId)

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">Case AI Copilot</h1>
        <p className="page-description">Ask questions directly about any evidence, IP addresses, commands, or patterns in your case.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, height: 'calc(100vh - 220px)', minHeight: 540 }}>

        {/* ── LEFT: Case Selector panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Case select */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Active Case</div>
            <select
              value={selectedCaseId}
              onChange={e => setSelectedCaseId(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)', fontSize: '0.84rem', fontFamily: 'var(--font-primary)',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">— Select a case —</option>
              {cases.map(c => (
                <option key={c._id} value={c._id}>{c.caseNumber} — {c.title}</option>
              ))}
            </select>

            {selectedCase && (
              <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: 2 }}>{selectedCase.caseNumber}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>{selectedCase.title}</div>
              </div>
            )}
          </div>

          {/* AI Model picker */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>AI Model</div>
            <div style={{ position: 'relative' }}>
              {/* Trigger button */}
              {(() => {
                const activeM = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]
                return (
                  <button
                    onClick={() => setModelMenuOpen(o => !o)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font-primary)',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeM.color }} />
                      <span>{activeM.label}</span>
                    </div>
                    <ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: modelMenuOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>
                )
              })()}
              <AnimatePresence>
                {modelMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18 }}
                    style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10, overflow: 'hidden', zIndex: 50, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
                    {AI_MODELS.map(m => (
                      <button key={m.id}
                        onClick={() => { if (m.available) { setSelectedModel(m.id); setModelMenuOpen(false) } }}
                        style={{
                          width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'none', border: 'none',
                          cursor: m.available ? 'pointer' : 'not-allowed',
                          fontSize: '0.83rem', opacity: m.available ? 1 : 0.45,
                          color: selectedModel === m.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontFamily: 'var(--font-primary)', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (m.available) e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.color }} />
                          <span>{m.label}</span>
                          {!m.available && (
                            <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              Unavailable
                            </span>
                          )}
                        </div>
                        {selectedModel === m.id && <Check size={13} style={{ color: 'var(--accent-primary)' }} />}
                      </button>
                    ))}
                    <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-primary)', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Only Mistral is active. Other models require additional API keys.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          {selectedCaseId && chatMessages.length > 0 && (
            <button onClick={handleClearHistory}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '9px 14px', borderRadius: 9, background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.18)', color: 'var(--accent-danger)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.07)' }}
            >
              <Trash2 size={14} /> Clear History
            </button>
          )}

          {/* Tips */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Tips</div>
            {['Ask about specific IPs or timestamps', 'Request MITRE ATT&CK mapping', 'Ask for timeline summaries', 'Query privilege escalation events'].map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 7, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <Sparkles size={10} style={{ color: 'var(--accent-secondary)', marginTop: 3, flexShrink: 0 }} />
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Chat area ── */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 16, overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(99,102,241,0.03)' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={15} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Forensic Copilot</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Powered by {selectedModel} · RAG over case evidence</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: selectedCaseId ? 'var(--accent-success)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedCaseId ? 'Case loaded' : 'No case'}</span>
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', scrollBehavior: 'smooth' }}>
            {!selectedCaseId ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={24} style={{ opacity: 0.4 }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Select a case to start</div>
                  <div style={{ fontSize: '0.8rem' }}>Choose a case from the left panel to launch the AI assistant</div>
                </div>
              </div>
            ) : chatMessages.length === 0 ? (
              /* Empty state with suggestions */
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 24px rgba(99,102,241,0.3)' }}>
                    <Brain size={26} color="white" />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 6 }}>Interactive Case RAG Copilot</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.65 }}>Ask about IP connections, system commands, MITRE techniques, or timeline events in this case.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 480 }}>
                  {SUGGESTIONS.map(({ icon: Icon, text }) => (
                    <button key={text} onClick={() => sendMessage(text)}
                      style={{
                        padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-primary)', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'flex-start', gap: 8, transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border-primary)' }}
                    >
                      <Icon size={14} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, idx) => (
                  <ChatBubble key={idx} msg={msg} onSourceClick={setSelectedSources} />
                ))}
                {chatLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* ── PREMIUM AI Prompt Input ── */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-primary)', background: 'rgba(255,255,255,0.015)' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 6, border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.2s' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={e => { setChatInput(e.target.value); adjust() }}
                onKeyDown={handleKeyDown}
                placeholder={selectedCaseId ? 'Ask about IPs, commands, events, or threat patterns…' : 'Select a case first…'}
                disabled={!selectedCaseId || chatLoading}
                style={{
                  width: '100%', minHeight: 56, resize: 'none', overflow: 'hidden',
                  background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'var(--font-primary)',
                  lineHeight: 1.65, padding: '8px 10px', boxSizing: 'border-box',
                  opacity: (!selectedCaseId || chatLoading) ? 0.5 : 1,
                }}
              />

              {/* Bottom bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 6px 2px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Model indicator */}
                  {(() => {
                    const m = AI_MODELS.find(x => x.id === selectedModel) || AI_MODELS[0]
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
                        {m.label}
                      </div>
                    )
                  })()}

                  {/* Divider */}
                  <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />

                  {/* Attach button (UI only) */}
                  <label style={{ padding: 6, borderRadius: 7, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.35)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
                    title="Attach file">
                    <input type="file" style={{ display: 'none' }} />
                    <Paperclip size={14} />
                  </label>

                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>⏎ Send · ⇧⏎ Newline</span>
                </div>

                {/* Send button */}
                <button
                  onClick={() => sendMessage()}
                  disabled={!chatInput.trim() || !selectedCaseId || chatLoading}
                  style={{
                    width: 34, height: 34, borderRadius: 9, border: 'none', cursor: chatInput.trim() && selectedCaseId && !chatLoading ? 'pointer' : 'not-allowed',
                    background: chatInput.trim() && selectedCaseId && !chatLoading ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: chatInput.trim() ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
                  }}
                  onMouseEnter={e => { if (chatInput.trim() && !chatLoading) e.currentTarget.style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                >
                  {chatLoading
                    ? <Loader size={14} color="white" style={{ animation: 'spin 0.7s linear infinite' }} />
                    : <ArrowRight size={15} color={chatInput.trim() && selectedCaseId ? 'white' : 'rgba(255,255,255,0.25)'} />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Source Detail Modal ── */}
      <AnimatePresence>
        {selectedSources && <SourceModal source={selectedSources} onClose={() => setSelectedSources(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}
