import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { getSecuritySettings } from '../api'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

const DEFAULT_USER = {
  id: '6abbeb6e950cd05d5cf22cde',
  name: 'Admin',
  email: 'admin@forensicai.com',
  role: 'admin',
  organization: 'ForensicAI Labs',
}

const DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYmJlYjZlOTUwY2QwNWQ1Y2YyMmNkZSIsImVtYWlsIjoiYWRtaW5AZm9yZW5zaWNhaS5jb20iLCJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiQWRtaW4iLCJpYXQiOjE3OTA3MDA0ODIsImV4cCI6MTc5MzI5MjQ4Mn0.DQjH5O9_YihKJQTRPQZnNS1QUbUjuLr-f4EDLN8Y5H0'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('forensic_user')
      return stored ? JSON.parse(stored) : DEFAULT_USER
    } catch {
      return DEFAULT_USER
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('forensic_token') || DEFAULT_TOKEN)
  const [sessionTimeout, setSessionTimeout] = useState(30) // minutes
  const timerRef = useRef(null)

  const isAuthenticated = true

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('forensic_token')
    localStorage.removeItem('forensic_user')
    setToken(DEFAULT_TOKEN)
    setUser(DEFAULT_USER)
    if (timerRef.current) clearTimeout(timerRef.current)
    window.location.href = '/dashboard'
  }, [])

  // Login
  const login = useCallback((tokenVal, userData, timeout) => {
    localStorage.setItem('forensic_token', tokenVal)
    localStorage.setItem('forensic_user', JSON.stringify(userData))
    setToken(tokenVal)
    setUser(userData)
    if (timeout) setSessionTimeout(timeout)
  }, [])

  // ─── Auto-logout based on inactivity ───
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!isAuthenticated || sessionTimeout <= 0) return
    timerRef.current = setTimeout(() => {
      logout()
    }, sessionTimeout * 60 * 1000)
  }, [isAuthenticated, sessionTimeout, logout])

  // Fetch session timeout from security settings on mount
  useEffect(() => {
    if (!isAuthenticated) return
    getSecuritySettings()
      .then(data => {
        if (data.sessionTimeout) setSessionTimeout(data.sessionTimeout)
      })
      .catch(() => {})
  }, [isAuthenticated])

  // Listen for user activity
  useEffect(() => {
    if (!isAuthenticated) return

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    const handler = () => resetTimer()

    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    resetTimer() // Start initial timer

    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isAuthenticated, resetTimer])

  // Update User profile details in state and localStorage
  const updateUser = useCallback((userData, newToken) => {
    setUser(prev => {
      const newUser = { ...prev, ...userData }
      localStorage.setItem('forensic_user', JSON.stringify(newUser))
      return newUser
    })
    if (newToken) {
      setToken(newToken)
      localStorage.setItem('forensic_token', newToken)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, sessionTimeout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
