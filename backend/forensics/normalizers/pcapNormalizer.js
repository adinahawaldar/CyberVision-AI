import { normalizeTimestamp } from './helpers.js'

export function normalizePcap(records, context = {}) {
  return records.map(record => {
    const protocol = record.protocol || 'UNKNOWN'
    const source = record.sourceIp
      ? `${record.sourceIp}${record.sourcePort ? `:${record.sourcePort}` : ''}`
      : 'pcap'
    const destination = record.destinationIp
      ? `${record.destinationIp}${record.destinationPort ? `:${record.destinationPort}` : ''}`
      : 'unknown'

    return {
      timestamp: normalizeTimestamp(record.timestamp),
      eventType: 'network',
      source: context.evidenceName || 'pcap-capture',
      sourceType: 'network_capture',
      sourceIp: record.sourceIp || '',
      destinationIp: record.destinationIp || '',
      process: protocol,
      detail: record.detail || `${protocol} ${source} -> ${destination}`,
      severity: 'info',
      raw: record.raw || JSON.stringify(record),
      normalized: true,
      parserType: context.parser,
      normalizerType: 'pcap-normalizer',
    }
  })
}
