import path from 'path'
import { execFile } from 'child_process'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const parserScript = path.resolve(__dirname, '../python_parsers/parse_artifact.py')

export async function parsePythonArtifact(filePath, options = {}) {
  const pythonBin = process.env.PYTHON_BIN || 'python'
  const maxRecords = String(options.maxRecords || process.env.PARSER_MAX_RECORDS || 5000)
  const maxBuffer = parseInt(process.env.PARSER_MAX_OUTPUT_BYTES || '52428800', 10)

  try {
    const { stdout } = await execFileAsync(
      pythonBin,
      [
        parserScript,
        filePath,
        '--original-name',
        options.originalName || path.basename(filePath),
        '--limit',
        maxRecords,
      ],
      {
        maxBuffer,
        timeout: parseInt(process.env.PARSER_TIMEOUT_MS || '120000', 10),
      }
    )

    const parsed = JSON.parse(stdout)
    return {
      artifactType: parsed.artifactType,
      parser: parsed.parser,
      records: parsed.records || [],
      lineCount: parsed.lineCount || parsed.records?.length || 0,
      summary: parsed.summary || `Parsed ${(parsed.records || []).length} artifact record(s)`,
      metadata: parsed.metadata || {},
      warnings: parsed.warnings || [],
    }
  } catch (error) {
    const detail = error.stderr || error.stdout || error.message
    throw new Error(`Python artifact parser failed: ${String(detail).trim()}`)
  }
}
