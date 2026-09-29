export function scoreEvent(event) {
  let score = 0
  const reasons = []
  const text = `${event.detail || ''} ${event.raw || ''}`.toLowerCase()

  if (event.threatIntel?.score) {
    const intelScore = Math.min(40, Math.ceil(event.threatIntel.score / 3))
    score += intelScore
    reasons.push(`Threat intelligence score ${event.threatIntel.score}`)
  }

  if (event.user && /admin|root|administrator/i.test(event.user)) {
    score += 15
    reasons.push('Privileged account involved')
  }

  if (/failed password|authentication failure|logon failure|invalid user|event[_\s-]*id\s*[:=]?\s*4625/i.test(text)) {
    score += 20
    reasons.push('Authentication failure pattern')
  }

  if (/accepted password|successful logon|event[_\s-]*id\s*[:=]?\s*4624/i.test(text)) {
    score += 10
    reasons.push('Successful login event')
  }

  if (/powershell|cmd\.exe|\/bin\/bash|\/bin\/sh|wget|curl|invoke-webrequest/i.test(text)) {
    score += 25
    reasons.push('Suspicious command or script execution')
  }

  if (/sudo|privilege escalation|run as admin|root login/i.test(text)) {
    score += 20
    reasons.push('Privilege escalation signal')
  }

  if (/exfiltrat|upload|download|scp|sftp|archive|zip|tar\s+-czf/i.test(text)) {
    score += 15
    reasons.push('Data movement or transfer signal')
  }

  if (event.severity === 'critical') score += 20
  if (event.severity === 'danger') score += 15
  if (event.severity === 'warning') score += 5

  score = Math.min(100, score)
  const level = score >= 86 ? 'critical' : score >= 61 ? 'high' : score >= 31 ? 'medium' : 'low'

  return { score, level, reasons }
}
