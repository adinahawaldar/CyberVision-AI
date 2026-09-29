import { parseAndNormalizeFile } from '../parsers/index.js'
import { getIpReputation, getHashReputation } from '../services/threatIntelService.js'
import { mapLogToAttack } from './attackMapper.js'
import { scoreEvent } from '../analysis/riskScoring.js'

/**
 * Compatibility wrapper used by existing routes.
 * Source-specific parsing lives in server/parsers/* and matching normalization
 * lives in server/normalizers/*.
 */
export async function parseLogFile(filePath, options = {}) {
  const parsed = await parseAndNormalizeFile(filePath, options)
  const events = await enrichEvents(parsed.events)

  return {
    ...parsed,
    events,
    parsedCount: events.length,
    summary: parsed.summary || `Parsed ${events.length} normalized event(s)`,
  }
}

export async function enrichEvents(events) {
  const cache = { ip: {}, hash: {} }

  for (const event of events) {
    const text = `${event.detail || ''} ${event.raw || ''}`

    const attack = mapLogToAttack(text)
    if (attack) event.mitreAttack = attack

    const ipMatches = text.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || []
    for (const ip of [...new Set(ipMatches)]) {
      if (cache.ip[ip] === undefined) {
        cache.ip[ip] = Object.keys(cache.ip).length < 50
          ? await getIpReputation(ip)
          : { score: 0, isMalicious: false, details: '' }
      }
      const rep = cache.ip[ip]
      if (rep?.score > 0 && (!event.threatIntel || rep.score > event.threatIntel.score)) {
        event.threatIntel = rep
      }
      if (!event.sourceIp) event.sourceIp = ip
    }

    const hashMatches = text.match(/\b[a-fA-F0-9]{32}\b|\b[a-fA-F0-9]{64}\b/g) || []
    for (const hash of [...new Set(hashMatches)]) {
      if (cache.hash[hash] === undefined) {
        cache.hash[hash] = Object.keys(cache.hash).length < 50
          ? await getHashReputation(hash)
          : { score: 0, isMalicious: false, details: '' }
      }
      const rep = cache.hash[hash]
      if (rep?.score > 0 && (!event.threatIntel || rep.score > event.threatIntel.score)) {
        event.threatIntel = rep
      }
    }

    if (!event.threatIntel) {
      event.threatIntel = { score: 0, isMalicious: false, details: '' }
    }
    if (!event.mitreAttack) {
      event.mitreAttack = { techniqueId: '', techniqueName: '', tactic: '' }
    }

    const risk = scoreEvent(event)
    event.riskScore = risk.score
    event.riskLevel = risk.level
    event.riskReasons = risk.reasons
  }

  return events
}

/**
 * Build a unified timeline from multiple evidence sources.
 */
export function buildTimeline(evidenceList) {
  const allEvents = []

  for (const evidence of evidenceList) {
    if (evidence.parsedData?.events) {
      for (const event of evidence.parsedData.events) {
        const plainEvent = typeof event.toObject === 'function' ? event.toObject() : { ...event }
        allEvents.push({
          ...plainEvent,
          evidenceId: evidence._id,
          evidenceName: evidence.originalName,
        })
      }
    }
  }

  allEvents.sort((a, b) => {
    const dateA = new Date(a.timestamp)
    const dateB = new Date(b.timestamp)
    if (isNaN(dateA) && isNaN(dateB)) return 0
    if (isNaN(dateA)) return 1
    if (isNaN(dateB)) return -1
    return dateA - dateB
  })

  const grouped = {}
  for (const event of allEvents) {
    let dateKey = 'Unknown'
    if (event.timestamp) {
      const ts = String(event.timestamp).trim()
      if (ts.includes('T')) {
        dateKey = ts.split('T')[0]
      } else if (ts.includes(' ')) {
        dateKey = ts.split(' ')[0]
      } else if (/^\d{4}-\d{2}-\d{2}/.test(ts)) {
        dateKey = ts.substring(0, 10)
      }
    }
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(event)
  }

  return {
    totalEvents: allEvents.length,
    dateGroups: Object.entries(grouped).map(([date, events]) => ({ date, events })),
    events: allEvents,
  }
}
