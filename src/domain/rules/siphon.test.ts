import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, type Config } from '../schema'
import {
  applySiphonCutDepth,
  applySiphonCutWidth,
  applySiphonPosition,
  maxSiphonCutDepth,
  maxSiphonCutWidth,
  siphonCenter,
  siphonXRange,
} from './siphon'

const config = (overrides: Partial<Config>): Config => ({ ...DEFAULT_CONFIG, ...overrides })

const withCut = (top: 350 | 400 | 450, bottom: 350 | 400 | 450 = 450, bottomCut = false) =>
  config({
    drawers: {
      top: { length: top, siphonCut: true },
      bottom: { length: bottom, siphonCut: bottomCut },
    },
  })

describe('R8 siphon cut-out width', () => {
  it('leaves 60 mm of drawer side on each side', () => {
    expect(maxSiphonCutWidth(400)).toBe(244)
    expect(maxSiphonCutWidth(600)).toBe(300)
  })

  it('narrows a cut-out that is too wide', () => {
    const result = applySiphonCutWidth(config({ width: 400, siphonCutWidth: 300 }))
    expect(result.config.siphonCutWidth).toBe(244)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R8', field: 'siphonCutWidth', from: 300, to: 244 }),
    ])
  })

  it('keeps a cut-out that fits', () => {
    expect(applySiphonCutWidth(DEFAULT_CONFIG).adjustments).toEqual([])
  })
})

describe('R13 siphon cut-out depth', () => {
  it('leaves 60 mm of drawer bottom in front of the cut-out', () => {
    expect(maxSiphonCutDepth(withCut(450))).toBe(350)
    expect(maxSiphonCutDepth(withCut(350))).toBe(280)
  })

  it('uses the shortest drawer that has a cut-out', () => {
    expect(maxSiphonCutDepth(withCut(450, 350, true))).toBe(280)
    expect(maxSiphonCutDepth(withCut(450, 350, false))).toBe(350)
  })

  it('does not limit the depth when no drawer has a cut-out', () => {
    expect(maxSiphonCutDepth(DEFAULT_CONFIG)).toBe(350)
  })

  it('shortens a cut-out that is too deep', () => {
    const result = applySiphonCutDepth({ ...withCut(350), siphonCutDepth: 300 })
    expect(result.config.siphonCutDepth).toBe(280)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R13', field: 'siphonCutDepth', from: 300, to: 280 }),
    ])
  })
})

describe('R11 siphon position', () => {
  const custom = config({ siphonPosition: 'custom' })

  it('centres the cut-out by default', () => {
    expect(siphonCenter(config({ width: 801, siphonX: 100 }))).toBe(400.5)
  })

  it('uses siphonX for a custom position', () => {
    expect(siphonCenter({ ...custom, siphonX: 250 })).toBe(250)
  })

  it('keeps the cut-out 60 mm away from the drawer sides', () => {
    expect(siphonXRange(config({ width: 600 }))).toEqual({ min: 160, max: 440 })
    expect(siphonXRange(config({ width: 600, siphonCutWidth: 200 }))).toEqual({
      min: 178,
      max: 422,
    })
  })

  it('clamps a custom position into the range', () => {
    const result = applySiphonPosition({ ...custom, siphonX: 50 })

    expect(result.config.siphonX).toBe(160)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R11', field: 'siphonX', from: 50, to: 160 }),
    ])
  })

  it('ignores siphonX when the cut-out is centred', () => {
    expect(applySiphonPosition(config({ siphonX: 50 })).adjustments).toEqual([])
  })

  it('falls back to the centre for non-finite input', () => {
    expect(applySiphonPosition({ ...custom, siphonX: Number.NaN }).config.siphonX).toBe(300)
  })
})
