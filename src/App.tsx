import { lazy, Suspense } from 'react'
import { PricePanel } from './features/price/PricePanel'
import { Stepper } from './features/stepper/Stepper'
import { useDerived } from './state/useConfigurator'

const CabinetScene = lazy(() => import('./scene/CabinetScene'))

export default function App() {
  const { config, panels } = useDerived()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Szafka pod umywalkę na wymiar</h1>
        <p>
          {config.width} × {config.height} × {config.depth} mm, dwie szuflady
        </p>
      </header>
      <Stepper />
      <main className="app-scene">
        <Suspense fallback={<div className="scene-loading">Wczytywanie podglądu 3D…</div>}>
          <CabinetScene config={config} panels={panels} />
        </Suspense>
      </main>
      <PricePanel />
    </div>
  )
}
