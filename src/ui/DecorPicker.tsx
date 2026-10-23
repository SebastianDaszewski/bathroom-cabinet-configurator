import { useId, type CSSProperties } from 'react'
import type { Decor } from '../domain/catalog'

interface DecorPickerProps {
  label: string
  value: string
  decors: readonly Decor[]
  onChange: (id: string) => void
}

export function DecorPicker({ label, value, decors, onChange }: DecorPickerProps) {
  const name = useId()
  const selected = decors.find((decor) => decor.id === value)

  return (
    <fieldset className="field">
      <legend className="field-label">
        {label}
        {selected && <span className="field-value">{selected.name}</span>}
      </legend>
      <div className="swatches">
        {decors.map((decor) => (
          <label
            key={decor.id}
            className="swatch"
            data-checked={decor.id === value}
            style={{ '--swatch': decor.color } as CSSProperties}
            title={`${decor.name} (${decor.code})`}
          >
            <input
              type="radio"
              name={name}
              value={decor.id}
              checked={decor.id === value}
              onChange={() => onChange(decor.id)}
            />
            <span className="swatch-board" aria-hidden="true" />
            <span className="swatch-name">{decor.name}</span>
            <span className="swatch-code">{decor.code}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
