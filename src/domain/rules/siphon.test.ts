import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../schema'
import {
  applySiphonCut,
  applySiphonPosition,
  maxSiphonOffset,
  siphonCenter,
  siphonXRange,
} from './siphon'

describe('R8 siphon cut-out', () => {
  it('limits the cut-out to width - 2*18 - 120', () => {
    expect(maxSiphonOffset(300)).toBe(144)
    expect(maxSiphonOffset(392)).toBe(236)
  })

  it('never exceeds the catalogue maximum', () => {
    expect(maxSiphonOffset(1200)).toBe(236)
  })

  it('is satisfied by every in-range cabinet width', () => {
    expect(maxSiphonOffset(500)).toBe(236)
  })

  it('narrows a cut-out that is too wide', () => {
    const result = applySiphonCut({ ...DEFAULT_CONFIG, width: 350, siphonOffset: 236 })

    expect(result.config.siphonOffset).toBe(194)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R8', field: 'siphonOffset', from: 236, to: 194 }),
    ])
  })

  it('keeps a cut-out that fits', () => {
    expect(applySiphonCut(DEFAULT_CONFIG).adjustments).toEqual([])
  })
})

describe('R11 siphon position', () => {
  const custom = { ...DEFAULT_CONFIG, siphonPosition: 'custom' as const }

  it('centres the cut-out by default', () => {
    expect(siphonCenter({ ...DEFAULT_CONFIG, width: 801, siphonX: 100 })).toBe(400.5)
  })

  it('uses siphonX for a custom position', () => {
    expect(siphonCenter({ ...custom, siphonX: 250 })).toBe(250)
  })

  it('keeps the cut-out away from the drawer sides', () => {
    expect(siphonXRange({ ...custom, width: 600, siphonOffset: 218 })).toEqual({
      min: 187,
      max: 413,
    })
  })

  it('clamps a custom position into the range', () => {
    const result = applySiphonPosition({ ...custom, siphonX: 50 })

    expect(result.config.siphonX).toBe(187)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R11', field: 'siphonX', from: 50, to: 187 }),
    ])
  })

  it('ignores siphonX when the cut-out is centred', () => {
    expect(applySiphonPosition({ ...DEFAULT_CONFIG, siphonX: 50 }).adjustments).toEqual([])
  })

  it('falls back to the centre for non-finite input', () => {
    expect(applySiphonPosition({ ...custom, siphonX: Number.NaN }).config.siphonX).toBe(300)
  })
})
