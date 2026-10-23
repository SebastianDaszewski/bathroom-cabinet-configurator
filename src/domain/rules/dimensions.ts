import { DEFAULT_CONFIG, LIMITS, type LimitedField } from '../schema'
import type { Adjustment, Rule } from './types'

export function clampToStep(
  value: number,
  { min, max, step }: { min: number; max: number; step: number },
  fallback: number,
): number {
  if (!Number.isFinite(value)) return fallback
  const stepped = Math.round(value / step) * step
  return Math.min(max, Math.max(min, stepped))
}

const LIMITED_FIELDS = Object.keys(LIMITS) as LimitedField[]

export const clampDimensions: Rule = (input) => {
  const config = { ...input }
  const adjustments: Adjustment[] = []

  for (const field of LIMITED_FIELDS) {
    const limits = LIMITS[field]
    const value = clampToStep(input[field], limits, DEFAULT_CONFIG[field])
    if (value === input[field]) continue

    config[field] = value
    adjustments.push({
      rule: 'R1',
      field,
      from: input[field],
      to: value,
      reason:
        `Dozwolony zakres: ${limits.min}–${limits.max} mm` +
        (limits.step > 1 ? `, co ${limits.step} mm.` : '.'),
    })
  }

  return { config, adjustments }
}
