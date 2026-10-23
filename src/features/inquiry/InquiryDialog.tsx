import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { inquiryMailto, validateInquiry, type Inquiry, type InquiryErrors } from './inquiry'
import type { SummaryGroup } from '../summary/summary'

interface InquiryDialogProps {
  open: boolean
  title: string
  groups: readonly SummaryGroup[]
  price: string
  link: string
  onClose: () => void
}

const EMPTY: Inquiry = { name: '', email: '', phone: '', message: '' }

const FIELDS: readonly { key: keyof Inquiry; label: string; type: string; autoComplete: string }[] =
  [
    { key: 'name', label: 'Imię i nazwisko', type: 'text', autoComplete: 'name' },
    { key: 'email', label: 'Adres e-mail', type: 'email', autoComplete: 'email' },
    { key: 'phone', label: 'Telefon (opcjonalnie)', type: 'tel', autoComplete: 'tel' },
  ]

export function InquiryDialog({ open, title, groups, price, link, onClose }: InquiryDialogProps) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<Inquiry>(EMPTY)
  const [errors, setErrors] = useState<InquiryErrors>({})

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  const change = (key: keyof Inquiry, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = validateInquiry(form)
    if ('errors' in result) {
      setErrors(result.errors)
      return
    }
    window.location.href = inquiryMailto({ inquiry: result.inquiry, title, groups, price, link })
    onClose()
  }

  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form className="dialog-body" noValidate onSubmit={submit}>
        <h2 id={`${id}-title`} className="dialog-title">
          Wyślij zapytanie
        </h2>
        <p className="dialog-message">
          Otworzymy Twój program pocztowy z gotową wiadomością: konfiguracją, ceną i linkiem do
          projektu. Wystarczy ją wysłać.
        </p>
        {FIELDS.map((field) => (
          <div className="form-field" key={field.key}>
            <label htmlFor={`${id}-${field.key}`}>{field.label}</label>
            <input
              id={`${id}-${field.key}`}
              type={field.type}
              autoComplete={field.autoComplete}
              value={form[field.key]}
              aria-invalid={Boolean(errors[field.key])}
              aria-describedby={errors[field.key] ? `${id}-${field.key}-error` : undefined}
              onChange={(event) => change(field.key, event.target.value)}
            />
            {errors[field.key] && (
              <p className="form-error" id={`${id}-${field.key}-error`}>
                {errors[field.key]}
              </p>
            )}
          </div>
        ))}
        <div className="form-field">
          <label htmlFor={`${id}-message`}>Wiadomość (opcjonalnie)</label>
          <textarea
            id={`${id}-message`}
            rows={3}
            value={form.message}
            aria-invalid={Boolean(errors.message)}
            onChange={(event) => change('message', event.target.value)}
          />
          {errors.message && <p className="form-error">{errors.message}</p>}
        </div>
        <div className="dialog-actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className="button-primary">
            Przygotuj wiadomość
          </button>
        </div>
      </form>
    </dialog>
  )
}
