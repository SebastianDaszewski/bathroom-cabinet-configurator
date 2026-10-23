import type { Config } from '../schema'

export type RuleId = 'R1' | 'R3' | 'R4' | 'R6' | 'R7' | 'R8' | 'R9'

/** A change normalize() made to the user's configuration, shown in the UI. */
export interface Adjustment {
  rule: RuleId
  /** Dot path of the changed field, e.g. `drawers.top.length`. */
  field: string
  from: string | number | boolean
  to: string | number | boolean
  reason: string
}

export interface RuleResult {
  config: Config
  adjustments: Adjustment[]
}

/** A rule takes any schema-valid config and returns one that satisfies it. */
export type Rule = (config: Config) => RuleResult
