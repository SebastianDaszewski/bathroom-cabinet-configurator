import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../schema'
import { applySiphonPosition, siphonCenter, siphonXRange } from './siphon'

describe('R11 siphon position', () => {
  const custom = { ...DEFAULT_CONFIG, siphonPosition: 'custom' as const }

  it('centres the cut-out by default', () => {
    expect(siphonCenter({ ...DEFAULT_CONFIG, width: 801, siphonX: 100 })).toBe(400.5)
  })

  it('uses siphonX for a custom position', () => {
    expect(siphonCenter({ ...custom, siphonX: 250 })).toBe(250)
  })

  it('keeps the 164 mm cut-out 60 mm away from the drawer sides', () => {
    expect(siphonXRange(600)).toEqual({ min: 160, max: 440 })
    expect(siphonXRange(500)).toEqual({ min: 160, max: 340 })
  })

  it('clamps a custom position into the range', () => {
    const result = applySiphonPosition({ ...custom, siphonX: 50 })

    expect(result.config.siphonX).toBe(160)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R11', field: 'siphonX', from: 50, to: 160 }),
    ])
  })

  it('ignores siphonX when the cut-out is centred', () => {
    expect(applySiphonPosition({ ...DEFAULT_CONFIG, siphonX: 50 }).adjustments).toEqual([])
  })

  it('falls back to the centre for non-finite input', () => {
    expect(applySiphonPosition({ ...custom, siphonX: Number.NaN }).config.siphonX).toBe(300)
  })
})
