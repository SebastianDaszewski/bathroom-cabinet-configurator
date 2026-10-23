import { FRONT_GAP } from '../constants'
import type { Config, DrawerId } from '../schema'

export function frontHeights(config: Config): Record<DrawerId, number> {
  const available = config.height - FRONT_GAP
  const bottom = Math.floor(available / 2)
  const top = available - bottom
  const handle = config.frontType === 'edge-handle' ? config.edgeHandleThickness : 0
  return { top: top - handle, bottom: bottom - handle }
}
