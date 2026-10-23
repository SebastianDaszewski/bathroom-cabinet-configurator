import { useId, useState, type KeyboardEvent } from 'react'

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  hint?: string
  onChange: (value: number) => void
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'mm',
  hint,
  onChange,
}: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    const parsed = Number(draft.replace(',', '.'))
    if (draft.trim() !== '' && Number.isFinite(parsed) && parsed !== value) onChange(parsed)
    setDraft(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape') setDraft(null)
  }

  return (
    <div className="field">
      <div className="field-head">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        <span className="number-input">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={draft ?? String(value)}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            aria-describedby={hint ? `${id}-hint` : undefined}
          />
          <span className="number-unit">{unit}</span>
        </span>
      </div>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="slider-scale" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  )
}
