import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { getWorkingDir, ensureDir, removeFileQuietly } from '../utils/fileSecurity.js'

const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const detectorScript = path.resolve(__dirname, './anomaly_detector.py')

export async function detectEventAnomalies(events = [], options = {}) {
  const pythonBin = process.env.PYTHON_BIN || 'python'
  const contamination = Number(options.contamination || process.env.ML_CONTAMINATION || 0.15)
  const workingDir = path.join(getWorkingDir(), 'ml')
  await ensureDir(workingDir)

  const inputPath = path.join(workingDir, `events-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)

  try {
    await fs.promises.writeFile(inputPath, JSON.stringify({ events }), 'utf-8')

    const { stdout } = await execFileAsync(
      pythonBin,
      [
        detectorScript,
        inputPath,
        '--contamination',
        String(contamination),
      ],
      {
        maxBuffer: parseInt(process.env.ML_MAX_OUTPUT_BYTES || '52428800', 10),
        timeout: parseInt(process.env.ML_TIMEOUT_MS || '120000', 10),
      }
    )

    const payload = JSON.parse(stdout)
    const results = payload.results || []
    const enrichedEvents = events.map((event, index) => {
      const anomaly = results.find(item => item.index === index) || {}
      return {
        ...event,
        mlAnomaly: {
          isAnomaly: !!anomaly.isAnomaly,
          score: Number(anomaly.score || 0),
          confidence: Number(anomaly.confidence || 0),
          model: payload.summary?.model || 'IsolationForest',
          reasons: anomaly.reasons || [],
        },
      }
    })

    const mlAnomalies = enrichedEvents
      .filter(event => event.mlAnomaly?.isAnomaly)
      .sort((a, b) => (b.mlAnomaly?.score || 0) - (a.mlAnomaly?.score || 0))
      .map(event => ({
        timestamp: event.timestamp || '',
        eventType: event.eventType || 'system',
        source: event.source || '',
        sourceType: event.sourceType || '',
        host: event.host || '',
        user: event.user || '',
        sourceIp: event.sourceIp || '',
        destinationIp: event.destinationIp || '',
        detail: event.detail || event.raw || '',
        severity: event.severity || 'info',
        riskScore: event.riskScore || 0,
        riskLevel: event.riskLevel || 'low',
        mlScore: event.mlAnomaly?.score || 0,
        confidence: event.mlAnomaly?.confidence || 0,
        reasons: event.mlAnomaly?.reasons || [],
        evidenceName: event.evidenceName || '',
        mitreAttack: event.mitreAttack || { techniqueId: '', techniqueName: '', tactic: '' },
      }))

    return {
      events: enrichedEvents,
      mlSummary: {
        ...(payload.summary || {}),
        generatedAt: new Date().toISOString(),
      },
      mlAnomalies,
    }
  } catch (error) {
    const detail = error.stderr || error.stdout || error.message
    return {
      events,
      mlSummary: {
        model: 'IsolationForest',
        status: 'error',
        totalEvents: events.length,
        anomaliesDetected: 0,
        error: String(detail).trim(),
        generatedAt: new Date().toISOString(),
      },
      mlAnomalies: [],
    }
  } finally {
    await removeFileQuietly(inputPath)
  }
}
