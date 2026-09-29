import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  FolderOpen, FileText, Shield, AlertTriangle, TrendingUp,
  TrendingDown, Clock, Upload, CheckCircle, ArrowRight,
  Activity, Database, Cpu, Eye, Loader, Bot, MessageSquare,
  Plus, Sparkles, ChevronRight, HelpCircle, X, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { getDashboardStats, getDashboardActivity, getCases } from '../api'
import { AnimatedText } from '../components/AnimatedText'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
}
const fallbackStats = [
  { label: 'Active Cases', value: '0', icon: FolderOpen, color: 'cyan', trend: 'No data yet', up: true },
  { label: 'Evidence Files', value: '0', icon: Database, color: 'purple', trend: 'Upload evidence', up: true },
  { label: 'Reports Generated', value: '0', icon: FileText, color: 'green', trend: 'Generate reports', up: true },
  { label: 'Integrity Alerts', value: '0', icon: AlertTriangle, color: 'red', trend: 'All clear', up: true },
]

/* ── Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        {payload.map((entry, i) => <div key={i} style={{ color: entry.color, fontWeight: 600 }}>{entry.name}: {entry.value}</div>)}
      </div>
    )
  }
  return null
}

/* ═══════════════════════════════════════════
   TUTORIAL MODAL (Help button)
═══════════════════════════════════════════ */
const TUTORIAL_STEPS = [
  { icon: FolderOpen, title: 'Case Management', desc: 'Navigate to Cases → New Case. Fill in the case title, description, priority level, and assign investigators. Each case gets a unique case number automatically.', shortcut: 'Go to /cases', color: '#6366f1' },
  { icon: Upload, title: 'Uploading Evidence', desc: 'Select your case first, then drag & drop files into the Evidence Upload page. Supports .log, .csv, .json, .pcap, .evtx, .xml, .txt files. SHA-256 hash is computed automatically for chain-of-custody.', shortcut: 'Go to /evidence', color: '#a78bfa' },
  { icon: Clock, title: 'Timeline Reconstruction', desc: 'After uploading evidence, visit the Timeline page. The AI parses all files and places events on a chronological timeline with severity tagging and source attribution.', shortcut: 'Go to /timeline', color: '#f59e0b' },
  { icon: Activity, title: 'Anomaly Detection', desc: 'The Anomaly Dashboard runs an ML Isolation Forest over your events and highlights suspicious patterns, unusual login times, and outlier command sequences.', shortcut: 'Go to /anomalies', color: '#f43f5e' },
  { icon: MessageSquare, title: 'Case AI Chat', desc: 'Use the RAG Chat assistant to ask plain-English questions: "Which IPs appear most?" or "Summarize privilege escalation events". The AI searches your case evidence to answer.', shortcut: 'Go to /chat', color: '#38bdf8' },
  { icon: FileText, title: 'Generating Reports', desc: 'In the Reports page, select a case and click Generate. The AI produces a full forensic report with executive summary, timeline, IOCs, MITRE mapping, and chain-of-custody appendix.', shortcut: 'Go to /reports', color: '#10b981' },
]

export function TutorialModal({ onClose }) {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const s = TUTORIAL_STEPS[step]
  const SIcon = s.icon

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: 560, width: '100%', background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 100px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            style={{ height: '100%', background: `linear-gradient(90deg, ${s.color}, ${s.color}aa)`, borderRadius: 3 }}
            animate={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div style={{ padding: '28px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SIcon size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{s.title}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Step {step + 1} of {TUTORIAL_STEPS.length}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            ><X size={16} /></button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.p key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24, minHeight: 80 }}>
              {s.desc}
            </motion.p>
          </AnimatePresence>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
            {TUTORIAL_STEPS.map((ts, i) => (
              <div key={i} onClick={() => setStep(i)} style={{ width: step === i ? 22 : 7, height: 7, borderRadius: 4, background: step === i ? s.color : 'rgba(255,255,255,0.1)', transition: 'all 0.3s', cursor: 'pointer' }} />
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setStep(i => Math.max(0, i - 1))}
              disabled={step === 0}
              style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border-primary)', background: 'none', cursor: step === 0 ? 'not-allowed' : 'pointer', color: step === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: '0.83rem', opacity: step === 0 ? 0.4 : 1, transition: 'all 0.2s' }}
            >← Previous</button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { onClose(); navigate(s.shortcut.replace('Go to ', '')) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', cursor: 'pointer', fontSize: '0.83rem', color: 'var(--accent-secondary)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
              >
                <Zap size={13} /> Try it now
              </button>
              {step < TUTORIAL_STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(i => i + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'var(--gradient-primary)', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.84rem', boxShadow: '0 4px 16px rgba(99,102,241,0.4)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.55)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)' }}
                >Next <ChevronRight size={14} /></button>
              ) : (
                <button onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'var(--gradient-primary)', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.84rem', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
                >
                  <CheckCircle size={14} /> Done!
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════ */
export default function Dashboard() {
  const [stats, setStats] = useState(fallbackStats)
  const [caseActivity, setCaseActivity] = useState([])
  const [evidenceTypes, setEvidenceTypes] = useState([{ name: 'No data', value: 1, color: '#555' }])
  const [recentCases, setRecentCases] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const isFirstTime = recentCases.length === 0 && !loading

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [dashData, casesData, activityData] = await Promise.all([
          getDashboardStats(),
          getCases({ limit: 5, sort: '-createdAt' }),
          getDashboardActivity(),
        ])
        const s = dashData.stats
        setStats([
          { label: 'Active Cases', value: String(s.activeCases || 0), icon: FolderOpen, color: 'cyan', trend: `${s.totalCases || 0} total`, up: true },
          { label: 'Evidence Files', value: String(s.totalEvidence || 0), icon: Database, color: 'purple', trend: 'Uploaded', up: true },
          { label: 'Threat Indicators', value: String(s.totalIocs || 0), icon: Shield, color: 'orange', trend: 'Across cases', up: true },
          { label: 'Critical Threats', value: String(s.criticalThreats || 0), icon: AlertTriangle, color: 'red', trend: s.criticalThreats > 0 ? 'Requires action' : 'All clear', up: s.criticalThreats === 0 },
          { label: 'Reports Generated', value: String(s.totalReports || 0), icon: FileText, color: 'green', trend: `${s.draftReports || 0} drafts`, up: true },
          { label: 'Integrity Alerts', value: String(s.integrityAlerts || 0), icon: AlertTriangle, color: 'red', trend: s.integrityAlerts > 0 ? 'Requires attention' : 'All clear', up: s.integrityAlerts === 0 },
        ])
        setCaseActivity(dashData.caseActivity || [])
        setEvidenceTypes(dashData.evidenceTypes || [{ name: 'No data', value: 1, color: '#555' }])
        const cases = (casesData.cases || []).map(c => ({
          id: c.caseNumber || c._id, _id: c._id, title: c.title,
          status: c.status, priority: c.priority,
          date: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
        }))
        setRecentCases(cases)
        setActivities(activityData.activities || [])
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  // Driver.js Tour — full professional walkthrough
  useEffect(() => {
    if (!localStorage.getItem('forensicai_tour_done')) {
      const driverObj = driver({
        showProgress: true,
        progressText: '{{current}} of {{total}}',
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.75,
        stagePadding: 8,
        popoverClass: 'driver-popover',
        nextBtnText: 'Next →',
        prevBtnText: '← Prev',
        doneBtnText: '✓ Got it',
        steps: [
          {
            element: '#tour-page-header',
            popover: {
              title: '🛡️ Welcome to ForensicAI',
              description: 'Your command center for digital forensics investigations. This tour will walk you through every feature in under 2 minutes. Use the buttons below to navigate.',
              side: 'bottom',
              align: 'start',
            }
          },
          {
            element: '#tour-stats-grid',
            popover: {
              title: '📊 Investigation KPIs',
              description: 'These cards update in real-time — tracking active cases, evidence files processed, detected threat indicators, critical flags, generated reports, and integrity alerts.',
              side: 'bottom',
              align: 'start',
            }
          },
          {
            element: '#tour-nav-cases',
            popover: {
              title: '📁 Case Management',
              description: 'Start every investigation by creating a case. Each case gets a unique case number, priority level, status tracking, and an assigned investigator. Think of it as your case file.',
              side: 'right',
              align: 'start',
            }
          },
          {
            element: '#tour-nav-evidence',
            popover: {
              title: '📂 Evidence Upload',
              description: 'Upload your forensic artifacts here — .log, .pcap, .evtx, .csv, .json, .xml files. Every file is SHA-256 hashed automatically for chain-of-custody integrity before analysis begins.',
              side: 'right',
              align: 'start',
            }
          },
          {
            element: '#tour-nav-timeline',
            popover: {
              title: '⏱️ Timeline Reconstruction',
              description: 'After uploading evidence, the AI parses and sorts all events into a chronological timeline. Each event is tagged with a source file, severity level, and MITRE tactic.',
              side: 'right',
              align: 'start',
            }
          },
          {
            element: '#tour-nav-anomalies',
            popover: {
              title: '🔍 AI Anomaly Detection',
              description: 'An ML Isolation Forest model scans your events for statistical outliers — unusual login hours, rare commands, abnormal data volumes. Suspicious clusters are highlighted automatically.',
              side: 'right',
              align: 'start',
            }
          },
          {
            element: '#tour-nav-mitre',
            popover: {
              title: '⚔️ MITRE ATT&CK Mapping',
              description: 'ForensicAI automatically maps extracted indicators to the MITRE ATT&CK framework — showing which tactics and techniques are present in your evidence so you can prioritize your response.',
              side: 'right',
              align: 'start',
            }
          },
          {
            element: '#tour-nav-chat',
            popover: {
              title: '🤖 Case AI Copilot (RAG)',
              description: 'Ask plain English questions about your evidence: "Which IP appeared most?", "List all failed logins", "Summarize privilege escalation events." The AI searches your case artifacts to answer.',
              side: 'right',
              align: 'start',
            }
          },
          {
            element: '#tour-nav-reports',
            popover: {
              title: '📄 Forensic Report Generation',
              description: 'One click generates a complete court-ready forensic report — executive summary, full event timeline, IOC table, MITRE mapping, and a SHA-256 chain-of-custody appendix. Export to PDF.',
              side: 'right',
              align: 'start',
            }
          },
        ],
        onDestroyStarted: () => {
          localStorage.setItem('forensicai_tour_done', '1')
          driverObj.destroy()
        }
      })
      setTimeout(() => driverObj.drive(), 900)
    }
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 12, color: 'var(--text-muted)' }}>
        <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        Loading dashboard...
      </div>
    )
  }

  return (
    <motion.div className="page-enter" variants={container} initial="hidden" animate="show">

      {/* ── Page Header ── */}
      <motion.div id="tour-page-header" className="page-header" variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Investigation Dashboard</h1>
          <p className="page-description">Overview of your digital forensics investigations, evidence, and AI reporting.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowTutorial(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border-primary)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-primary)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = 'var(--accent-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <HelpCircle size={15} /> Help & Tutorial
          </button>
          <Link to="/chat" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={16} /> AI Chat Assistant
          </Link>
        </div>
      </motion.div>

      {/* ── First-time onboarding banner ── */}
      <AnimatePresence>
        {isFirstTime && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ marginBottom: '32px' }}>
            <AnimatedText text="Welcome to ForensicAI 👋" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Grid ── */}
      <motion.div id="tour-stats-grid" className="stats-grid" variants={container} initial="hidden" animate="show">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div className="glow-card" key={i} variants={item}>
              <div className="glow-card-inner">
                <div className={`stat-card-icon ${stat.color}`}><Icon size={22} /></div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className={`stat-trend ${stat.up ? 'up' : 'down'}`}>
                  {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Charts ── */}
      <motion.div className="grid-2-1" style={{ marginBottom: 28 }} variants={item}>
        <div className="chart-container">
          <div className="section-header">
            <div>
              <div className="section-title">Case Activity</div>
              <div className="section-subtitle">Cases opened and reports generated over time</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={caseActivity}>
              <defs>
                <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="#4a4870" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#4a4870" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cases" name="Cases" stroke="#6366f1" fillOpacity={1} fill="url(#colorCases)" strokeWidth={2} />
              <Area type="monotone" dataKey="reports" name="Reports" stroke="#a78bfa" fillOpacity={1} fill="url(#colorReports)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <div className="section-header">
            <div>
              <div className="section-title">Evidence Types</div>
              <div className="section-subtitle">Distribution by category</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={evidenceTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4} strokeWidth={0}>
                {evidenceTypes.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {evidenceTypes.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color, display: 'inline-block' }} />
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Recent Cases & Activity ── */}
      <motion.div className="grid-2-1" variants={item}>
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Recent Cases</div>
              <div className="section-subtitle">Latest forensic investigations</div>
            </div>
            <Link to="/cases" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Case ID</th><th>Title</th><th>Status</th><th>Priority</th></tr></thead>
              <tbody>
                {recentCases.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div style={{ textAlign: 'center', padding: '28px 20px' }}>
                        <FolderOpen size={28} style={{ color: 'var(--accent-primary)', opacity: 0.5, marginBottom: 10 }} />
                        <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>No cases yet</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 14 }}>Create your first investigation case to get started.</div>
                        <Link to="/cases" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Plus size={13} /> Create First Case
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentCases.map(c => (
                    <tr key={c.id}>
                      <td><Link to={`/cases/${c._id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{c.id}</Link></td>
                      <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                      <td><span className={`status-badge ${c.status}`}>{c.status}</span></td>
                      <td><span className={`tag ${c.priority === 'critical' || c.priority === 'high' ? 'cyan' : ''}`}>{c.priority}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Activity Feed</div>
              <div className="section-subtitle">Recent system activity</div>
            </div>
          </div>
          <div className="glow-card">
            <div className="glow-card-inner" style={{ padding: '16px 20px' }}>
              {activities.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20, fontSize: '0.83rem' }}>No activity yet. Actions will appear here.</div>
              ) : (
                activities.map((a, i) => (
                  <div className="activity-item" key={i}>
                    <div className="activity-avatar">
                      {a.user}
                    </div>
                    <div className="activity-content">
                      <div className="activity-text"><strong>{a.user === 'AI' ? 'AI Engine' : a.user === 'SYS' ? 'System' : a.user}</strong> {a.text}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating AI button */}
      <Link to="/chat" style={{ position: 'fixed', bottom: 24, right: 24, width: 50, height: 50, borderRadius: '50%', background: 'var(--gradient-primary)', boxShadow: '0 4px 20px rgba(99,102,241,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 99, transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.65)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.45)' }}
        title="Query Case AI Copilot"
      ><Bot size={24} /></Link>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}
