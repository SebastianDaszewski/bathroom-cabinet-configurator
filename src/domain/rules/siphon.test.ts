import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../schema'
import { applySiphonCut, maxSiphonOffset } from './siphon'

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
