import { baseEvent, detectSeverity } from './helpers.js'

function mapWindowsLevel(record) {
  const level = String(record.levelDisplayName || record.level || '').toLowerCase()
  if (level === '1' || level.includes('critical')) return 'critical'
  if (level === '2' || level.includes('error')) return 'danger'
  if (level === '3' || level.includes('warning')) return 'warning'
  return detectSeverity(`${record.detail || ''} ${record.rawXml || ''}`)
}

function mapWindowsEventType(record) {
  const eventId = String(record.eventId || '')
  if (['4624', '4625', '4634', '4648', '4771', '4776'].includes(eventId)) return 'authentication'
  if (['4688', '4689', '4103', '4104'].includes(eventId)) return 'process_execution'
  if (['4672', '4720', '4728', '4732', '4756'].includes(eventId)) return 'privilege_escalation'
  if (['4663', '4656', '4660'].includes(eventId)) return 'file_access'
  if (['5156', '5157'].includes(eventId)) return 'network'
  return 'system'
}

export function normalizeEvtx(records, context = {}) {
  return records.map(record => ({
    ...baseEvent({
      ...record,
      source: record.provider || record.channel || context.evidenceName,
      message: record.detail,
      raw: record.rawXml || JSON.stringify(record),
      severity: mapWindowsLevel(record),
      eventType: mapWindowsEventType(record),
    }, 'windows_event_log', context.evidenceName),
    eventId: record.eventId || '',
    parserType: context.parser,
    normalizerType: 'evtx-normalizer',
  }))
}
