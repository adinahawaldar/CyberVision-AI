import { baseEvent } from './helpers.js'

export function normalizeCsv(records, context = {}) {
  return records.map(record => {
    const lowerMap = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key.toLowerCase().replace(/\s+/g, '_'), value])
    )

    const detail = lowerMap.message || lowerMap.description || lowerMap.event || lowerMap.action ||
      Object.entries(record)
        .filter(([key]) => key !== 'raw')
        .map(([key, value]) => `${key}=${value}`)
        .join(' | ')

    return {
      ...baseEvent({
        timestamp: lowerMap.timestamp || lowerMap.time || lowerMap.date,
        source: lowerMap.source || lowerMap.host || lowerMap.hostname || lowerMap.protocol || 'csv',
        host: lowerMap.host || lowerMap.hostname || '',
        user: lowerMap.user || lowerMap.username || lowerMap.account || '',
        sourceIp: lowerMap.source_ip || lowerMap.src_ip || lowerMap.ip || '',
        detail,
        raw: record.raw,
      }, 'csv_artifact', context.evidenceName),
      parserType: context.parser,
      normalizerType: 'csv-normalizer',
    }
  })
}
