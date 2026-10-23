import { findDecor } from '../domain/catalog'
import { cabinetBounds, type Panel, type Vec3 } from '../domain/panels'
import { topLength } from '../domain/rules'
import type { Config } from '../domain/schema'

export type Vec3Tuple = [number, number, number]

export interface DimensionGuide {
  id: 'width' | 'height' | 'depth' | 'top'
  from: Vec3Tuple
  to: Vec3Tuple
  label: string
  labelPosition: Vec3Tuple
}

export const FALLBACK_COLOR = '#d6d3d1'
export const GUIDE_OFFSET = 60
export const CAMERA_FOV = 40
export const CAMERA_DIRECTION: Vec3Tuple = [1, 0.6, 1.4]
const CAMERA_PADDING = 1.25

export function toMetres(mm: number): number {
  return mm / 1000
}

export function cabinetCentre(config: Config): Vec3 {
  const { min, max } = cabinetBounds(config)
  return { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 }
}

export function toScene(point: Vec3, centre: Vec3): Vec3Tuple {
  return [toMetres(point.x - centre.x), toMetres(point.y - centre.y), toMetres(point.z - centre.z)]
}

export function panelColor(panel: Panel): string {
  return findDecor(panel.decor)?.color ?? FALLBACK_COLOR
}

export function dimensionGuides(config: Config): DimensionGuide[] {
  const { width, height, depth } = config
  const centre = cabinetCentre(config)
  const o = GUIDE_OFFSET
  const guide = (id: DimensionGuide['id'], from: Vec3, to: Vec3, value: number) => ({
    id,
    from: toScene(from, centre),
    to: toScene(to, centre),
    label: `${value} mm`,
    labelPosition: toScene(
      { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: (from.z + to.z) / 2 },
      centre,
    ),
  })

  const guides = [
    guide('width', { x: 0, y: -o, z: depth }, { x: width, y: -o, z: depth }, width),
    guide('height', { x: -o, y: 0, z: depth }, { x: -o, y: height, z: depth }, height),
    guide('depth', { x: width + o, y: -o, z: 0 }, { x: width + o, y: -o, z: depth }, depth),
  ]
  if (topLength(config) === width) return guides

  const { min, max } = cabinetBounds(config)
  return [
    ...guides,
    guide(
      'top',
      { x: min.x, y: max.y + o, z: max.z },
      { x: max.x, y: max.y + o, z: max.z },
      topLength(config),
    ),
  ]
}

export function ndcToScreen(
  ndc: { x: number; y: number; z: number },
  size: { width: number; height: number },
): { x: number; y: number; visible: boolean } {
  return {
    x: ((ndc.x + 1) / 2) * size.width,
    y: ((1 - ndc.y) / 2) * size.height,
    visible: ndc.z >= -1 && ndc.z <= 1,
  }
}

export function cabinetFloor(config: Config): number {
  return toMetres(cabinetBounds(config).min.y - cabinetCentre(config).y)
}

export function cabinetSpan(config: Config): number {
  const { min, max } = cabinetBounds(config)
  return toMetres(Math.max(max.x - min.x, max.z - min.z))
}

export function cameraDistance(config: Config, fov = CAMERA_FOV): number {
  const { min, max } = cabinetBounds(config)
  const radius =
    toMetres(Math.hypot(max.x - min.x, max.y - min.y, max.z - min.z) + 2 * GUIDE_OFFSET) / 2
  return (radius / Math.sin(((fov / 2) * Math.PI) / 180)) * CAMERA_PADDING
}

export function cameraPosition(distance: number): Vec3Tuple {
  const [x, y, z] = CAMERA_DIRECTION
  const length = Math.hypot(x, y, z)
  return [(x / length) * distance, (y / length) * distance, (z / length) * distance]
}
