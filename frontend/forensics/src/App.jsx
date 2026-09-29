import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import EvidenceUpload from './pages/EvidenceUpload'
import Timeline from './pages/Timeline'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import Settings from './pages/Settings'
import Legal from './pages/Legal'
import Login from './pages/Login'
import MitreAttack from './pages/MitreAttack'
import CaseChat from './pages/CaseChat'
import ThreatIocs from './pages/ThreatIocs'
import AnomalyDashboard from './pages/AnomalyDashboard'

function ProtectedRoute({ children }) {
  return children
}

function AppRoutes() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Routes>
      {/* Direct access to dashboard without login screen */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/legal" element={<Legal />} />

      {/* Protected app routes — with sidebar + header */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><Dashboard /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/cases" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><Cases /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/cases/:id" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><CaseDetail /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/evidence" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><EvidenceUpload /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/timeline" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><Timeline /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/mitre" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><MitreAttack /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/iocs" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><ThreatIocs /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/anomalies" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><AnomalyDashboard /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><CaseChat /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><Reports /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/reports/:id" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><ReportDetail /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-wrapper">
              <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
              <main className="main-content"><Settings /></main>
            </div>
          </div>
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
