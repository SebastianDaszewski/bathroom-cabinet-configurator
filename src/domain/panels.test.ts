import { describe, expect, it } from 'vitest'
import { buildPanels, cabinetBounds, type Panel } from './panels'
import { normalize } from './rules'
import { DEFAULT_CONFIG, type Config } from './schema'

const config = (overrides: Partial<Config>): Config =>
  normalize({ ...DEFAULT_CONFIG, ...overrides }).config

const byId = (panels: Panel[], id: string): Panel => {
  const panel = panels.find((candidate) => candidate.id === id)
  if (!panel) throw new Error(`Missing panel ${id}`)
  return panel
}

const dims = (panel: Panel) => [panel.length, panel.width, panel.thickness]

const minCorner = (panel: Panel) => ({
  x: panel.position.x - panel.size.x / 2,
  y: panel.position.y - panel.size.y / 2,
  z: panel.position.z - panel.size.z / 2,
})

const overlaps = (a: Panel, b: Panel) =>
  (['x', 'y', 'z'] as const).every(
    (axis) =>
      Math.abs(a.position[axis] - b.position[axis]) < (a.size[axis] + b.size[axis]) / 2 - 1e-9,
  )

describe('buildPanels — default config', () => {
  const panels = buildPanels(DEFAULT_CONFIG)

  it('builds one panel per physical piece', () => {
    expect(panels.map((panel) => panel.id)).toEqual([
      'side-left',
      'side-right',
      'bottom',
      'top',
      'front-top',
      'front-bottom',
      'drawer-top-bottom',
      'drawer-top-back',
      'drawer-bottom-bottom',
      'drawer-bottom-back',
    ])
  })

  it.each([
    ['side-left', [500, 500, 18]],
    ['bottom', [564, 500, 18]],
    ['top', [600, 523, 18]],
    ['front-top', [596, 249, 18]],
    ['front-bottom', [596, 248, 18]],
    ['drawer-top-bottom', [489, 440, 16]],
    ['drawer-top-back', [477, 163, 16]],
    ['drawer-bottom-back', [477, 162, 16]],
  ])('%s is %j', (id, expected) => {
    expect(dims(byId(panels, id))).toEqual(expected)
  })

  it('uses the configured materials', () => {
    expect(byId(panels, 'side-left')).toMatchObject({ board: 'chipboard', decor: 'grey-u732' })
    expect(byId(panels, 'front-top')).toMatchObject({ board: 'chipboard', decor: 'oak-h1145' })
    expect(byId(panels, 'drawer-bottom-back')).toMatchObject({ decor: 'white-w960' })
  })

  it('bands the visible edges', () => {
    expect(byId(panels, 'side-left').edges).toEqual({ l1: true, l2: false, w1: false, w2: false })
    expect(byId(panels, 'top').edges).toEqual({ l1: true, l2: false, w1: true, w2: true })
    expect(byId(panels, 'front-top').edges).toEqual({ l1: true, l2: true, w1: true, w2: true })
  })

  it('maps length, width and thickness onto the axes', () => {
    expect(byId(panels, 'side-right')).toMatchObject({
      size: { x: 18, y: 500, z: 500 },
      position: { x: 591, y: 250, z: 250 },
    })
    expect(byId(panels, 'front-top')).toMatchObject({
      size: { x: 596, y: 249, z: 18 },
      position: { x: 300, y: 375.5, z: 509 },
    })
  })
})

describe('buildPanels — countertop', () => {
  it('lies on the carcass and covers the fronts', () => {
    const top = byId(buildPanels(DEFAULT_CONFIG), 'top')
    expect(minCorner(top)).toEqual({ x: 0, y: 500, z: 0 })
    expect(top.width).toBe(500 + 18 + 5)
  })

  it('extends to the left, right and front', () => {
    const top = byId(
      buildPanels(config({ topExtensionLeft: 150, topExtensionRight: 250, topExtensionFront: 40 })),
      'top',
    )
    expect(dims(top)).toEqual([1000, 563, 18])
    expect(minCorner(top).x).toBe(-150)
  })

  it('is thickened with a second board underneath', () => {
    const panels = buildPanels(config({ topThickening: 'double' }))
    const thickening = byId(panels, 'top-thickening')

    expect(thickening.name).toBe('Pogrubienie wieńca')
    expect(dims(thickening)).toEqual(dims(byId(panels, 'top')))
    expect(minCorner(thickening).y).toBe(500)
    expect(minCorner(byId(panels, 'top')).y).toBe(518)
  })

  it('glues the thickening to the top as one edge-banded block', () => {
    const panels = buildPanels(config({ topThickening: 'double' }))
    expect(byId(panels, 'top').glueGroup).toBe('top')
    expect(byId(panels, 'top-thickening').glueGroup).toBe('top')
    expect(byId(panels, 'top-thickening').edges).toEqual({
      l1: false,
      l2: false,
      w1: false,
      w2: false,
    })
    expect(byId(buildPanels(DEFAULT_CONFIG), 'top').glueGroup).toBeNull()
  })

  it('reports the overall size including the countertop', () => {
    expect(cabinetBounds(config({ topExtensionLeft: 100, topThickening: 'double' }))).toEqual({
      min: { x: -100, y: 0, z: 0 },
      max: { x: 600, y: 536, z: 523 },
    })
  })

  it('never exceeds one board length (R12)', () => {
    const top = byId(
      buildPanels(config({ width: 1200, topExtensionLeft: 1000, topExtensionRight: 1000 })),
      'top',
    )
    expect(top.length).toBe(2800)
  })
})

describe('buildPanels — drawers', () => {
  it('assigns drawer fronts and boxes to their drawer', () => {
    const panels = buildPanels(config({ runner: 'tandem' }))
    const drawerOf = (id: string) => byId(panels, id).drawer

    expect(drawerOf('side-left')).toBeNull()
    expect(drawerOf('top')).toBeNull()
    expect(drawerOf('front-top')).toBe('top')
    expect(drawerOf('drawer-top-side-left')).toBe('top')
    expect(drawerOf('front-bottom')).toBe('bottom')
    expect(drawerOf('drawer-bottom-back')).toBe('bottom')
  })

  it('follows the drawer length', () => {
    const panels = buildPanels(config({ depth: 440 }))
    expect(byId(panels, 'drawer-top-bottom').width).toBe(390)
    expect(minCorner(byId(panels, 'drawer-bottom-back')).z).toBe(40)
  })

  it('adds wooden sides for tandem runners', () => {
    const panels = buildPanels(config({ runner: 'tandem' }))
    const sides = panels.filter((panel) => panel.name === 'Bok szuflady')

    expect(sides).toHaveLength(4)
    expect(dims(sides[0])).toEqual([450, 179, 16])
    expect(byId(panels, 'drawer-top-bottom').length).toBe(522)
    expect(byId(panels, 'drawer-bottom-back').length).toBe(522)
  })

  const withCut = (overrides: Partial<Config> = {}) =>
    buildPanels(
      config({
        ...overrides,
        drawers: {
          top: { length: 450, siphonCut: true },
          bottom: { length: 450, siphonCut: false },
        },
      }),
    )
  const gapCentre = (panels: Panel[]) => {
    const left = byId(panels, 'drawer-top-back-left')
    return minCorner(left).x + left.length + 164 / 2
  }

  it('keeps the drawer bottom whole', () => {
    expect(byId(withCut(), 'drawer-top-bottom').cutouts).toEqual([])
  })

  it('splits the drawer back around a 164 mm gap for the pipe', () => {
    const panels = withCut()
    const left = byId(panels, 'drawer-top-back-left')
    const right = byId(panels, 'drawer-top-back-right')

    expect(minCorner(right).x - (minCorner(left).x + left.length)).toBe(164)
    expect(left.length + 164 + right.length).toBe(477)
    expect(left.width).toBe(right.width)
    expect(panels.some((panel) => panel.id === 'drawer-top-back')).toBe(false)
    expect(byId(panels, 'drawer-bottom-back').length).toBe(477)
  })

  it('centres the gap by default, to the nearest half millimetre', () => {
    expect(Math.abs(gapCentre(withCut()) - 300)).toBeLessThanOrEqual(0.5)
  })

  it('moves the gap to a custom position', () => {
    const panels = withCut({ siphonPosition: 'custom', siphonX: 250 })
    expect(Math.abs(gapCentre(panels) - 250)).toBeLessThanOrEqual(0.5)
  })

  it('uses the configured cut-out width for the gap', () => {
    const panels = withCut({ siphonCutWidth: 200 })
    const left = byId(panels, 'drawer-top-back-left')
    const right = byId(panels, 'drawer-top-back-right')
    expect(minCorner(right).x - (minCorner(left).x + left.length)).toBe(200)
  })

  it('adds no extra board panels for the cut-out', () => {
    expect(withCut().filter((panel) => panel.drawer === 'top')).toHaveLength(4)
  })
})

describe('buildPanels — fronts and handles', () => {
  it('shortens edge-handle fronts', () => {
    const panels = buildPanels(config({ frontType: 'edge-handle', edgeHandleThickness: 3 }))
    expect(byId(panels, 'front-top').width).toBe(246)
    expect(byId(panels, 'front-bottom').width).toBe(245)
  })

  it('has no holes without handle drilling', () => {
    expect(byId(buildPanels(DEFAULT_CONFIG), 'front-top').cutouts).toEqual([])
  })

  it('drills two holes per single handle, centred', () => {
    const front = byId(buildPanels(config({ handleDrilling: 'single' })), 'front-top')
    expect(front.cutouts).toEqual([
      { kind: 'hole', u: 234, v: 124.5, diameter: 5 },
      { kind: 'hole', u: 362, v: 124.5, diameter: 5 },
    ])
  })

  it('drills four holes for double handles, 50 mm from the top', () => {
    const front = byId(
      buildPanels(config({ width: 1000, handleDrilling: 'double', handlePosition: 'top-50' })),
      'front-bottom',
    )
    expect(front.cutouts.map((cutout) => cutout.u)).toEqual([185, 313, 683, 811])
    expect(front.cutouts.every((cutout) => cutout.v === 198)).toBe(true)
  })
})

describe('buildPanels — invariants', () => {
  const configs: Config[] = []
  for (const width of [500, 799, 800, 1200]) {
    for (const height of [400, 501, 600]) {
      for (const depth of [390, 440, 700]) {
        for (const runner of ['tandem', 'blum'] as const) {
          configs.push(
            config({
              width,
              height,
              depth,
              runner,
              frontType: height === 501 ? 'edge-handle' : 'standard',
              edgeHandleThickness: 4,
              handleDrilling: width >= 800 ? 'double' : 'single',
              handleSpacing: 480,
              handlePosition: depth === 440 ? 'top-50' : 'center',
              siphonPosition: depth === 700 ? 'custom' : 'center',
              siphonX: 0,
              topThickening: height === 600 ? 'double' : 'none',
              topExtensionLeft: width === 500 ? 300 : 0,
              topExtensionRight: width === 1200 ? 1800 : 0,
              topExtensionFront: depth === 700 ? 100 : 0,
              drawers: {
                top: { length: 450, siphonCut: true },
                bottom: { length: 450, siphonCut: depth !== 390 },
              },
            }),
          )
        }
      }
    }
  }

  it.each(configs.map((c) => [`${c.width}×${c.height}×${c.depth} ${c.runner}`, c] as const))(
    '%s',
    (_label, input) => {
      const panels = buildPanels(input)

      for (const panel of panels) {
        for (const value of dims(panel)) {
          expect(Number.isInteger(value) && value > 0).toBe(true)
        }

        const min = minCorner(panel)
        const bounds = cabinetBounds(input)
        for (const axis of ['x', 'y', 'z'] as const) {
          expect(min[axis]).toBeGreaterThanOrEqual(bounds.min[axis])
          expect(min[axis] + panel.size[axis]).toBeLessThanOrEqual(bounds.max[axis])
        }
        if (!panel.id.startsWith('top')) {
          expect(min.y + panel.size.y).toBeLessThanOrEqual(input.height)
        }

        for (const hole of panel.cutouts) {
          expect(hole.u).toBeGreaterThanOrEqual(50)
          expect(hole.u).toBeLessThanOrEqual(panel.length - 50)
          expect(hole.v).toBeGreaterThan(0)
          expect(hole.v).toBeLessThan(panel.width)
        }
      }

      for (const [index, a] of panels.entries()) {
        for (const b of panels.slice(index + 1)) {
          expect(overlaps(a, b), `${a.id} overlaps ${b.id}`).toBe(false)
        }
      }
    },
  )
})
