import { BOARD_THICKNESS, SIPHON_SIDE_MARGIN } from '../constants'
import { LIMITS } from '../schema'
import type { Rule } from './types'

/**
 * R8: widest siphon cut-out that leaves enough drawer side on both sides.
 * With the current ranges (width >= 500, offset <= 236) the limit never bites;
 * the rule guards against future range changes.
 */
export function maxSiphonOffset(width: number): number {
  return Math.min(LIMITS.siphonOffset.max, width - 2 * BOARD_THICKNESS - 2 * SIPHON_SIDE_MARGIN)
}

/** R8: a siphon cut-out that is too wide is narrowed to the limit. */
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
