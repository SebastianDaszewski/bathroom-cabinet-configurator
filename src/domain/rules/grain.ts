import type { Rule } from './types'

export const applyContinuousGrain: Rule = (config) => {
  if (!config.continuousGrain || config.frontGrain === 'vertical') {
    return { config, adjustments: [] }
  }

  return {
    config: { ...config, continuousGrain: false },
    adjustments: [
      {
        rule: 'R14',
        field: 'continuousGrain',
        from: true,
        to: false,
        reason: 'Ciągłe usłojenie jest możliwe tylko przy pionowym usłojeniu frontów.',
      },
    ],
  }
}
