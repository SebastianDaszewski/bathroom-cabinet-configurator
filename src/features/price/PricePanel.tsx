import { useEffect, useState } from 'react'
import { PRICE_CATEGORIES, subtotals, type Price } from '../../domain/pricing'
import { shareUrl } from '../../state/persistence'
import { useConfigurator, useDerived } from '../../state/useConfigurator'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { formatPln, formatQuantity } from '../../ui/format'
import { describeAdjustment, PRICE_CATEGORY_LABELS } from '../labels'

const COPIED_TIMEOUT = 2000

function Breakdown({ price }: { price: Price }) {
  const totals = subtotals(price.lines)

  return (
    <details className="breakdown">
      <summary>Z czego składa się cena</summary>
      {PRICE_CATEGORIES.filter((category) => totals[category] > 0).map((category) => {
        const label = PRICE_CATEGORY_LABELS[category]
        const lines = price.lines.filter((line) => line.category === category)
        const [only] = lines
        const merged = lines.length === 1 && only.label === label
        return (
          <div className="breakdown-group" key={category}>
            <div className="breakdown-row breakdown-category">
              <span>
                {label}
                {merged && (
                  <span className="breakdown-quantity">
                    {formatQuantity(only.quantity, only.unit)}
                  </span>
                )}
              </span>
              <span>{formatPln(totals[category])}</span>
            </div>
            {!merged &&
              lines.map((line) => (
                <div className="breakdown-row breakdown-line" key={line.label}>
                  <span>
                    {line.label}
                    <span className="breakdown-quantity">
                      {formatQuantity(line.quantity, line.unit)}
                    </span>
                  </span>
                  <span>{formatPln(line.amount)}</span>
                </div>
              ))}
          </div>
        )
      })}
    </details>
  )
}

function Adjustments() {
  const adjustments = useConfigurator((state) => state.adjustments)
  const dismiss = useConfigurator((state) => state.dismissAdjustments)
  if (adjustments.length === 0) return null

  return (
    <section className="notice" aria-live="polite">
      <div className="notice-head">
        <h3>Dopasowaliśmy projekt</h3>
        <button type="button" className="notice-close" aria-label="Zamknij" onClick={dismiss}>
          ×
        </button>
      </div>
      <ul>
        {adjustments.map((adjustment) => {
          const { title, reason } = describeAdjustment(adjustment)
          return (
            <li key={`${adjustment.rule}-${adjustment.field}`}>
              <strong>{title}</strong>
              <span>{reason}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function CopyLinkButton() {
  const config = useConfigurator((state) => state.config)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_TIMEOUT)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(config, window.location))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button type="button" className="button-secondary" onClick={copy}>
      <span aria-live="polite">{copied ? 'Link skopiowany' : 'Kopiuj link do projektu'}</span>
    </button>
  )
}

function ResetButton() {
  const reset = useConfigurator((state) => state.reset)
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <button type="button" className="button-quiet" onClick={() => setConfirming(true)}>
        Zacznij od nowa
      </button>
      <ConfirmDialog
        open={confirming}
        title="Zacząć od nowa?"
        message="Wszystkie ustawienia szafki wrócą do wartości domyślnych. Jeśli chcesz zachować obecny projekt, najpierw skopiuj link."
        confirmLabel="Zacznij od nowa"
        onConfirm={() => {
          reset()
          setConfirming(false)
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}

export function PricePanel() {
  const { price } = useDerived()

  return (
    <aside className="price-panel" aria-label="Cena">
      <div className="price-total">
        <span className="price-caption">Cena szafki z montażem</span>
        <output className="price-amount">{formatPln(price.total)}</output>
        <span className="price-note">brutto, z VAT</span>
      </div>
      <Adjustments />
      <Breakdown price={price} />
      <div className="price-actions">
        <CopyLinkButton />
        <ResetButton />
      </div>
    </aside>
  )
}
