import { baseEvent } from './helpers.js'

export function normalizeJson(records, context = {}) {
  return records.map(record => ({
    ...baseEvent({
      timestamp: record.timestamp || record.time || record.date || record['@timestamp'],
      source: record.source || record.logger || record.facility || record.provider || 'json',
      host: record.host || record.hostname || record.computer || '',
      user: record.user || record.username || record.accountName || record.account || '',
      sourceIp: record.sourceIp || record.source_ip || record.ip || record.sourceAddress || '',
      eventType: record.type || record.event_type || record.eventType,
      severity: record.level || record.severity,
      detail: record.message || record.msg || record.description || record.event || JSON.stringify(record),
      raw: record.raw || JSON.stringify(record),
    }, 'json_artifact', context.evidenceName),
    parserType: context.parser,
    normalizerType: 'json-normalizer',
  }))
}
