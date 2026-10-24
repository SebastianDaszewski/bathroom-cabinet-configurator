import { useMemo } from 'react'
import { useStore } from 'zustand'
import { buildPanels } from '../domain/panels'
import { price } from '../domain/pricing'
import { loadInitialConfig, saveConfig, shareUrl } from './persistence'
import { createConfiguratorStore, type ConfiguratorState } from './store'

const URL_SYNC_DELAY = 300

function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

const configuratorStore = createConfiguratorStore(
  loadInitialConfig(window.location.search, browserStorage()),
)

let urlTimer: ReturnType<typeof setTimeout> | undefined

configuratorStore.subscribe((state, previous) => {
  if (state.config === previous.config) return
  saveConfig(state.config, browserStorage())
  clearTimeout(urlTimer)
  urlTimer = setTimeout(() => {
    window.history.replaceState(null, '', shareUrl(state.config, window.location))
  }, URL_SYNC_DELAY)
})

export function useConfigurator<T>(selector: (state: ConfiguratorState) => T): T {
  return useStore(configuratorStore, selector)
}

export function useDerived() {
  const config = useConfigurator((state) => state.config)
  return useMemo(() => {
    const panels = buildPanels(config)
    return { config, panels, price: price(config, panels) }
  }, [config])
}
