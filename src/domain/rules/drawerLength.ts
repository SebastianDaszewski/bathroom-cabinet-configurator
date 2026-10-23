import { DRAWER_DEPTH_CLEARANCE } from '../constants'
import { DRAWER_IDS, DRAWER_LENGTHS, type DrawerLength } from '../schema'
import type { Adjustment, Rule } from './types'

/** R2: drawer lengths that fit into a cabinet of the given depth. */
export function allowedDrawerLengths(depth: number): DrawerLength[] {
  return DRAWER_LENGTHS.filter((length) => length <= depth - DRAWER_DEPTH_CLEARANCE)
}

/** R3: a drawer that no longer fits falls back to the largest allowed length. */
export const applyDrawerLengths: Rule = (input) => {
  const allowed = allowedDrawerLengths(input.depth)
  // R1 guarantees depth >= 390, so at least 350 is always allowed.
  const fallback = allowed.at(-1) ?? DRAWER_LENGTHS[0]
  const drawers = { ...input.drawers }
  const adjustments: Adjustment[] = []

  for (const id of DRAWER_IDS) {
    const { length } = drawers[id]
    if (allowed.includes(length)) continue

    drawers[id] = { ...drawers[id], length: fallback }
    adjustments.push({
      rule: 'R3',
      field: `drawers.${id}.length`,
      from: length,
      to: fallback,
      reason: `A ${length} mm drawer needs a cabinet at least ${length + DRAWER_DEPTH_CLEARANCE} mm deep.`,
    })
  }

  return { config: { ...input, drawers }, adjustments }
}
