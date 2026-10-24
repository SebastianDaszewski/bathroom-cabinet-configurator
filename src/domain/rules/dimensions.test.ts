import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../schema'
import { clampDimensions, clampToStep } from './dimensions'

describe('clampToStep', () => {
  const range = { min: 32, max: 480, step: 32 }

  it('rounds to the nearest step', () => {
    expect(clampToStep(100, range, 128)).toBe(96)
    expect(clampToStep(112, range, 128)).toBe(128)
  })

  it('clamps to the range', () => {
    expect(clampToStep(0, range, 128)).toBe(32)
    expect(clampToStep(1000, range, 128)).toBe(480)
  })

  it('uses the fallback for non-finite values', () => {
    expect(clampToStep(Number.NaN, range, 128)).toBe(128)
  })
})

describe('R1 clampDimensions', () => {
  it('leaves an in-range config untouched', () => {
    const result = clampDimensions(DEFAULT_CONFIG)
    expect(result.config).toEqual(DEFAULT_CONFIG)
    expect(result.adjustments).toEqual([])
  })

  it.each([
    ['width', 499, 500],
    ['width', 1201, 1200],
    ['height', 399, 400],
    ['height', 601, 600],
    ['depth', 389, 390],
    ['depth', 701, 700],
    ['edgeHandleThickness', 0, 1],
    ['edgeHandleThickness', 5, 4],
  ] as const)('clamps %s %d to %d', (field, from, to) => {
    const result = clampDimensions({ ...DEFAULT_CONFIG, [field]: from })

    expect(result.config[field]).toBe(to)
    expect(result.adjustments).toEqual([expect.objectContaining({ rule: 'R1', field, from, to })])
  })

  it.each([500, 1200])('accepts the boundary width %d', (width) => {
    expect(clampDimensions({ ...DEFAULT_CONFIG, width }).adjustments).toEqual([])
  })

  it('keeps the grip height between 25 and 60 mm', () => {
    expect(clampDimensions({ ...DEFAULT_CONFIG, gripHeight: 10 }).config.gripHeight).toBe(25)
    expect(clampDimensions({ ...DEFAULT_CONFIG, gripHeight: 90 }).config.gripHeight).toBe(60)
  })

  it('rounds non-integer input', () => {
    const result = clampDimensions({ ...DEFAULT_CONFIG, width: 700.6, height: 450.4 })
    expect(result.config.width).toBe(701)
    expect(result.config.height).toBe(450)
  })

  it('snaps handle spacing to a multiple of 32', () => {
    const result = clampDimensions({ ...DEFAULT_CONFIG, handleSpacing: 130 })
    expect(result.config.handleSpacing).toBe(128)
    expect(result.adjustments[0]?.reason).toContain('co 32 mm')
  })

  it('does not mutate the input', () => {
    const input = { ...DEFAULT_CONFIG, width: 10 }
    clampDimensions(input)
    expect(input.width).toBe(10)
  })
})
