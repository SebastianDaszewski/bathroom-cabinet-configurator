import { findDecor, type DecorFinish } from '../domain/catalog'
import {
  panelGrip,
  panelHoles,
  type Axis,
  type Grip,
  type Panel,
  type Vec3,
} from '../domain/panels'
import type { Config, DrawerId } from '../domain/schema'
import { cabinetCentre, panelColor, toMetres, type Vec3Tuple } from './geometry'

export type Point = [number, number]

interface Hole {
  u: number
  v: number
  radius: number
}

export interface PanelOutline {
  points: Point[]
  holes: Hole[]
}

interface SlabPart {
  kind: 'slab'
  outline: PanelOutline
  from: number
  to: number
}

interface SectionPart {
  kind: 'section'
  section: Point[]
  length: number
}

export type PanelPart = SlabPart | SectionPart

export type GrainAxis = 'u' | 'v'

export interface PanelMesh {
  id: string
  drawer: DrawerId | null
  color: string
  finish: DecorFinish
  grainAxis: GrainAxis | null
  textureOffset: Point
  parts: PanelPart[]
  matrix: number[]
}

function rectangle(length: number, width: number): Point[] {
  return [
    [0, 0],
    [length, 0],
    [length, width],
    [0, width],
  ]
}

export function panelOutline(panel: Panel): PanelOutline {
  const holes = panelHoles(panel).map((hole) => ({
    u: hole.u,
    v: hole.v,
    radius: hole.diameter / 2,
  }))
  return { points: rectangle(panel.length, panel.width), holes }
}

const POCKET_SEGMENTS = 8

export function gripSection(width: number, thickness: number, grip: Grip): Point[] {
  const wall = thickness - grip.depth
  const lip = width - grip.height
  const radius = grip.pocketWidth / 2
  const centre: Point = [wall + radius, lip - grip.pocketDepth + radius]
  const pocket = Array.from({ length: POCKET_SEGMENTS + 1 }, (_, index): Point => {
    const angle = -(Math.PI * index) / POCKET_SEGMENTS
    return [centre[0] + radius * Math.cos(angle), centre[1] + radius * Math.sin(angle)]
  })

  return [
    [0, 0],
    [thickness, 0],
    [thickness, lip],
    [wall + grip.pocketWidth, lip],
    ...pocket,
    [wall, width],
    [0, width],
  ]
}

export function panelParts(panel: Panel): PanelPart[] {
  const grip = panelGrip(panel)
  if (!grip) return [{ kind: 'slab', outline: panelOutline(panel), from: 0, to: panel.thickness }]
  return [
    {
      kind: 'section',
      section: gripSection(panel.width, panel.thickness, grip),
      length: panel.length,
    },
  ]
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

export function mergeGlued(panels: readonly Panel[]): Panel[] {
  const merged: Panel[] = []
  const seen = new Set<string>()

  for (const panel of panels) {
    if (!panel.glueGroup) {
      merged.push(panel)
      continue
    }
    if (seen.has(panel.glueGroup)) continue
    seen.add(panel.glueGroup)

    const members = panels.filter((candidate) => candidate.glueGroup === panel.glueGroup)
    const axis = panel.axes[2]
    const min = Math.min(...members.map((member) => member.position[axis] - member.size[axis] / 2))
    const thickness = members.reduce((sum, member) => sum + member.thickness, 0)
    const top = members.reduce((best, member) =>
      member.position[axis] > best.position[axis] ? member : best,
    )

    merged.push({
      ...top,
      id: panel.glueGroup,
      thickness,
      size: { ...top.size, [axis]: thickness },
      position: { ...top.position, [axis]: min + thickness / 2 },
    })
  }

  return merged
}

export function grainAxis(panel: Panel): GrainAxis | null {
  if (!panel.grain) return null
  return panel.grain === 'length' ? 'u' : 'v'
}

function idSeed(id: string): number {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 100_003
  return hash
}

export function textureOffset(panel: Panel): Point {
  const along = (axis: Axis) => panel.position[axis] - panel.size[axis] / 2
  const base: Point = [along(panel.axes[0]), along(panel.axes[1])]
  if (panel.continuousGrain) return base
  const seed = idSeed(panel.id)
  return [base[0] + (seed % 997), base[1] + (seed % 577)]
}

export function panelMeshes(config: Config, panels: readonly Panel[]): PanelMesh[] {
  const centre = cabinetCentre(config)
  return mergeGlued(panels).map((panel) => ({
    id: panel.id,
    drawer: panel.drawer,
    color: panelColor(panel),
    finish: findDecor(panel.decor)?.finish ?? 'plain',
    grainAxis: grainAxis(panel),
    textureOffset: textureOffset(panel),
    parts: panelParts(panel),
    matrix: panelMatrix(panel, centre),
  }))
}
