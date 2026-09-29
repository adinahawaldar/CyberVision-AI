const FIFTEEN_MINUTES = 15 * 60 * 1000
const THIRTY_MINUTES = 30 * 60 * 1000
const SIXTY_MINUTES = 60 * 60 * 1000

const SEVERITY_RANK = {
  info: 1,
  warning: 2,
  danger: 3,
  critical: 4,
}

export function detectAttackAlerts(events = []) {
  const timeline = events
    .map((event, index) => ({
      ...event,
      _index: index,
      _time: parseEventTime(event.timestamp),
      _text: `${event.detail || ''} ${event.raw || ''} ${event.eventType || ''}`.toLowerCase(),
    }))
    .filter(event => event._time !== null)
    .sort((a, b) => a._time - b._time)

  const alerts = [
    ...detectFailedLoginBurst(timeline),
    ...detectBruteForceThenSuccess(timeline),
    ...detectSuspiciousShellAfterLogin(timeline),
    ...detectPrivilegeEscalationAfterLogin(timeline),
    ...detectTransferAfterExecution(timeline),
  ]

  return dedupeAlerts(alerts)
    .sort((a, b) => {
      const severityDelta = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
      if (severityDelta !== 0) return severityDelta
      return b.riskScore - a.riskScore
    })
}

function detectFailedLoginBurst(events) {
  const failures = events.filter(isFailedAuth)
  const alerts = []

  for (const group of groupBy(failures, authGroupKey).values()) {
    for (const windowEvents of rollingWindows(group, FIFTEEN_MINUTES)) {
      if (windowEvents.length < 5) continue
      const first = windowEvents[0]
      const last = windowEvents[windowEvents.length - 1]
      alerts.push(makeAlert({
        ruleId: 'CORR-BRUTE-BURST',
        title: 'Repeated Authentication Failures',
        severity: windowEvents.length >= 10 ? 'critical' : 'danger',
        riskScore: Math.min(100, 60 + windowEvents.length * 3),
        category: 'Credential Access',
        techniqueId: 'T1110',
        techniqueName: 'Brute Force',
        description: `${windowEvents.length} failed authentication event(s) occurred within ${formatDuration(last._time - first._time)} from the same user/source grouping.`,
        events: windowEvents,
      }))
      break
    }
  }

  return alerts
}

function detectBruteForceThenSuccess(events) {
  const failures = events.filter(isFailedAuth)
  const successes = events.filter(isSuccessfulAuth)
  const alerts = []

  for (const success of successes) {
    const priorFailures = failures.filter(event =>
      event._time <= success._time
      && success._time - event._time <= FIFTEEN_MINUTES
      && relatedAuthContext(event, success)
    )
    if (priorFailures.length < 3) continue

    const related = [...priorFailures.slice(-10), success]
    alerts.push(makeAlert({
      ruleId: 'CORR-BRUTE-SUCCESS',
      title: 'Brute Force Followed By Successful Login',
      severity: 'critical',
      riskScore: Math.min(100, 80 + priorFailures.length * 2),
      category: 'Credential Access',
      techniqueId: 'T1110',
      techniqueName: 'Brute Force',
      description: `${priorFailures.length} failed login attempt(s) were followed by a successful authentication for the same user/source grouping.`,
      events: related,
    }))
  }

  return alerts
}

function detectSuspiciousShellAfterLogin(events) {
  const logins = events.filter(isSuccessfulAuth)
  const shellEvents = events.filter(isSuspiciousShell)
  const alerts = []

  for (const command of shellEvents) {
    const login = findPriorRelatedEvent(logins, command, THIRTY_MINUTES)
    if (!login) continue

    alerts.push(makeAlert({
      ruleId: 'CORR-SHELL-AFTER-LOGIN',
      title: 'Suspicious Shell Or PowerShell After Login',
      severity: command.riskLevel === 'critical' || command.riskScore >= 80 ? 'critical' : 'danger',
      riskScore: Math.max(70, command.riskScore || 0),
      category: 'Execution',
      techniqueId: 'T1059',
      techniqueName: 'Command and Scripting Interpreter',
      description: 'A successful login was followed by shell, command prompt, PowerShell, or downloader execution in the same related context.',
      events: [login, command],
    }))
  }

  return alerts
}

function detectPrivilegeEscalationAfterLogin(events) {
  const logins = events.filter(isSuccessfulAuth)
  const escalations = events.filter(isPrivilegeEscalation)
  const alerts = []

  for (const escalation of escalations) {
    const login = findPriorRelatedEvent(logins, escalation, THIRTY_MINUTES)
    if (!login) continue

    alerts.push(makeAlert({
      ruleId: 'CORR-PRIVESC-AFTER-LOGIN',
      title: 'Privilege Escalation After Authentication',
      severity: 'danger',
      riskScore: Math.max(75, escalation.riskScore || 0),
      category: 'Privilege Escalation',
      techniqueId: escalation.mitreAttack?.techniqueId || 'T1548.001',
      techniqueName: escalation.mitreAttack?.techniqueName || 'Abuse Elevation Control Mechanism',
      description: 'Authentication activity was followed by sudo, root/admin, or privilege escalation behavior.',
      events: [login, escalation],
    }))
  }

  return alerts
}

function detectTransferAfterExecution(events) {
  const executionEvents = events.filter(isSuspiciousShell)
  const transfers = events.filter(isDataTransfer)
  const alerts = []

  for (const transfer of transfers) {
    const execution = findPriorRelatedEvent(executionEvents, transfer, SIXTY_MINUTES)
    if (!execution) continue

    alerts.push(makeAlert({
      ruleId: 'CORR-TRANSFER-AFTER-EXEC',
      title: 'Data Transfer After Script Execution',
      severity: 'danger',
      riskScore: Math.max(72, transfer.riskScore || 0, execution.riskScore || 0),
      category: 'Exfiltration / Command and Control',
      techniqueId: 'T1041',
      techniqueName: 'Exfiltration Over C2 Channel',
      description: 'A command/script execution event was followed by upload, download, archive, SCP, SFTP, curl, or wget activity.',
      events: [execution, transfer],
    }))
  }

  return alerts
}

function makeAlert({ ruleId, title, severity, riskScore, category, techniqueId, techniqueName, description, events }) {
  const sorted = [...events].sort((a, b) => a._time - b._time)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  return {
    id: `${ruleId}-${first._index}-${last._index}`,
    ruleId,
    title,
    severity,
    riskScore: Math.min(100, Math.round(riskScore)),
    category,
    mitreAttack: {
      techniqueId,
      techniqueName,
      tactic: category,
    },
    description,
    startTime: toIso(first._time),
    endTime: toIso(last._time),
    eventCount: sorted.length,
    entities: {
      users: unique(sorted.map(event => event.user).filter(Boolean)),
      sourceIps: unique(sorted.map(event => event.sourceIp).filter(Boolean)),
      destinationIps: unique(sorted.map(event => event.destinationIp).filter(Boolean)),
      hosts: unique(sorted.map(event => event.host).filter(Boolean)),
    },
    evidence: sorted.map(event => ({
      timestamp: event.timestamp || '',
      eventType: event.eventType || 'system',
      source: event.source || '',
      evidenceName: event.evidenceName || '',
      user: event.user || '',
      sourceIp: event.sourceIp || '',
      destinationIp: event.destinationIp || '',
      detail: truncate(event.detail || event.raw || '', 260),
      riskScore: event.riskScore || 0,
      riskLevel: event.riskLevel || 'low',
      mitreAttack: event.mitreAttack || { techniqueId: '', techniqueName: '', tactic: '' },
    })),
  }
}

function parseEventTime(timestamp) {
  const value = Date.parse(timestamp || '')
  return Number.isNaN(value) ? null : value
}

function isFailedAuth(event) {
  return /failed password|authentication failure|login failed|logon failure|invalid user|incorrect password|4625/.test(event._text)
}

function isSuccessfulAuth(event) {
  return /accepted password|successful logon|login successful|session opened|4624/.test(event._text)
}

function isSuspiciousShell(event) {
  return /powershell|cmd\.exe|\/bin\/bash|\/bin\/sh|wget|curl|invoke-webrequest|certutil|bitsadmin/.test(event._text)
}

function isPrivilegeEscalation(event) {
  return /sudo|su\s+-|privilege escalation|root login|run as admin|administrator|elevated privileges/.test(event._text)
}

function isDataTransfer(event) {
  return /exfiltrat|upload|download|scp|sftp|ftp|archive|zip|tar\s+-czf|curl|wget|invoke-webrequest/.test(event._text)
}

function authGroupKey(event) {
  return [
    event.user || 'unknown-user',
    event.sourceIp || event.host || event.source || 'unknown-source',
  ].join('|').toLowerCase()
}

function groupBy(items, keyFn) {
  const grouped = new Map()
  for (const item of items) {
    const key = keyFn(item)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(item)
  }
  for (const group of grouped.values()) {
    group.sort((a, b) => a._time - b._time)
  }
  return grouped
}

function rollingWindows(events, windowMs) {
  const windows = []
  for (let start = 0; start < events.length; start++) {
    const endEvents = []
    const startTime = events[start]._time
    for (let i = start; i < events.length; i++) {
      if (events[i]._time - startTime > windowMs) break
      endEvents.push(events[i])
    }
    windows.push(endEvents)
  }
  return windows.sort((a, b) => b.length - a.length)
}

function findPriorRelatedEvent(candidates, target, windowMs) {
  const related = candidates
    .filter(candidate =>
      candidate._time <= target._time
      && target._time - candidate._time <= windowMs
      && relatedContext(candidate, target)
    )
    .sort((a, b) => b._time - a._time)

  return related[0] || null
}

function relatedContext(left, right) {
  const userMatch = left.user && right.user && left.user.toLowerCase() === right.user.toLowerCase()
  const hostMatch = left.host && right.host && left.host.toLowerCase() === right.host.toLowerCase()
  const sourceIpMatch = left.sourceIp && right.sourceIp && left.sourceIp === right.sourceIp
  return userMatch || hostMatch || sourceIpMatch
}

function relatedAuthContext(left, right) {
  const userMatch = left.user && right.user && left.user.toLowerCase() === right.user.toLowerCase()
  const sourceIpMatch = left.sourceIp && right.sourceIp && left.sourceIp === right.sourceIp
  const hostMatch = left.host && right.host && left.host.toLowerCase() === right.host.toLowerCase()
  return userMatch || sourceIpMatch || hostMatch
}

function dedupeAlerts(alerts) {
  const merged = new Map()
  for (const alert of alerts) {
    const key = [
      alert.ruleId,
      alert.startTime.slice(0, 10),
      alert.entities.users.join(',') || 'no-user',
      alert.entities.sourceIps.join(',') || 'no-source-ip',
      alert.entities.hosts.join(',') || 'no-host',
    ].join('|')

    if (!merged.has(key)) {
      merged.set(key, alert)
      continue
    }

    const current = merged.get(key)
    current.riskScore = Math.max(current.riskScore, alert.riskScore)
    current.severity = higherSeverity(current.severity, alert.severity)
    current.startTime = current.startTime < alert.startTime ? current.startTime : alert.startTime
    current.endTime = current.endTime > alert.endTime ? current.endTime : alert.endTime
    current.evidence = mergeEvidence(current.evidence, alert.evidence)
    current.eventCount = current.evidence.length
    current.entities = {
      users: unique([...current.entities.users, ...alert.entities.users]),
      sourceIps: unique([...current.entities.sourceIps, ...alert.entities.sourceIps]),
      destinationIps: unique([...current.entities.destinationIps, ...alert.entities.destinationIps]),
      hosts: unique([...current.entities.hosts, ...alert.entities.hosts]),
    }
    current.description = `${current.description} Additional matching events were merged into this alert.`
  }
  return [...merged.values()]
}

function mergeEvidence(left, right) {
  const seen = new Set()
  const merged = []
  for (const event of [...left, ...right]) {
    const key = `${event.timestamp}|${event.detail}|${event.source}|${event.user}|${event.sourceIp}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(event)
  }
  return merged.sort((a, b) => Date.parse(a.timestamp || '') - Date.parse(b.timestamp || ''))
}

function higherSeverity(left, right) {
  return SEVERITY_RANK[right] > SEVERITY_RANK[left] ? right : left
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function toIso(time) {
  return new Date(time).toISOString()
}

function formatDuration(ms) {
  const minutes = Math.max(1, Math.round(ms / 60000))
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

function truncate(value, maxLength) {
  const text = String(value || '')
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}
