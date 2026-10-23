import { priceDelta } from '../domain/priceDelta'
import type { Config } from '../domain/schema'
import { formatPriceChange } from '../ui/format'

export function priceNote(config: Config, patch: Partial<Config>): string | undefined {
  const isCurrent = Object.entries(patch).every(
    ([key, value]) => JSON.stringify(config[key as keyof Config]) === JSON.stringify(value),
  )
  if (isCurrent) return undefined
  return formatPriceChange(priceDelta(config, patch))
}
