import { describe, expect, it } from 'vitest'
import { buildPanels } from '../domain/panels'
import { normalize } from '../domain/rules'
import { DEFAULT_CONFIG, type Config } from '../domain/schema'
import {
  drawerOffsets,
  GROOVE_COLOR,
  hardwareItems,
  HANDLE_OVERHANG,
  HANDLE_STANDOFF,
  METAL_COLOR,
  METAL_SIDE_THICKNESS,
  TRAY_COLOR,
  trayFloorOutline,
  trayWallOutline,
} from './hardware'

const config = (overrides: Partial<Config> = {}): Config =>
  normalize({ ...DEFAULT_CONFIG, ...overrides }).config

const itemsFor = (input: Config) => hardwareItems(input, buildPanels(input))

const frontItemsFor = (input: Config) =>
  itemsFor(input).filter((item) => !item.id.includes('metal-side'))

describe('hardwareItems', () => {
  it('has no hardware on plain fronts without drilling', () => {
    expect(frontItemsFor(config())).toEqual([])
  })

  it('mounts a bar with two posts per handle', () => {
    const items = frontItemsFor(config({ handleDrilling: 'single' }))
    expect(items.map((item) => item.id)).toEqual([
      'front-top-handle-0-bar',
      'front-top-handle-0-post-left',
      'front-top-handle-0-post-right',
      'front-bottom-handle-0-bar',
      'front-bottom-handle-0-post-left',
      'front-bottom-handle-0-post-right',
    ])
  })

  it('centres the bar between the holes, in front of the front', () => {
    const [bar, left, right] = itemsFor(config({ handleDrilling: 'single' }))
    if (bar.shape !== 'cylinder') throw new Error('expected a cylinder')

    expect(bar.position[0]).toBeCloseTo(0)
    expect(bar.position[1]).toBeCloseTo((251 + 124.5 - 250) / 1000)
    expect(bar.position[2]).toBeCloseTo((518 + HANDLE_STANDOFF - 250) / 1000)
    expect(bar.length).toBeCloseTo((128 + 2 * HANDLE_OVERHANG) / 1000)
    expect(bar).toMatchObject({ axis: 'x', drawer: 'top', color: METAL_COLOR })
    expect(left.position[0]).toBeCloseTo(-0.064)
    expect(right.position[0]).toBeCloseTo(0.064)
  })

  it('mounts two handles per front for double drilling', () => {
    const bars = itemsFor(config({ width: 1000, handleDrilling: 'double' })).filter((item) =>
      item.id.endsWith('-bar'),
    )
    expect(bars).toHaveLength(4)
  })

  it('puts an edge profile on top of each front', () => {
    const items = frontItemsFor(config({ frontType: 'edge-handle', edgeHandleThickness: 4 }))
    const [top] = items
    if (top.shape !== 'box') throw new Error('expected a box')

    expect(items).toHaveLength(2)
    expect(top.size).toEqual([0.596, 0.004, 0.018])
    expect(top.position[1]).toBeCloseTo((251 + 245 + 2 - 250) / 1000)
  })

  it('marks the grip groove at the top of each front', () => {
    const items = frontItemsFor(config({ frontType: 'grip-groove' }))
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ shape: 'box', color: GROOVE_COLOR, drawer: 'top' })
  })
})

describe('metal drawer sides', () => {
  const sides = (input: Config) => itemsFor(input).filter((item) => item.id.includes('metal-side'))

  it('adds two metal sides per drawer for the metal drawer box', () => {
    expect(sides(config({ runner: 'blum' })).map((item) => item.id)).toEqual([
      'drawer-top-metal-side-left',
      'drawer-top-metal-side-right',
      'drawer-bottom-metal-side-left',
      'drawer-bottom-metal-side-right',
    ])
  })

  it('has none for wooden drawers, whose sides are panels', () => {
    expect(sides(config({ runner: 'tandem' }))).toEqual([])
  })

  it('flanks the drawer bottom and spans the drawer box', () => {
    const [left, right] = sides(config({ runner: 'blum' }))
    if (left.shape !== 'box' || right.shape !== 'box') throw new Error('expected boxes')
    const bottomHalf = (600 - 36 - 75) / 2
    const side = METAL_SIDE_THICKNESS / 2

    expect(left.position[0]).toBeCloseTo(-(bottomHalf + side) / 1000)
    expect(right.position[0]).toBeCloseTo((bottomHalf + side) / 1000)
    expect(left.size).toEqual([0.016, 0.179, 0.45])
    expect(left).toMatchObject({ drawer: 'top', metal: true })
  })

  it('stays inside the carcass', () => {
    for (const width of [500, 1200]) {
      for (const item of sides(config({ runner: 'blum', width }))) {
        if (item.shape !== 'box') continue
        expect(Math.abs(item.position[0]) + item.size[0] / 2).toBeLessThan((width / 2 - 18) / 1000)
      }
    }
  })
})

describe('siphon tray', () => {
  const withCut = config({
    drawers: { top: { length: 450, siphonCut: true }, bottom: { length: 450, siphonCut: false } },
  })
  const trays = (input: Config) => itemsFor(input).filter((item) => item.shape === 'tray')

  it('appears only in drawers with a siphon cut-out', () => {
    expect(trays(config())).toEqual([])
    expect(trays(withCut).map((item) => item.id)).toEqual(['drawer-top-siphon-tray'])
  })

  it('sits on the drawer bottom, in the gap of the drawer back', () => {
    const panels = buildPanels(withCut)
    const left = panels.find((panel) => panel.id === 'drawer-top-back-left')
    const bottom = panels.find((panel) => panel.id === 'drawer-top-bottom')
    if (!left || !bottom) throw new Error('missing panels')
    const [tray] = trays(withCut)

    const gapStart = left.position.x - left.size.x / 2 + left.length
    const bottomTop = bottom.position.y + bottom.size.y / 2
    const rear = bottom.position.z - bottom.size.z / 2
    expect(tray.position[0]).toBeCloseTo((gapStart - 300) / 1000)
    expect(tray.position[1]).toBeCloseTo((bottomTop - 250) / 1000)
    expect(tray.position[2]).toBeCloseTo((rear - 250) / 1000)
    expect(tray).toMatchObject({ drawer: 'top', color: TRAY_COLOR, metal: false })
  })

  it('has a floor with rounded front corners and square back corners', () => {
    const floor = trayFloorOutline(164, 270, 25)
    expect(floor.slice(0, 2)).toEqual([
      [0, 0],
      [164, 0],
    ])
    for (const [u, v] of floor) {
      expect(u).toBeGreaterThanOrEqual(-1e-9)
      expect(u).toBeLessThanOrEqual(164 + 1e-9)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(270 + 1e-9)
    }
    expect(floor.some(([u, v]) => u === 0 && v === 270)).toBe(false)
  })

  it('has walls open at the back', () => {
    const walls = trayWallOutline(164, 270, 25, 2)
    const back = walls.filter(([, v]) => Math.abs(v) < 1e-9).map(([u]) => Math.round(u))
    expect(back).toEqual([0, 164, 162, 2])
  })
})

describe('drawerOffsets', () => {
  it('keeps closed drawers in place', () => {
    expect(drawerOffsets(config(), false)).toEqual({ top: 0, bottom: 0 })
  })

  it('pulls open drawers out by three quarters of their length', () => {
    const input = config({
      drawers: { top: { length: 450, siphonCut: true }, bottom: { length: 350, siphonCut: false } },
    })
    expect(drawerOffsets(input, true)).toEqual({ top: 0.338, bottom: 0.263 })
  })
})
