import type { Axis, Panel, Vec3 } from '../domain/panels'
import type { Config, DrawerId } from '../domain/schema'
import { cabinetCentre, panelColor, toMetres, type Vec3Tuple } from './geometry'

export type Point = [number, number]

export interface Hole {
  u: number
  v: number
  radius: number
}

export interface PanelOutline {
  points: Point[]
  holes: Hole[]
}

export interface PanelMesh {
  id: string
  drawer: DrawerId | null
  color: string
  thickness: number
  outline: PanelOutline
  matrix: number[]
}

export function panelOutline(panel: Panel): PanelOutline {
  const { length: l, width: w } = panel
  const points: Point[] = [
    [0, 0],
    [l, 0],
    [l, w],
    [0, w],
  ]
  const holes = panel.cutouts.map((hole) => ({ u: hole.u, v: hole.v, radius: hole.diameter / 2 }))

  return { points, holes }
}

const UNIT: Record<Axis, Vec3Tuple> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }

function cross(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function dot(a: Vec3Tuple, b: Vec3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function panelBasis(axes: Panel['axes']): {
  columns: [Vec3Tuple, Vec3Tuple, Vec3Tuple]
  flipped: boolean
} {
  const u = UNIT[axes[0]]
  const v = UNIT[axes[1]]
  const t = UNIT[axes[2]]
  const flipped = dot(cross(u, v), t) < 0
  return { columns: [u, v, flipped ? [-t[0], -t[1], -t[2]] : t], flipped }
}

export function panelMatrix(panel: Panel, centre: Vec3): number[] {
  const { columns, flipped } = panelBasis(panel.axes)
  const min = {
    x: panel.position.x - panel.size.x / 2,
    y: panel.position.y - panel.size.y / 2,
    z: panel.position.z - panel.size.z / 2,
  }
  const thicknessAxis = panel.axes[2]
  const origin = { ...min, [thicknessAxis]: min[thicknessAxis] + (flipped ? panel.thickness : 0) }
  const scale = toMetres(1)

  return [
    ...columns[0].map((value) => value * scale),
    0,
    ...columns[1].map((value) => value * scale),
    0,
    ...columns[2].map((value) => value * scale),
    0,
    toMetres(origin.x - centre.x),
    toMetres(origin.y - centre.y),
    toMetres(origin.z - centre.z),
    1,
  ]
}

export function panelMeshes(config: Config, panels: readonly Panel[]): PanelMesh[] {
  const centre = cabinetCentre(config)
  return panels.map((panel) => ({
    id: panel.id,
    drawer: panel.drawer,
    color: panelColor(panel),
    thickness: panel.thickness,
    outline: panelOutline(panel),
    matrix: panelMatrix(panel, centre),
  }))
}
