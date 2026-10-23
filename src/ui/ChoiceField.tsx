import { useId, useState } from 'react'

export interface Choice<T extends string | number> {
  value: T
  label: string
  disabled?: boolean
  note?: string
  description?: string
}

interface ChoiceFieldProps<T extends string | number> {
  label: string
  value: T
  options: readonly Choice<T>[]
  hint?: string | null
  onChange: (value: T) => void
}

export function ChoiceField<T extends string | number>({
  label,
  value,
  options,
  hint,
  onChange,
}: ChoiceFieldProps<T>) {
  const name = useId()
  const [infoOpen, setInfoOpen] = useState(false)
  const described = options.filter((option) => option.description)

  return (
    <fieldset className="field">
      <legend className="field-label">
        {label}
        {described.length > 0 && (
          <button
            type="button"
            className="info-toggle"
            aria-expanded={infoOpen}
            aria-controls={`${name}-info`}
            aria-label={`Co oznaczają opcje: ${label}`}
            onClick={() => setInfoOpen((open) => !open)}
          >
            ?
          </button>
        )}
      </legend>
      {infoOpen && (
        <dl className="field-info" id={`${name}-info`}>
          {described.map((option) => (
            <div key={option.value}>
              <dt>{option.label}</dt>
              <dd>{option.description}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="segments">
        {options.map((option) => (
          <label
            key={option.value}
            className="segment"
            data-checked={option.value === value}
            data-disabled={option.disabled}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
            {option.note && <span className="segment-note">{option.note}</span>}
          </label>
        ))}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </fieldset>
  )
}
