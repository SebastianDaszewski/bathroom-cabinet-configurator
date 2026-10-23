import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../../domain/schema'
import { summaryGroups } from '../summary/summary'
import { INQUIRY_EMAIL, inquiryMailto, validateInquiry, type Inquiry } from './inquiry'

const valid: Inquiry = {
  name: 'Anna Nowak',
  email: 'anna@example.com',
  phone: '+48 600 100 200',
  message: 'Proszę o termin realizacji.',
}

describe('validateInquiry', () => {
  it('accepts a complete inquiry', () => {
    expect(validateInquiry(valid)).toEqual({ inquiry: valid })
  })

  it('accepts an empty phone and message', () => {
    expect(validateInquiry({ ...valid, phone: '', message: '' })).toHaveProperty('inquiry')
  })

  it('reports each invalid field once, in Polish', () => {
    expect(validateInquiry({ name: 'A', email: 'nie-email', phone: 'abc', message: '' })).toEqual({
      errors: {
        name: 'Podaj imię i nazwisko.',
        email: 'Podaj poprawny adres e-mail.',
        phone: 'Podaj numer telefonu albo zostaw pole puste.',
      },
    })
  })
})

describe('inquiryMailto', () => {
  const mailto = inquiryMailto({
    inquiry: valid,
    title: 'szafka 600 × 500 × 500 mm',
    groups: summaryGroups(DEFAULT_CONFIG),
    price: '1233,12 zł',
    link: 'https://example.test/?width=600',
  })
  const url = new URL(mailto)
  const body = url.searchParams.get('body') ?? ''

  it('is addressed to the shop', () => {
    expect(url.protocol).toBe('mailto:')
    expect(url.pathname).toBe(INQUIRY_EMAIL)
  })

  it('names the cabinet in the subject', () => {
    expect(url.searchParams.get('subject')).toBe('Zapytanie: szafka 600 × 500 × 500 mm')
  })

  it('carries the contact details, the configuration, the price and the link', () => {
    expect(body).toContain('Imię i nazwisko: Anna Nowak')
    expect(body).toContain('Telefon: +48 600 100 200')
    expect(body).toContain('Proszę o termin realizacji.')
    expect(body).toContain('  Korpus: 600 × 500 × 500 mm')
    expect(body).toContain('Cena: 1233,12 zł')
    expect(body).toContain('Projekt: https://example.test/?width=600')
  })

  it('leaves out an empty phone number', () => {
    const withoutPhone = inquiryMailto({
      inquiry: { ...valid, phone: '' },
      title: 't',
      groups: [],
      price: '1 zł',
      link: 'https://example.test/',
    })
    expect(decodeURIComponent(withoutPhone)).not.toContain('Telefon:')
  })
})
