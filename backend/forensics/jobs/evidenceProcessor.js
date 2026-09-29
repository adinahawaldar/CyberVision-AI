import path from 'path'
import Evidence from '../models/Evidence.js'
import { computeFileHash } from '../utils/hash.js'
import { parseLogFile } from '../utils/parser.js'
import { detectEventAnomalies } from '../ml/anomalyDetector.js'
import {
  buildEncryptedEvidencePath,
  encryptFile,
  removeFileQuietly,
  withPlaintextEvidence,
} from '../utils/fileSecurity.js'
import {
  markJobCompleted,
  markJobFailed,
  markJobRunning,
  updateTrackedJob,
} from './processingJobTracker.js'

const PARSEABLE_EXTS = new Set(['.log', '.txt', '.csv', '.json', '.xml', '.evtx', '.pcap', '.reg'])

export async function processEvidenceJob(job) {
  await markJobRunning(job, 'Starting evidence processing')

  try {
    const { evidenceId } = job.data
    const evidence = await Evidence.findById(evidenceId)
    if (!evidence) throw new Error(`Evidence not found: ${evidenceId}`)

    await setProgress(job, evidence, 5, 'Evidence job started')

    evidence.status = 'hashing'
    await evidence.save()

    const sha256Hash = evidence.storage?.isEncrypted
      ? await withPlaintextEvidence(evidence, plainPath => computeFileHash(plainPath))
      : await computeFileHash(evidence.filePath)
    evidence.sha256Hash = sha256Hash
    evidence.verifiedAt = new Date()
    await setProgress(job, evidence, 25, 'SHA-256 hash generated')

    if (!evidence.storage?.isEncrypted) {
      const sourcePath = evidence.filePath
      const encryptedPath = buildEncryptedEvidencePath(evidence)
      const encryption = await encryptFile(sourcePath, encryptedPath)

      evidence.filePath = encryptedPath
      evidence.storage = {
        provider: 'local',
        isEncrypted: true,
        ...encryption,
      }
      evidence.status = 'encrypted'
      await evidence.save()
      await removeFileQuietly(sourcePath)
    }

    await setProgress(job, evidence, 45, 'Evidence encrypted and stored securely')

    const ext = path.extname(evidence.originalName || evidence.filename || '').toLowerCase()
    if (!PARSEABLE_EXTS.has(ext)) {
      evidence.status = 'verified'
      evidence.parsedData = {
        events: [],
        summary: 'Evidence stored securely. No parser is configured for this binary artifact type.',
        anomalies: [],
      }
      await setProgress(job, evidence, 100, 'Evidence secured; parser skipped for binary artifact')
      await markJobCompleted(job, 'Evidence secured; parsing skipped')
      return { evidenceId, parsed: 0, skipped: true }
    }

    evidence.status = 'parsing'
    await evidence.save()
    await setProgress(job, evidence, 60, 'Controlled decrypt created for parser')

    const parsedResult = await withPlaintextEvidence(evidence, plainPath =>
      parseLogFile(plainPath, { originalName: evidence.originalName })
    )
    const mlResult = await detectEventAnomalies(parsedResult.events)

    evidence.parsedData = {
      events: mlResult.events.map(e => ({
        timestamp: e.timestamp || '',
        eventType: e.eventType || 'system',
        source: e.source || evidence.originalName,
        sourceType: e.sourceType || '',
        host: e.host || '',
        user: e.user || '',
        sourceIp: e.sourceIp || '',
        destinationIp: e.destinationIp || '',
        process: e.process || '',
        filePath: e.filePath || '',
        registryKey: e.registryKey || '',
        registryValue: e.registryValue || '',
        detail: e.detail || '',
        severity: e.severity || 'info',
        raw: e.raw || '',
        normalized: e.normalized !== false,
        parserType: e.parserType || parsedResult.parser,
        normalizerType: e.normalizerType || parsedResult.normalizer,
        riskScore: e.riskScore || 0,
        riskLevel: e.riskLevel || 'low',
        riskReasons: e.riskReasons || [],
        mlAnomaly: e.mlAnomaly || {
          isAnomaly: false,
          score: 0,
          confidence: 0,
          model: 'IsolationForest',
          reasons: [],
        },
        threatIntel: e.threatIntel || { score: 0, isMalicious: false, details: '' },
        mitreAttack: e.mitreAttack || { techniqueId: '', techniqueName: '', tactic: '' },
      })),
      summary: parsedResult.summary,
      anomalies: mlResult.events
        .filter(e => e.severity === 'danger' || e.severity === 'critical' || (e.riskScore || 0) >= 61)
        .map(e => e.detail),
      mlSummary: {
        ...mlResult.mlSummary,
        generatedAt: mlResult.mlSummary?.generatedAt ? new Date(mlResult.mlSummary.generatedAt) : new Date(),
      },
      mlAnomalies: mlResult.mlAnomalies,
    }

    evidence.metadata.lineCount = parsedResult.lineCount
    evidence.metadata.fileType = ext.replace('.', '')
    evidence.status = parsedResult.events.length > 0 ? 'parsed' : 'verified'
    evidence.processing.parserType = parsedResult.parser
    evidence.processing.normalizerType = parsedResult.normalizer
    evidence.processing.artifactType = parsedResult.artifactType
    evidence.processing.normalizedAt = new Date()
    await setProgress(job, evidence, 100, `Parsed and normalized ${parsedResult.parsedCount} event(s)`)

    await markJobCompleted(job, 'Evidence processing completed')
    return { evidenceId, parsed: parsedResult.parsedCount, parser: parsedResult.parser, normalizer: parsedResult.normalizer }
  } catch (err) {
    await markJobFailed(job, err)

    if (job.data?.evidenceId) {
      await Evidence.findByIdAndUpdate(job.data.evidenceId, {
        status: 'error',
        'processing.lastError': err.message,
        'processing.message': 'Evidence processing failed',
      })
    }

    throw err
  }
}

async function setProgress(job, evidence, progress, message) {
  await job.updateProgress(progress)
  evidence.processing.queueJobId = String(job.id)
  evidence.processing.progress = progress
  evidence.processing.message = message
  evidence.processing.lastError = ''
  await evidence.save()
  await updateTrackedJob(job, { progress, message })
}
