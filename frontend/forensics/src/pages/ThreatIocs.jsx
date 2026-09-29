import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Globe, Shield, Activity, ShieldAlert, ShieldCheck,
  Search, Copy, Check, ExternalLink, AlertTriangle,
  Loader, RefreshCw, Database, Key, Info
} from 'lucide-react'
import { getThreatIocs, getHealthStatus } from '../api'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
}

export default function ThreatIocs() {
  const [iocs, setIocs] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedValue, setCopiedValue] = useState('')
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    
    try {
      const [iocsRes, healthRes] = await Promise.all([
        getThreatIocs(),
        getHealthStatus()
      ])
      setIocs(iocsRes.iocs || [])
      setHealth(healthRes)
    } catch (err) {
      console.error('Threat IOCs load error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCopy = (value) => {
    navigator.clipboard.writeText(value)
    setCopiedValue(value)
    setTimeout(() => setCopiedValue(''), 1500)
  }

  // Filtered IOCs list
  const filteredIocs = iocs.filter(ioc => {
    const matchesSearch = 
      String(ioc.value).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(ioc.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(ioc.caseTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(ioc.caseNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(ioc.evidenceName || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || ioc.type === filterType
    
    let matchesSeverity = true
    if (filterSeverity === 'critical') matchesSeverity = ioc.score >= 90
    else if (filterSeverity === 'high') matchesSeverity = ioc.score >= 70 && ioc.score < 90
    else if (filterSeverity === 'medium') matchesSeverity = ioc.score >= 40 && ioc.score < 70
    else if (filterSeverity === 'low') matchesSeverity = ioc.score < 40

    return matchesSearch && matchesType && matchesSeverity
  })

  // Aggregated Stats
  const totalCount = iocs.length
  const criticalCount = iocs.filter(i => i.score >= 90).length
  const ipCount = iocs.filter(i => i.type === 'IP Reputation').length
  const hashCount = iocs.filter(i => i.type === 'Malware Hash').length

  const getScoreColorClass = (score) => {
    if (score >= 90) return { text: '#ff5252', bg: 'rgba(255, 82, 82, 0.1)', border: 'rgba(255, 82, 82, 0.25)', label: 'Critical' }
    if (score >= 70) return { text: '#ffab40', bg: 'rgba(255, 171, 64, 0.1)', border: 'rgba(255, 171, 64, 0.25)', label: 'High' }
    if (score >= 40) return { text: '#ffff00', bg: 'rgba(255, 255, 0, 0.08)', border: 'rgba(255, 255, 0, 0.2)', label: 'Medium' }
    return { text: '#00e676', bg: 'rgba(0, 230, 118, 0.08)', border: 'rgba(0, 230, 118, 0.2)', label: 'Low' }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 16, color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1.5s linear infinite' }} />
        <span>Aggregating threat indicators and query states...</span>
      </div>
    )
  }

  const isAbuseIpDbActive = health?.threatIntel?.abuseIpDbConfigured
  const isVirusTotalActive = health?.threatIntel?.virusTotalConfigured

  return (
    <motion.div className="page-enter" variants={container} initial="hidden" animate="show">
      {/* Page Header */}
      <motion.div className="page-header" variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 className="page-title">Threat Indicators (IOCs)</h1>
          <p className="page-description">
            Global consolidated database of malicious indicators parsed from evidence artifacts, corroborated with threat feeds.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => fetchData(true)} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh Feed
          </button>
        </div>
      </motion.div>

      {/* Integration Badges Board */}
      <motion.div variants={item} style={{ marginBottom: 28 }}>
        <div className="glow-card" style={{ background: 'rgba(10, 10, 18, 0.45)', border: '1px solid var(--border-primary)' }}>
          <div className="glow-card-inner" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Key size={18} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>External Threat Intelligence Integrations</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active API endpoints query threat databases in real time</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {/* AbuseIPDB config badge */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '6px 12px', 
                borderRadius: 'var(--radius-sm)',
                background: isAbuseIpDbActive ? 'rgba(0, 230, 118, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                border: isAbuseIpDbActive ? '1px solid rgba(0, 230, 118, 0.25)' : '1px solid var(--border-primary)',
              }}>
                <span className={`pulse-dot ${isAbuseIpDbActive ? 'success' : ''}`} style={{ 
                  width: 7, 
                  height: 7, 
                  borderRadius: '50%', 
                  background: isAbuseIpDbActive ? 'var(--accent-success)' : '#666',
                  display: 'inline-block',
                  boxShadow: isAbuseIpDbActive ? '0 0 10px var(--accent-success)' : 'none'
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>AbuseIPDB IP Feed:</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 6px', 
                  borderRadius: 4, 
                  background: isAbuseIpDbActive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: isAbuseIpDbActive ? 'var(--accent-success)' : 'var(--text-muted)' 
                }}>
                  {isAbuseIpDbActive ? 'Active / Real-Time Check' : 'Local Fallback Simulation'}
                </span>
              </div>

              {/* VirusTotal config badge */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '6px 12px', 
                borderRadius: 'var(--radius-sm)',
                background: isVirusTotalActive ? 'rgba(0, 230, 118, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                border: isVirusTotalActive ? '1px solid rgba(0, 230, 118, 0.25)' : '1px solid var(--border-primary)',
              }}>
                <span className={`pulse-dot ${isVirusTotalActive ? 'success' : ''}`} style={{ 
                  width: 7, 
                  height: 7, 
                  borderRadius: '50%', 
                  background: isVirusTotalActive ? 'var(--accent-success)' : '#666',
                  display: 'inline-block',
                  boxShadow: isVirusTotalActive ? '0 0 10px var(--accent-success)' : 'none'
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>VirusTotal File Sandbox:</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 6px', 
                  borderRadius: 4, 
                  background: isVirusTotalActive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: isVirusTotalActive ? 'var(--accent-success)' : 'var(--text-muted)' 
                }}>
                  {isVirusTotalActive ? 'Active / Real-Time Check' : 'Local Fallback Simulation'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <motion.div className="stats-grid" variants={container} initial="hidden" animate="show" style={{ marginBottom: 28 }}>
        <motion.div className="glow-card" variants={item}>
          <div className="glow-card-inner">
            <div className="stat-card-icon cyan">
              <Database size={20} />
            </div>
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total Detected IOCs</div>
            <div className="stat-trend up" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Info size={11} /> Aggregated from all case logs
            </div>
          </div>
        </motion.div>

        <motion.div className="glow-card" variants={item}>
          <div className="glow-card-inner">
            <div className="stat-card-icon red">
              <ShieldAlert size={20} />
            </div>
            <div className="stat-value" style={{ color: criticalCount > 0 ? '#ff5252' : 'inherit' }}>{criticalCount}</div>
            <div className="stat-label">Critical Threat Flags</div>
            <div className="stat-trend down" style={{ color: criticalCount > 0 ? '#ff5252' : 'var(--accent-success)' }}>
              {criticalCount > 0 ? 'Threat score exceeds 90' : 'No critical flags detected'}
            </div>
          </div>
        </motion.div>

        <motion.div className="glow-card" variants={item}>
          <div className="glow-card-inner">
            <div className="stat-card-icon purple">
              <Globe size={20} />
            </div>
            <div className="stat-value">{ipCount}</div>
            <div className="stat-label">IP Reputation Mappings</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              Public address blocks tracked
            </div>
          </div>
        </motion.div>

        <motion.div className="glow-card" variants={item}>
          <div className="glow-card-inner">
            <div className="stat-card-icon green">
              <ShieldCheck size={20} />
            </div>
            <div className="stat-value">{hashCount}</div>
            <div className="stat-label">Malware Hashes Tagged</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              Unique malware file fingerprints
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filter and Table Container */}
      <motion.div className="chart-container" variants={item} style={{ padding: 0 }}>
        {/* Filters Header Bar */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--border-primary)', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 12, 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 280, maxWidth: 450 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search indicator, details, case number, or logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-primary)',
                  transition: 'border 0.2s',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Indicator Type</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Types</option>
                <option value="IP Reputation">IP Reputation</option>
                <option value="Malware Hash">Malware Hash</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Severity</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical (90+)</option>
                <option value="high">High (70-89)</option>
                <option value="medium">Medium (40-69)</option>
                <option value="low">Low (&lt; 40)</option>
              </select>
            </div>
          </div>
        </div>

        {/* IOC Data Table */}
        <div className="data-table-wrapper" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Indicator Value</th>
                <th style={{ width: '15%' }}>Type</th>
                <th style={{ width: '12%' }}>Severity</th>
                <th style={{ width: '25%' }}>Corroborated Details</th>
                <th style={{ width: '20%' }}>Origin Case</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredIocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                      <AlertTriangle size={30} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <div>No threat indicators found matching your filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredIocs.map((ioc, idx) => {
                    const sev = getScoreColorClass(ioc.score)
                    const isCopied = copiedValue === ioc.value

                    return (
                      <motion.tr
                        key={`${ioc.type}-${ioc.value}-${ioc.caseId}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Indicator details & copy indicator */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span 
                              style={{ 
                                fontFamily: 'var(--font-mono)', 
                                fontSize: '0.8rem', 
                                color: 'var(--text-primary)', 
                                fontWeight: 500,
                                background: 'rgba(255,255,255,0.03)',
                                padding: '3px 8px',
                                borderRadius: 4,
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'inline-block',
                                maxWidth: '180px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}
                              title={ioc.value}
                            >
                              {ioc.value}
                            </span>
                            <button
                              onClick={() => handleCopy(ioc.value)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: isCopied ? 'var(--accent-success)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s, background 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              title={isCopied ? 'Copied value!' : 'Copy to clipboard'}
                            >
                              {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>

                        {/* Indicator Type */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                            {ioc.type === 'IP Reputation' ? (
                              <Globe size={13} style={{ color: 'var(--accent-primary)' }} />
                            ) : (
                              <Database size={13} style={{ color: 'var(--accent-secondary)' }} />
                            )}
                            <span style={{ color: 'var(--text-secondary)' }}>{ioc.type}</span>
                          </div>
                        </td>

                        {/* Severity Score */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: sev.text,
                              background: sev.bg,
                              border: `1px solid ${sev.border}`,
                              padding: '2px 8px',
                              borderRadius: 4,
                              minWidth: 56,
                              textAlign: 'center'
                            }}>
                              {sev.label}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {ioc.score}%
                            </span>
                          </div>
                        </td>

                        {/* Threat Details */}
                        <td>
                          <div style={{ 
                            fontSize: '0.78rem', 
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                            maxWidth: 320,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={ioc.details}>
                            {ioc.details || 'No additional sandbox context available.'}
                          </div>
                        </td>

                        {/* Case & Evidence links */}
                        <td>
                          {ioc.caseId ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Link 
                                to={`/cases/${ioc.caseId}`} 
                                style={{ 
                                  fontSize: '0.78rem', 
                                  color: 'var(--accent-primary)', 
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                              >
                                {ioc.caseNumber} <ExternalLink size={10} />
                              </Link>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {ioc.evidenceName}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>N/A</span>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Table footer count */}
        <div style={{ 
          padding: '12px 20px', 
          borderTop: '1px solid var(--border-primary)', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Showing {filteredIocs.length} of {totalCount} threat indicators</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
