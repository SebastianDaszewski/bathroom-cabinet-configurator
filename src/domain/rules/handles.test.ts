import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, type Config } from '../schema'
import {
  allowedHandleDrillings,
  allowedHandleSpacings,
  applyDoubleHandleWidth,
  applyHandleCompatibility,
  applyHandleSpacing,
  handleDrillingBlocker,
  maxHandleSpacing,
} from './handles'

const config = (overrides: Partial<Config>): Config => ({ ...DEFAULT_CONFIG, ...overrides })

describe('R4 handle compatibility', () => {
  it.each([
    [{ opening: 'tip-on' }, 'Tip-On'],
    [{ frontType: 'edge-handle' }, 'uchwytem krawędziowym'],
    [{ frontType: 'grip-groove' }, 'frezowanym uchwytem'],
  ] as const)('%j blocks handle drilling', (overrides, reason) => {
    expect(handleDrillingBlocker(config(overrides))).toContain(reason)
    expect(allowedHandleDrillings(config({ ...overrides, width: 1000 }))).toEqual(['none'])
  })

  it('allows drilling on standard fronts with soft close', () => {
    expect(handleDrillingBlocker(DEFAULT_CONFIG)).toBeNull()
  })

  it('removes the drilling when it conflicts', () => {
    const result = applyHandleCompatibility(config({ opening: 'tip-on', handleDrilling: 'single' }))

    expect(result.config.handleDrilling).toBe('none')
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R4', field: 'handleDrilling', from: 'single', to: 'none' }),
    ])
  })

  it('keeps the front type and opening — drilling is what gives way', () => {
    const result = applyHandleCompatibility(
      config({ frontType: 'grip-groove', handleDrilling: 'double', width: 900 }),
    )
    expect(result.config.frontType).toBe('grip-groove')
    expect(result.config.handleDrilling).toBe('none')
  })

  it('does nothing when there is no drilling', () => {
    expect(applyHandleCompatibility(config({ opening: 'tip-on' })).adjustments).toEqual([])
  })
})

describe('R7 double drilling width', () => {
  it.each([
    [799, ['none', 'single']],
    [800, ['none', 'single', 'double']],
  ])('width %d allows %j', (width, expected) => {
    expect(allowedHandleDrillings(config({ width }))).toEqual(expected)
  })

  it('downgrades double to single on narrow cabinets', () => {
    const result = applyDoubleHandleWidth(config({ width: 799, handleDrilling: 'double' }))

    expect(result.config.handleDrilling).toBe('single')
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R7', from: 'double', to: 'single' }),
    ])
  })

  it('keeps double on wide cabinets', () => {
    const result = applyDoubleHandleWidth(config({ width: 800, handleDrilling: 'double' }))
    expect(result.adjustments).toEqual([])
  })
})

describe('R6 handle spacing', () => {
  it.each([
    [500, 352],
    [600, 480],
    [1200, 480],
    [567, 416],
  ])('width %d allows a single handle spacing up to %d', (width, max) => {
    expect(maxHandleSpacing(width, 'single')).toBe(max)
    expect(allowedHandleSpacings(width, 'single').at(-1)).toBe(max)
  })

  it.each([
    [800, 256],
    [1000, 352],
    [1200, 480],
  ])('width %d allows a double handle spacing up to %d', (width, max) => {
    expect(maxHandleSpacing(width, 'double')).toBe(max)
  })

  it('lists spacings in steps of 32 from 32', () => {
    expect(allowedHandleSpacings(500, 'single').slice(0, 3)).toEqual([32, 64, 96])
    expect(allowedHandleSpacings(500, 'single')).toHaveLength(11)
  })

  it('limits double handles to half of the front', () => {
    const result = applyHandleSpacing(config({ width: 800, handleDrilling: 'double' }))
    expect(result.config.handleSpacing).toBe(128)
    const wide = applyHandleSpacing(
      config({ width: 800, handleDrilling: 'double', handleSpacing: 480 }),
    )
    expect(wide.config.handleSpacing).toBe(256)
  })

  it('falls back to the widest spacing that fits', () => {
    const result = applyHandleSpacing(config({ width: 500, handleSpacing: 480 }))

    expect(result.config.handleSpacing).toBe(352)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R6', from: 480, to: 352 }),
    ])
  })

  it('keeps a spacing that fits', () => {
    expect(applyHandleSpacing(config({ width: 500, handleSpacing: 352 })).adjustments).toEqual([])
  })
})
