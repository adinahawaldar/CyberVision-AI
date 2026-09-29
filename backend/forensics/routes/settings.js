import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

const router = express.Router()

// Helper: get the authenticated user, or fallback to first user
async function getUser(req) {
  if (req.user && req.user.id) {
    const user = await User.findById(req.user.id)
    if (user) return user
  }
  if (process.env.NODE_ENV !== 'production') {
    // Fallback: get or create default user (for unauthenticated/single-user mode)
    let user = await User.findOne()
    if (!user) {
      const passwordHash = await bcrypt.hash('admin123', 12)
      user = await User.create({
        name: 'Admin',
        email: 'admin@forensicai.com',
        passwordHash,
        role: 'admin',
        organization: 'ForensicAI Labs',
      })
    }
    return user
  }
  return null
}

// GET /api/settings/profile — Get current user profile
router.get('/profile', optionalAuth, async (req, res, next) => {
  try {
    const user = await getUser(req)
    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      createdAt: user.createdAt,
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/settings/profile — Update profile
router.put('/profile', optionalAuth, async (req, res, next) => {
  try {
    const { name, email, role, organization } = req.body
    const user = await getUser(req)

    if (name) user.name = name
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      user.email = email.toLowerCase()
    }
    if (role) {
      if (role === 'admin' && user.role !== 'admin') {
        return res.status(400).json({ error: 'Cannot assign Administrator role' })
      }
      user.role = role
    }
    if (organization !== undefined) user.organization = organization

    await user.save()
    await logAudit('profile_updated', 'user', user._id, `Profile updated for ${user.name}`, req)

    // Re-issue JWT so the client immediately reflects the new name/role/verification without re-login
    let newToken
    try {
      newToken = jwt.sign(
        { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isEmailVerified },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      )
    } catch (e) { /* JWT_SECRET not set — single-user mode fallback */ }

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      isVerified: user.isEmailVerified,
      ...(newToken ? { token: newToken } : {}),
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/settings/password — Change password
router.put('/password', optionalAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const user = await getUser(req)

    // Verify current password if provided
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' })
      }
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    await user.save()
    await logAudit('password_changed', 'user', user._id, `Password changed for ${user.name}`, req)

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
})

// GET /api/settings/security — Get security settings
router.get('/security', optionalAuth, async (req, res, next) => {
  try {
    const user = await getUser(req)
    res.json({
      twoFactorEnabled: user.settings.twoFactorEnabled,
      sessionTimeout: user.settings.sessionTimeout,
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/settings/security — Update security settings
router.put('/security', optionalAuth, async (req, res, next) => {
  try {
    const { twoFactorEnabled, sessionTimeout } = req.body
    const user = await getUser(req)

    if (twoFactorEnabled !== undefined) user.settings.twoFactorEnabled = twoFactorEnabled
    if (sessionTimeout !== undefined) user.settings.sessionTimeout = sessionTimeout

    await user.save()
    await logAudit('security_updated', 'user', user._id, 'Security settings updated', req)

    res.json({
      twoFactorEnabled: user.settings.twoFactorEnabled,
      sessionTimeout: user.settings.sessionTimeout,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/settings/ai — Get AI engine configuration
router.get('/ai', optionalAuth, async (req, res, next) => {
  try {
    const user = await getUser(req)
    res.json({
      provider: user.settings.aiProvider,
      model: user.settings.aiModel,
      apiKey: user.settings.aiApiKey ? '••••' + user.settings.aiApiKey.slice(-4) : '',
      temperature: user.settings.aiTemperature,
      maxTokens: user.settings.aiMaxTokens,
      tone: user.settings.aiTone,
      autoGenerate: user.settings.aiAutoGenerate,
      requireApproval: user.settings.aiRequireApproval,
      abuseIpDbApiKey: user.settings.abuseIpDbApiKey ? '••••' + user.settings.abuseIpDbApiKey.slice(-4) : '',
      virusTotalApiKey: user.settings.virusTotalApiKey ? '••••' + user.settings.virusTotalApiKey.slice(-4) : '',
      threatSeverityThreshold: user.settings.threatSeverityThreshold,
      ragContextLimit: user.settings.ragContextLimit,
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/settings/ai — Update AI engine configuration
router.put('/ai', optionalAuth, async (req, res, next) => {
  try {
    const {
      provider, model, apiKey, temperature, maxTokens, tone, autoGenerate, requireApproval,
      abuseIpDbApiKey, virusTotalApiKey, threatSeverityThreshold, ragContextLimit
    } = req.body
    const user = await getUser(req)

    if (provider) user.settings.aiProvider = provider
    if (model) user.settings.aiModel = model
    if (apiKey !== undefined && !apiKey.startsWith('••••')) user.settings.aiApiKey = apiKey
    if (temperature !== undefined) user.settings.aiTemperature = temperature
    if (maxTokens !== undefined) user.settings.aiMaxTokens = maxTokens
    if (tone) user.settings.aiTone = tone
    if (autoGenerate !== undefined) user.settings.aiAutoGenerate = autoGenerate
    if (requireApproval !== undefined) user.settings.aiRequireApproval = requireApproval

    if (abuseIpDbApiKey !== undefined && !abuseIpDbApiKey.startsWith('••••')) user.settings.abuseIpDbApiKey = abuseIpDbApiKey
    if (virusTotalApiKey !== undefined && !virusTotalApiKey.startsWith('••••')) user.settings.virusTotalApiKey = virusTotalApiKey
    if (threatSeverityThreshold !== undefined) user.settings.threatSeverityThreshold = threatSeverityThreshold
    if (ragContextLimit !== undefined) user.settings.ragContextLimit = ragContextLimit

    await user.save()
    await logAudit('ai_config_updated', 'user', user._id, `AI & Threat config updated`, req)

    res.json({
      provider: user.settings.aiProvider,
      model: user.settings.aiModel,
      apiKey: user.settings.aiApiKey ? '••••' + user.settings.aiApiKey.slice(-4) : '',
      temperature: user.settings.aiTemperature,
      maxTokens: user.settings.aiMaxTokens,
      tone: user.settings.aiTone,
      autoGenerate: user.settings.aiAutoGenerate,
      requireApproval: user.settings.aiRequireApproval,
      abuseIpDbApiKey: user.settings.abuseIpDbApiKey ? '••••' + user.settings.abuseIpDbApiKey.slice(-4) : '',
      virusTotalApiKey: user.settings.virusTotalApiKey ? '••••' + user.settings.virusTotalApiKey.slice(-4) : '',
      threatSeverityThreshold: user.settings.threatSeverityThreshold,
      ragContextLimit: user.settings.ragContextLimit,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/settings/notifications — Get notification preferences
router.get('/notifications', optionalAuth, async (req, res, next) => {
  try {
    const user = await getUser(req)
    res.json({
      caseUpdates: user.settings.notifCaseUpdates,
      evidenceProcessing: user.settings.notifEvidenceProcessing,
      aiReports: user.settings.notifAiReports,
      integrityAlerts: user.settings.notifIntegrityAlerts,
      securityEvents: user.settings.notifSecurityEvents,
      maintenance: user.settings.notifMaintenance,
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/settings/notifications — Update notification preferences
router.put('/notifications', optionalAuth, async (req, res, next) => {
  try {
    const { caseUpdates, evidenceProcessing, aiReports, integrityAlerts, securityEvents, maintenance } = req.body
    const user = await getUser(req)

    if (caseUpdates !== undefined) user.settings.notifCaseUpdates = caseUpdates
    if (evidenceProcessing !== undefined) user.settings.notifEvidenceProcessing = evidenceProcessing
    if (aiReports !== undefined) user.settings.notifAiReports = aiReports
    if (integrityAlerts !== undefined) user.settings.notifIntegrityAlerts = integrityAlerts
    if (securityEvents !== undefined) user.settings.notifSecurityEvents = securityEvents
    if (maintenance !== undefined) user.settings.notifMaintenance = maintenance

    await user.save()
    await logAudit('notifications_updated', 'user', user._id, 'Notification preferences updated', req)

    res.json({
      caseUpdates: user.settings.notifCaseUpdates,
      evidenceProcessing: user.settings.notifEvidenceProcessing,
      aiReports: user.settings.notifAiReports,
      integrityAlerts: user.settings.notifIntegrityAlerts,
      securityEvents: user.settings.notifSecurityEvents,
      maintenance: user.settings.notifMaintenance,
    })
  } catch (err) {
    next(err)
  }
})

export default router
