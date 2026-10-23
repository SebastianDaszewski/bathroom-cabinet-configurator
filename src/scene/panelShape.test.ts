import { describe, expect, it } from 'vitest'
import { buildPanels, type Panel } from '../domain/panels'
import { normalize } from '../domain/rules'
import { DEFAULT_CONFIG, type Config } from '../domain/schema'
import {
  grainAxis,
  mergeGlued,
  panelBasis,
  panelMatrix,
  panelMeshes,
  panelOutline,
  textureOffset,
} from './panelShape'

const config = (overrides: Partial<Config> = {}): Config =>
  normalize({ ...DEFAULT_CONFIG, ...overrides }).config

const panel = (id: string, input: Config = DEFAULT_CONFIG): Panel => {
  const found = buildPanels(input).find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Missing panel ${id}`)
  return found
}

const apply = (m: number[], [x, y, z]: [number, number, number]) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
]

describe('panelOutline', () => {
  it('is a plain rectangle without cut-outs', () => {
    expect(panelOutline(panel('side-left'))).toEqual({
      points: [
        [0, 0],
        [500, 0],
        [500, 500],
        [0, 500],
      ],
      holes: [],
    })
  })

  it('turns handle holes into round holes', () => {
    const front = panel('front-top', config({ handleDrilling: 'single' }))
    expect(panelOutline(front).holes).toEqual([
      { u: 234, v: 124.5, radius: 2.5 },
      { u: 362, v: 124.5, radius: 2.5 },
    ])
  })
})

describe('panelBasis', () => {
  it.each([
    [['y', 'z', 'x'], false],
    [['x', 'y', 'z'], false],
    [['x', 'z', 'y'], true],
    [['z', 'y', 'x'], true],
  ] as const)('%j keeps a right-handed basis (flipped: %s)', (axes, flipped) => {
    const basis = panelBasis(axes)
    const [u, v, t] = basis.columns
    const determinant =
      u[0] * (v[1] * t[2] - v[2] * t[1]) -
      u[1] * (v[0] * t[2] - v[2] * t[0]) +
      u[2] * (v[0] * t[1] - v[1] * t[0])

    expect(basis.flipped).toBe(flipped)
    expect(determinant).toBe(1)
  })
})

describe('panelMatrix', () => {
  it.each([
    ['default', config()],
    ['tandem, edge handle', config({ runner: 'tandem', frontType: 'edge-handle', width: 1000 })],
  ])('maps every panel onto its box in the scene (%s)', (_label, input) => {
    const centre = { x: input.width / 2, y: input.height / 2, z: input.depth / 2 }

    for (const candidate of buildPanels(input)) {
      const m = panelMatrix(candidate, centre)
      const a = apply(m, [0, 0, 0])
      const b = apply(m, [candidate.length, candidate.width, candidate.thickness])
      const min = [0, 1, 2].map((i) => Math.min(a[i], b[i]))
      const max = [0, 1, 2].map((i) => Math.max(a[i], b[i]))
      const { position, size } = candidate

      ;(['x', 'y', 'z'] as const).forEach((axis, i) => {
        expect(min[i]).toBeCloseTo((position[axis] - size[axis] / 2 - centre[axis]) / 1000, 9)
        expect(max[i]).toBeCloseTo((position[axis] + size[axis] / 2 - centre[axis]) / 1000, 9)
      })
    }
  })
})

describe('panelMeshes', () => {
  const meshes = panelMeshes(DEFAULT_CONFIG, buildPanels(DEFAULT_CONFIG))
  const mesh = (id: string) => meshes.find((candidate) => candidate.id === id)

  it('creates one mesh per panel', () => {
    expect(meshes).toHaveLength(buildPanels(DEFAULT_CONFIG).length)
  })

  it('takes colours from the decors', () => {
    expect(mesh('side-left')?.color).toBe('#8d8f8c')
    expect(mesh('front-top')?.color).toBe('#d2b48c')
    expect(mesh('drawer-bottom-back')?.color).toBe('#f2f1ec')
  })

  it('keeps the drawer each panel moves with', () => {
    expect(mesh('bottom')?.drawer).toBeNull()
    expect(mesh('front-bottom')?.drawer).toBe('bottom')
  })
})

describe('mergeGlued', () => {
  it('keeps panels that are not glued', () => {
    const panels = buildPanels(DEFAULT_CONFIG)
    expect(mergeGlued(panels)).toEqual(panels)
  })

  it('renders a thickened countertop as one 36 mm board', () => {
    const merged = mergeGlued(buildPanels(config({ topThickening: 'double' })))
    const top = merged.find((panel) => panel.id === 'top')

    expect(merged.some((panel) => panel.id === 'top-thickening')).toBe(false)
    expect(top?.thickness).toBe(36)
    expect(top?.size.y).toBe(36)
    expect(top?.position.y).toBe(500 + 18)
  })
})

describe('texture mapping', () => {
  it('runs the grain along the panel length or width', () => {
    const panels = buildPanels(config({ frontGrain: 'vertical' }))
    const find = (id: string) => panels.find((panel) => panel.id === id)
    const front = find('front-top')
    const side = find('side-left')
    if (!front || !side) throw new Error('missing panels')

    expect(grainAxis(front)).toBe('v')
    expect(grainAxis(side)).toBeNull()
  })

  it('aligns continuous fronts to the same texture', () => {
    const panels = buildPanels(config({ frontGrain: 'vertical', continuousGrain: true }))
    const top = panels.find((panel) => panel.id === 'front-top')
    const bottom = panels.find((panel) => panel.id === 'front-bottom')
    if (!top || !bottom) throw new Error('missing fronts')

    expect(textureOffset(top)).toEqual([2, 251])
    expect(textureOffset(bottom)).toEqual([2, 0])
  })

  it('shifts the texture of other panels so they do not look identical', () => {
    const panels = buildPanels(DEFAULT_CONFIG)
    const top = panels.find((panel) => panel.id === 'front-top')
    const bottom = panels.find((panel) => panel.id === 'front-bottom')
    if (!top || !bottom) throw new Error('missing fronts')

    expect(textureOffset(top)[0]).not.toBe(textureOffset(bottom)[0])
  })
})
