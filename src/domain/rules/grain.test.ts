import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../schema'
import { applyContinuousGrain } from './grain'

describe('R14 continuous grain', () => {
  it('keeps continuous grain on vertical fronts', () => {
    const input = { ...DEFAULT_CONFIG, frontGrain: 'vertical' as const, continuousGrain: true }
    expect(applyContinuousGrain(input)).toEqual({ config: input, adjustments: [] })
  })

  it('turns it off for horizontal fronts', () => {
    const result = applyContinuousGrain({ ...DEFAULT_CONFIG, continuousGrain: true })

    expect(result.config.continuousGrain).toBe(false)
    expect(result.adjustments).toEqual([
      expect.objectContaining({ rule: 'R14', field: 'continuousGrain', from: true, to: false }),
    ])
  })
})
