import { describe, expect, it } from 'vitest'
import { normalize } from '../../domain/rules'
import { DEFAULT_CONFIG, type Config } from '../../domain/schema'
import { summaryGroups } from './summary'

const config = (overrides: Partial<Config> = {}): Config =>
  normalize({ ...DEFAULT_CONFIG, ...overrides }).config

const value = (input: Config, group: string, label: string) =>
  summaryGroups(input)
    .find((candidate) => candidate.title === group)
    ?.rows.find((row) => row.label === label)?.value

describe('summaryGroups', () => {
  it('groups the configuration for the summary step', () => {
    expect(summaryGroups(config()).map((group) => group.title)).toEqual([
      'Wymiary',
      'Materiały',
      'Szuflady',
      'Fronty i uchwyty',
    ])
  })

  it('describes the carcass and countertop sizes', () => {
    expect(value(config(), 'Wymiary', 'Korpus')).toBe('600 × 500 × 500 mm')
    expect(value(config(), 'Wymiary', 'Blat')).toBe('600 × 523 mm, 18 mm')
    expect(value(config(), 'Wymiary', 'Wydłużenia blatu')).toBeUndefined()
    expect(value(config({ topExtensionRight: 200 }), 'Wymiary', 'Wydłużenia blatu')).toBe(
      'lewo 0, prawo 200, przód 0 mm',
    )
  })

  it('names boards and decors', () => {
    expect(value(config(), 'Materiały', 'Fronty')).toBe('Płyta laminowana, Dąb naturalny (H1145)')
    expect(value(config(), 'Materiały', 'Dno szuflad')).toBe('Biały standard (W962)')
  })

  it('shows grain only for grained decors', () => {
    expect(value(config(), 'Materiały', 'Usłojenie boków')).toBeUndefined()
    expect(value(config(), 'Materiały', 'Usłojenie frontów')).toBe('Poziome')
    const continuous = config({ frontGrain: 'vertical', continuousGrain: true })
    expect(value(continuous, 'Materiały', 'Usłojenie frontów')).toBe('Pionowe, ciągłe')
  })

  it('describes drawers and the siphon cut-out', () => {
    const withCut = config({
      drawers: { top: { length: 450, siphonCut: true }, bottom: { length: 400, siphonCut: false } },
    })
    expect(value(withCut, 'Szuflady', 'Górna')).toBe('450 mm, z wycięciem pod syfon')
    expect(value(withCut, 'Szuflady', 'Dolna')).toBe('400 mm')
    expect(value(withCut, 'Szuflady', 'Wycięcie pod syfon')).toBe('164 × 270 mm, na środku')
    expect(value(config(), 'Szuflady', 'Wycięcie pod syfon')).toBeUndefined()
  })

  it('describes fronts and handles', () => {
    expect(value(config(), 'Fronty i uchwyty', 'Uchwyty')).toBe('Bez uchwytów')
    expect(value(config({ handleDrilling: 'single' }), 'Fronty i uchwyty', 'Uchwyty')).toBe(
      'Jeden uchwyt, rozstaw 128 mm, na środku',
    )
    expect(value(config({ frontType: 'edge-handle' }), 'Fronty i uchwyty', 'Front')).toBe(
      'Uchwyt krawędziowy, profil 2 mm',
    )
  })
})
