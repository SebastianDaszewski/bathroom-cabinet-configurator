import { BOARD_THICKNESS, SIPHON_SIDE_MARGIN } from '../constants'
import { LIMITS } from '../schema'
import type { Rule } from './types'

export function maxSiphonOffset(width: number): number {
  return Math.min(LIMITS.siphonOffset.max, width - 2 * BOARD_THICKNESS - 2 * SIPHON_SIDE_MARGIN)
}

export const applySiphonCut: Rule = (config) => {
  const max = maxSiphonOffset(config.width)
  if (config.siphonOffset <= max) return { config, adjustments: [] }

  return {
    config: { ...config, siphonOffset: max },
    adjustments: [
      {
        rule: 'R8',
        field: 'siphonOffset',
        from: config.siphonOffset,
        to: max,
        reason: `The cut-out must leave ${SIPHON_SIDE_MARGIN} mm of drawer side on each side.`,
      },
    ],
  }
}
