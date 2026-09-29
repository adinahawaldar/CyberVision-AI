import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Database,
  Loader,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
  Zap,
} from 'lucide-react'
import { getAnomalies, getCases } from '../api'

const scorePalette = {
  critical: { label: 'Critical', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.1)', border: 'rgba(255, 82, 82, 0.28)' },
  high: { label: 'High', color: '#ffab40', bg: 'rgba(255, 171, 64, 0.1)', border: 'rgba(255, 171, 64, 0.25)' },
  medium: { label: 'Medium', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.25)' },
  low: { label: 'Low', color: '#00e676', bg: 'rgba(0, 230, 118, 0.08)', border: 'rgba(0, 230, 118, 0.2)' },
}

function scoreBand(score = 0) {
  if (score >= 90) return scorePalette.critical
  if (score >= 75) return scorePalette.high
  if (score >= 50) return scorePalette.medium
  return scorePalette.low
}

function StatCard({ icon: Icon, value, label, note, tone = 'cyan' }) {
  return (
    <motion.div className="glow-card">
      <div className="glow-card-inner">
        <div className={`stat-card-icon ${tone}`}>
          <Icon size={20} />
        </div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {note && (
          <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
            {note}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function EmptyState({ selectedCaseId }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-muted)' }}>
      <BrainCircuit size={42} style={{ opacity: 0.35, marginBottom: 12 }} />
      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
        {selectedCaseId ? 'No ML anomalies detected' : 'Select a case to review anomalies'}
      </div>
      <div style={{ fontSize: '0.82rem' }}>
        {selectedCaseId ? 'The Isolation Forest pass completed without outlier events.' : 'Choose a case from the selector above.'}
      </div>
    </div>
  )
}

export default function AnomalyDashboard() {
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [summary, setSummary] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [attackAlerts, setAttackAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    getCases({ limit: 50 }).then(data => {
      const caseList = data.cases || []
      setCases(caseList)
      if (caseList.length > 0) setSelectedCaseId(caseList[0]._id)
    }).catch(err => {
      setError(err.message || 'Unable to load cases')
      setLoading(false)
    })
  }, [])

  const loadAnomalies = async (silent = false) => {
    if (!selectedCaseId) {
      setSummary(null)
      setAnomalies([])
      setAttackAlerts([])
      setLoading(false)
      return
    }

    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const data = await getAnomalies({ caseId: selectedCaseId, limit: 100 })
      setSummary(data.summary || null)
      setAnomalies(data.anomalies || [])
      setAttackAlerts(data.attackAlerts || [])
    } catch (err) {
      setError(err.message || 'Unable to load anomalies')
      setSummary(null)
      setAnomalies([])
      setAttackAlerts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnomalies()
  }, [selectedCaseId])

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(item => {
      const haystack = [
        item.detail,
        item.eventType,
        item.source,
        item.host,
        item.user,
        item.sourceIp,
        item.destinationIp,
        item.evidenceName,
        item.mitreAttack?.techniqueId,
        item.mitreAttack?.techniqueName,
      ].join(' ').toLowerCase()

      const matchesSearch = haystack.includes(searchTerm.toLowerCase())
      const band = scoreBand(item.mlScore).label.toLowerCase()
      const matchesScore = scoreFilter === 'all' || scoreFilter === band
      return matchesSearch && matchesScore
    })
  }, [anomalies, searchTerm, scoreFilter])

  const buckets = summary?.scoreBuckets || { critical: 0, high: 0, medium: 0, low: 0 }
  const maxBucket = Math.max(1, ...Object.values(buckets))
  const modelStatus = summary?.status || 'pending'

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Anomaly Dashboard</h1>
          <p className="page-description">
            Isolation Forest outliers and rule-correlated attack alerts for the selected case.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => loadAnomalies(true)} disabled={refreshing || !selectedCaseId}>
          <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
        <select
          value={selectedCaseId}
          onChange={(event) => setSelectedCaseId(event.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-primary)',
            minWidth: 320,
          }}
        >
          <option value="">Select a case</option>
          {cases.map(item => (
            <option key={item._id} value={item._id}>{item.caseNumber} - {item.title}</option>
          ))}
        </select>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-primary)',
          background: 'rgba(255, 255, 255, 0.03)',
          color: modelStatus === 'completed' ? 'var(--accent-success)' : 'var(--text-muted)',
          fontSize: '0.78rem',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: modelStatus === 'completed' ? 'var(--accent-success)' : 'var(--text-muted)',
            boxShadow: modelStatus === 'completed' ? '0 0 10px var(--accent-success)' : 'none',
          }} />
          {modelStatus}
        </div>
      </div>

      {error && (
        <div style={{
          border: '1px solid rgba(255, 82, 82, 0.25)',
          background: 'rgba(255, 82, 82, 0.08)',
          color: 'var(--accent-danger)',
          borderRadius: 'var(--radius-sm)',
          padding: 12,
          marginBottom: 20,
          fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon={Database} value={summary?.totalEvents ?? 0} label="Timeline Events Scanned" note={`${summary?.totalEvidence ?? 0} evidence files`} tone="cyan" />
        <StatCard icon={BrainCircuit} value={summary?.anomaliesDetected ?? 0} label="ML Anomalies" note={summary?.model || 'Isolation Forest'} tone="purple" />
        <StatCard icon={ShieldAlert} value={summary?.totalAttackAlerts ?? 0} label="Rule Alerts" note="MITRE-aware correlation" tone="red" />
        <StatCard icon={Target} value={summary?.contamination ?? '0.15'} label="Contamination Target" note="Model sensitivity" tone="green" />
      </div>

      <div className="anomaly-dashboard-grid">
        <div className="chart-container" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div>
              <div className="section-title" style={{ fontSize: '1rem' }}>ML Outlier Events</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Showing {filteredAnomalies.length} of {anomalies.length} detected anomalies
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: 260 }}>
                <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search outliers"
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                  }}
                />
              </div>
              <select
                value={scoreFilter}
                onChange={(event) => setScoreFilter(event.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                }}
              >
                <option value="all">All Scores</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--text-muted)', gap: 10 }}>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Running anomaly pass...
            </div>
          ) : filteredAnomalies.length === 0 ? (
            <EmptyState selectedCaseId={selectedCaseId} />
          ) : (
            <div className="data-table-wrapper" style={{ maxHeight: 620, overflow: 'auto', border: 0, borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Timestamp</th>
                    <th style={{ width: '12%' }}>ML Score</th>
                    <th style={{ width: '14%' }}>Event</th>
                    <th style={{ width: '16%' }}>Source</th>
                    <th style={{ width: '31%' }}>Observation</th>
                    <th style={{ width: '12%' }}>Technique</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnomalies.map((item, index) => {
                    const band = scoreBand(item.mlScore)
                    return (
                      <tr key={`${item.timestamp}-${item.detail}-${index}`}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown'}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            minWidth: 74,
                            justifyContent: 'center',
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: band.bg,
                            border: `1px solid ${band.border}`,
                            color: band.color,
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '0.76rem',
                          }}>
                            {Math.round(item.mlScore)} / 100
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.eventType || 'system'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{Math.round(item.confidence || 0)}% confidence</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{item.source || item.host || 'Unknown source'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {item.sourceIp || item.destinationIp || item.evidenceName || 'No address'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', lineHeight: 1.45, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            {item.detail || 'No event detail available'}
                          </div>
                          {item.reasons?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {item.reasons.slice(0, 2).map(reason => (
                                <span key={reason} className="tag purple">{reason}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          {item.mitreAttack?.techniqueId ? (
                            <span className="tag cyan">{item.mitreAttack.techniqueId}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unmapped</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="chart-container" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
              <div className="section-title" style={{ fontSize: '1rem' }}>Score Distribution</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(scorePalette).map(([key, meta]) => {
                const count = buckets[key] || 0
                const width = `${Math.max(4, (count / maxBucket) * 100)}%`
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.76rem' }}>
                      <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width, height: '100%', background: meta.color, borderRadius: 4, opacity: 0.85 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="chart-container" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AlertTriangle size={18} style={{ color: 'var(--accent-warning)' }} />
              <div>
                <div className="section-title" style={{ fontSize: '1rem' }}>Correlated Alerts</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{attackAlerts.length} deterministic rule matches</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {attackAlerts.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '16px 0' }}>
                  No correlated attack alerts for this case.
                </div>
              ) : attackAlerts.slice(0, 6).map(alert => (
                <div key={alert.id} style={{
                  border: '1px solid rgba(255, 171, 64, 0.18)',
                  background: 'rgba(255, 171, 64, 0.06)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                    <strong style={{ fontSize: '0.82rem' }}>{alert.title}</strong>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-warning)', fontSize: '0.72rem' }}>{alert.riskScore}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', lineHeight: 1.45 }}>{alert.description}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="tag cyan">{alert.mitreAttack?.techniqueId || alert.ruleId}</span>
                    <span className="tag">{alert.eventCount} events</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
