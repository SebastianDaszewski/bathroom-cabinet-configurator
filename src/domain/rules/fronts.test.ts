import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../schema'
import { frontHeights } from './fronts'

describe('R10 frontHeights', () => {
  it('splits an odd remainder with the extra mm on top', () => {
    expect(frontHeights({ ...DEFAULT_CONFIG, height: 500 })).toEqual({ top: 249, bottom: 248 })
  })

  it('splits evenly when possible', () => {
    expect(frontHeights({ ...DEFAULT_CONFIG, height: 403 })).toEqual({ top: 200, bottom: 200 })
  })

  it('always sums to height minus the inner gap', () => {
    for (let height = 400; height <= 600; height++) {
      const { top, bottom } = frontHeights({ ...DEFAULT_CONFIG, height })
      expect(top + bottom).toBe(height - 3)
    }
  })
})

describe('R5 edge-handle fronts', () => {
  it('reduces each front by the handle thickness', () => {
    const heights = frontHeights({
      ...DEFAULT_CONFIG,
      frontType: 'edge-handle',
      edgeHandleThickness: 4,
    })
    expect(heights).toEqual({ top: 245, bottom: 244 })
  })

  it('ignores the thickness for other front types', () => {
    const heights = frontHeights({ ...DEFAULT_CONFIG, edgeHandleThickness: 4 })
    expect(heights).toEqual({ top: 249, bottom: 248 })
  })
})
