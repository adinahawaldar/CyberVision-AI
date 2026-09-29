import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Upload, Clock, FileText,
  Settings, Shield, Activity, Database, Brain, LogOut, X, MessageSquare, Globe, Radar
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { section: 'Analysis', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { to: '/cases', icon: FolderOpen, label: 'Case Management', badge: null },
    { to: '/evidence', icon: Upload, label: 'Evidence Upload', badge: null },
    { to: '/timeline', icon: Clock, label: 'Timeline', badge: null },
    { to: '/anomalies', icon: Radar, label: 'Anomaly Dashboard', badge: null },
    { to: '/mitre', icon: Activity, label: 'MITRE ATT&CK Matrix', badge: null },
    { to: '/iocs', icon: Globe, label: 'Threat Indicators (IOCs)', badge: null },
    { to: '/chat', icon: MessageSquare, label: 'Case RAG Chat', badge: null },
  ]},
  { section: 'Reporting', items: [
    { to: '/reports', icon: FileText, label: 'Reports', badge: null },
  ]},
  { section: 'System', items: [
    { to: '/settings', icon: Settings, label: 'Settings', badge: null },
  ]},
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { logout, user } = useAuth()

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 768 && onClose) onClose()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="sidebar-logo">
          <div className="logo-icon">
            <Shield size={20} />
          </div>
          <div>
            <h1>ForensicAI</h1>
            <span>Digital Forensics Suite</span>
          </div>
        </div>

        {navItems.map((section) => (
          <div className="sidebar-section" key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            <nav className="sidebar-nav">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = item.to === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.to)
                return (
                  <NavLink
                    id={`tour-nav-${item.to.replace('/', '')}`}
                    key={item.to}
                    to={item.to}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                  >
                    <Icon size={18} />
                    {item.label}
                    {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-primary)' }}>
          <div className="glow-card" style={{ padding: 0 }}>
            <div className="glow-card-inner" style={{ padding: '16px', textAlign: 'center' }}>
              <Brain size={20} style={{ color: 'var(--accent-primary)', marginBottom: 8 }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>AI Engine</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--accent-success)' }}>●</span> Connected
              </div>
            </div>
          </div>
        </div>

        {/* Legal links */}
        <div style={{ padding: '6px 16px', display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center' }}>
          {[
            { label: 'About', tab: 'about' },
            { label: 'Privacy', tab: 'privacy' },
            { label: 'Terms', tab: 'terms' },
            { label: 'Cookies', tab: 'cookies' },
          ].map(link => (
            <NavLink
              key={link.tab}
              to={`/legal?tab=${link.tab}`}
              onClick={handleNavClick}
              style={{
                fontSize: '0.68rem', color: 'var(--text-muted)',
                textDecoration: 'none', transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '8px 12px' }}>
          <button onClick={logout} className="sidebar-link" style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}
