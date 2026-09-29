import { parseCsv } from './csvParser.js'
import { parseJson } from './jsonParser.js'

export function parseMetadata(content, ext) {
  const parsed = ext === '.json' ? parseJson(content) : parseCsv(content)
  return {
    ...parsed,
    parser: `metadata-${parsed.parser}`,
    summary: `Parsed ${parsed.records.length} filesystem metadata record(s)`,
  }
}
