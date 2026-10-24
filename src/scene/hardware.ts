import { findHandleFinish, findRunner } from '../domain/catalog'
import { edgeProfileSpan, panelHoles, type Panel, type Vec3 } from '../domain/panels'
import { DRAWER_IDS, type Config, type DrawerId } from '../domain/schema'
import { cabinetCentre, toMetres, toScene, type Vec3Tuple } from './geometry'
import type { Point } from './panelShape'

const METAL_SIDE_COLOR = '#d3d7d8'
export const METAL_SIDE_THICKNESS = 16
export const HANDLE_OVERHANG = 20
export const HANDLE_STANDOFF = 30
const BAR_RADIUS = 6
const POST_RADIUS = 4
const BOW_RADIUS = 5
export const BOW_RISE = 34
const SQUARE_BAR = { height: 10, depth: 8, overhang: 6 }
const SQUARE_LEG = 10
const PROFILE_OVERHANG = 10
const PROFILE_LIP = 18
const PROFILE_WALL = 1.5
export const TRAY_COLOR = '#8f9698'
const TRAY_WALL = 2
const TRAY_HEIGHT = 60
const TRAY_RADIUS = 25
const CORNER_SEGMENTS = 6

export type HardwareItem =
  | {
      id: string
      drawer: DrawerId
      shape: 'box'
      position: Vec3Tuple
      size: Vec3Tuple
      color: string
      metal: boolean
    }
  | {
      id: string
      drawer: DrawerId
      shape: 'cylinder'
      position: Vec3Tuple
      radius: number
      length: number
      axis: 'x' | 'z'
      color: string
      metal: boolean
    }
  | {
      id: string
      drawer: DrawerId
      shape: 'tube'
      points: [Vec3Tuple, Vec3Tuple, Vec3Tuple]
      radius: number
      color: string
      metal: boolean
    }
  | {
      id: string
      drawer: DrawerId
      shape: 'profile'
      origin: Vec3Tuple
      section: Point[]
      length: number
      color: string
      metal: boolean
    }
  | {
      id: string
      drawer: DrawerId
      shape: 'tray'
      position: Vec3Tuple
      floor: Point[]
      walls: Point[]
      wall: number
      height: number
      color: string
      metal: boolean
    }

function minCorner(panel: Panel): Vec3 {
  return {
    x: panel.position.x - panel.size.x / 2,
    y: panel.position.y - panel.size.y / 2,
    z: panel.position.z - panel.size.z / 2,
  }
}

function handlePair(
  style: Config['handleStyle'],
  id: string,
  drawer: DrawerId,
  left: { x: number; y: number },
  right: { x: number; y: number },
  surface: number,
  color: string,
  centre: Vec3,
): HardwareItem[] {
  const y = left.y
  const middle = (left.x + right.x) / 2
  const spacing = right.x - left.x

  if (style === 'bow') {
    return [
      {
        id: `${id}-bow`,
        drawer,
        shape: 'tube',
        points: [
          toScene({ x: left.x, y, z: surface }, centre),
          toScene({ x: middle, y, z: surface + 2 * BOW_RISE }, centre),
          toScene({ x: right.x, y, z: surface }, centre),
        ],
        radius: toMetres(BOW_RADIUS),
        color,
        metal: true,
      },
    ]
  }

  if (style === 'square') {
    const legDepth = HANDLE_STANDOFF - SQUARE_BAR.depth
    return [
      {
        id: `${id}-bar`,
        drawer,
        shape: 'box',
        position: toScene(
          { x: middle, y, z: surface + HANDLE_STANDOFF - SQUARE_BAR.depth / 2 },
          centre,
        ),
        size: [
          toMetres(spacing + SQUARE_LEG + 2 * SQUARE_BAR.overhang),
          toMetres(SQUARE_BAR.height),
          toMetres(SQUARE_BAR.depth),
        ],
        color,
        metal: true,
      },
      ...[left, right].map((hole, index): HardwareItem => ({
        id: `${id}-leg-${index === 0 ? 'left' : 'right'}`,
        drawer,
        shape: 'box',
        position: toScene({ x: hole.x, y, z: surface + legDepth / 2 }, centre),
        size: [toMetres(SQUARE_LEG), toMetres(SQUARE_LEG), toMetres(legDepth)],
        color,
        metal: true,
      })),
    ]
  }

  return [
    {
      id: `${id}-bar`,
      drawer,
      shape: 'cylinder',
      position: toScene({ x: middle, y, z: surface + HANDLE_STANDOFF }, centre),
      radius: toMetres(BAR_RADIUS),
      length: toMetres(spacing + 2 * HANDLE_OVERHANG),
      axis: 'x',
      color,
      metal: true,
    },
    ...[left, right].map((hole, index): HardwareItem => ({
      id: `${id}-post-${index === 0 ? 'left' : 'right'}`,
      drawer,
      shape: 'cylinder',
      position: toScene({ x: hole.x, y, z: surface + HANDLE_STANDOFF / 2 }, centre),
      radius: toMetres(POST_RADIUS),
      length: toMetres(HANDLE_STANDOFF),
      axis: 'z',
      color,
      metal: true,
    })),
  ]
}

function drilledHandles(
  config: Config,
  front: Panel,
  drawer: DrawerId,
  centre: Vec3,
): HardwareItem[] {
  const min = minCorner(front)
  const surface = min.z + front.thickness
  const color = findHandleFinish(config.handleFinish).color
  const holes = panelHoles(front).sort((a, b) => a.u - b.u)

  const items: HardwareItem[] = []
  for (let index = 0; index + 1 < holes.length; index += 2) {
    const [left, right] = [holes[index], holes[index + 1]]
    items.push(
      ...handlePair(
        config.handleStyle,
        `${front.id}-handle-${index / 2}`,
        drawer,
        { x: min.x + left.u, y: min.y + left.v },
        { x: min.x + right.u, y: min.y + right.v },
        surface,
        color,
        centre,
      ),
    )
  }
  return items
}

export function edgeProfileSection(thickness: number, frontThickness: number): Point[] {
  const front = frontThickness + PROFILE_OVERHANG
  const lipBottom = thickness - PROFILE_LIP
  return [
    [0, 0],
    [front - PROFILE_WALL, 0],
    [front - PROFILE_WALL, lipBottom],
    [front, lipBottom],
    [front, thickness],
    [0, thickness],
  ]
}

function edgeProfile(front: Panel, drawer: DrawerId, config: Config, centre: Vec3): HardwareItem {
  const min = minCorner(front)
  const span = edgeProfileSpan(config, front)
  return {
    id: `${front.id}-profile`,
    drawer,
    shape: 'profile',
    origin: toScene({ x: min.x + span.start, y: min.y + front.width, z: min.z }, centre),
    section: edgeProfileSection(config.edgeHandleThickness, front.thickness).map(([t, v]) => [
      toMetres(t),
      toMetres(v),
    ]),
    length: toMetres(span.length),
    color: findHandleFinish(config.handleFinish).color,
    metal: true,
  }
}

function metalSides(config: Config, panels: readonly Panel[], centre: Vec3): HardwareItem[] {
  if (findRunner(config.runner).woodenSides) return []

  return DRAWER_IDS.flatMap((drawer) => {
    const box = panels.filter((panel) => panel.drawer === drawer && panel.material === 'drawer')
    const bottom = box.find((panel) => panel.id === `drawer-${drawer}-bottom`)
    if (!bottom) return []

    const min = minCorner(bottom)
    const top = Math.max(...box.map((panel) => panel.position.y + panel.size.y / 2))
    const height = top - min.y
    const length = config.drawers[drawer].length
    const half = METAL_SIDE_THICKNESS / 2

    return (['left', 'right'] as const).map((side): HardwareItem => ({
      id: `drawer-${drawer}-metal-side-${side}`,
      drawer,
      shape: 'box',
      position: toScene(
        {
          x: side === 'left' ? min.x - half : min.x + bottom.size.x + half,
          y: min.y + height / 2,
          z: min.z + length / 2,
        },
        centre,
      ),
      size: [toMetres(METAL_SIDE_THICKNESS), toMetres(height), toMetres(length)],
      color: METAL_SIDE_COLOR,
      metal: true,
    }))
  })
}

function frontHardware(config: Config, panels: readonly Panel[], centre: Vec3): HardwareItem[] {
  return panels
    .filter((panel) => panel.material === 'front')
    .flatMap((front) => {
      const drawer = front.drawer
      if (!drawer) return []
      if (config.frontType === 'edge-handle') return [edgeProfile(front, drawer, config, centre)]
      return drilledHandles(config, front, drawer, centre)
    })
}

function arc(cx: number, cy: number, radius: number, from: number, to: number): Point[] {
  return Array.from({ length: CORNER_SEGMENTS + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / CORNER_SEGMENTS
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  })
}

export function trayFloorOutline(width: number, depth: number, radius: number): Point[] {
  return [
    [0, 0],
    [width, 0],
    ...arc(width - radius, depth - radius, radius, 0, Math.PI / 2),
    ...arc(radius, depth - radius, radius, Math.PI / 2, Math.PI),
  ]
}

export function trayWallOutline(
  width: number,
  depth: number,
  radius: number,
  wall: number,
): Point[] {
  const inner = radius - wall
  return [
    [0, 0],
    ...arc(radius, depth - radius, radius, Math.PI, Math.PI / 2),
    ...arc(width - radius, depth - radius, radius, Math.PI / 2, 0),
    [width, 0],
    [width - wall, 0],
    ...arc(width - radius, depth - radius, inner, 0, Math.PI / 2),
    ...arc(radius, depth - radius, inner, Math.PI / 2, Math.PI),
    [wall, 0],
  ]
}

function siphonTrays(config: Config, panels: readonly Panel[], centre: Vec3): HardwareItem[] {
  return DRAWER_IDS.flatMap((drawer): HardwareItem[] => {
    const bottom = panels.find((panel) => panel.id === `drawer-${drawer}-bottom`)
    const backLeft = panels.find((panel) => panel.id === `drawer-${drawer}-back-left`)
    if (!config.drawers[drawer].siphonCut || !bottom || !backLeft) return []

    const min = minCorner(bottom)
    const gapStart = minCorner(backLeft).x + backLeft.length
    const scale = (points: Point[]): Point[] => points.map(([u, v]) => [toMetres(u), toMetres(v)])

    return [
      {
        id: `drawer-${drawer}-siphon-tray`,
        drawer,
        shape: 'tray',
        position: toScene({ x: gapStart, y: min.y + bottom.thickness, z: min.z }, centre),
        floor: scale(trayFloorOutline(config.siphonCutWidth, config.siphonCutDepth, TRAY_RADIUS)),
        walls: scale(
          trayWallOutline(config.siphonCutWidth, config.siphonCutDepth, TRAY_RADIUS, TRAY_WALL),
        ),
        wall: toMetres(TRAY_WALL),
        height: toMetres(TRAY_HEIGHT),
        color: TRAY_COLOR,
        metal: false,
      },
    ]
  })
}

export function hardwareItems(config: Config, panels: readonly Panel[]): HardwareItem[] {
  const centre = cabinetCentre(config)
  return [
    ...frontHardware(config, panels, centre),
    ...metalSides(config, panels, centre),
    ...siphonTrays(config, panels, centre),
  ]
}

const DRAWER_OPEN_RATIO = 0.75

export type OpenDrawers = Record<DrawerId, boolean>

export const CLOSED_DRAWERS: OpenDrawers = { top: false, bottom: false }

export function toggleAllDrawers(open: OpenDrawers): OpenDrawers {
  const next = !DRAWER_IDS.some((id) => open[id])
  return { top: next, bottom: next }
}

export function drawerOffsets(config: Config, open: OpenDrawers): Record<DrawerId, number> {
  const offset = (id: DrawerId) =>
    open[id] ? toMetres(Math.round(config.drawers[id].length * DRAWER_OPEN_RATIO)) : 0
  return { top: offset('top'), bottom: offset('bottom') }
}
