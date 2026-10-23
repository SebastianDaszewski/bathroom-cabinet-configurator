import { FRONT_GAP } from '../constants'
import type { Config, DrawerId } from '../schema'

/**
 * R10 + R5: drawer front heights. The two fronts split the height minus the
 * inner gap; an odd remainder goes to the top front so both stay whole mm.
 * Edge-handle fronts are shorter by the handle profile thickness.
 */
export function frontHeights(config: Config): Record<DrawerId, number> {
  const available = config.height - FRONT_GAP
  const bottom = Math.floor(available / 2)
  const top = available - bottom
  const handle = config.frontType === 'edge-handle' ? config.edgeHandleThickness : 0
  return { top: top - handle, bottom: bottom - handle }
}
