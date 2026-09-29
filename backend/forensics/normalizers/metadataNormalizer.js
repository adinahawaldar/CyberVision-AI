import { baseEvent, normalizeTimestamp } from './helpers.js'

export function normalizeMetadata(records, context = {}) {
  return records.flatMap(record => {
    const lowerMap = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key.toLowerCase().replace(/\s+/g, '_'), value])
    )

    const filePath = lowerMap.path || lowerMap.file_path || lowerMap.filename || lowerMap.file || ''
    const owner = lowerMap.owner || lowerMap.user || ''
    const source = context.evidenceName || 'filesystem_metadata'
    const timestamps = [
      ['created', lowerMap.created || lowerMap.created_at || lowerMap.ctime],
      ['modified', lowerMap.modified || lowerMap.modified_at || lowerMap.mtime],
      ['accessed', lowerMap.accessed || lowerMap.accessed_at || lowerMap.atime],
    ].filter(([, value]) => value)

    if (timestamps.length === 0) {
      return [{
        ...baseEvent({
          timestamp: lowerMap.timestamp || lowerMap.time,
          source,
          user: owner,
          detail: `Metadata observed for ${filePath || 'unknown file'}`,
          raw: record.raw || JSON.stringify(record),
        }, 'filesystem_metadata', context.evidenceName),
        filePath,
        parserType: context.parser,
        normalizerType: 'metadata-normalizer',
      }]
    }

    return timestamps.map(([kind, value]) => ({
      timestamp: normalizeTimestamp(value),
      sourceType: 'filesystem_metadata',
      source,
      host: lowerMap.host || lowerMap.hostname || '',
      user: owner,
      eventType: 'file_access',
      severity: /temp|appdata|startup|system32/i.test(filePath) ? 'warning' : 'info',
      detail: `File ${kind} timestamp for ${filePath}`,
      filePath,
      raw: record.raw || JSON.stringify(record),
      normalized: true,
      parserType: context.parser,
      normalizerType: 'metadata-normalizer',
    }))
  })
}
