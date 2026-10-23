import { BOARD_THICKNESS, SIPHON_SIDE_MARGIN } from '../constants'
import { LIMITS, type Config } from '../schema'
import { clampToStep } from './dimensions'
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

export function siphonXRange(config: Config): { min: number; max: number } {
  const margin = BOARD_THICKNESS + SIPHON_SIDE_MARGIN + config.siphonOffset / 2
  return { min: Math.ceil(margin), max: Math.floor(config.width - margin) }
}

export function siphonCenter(config: Config): number {
  return config.siphonPosition === 'center' ? config.width / 2 : config.siphonX
}

export const applySiphonPosition: Rule = (config) => {
  if (config.siphonPosition === 'center') return { config, adjustments: [] }

  const range = siphonXRange(config)
  const siphonX = clampToStep(config.siphonX, { ...range, step: 1 }, config.width / 2)
  if (siphonX === config.siphonX) return { config, adjustments: [] }

  return {
    config: { ...config, siphonX },
    adjustments: [
      {
        rule: 'R11',
        field: 'siphonX',
        from: config.siphonX,
        to: siphonX,
        reason: `The cut-out centre must be between ${range.min} and ${range.max} mm from the left side.`,
      },
    ],
  }
}
