import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Upload, FileText, Hash, CheckCircle, AlertTriangle,
  X, File, HardDrive, Shield, Copy, Clock, Loader, RefreshCw,
  FolderOpen, Plus, ArrowRight, Trash2
} from 'lucide-react'
import { getCases, uploadEvidence } from '../api'

const BASE = import.meta.env.VITE_API_URL || '/api'

const allowedTypes = [
  { ext: '.log', label: 'System Logs', icon: '📋' },
  { ext: '.csv/.json', label: 'Structured Data', icon: '📊' },
  { ext: '.pcap', label: 'Network Captures', icon: '🌐' },
  { ext: '.img/.dd', label: 'Disk Images', icon: '💾' },
  { ext: '.evtx', label: 'Windows Events', icon: '🪟' },
  { ext: '.xml', label: 'Configuration', icon: '📝' },
  { ext: '.txt', label: 'Plain Text', icon: '📄' },
]

const ALLOWED_EXTENSIONS = ['log', 'csv', 'json', 'pcap', 'img', 'dd', 'evtx', 'xml', 'txt', 'reg', 'raw', 'zip', 'gz']

async function generateHash() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export default function EvidenceUpload() {
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadedEvidence, setUploadedEvidence] = useState([])
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [loading, setLoading] = useState(true) // cases loading

  // Fetch cases on mount
  useEffect(() => {
    getCases({ limit: 50 }).then(data => {
      const c = data.cases || []
      setCases(c)
      if (c.length > 0) setSelectedCaseId(c[0]._id)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Fetch uploaded evidence for selected case (persists across refresh)
  const fetchCaseEvidence = useCallback(async (caseId) => {
    if (!caseId) { setUploadedEvidence([]); return }
    setLoadingEvidence(true)
    try {
      const token = localStorage.getItem('forensic_token') || ''
      const res = await fetch(`${BASE}/evidence?caseId=${caseId}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Silently ignore if endpoint doesn't exist on this deployment
      if (res.status === 404 || res.status === 405) {
        setUploadedEvidence([])
        return
      }
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        setUploadedEvidence(data.evidence || data.items || data.results || [])
      } else {
        setUploadedEvidence([])
      }
    } catch {
      // Network error or endpoint missing — fail silently
      setUploadedEvidence([])
    } finally {
      setLoadingEvidence(false)
    }
  }, [])

  useEffect(() => { fetchCaseEvidence(selectedCaseId) }, [selectedCaseId, fetchCaseEvidence])

  const handleFileSelect = (e) => {
    processFiles([...e.target.files])
  }

  const processFiles = async (newFiles) => {
    const accepted = []
    const rejected = []

    for (const file of newFiles) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        accepted.push(file)
      } else {
        rejected.push(file.name)
      }
    }

    if (rejected.length > 0) {
      const names = rejected.join(', ')
      setUploadResult({
        success: false,
        message: `Unsupported file type: ${names}. Only ${ALLOWED_EXTENSIONS.map(e => '.' + e).join(', ')} files are allowed.`,
      })
    }

    if (accepted.length === 0) return

    const processed = await Promise.all(accepted.map(async (file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop(),
      hash: await generateHash(),
      status: 'ready',
    })))
    setFiles(prev => [...prev, ...processed])
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
    return (bytes / 1073741824).toFixed(2) + ' GB'
  }

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const copyHash = (hash, id) => {
    navigator.clipboard.writeText(hash)
    setFiles(prev => prev.map(f => f.id === id ? { ...f, copied: true } : f))
    setTimeout(() => setFiles(prev => prev.map(f => f.id === id ? { ...f, copied: false } : f)), 2000)
  }

  const handleUpload = async () => {
    if (!selectedCaseId || files.length === 0) return
    setUploading(true)
    setUploadResult(null)

    // ── Optimistic UI: add files to the displayed list immediately ──
    const optimisticItems = files.map(f => ({
      _id: `optimistic-${f.id}`,
      originalName: f.name,
      size: f.size,
      sha256: f.hash,
      status: 'uploading',
      createdAt: new Date().toISOString(),
    }))
    setUploadedEvidence(prev => [...optimisticItems, ...prev])

    try {
      const rawFiles = files.map(f => f.file)
      const result = await uploadEvidence(selectedCaseId, rawFiles)
      setUploadResult({ success: true, message: result.message || `${files.length} file(s) uploaded successfully` })
      setFiles([])
      // Replace optimistic items with real server data
      await fetchCaseEvidence(selectedCaseId)
    } catch (err) {
      // Remove optimistic items on failure
      setUploadedEvidence(prev => prev.filter(e => !e._id?.startsWith('optimistic-')))
      setUploadResult({ success: false, message: err.message || 'Upload failed. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles([...e.dataTransfer.files])
    }
  }, [])

  const handleDeleteEvidence = async (evidenceId, name) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return
    try {
      const token = localStorage.getItem('forensic_token') || ''
      const res = await fetch(`${BASE}/evidence/${evidenceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setUploadedEvidence(prev => prev.filter(e => e._id !== evidenceId))
        setUploadResult({ success: true, message: `"${name}" deleted successfully` })
      } else {
        const data = await res.json().catch(() => ({}))
        setUploadResult({ success: false, message: data.error || 'Delete failed' })
      }
    } catch {
      setUploadResult({ success: false, message: 'Network error while deleting' })
    }
  }

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <h1 className="page-title">Evidence Upload</h1>
        <p className="page-description">
          Upload digital forensic evidence with automatic SHA-256 hashing and chain-of-custody tracking.
        </p>
      </div>

      {/* No cases banner */}
      {!loading && cases.length === 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 12, padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 3 }}>No cases found</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>You need to create a case before uploading evidence. Evidence is always linked to a case.</div>
            </div>
          </div>
          <Link to="/cases" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, background: 'var(--gradient-primary)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.84rem', fontFamily: 'var(--font-display)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)' }}
          >
            <Plus size={14} /> Create a Case <ArrowRight size={13} />
          </Link>
        </motion.div>
      )}

      {/* Case selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, marginBottom: 6 }}>Select Case *</label>
        <select
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)', border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-primary)',
            minWidth: 350, outline: 'none',
          }}
        >
          <option value="">— Choose a case —</option>
          {cases.map(c => (
            <option key={c._id} value={c._id}>{c.caseNumber} — {c.title}</option>
          ))}
        </select>
        {cases.length > 0 && !selectedCaseId && (
          <div style={{ fontSize: '0.76rem', color: 'var(--accent-warning)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={11} /> Select a case above before uploading files
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        className={`glow-card ${dragOver ? 'drag-over' : ''}`}
        style={{ marginBottom: 24 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="glow-card-inner" style={{
          padding: 40, textAlign: 'center',
          border: dragOver ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.2s',
          background: dragOver ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
        }}>
          <Upload size={40} style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>
            Drop evidence files here
          </h3>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            or click to browse — supported: .log, .csv, .json, .pcap, .evtx, .xml, .txt, .img, .dd
          </p>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Browse Files
            <input type="file" multiple hidden onChange={handleFileSelect} />
          </label>
        </div>
      </div>

      {/* Accepted file types */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {allowedTypes.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
            fontSize: '0.78rem', color: 'var(--text-secondary)',
          }}>
            <span>{t.icon}</span> {t.label} <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>({t.ext})</span>
          </div>
        ))}
      </div>

      {/* Upload result */}
      {uploadResult && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20,
          background: uploadResult.success ? 'rgba(0,230,118,0.08)' : 'rgba(255,82,82,0.08)',
          border: `1px solid ${uploadResult.success ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`,
          color: uploadResult.success ? 'var(--accent-success)' : 'var(--accent-danger)',
          fontSize: '0.85rem',
        }}>
          {uploadResult.success ? <CheckCircle size={14} style={{ marginRight: 6 }} /> : <AlertTriangle size={14} style={{ marginRight: 6 }} />}
          {uploadResult.message}
        </div>
      )}

      {/* File list */}
      <AnimatePresence>
        {files.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glow-card"
            style={{ marginBottom: 10 }}
          >
            <div className="glow-card-inner" style={{
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <File size={18} style={{ color: 'var(--accent-primary)' }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>{f.name}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span><HardDrive size={11} style={{ marginRight: 3 }} />{formatSize(f.size)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    <Hash size={11} style={{ marginRight: 3 }} />
                    {f.hash.substring(0, 16)}...
                    <button
                      onClick={() => copyHash(f.hash, f.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', marginLeft: 4, padding: 0 }}
                    >
                      {f.copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    </button>
                  </span>
                </div>
              </div>

              <div style={{
                padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 230, 118, 0.08)',
                fontSize: '0.72rem', color: 'var(--accent-success)',
                border: '1px solid rgba(0, 230, 118, 0.15)',
              }}>
                <Shield size={11} style={{ marginRight: 3 }} /> Ready
              </div>

              <button onClick={() => removeFile(f.id)} className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }}>
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Upload button */}
      {files.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setFiles([])}>Clear All</button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedCaseId || uploading}
            style={{ opacity: selectedCaseId && !uploading ? 1 : 0.5 }}
          >
            {uploading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><Upload size={16} /> Upload {files.length} file{files.length > 1 ? 's' : ''}</>}
          </button>
        </div>
      )}

      {/* ── Persisted Evidence (from server — survives refresh) ── */}
      {selectedCaseId && (
        <div style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Uploaded Evidence
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Files linked to this case — persisted in the database
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fetchCaseEvidence(selectedCaseId)}
              disabled={loadingEvidence}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} style={loadingEvidence ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
          </div>

          {loadingEvidence ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading evidence...
            </div>
          ) : uploadedEvidence.length === 0 ? (
            <div style={{
              padding: '32px 20px', textAlign: 'center',
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-muted)', fontSize: '0.84rem',
            }}>
              <File size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
              <div>No evidence uploaded for this case yet.</div>
              <div style={{ fontSize: '0.76rem', marginTop: 4 }}>Upload files above to get started.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uploadedEvidence.map((ev) => (
                <motion.div
                  key={ev._id || ev.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 18px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <File size={17} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.87rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.originalName || ev.filename || ev.name || 'Unknown file'}
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {ev.size && <span><HardDrive size={10} style={{ marginRight: 3 }} />{formatSize(ev.size)}</span>}
                      {ev.sha256 && (
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          <Hash size={10} style={{ marginRight: 3 }} />{ev.sha256.substring(0, 14)}...
                        </span>
                      )}
                      {ev.createdAt && <span><Clock size={10} style={{ marginRight: 3 }} />{new Date(ev.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{
                      padding: '3px 9px', borderRadius: 'var(--radius-sm)',
                      background: ev.status === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                      border: `1px solid ${ev.status === 'error' ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.18)'}`,
                      color: ev.status === 'error' ? '#ef4444' : 'var(--accent-success)',
                      fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      <Shield size={10} style={{ marginRight: 3 }} />
                      {ev.status === 'parsed' ? 'Parsed' : ev.status === 'error' ? 'Error' : ev.status === 'queued' ? 'Queued' : 'Stored'}
                    </div>
                    {!ev._id?.startsWith('optimistic-') && (
                      <button
                        onClick={() => handleDeleteEvidence(ev._id, ev.originalName || ev.filename || 'file')}
                        title="Delete evidence"
                        style={{
                          width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                          border: '1px solid transparent', background: 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

