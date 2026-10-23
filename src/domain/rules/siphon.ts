import { BOARD_THICKNESS, SIPHON_CUT_WIDTH, SIPHON_SIDE_MARGIN } from '../constants'
import type { Config } from '../schema'
import { clampToStep } from './dimensions'
import type { Rule } from './types'

export function siphonXRange(width: number): { min: number; max: number } {
  const margin = BOARD_THICKNESS + SIPHON_SIDE_MARGIN + SIPHON_CUT_WIDTH / 2
  return { min: margin, max: width - margin }
}

export function siphonCenter(config: Config): number {
  return config.siphonPosition === 'center' ? config.width / 2 : config.siphonX
}

export const applySiphonPosition: Rule = (config) => {
  if (config.siphonPosition === 'center') return { config, adjustments: [] }

  const range = siphonXRange(config.width)
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
        reason: `Środek wycięcia musi leżeć ${range.min}–${range.max} mm od lewego boku.`,
      },
    ],
  }
}
