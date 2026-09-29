import AuditLog from '../models/AuditLog.js'

export async function logAudit(action, entityType, entityId, details, req = null) {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      details,
      userId: req?.user?.id || null,
      userName: req?.user?.name || 'System',
      ipAddress: req?.ip || 'internal',
      userAgent: req?.get('User-Agent') || 'server',
    })
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}
