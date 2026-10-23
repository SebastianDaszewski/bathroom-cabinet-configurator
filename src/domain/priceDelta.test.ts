import { describe, expect, it } from 'vitest'
import { buildPanels } from './panels'
import { price } from './pricing'
import { priceDelta, totalPrice } from './priceDelta'
import { DEFAULT_CONFIG } from './schema'

describe('totalPrice', () => {
  it('equals the price of the built panels', () => {
    expect(totalPrice(DEFAULT_CONFIG)).toBe(
      price(DEFAULT_CONFIG, buildPanels(DEFAULT_CONFIG)).total,
    )
  })

  it('normalizes the config first', () => {
    expect(totalPrice({ ...DEFAULT_CONFIG, width: 5000 })).toBe(
      totalPrice({ ...DEFAULT_CONFIG, width: 1200 }),
    )
  })
})

describe('priceDelta', () => {
  it('is zero for the current choice', () => {
    expect(priceDelta(DEFAULT_CONFIG, { runner: DEFAULT_CONFIG.runner })).toBe(0)
  })

  it('is positive for a more expensive option', () => {
    expect(priceDelta(DEFAULT_CONFIG, { opening: 'tip-on' })).toBeGreaterThan(0)
    expect(priceDelta(DEFAULT_CONFIG, { topThickening: 'double' })).toBeGreaterThan(0)
  })

  it('is negative for a cheaper option', () => {
    expect(priceDelta(DEFAULT_CONFIG, { frontDecor: 'white-w960' })).toBeLessThan(0)
  })

  it('is zero for options that do not change the price', () => {
    expect(priceDelta(DEFAULT_CONFIG, { frontGrain: 'vertical' })).toBe(0)
  })

  it('includes changes the rules make along the way', () => {
    const viaRules = priceDelta(DEFAULT_CONFIG, { frontBoard: 'perfectsense' })
    const explicit = priceDelta(DEFAULT_CONFIG, {
      frontBoard: 'perfectsense',
      frontDecor: 'black-ps01',
    })
    expect(viaRules).toBe(explicit)
  })
})
