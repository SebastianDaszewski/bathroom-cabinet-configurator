import { describe, expect, it } from 'vitest'
import { BOARDS, DECORS, findDecor } from './catalog'
import { BOARD_TYPES, DEFAULT_CONFIG } from './schema'

describe('catalog', () => {
  it('has unique decor ids', () => {
    const ids = DECORS.map((decor) => decor.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('describes every board type', () => {
    expect(BOARDS.map((board) => board.id)).toEqual([...BOARD_TYPES])
  })

  it.each(BOARD_TYPES)('offers at least one decor on %s', (board) => {
    expect(DECORS.some((decor) => decor.boards.includes(board))).toBe(true)
  })

  it('has valid colours and positive price modifiers', () => {
    for (const decor of DECORS) {
      expect(decor.color).toMatch(/^#[0-9a-f]{6}$/)
      expect(decor.pricePerM2Modifier).toBeGreaterThan(0)
    }
  })

  it('contains the default decors', () => {
    expect(findDecor(DEFAULT_CONFIG.carcassDecor)).toBeDefined()
    expect(findDecor(DEFAULT_CONFIG.frontDecor)).toBeDefined()
    expect(findDecor(DEFAULT_CONFIG.drawerDecor)).toBeDefined()
  })

  it('returns undefined for unknown decors', () => {
    expect(findDecor('nope')).toBeUndefined()
  })
})
