import { normalize, type RuleResult } from '../domain/rules'
import { DEFAULT_CONFIG, parseConfig, type Config } from '../domain/schema'
import { decodeConfig, encodeConfig, hasConfigParams } from './url'

export const STORAGE_KEY = 'vanity-configurator:config'

export interface KeyValueStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function readStored(storage: KeyValueStorage | undefined): unknown {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export function loadInitialConfig(search: string, storage?: KeyValueStorage): RuleResult {
  if (hasConfigParams(search)) return decodeConfig(search)

  const stored = readStored(storage)
  if (stored !== undefined)
    return { config: normalize(parseConfig(stored)).config, adjustments: [] }

  return normalize(DEFAULT_CONFIG)
}

export function saveConfig(config: Config, storage?: KeyValueStorage): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    return
  }
}

export function shareUrl(config: Config, location: { origin: string; pathname: string }): string {
  const query = encodeConfig(config)
  return `${location.origin}${location.pathname}${query ? `?${query}` : ''}`
}
