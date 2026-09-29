import fs from 'fs'
import path from 'path'
import { parseSystemLog } from './systemLogParser.js'
import { parseCsv } from './csvParser.js'
import { parseJson } from './jsonParser.js'
import { parseMetadata } from './metadataParser.js'
import { parseRegistry } from './registryParser.js'
import { parsePythonArtifact } from './pythonArtifactParser.js'
import { normalizeSystemLog } from '../normalizers/systemLogNormalizer.js'
import { normalizeCsv } from '../normalizers/csvNormalizer.js'
import { normalizeJson } from '../normalizers/jsonNormalizer.js'
import { normalizeMetadata } from '../normalizers/metadataNormalizer.js'
import { normalizeRegistry } from '../normalizers/registryNormalizer.js'
import { normalizePcap } from '../normalizers/pcapNormalizer.js'
import { normalizeEvtx } from '../normalizers/evtxNormalizer.js'

export async function parseAndNormalizeFile(filePath, options = {}) {
  const evidenceName = options.originalName || path.basename(filePath)
  const ext = path.extname(evidenceName || filePath).toLowerCase()

  if (ext === '.pcap' || ext === '.evtx') {
    const parsed = await parsePythonArtifact(filePath, options)
    const events = parsed.artifactType === 'pcap'
      ? normalizePcap(parsed.records, { parser: parsed.parser, evidenceName })
      : normalizeEvtx(parsed.records, { parser: parsed.parser, evidenceName })

    return {
      artifactType: parsed.artifactType,
      parser: parsed.parser,
      normalizer: events[0]?.normalizerType || `${parsed.artifactType}-normalizer`,
      events,
      lineCount: parsed.lineCount,
      parsedCount: events.length,
      summary: parsed.summary,
      metadata: parsed.metadata,
      warnings: parsed.warnings || [],
    }
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const artifactType = detectArtifactType(content, ext, evidenceName)

  let parsed
  let events

  if (artifactType === 'registry') {
    parsed = parseRegistry(content)
    events = normalizeRegistry(parsed.records, { parser: parsed.parser, evidenceName })
  } else if (artifactType === 'metadata') {
    parsed = parseMetadata(content, ext)
    events = normalizeMetadata(parsed.records, { parser: parsed.parser, evidenceName })
  } else if (artifactType === 'csv') {
    parsed = parseCsv(content)
    events = normalizeCsv(parsed.records, { parser: parsed.parser, evidenceName })
  } else if (artifactType === 'json') {
    parsed = parseJson(content)
    events = normalizeJson(parsed.records, { parser: parsed.parser, evidenceName })
  } else {
    parsed = parseSystemLog(content)
    events = normalizeSystemLog(parsed.records, { parser: parsed.parser, evidenceName })
  }

  return {
    artifactType,
    parser: parsed.parser,
    normalizer: events[0]?.normalizerType || `${artifactType}-normalizer`,
    events,
    lineCount: parsed.lineCount,
    parsedCount: events.length,
    summary: parsed.summary,
  }
}

function detectArtifactType(content, ext, evidenceName = '') {
  const name = evidenceName.toLowerCase()
  if (ext === '.reg' || /^Windows Registry Editor/im.test(content) || name.includes('registry')) return 'registry'
  if (name.includes('metadata') || name.includes('mft') || name.includes('file-list')) return 'metadata'
  if (ext === '.json') {
    if (/("path"|"file_path"|"owner"|"created"|"modified"|"accessed")/i.test(content)) {
      return 'metadata'
    }
    return 'json'
  }
  if (ext === '.csv') {
    if (/path|file_path|created|modified|owner/i.test(content.split(/\r?\n/)[0] || '')) return 'metadata'
    return 'csv'
  }
  return 'system'
}
