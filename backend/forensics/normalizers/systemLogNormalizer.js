import { baseEvent } from './helpers.js'

export function normalizeSystemLog(records, context = {}) {
  return records.map(record => ({
    ...baseEvent(record, 'system_log', context.evidenceName),
    eventId: record.eventId || '',
    parserType: context.parser,
    normalizerType: 'system-log-normalizer',
  }))
}
