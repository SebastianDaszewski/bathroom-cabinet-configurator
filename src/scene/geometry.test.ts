import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../domain/schema'
import {
  cabinetCentre,
  cabinetFloor,
  cabinetSpan,
  cameraDistance,
  cameraPosition,
  dimensionGuides,
  ndcToScreen,
  toMetres,
} from './geometry'

describe('toMetres', () => {
  it('converts millimetres to metres', () => {
    expect(toMetres(600)).toBe(0.6)
  })
})

describe('cabinetCentre', () => {
  it('centres the whole cabinet including the countertop', () => {
    expect(cabinetCentre(DEFAULT_CONFIG)).toEqual({ x: 300, y: 259, z: 261.5 })
    expect(cabinetCentre({ ...DEFAULT_CONFIG, topExtensionLeft: 200 }).x).toBe(200)
  })
})

describe('dimensionGuides', () => {
  const centre = cabinetCentre(DEFAULT_CONFIG)

  const guides = dimensionGuides(DEFAULT_CONFIG)
  const guide = (id: string) => guides.find((candidate) => candidate.id === id)

  it('labels width, height and depth in millimetres', () => {
    expect(guides.map((candidate) => candidate.label)).toEqual(['600 mm', '500 mm', '500 mm'])
  })

  it('spans the cabinet along each axis', () => {
    const width = guide('width')
    const height = guide('height')
    const depth = guide('depth')
    expect((width?.to[0] ?? 0) - (width?.from[0] ?? 0)).toBeCloseTo(0.6)
    expect((height?.to[1] ?? 0) - (height?.from[1] ?? 0)).toBeCloseTo(0.5)
    expect((depth?.to[2] ?? 0) - (depth?.from[2] ?? 0)).toBeCloseTo(0.5)
  })

  it('places guides outside the cabinet', () => {
    expect(guide('width')?.from[1]).toBeCloseTo((-60 - centre.y) / 1000)
    expect(guide('height')?.from[0]).toBeCloseTo(-0.36)
    expect(guide('depth')?.from[0]).toBeCloseTo(0.36)
  })

  it('adds the countertop length when it is longer than the carcass', () => {
    expect(guides.some((candidate) => candidate.id === 'top')).toBe(false)
    const extended = dimensionGuides({ ...DEFAULT_CONFIG, topExtensionRight: 400 })
    expect(extended.find((candidate) => candidate.id === 'top')?.label).toBe('1000 mm')
  })

  it('puts the label in the middle of the guide', () => {
    const [x, y, z] = guide('width')?.labelPosition ?? []
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo((-60 - centre.y) / 1000)
    expect(z).toBeCloseTo((500 - centre.z) / 1000)
  })
})

describe('camera', () => {
  it('moves further away for bigger cabinets', () => {
    const small = cameraDistance({ ...DEFAULT_CONFIG, width: 500, height: 400, depth: 390 })
    const big = cameraDistance({ ...DEFAULT_CONFIG, width: 1200, height: 600, depth: 700 })
    expect(big).toBeGreaterThan(small)
  })

  it('keeps the whole cabinet in a 40° view', () => {
    const distance = cameraDistance({ ...DEFAULT_CONFIG, width: 1200 })
    const halfDiagonal = Math.hypot(1.2, 0.5, 0.5) / 2
    expect(Math.atan(halfDiagonal / distance) * 2).toBeLessThan((40 * Math.PI) / 180)
  })

  it('places the camera at the given distance', () => {
    expect(Math.hypot(...cameraPosition(2))).toBeCloseTo(2)
  })

  it.each([
    ['front', 2],
    ['side', 0],
    ['top', 1],
  ] as const)('looks along the main axis for the %s view', (view, axis) => {
    const position = cameraPosition(3, view)
    expect(Math.hypot(...position)).toBeCloseTo(3)
    expect(Math.abs(position[axis])).toBeGreaterThan(2.9)
  })
})

describe('ndcToScreen', () => {
  const size = { width: 800, height: 600 }

  it('maps the centre of the view to the centre of the canvas', () => {
    expect(ndcToScreen({ x: 0, y: 0, z: 0.5 }, size)).toEqual({ x: 400, y: 300, visible: true })
  })

  it('flips the y axis', () => {
    expect(ndcToScreen({ x: -1, y: 1, z: 0 }, size)).toMatchObject({ x: 0, y: 0 })
    expect(ndcToScreen({ x: 1, y: -1, z: 0 }, size)).toMatchObject({ x: 800, y: 600 })
  })

  it('hides points outside the clipping range', () => {
    expect(ndcToScreen({ x: 0, y: 0, z: 1.2 }, size).visible).toBe(false)
  })
})

describe('cabinet extent', () => {
  it('puts the floor at the bottom of the carcass', () => {
    expect(cabinetFloor(DEFAULT_CONFIG)).toBeCloseTo(-0.259)
  })

  it('spans the wider of width and depth, including the countertop', () => {
    expect(cabinetSpan(DEFAULT_CONFIG)).toBeCloseTo(0.6)
    expect(cabinetSpan({ ...DEFAULT_CONFIG, topExtensionRight: 400 })).toBeCloseTo(1)
  })
})
