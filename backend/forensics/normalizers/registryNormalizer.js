import { baseEvent } from './helpers.js'

export function normalizeRegistry(records, context = {}) {
  return records.map(record => {
    const detail = `Registry value ${record.valueName} set under ${record.keyPath}: ${record.valueData}`
    const severity = /\\run\\|\\runonce\\|services\\|winlogon|powershell|cmd\.exe|temp|appdata/i.test(`${record.keyPath} ${record.valueData}`)
      ? 'warning'
      : 'info'

    return {
      ...baseEvent({
        source: 'windows_registry',
        detail,
        raw: record.raw,
        severity,
        eventType: 'registry',
      }, 'windows_registry', context.evidenceName),
      registryKey: record.keyPath,
      registryValue: record.valueName,
      parserType: context.parser,
      normalizerType: 'registry-normalizer',
    }
  })
}
