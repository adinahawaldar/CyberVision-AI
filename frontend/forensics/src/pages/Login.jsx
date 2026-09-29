import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Shield, Eye, EyeOff, Mail, Lock, User,
  Building2, ChevronRight, Fingerprint, Zap, Sparkles
} from 'lucide-react'
import { loginUser, registerUser, getPasskeyAuthOptions, authenticatePasskey } from '../api'
import { useAuth } from '../context/AuthContext'
import { startAuthentication } from '@simplewebauthn/browser'

/* ─────────────────────────────────────────────
   EyeBall — white sclera + tracked pupil
───────────────────────────────────────────── */
function EyeBall({ size = 18, pupilSize = 7, eyeColor = 'white', pupilColor = '#1a1933', isBlinking = false, forceLookX, forceLookY }) {
  const [mx, setMx] = useState(0)
  const [my, setMy] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { setMx(e.clientX); setMy(e.clientY) }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    if (!ref.current) return { x: 0, y: 0 }
    const r = ref.current.getBoundingClientRect()
    const dx = mx - (r.left + r.width / 2)
    const dy = my - (r.top + r.height / 2)
    const d = Math.min(Math.sqrt(dx * dx + dy * dy), 5)
    const a = Math.atan2(dy, dx)
    return { x: Math.cos(a) * d, y: Math.sin(a) * d }
  })()

  return (
    <div ref={ref} style={{
      width: size, height: isBlinking ? 2 : size,
      borderRadius: '50%', background: eyeColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', transition: 'height 0.12s ease', flexShrink: 0,
    }}>
      {!isBlinking && (
        <div style={{
          width: pupilSize, height: pupilSize, borderRadius: '50%', background: pupilColor,
          transform: `translate(${pos.x}px,${pos.y}px)`, transition: 'transform 0.08s ease-out',
        }} />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Pupil — bare dot, no white sclera
───────────────────────────────────────────── */
function Pupil({ size = 12, pupilColor = '#1a1933', forceLookX, forceLookY }) {
  const [mx, setMx] = useState(0)
  const [my, setMy] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { setMx(e.clientX); setMy(e.clientY) }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    if (!ref.current) return { x: 0, y: 0 }
    const r = ref.current.getBoundingClientRect()
    const dx = mx - (r.left + r.width / 2)
    const dy = my - (r.top + r.height / 2)
    const d = Math.min(Math.sqrt(dx * dx + dy * dy), 5)
    const a = Math.atan2(dy, dx)
    return { x: Math.cos(a) * d, y: Math.sin(a) * d }
  })()

  return (
    <div ref={ref} style={{
      width: size, height: size, borderRadius: '50%', background: pupilColor,
      transform: `translate(${pos.x}px,${pos.y}px)`, transition: 'transform 0.08s ease-out', flexShrink: 0,
    }} />
  )
}

/* ─────────────────────────────────────────────
   Main Login Page
───────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Form state
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [role, setRole] = useState('investigator')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [loginToken, setLoginToken] = useState('')
  const [verifying2FA, setVerifying2FA] = useState(false)

  // Character animation state
  const [mx, setMx] = useState(0)
  const [my, setMy] = useState(0)
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false)
  const [isBlackBlinking, setIsBlackBlinking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)

  const purpleRef = useRef(null)
  const blackRef = useRef(null)
  const yellowRef = useRef(null)
  const orangeRef = useRef(null)

  // Mouse tracking
  useEffect(() => {
    const h = (e) => { setMx(e.clientX); setMy(e.clientY) }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  // Purple blink
  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setIsPurpleBlinking(true)
        setTimeout(() => { setIsPurpleBlinking(false); schedule() }, 150)
      }, Math.random() * 4000 + 3000)
      return t
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  // Black blink
  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setIsBlackBlinking(true)
        setTimeout(() => { setIsBlackBlinking(false); schedule() }, 150)
      }, Math.random() * 4000 + 3500)
      return t
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  // Look at each other on typing
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true)
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800)
      return () => clearTimeout(t)
    } else setIsLookingAtEachOther(false)
  }, [isTyping])

  // Purple peeking at visible password
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setIsPurplePeeking(true)
        setTimeout(() => setIsPurplePeeking(false), 800)
      }, Math.random() * 3000 + 2000)
      return () => clearTimeout(t)
    } else setIsPurplePeeking(false)
  }, [password, showPassword, isPurplePeeking])

  // Compute character body+face offset
  const calcPos = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const r = ref.current.getBoundingClientRect()
    const dx = mx - (r.left + r.width / 2)
    const dy = my - (r.top + r.height / 3)
    return {
      faceX: Math.max(-12, Math.min(12, dx / 22)),
      faceY: Math.max(-8, Math.min(8, dy / 35)),
      bodySkew: Math.max(-5, Math.min(5, -dx / 130)),
    }
  }

  const pp = calcPos(purpleRef)
  const bp = calcPos(blackRef)
  const yp = calcPos(yellowRef)
  const op = calcPos(orangeRef)

  const pwdHidden = password.length > 0 && !showPassword
  const pwdShown = password.length > 0 && showPassword

  // ── Form submit ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (isSignup) {
      if (password !== confirmPassword) return setError('Passwords do not match')
      if (password.length < 8) return setError('Password must be at least 8 characters')
      setLoading(true)
      try {
        const data = await registerUser({ name, email, password, role, organization })
        login(data.token, data.user, data.sessionTimeout)
        navigate('/dashboard')
      } catch (err) { setError(err.message || 'Registration failed') }
      finally { setLoading(false) }
    } else {
      setLoading(true)
      try {
        const data = await loginUser(email, password)
        if (data.requires2FA) {
          setLoginToken(data.loginToken)
          setRequires2FA(true)
          setLoading(false)
          return
        }
        login(data.token, data.user, data.sessionTimeout)
        navigate('/dashboard')
      } catch (err) { setError(err.message || 'Authentication failed') }
      finally { setLoading(false) }
    }
  }

  const handle2FA = async () => {
    setError('')
    setVerifying2FA(true)
    try {
      const options = await getPasskeyAuthOptions(loginToken)
      const credential = await startAuthentication({ optionsJSON: options })
      const data = await authenticatePasskey(loginToken, credential)
      login(data.token, data.user, data.sessionTimeout)
      navigate('/dashboard')
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') setError('Passkey verification was cancelled.')
      else setError(err.message || 'Passkey verification failed')
    } finally { setVerifying2FA(false) }
  }

  // ── Shared input style ──
  const inputStyle = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    height: 48, padding: '0 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, color: 'var(--text-primary)',
    fontSize: '0.9rem', fontFamily: 'var(--font-primary)',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  const onFocusInput = (e) => {
    e.target.style.borderColor = 'rgba(99,102,241,0.55)'
    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'
    setIsTyping(true)
  }
  const onBlurInput = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.08)'
    e.target.style.boxShadow = 'none'
    setIsTyping(false)
  }
  const labelStyle = {
    display: 'block', fontSize: '0.83rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.01em',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-primary)' }}>

      {/* ══════════════════════════════════════════════
          LEFT PANEL — Characters on indigo gradient
      ══════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(145deg, #1e1b4b 0%, #0f0c29 50%, #0a0818 100%)',
        padding: '40px 48px', overflow: 'hidden',
      }}>
        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '25%', left: '5%', width: 220, height: 220, borderRadius: '50%', background: 'rgba(167,139,250,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* Brand — links to landing */}
        <Link to="/" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-display)', textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--gradient-primary)',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={19} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', display: 'block' }}>ForensicAI</span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(167,139,250,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Intelligence Platform</span>
          </div>
        </Link>

        {/* ── CHARACTER STAGE ── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 420 }}>
          <div style={{ position: 'relative', width: 460, height: 400 }}>

            {/* Ground glow */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: 380, height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
              boxShadow: '0 0 30px rgba(99,102,241,0.4)',
            }} />

            {/* CHARACTER 1 — Indigo tall rectangle (back) */}
            <div ref={purpleRef} style={{
              position: 'absolute', bottom: 0, left: 55,
              width: 160, height: (isTyping || pwdHidden) ? 410 : 370,
              background: 'linear-gradient(175deg, #6366f1 0%, #4338ca 100%)',
              borderRadius: '10px 10px 0 0', zIndex: 1,
              transition: 'all 0.65s cubic-bezier(0.34,1.56,0.64,1)',
              transform: pwdShown ? 'skewX(0deg)' : (isTyping || pwdHidden)
                ? `skewX(${(pp.bodySkew || 0) - 10}deg) translateX(36px)`
                : `skewX(${pp.bodySkew || 0}deg)`,
              transformOrigin: 'bottom center',
              boxShadow: '0 -10px 40px rgba(99,102,241,0.35)',
            }}>
              {/* Shine */}
              <div style={{ position: 'absolute', top: 0, left: 18, width: 22, height: '100%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)', borderRadius: '10px 0 0 0' }} />
              {/* Eyes */}
              <div style={{
                position: 'absolute', display: 'flex', gap: 14,
                transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                left: pwdShown ? 18 : isLookingAtEachOther ? 52 : Math.round(38 + pp.faceX),
                top: pwdShown ? 28 : isLookingAtEachOther ? 56 : Math.round(34 + pp.faceY),
              }}>
                <EyeBall size={18} pupilSize={7} eyeColor="white" pupilColor="#1a1933" isBlinking={isPurpleBlinking}
                  forceLookX={pwdShown ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={pwdShown ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} eyeColor="white" pupilColor="#1a1933" isBlinking={isPurpleBlinking}
                  forceLookX={pwdShown ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={pwdShown ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
              {/* AGENT badge */}
              <div style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.12)', borderRadius: 5,
                padding: '2px 8px', fontSize: '0.5rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', whiteSpace: 'nowrap',
              }}>AGENT</div>
            </div>

            {/* CHARACTER 2 — Dark navy rectangle (mid) */}
            <div ref={blackRef} style={{
              position: 'absolute', bottom: 0, left: 218,
              width: 108, height: 290,
              background: 'linear-gradient(175deg, #1e1b4b 0%, #13112e 100%)',
              border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: '8px 8px 0 0', zIndex: 2,
              transition: 'all 0.65s cubic-bezier(0.34,1.56,0.64,1)',
              transform: pwdShown ? 'skewX(0deg)' : isLookingAtEachOther
                ? `skewX(${(bp.bodySkew || 0) * 1.4 + 8}deg) translateX(18px)`
                : (isTyping || pwdHidden) ? `skewX(${(bp.bodySkew || 0) * 1.4}deg)`
                : `skewX(${bp.bodySkew || 0}deg)`,
              transformOrigin: 'bottom center',
              boxShadow: '0 -6px 28px rgba(30,27,75,0.5)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'linear-gradient(to bottom, #6366f1, transparent)', borderRadius: '8px 0 0 0' }} />
              <div style={{
                position: 'absolute', display: 'flex', gap: 14,
                transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                left: pwdShown ? 10 : isLookingAtEachOther ? 28 : Math.round(20 + bp.faceX),
                top: pwdShown ? 24 : isLookingAtEachOther ? 10 : Math.round(26 + bp.faceY),
              }}>
                <EyeBall size={16} pupilSize={6} eyeColor="rgba(255,255,255,0.9)" pupilColor="#1a1933" isBlinking={isBlackBlinking}
                  forceLookX={pwdShown ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={pwdShown ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} eyeColor="rgba(255,255,255,0.9)" pupilColor="#1a1933" isBlinking={isBlackBlinking}
                  forceLookX={pwdShown ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={pwdShown ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* CHARACTER 3 — Amber semicircle (front-left) */}
            <div ref={orangeRef} style={{
              position: 'absolute', bottom: 0, left: 0,
              width: 220, height: 185,
              background: 'linear-gradient(160deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '110px 110px 0 0', zIndex: 3,
              transition: 'all 0.65s cubic-bezier(0.34,1.56,0.64,1)',
              transform: pwdShown ? 'skewX(0deg)' : `skewX(${op.bodySkew || 0}deg)`,
              transformOrigin: 'bottom center',
              boxShadow: '0 -6px 28px rgba(245,158,11,0.22)',
            }}>
              <div style={{
                position: 'absolute', display: 'flex', gap: 22,
                transition: 'all 0.15s ease-out',
                left: pwdShown ? 48 : Math.round(74 + (op.faceX || 0)),
                top: pwdShown ? 78 : Math.round(82 + (op.faceY || 0)),
              }}>
                <Pupil size={11} pupilColor="#1a1933" forceLookX={pwdShown ? -5 : undefined} forceLookY={pwdShown ? -4 : undefined} />
                <Pupil size={11} pupilColor="#1a1933" forceLookX={pwdShown ? -5 : undefined} forceLookY={pwdShown ? -4 : undefined} />
              </div>
            </div>

            {/* CHARACTER 4 — Violet tall rounded (front-right) */}
            <div ref={yellowRef} style={{
              position: 'absolute', bottom: 0, left: 295,
              width: 126, height: 210,
              background: 'linear-gradient(170deg, #a78bfa 0%, #7c3aed 100%)',
              borderRadius: '63px 63px 0 0', zIndex: 4,
              transition: 'all 0.65s cubic-bezier(0.34,1.56,0.64,1)',
              transform: pwdShown ? 'skewX(0deg)' : `skewX(${yp.bodySkew || 0}deg)`,
              transformOrigin: 'bottom center',
              boxShadow: '0 -6px 28px rgba(167,139,250,0.22)',
            }}>
              <div style={{
                position: 'absolute', display: 'flex', gap: 18,
                transition: 'all 0.15s ease-out',
                left: pwdShown ? 18 : Math.round(44 + (yp.faceX || 0)),
                top: pwdShown ? 32 : Math.round(34 + (yp.faceY || 0)),
              }}>
                <Pupil size={11} pupilColor="#2d1b69" forceLookX={pwdShown ? -5 : undefined} forceLookY={pwdShown ? -4 : undefined} />
                <Pupil size={11} pupilColor="#2d1b69" forceLookX={pwdShown ? -5 : undefined} forceLookY={pwdShown ? -4 : undefined} />
              </div>
              {/* Mouth */}
              <div style={{
                position: 'absolute', width: 52, height: 3,
                background: 'rgba(45,27,105,0.5)', borderRadius: 2,
                transition: 'all 0.15s ease-out',
                left: pwdShown ? 10 : Math.round(34 + (yp.faceX || 0)),
                top: pwdShown ? 82 : Math.round(78 + (yp.faceY || 0)),
              }} />
            </div>
          </div>
        </div>

        {/* Left footer links */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 24 }}>
          {['Privacy Policy', 'Terms of Service', 'Contact'].map((l, i) => (
            <a key={i} href="/legal" style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >{l}</a>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(167,139,250,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={10} /> AES-256 Encrypted
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Clean login/signup form
      ══════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40, background: 'var(--bg-primary)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Logo — links to landing */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center', textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.04em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ForensicAI</span>
              <span style={{ display: 'block', fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>Intelligence Platform</span>
            </div>
          </Link>

          <AnimatePresence mode="wait">
            {requires2FA ? (
              /* ── 2FA Screen ── */
              <motion.div key="2fa" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }} style={{ textAlign: 'center' }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(99,102,241,0.15)' }}>
                  <Fingerprint size={32} color="var(--accent-secondary)" />
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 8 }}>Two-Factor Auth</h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 24 }}>
                  Your account requires passkey verification.<br />Use your fingerprint, Face ID, or security key.
                </p>
                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', color: 'var(--accent-danger)', fontSize: '0.82rem', marginBottom: 16 }}>{error}</div>}
                <button onClick={handle2FA} disabled={verifying2FA} style={{ width: '100%', height: 48, borderRadius: 10, background: 'var(--gradient-primary)', border: 'none', cursor: 'pointer', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>
                  {verifying2FA ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <><Fingerprint size={17} /> Verify with Passkey</>}
                </button>
                <button onClick={() => { setRequires2FA(false); setLoginToken(''); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', padding: '8px 0', width: '100%' }}>
                  ← Back to Sign In
                </button>
              </motion.div>
            ) : (
              /* ── Login / Signup Form ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text-primary)', marginBottom: 8 }}>
                    {isSignup ? 'Create account' : 'Welcome back!'}
                  </h1>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {isSignup ? 'Join the ForensicAI platform' : 'Sign in to your account'}
                  </p>
                </div>

                {/* Tab toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 28, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[{ label: 'Sign In', val: false }, { label: 'Sign Up', val: true }].map(({ label, val }) => (
                    <button key={label} onClick={() => { setIsSignup(val); setError('') }} style={{
                      flex: 1, height: 36, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.83rem', transition: 'all 0.2s',
                      background: isSignup === val ? 'var(--gradient-primary)' : 'transparent',
                      color: isSignup === val ? 'white' : 'var(--text-muted)',
                      boxShadow: isSignup === val ? '0 2px 12px rgba(99,102,241,0.3)' : 'none',
                    }}>{label}</button>
                  ))}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', color: 'var(--accent-danger)', fontSize: '0.82rem', marginBottom: 16 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    <motion.div key={isSignup ? 'signup' : 'login'} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      {/* Name (signup only) */}
                      {isSignup && (
                        <div>
                          <label style={labelStyle}>Full Name</label>
                          <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required autoComplete="name"
                            style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} />
                        </div>
                      )}

                      {/* Email */}
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                          style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} />
                      </div>

                      {/* Password */}
                      <div>
                        <label style={labelStyle}>Password</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isSignup ? 'new-password' : 'current-password'}
                            style={{ ...inputStyle, paddingRight: 44 }} onFocus={onFocusInput} onBlur={onBlurInput} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Signup extras */}
                      {isSignup && (
                        <>
                          <div>
                            <label style={labelStyle}>Confirm Password</label>
                            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                              style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} />
                          </div>
                          <div>
                            <label style={labelStyle}>Organization <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                            <input type="text" placeholder="Acme Corp" value={organization} onChange={e => setOrganization(e.target.value)} autoComplete="organization"
                              style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} />
                          </div>
                          <div>
                            <label style={labelStyle}>Role</label>
                            <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={onFocusInput} onBlur={onBlurInput}>
                              <option value="investigator">Investigator</option>
                              <option value="analyst">Analyst</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Remember me / Forgot password (login only) */}
                      {!isSignup && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
                            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                              style={{ width: 15, height: 15, accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
                            Remember for 30 days
                          </label>
                          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-secondary)', padding: 0, transition: 'opacity 0.2s' }}>
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Submit */}
                  <button type="submit" disabled={loading} style={{
                    width: '100%', height: 48, marginTop: 24, borderRadius: 10,
                    background: 'var(--gradient-primary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                    transition: 'box-shadow 0.2s, transform 0.15s',
                  }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'none' }}
                  >
                    {loading
                      ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      : <>{isSignup ? 'Create Account' : 'Sign In'} <ChevronRight size={17} /></>
                    }
                  </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Google button */}
                <button type="button" style={{
                  width: '100%', height: 48, borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >
                  <Mail size={17} />
                  {isSignup ? 'Sign up' : 'Sign in'} with Google
                </button>

                {/* Switch mode */}
                <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 28 }}>
                  {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                  <button onClick={() => { setIsSignup(!isSignup); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem', padding: 0 }}>
                    {isSignup ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
