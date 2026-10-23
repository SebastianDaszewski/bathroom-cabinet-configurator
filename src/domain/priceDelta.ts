import { buildPanels } from './panels'
import { price } from './pricing'
import { normalize } from './rules'
import type { Config } from './schema'

export function totalPrice(config: Config): number {
  const normalized = normalize(config).config
  return price(normalized, buildPanels(normalized)).total
}

export function priceDelta(config: Config, patch: Partial<Config>): number {
  return totalPrice({ ...config, ...patch }) - totalPrice(config)
}
