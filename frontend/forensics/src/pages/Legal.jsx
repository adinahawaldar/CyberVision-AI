import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Lock, FileText, Cookie, Info, ArrowLeft,
  CheckCircle, Globe, Server, Database, Brain, Eye,
  AlertTriangle, Mail, ExternalLink
} from 'lucide-react'

const tabs = [
  { key: 'about', label: 'About', icon: Info },
  { key: 'privacy', label: 'Privacy Policy', icon: Lock },
  { key: 'terms', label: 'Terms of Use', icon: FileText },
  { key: 'cookies', label: 'Cookies Policy', icon: Cookie },
]

function SectionCard({ icon: Icon, title, children, accent = 'var(--accent-primary)' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: 20,
      }}
    >
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {Icon && <Icon size={18} style={{ color: accent, flexShrink: 0 }} />}
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        </div>
      )}
      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.85 }}>
        {children}
      </div>
    </motion.div>
  )
}

function Highlight({ children }) {
  return <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{children}</span>
}

function ListItem({ children }) {
  return (
    <li style={{ marginBottom: 8, paddingLeft: 4 }}>
      <span style={{ color: 'var(--accent-primary)', marginRight: 8 }}>›</span>
      {children}
    </li>
  )
}

// ─── About ─────────────────────────────────────────────────

function AboutContent() {
  return (
    <>
      <SectionCard icon={Shield} title="What is ForensicAI?">
        <p>
          <Highlight>ForensicAI</Highlight> is an advanced digital forensics investigation platform that combines
          the power of artificial intelligence with rigorous forensic methodologies. Built for cybersecurity
          professionals, incident responders, and digital forensics examiners, it streamlines the entire
          investigation lifecycle — from evidence collection and parsing to timeline reconstruction and report generation.
        </p>
        <p style={{ marginTop: 12 }}>
          Our platform upholds the <Highlight>Human-in-the-Loop</Highlight> principle: AI assists with analysis
          and drafting, but all conclusions, findings, and recommendations must be reviewed and approved by
          qualified human investigators before finalization.
        </p>
      </SectionCard>

      <SectionCard icon={Brain} title="Key Capabilities" accent="#7b61ff">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <ListItem><strong>Multi-Format Evidence Parsing</strong> — Supports LOG, CSV, JSON, TXT, XML, PCAP, EVTX, and more. Auto-detects format and extracts structured events.</ListItem>
          <ListItem><strong>SHA-256 Integrity Hashing</strong> — Every uploaded file is immediately hashed for chain-of-custody integrity verification.</ListItem>
          <ListItem><strong>AI-Powered Report Generation</strong> — Produces draft forensic reports with executive summaries, findings, timelines, and recommendations.</ListItem>
          <ListItem><strong>Timeline Reconstruction</strong> — Builds unified, filterable event timelines across multiple evidence sources with severity classification.</ListItem>
          <ListItem><strong>Audit Logging</strong> — Every action is recorded in an immutable audit trail for accountability and compliance.</ListItem>
          <ListItem><strong>Role-Based Access Control</strong> — Secure authentication with optional two-factor authentication and passkey support.</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Server} title="Technology Stack" accent="#00e676">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 8 }}>
          {[
            { label: 'Frontend', items: 'React, Vite, Framer Motion' },
            { label: 'Backend', items: 'Node.js, Express.js' },
            { label: 'Database', items: 'MongoDB with Mongoose' },
            { label: 'AI Engine', items: 'OpenAI, Gemini, Mistral' },
            { label: 'Security', items: 'JWT, bcrypt, TOTP 2FA, WebAuthn' },
            { label: 'Visualization', items: 'Recharts, Lucide Icons' },
          ].map((tech, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)',
              padding: '12px 16px', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {tech.label}
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{tech.items}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Mail} title="Contact" accent="#ffab40">
        <p>
          For inquiries, support requests, or to report security vulnerabilities, contact us at:
        </p>
        <div style={{
          background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px', marginTop: 10,
          fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
        }}>
          📧 support@forensicai.dev &nbsp;·&nbsp; 🔒 security@forensicai.dev
        </div>
        <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Version 1.0.0 &nbsp;·&nbsp; © {new Date().getFullYear()} ForensicAI. All rights reserved.
        </p>
      </SectionCard>
    </>
  )
}

// ─── Privacy Policy ────────────────────────────────────────

function PrivacyContent() {
  return (
    <>
      <SectionCard icon={Eye} title="Data Collection & Usage">
        <p>
          ForensicAI collects necessary administrative and investigative data to run the platform:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem><strong>Account & Auth</strong> — Name, email, role, and organization. Credentials are hashed via bcrypt; sessions are managed securely via JWT.</ListItem>
          <ListItem><strong>Evidence & Timelines</strong> — Log files, CSVs, and text documents uploaded for parsing, indexing, and case timeline construction.</ListItem>
          <ListItem><strong>Audit Logs</strong> — Record of all user actions (login, uploads, audit trials) to ensure investigation accountability.</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Globe} title="External Integrations & Data Flows" accent="#ffab40">
        <p>
          To enrich investigation data, ForensicAI integrates with the following third-party APIs:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem><strong>Threat Intelligence</strong> — IP addresses are queried against <Highlight>AbuseIPDB</Highlight> and file hashes against <Highlight>VirusTotal</Highlight> to identify known threat indicators (IOCs).</ListItem>
          <ListItem><strong>RAG Copilot & AI Summarizer</strong> — Selected log segments and prompts are sent to your configured LLM provider (<Highlight>OpenAI, Gemini, or Mistral</Highlight>) to compile reports and answer case questions.</ListItem>
        </ul>
        <div style={{
          background: 'rgba(255,171,64,0.08)', border: '1px solid rgba(255,171,64,0.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 14,
          fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: 2 }} />
          <span>No raw log files are shared globally. Only specific extracted indicators (IPs, hashes) or RAG retrieval context are queried to third-party endpoints based on your active keys.</span>
        </div>
      </SectionCard>

      <SectionCard icon={Lock} title="Data Security & Rights" accent="#00e676">
        <p>
          Data is stored in encrypted databases. Passwords use salted hashing. All API communication uses HTTPS.
        </p>
        <p style={{ marginTop: 10 }}>
          Users retain full rights to access their audits, modify their settings, or request administrators to delete uploaded case evidence. AI analysis can be disabled by toggling automatic generation settings off.
        </p>
        <p style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;·&nbsp; Support: <Highlight>privacy@forensicai.dev</Highlight>
        </p>
      </SectionCard>
    </>
  )
}

// ─── Terms of Use ──────────────────────────────────────────

function TermsContent() {
  return (
    <>
      <SectionCard icon={FileText} title="Acceptance & Permitted Use">
        <p>
          ForensicAI is built for <Highlight>lawful digital forensics investigations</Highlight>. By logging in, you agree to:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem>Use the Platform only for authorized evidence analysis under legal chain-of-custody.</ListItem>
          <ListItem>Never upload malicious payloads intended to harm the system infrastructure.</ListItem>
          <ListItem>Maintain strict confidentiality of credentials, API keys, and parsed case investigations.</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Shield} title="Evidence Sharing & Third-Party APIs" accent="#7b61ff">
        <p>
          When enabling Threat Intelligence (AbuseIPDB, VirusTotal) or AI engine endpoints, you acknowledge that:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem>You must possess the proper authorization to transmit extracted IPs and file hashes to external feeds.</ListItem>
          <ListItem>API communications are governed by the respective providers' developer policies and data usage terms.</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Brain} title="AI Copilot Disclaimer & Liability" accent="#ff5252">
        <p>
          AI-generated summaries, key findings, and RAG chatbot answers are <strong>investigative aids only</strong>.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem><strong>Human-in-the-Loop Required</strong> — AI findings do not constitute legal evidence or expert testimony and must be validated by a certified forensic examiner.</ListItem>
          <ListItem><strong>No Warranty</strong> — ForensicAI is provided "as is". Developers are not liable for incorrect analysis, data exfiltration from external LLMs, or case decisions made using automated outputs.</ListItem>
        </ul>
        <div style={{
          background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 14,
          fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={16} style={{ color: '#ff5252', flexShrink: 0, marginTop: 2 }} />
          <span><strong>Legal Disclaimer:</strong> AI-generated outputs are draft materials. Final findings must rely on verified file signatures, system logs, and human expertise.</span>
        </div>
        <p style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </SectionCard>
    </>
  )
}

// ─── Cookies Policy ────────────────────────────────────────

function CookiesContent() {
  return (
    <>
      <SectionCard icon={Cookie} title="Essential Local Storage">
        <p>
          ForensicAI does <strong>not</strong> use third-party tracking, advertising, or profiling cookies.
          We store the following variables locally on your machine to sustain basic session security and accessibility:
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          {[
            {
              name: 'forensic_token',
              type: 'Security',
              purpose: 'JSON Web Token (JWT) securing your active authenticated session.',
              duration: '7 Days',
              color: '#00d4ff',
            },
            {
              name: 'forensic_user',
              type: 'Preference',
              purpose: 'Stores visual identity metrics (name, email, role) to personalize the dashboard.',
              duration: '7 Days',
              color: '#7b61ff',
            },
            {
              name: 'forensicai-theme',
              type: 'UX State',
              purpose: 'Persists dark/light design preferences across site reloads.',
              duration: 'Persistent',
              color: '#00e676',
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)',
              padding: '12px 16px', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <code style={{ fontSize: '0.82rem', color: item.color, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 4 }}>
                  {item.name}
                </code>
                <span style={{
                  fontSize: '0.68rem', padding: '2px 8px', borderRadius: 8,
                  background: `${item.color}15`, color: item.color,
                  border: `1px solid ${item.color}30`, fontWeight: 600,
                }}>
                  {item.type}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.purpose}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Lifespan: {item.duration}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Lock} title="Managing Storage" accent="#ffab40">
        <p>
          You can restrict local storage tokens by logging out (which immediately clears authentication data) or by executing "Clear site data" inside your web browser developer settings.
        </p>
        <div style={{
          background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 14,
          fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
          <span>Note: Blocking local storage will terminate active login capability and disable dashboard visualization filters.</span>
        </div>
        <p style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </SectionCard>
    </>
  )
}

// ─── Main Component ────────────────────────────────────────

export default function Legal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'about'

  const setTab = (tab) => setSearchParams({ tab })

  const contentMap = {
    about: <AboutContent />,
    privacy: <PrivacyContent />,
    terms: <TermsContent />,
    cookies: <CookiesContent />,
  }

  const titleMap = {
    about: 'About ForensicAI',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    cookies: 'Cookies Policy',
  }

  return (
    <motion.div
      className="page-enter"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 860, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={26} style={{ color: 'var(--accent-primary)' }} />
            {titleMap[activeTab]}
          </h1>
          <p className="page-description">
            {activeTab === 'about' && 'Learn about the ForensicAI platform, its capabilities, and the team behind it.'}
            {activeTab === 'privacy' && 'How we collect, use, store, and protect your data.'}
            {activeTab === 'terms' && 'Rules and conditions governing your use of the ForensicAI platform.'}
            {activeTab === 'cookies' && 'Information about cookies and local storage used by the platform.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 28,
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
        padding: 4, border: '1px solid var(--border-primary)',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '10px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
                background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500, fontSize: '0.83rem',
                cursor: 'pointer', transition: 'all 0.2s',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {contentMap[activeTab]}
      </motion.div>
    </motion.div>
  )
}
