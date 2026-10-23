import { describe, expect, it } from 'vitest'
import { buildPanels } from './panels'
import { price, subtotals, type Price, type PriceLine } from './pricing'
import { PRICING } from './pricing.config'
import { normalize } from './rules'
import { DEFAULT_CONFIG, type Config } from './schema'

const quote = (overrides: Partial<Config> = {}): Price => {
  const config = normalize({ ...DEFAULT_CONFIG, ...overrides }).config
  return price(config, buildPanels(config))
}

const find = (result: Price, label: string): PriceLine | undefined =>
  result.lines.find((priceLine) => priceLine.label.startsWith(label))

const grosze = (pln: number) => Math.round(pln * PRICING.margin * 100)

describe('price — calibration against the reference', () => {
  it('prices the default config at 1200–1250 PLN', () => {
    const { total } = quote()
    expect(total).toBeGreaterThanOrEqual(120_000)
    expect(total).toBeLessThanOrEqual(125_000)
  })

  it('adds 0.35–0.45 PLN per mm of width', () => {
    const slope = (quote({ width: 1200 }).total - quote({ width: 500 }).total) / 100 / 700
    expect(slope).toBeGreaterThanOrEqual(0.35)
    expect(slope).toBeLessThanOrEqual(0.45)
  })

  it('adds 0.30–0.40 PLN per mm of height', () => {
    const slope = (quote({ height: 600 }).total - quote({ height: 400 }).total) / 100 / 200
    expect(slope).toBeGreaterThanOrEqual(0.3)
    expect(slope).toBeLessThanOrEqual(0.4)
  })
})

describe('price — totals', () => {
  it('is the sum of the line amounts, in integer grosze', () => {
    const result = quote({ width: 777, handleDrilling: 'single', frontType: 'standard' })
    const sum = result.lines.reduce((total, priceLine) => total + priceLine.amount, 0)

    expect(result.total).toBe(sum)
    expect(result.lines.every((priceLine) => Number.isInteger(priceLine.amount))).toBe(true)
  })

  it('includes the margin in every line', () => {
    expect(find(quote(), 'Assembly')).toMatchObject({ quantity: 1, amount: grosze(230) })
  })

  it('groups the breakdown by category', () => {
    const result = quote()
    const totals = subtotals(result.lines)

    expect(Object.keys(totals)).toEqual(['boards', 'edging', 'hardware', 'machining', 'labour'])
    expect(Object.values(totals).reduce((sum, value) => sum + value, 0)).toBe(result.total)
  })
})

describe('price — boards and edging', () => {
  it('prices each material group by area', () => {
    const carcass = find(quote(), 'Carcass')
    expect(carcass).toMatchObject({ unit: 'm²', quantity: 0.895, unitPrice: grosze(110) })
  })

  it('applies the decor modifier', () => {
    const fronts = find(quote(), 'Fronts')
    expect(fronts?.label).toBe('Fronts · Laminated chipboard · H1145')
    expect(fronts?.unitPrice).toBe(grosze(110 * 1.15))
  })

  it('prices fronts by board type', () => {
    const plain = find(quote(), 'Fronts')?.amount ?? 0
    const gloss = find(quote({ frontBoard: 'acrylic', frontDecor: 'white-w960' }), 'Fronts')
    expect(gloss?.amount).toBeGreaterThan(plain)
  })

  it('measures edge banding from the panel edges', () => {
    expect(find(quote(), 'Edge banding')).toMatchObject({ unit: 'm', quantity: 6.46 })
  })

  it('makes a wider cabinet more expensive in every board group', () => {
    const narrow = quote({ width: 500 })
    const wide = quote({ width: 1200 })
    for (const label of ['Carcass', 'Back', 'Fronts', 'Drawer boxes', 'Edge banding']) {
      expect(find(wide, label)?.amount).toBeGreaterThan(find(narrow, label)?.amount ?? 0)
    }
  })
})

describe('price — hardware and machining', () => {
  it('charges a runner pair per drawer', () => {
    expect(find(quote(), 'Runners')).toMatchObject({ quantity: 2, unitPrice: grosze(180) })
    expect(find(quote({ runner: 'tandem' }), 'Runners')?.unitPrice).toBe(grosze(150))
  })

  it('adds Tip-On units only for push-to-open', () => {
    expect(find(quote(), 'Tip-On')).toBeUndefined()
    expect(find(quote({ opening: 'tip-on' }), 'Tip-On')).toMatchObject({ quantity: 2 })
  })

  it('counts handles and holes from the drilling', () => {
    const single = quote({ handleDrilling: 'single' })
    expect(find(single, 'Handles')?.quantity).toBe(2)
    expect(find(single, 'Handle holes')?.quantity).toBe(4)

    const double = quote({ width: 900, handleDrilling: 'double' })
    expect(find(double, 'Handles')?.quantity).toBe(4)
    expect(find(double, 'Handle holes')?.quantity).toBe(8)
  })

  it('has no handle lines without drilling', () => {
    expect(find(quote(), 'Handles')).toBeUndefined()
    expect(find(quote(), 'Handle holes')).toBeUndefined()
  })

  it('charges one siphon cut-out per drawer that has one', () => {
    expect(find(quote(), 'Siphon')?.quantity).toBe(1)
    const both = quote({
      drawers: { top: { length: 450, siphonCut: true }, bottom: { length: 450, siphonCut: true } },
    })
    expect(find(both, 'Siphon')?.quantity).toBe(2)
    const none = quote({
      drawers: {
        top: { length: 450, siphonCut: false },
        bottom: { length: 450, siphonCut: false },
      },
    })
    expect(find(none, 'Siphon')).toBeUndefined()
  })

  it('prices the edge handle profile by front length', () => {
    expect(find(quote({ frontType: 'edge-handle' }), 'Edge handle profile')).toMatchObject({
      unit: 'm',
      quantity: 1.192,
    })
  })

  it('prices grip groove milling by front length', () => {
    expect(find(quote({ frontType: 'grip-groove' }), 'Grip groove')).toMatchObject({
      category: 'machining',
      quantity: 1.192,
    })
  })
})

describe('price — labour', () => {
  it('charges per panel', () => {
    expect(find(quote(), 'Cutting')?.quantity).toBe(12)
    expect(find(quote({ runner: 'tandem' }), 'Cutting')?.quantity).toBe(16)
  })
})
