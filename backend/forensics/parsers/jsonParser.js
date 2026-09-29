export function parseJson(content) {
  const data = JSON.parse(content)
  const records = Array.isArray(data) ? data : [data]

  return {
    parser: 'json-parser',
    records: records.map(record => ({
      ...record,
      raw: JSON.stringify(record),
    })),
    lineCount: records.length,
    summary: `Parsed ${records.length} JSON record(s)`,
  }
}
