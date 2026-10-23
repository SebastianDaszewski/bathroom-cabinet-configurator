import { createStore } from 'zustand/vanilla'
import { normalize, type Adjustment, type RuleResult } from '../domain/rules'
import { DEFAULT_CONFIG, type Config, type DrawerConfig, type DrawerId } from '../domain/schema'

export interface ConfiguratorState {
  config: Config
  adjustments: Adjustment[]
  update: (patch: Partial<Config>) => void
  updateDrawer: (id: DrawerId, patch: Partial<DrawerConfig>) => void
  dismissAdjustments: () => void
  reset: () => void
}

export function createConfiguratorStore(initial: RuleResult = normalize(DEFAULT_CONFIG)) {
  return createStore<ConfiguratorState>()((set, get) => ({
    config: initial.config,
    adjustments: initial.adjustments,
    update: (patch) => set(normalize({ ...get().config, ...patch })),
    updateDrawer: (id, patch) => {
      const { drawers } = get().config
      get().update({ drawers: { ...drawers, [id]: { ...drawers[id], ...patch } } })
    },
    dismissAdjustments: () => set({ adjustments: [] }),
    reset: () => set(normalize(DEFAULT_CONFIG)),
  }))
}

export type ConfiguratorStore = ReturnType<typeof createConfiguratorStore>
