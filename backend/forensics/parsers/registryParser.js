export function parseRegistry(content) {
  const lines = content.split(/\r?\n/)
  const records = []
  let currentKey = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('Windows Registry Editor')) continue

    const keyMatch = trimmed.match(/^\[(.+)]$/)
    if (keyMatch) {
      currentKey = keyMatch[1]
      continue
    }

    const valueMatch = trimmed.match(/^(?:"([^"]+)"|@)=(.*)$/)
    if (valueMatch && currentKey) {
      records.push({
        keyPath: currentKey,
        valueName: valueMatch[1] || '(Default)',
        valueData: cleanRegistryValue(valueMatch[2]),
        raw: trimmed,
      })
    }
  }

  return {
    parser: 'registry-parser',
    records,
    lineCount: lines.length,
    summary: `Parsed ${records.length} registry value record(s)`,
  }
}

function cleanRegistryValue(value) {
  const trimmed = value.trim()
  if (/^dword:/i.test(trimmed)) {
    return `dword:${trimmed.slice(6)}`
  }
  if (/^hex/i.test(trimmed)) {
    return trimmed.replace(/\s+/g, '').replace(/\\$/, '')
  }
  return trimmed.replace(/^"/, '').replace(/"$/, '')
}
