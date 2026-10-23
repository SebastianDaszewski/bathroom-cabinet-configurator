import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, type Config } from '../schema'
import { allowedDrawerLengths, applyDrawerLengths } from './drawerLength'

describe('R2 allowedDrawerLengths', () => {
  it.each([
    [390, [350]],
    [439, [350]],
    [440, [350, 400]],
    [489, [350, 400]],
    [490, [350, 400, 450]],
    [700, [350, 400, 450]],
  ])('depth %d allows %j', (depth, expected) => {
    expect(allowedDrawerLengths(depth)).toEqual(expected)
  })
})

describe('R3 applyDrawerLengths', () => {
  const withDepth = (depth: number): Config => ({ ...DEFAULT_CONFIG, depth })

  it('keeps lengths that still fit', () => {
    const result = applyDrawerLengths(withDepth(490))
    expect(result.config.drawers).toEqual(DEFAULT_CONFIG.drawers)
    expect(result.adjustments).toEqual([])
  })

  it('falls back to the largest allowed length for every drawer', () => {
    const result = applyDrawerLengths(withDepth(450))

    expect(result.config.drawers.top).toEqual({ length: 400, siphonCut: false })
    expect(result.config.drawers.bottom).toEqual({ length: 400, siphonCut: false })
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R3', field: 'drawers.top.length', from: 450, to: 400 }),
      expect.objectContaining({ rule: 'R3', field: 'drawers.bottom.length', from: 450, to: 400 }),
    ])
  })

  it('explains the required depth', () => {
    const [adjustment] = applyDrawerLengths(withDepth(390)).adjustments
    expect(adjustment?.reason).toContain('490 mm')
  })

  it('only adjusts the drawer that no longer fits', () => {
    const config: Config = {
      ...withDepth(440),
      drawers: { top: { length: 450, siphonCut: true }, bottom: { length: 350, siphonCut: false } },
    }
    const result = applyDrawerLengths(config)

    expect(result.config.drawers.top.length).toBe(400)
    expect(result.config.drawers.bottom.length).toBe(350)
    expect(result.adjustments).toHaveLength(1)
  })
})
