import { z } from 'zod'
import type { SummaryGroup } from '../summary/summary'

export const INQUIRY_EMAIL = 's.daszewski@gmail.com'

const InquirySchema = z.object({
  name: z.string().trim().min(2, 'Podaj imię i nazwisko.'),
  email: z.email('Podaj poprawny adres e-mail.'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[\d\s-]{7,})?$/, 'Podaj numer telefonu albo zostaw pole puste.'),
  message: z.string().trim().max(1000, 'Wiadomość może mieć najwyżej 1000 znaków.'),
})

export type Inquiry = z.infer<typeof InquirySchema>

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>

export function validateInquiry(input: Inquiry): { inquiry: Inquiry } | { errors: InquiryErrors } {
  const result = InquirySchema.safeParse(input)
  if (result.success) return { inquiry: result.data }

  const errors: InquiryErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof Inquiry
    errors[field] ??= issue.message
  }
  return { errors }
}

interface InquiryContent {
  inquiry: Inquiry
  title: string
  groups: readonly SummaryGroup[]
  price: string
  link: string
}

export function inquiryMailto({ inquiry, title, groups, price, link }: InquiryContent): string {
  const configuration = groups.flatMap((group) => [
    `${group.title}:`,
    ...group.rows.map((row) => `  ${row.label}: ${row.value}`),
  ])
  const body = [
    `Imię i nazwisko: ${inquiry.name}`,
    `E-mail: ${inquiry.email}`,
    ...(inquiry.phone ? [`Telefon: ${inquiry.phone}`] : []),
    ...(inquiry.message ? ['', inquiry.message] : []),
    '',
    ...configuration,
    '',
    `Cena: ${price}`,
    `Projekt: ${link}`,
  ].join('\n')

  const subject = `Zapytanie: ${title}`
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
