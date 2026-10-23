import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../domain/schema'
import { priceNote } from './priceNotes'

const normalizeSpaces = (text: string | undefined) => text?.replace(/\s/g, ' ')

describe('priceNote', () => {
  it('has no note for the current choice', () => {
    expect(priceNote(DEFAULT_CONFIG, { opening: 'blumotion' })).toBeUndefined()
    expect(priceNote(DEFAULT_CONFIG, { drawers: DEFAULT_CONFIG.drawers })).toBeUndefined()
  })

  it('shows what another option adds', () => {
    expect(normalizeSpaces(priceNote(DEFAULT_CONFIG, { opening: 'tip-on' }))).toMatch(/^\+\d/)
  })

  it('shows what another option saves', () => {
    expect(priceNote(DEFAULT_CONFIG, { frontDecor: 'white-w960' })).toMatch(/^−/)
  })

  it('says when an option is free', () => {
    expect(priceNote(DEFAULT_CONFIG, { frontGrain: 'vertical' })).toBe('bez dopłaty')
  })
})
