import type { Config } from '../schema'
import { applyDecorCompatibility } from './decor'
import { clampDimensions } from './dimensions'
import { applyDrawerLengths } from './drawerLength'
import { applyDoubleHandleWidth, applyHandleCompatibility, applyHandleSpacing } from './handles'
import { applySiphonCutDepth, applySiphonCutWidth, applySiphonPosition } from './siphon'
import { applyTopLength } from './top'
import type { Rule, RuleResult } from './types'

const RULES: readonly Rule[] = [
  applyDecorCompatibility,
  clampDimensions,
  applyDrawerLengths,
  applyHandleCompatibility,
  applyDoubleHandleWidth,
  applyHandleSpacing,
  applySiphonCutWidth,
  applySiphonCutDepth,
  applySiphonPosition,
  applyTopLength,
]

export function normalize(config: Config): RuleResult {
  return RULES.reduce<RuleResult>(
    (acc, rule) => {
      const result = rule(acc.config)
      return { config: result.config, adjustments: [...acc.adjustments, ...result.adjustments] }
    },
    { config, adjustments: [] },
  )
}

export { compatibleDecors } from './decor'
export { maxTopExtension, topLength } from './top'
export { allowedDrawerLengths } from './drawerLength'
export { frontHeights } from './fronts'
export {
  allowedHandleDrillings,
  allowedHandleSpacings,
  handleDrillingBlocker,
  maxHandleSpacing,
} from './handles'
export { maxSiphonCutDepth, maxSiphonCutWidth, siphonCenter, siphonXRange } from './siphon'
export type { Adjustment, RuleId, RuleResult } from './types'
