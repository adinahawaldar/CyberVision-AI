export function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) {
    return { parser: 'csv-parser', records: [], lineCount: 0, summary: 'Empty CSV artifact' }
  }

  const headers = splitCsvLine(lines[0]).map(h => h.trim())
  const records = []

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i])
    const record = { raw: lines[i] }
    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() || ''
    })
    records.push(record)
  }

  return {
    parser: 'csv-parser',
    records,
    lineCount: lines.length - 1,
    summary: `Parsed ${records.length} CSV row(s)`,
  }
}

function splitCsvLine(line) {
  const values = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && line[i + 1] === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}
