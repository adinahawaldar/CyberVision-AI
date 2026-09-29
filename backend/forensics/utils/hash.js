import crypto from 'crypto'
import fs from 'fs'

/**
 * Compute SHA-256 hash for a file
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<string>} - Hex digest of the SHA-256 hash
 */
export function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)

    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', (err) => reject(err))
  })
}

/**
 * Verify a file's integrity by comparing its hash
 * @param {string} filePath - Path to file
 * @param {string} expectedHash - Expected SHA-256 hash
 * @returns {Promise<{match: boolean, computedHash: string}>}
 */
export async function verifyFileHash(filePath, expectedHash) {
  const computedHash = await computeFileHash(filePath)
  return {
    match: computedHash === expectedHash,
    computedHash,
    expectedHash,
  }
}
