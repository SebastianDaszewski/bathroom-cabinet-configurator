import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../schema'
import { applyDecorCompatibility, compatibleDecors } from './decor'

describe('R9 compatibleDecors', () => {
  it('returns only decors available on the board', () => {
    const decors = compatibleDecors('perfectsense')
    expect(decors.map((decor) => decor.id)).toEqual(['black-ps01', 'greige-ps02'])
  })
})

describe('R9 applyDecorCompatibility', () => {
  it('keeps compatible decors', () => {
    const result = applyDecorCompatibility(DEFAULT_CONFIG)
    expect(result.config).toEqual(DEFAULT_CONFIG)
    expect(result.adjustments).toEqual([])
  })

  it('resets an incompatible front decor to the first compatible one', () => {
    const result = applyDecorCompatibility({ ...DEFAULT_CONFIG, frontBoard: 'perfectsense' })

    expect(result.config.frontDecor).toBe('black-ps01')
    expect(result.adjustments).toEqual([
      expect.objectContaining({
        rule: 'R9',
        field: 'frontDecor',
        from: 'oak-h1145',
        to: 'black-ps01',
        reason: 'Dekor „Dąb naturalny” jest niedostępny dla materiału „PerfectSense mat”.',
      }),
    ])
  })

  it('checks the carcass decor against the carcass board', () => {
    const result = applyDecorCompatibility({
      ...DEFAULT_CONFIG,
      carcassBoard: 'mdf',
      carcassDecor: 'walnut-h3734',
    })
    expect(result.config.carcassDecor).toBe('white-w960')
  })

  it('checks the drawer decor against chipboard', () => {
    const result = applyDecorCompatibility({ ...DEFAULT_CONFIG, drawerDecor: 'black-ps01' })
    expect(result.config.drawerDecor).toBe('white-w960')
  })

  it('checks the drawer bottom decor against chipboard', () => {
    const result = applyDecorCompatibility({ ...DEFAULT_CONFIG, drawerBottomDecor: 'black-ps01' })
    expect(result.config.drawerBottomDecor).toBe('white-w960')
  })

  it('replaces unknown decors', () => {
    const result = applyDecorCompatibility({ ...DEFAULT_CONFIG, carcassDecor: 'gold' })

    expect(result.config.carcassDecor).toBe('white-w960')
    expect(result.adjustments[0]?.reason).toBe('Nieznany dekor „gold”.')
  })
})
