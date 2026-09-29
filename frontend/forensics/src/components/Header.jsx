import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Moon, Sun, HelpCircle, X, ExternalLink, LogOut, User, Shield, Building2, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getNotifications, globalSearch } from '../api'

const pageTitles = {
  '/': 'Dashboard',
  '/cases': 'Case Management',
  '/evidence': 'Evidence Upload',
  '/timeline': 'Timeline Reconstruction',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/legal': 'Legal & Policies',
}

// Static navigation pages — always available as quick links
const navPages = [
  { label: 'Dashboard', path: '/', keywords: 'dashboard home overview stats', category: 'Page' },
  { label: 'Case Management', path: '/cases', keywords: 'cases investigations manage list', category: 'Page' },
  { label: 'Evidence Upload', path: '/evidence', keywords: 'evidence upload files hash sha256 integrity', category: 'Page' },
  { label: 'Timeline Reconstruction', path: '/timeline', keywords: 'timeline events chronological reconstruct', category: 'Page' },
  { label: 'Reports', path: '/reports', keywords: 'reports pdf export ai generated forensic', category: 'Page' },
  { label: 'Settings', path: '/settings', keywords: 'settings profile security ai configuration notifications', category: 'Page' },
  { label: 'About / Legal', path: '/legal', keywords: 'about privacy terms cookies legal policies', category: 'Page' },
]

const helpTopics = [
  { q: 'How do I upload evidence?', a: 'Go to Evidence Upload page. Drag and drop files or click to browse. Supported: .log, .csv, .json, .pcap, .img, .evtx files. Files are automatically hashed with SHA-256 for integrity.' },
  { q: 'How does AI report generation work?', a: 'Navigate to Reports → Generate Report. The AI analyzes parsed evidence and creates draft sections. All AI-generated content requires human review before finalization.' },
  { q: 'How do I export a report as PDF?', a: 'Open a report and click the "Export PDF" button. A print-ready document will open in a new tab. Use your browser\'s Save as PDF option.' },
  { q: 'What file formats are supported?', a: 'Supported evidence formats: .log, .txt, .csv, .json, .xml, .pcap, .evtx, .img, .dd, .raw, .zip, .gz' },
  { q: 'How is evidence integrity maintained?', a: 'Every uploaded file is hashed with SHA-256 immediately. Hashes can be re-verified at any time via the evidence detail view. All actions are recorded in the audit log.' },
  { q: 'How do I change my password?', a: 'Go to Settings → Security tab. Enter your current password and your new password, then click Update Password.' },
]

export default function Header({ onMenuToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const helpRef = useRef(null)
  const profileRef = useRef(null)
  const searchTimerRef = useRef(null)
  const prevUnreadRef = useRef(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoaded, setNotifLoaded] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('forensicai-theme')
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved)
      return saved === 'dark'
    }
    return true
  })
  const [savedToast, setSavedToast] = useState('')

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
      if (helpRef.current && !helpRef.current.contains(e.target)) setShowHelp(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Bell chime sound using Web Audio API
  const playBellSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + duration)
      }
      playTone(1318.5, 0, 0.3)
      playTone(1568, 0.15, 0.4)
    } catch (e) { /* audio not available */ }
  }

  // Persist read notification IDs in localStorage
  const getReadIds = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem('forensicai_read_notifs') || '[]'))
    } catch (e) {
      return new Set()
    }
  }
  const saveReadIds = (ids) => {
    localStorage.setItem('forensicai_read_notifs', JSON.stringify([...ids]))
  }

  // Fetch notifications on mount + poll every 30s
  useEffect(() => {
    const fetchNotifs = () => {
      getNotifications()
        .then(data => {
          const rawNotifs = data.notifications || []
          const readIds = getReadIds()
          const notifs = rawNotifs.map(n => ({
            ...n,
            unread: n.unread && !readIds.has(n.id),
          }))
          const newUnread = notifs.filter(n => n.unread).length
          if (notifLoaded && newUnread > prevUnreadRef.current) playBellSound()
          if (!notifLoaded && newUnread > 0) playBellSound()
          prevUnreadRef.current = newUnread
          setNotifications(notifs)
          setNotifLoaded(true)
        })
        .catch(() => setNotifLoaded(true))
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  const getTitle = () => {
    if (location.pathname.startsWith('/cases/')) return 'Case Detail'
    if (location.pathname.startsWith('/reports/')) return 'Report Detail'
    return pageTitles[location.pathname] || 'ForensicAI'
  }

  // Debounced search — combines static nav pages with real API results
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q || q.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    // Immediate: filter static nav pages
    const ql = q.toLowerCase()
    const pageMatches = navPages.filter(p =>
      p.label.toLowerCase().includes(ql) || p.keywords.includes(ql)
    )
    setSearchResults(pageMatches)

    // Debounced: search API for real cases/reports/evidence
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearchLoading(true)
      globalSearch(q)
        .then(data => {
          const apiResults = (data.results || []).map(r => ({
            label: r.label,
            path: r.path,
            category: r.category,
          }))
          const seen = new Set(pageMatches.map(p => p.path))
          const merged = [...pageMatches]
          apiResults.forEach(r => {
            if (!seen.has(r.path)) { merged.push(r); seen.add(r.path) }
          })
          setSearchResults(merged)
        })
        .catch(() => {})
        .finally(() => setSearchLoading(false))
    }, 300)

    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery])

  const handleSearchSelect = (item) => {
    navigate(item.path)
    setSearchQuery('')
    setSearchFocused(false)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSearchSelect(searchResults[0])
    }
    if (e.key === 'Escape') {
      setSearchFocused(false)
      setSearchQuery('')
    }
  }

  // Theme toggle
  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    const themeName = next ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', themeName)
    localStorage.setItem('forensicai-theme', themeName)
    setSavedToast(`Switched to ${themeName} mode`)
    setTimeout(() => setSavedToast(''), 2000)
  }

  // Mark notification as read — persist to localStorage
  const markRead = (id) => {
    const readIds = getReadIds()
    readIds.add(id)
    saveReadIds(readIds)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  const markAllRead = () => {
    const readIds = getReadIds()
    notifications.forEach(n => readIds.add(n.id))
    saveReadIds(readIds)
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button className="header-hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
            <Menu size={22} />
          </button>
          <h2 className="header-title">{getTitle()}</h2>
        </div>

        {/* Search with dropdown */}
        <div className="header-search" ref={searchRef} style={{ position: 'relative' }}>
          <Search />
          <input
            type="text"
            placeholder="Search cases, evidence, reports..."
            id="global-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchFocused && searchQuery.trim().length >= 2 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 1000, maxHeight: 340, overflowY: 'auto',
            }}>
              {searchLoading && searchResults.length === 0 && (
                <div style={{ padding: '16px', fontSize: '0.83rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Searching...
                </div>
              )}
              {searchResults.length > 0 ? searchResults.map((item, i) => {
                const catColors = {
                  Page: '#a78bfa', Case: '#6366f1', Report: '#10b981', Evidence: '#f59e0b',
                }
                const catColor = catColors[item.category] || 'var(--text-muted)'
                return (
                  <div
                    key={i}
                    onClick={() => handleSearchSelect(item)}
                    style={{
                      padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', gap: 10,
                      color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`,
                      flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {item.category}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </div>
                )
              }) : !searchLoading && (
                <div style={{ padding: '16px', fontSize: '0.83rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No results for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-right">
          {/* Help */}
          <div style={{ position: 'relative' }} ref={helpRef}>
            <button
              className={`header-icon-btn tooltip ${showHelp ? 'active' : ''}`}
              data-tooltip="Help"
              id="help-btn"
              onClick={() => { setShowHelp(!showHelp); setShowNotifications(false) }}
            >
              <HelpCircle size={18} />
            </button>
            {showHelp && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 380, background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 1000, maxHeight: 420, overflowY: 'auto',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Help & FAQ</span>
                  <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
                {helpTopics.map((topic, i) => (
                  <details key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <summary style={{
                      padding: '12px 16px', cursor: 'pointer', fontSize: '0.83rem',
                      fontWeight: 600, color: 'var(--text-primary)', listStyle: 'none',
                    }}>
                      {topic.q}
                    </summary>
                    <div style={{
                      padding: '0 16px 12px', fontSize: '0.8rem',
                      color: 'var(--text-secondary)', lineHeight: 1.6,
                    }}>
                      {topic.a}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            className="header-icon-btn tooltip"
            data-tooltip={darkMode ? 'Light Mode' : 'Dark Mode'}
            id="theme-btn"
            onClick={toggleTheme}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              className={`header-icon-btn tooltip ${showNotifications ? 'active' : ''}`}
              data-tooltip="Notifications"
              id="notifications-btn"
              onClick={() => { setShowNotifications(!showNotifications); setShowHelp(false) }}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>
            {showNotifications && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 360, background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 1000,
              }}>
                <div style={{
                  padding: '14px 16px', borderBottom: '1px solid var(--border-primary)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Notifications {unreadCount > 0 && <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>({unreadCount})</span>}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                      <Bell size={20} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                      No notifications yet. Activity will appear here as you work.
                    </div>
                  ) : notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      style={{
                        padding: '12px 16px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.unread ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = n.unread ? 'rgba(99, 102, 241, 0.04)' : 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        {n.unread && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', marginTop: 5, flexShrink: 0, boxShadow: '0 0 6px var(--glow-indigo)' }}></div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {n.text}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            {n.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar + Dropdown */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <div
              className="header-avatar"
              id="user-avatar"
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowHelp(false) }}
              style={{ cursor: 'pointer' }}
            >
              {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
            </div>
            {showProfile && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 260, background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 1000, overflow: 'hidden',
              }}>
                {/* User info */}
                <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border-primary)', textAlign: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', margin: '0 auto 10px',
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 800, color: '#fff',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                  }}>
                    {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {user?.email || ''}
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    <Shield size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span>{user?.role === 'admin' ? 'Administrator' : user?.role === 'analyst' ? 'Analyst' : user?.role === 'viewer' ? 'Viewer' : 'Investigator'}</span>
                  </div>
                </div>

                {/* Logout */}
                <div style={{ borderTop: '1px solid var(--border-primary)', padding: '8px' }}>
                  <button
                    onClick={logout}
                    style={{
                      width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8,
                      background: 'rgba(244, 63, 94, 0.08)', color: 'var(--accent-danger)',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)'}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Toast notification */}
      {savedToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'var(--accent-success)', color: '#000',
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'slideInUp 0.3s ease',
        }}>
          {savedToast}
        </div>
      )}
    </>
  )
}
