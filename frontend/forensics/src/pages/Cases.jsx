import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Filter, FolderOpen, Calendar,
  User, MoreVertical, ArrowUpRight, X, ChevronDown, Loader, Lock
} from 'lucide-react'
import { getCases, createCase as apiCreateCase } from '../api'
import { useAuth } from '../context/AuthContext'

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
}

// Fallback cases (1 closed, 1 active) when API fails
const fallbackCases = [
  {
    _id: 'fallback-1',
    caseNumber: 'FR-2026-0001',
    title: 'Ransomware Recovery — Healthcare System',
    status: 'closed',
    priority: 'critical',
    assigneeName: 'Vinay T.',
    createdAt: '2026-02-14T00:00:00Z',
    evidence: Array(31),
    progress: 100,
  },
  {
    _id: 'fallback-2',
    caseNumber: 'FR-2026-0002',
    title: 'Network Intrusion — Corp Server Alpha',
    status: 'active',
    priority: 'high',
    assigneeName: 'Vinay T.',
    createdAt: '2026-02-21T00:00:00Z',
    evidence: Array(8),
    progress: 35,
  },
]

export default function Cases() {
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [creating, setCreating] = useState(false)

  // Form fields
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState('medium')

  const fetchCases = async () => {
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (searchTerm) params.search = searchTerm
      const data = await getCases(params)
      setCases(data.cases || [])
    } catch (err) {
      console.error('Failed to fetch cases:', err)
      setCases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCases() }, [statusFilter, searchTerm])

  const handleCreateCase = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await apiCreateCase({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
      })
      setShowModal(false)
      setNewTitle('')
      setNewDesc('')
      setNewPriority('medium')
      await fetchCases()
    } catch (err) {
      console.error('Failed to create case:', err)
      alert('Failed to create case: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Case Management</h1>
          <p className="page-description">Create, manage, and track digital forensic investigation cases.</p>
        </div>
        {!isViewer && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="create-case-btn">
            <Plus size={16} /> New Case
          </button>
        )}
        {isViewer && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600,
            color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', padding: '6px 12px',
          }}>
            <Lock size={12} /> View Only Access
          </span>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="header-search" style={{ flex: 1, minWidth: 250 }}>
          <Search />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="case-search"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'active', 'review', 'draft', 'closed'].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--text-muted)', gap: 10 }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading cases...
        </div>
      ) : (
        <motion.div className="data-table-wrapper" variants={item}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Evidence</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    No cases found. Create your first case to get started.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link to={`/cases/${c._id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                        {c.caseNumber || c._id}
                      </Link>
                    </td>
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {c.title}
                    </td>
                    <td><span className={`status-badge ${c.status}`}>{c.status}</span></td>
                    <td>
                      <span className={`tag ${c.priority === 'critical' ? 'cyan' : c.priority === 'high' ? 'purple' : ''}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={14} /> {c.assigneeName || 'Unassigned'}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.evidence?.length || 0}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''}
                    </td>
                    <td>
                      <Link to={`/cases/${c._id}`} className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }}>
                        <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Create Case Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Case</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} disabled={creating}>
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Case Title *</label>
              <input
                className="form-input"
                placeholder="e.g., Network Intrusion Investigation"
                id="case-title-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the investigation scope, initial findings, and objectives..."
                id="case-desc-input"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  id="case-priority-select"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <div className="form-input" style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-elevated)', cursor: 'default', opacity: 0.85,
                }}>
                  <User size={14} style={{ color: 'var(--accent-primary)' }} />
                  {user?.name || 'You'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={creating}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateCase}
                id="create-case-submit"
                disabled={!newTitle.trim() || creating}
                style={{ opacity: newTitle.trim() && !creating ? 1 : 0.5 }}
              >
                {creating ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Plus size={16} /> Create Case</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
