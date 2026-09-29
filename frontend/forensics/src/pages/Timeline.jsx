import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, Filter, Download, ZoomIn, ZoomOut,
  AlertTriangle, Shield, Terminal, Globe, Key,
  Activity, ChevronDown, Loader
} from 'lucide-react'
import { getCases, getTimeline } from '../api'

const typeColors = {
  danger: { bg: 'rgba(255, 82, 82, 0.08)', text: 'var(--accent-danger)', border: 'rgba(255, 82, 82, 0.2)' },
  warning: { bg: 'rgba(255, 171, 64, 0.08)', text: 'var(--accent-warning)', border: 'rgba(255, 171, 64, 0.2)' },
  success: { bg: 'rgba(0, 230, 118, 0.08)', text: 'var(--accent-success)', border: 'rgba(0, 230, 118, 0.2)' },
  info: { bg: 'rgba(99, 102, 241, 0.08)', text: 'var(--accent-primary)', border: 'rgba(99, 102, 241, 0.2)' },
  critical: { bg: 'rgba(255, 82, 82, 0.12)', text: '#ff5252', border: 'rgba(255, 82, 82, 0.3)' },
}

const typeIcons = {
  danger: Shield,
  warning: AlertTriangle,
  success: Shield,
  info: Activity,
  critical: AlertTriangle,
}

export default function Timeline() {
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [timelineData, setTimelineData] = useState([])
  const [attackAlerts, setAttackAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    getCases({ limit: 50 }).then(data => {
      const c = data.cases || []
      setCases(c)
      if (c.length > 0) setSelectedCaseId(c[0]._id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCaseId) return
    setLoading(true)
    getTimeline(selectedCaseId).then(data => {
      setTimelineData(data.dateGroups || [])
      setAttackAlerts(data.attackAlerts || [])
    }).catch(err => {
      console.error('Timeline fetch error:', err)
      setTimelineData([])
      setAttackAlerts([])
    }).finally(() => setLoading(false))
  }, [selectedCaseId])

  const filterEvents = (events) => {
    if (filterType === 'all') return events
    return events.filter(e => e.severity === filterType)
  }

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <h1 className="page-title">Timeline Reconstruction</h1>
        <p className="page-description">
          Reconstructed event timeline from parsed evidence artifacts. Select a case to view its timeline.
        </p>
      </div>

      {/* Case selector & filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-primary)',
            minWidth: 300,
          }}
        >
          <option value="">— Select a case —</option>
          {cases.map(c => (
            <option key={c._id} value={c._id}>{c.caseNumber} — {c.title}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'critical', 'danger', 'warning', 'info'].map(t => (
            <button
              key={t}
              className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {attackAlerts.length > 0 && !loading && (
        <div className="glow-card" style={{ marginBottom: 24 }}>
          <div className="glow-card-inner" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AlertTriangle size={18} style={{ color: 'var(--accent-danger)' }} />
              <div>
                <div className="section-title" style={{ fontSize: '1rem' }}>Correlated Attack Alerts</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Deterministic rules correlated events across the selected case timeline.
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              {attackAlerts.slice(0, 6).map(alert => {
                const colors = typeColors[alert.severity] || typeColors.warning
                return (
                  <div key={alert.id} style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    borderRadius: 'var(--radius-sm)',
                    padding: 12,
                  }}>
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

      {/* Timeline Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--text-muted)', gap: 10 }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading timeline...
        </div>
      ) : !selectedCaseId ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Clock size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>Select a case above to view its reconstructed timeline.</p>
        </div>
      ) : timelineData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Clock size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No timeline events found. Upload and parse evidence to build a timeline.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute', left: 12, top: 0, bottom: 0,
            width: 2, background: 'linear-gradient(180deg, var(--accent-primary), var(--accent-secondary), transparent)',
          }} />

          {timelineData.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 32 }}>
              {/* Date header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                position: 'relative',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--bg-card)', border: '2px solid var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'absolute', left: -20,
                }}>
                  <Clock size={12} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ marginLeft: 20 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700,
                    color: 'var(--text-primary)', background: 'var(--bg-card)',
                    padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-primary)',
                  }}>
                    {group.date}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                    {group.eventCount} event{group.eventCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Events */}
              {filterEvents(group.events).map((event, ei) => {
                const colors = typeColors[event.severity] || typeColors.info
                const Icon = typeIcons[event.severity] || Activity
                return (
                  <motion.div
                    key={ei}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ei * 0.04 }}
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      marginBottom: 10,
                      marginLeft: 20,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={14} style={{ color: colors.text }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{event.detail || event.eventType || 'Event'}</span>
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: colors.text,
                        background: `${colors.bg}`, padding: '2px 8px', borderRadius: 4,
                        border: `1px solid ${colors.border}`,
                      }}>
                        {event.severity || 'info'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      {event.timestamp && (() => {
                        const ts = String(event.timestamp).trim()
                        const timeStr = ts.includes(' ') ? ts.split(' ')[1]?.substring(0, 8) : ts.substring(11, 19)
                        return timeStr ? <span><Clock size={11} style={{ marginRight: 3 }} />{timeStr}</span> : null
                      })()}
                      {event.source && <span><Terminal size={11} style={{ marginRight: 3 }} />{event.source}</span>}
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
  )
}
