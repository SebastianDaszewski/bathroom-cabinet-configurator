import { lazy, Suspense } from 'react'
import { buildPanels } from './domain/panels'
import { normalize } from './domain/rules'
import { DEFAULT_CONFIG } from './domain/schema'

const CabinetScene = lazy(() => import('./scene/CabinetScene'))

const { config } = normalize(DEFAULT_CONFIG)
const panels = buildPanels(config)

export default function App() {
  return (
    <main className="app">
      <Suspense fallback={<div className="scene-loading">Loading 3D view…</div>}>
        <CabinetScene config={config} panels={panels} />
      </Suspense>
    </main>
  )
}
