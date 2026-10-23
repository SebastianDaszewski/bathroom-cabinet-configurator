import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, type Config } from '../schema'
import { applyTopLength, maxTopExtension, topLength } from './top'

const config = (overrides: Partial<Config>): Config => ({ ...DEFAULT_CONFIG, ...overrides })

describe('R12 countertop length', () => {
  it('measures the countertop with both side extensions', () => {
    expect(topLength(config({ topExtensionLeft: 100, topExtensionRight: 200 }))).toBe(900)
  })

  it('keeps a countertop that fits on one board', () => {
    const input = config({ width: 1000, topExtensionLeft: 900, topExtensionRight: 900 })
    expect(applyTopLength(input)).toEqual({ config: input, adjustments: [] })
  })

  it('trims the right extension first', () => {
    const result = applyTopLength(
      config({ width: 1000, topExtensionLeft: 900, topExtensionRight: 1000 }),
    )
    expect(result.config.topExtensionRight).toBe(900)
    expect(result.config.topExtensionLeft).toBe(900)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R12', field: 'topExtensionRight', from: 1000, to: 900 }),
    ])
  })

  it('then trims the left extension', () => {
    const result = applyTopLength(
      config({ width: 1200, topExtensionLeft: 1800, topExtensionRight: 300 }),
    )
    expect(result.config.topExtensionRight).toBe(0)
    expect(result.config.topExtensionLeft).toBe(1600)
    expect(result.adjustments.map((adjustment) => adjustment.field)).toEqual([
      'topExtensionRight',
      'topExtensionLeft',
    ])
  })

  it('offers only what still fits on the board', () => {
    const input = config({ width: 1200, topExtensionLeft: 1000 })
    expect(maxTopExtension(input, 'topExtensionRight')).toBe(600)
    expect(maxTopExtension(input, 'topExtensionLeft')).toBe(1600)
    expect(maxTopExtension(config({ width: 600 }), 'topExtensionLeft')).toBe(1800)
  })
})
