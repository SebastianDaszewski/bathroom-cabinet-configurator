import { MAX_BOARD_LENGTH } from '../constants'
import { LIMITS, type Config } from '../schema'
import type { Adjustment, Rule } from './types'

type SideExtension = 'topExtensionLeft' | 'topExtensionRight'

const TRIM_ORDER: readonly SideExtension[] = ['topExtensionRight', 'topExtensionLeft']

export function topLength(config: Config): number {
  return config.width + config.topExtensionLeft + config.topExtensionRight
}

export function maxTopExtension(config: Config, side: SideExtension): number {
  const other = side === 'topExtensionLeft' ? config.topExtensionRight : config.topExtensionLeft
  return Math.max(0, Math.min(LIMITS[side].max, MAX_BOARD_LENGTH - config.width - other))
}

export const applyTopLength: Rule = (input) => {
  let excess = topLength(input) - MAX_BOARD_LENGTH
  if (excess <= 0) return { config: input, adjustments: [] }

  const config = { ...input }
  const adjustments: Adjustment[] = []
  for (const side of TRIM_ORDER) {
    const trim = Math.min(excess, config[side])
    if (trim === 0) continue
    config[side] -= trim
    excess -= trim
    adjustments.push({
      rule: 'R12',
      field: side,
      from: input[side],
      to: config[side],
      reason: `Blat może mieć najwyżej ${MAX_BOARD_LENGTH} mm długości, tyle ile arkusz płyty.`,
    })
  }

  return { config, adjustments }
}
