export function parseSystemLog(content) {
  if (/^\s*Event\s*ID\s*:/im.test(content) || /^\s*Timestamp\s*:/im.test(content)) {
    return parseKeyValueBlocks(content)
  }

  const lines = content.split(/\r?\n/).filter(line => line.trim())
  const records = []

  const patterns = [
    {
      regex: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(INFO|WARN|WARNING|ERROR|DEBUG|CRITICAL|FATAL)\s+(.*)/i,
      extract: m => ({ timestamp: m[1], source: m[2].toUpperCase(), detail: m[3] }),
    },
    {
      regex: /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^\[:]+)(?:\[\d+\])?:\s+(.*)/,
      extract: m => ({ timestamp: m[1], host: m[2], source: m[3], detail: m[4] }),
    },
    {
      regex: /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(.*)/,
      extract: m => ({ timestamp: m[1], host: m[2], detail: m[3] }),
    },
    {
      regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+(.*)/,
      extract: m => ({ timestamp: m[1], source: 'log', detail: m[2] }),
    },
    {
      regex: /\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s*[+-]\d{4})\]\s*(.*)/,
      extract: m => ({ timestamp: m[1], source: 'http', detail: m[2] }),
    },
    {
      regex: /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s+(.*)/,
      extract: m => ({ timestamp: m[1], source: 'windows', detail: m[2] }),
    },
  ]

  for (const line of lines) {
    let parsed = null
    for (const pattern of patterns) {
      const match = line.match(pattern.regex)
      if (match) {
        parsed = pattern.extract(match)
        break
      }
    }

    if (parsed) {
      records.push({ ...parsed, raw: line })
    }
  }

  return {
    parser: 'system-log-parser',
    records,
    lineCount: lines.length,
    summary: `Parsed ${records.length} system log event(s) from ${lines.length} line(s)`,
  }
}

function parseKeyValueBlocks(content) {
  const blocks = content.split(/\r?\n\s*\r?\n/).filter(block => block.trim())
  const records = []

  for (const block of blocks) {
    const record = {}
    for (const line of block.split(/\r?\n/)) {
      const match = line.match(/^([^:]+):\s*(.*)$/)
      if (!match) continue
      const key = match[1].trim().toLowerCase().replace(/\s+/g, '_')
      record[key] = match[2].trim()
    }

    const timestamp = record.timestamp || record.time_created || record.timecreated
    if (!timestamp) continue

    records.push({
      timestamp,
      source: record.provider || record.module || record.source || 'windows-event',
      host: record.computer || record.host || record.hostname || '',
      user: record.account_name || record.user || record.subject_user_name || '',
      sourceIp: record.source_address || record.source_network_address || '',
      eventId: record.event_id || record.eventid || '',
      detail: record.description || record.message || block.replace(/\r?\n/g, ' | '),
      raw: block.replace(/\r?\n/g, ' | '),
    })
  }

  return {
    parser: 'system-log-keyvalue-parser',
    records,
    lineCount: content.split(/\r?\n/).length,
    summary: `Parsed ${records.length} structured system log event(s)`,
  }
}
