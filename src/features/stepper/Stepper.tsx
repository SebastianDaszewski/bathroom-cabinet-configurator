import { useId, useState, type ComponentType, type KeyboardEvent } from 'react'
import { DimensionsStep } from './DimensionsStep'
import { DrawersStep } from './DrawersStep'
import { FrontsStep } from './FrontsStep'
import { MaterialsStep } from './MaterialsStep'
import { SummaryStep } from './SummaryStep'

interface Step {
  title: string
  Component: ComponentType
}

const STEPS: readonly Step[] = [
  { title: 'Wymiary', Component: DimensionsStep },
  { title: 'Materiały i kolory', Component: MaterialsStep },
  { title: 'Szuflady', Component: DrawersStep },
  { title: 'Fronty i uchwyty', Component: FrontsStep },
  { title: 'Podsumowanie', Component: SummaryStep },
]

const KEY_STEPS: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
}

export function Stepper() {
  const id = useId()
  const [active, setActive] = useState(0)
  const step = STEPS[active]
  const next = STEPS[active + 1]
  const previous = STEPS[active - 1]

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const delta = KEY_STEPS[event.key]
    if (!delta) return
    event.preventDefault()
    const target = (active + delta + STEPS.length) % STEPS.length
    setActive(target)
    document.getElementById(`${id}-tab-${target}`)?.focus()
  }

  return (
    <section className="stepper" aria-label="Kroki konfiguracji">
      <div className="stepper-tabs" role="tablist" aria-orientation="vertical">
        {STEPS.map((candidate, index) => (
          <button
            key={candidate.title}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            className="stepper-tab"
            aria-selected={index === active}
            aria-controls={`${id}-panel`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={onTabKeyDown}
          >
            <span className="stepper-number">{index + 1}</span>
            <span>{candidate.title}</span>
          </button>
        ))}
      </div>

      <div
        className="stepper-panel"
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
      >
        <h2 className="stepper-title">{step.title}</h2>
        <step.Component />
        <div className="stepper-nav">
          {previous && (
            <button type="button" className="button-quiet" onClick={() => setActive(active - 1)}>
              Wstecz
            </button>
          )}
          {next && (
            <button type="button" className="button-primary" onClick={() => setActive(active + 1)}>
              Dalej: {next.title.toLowerCase()}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
