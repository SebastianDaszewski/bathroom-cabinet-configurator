import { DRAWER_BOARD, findRunner } from './catalog'
import {
  BOARD_THICKNESS,
  DRAWER_BOARD_THICKNESS,
  DRAWER_BOTTOM_SHORTENING,
  DRAWER_BOX_HEIGHT_CLEARANCE,
  DRAWER_BOX_LIFT,
  FRONT_EDGE_GAP,
  FRONT_GAP,
  HANDLE_HOLE_DIAMETER,
  HANDLE_TOP_OFFSET,
  SIPHON_CUT_WIDTH,
  TOP_RAIL_WIDTH,
} from './constants'
import { frontHeights, siphonCenter } from './rules'
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

export interface Cutout {
  kind: 'hole'
  u: number
  v: number
  diameter: number
}

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
}

type PanelSpec = Omit<Panel, 'position' | 'size' | 'cutouts' | 'edges' | 'drawer'> & {
  min: Vec3
  drawer?: DrawerId
  edges?: Partial<Edges>
  cutouts?: Cutout[]
}

const NO_EDGES: Edges = { l1: false, l2: false, w1: false, w2: false }
const ALL_EDGES: Edges = { l1: true, l2: true, w1: true, w2: true }

function place({ min, edges = {}, cutouts = [], drawer, ...panel }: PanelSpec): Panel {
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
  }
}

const t = BOARD_THICKNESS

function carcassPanels(config: Config): Panel[] {
  const { width, height, depth, carcassBoard: board, carcassDecor: decor } = config
  const inner = width - 2 * t
  const carcass = { material: 'carcass', board, decor, thickness: t } as const

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
    place({
      ...carcass,
      id: 'rail-front',
      name: 'Listwa górna przednia',
      length: inner,
      width: TOP_RAIL_WIDTH,
      axes: ['x', 'z', 'y'],
      min: { x: t, y: height - t, z: depth - TOP_RAIL_WIDTH },
      edges: { l1: true },
    }),
    place({
      ...carcass,
      id: 'rail-back',
      name: 'Listwa górna tylna',
      length: inner,
      width: TOP_RAIL_WIDTH,
      axes: ['x', 'z', 'y'],
      min: { x: t, y: height - t, z: 0 },
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
    [center - half, center + half].map((u): Cutout => ({
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
      cutouts: handleHoles(config, length, heights[id]),
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
    const leftLength = Math.round(siphonCenter(config) - SIPHON_CUT_WIDTH / 2 - backMinX)
    return [
      back('back-left', leftLength, backMinX),
      back(
        'back-right',
        backLength - SIPHON_CUT_WIDTH - leftLength,
        backMinX + leftLength + SIPHON_CUT_WIDTH,
      ),
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
