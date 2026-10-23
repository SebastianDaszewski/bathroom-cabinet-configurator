import { describe, expect, it } from 'vitest'
import { BOARD_TYPES, CARCASS_BOARD_TYPES, DEFAULT_CONFIG, type Config } from '../schema'
import { normalize } from './index'

describe('normalize', () => {
  it('leaves the default config untouched', () => {
    expect(normalize(DEFAULT_CONFIG)).toEqual({ config: DEFAULT_CONFIG, adjustments: [] })
  })

  it('applies rules in order: clamp depth first, then drawer lengths', () => {
    const { config, adjustments } = normalize({ ...DEFAULT_CONFIG, depth: 100 })

    expect(config.depth).toBe(390)
    expect(config.drawers.top.length).toBe(350)
    expect(adjustments.map((adjustment) => adjustment.rule)).toEqual(['R1', 'R3', 'R3'])
  })

  it('removes conflicting drilling before checking its width (R4 before R7)', () => {
    const { config, adjustments } = normalize({
      ...DEFAULT_CONFIG,
      opening: 'tip-on',
      handleDrilling: 'double',
      width: 600,
    })

    expect(config.handleDrilling).toBe('none')
    expect(adjustments.map((adjustment) => adjustment.rule)).toEqual(['R4'])
  })

  it('clamps width before checking handle spacing', () => {
    const { config } = normalize({ ...DEFAULT_CONFIG, width: 50, handleSpacing: 480 })
    expect(config.width).toBe(500)
    expect(config.handleSpacing).toBe(352)
  })

  it('does not mutate the input', () => {
    const input: Config = { ...DEFAULT_CONFIG, depth: 100, frontBoard: 'perfectsense' }
    const snapshot = structuredClone(input)
    normalize(input)
    expect(input).toEqual(snapshot)
  })

  describe('is idempotent', () => {
    const cases: Config[] = []
    for (const width of [0, 500, 799, 800, 1200, 5000.5]) {
      for (const depth of [0, 390, 440, 489, 700]) {
        for (const frontBoard of BOARD_TYPES) {
          for (const carcassBoard of CARCASS_BOARD_TYPES) {
            for (const handleDrilling of ['none', 'single', 'double'] as const) {
              cases.push({
                ...DEFAULT_CONFIG,
                width,
                depth,
                frontBoard,
                carcassBoard,
                handleDrilling,
                handleSpacing: 480,
                frontType: width === 800 ? 'grip-groove' : 'standard',
              })
            }
          }
        }
      }
    }

    it(`for ${cases.length} edge-case configs`, () => {
      for (const input of cases) {
        const once = normalize(input).config
        expect(normalize(once)).toEqual({ config: once, adjustments: [] })
      }
    })
  })
})
