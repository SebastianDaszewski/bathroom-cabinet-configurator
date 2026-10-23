import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../domain/schema'
import {
  loadInitialConfig,
  saveConfig,
  shareUrl,
  STORAGE_KEY,
  type KeyValueStorage,
} from './persistence'

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

const stored = (config: object) => memoryStorage({ [STORAGE_KEY]: JSON.stringify(config) })

describe('loadInitialConfig', () => {
  it('uses the defaults when there is nothing to load', () => {
    expect(loadInitialConfig('', memoryStorage())).toEqual({
      config: DEFAULT_CONFIG,
      adjustments: [],
    })
  })

  it('prefers the URL over local storage', () => {
    const result = loadInitialConfig('?width=700', stored({ ...DEFAULT_CONFIG, width: 900 }))
    expect(result.config.width).toBe(700)
  })

  it('restores the last config from local storage', () => {
    const result = loadInitialConfig('', stored({ ...DEFAULT_CONFIG, width: 900 }))
    expect(result.config.width).toBe(900)
    expect(result.adjustments).toEqual([])
  })

  it('survives corrupted storage', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{not json' })
    expect(loadInitialConfig('', storage).config).toEqual(DEFAULT_CONFIG)
  })

  it('survives a storage that throws', () => {
    const storage: KeyValueStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadInitialConfig('', storage).config).toEqual(DEFAULT_CONFIG)
    expect(() => saveConfig(DEFAULT_CONFIG, storage)).not.toThrow()
  })
})

describe('saveConfig', () => {
  it('stores the config as JSON', () => {
    const storage = memoryStorage()
    saveConfig({ ...DEFAULT_CONFIG, width: 800 }, storage)
    expect(JSON.parse(storage.data[STORAGE_KEY]).width).toBe(800)
  })
})

describe('shareUrl', () => {
  const location = { origin: 'https://example.test', pathname: '/configurator' }

  it('links to the bare page for the default config', () => {
    expect(shareUrl(DEFAULT_CONFIG, location)).toBe('https://example.test/configurator')
  })

  it('appends the changed fields', () => {
    expect(shareUrl({ ...DEFAULT_CONFIG, width: 800 }, location)).toBe(
      'https://example.test/configurator?width=800',
    )
  })
})
