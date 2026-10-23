interface ToggleProps {
  label: string
  checked: boolean
  hint?: string
  onChange: (checked: boolean) => void
}

export function Toggle({ label, checked, hint, onChange }: ToggleProps) {
  return (
    <div className="field">
      <label className="toggle">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="toggle-track" aria-hidden="true" />
        <span className="toggle-label">{label}</span>
      </label>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
