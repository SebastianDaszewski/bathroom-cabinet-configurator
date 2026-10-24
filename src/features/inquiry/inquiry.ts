import { z } from 'zod'

export const INQUIRY_EMAIL = 's.daszewski@gmail.com'

const INQUIRY_ENDPOINT = '/api/inquiry'

const InquirySchema = z.object({
  name: z.string().trim().min(2, 'Podaj imię i nazwisko.').max(100),
  email: z.email('Podaj poprawny adres e-mail.'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[\d\s-]{7,})?$/, 'Podaj numer telefonu albo zostaw pole puste.')
    .max(30),
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

const text = (max: number) => z.string().max(max)

export const InquiryPayloadSchema = z.object({
  inquiry: InquirySchema,
  title: text(200),
  groups: z
    .array(
      z.object({
        title: text(100),
        rows: z.array(z.object({ label: text(100), value: text(300) })).max(40),
      }),
    )
    .max(20),
  price: text(50),
  link: z.url().max(2000),
  website: text(200).optional(),
})

type InquiryPayload = z.infer<typeof InquiryPayloadSchema>

type InquiryGroup = InquiryPayload['groups'][number]

type InquiryContent = Omit<InquiryPayload, 'website' | 'groups'> & {
  groups: readonly Readonly<InquiryGroup>[]
}

export function inquiryMessage({ inquiry, title, groups, price, link }: InquiryContent): {
  subject: string
  body: string
} {
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

  return { subject: `Zapytanie: ${title}`, body }
}

export function inquiryMailto(content: InquiryContent): string {
  const { subject, body } = inquiryMessage(content)
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function sendInquiry(
  payload: InquiryContent & { website: string },
  post: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await post(INQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch {
    return false
  }
}
