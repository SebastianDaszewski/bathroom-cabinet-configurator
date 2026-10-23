import {
  BOARD_THICKNESS,
  DRAWER_BOTTOM_SHORTENING,
  SIPHON_FRONT_MARGIN,
  SIPHON_SIDE_MARGIN,
} from '../constants'
import { DRAWER_IDS, LIMITS, type Config } from '../schema'
import { clampToStep } from './dimensions'
import type { Rule } from './types'

export function maxSiphonCutWidth(width: number): number {
  return Math.min(LIMITS.siphonCutWidth.max, width - 2 * (BOARD_THICKNESS + SIPHON_SIDE_MARGIN))
}

export function maxSiphonCutDepth(config: Config): number {
  const depths = DRAWER_IDS.filter((id) => config.drawers[id].siphonCut).map(
    (id) => config.drawers[id].length - DRAWER_BOTTOM_SHORTENING - SIPHON_FRONT_MARGIN,
  )
  return Math.min(LIMITS.siphonCutDepth.max, ...depths)
}

export const applySiphonCutWidth: Rule = (config) => {
  const max = maxSiphonCutWidth(config.width)
  if (config.siphonCutWidth <= max) return { config, adjustments: [] }

  return {
    config: { ...config, siphonCutWidth: max },
    adjustments: [
      {
        rule: 'R8',
        field: 'siphonCutWidth',
        from: config.siphonCutWidth,
        to: max,
        reason: `Wycięcie musi zostawić min. ${SIPHON_SIDE_MARGIN} mm boku szuflady z każdej strony.`,
      },
    ],
  }
}

export const applySiphonCutDepth: Rule = (config) => {
  const max = maxSiphonCutDepth(config)
  if (config.siphonCutDepth <= max) return { config, adjustments: [] }

  return {
    config: { ...config, siphonCutDepth: max },
    adjustments: [
      {
        rule: 'R13',
        field: 'siphonCutDepth',
        from: config.siphonCutDepth,
        to: max,
        reason: `Przed wycięciem musi zostać min. ${SIPHON_FRONT_MARGIN} mm dna szuflady.`,
      },
    ],
  }
}

export function siphonXRange(config: Config): { min: number; max: number } {
  const margin = BOARD_THICKNESS + SIPHON_SIDE_MARGIN + config.siphonCutWidth / 2
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
        reason: `Środek wycięcia musi leżeć ${range.min}–${range.max} mm od lewego boku.`,
      },
    ],
  }
}
