export function detectSeverity(text = '') {
  const lower = text.toLowerCase()
  if (/critical|fatal|emergency|panic|ransomware/.test(lower)) return 'critical'
  if (/error|fail|denied|refused|attack|malicious|exfiltrat|multiple.*fail|brute|4625/.test(lower)) return 'danger'
  if (/warn|alert|suspicious|unusual|escalat|restricted|blocked/.test(lower)) return 'warning'
  return 'info'
}

export function normalizeSeverity(value, text = '') {
  const lower = String(value || '').toLowerCase()
  if (['info', 'warning', 'danger', 'critical'].includes(lower)) return lower
  if (/critical|fatal|emergency|panic/.test(lower)) return 'critical'
  if (/error|err|fail|denied|high/.test(lower)) return 'danger'
  if (/warn|medium|alert|suspicious/.test(lower)) return 'warning'
  return detectSeverity(text)
}

export function detectEventType(text = '') {
  const lower = text.toLowerCase()
  if (/failed password|auth|password|credential|ssh|session|logon|login|4624|4625/.test(lower)) return 'authentication'
  if (/network|tcp|udp|port|scan|connection|ip=|source ip|dest|firewall/.test(lower)) return 'network'
  if (/file|read|write|access|permission|directory|path|metadata/.test(lower)) return 'file_access'
  if (/registry|run key|hkey|autorun/.test(lower)) return 'registry'
  if (/sudo|root|admin|privilege|escalat|role.*admin/.test(lower)) return 'privilege_escalation'
  if (/exfiltrat|transfer|upload|download|scp|invoke-webrequest/.test(lower)) return 'data_transfer'
  if (/malware|virus|trojan|ransomware|payload/.test(lower)) return 'malware'
  return 'system'
}

export function extractIp(text = '') {
  return text.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/)?.[0] || ''
}

export function extractHash(text = '') {
  return text.match(/\b[a-fA-F0-9]{32}\b|\b[a-fA-F0-9]{64}\b/)?.[0] || ''
}

export function normalizeTimestamp(value, fallbackYear = new Date().getFullYear()) {
  if (!value) return ''
  const raw = String(value).trim()

  const syslog = raw.match(/^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})/)
  if (syslog) {
    const parsed = new Date(`${syslog[1]} ${syslog[2]} ${fallbackYear} ${syslog[3]} UTC`)
    if (!isNaN(parsed)) return parsed.toISOString()
  }

  const direct = new Date(raw)
  if (!isNaN(direct)) return direct.toISOString()

  return raw
}

export function baseEvent(record, sourceType, evidenceName) {
  const raw = record.raw || record.message || record.detail || ''
  const detail = record.detail || record.message || raw

  const text = `${detail} ${raw}`

  return {
    timestamp: normalizeTimestamp(record.timestamp || record.timeCreated || record.time || record.date),
    sourceType,
    source: record.source || record.service || record.provider || evidenceName || sourceType,
    host: record.host || record.hostname || '',
    user: record.user || record.accountName || record.account || '',
    sourceIp: record.sourceIp || record.sourceAddress || extractIp(detail || raw),
    eventType: record.eventType || detectEventType(text),
    severity: normalizeSeverity(record.severity, text),
    detail,
    raw,
    normalized: true,
  }
}
