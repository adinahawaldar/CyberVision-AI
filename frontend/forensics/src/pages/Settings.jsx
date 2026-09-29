import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Shield, Bell, Brain, Key,
  Save, Lock, Loader, CheckCircle
} from 'lucide-react'
import {
  getProfile, updateProfile,
  changePassword,
  getSecuritySettings, updateSecuritySettings,
  getAiSettings, updateAiSettings,
  getNotificationSettings, updateNotificationSettings,
  getPasskeyRegisterOptions, registerPasskey, getPasskeys, deletePasskey,
} from '../api'
import { startRegistration } from '@simplewebauthn/browser'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { updateUser, user: authUser } = useAuth()
  const isAdmin = authUser?.role === 'admin'
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Profile state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('investigator')
  const [organization, setOrganization] = useState('')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Security state
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [passkeys, setPasskeys] = useState([])
  const [registering, setRegistering] = useState(false)

  // AI state
  const [aiProvider, setAiProvider] = useState('mistral')
  const [aiModel, setAiModel] = useState('mistral-small-latest')
  const [aiApiKey, setAiApiKey] = useState('')
  const [aiTemp, setAiTemp] = useState(0.3)
  const [aiMaxTokens, setAiMaxTokens] = useState(2048)
  const [aiTone, setAiTone] = useState('neutral')
  const [aiAutoGen, setAiAutoGen] = useState(false)
  const [aiRequireApproval, setAiRequireApproval] = useState(true)
  const [abuseIpDbApiKey, setAbuseIpDbApiKey] = useState('')
  const [virusTotalApiKey, setVirusTotalApiKey] = useState('')
  const [threatSeverityThreshold, setThreatSeverityThreshold] = useState(50)
  const [ragContextLimit, setRagContextLimit] = useState(25)

  // Notifications state
  const [notifs, setNotifs] = useState({
    caseUpdates: true, evidenceProcessing: true, aiReports: true,
    integrityAlerts: true, securityEvents: false, maintenance: false,
  })

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // Load data for current tab
  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        if (activeTab === 'profile') {
          const data = await getProfile()
          setName(data.name); setEmail(data.email); setRole(data.role); setOrganization(data.organization || '')
        } else if (activeTab === 'security') {
          const data = await getSecuritySettings()
          setTwoFactor(data.twoFactorEnabled); setSessionTimeout(data.sessionTimeout)
          try { const pk = await getPasskeys(); setPasskeys(pk.passkeys || []) } catch {}
        } else if (activeTab === 'ai') {
          const data = await getAiSettings()
          setAiProvider(data.provider); setAiModel(data.model); setAiApiKey(data.apiKey)
          setAiTemp(data.temperature); setAiMaxTokens(data.maxTokens); setAiTone(data.tone)
          setAiAutoGen(data.autoGenerate); setAiRequireApproval(data.requireApproval)
          setAbuseIpDbApiKey(data.abuseIpDbApiKey || '')
          setVirusTotalApiKey(data.virusTotalApiKey || '')
          setThreatSeverityThreshold(data.threatSeverityThreshold ?? 50)
          setRagContextLimit(data.ragContextLimit ?? 25)
        } else if (activeTab === 'notifications') {
          const data = await getNotificationSettings()
          setNotifs(data)
        }
      } catch (err) { console.error('Settings load error:', err) }
      setLoading(false)
    }
    load()
  }, [activeTab])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await updateProfile({ name, email, role, organization })
      // Update global auth state so Header & dropdown reflect changes immediately
      if (res) {
        updateUser(
          { name: res.name, email: res.email, role: res.role, organization: res.organization },
          res.token // new JWT if backend issues one on profile change
        )
      }
      showToast('Profile saved successfully')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return showToast('Passwords do not match')
    if (newPassword.length < 8) return showToast('Password must be at least 8 characters')
    setSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      showToast('Password updated successfully')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const handleSaveSecurity = async () => {
    setSaving(true)
    try {
      await updateSecuritySettings({ twoFactorEnabled: twoFactor, sessionTimeout })
      showToast('Security settings saved')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const handleSaveAi = async () => {
    setSaving(true)
    try {
      await updateAiSettings({
        provider: aiProvider, model: aiModel, apiKey: aiApiKey || undefined,
        temperature: aiTemp, maxTokens: aiMaxTokens, tone: aiTone,
        autoGenerate: aiAutoGen, requireApproval: aiRequireApproval,
        abuseIpDbApiKey: abuseIpDbApiKey || undefined,
        virusTotalApiKey: virusTotalApiKey || undefined,
        threatSeverityThreshold,
        ragContextLimit,
      })
      showToast('AI & Threat configuration saved')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const handleSaveNotifs = async () => {
    setSaving(true)
    try {
      await updateNotificationSettings(notifs)
      showToast('Notification preferences saved')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'VK'

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your profile, security, AI configuration, and system preferences.</p>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.startsWith('Error') ? 'rgba(255,82,82,0.95)' : 'rgba(0,230,118,0.95)',
          color: '#fff', padding: '10px 18px', borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <CheckCircle size={16} /> {toast}
        </motion.div>
      )}

      <div className="tabs">
        {[
          { key: 'profile', icon: User, label: 'Profile' },
          { key: 'security', icon: Shield, label: 'Security' },
          { key: 'ai', icon: Brain, label: 'AI & Threat Intel' },
          { key: 'notifications', icon: Bell, label: 'Notifications' },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--text-muted)', gap: 10 }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading settings...
        </div>
      ) : (
        <>
          {/* ─── Profile Tab ─── */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glow-card">
                <div className="glow-card-inner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: 800, color: 'white',
                      boxShadow: 'var(--shadow-glow-cyan)',
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{name || 'User'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {role === 'admin' ? 'Administrator' : role === 'analyst' ? 'Lead Analyst' : 'Senior Investigator'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                        <option value="investigator">Senior Investigator</option>
                        <option value="analyst">Lead Analyst</option>
                        {role === 'admin' && <option value="admin">Administrator</option>}
                        <option value="viewer">Viewer</option>
                      </select>
                      <div className="role-footnote" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        For Administrator Please Contact System Admin
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Organization</label>
                      <input className="form-input" value={organization} onChange={e => setOrganization(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save Changes
                    </button>
                  </div>


                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Security Tab ─── */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glow-card">
                <div className="glow-card-inner">
                  <div className="settings-group">
                    <div className="settings-group-title">Change Password</div>
                    <div className="settings-group-desc">Use a strong, unique password with at least 8 characters.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Current Password</label>
                        <input className="form-input" type="password" placeholder="••••••••"
                          value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">New Password</label>
                        <input className="form-input" type="password" placeholder="••••••••"
                          value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Confirm Password</label>
                        <input className="form-input" type="password" placeholder="••••••••"
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <button className="btn btn-secondary" onClick={handleChangePassword}
                        disabled={saving || !newPassword} style={{ opacity: newPassword ? 1 : 0.5 }}>
                        <Key size={14} /> Update Password
                      </button>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="settings-group-title">Two-Factor Authentication</div>
                        <div className="settings-group-desc" style={{ marginBottom: 0 }}>Add an extra layer of security to your account.</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={twoFactor} onChange={e => setTwoFactor(e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Passkey setup — shown when 2FA is enabled */}
                  {twoFactor && (
                    <div className="passkey-setup">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <div className="settings-group-title" style={{ fontSize: '0.92rem' }}>🔑 Passkey Setup</div>
                          <div className="settings-group-desc" style={{ marginBottom: 0 }}>Register a passkey (fingerprint, Face ID, or security key) for secure authentication.</div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={async () => {
                          setRegistering(true)
                          try {
                            const options = await getPasskeyRegisterOptions()
                            const credential = await startRegistration({ optionsJSON: options })
                            const result = await registerPasskey(credential)
                            setPasskeys(result.passkeys || [])
                            showToast('Passkey registered successfully!')
                          } catch (err) {
                            if (err.name !== 'AbortError') showToast('Error: ' + (err.message || 'Registration failed'))
                          }
                          setRegistering(false)
                        }} disabled={registering}>
                          {registering ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={14} />}
                          {registering ? ' Registering...' : ' Add Passkey'}
                        </button>
                      </div>

                      {passkeys.length > 0 ? (
                        <div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                            {passkeys.length} passkey{passkeys.length > 1 ? 's' : ''} registered
                          </div>
                          {passkeys.map((pk, i) => (
                            <div className="passkey-item" key={pk.credentialId || i}>
                              <div className="passkey-item-info">
                                <Key size={14} />
                                <div>
                                  <div style={{ fontWeight: 600 }}>Passkey {i + 1}</div>
                                  <div className="passkey-item-id">{pk.credentialId?.slice(0, 20)}...</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Added {pk.createdAt ? new Date(pk.createdAt).toLocaleDateString() : 'recently'}
                                  </div>
                                </div>
                              </div>
                              <button className="btn btn-ghost btn-sm" style={{ color: '#ff6b6b' }}
                                onClick={async () => {
                                  try {
                                    const result = await deletePasskey(pk.credentialId)
                                    setPasskeys(result.passkeys || [])
                                    if (!result.passkeys?.length) setTwoFactor(false)
                                    showToast('Passkey removed')
                                  } catch (err) { showToast('Error: ' + err.message) }
                                }}>Remove</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No passkeys registered yet. Click "Add Passkey" to set up passwordless login.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="settings-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="settings-group-title">Session Timeout</div>
                        <div className="settings-group-desc" style={{ marginBottom: 0 }}>Auto-logout after inactivity period.</div>
                      </div>
                      <select className="form-select" style={{ width: 140 }}
                        value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))}>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={240}>4 hours</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn btn-primary" onClick={handleSaveSecurity} disabled={saving}>
                      {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={15} />} Save Security
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── AI Engine Tab ─── */}
          {activeTab === 'ai' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glow-card">
                <div className="glow-card-inner">
                  <div className="settings-group">
                    <div className="settings-group-title">LLM Provider</div>
                    <div className="settings-group-desc">Select the AI model provider for report generation.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Provider</label>
                        <select className="form-select" value={aiProvider} onChange={e => {
                          setAiProvider(e.target.value)
                          if (e.target.value === 'openai') setAiModel('gpt-4')
                          else if (e.target.value === 'gemini') setAiModel('gemini-pro')
                          else if (e.target.value === 'mistral') setAiModel('mistral-small-latest')
                        }}>
                          <option value="mistral">Mistral AI</option>
                          <option value="openai">OpenAI (GPT-4)</option>
                          <option value="gemini">Google (Gemini Pro)</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Model</label>
                        <input className="form-input" value={aiModel} onChange={e => setAiModel(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: 12 }}>
                      <label className="form-label">API Key</label>
                      <input className="form-input" type="password" placeholder="Enter API key..."
                        value={aiApiKey} onChange={e => setAiApiKey(e.target.value)} />
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Leave blank to keep existing key. Currently: {aiApiKey || 'not set'}
                      </div>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="settings-group-title">Generation Parameters</div>
                    <div className="settings-group-desc">Fine-tune AI output behavior for forensic reports.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Temperature</label>
                        <input className="form-input" type="number" step="0.1" min="0" max="1"
                          value={aiTemp} onChange={e => setAiTemp(parseFloat(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Max Tokens</label>
                        <input className="form-input" type="number"
                          value={aiMaxTokens} onChange={e => setAiMaxTokens(parseInt(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Tone</label>
                        <select className="form-select" value={aiTone} onChange={e => setAiTone(e.target.value)}>
                          <option value="neutral">Neutral / Objective</option>
                          <option value="formal">Formal / Legal</option>
                          <option value="technical">Technical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="settings-group-title">Auto-Generate on Evidence Upload</div>
                        <div className="settings-group-desc" style={{ marginBottom: 0 }}>Automatically trigger AI analysis when evidence is uploaded.</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={aiAutoGen} onChange={e => setAiAutoGen(e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div className="settings-group-title">Require Human Approval for All Sections</div>
                        <div className="settings-group-desc" style={{ marginBottom: 0 }}>AI-generated sections require explicit human review before inclusion in final reports.</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={aiRequireApproval} onChange={e => setAiRequireApproval(e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="settings-group-title">Threat Intelligence Feeds</div>
                    <div className="settings-group-desc">Configure API credentials and parameters for IP/file reputation feeds and dynamic log correlation.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">AbuseIPDB API Key</label>
                        <input className="form-input" type="password" placeholder="Enter API key..."
                          value={abuseIpDbApiKey} onChange={e => setAbuseIpDbApiKey(e.target.value)} />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Leave blank to keep existing. Currently: {abuseIpDbApiKey || 'not set'}
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">VirusTotal API Key</label>
                        <input className="form-input" type="password" placeholder="Enter API key..."
                          value={virusTotalApiKey} onChange={e => setVirusTotalApiKey(e.target.value)} />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Leave blank to keep existing. Currently: {virusTotalApiKey || 'not set'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Threat Severity Threshold (%)</label>
                        <input className="form-input" type="number" min="0" max="100"
                          value={threatSeverityThreshold} onChange={e => setThreatSeverityThreshold(parseInt(e.target.value) || 0)} />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Confidence score threshold for flagging indicators as critical
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">RAG Chat Context Log Limit</label>
                        <input className="form-input" type="number" min="5" max="100"
                          value={ragContextLimit} onChange={e => setRagContextLimit(parseInt(e.target.value) || 0)} />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Maximum parsed events sent to LLM during interactive case chat queries
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn btn-primary" onClick={handleSaveAi} disabled={saving}>
                      {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={15} />} Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Notifications Tab ─── */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glow-card">
                <div className="glow-card-inner">
                  {[
                    { key: 'caseUpdates', title: 'Case Updates', desc: 'Receive notifications when cases are updated or assigned to you.' },
                    { key: 'evidenceProcessing', title: 'Evidence Processing', desc: 'Get notified when evidence hashing and parsing is complete.' },
                    { key: 'aiReports', title: 'AI Report Generation', desc: 'Notification when AI finishes generating report sections.' },
                    { key: 'integrityAlerts', title: 'Integrity Alerts', desc: 'Alert when evidence integrity verification fails.' },
                    { key: 'securityEvents', title: 'Security Events', desc: 'Login attempts, password changes, and session events.' },
                    { key: 'maintenance', title: 'System Maintenance', desc: 'Scheduled maintenance and system update notifications.' },
                  ].map((notif) => (
                    <div className="settings-group" key={notif.key}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div className="settings-group-title">{notif.title}</div>
                          <div className="settings-group-desc" style={{ marginBottom: 0 }}>{notif.desc}</div>
                        </div>
                        <label className="toggle">
                          <input type="checkbox" checked={notifs[notif.key]}
                            onChange={e => setNotifs(prev => ({ ...prev, [notif.key]: e.target.checked }))} />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn btn-primary" onClick={handleSaveNotifs} disabled={saving}>
                      {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Bell size={15} />} Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
