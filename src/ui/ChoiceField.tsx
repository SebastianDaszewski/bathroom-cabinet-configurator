import { useId } from 'react'

export interface Choice<T extends string | number> {
  value: T
  label: string
  disabled?: boolean
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

  return (
    <fieldset className="field">
      <legend className="field-label">{label}</legend>
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
          </label>
        ))}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </fieldset>
  )
}
