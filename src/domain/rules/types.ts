import type { Config } from '../schema'

export type RuleId = 'R1' | 'R3' | 'R4' | 'R6' | 'R7' | 'R8' | 'R9' | 'R11' | 'R12' | 'R13' | 'R14'

export interface Adjustment {
  rule: RuleId
  field: string
  from: string | number | boolean
  to: string | number | boolean
  reason: string
}

export interface RuleResult {
  config: Config
  adjustments: Adjustment[]
}

export type Rule = (config: Config) => RuleResult
