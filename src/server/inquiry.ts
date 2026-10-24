import { INQUIRY_EMAIL, InquiryPayloadSchema, inquiryMessage } from '../features/inquiry/inquiry.js'

const RESEND_URL = 'https://api.resend.com/emails'
const SENDER = 'Konfigurator szafki <onboarding@resend.dev>'
const MAX_REQUEST_LENGTH = 20_000

const reply = (status: number, body: Record<string, unknown>) => Response.json(body, { status })

export async function handleInquiry(
  request: Request,
  apiKey: string | undefined,
  send: typeof fetch = fetch,
): Promise<Response> {
  if (!apiKey) return reply(503, { error: 'not-configured' })

  const raw = await request.text()
  if (raw.length > MAX_REQUEST_LENGTH) return reply(413, { error: 'too-large' })

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return reply(400, { error: 'invalid-json' })
  }

  const parsed = InquiryPayloadSchema.safeParse(json)
  if (!parsed.success) return reply(400, { error: 'invalid' })
  if (parsed.data.website) return reply(200, { ok: true })

  const { subject, body } = inquiryMessage(parsed.data)
  try {
    const response = await send(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: SENDER,
        to: [INQUIRY_EMAIL],
        reply_to: parsed.data.inquiry.email,
        subject,
        text: body,
      }),
    })
    if (!response.ok) return reply(502, { error: 'send-failed' })
  } catch {
    return reply(502, { error: 'send-failed' })
  }

  return reply(200, { ok: true })
}
