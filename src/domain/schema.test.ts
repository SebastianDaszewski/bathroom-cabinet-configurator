import { describe, expect, it } from 'vitest'
import { ConfigSchema, DEFAULT_CONFIG, parseConfig } from './schema'

describe('ConfigSchema', () => {
  it('accepts the default config', () => {
    expect(ConfigSchema.safeParse(DEFAULT_CONFIG).success).toBe(true)
  })

  it('rejects unknown enum values', () => {
    expect(ConfigSchema.safeParse({ ...DEFAULT_CONFIG, runner: 'wooden' }).success).toBe(false)
  })

  it('rejects drawer lengths outside the catalogue', () => {
    const drawers = { ...DEFAULT_CONFIG.drawers, top: { length: 420, siphonCut: true } }
    expect(ConfigSchema.safeParse({ ...DEFAULT_CONFIG, drawers }).success).toBe(false)
  })
})

describe('parseConfig', () => {
  it('returns defaults for non-object input', () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG)
    expect(parseConfig('width=700')).toEqual(DEFAULT_CONFIG)
  })

  it('keeps valid fields and replaces invalid ones with defaults', () => {
    const config = parseConfig({ width: 900, depth: 'deep', frontType: 'edge-handle', runner: 1 })

    expect(config.width).toBe(900)
    expect(config.frontType).toBe('edge-handle')
    expect(config.depth).toBe(DEFAULT_CONFIG.depth)
    expect(config.runner).toBe(DEFAULT_CONFIG.runner)
  })

  it('does not enforce ranges — that is the job of normalize()', () => {
    expect(parseConfig({ width: 99999 }).width).toBe(99999)
  })

  it('drops unknown keys', () => {
    expect(parseConfig({ ...DEFAULT_CONFIG, price: 1 })).toEqual(DEFAULT_CONFIG)
  })

  it('round-trips through JSON', () => {
    expect(parseConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)))).toEqual(DEFAULT_CONFIG)
  })
})
