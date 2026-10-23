import { describe, expect, it } from 'vitest'
import { normalize } from '../domain/rules'
import { DEFAULT_CONFIG, type Config } from '../domain/schema'
import { decodeConfig, encodeConfig, hasConfigParams } from './url'

const custom: Config = normalize({
  ...DEFAULT_CONFIG,
  width: 900,
  depth: 440,
  frontBoard: 'perfectsense',
  frontDecor: 'black-ps01',
  handleDrilling: 'double',
  handleSpacing: 160,
  siphonPosition: 'custom',
  siphonX: 400,
  drawers: { top: { length: 400, siphonCut: false }, bottom: { length: 350, siphonCut: true } },
}).config

describe('encodeConfig', () => {
  it('produces an empty query for the default config', () => {
    expect(encodeConfig(DEFAULT_CONFIG)).toBe('')
  })

  it('keeps only the fields that differ from the defaults', () => {
    expect(encodeConfig({ ...DEFAULT_CONFIG, width: 800, frontType: 'grip-groove' })).toBe(
      'width=800&frontType=grip-groove',
    )
  })

  it('flattens drawers and writes booleans as 0/1', () => {
    const query = encodeConfig({
      ...DEFAULT_CONFIG,
      drawers: { ...DEFAULT_CONFIG.drawers, top: { length: 400, siphonCut: false } },
    })
    expect(query).toBe('drawers.top.length=400&drawers.top.siphonCut=0')
  })
})

describe('decodeConfig', () => {
  it('round-trips any normalized config', () => {
    expect(decodeConfig(encodeConfig(custom))).toEqual({ config: custom, adjustments: [] })
  })

  it('accepts a leading question mark', () => {
    expect(decodeConfig(`?${encodeConfig(custom)}`).config).toEqual(custom)
  })

  it('fills missing fields with defaults', () => {
    const { config } = decodeConfig('width=700')
    expect(config).toEqual({ ...DEFAULT_CONFIG, width: 700 })
  })

  it('reports values the rules had to correct', () => {
    const { config, adjustments } = decodeConfig('width=2000&depth=400')
    expect(config.width).toBe(1200)
    expect(config.drawers.top.length).toBe(350)
    expect(adjustments.map((adjustment) => adjustment.rule)).toEqual(['R1', 'R3', 'R3'])
  })

  it('falls back to defaults for garbage', () => {
    const { config } = decodeConfig('width=abc&runner=wooden&drawers.top.length=999&frontDecor=')
    expect(config.width).toBe(DEFAULT_CONFIG.width)
    expect(config.runner).toBe(DEFAULT_CONFIG.runner)
    expect(config.drawers.top.length).toBe(DEFAULT_CONFIG.drawers.top.length)
    expect(config.frontDecor).toBe('white-w960')
  })

  it('ignores unknown parameters', () => {
    expect(decodeConfig('utm_source=newsletter').config).toEqual(DEFAULT_CONFIG)
  })
})

describe('hasConfigParams', () => {
  it('detects configuration parameters only', () => {
    expect(hasConfigParams('?width=700')).toBe(true)
    expect(hasConfigParams('?drawers.top.length=400')).toBe(true)
    expect(hasConfigParams('?utm_source=x')).toBe(false)
    expect(hasConfigParams('')).toBe(false)
  })
})
