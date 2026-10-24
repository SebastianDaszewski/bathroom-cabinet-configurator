import { DRAWER_BOARD, findDecor, findRunner } from './catalog'
import {
  BOARD_THICKNESS,
  DRAWER_BOARD_THICKNESS,
  DRAWER_BOTTOM_SHORTENING,
  DRAWER_BOX_HEIGHT_CLEARANCE,
  DRAWER_BOX_LIFT,
  FRONT_EDGE_GAP,
  FRONT_GAP,
  GRIP_DEPTH,
  GRIP_POCKET_DEPTH,
  GRIP_POCKET_WIDTH,
  HANDLE_HOLE_DIAMETER,
  HANDLE_TOP_OFFSET,
  TOP_FRONT_OVERHANG,
} from './constants'
import { frontHeights, siphonCenter, topLength } from './rules'
import { DRAWER_IDS, type BoardType, type Config, type DrawerId } from './schema'

export type Axis = 'x' | 'y' | 'z'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export type PanelMaterial = 'carcass' | 'front' | 'drawer'

export interface Edges {
  l1: boolean
  l2: boolean
  w1: boolean
  w2: boolean
}

export interface Hole {
  kind: 'hole'
  u: number
  v: number
  diameter: number
}

export interface Grip {
  kind: 'grip'
  height: number
  depth: number
  pocketWidth: number
  pocketDepth: number
}

type Cutout = Hole | Grip

export function panelHoles(panel: Panel): Hole[] {
  return panel.cutouts.filter((cutout): cutout is Hole => cutout.kind === 'hole')
}

export function panelGrip(panel: Panel): Grip | undefined {
  return panel.cutouts.find((cutout): cutout is Grip => cutout.kind === 'grip')
}

export function edgeProfileSpan(config: Config, front: Panel): { start: number; length: number } {
  const length =
    config.edgeHandleLength === 'full'
      ? front.length
      : Math.min(Number(config.edgeHandleLength), front.length)
  return { start: (front.length - length) / 2, length }
}

export type GrainDirection = 'length' | 'width'

export interface Panel {
  id: string
  name: string
  material: PanelMaterial
  board: BoardType
  decor: string
  length: number
  width: number
  thickness: number
  edges: Edges
  axes: readonly [Axis, Axis, Axis]
  position: Vec3
  size: Vec3
  cutouts: Cutout[]
  drawer: DrawerId | null
  glueGroup: string | null
  grain: GrainDirection | null
  continuousGrain: boolean
}

type PanelSpec = Omit<
  Panel,
  'position' | 'size' | 'cutouts' | 'edges' | 'drawer' | 'glueGroup' | 'grain' | 'continuousGrain'
> & {
  min: Vec3
  drawer?: DrawerId
  glueGroup?: string
  grain?: GrainDirection
  continuousGrain?: boolean
  edges?: Partial<Edges>
  cutouts?: Cutout[]
}

const NO_EDGES: Edges = { l1: false, l2: false, w1: false, w2: false }
const ALL_EDGES: Edges = { l1: true, l2: true, w1: true, w2: true }

function place({
  min,
  edges = {},
  cutouts = [],
  drawer,
  glueGroup,
  grain = 'length',
  continuousGrain = false,
  ...panel
}: PanelSpec): Panel {
  const size: Vec3 = { x: 0, y: 0, z: 0 }
  size[panel.axes[0]] = panel.length
  size[panel.axes[1]] = panel.width
  size[panel.axes[2]] = panel.thickness

  return {
    ...panel,
    edges: { ...NO_EDGES, ...edges },
    size,
    position: { x: min.x + size.x / 2, y: min.y + size.y / 2, z: min.z + size.z / 2 },
    cutouts,
    drawer: drawer ?? null,
    glueGroup: glueGroup ?? null,
    grain: findDecor(panel.decor)?.finish === 'plain' ? null : grain,
    continuousGrain,
  }
}

const t = BOARD_THICKNESS

function carcassPanels(config: Config): Panel[] {
  const { width, height, depth, carcassBoard: board, carcassDecor: decor } = config
  const inner = width - 2 * t
  const carcass = { material: 'carcass', board, decor, thickness: t } as const
  const sideGrain = config.sideGrain === 'vertical' ? 'length' : 'width'

  return [
    place({
      ...carcass,
      id: 'side-left',
      name: 'Bok',
      length: height,
      width: depth,
      axes: ['y', 'z', 'x'],
      min: { x: 0, y: 0, z: 0 },
      edges: { l1: true },
      grain: sideGrain,
    }),
    place({
      ...carcass,
      id: 'side-right',
      name: 'Bok',
      length: height,
      width: depth,
      axes: ['y', 'z', 'x'],
      min: { x: width - t, y: 0, z: 0 },
      edges: { l1: true },
      grain: sideGrain,
    }),
    place({
      ...carcass,
      id: 'bottom',
      name: 'Wieniec dolny',
      length: inner,
      width: depth,
      axes: ['x', 'z', 'y'],
      min: { x: t, y: 0, z: 0 },
      edges: { l1: true },
    }),
    ...topPanels(config),
  ]
}

export function topThickness(config: Config): number {
  return config.topThickening === 'double' ? 2 * t : t
}

export function topDepth(config: Config): number {
  return config.depth + t + TOP_FRONT_OVERHANG + config.topExtensionFront
}

export function cabinetBounds(config: Config): { min: Vec3; max: Vec3 } {
  return {
    min: { x: -config.topExtensionLeft, y: 0, z: 0 },
    max: {
      x: config.width + config.topExtensionRight,
      y: config.height + topThickness(config),
      z: topDepth(config),
    },
  }
}

function topPanels(config: Config): Panel[] {
  const board = {
    material: 'carcass',
    board: config.carcassBoard,
    decor: config.carcassDecor,
    length: topLength(config),
    width: topDepth(config),
    thickness: t,
    axes: ['x', 'z', 'y'],
  } as const
  const x = -config.topExtensionLeft
  const banded = { l1: true, w1: true, w2: true }

  if (config.topThickening === 'none') {
    return [
      place({
        ...board,
        id: 'top',
        name: 'Wieniec górny',
        min: { x, y: config.height, z: 0 },
        edges: banded,
      }),
    ]
  }

  return [
    place({
      ...board,
      id: 'top-thickening',
      name: 'Pogrubienie wieńca',
      min: { x, y: config.height, z: 0 },
      glueGroup: 'top',
    }),
    place({
      ...board,
      id: 'top',
      name: 'Wieniec górny',
      min: { x, y: config.height + t, z: 0 },
      edges: banded,
      glueGroup: 'top',
    }),
  ]
}

function frontBottoms(config: Config): Record<DrawerId, number> {
  const bottom = Math.floor((config.height - FRONT_GAP) / 2)
  return { bottom: 0, top: bottom + FRONT_GAP }
}

function handleHoles(config: Config, frontLength: number, frontHeight: number): Cutout[] {
  if (config.handleDrilling === 'none') return []

  const centers =
    config.handleDrilling === 'double'
      ? [frontLength / 4, (3 * frontLength) / 4]
      : [frontLength / 2]
  const v = config.handlePosition === 'center' ? frontHeight / 2 : frontHeight - HANDLE_TOP_OFFSET
  const half = config.handleSpacing / 2

  return centers.flatMap((center) =>
    [center - half, center + half].map((u): Hole => ({
      kind: 'hole',
      u,
      v,
      diameter: HANDLE_HOLE_DIAMETER,
    })),
  )
}

function frontPanels(config: Config): Panel[] {
  const heights = frontHeights(config)
  const bottoms = frontBottoms(config)
  const length = config.width - 2 * FRONT_EDGE_GAP

  return DRAWER_IDS.map((id) =>
    place({
      id: `front-${id}`,
      drawer: id,
      name: 'Front szuflady',
      material: 'front',
      board: config.frontBoard,
      decor: config.frontDecor,
      length,
      width: heights[id],
      thickness: t,
      axes: ['x', 'y', 'z'],
      min: { x: FRONT_EDGE_GAP, y: bottoms[id], z: config.depth },
      edges: ALL_EDGES,
      cutouts: [
        ...handleHoles(config, length, heights[id]),
        ...(config.frontType === 'grip-groove'
          ? [
              {
                kind: 'grip',
                height: config.gripHeight,
                depth: GRIP_DEPTH,
                pocketWidth: GRIP_POCKET_WIDTH,
                pocketDepth: GRIP_POCKET_DEPTH,
              } as const,
            ]
          : []),
      ],
      grain: config.frontGrain === 'horizontal' ? 'length' : 'width',
      continuousGrain: config.continuousGrain,
    }),
  )
}

function drawerPanels(config: Config, id: DrawerId): Panel[] {
  const runner = findRunner(config.runner)
  const drawer = config.drawers[id]
  const inner = config.width - 2 * t
  const boxHeight = frontHeights(config)[id] - DRAWER_BOX_HEIGHT_CLEARANCE
  const base = frontBottoms(config)[id] + DRAWER_BOX_LIFT
  const rear = config.depth - drawer.length
  const dt = DRAWER_BOARD_THICKNESS
  const material = {
    material: 'drawer',
    board: DRAWER_BOARD,
    decor: config.drawerDecor,
    drawer: id,
  } as const

  const bottomLength = inner - runner.bottomDeduction
  const bottomMinX = (config.width - bottomLength) / 2
  const backLength = inner - runner.backDeduction
  const backMinX = (config.width - backLength) / 2
  const backHeight = boxHeight - dt

  const bottom = place({
    ...material,
    id: `drawer-${id}-bottom`,
    name: 'Dno szuflady',
    decor: config.drawerBottomDecor,
    length: bottomLength,
    width: drawer.length - DRAWER_BOTTOM_SHORTENING,
    thickness: dt,
    axes: ['x', 'z', 'y'],
    min: { x: bottomMinX, y: base, z: rear },
  })

  const back = (key: string, length: number, x: number) =>
    place({
      ...material,
      id: `drawer-${id}-${key}`,
      name: 'Tył szuflady',
      length,
      width: backHeight,
      thickness: dt,
      axes: ['x', 'y', 'z'],
      min: { x, y: base + dt, z: rear },
      edges: { l1: true },
    })

  const splitBack = (): Panel[] => {
    const cutWidth = config.siphonCutWidth
    const leftLength = Math.round(siphonCenter(config) - cutWidth / 2 - backMinX)
    return [
      back('back-left', leftLength, backMinX),
      back('back-right', backLength - cutWidth - leftLength, backMinX + leftLength + cutWidth),
    ]
  }

  const panels = [
    bottom,
    ...(drawer.siphonCut ? splitBack() : [back('back', backLength, backMinX)]),
  ]

  if (!runner.woodenSides) return panels

  const sideMinX = t + runner.sideClearance
  return [
    ...panels,
    ...[sideMinX, config.width - sideMinX - dt].map((x, index) =>
      place({
        ...material,
        id: `drawer-${id}-side-${index === 0 ? 'left' : 'right'}`,
        name: 'Bok szuflady',
        length: drawer.length,
        width: boxHeight,
        thickness: dt,
        axes: ['z', 'y', 'x'],
        min: { x, y: base, z: rear },
        edges: { l1: true },
      }),
    ),
  ]
}

export function buildPanels(config: Config): Panel[] {
  return [
    ...carcassPanels(config),
    ...frontPanels(config),
    ...DRAWER_IDS.flatMap((id) => drawerPanels(config, id)),
  ]
}
