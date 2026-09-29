import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'

const ALGORITHM = 'aes-256-gcm'
const DEFAULT_KEY_ID = 'local-evidence-key'

export function getEvidenceStoreDir() {
  return path.resolve(process.env.EVIDENCE_STORE_DIR || './evidence-store')
}

export function getWorkingDir() {
  return path.resolve(process.env.WORKING_DIR || './tmp/processing')
}

export async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true })
}

export function buildEncryptedEvidencePath(evidence) {
  const caseId = evidence.caseId?.toString() || 'unassigned'
  return path.join(getEvidenceStoreDir(), caseId, `${evidence._id}.enc`)
}

export async function encryptFile(inputPath, outputPath) {
  await ensureDir(path.dirname(outputPath))

  const iv = crypto.randomBytes(12)
  const keyId = getCurrentKeyId()
  const key = getEncryptionKey(keyId)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  await pipeline(
    fs.createReadStream(inputPath),
    cipher,
    fs.createWriteStream(outputPath, { mode: 0o600 })
  )

  return {
    algorithm: ALGORITHM,
    encryptedPath: outputPath,
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    keyId,
  }
}

export async function decryptFile(inputPath, outputPath, ivHex, authTagHex, keyId) {
  await ensureDir(path.dirname(outputPath))

  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(keyId), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  await pipeline(
    fs.createReadStream(inputPath),
    decipher,
    fs.createWriteStream(outputPath, { mode: 0o600 })
  )

  return outputPath
}

export async function withPlaintextEvidence(evidence, callback) {
  if (!evidence.storage?.isEncrypted) {
    return callback(evidence.filePath)
  }

  const ext = path.extname(evidence.originalName || evidence.filename || '')
  const tempPath = path.join(getWorkingDir(), `${evidence._id}-${Date.now()}${ext || '.artifact'}`)

  try {
    await decryptFile(
      evidence.storage.encryptedPath,
      tempPath,
      evidence.storage.iv,
      evidence.storage.authTag,
      evidence.storage.keyId
    )
    return await callback(tempPath)
  } finally {
    await removeFileQuietly(tempPath)
  }
}

export async function removeFileQuietly(filePath) {
  if (!filePath) return
  try {
    await fs.promises.rm(filePath, { force: true })
  } catch {}
}

export function getEvidenceSecurityStatus() {
  const configured = process.env.EVIDENCE_ENCRYPTION_KEY
  let dedicatedKeyValid = false
  let validationError = null

  try {
    dedicatedKeyValid = !!parseConfiguredKey(configured)
  } catch (error) {
    validationError = error.message
  }

  return {
    algorithm: ALGORITHM,
    keyId: getCurrentKeyId(),
    dedicatedKeyConfigured: !!configured,
    dedicatedKeyValid,
    legacyKeyId: DEFAULT_KEY_ID,
    legacyFallbackReadable: getCurrentKeyId() !== DEFAULT_KEY_ID,
    validationError,
  }
}

function getCurrentKeyId() {
  return process.env.EVIDENCE_KEY_ID || DEFAULT_KEY_ID
}

function getEncryptionKey(keyId = getCurrentKeyId()) {
  const currentKeyId = getCurrentKeyId()
  const configuredKey = parseConfiguredKey(process.env.EVIDENCE_ENCRYPTION_KEY)

  if (!keyId || keyId === currentKeyId) {
    return configuredKey || getLegacyFallbackKey()
  }

  if (keyId === DEFAULT_KEY_ID) {
    return getLegacyFallbackKey()
  }

  throw new Error(`No evidence encryption key configured for key id "${keyId}"`)
}

function parseConfiguredKey(configured) {
  if (!configured) return null

  if (/^[a-f0-9]{64}$/i.test(configured)) return Buffer.from(configured, 'hex')

  const decoded = Buffer.from(configured, 'base64')
  if (decoded.length === 32) return decoded

  throw new Error('EVIDENCE_ENCRYPTION_KEY must be 32 bytes as base64 or 64 hex characters')
}

function getLegacyFallbackKey() {
  if (process.env.JWT_SECRET) {
    return crypto.createHash('sha256').update(process.env.JWT_SECRET).digest()
  }

  return crypto.createHash('sha256').update('forensicai-development-evidence-key').digest()
}
