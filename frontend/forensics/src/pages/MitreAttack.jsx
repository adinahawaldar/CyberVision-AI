import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Loader, AlertTriangle, Target, Crosshair } from 'lucide-react'
import { getCases, getCase } from '../api'

const TACTIC_ORDER = [
  'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
  'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
  'Collection', 'Command and Control', 'Exfiltration', 'Impact',
  'Defense Evasion / Persistence',
]

const TACTIC_COLORS = {
  'Initial Access': '#f59e0b',
  'Execution': '#ef4444',
  'Persistence': '#8b5cf6',
  'Privilege Escalation': '#ec4899',
  'Defense Evasion': '#6366f1',
  'Credential Access': '#f97316',
  'Discovery': '#14b8a6',
  'Lateral Movement': '#06b6d4',
  'Collection': '#84cc16',
  'Command and Control': '#e11d48',
  'Exfiltration': '#dc2626',
  'Impact': '#991b1b',
  'Defense Evasion / Persistence': '#7c3aed',
}

export default function MitreAttack() {
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCases({ limit: 50 }).then(data => {
      const c = data.cases || []
      setCases(c)
      if (c.length > 0) setSelectedCaseId(c[0]._id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCaseId) { setEvidence([]); return }
    setLoading(true)
    getCase(selectedCaseId).then(data => {
      setEvidence(data.evidence || [])
    }).catch(err => {
      console.error('MITRE fetch error:', err)
      setEvidence([])
    }).finally(() => setLoading(false))
  }, [selectedCaseId])

  // Extract all MITRE mappings from evidence
  const tacticMap = {}
  let totalMatches = 0
  evidence.forEach(ev => {
    if (ev.parsedData?.events) {
      ev.parsedData.events.forEach(e => {
        if (e.mitreAttack?.techniqueId) {
          const tactic = e.mitreAttack.tactic || 'Unknown'
          if (!tacticMap[tactic]) tacticMap[tactic] = {}
          const tid = e.mitreAttack.techniqueId
          if (!tacticMap[tactic][tid]) {
            tacticMap[tactic][tid] = {
              id: tid,
              name: e.mitreAttack.techniqueName,
              count: 0,
              severities: [],
            }
          }
          tacticMap[tactic][tid].count++
          if (e.severity) tacticMap[tactic][tid].severities.push(e.severity)
          totalMatches++
        }
      })
    }
  })

  const sortedTactics = Object.keys(tacticMap).sort((a, b) => {
    const ai = TACTIC_ORDER.indexOf(a)
    const bi = TACTIC_ORDER.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const hasData = sortedTactics.length > 0
  const uniqueTechniques = Object.values(tacticMap).reduce((sum, t) => sum + Object.keys(t).length, 0)

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <h1 className="page-title">MITRE ATT&CK Matrix</h1>
        <p className="page-description">
          Cross-evidence correlation mapping threat activity to tactics and techniques. Select a case below to analyze.
        </p>
      </div>

      {/* Case Selector */}
      <div style={{ marginBottom: 24 }}>
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
      </div>

      {/* Summary Stats */}
      {hasData && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Tactics Detected', value: sortedTactics.length, icon: Shield, color: '#8b5cf6' },
            { label: 'Techniques Matched', value: uniqueTechniques, icon: Target, color: '#06b6d4' },
            { label: 'Total Matches', value: totalMatches, icon: Crosshair, color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} className="glow-card" style={{ flex: 1, minWidth: 160 }}>
              <div className="glow-card-inner" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* MITRE Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--text-muted)', gap: 10 }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading MITRE ATT&CK matrix...
        </div>
      ) : !selectedCaseId ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Shield size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>Select a case above to visualize threat mapping.</p>
        </div>
      ) : evidence.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Shield size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No evidence files found in this case. Upload logs to see MITRE mappings.</p>
        </div>
      ) : !hasData ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <AlertTriangle size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>Evidence found but no MITRE ATT&CK techniques were detected. The evidence may still be processing — try refreshing.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(220px, 1fr))`,
          gap: 16,
        }}>
          {sortedTactics.map((tactic, ti) => {
            const techniques = Object.values(tacticMap[tactic])
            const color = TACTIC_COLORS[tactic] || '#6366f1'
            return (
              <motion.div key={ti}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ti * 0.05 }}
                className="glow-card"
                style={{ overflow: 'hidden' }}
              >
                <div className="glow-card-inner" style={{ padding: 0 }}>
                  {/* Tactic Header */}
                  <div style={{
                    padding: '14px 16px',
                    background: `${color}12`,
                    borderBottom: `2px solid ${color}40`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: color,
                      boxShadow: `0 0 8px ${color}80`,
                    }} />
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      {tactic}
                    </div>
                  </div>

                  {/* Techniques */}
                  <div style={{ padding: '8px 0' }}>
                    {techniques.map((tech, tei) => {
                      const hasCritical = tech.severities.includes('critical')
                      const hasDanger = tech.severities.includes('danger')
                      return (
                        <div key={tei} style={{
                          padding: '10px 16px',
                          borderBottom: tei < techniques.length - 1 ? '1px solid var(--border-primary)' : 'none',
                          transition: 'background 0.15s',
                          cursor: 'default',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = `${color}08`}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{
                              fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                              color, fontWeight: 700, letterSpacing: '0.02em',
                            }}>
                              {tech.id}
                            </span>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700,
                              padding: '2px 8px', borderRadius: 20,
                              background: hasCritical ? 'rgba(220,38,38,0.15)' : hasDanger ? 'rgba(239,68,68,0.1)' : `${color}15`,
                              color: hasCritical ? '#dc2626' : hasDanger ? '#ef4444' : color,
                            }}>
                              {tech.count} hit{tech.count > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.78rem', color: 'var(--text-secondary)',
                            marginTop: 3, fontWeight: 500, lineHeight: 1.35,
                          }}>
                            {tech.name}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
