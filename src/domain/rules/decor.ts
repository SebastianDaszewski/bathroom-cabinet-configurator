import { DECORS, DRAWER_BOARD, findDecor, type Decor } from '../catalog'
import type { BoardType, Config } from '../schema'
import type { Adjustment, Rule } from './types'

/** R9: decors available on the given board type, in catalogue order. */
export function compatibleDecors(board: BoardType): Decor[] {
  return DECORS.filter((decor) => decor.boards.includes(board))
}

type DecorField = 'carcassDecor' | 'frontDecor' | 'drawerDecor'

const DECOR_FIELDS: readonly DecorField[] = ['carcassDecor', 'frontDecor', 'drawerDecor']

function boardFor(config: Config, field: DecorField): BoardType {
  if (field === 'carcassDecor') return config.carcassBoard
  if (field === 'frontDecor') return config.frontBoard
  return DRAWER_BOARD
}

/** R9: an unknown or incompatible decor is reset to the first one compatible with its board. */
export const applyDecorCompatibility: Rule = (input) => {
  const config = { ...input }
  const adjustments: Adjustment[] = []

  for (const field of DECOR_FIELDS) {
    const board = boardFor(input, field)
    const decor = findDecor(input[field])
    if (decor?.boards.includes(board)) continue

    // Every board type has at least one decor (enforced by a catalogue test).
    const fallback = compatibleDecors(board)[0]
    config[field] = fallback.id
    adjustments.push({
      rule: 'R9',
      field,
      from: input[field],
      to: fallback.id,
      reason: decor
        ? `${decor.name} is not available on ${board}.`
        : `Unknown decor "${input[field]}".`,
    })
  }

  return { config, adjustments }
}
