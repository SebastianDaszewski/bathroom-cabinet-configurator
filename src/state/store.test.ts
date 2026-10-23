import { describe, expect, it } from 'vitest'
import { normalize } from '../domain/rules'
import { DEFAULT_CONFIG } from '../domain/schema'
import { createConfiguratorStore } from './store'

describe('configurator store', () => {
  it('starts from the normalized default config', () => {
    const store = createConfiguratorStore()
    expect(store.getState().config).toEqual(DEFAULT_CONFIG)
    expect(store.getState().adjustments).toEqual([])
  })

  it('normalizes every update and records its adjustments', () => {
    const store = createConfiguratorStore()
    store.getState().update({ depth: 450 })

    const { config, adjustments } = store.getState()
    expect(config.depth).toBe(450)
    expect(config.drawers.top.length).toBe(400)
    expect(adjustments.map((adjustment) => adjustment.field)).toEqual([
      'drawers.top.length',
      'drawers.bottom.length',
    ])
  })

  it('replaces the adjustments with those of the latest change', () => {
    const store = createConfiguratorStore()
    store.getState().update({ depth: 450 })
    store.getState().update({ frontDecor: 'walnut-h3734' })
    expect(store.getState().adjustments).toEqual([])
  })

  it('updates a single drawer', () => {
    const store = createConfiguratorStore()
    store.getState().updateDrawer('bottom', { siphonCut: true })

    expect(store.getState().config.drawers.bottom).toEqual({ length: 450, siphonCut: true })
    expect(store.getState().config.drawers.top).toEqual(DEFAULT_CONFIG.drawers.top)
  })

  it('clamps invalid drawer lengths through the rules', () => {
    const store = createConfiguratorStore(normalize({ ...DEFAULT_CONFIG, depth: 400 }))
    store.getState().updateDrawer('top', { length: 450 })
    expect(store.getState().config.drawers.top.length).toBe(350)
  })

  it('dismisses adjustments without touching the config', () => {
    const store = createConfiguratorStore()
    store.getState().update({ width: 5000 })
    const { config } = store.getState()
    store.getState().dismissAdjustments()

    expect(store.getState().adjustments).toEqual([])
    expect(store.getState().config).toBe(config)
  })

  it('resets to the default config', () => {
    const store = createConfiguratorStore()
    store.getState().update({ width: 900, frontType: 'edge-handle' })
    store.getState().reset()
    expect(store.getState().config).toEqual(DEFAULT_CONFIG)
  })

  it('accepts an initial result, e.g. from a shared link', () => {
    const store = createConfiguratorStore(normalize({ ...DEFAULT_CONFIG, width: 2000 }))
    expect(store.getState().config.width).toBe(1200)
    expect(store.getState().adjustments).toHaveLength(1)
  })
})
