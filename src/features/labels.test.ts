import { describe, expect, it } from 'vitest'
import { formatPln, formatPriceChange, formatQuantity, pluralPl } from '../ui/format'
import { describeAdjustment } from './labels'

const normalizeSpaces = (text: string) => text.replace(/\s/g, ' ')

describe('describeAdjustment', () => {
  it('names the field and shows lengths in mm', () => {
    const { title } = describeAdjustment({
      rule: 'R3',
      field: 'drawers.top.length',
      from: 450,
      to: 400,
      reason: 'x',
    })
    expect(title).toBe('Górna szuflada: 450 mm → 400 mm')
  })

  it('translates enum values and decor ids', () => {
    expect(
      describeAdjustment({
        rule: 'R7',
        field: 'handleDrilling',
        from: 'double',
        to: 'single',
        reason: '',
      }).title,
    ).toBe('Uchwyty: Dwa uchwyty → Jeden uchwyt')
    expect(
      describeAdjustment({
        rule: 'R9',
        field: 'frontDecor',
        from: 'oak-h1145',
        to: 'black-ps01',
        reason: '',
      }).title,
    ).toBe('Dekor frontów: Dąb naturalny → Czarny mat')
  })

  it('passes the rule reason through', () => {
    expect(
      describeAdjustment({ rule: 'R1', field: 'width', from: 2000, to: 1200, reason: 'Powód.' })
        .reason,
    ).toBe('Powód.')
  })
})

describe('format', () => {
  it('formats grosze as Polish złoty', () => {
    expect(normalizeSpaces(formatPln(123712))).toBe('1237,12 zł')
    expect(normalizeSpaces(formatPln(1234567))).toBe('12 345,67 zł')
    expect(normalizeSpaces(formatPln(5000))).toBe('50,00 zł')
  })

  it('formats quantities with a decimal comma', () => {
    expect(formatQuantity(0.895, 'm²')).toBe('0,9 m²')
    expect(formatQuantity(2, 'szt.')).toBe('2 szt.')
    expect(formatQuantity(6.46, 'm')).toBe('6,46 m')
  })
})

describe('pluralPl', () => {
  const forms: [string, string, string] = ['formatka', 'formatki', 'formatek']

  it.each([
    [1, 'formatka'],
    [2, 'formatki'],
    [4, 'formatki'],
    [5, 'formatek'],
    [12, 'formatek'],
    [14, 'formatek'],
    [22, 'formatki'],
    [25, 'formatek'],
    [0, 'formatek'],
  ])('%d → %s', (count, expected) => {
    expect(pluralPl(count, forms)).toBe(expected)
  })
})

describe('formatPriceChange', () => {
  it('signs the amount', () => {
    expect(normalizeSpaces(formatPriceChange(4443))).toBe('+44,43 zł')
    expect(normalizeSpaces(formatPriceChange(-1200))).toBe('−12,00 zł')
  })

  it('says when nothing changes', () => {
    expect(formatPriceChange(0)).toBe('bez dopłaty')
  })
})
