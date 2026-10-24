import { describe, expect, it, vi } from 'vitest'
import { handleInquiry } from './inquiry'

const payload = {
  inquiry: { name: 'Anna Nowak', email: 'anna@example.com', phone: '', message: 'Termin?' },
  title: 'szafka 600 × 500 × 500 mm',
  groups: [{ title: 'Wymiary', rows: [{ label: 'Korpus', value: '600 × 500 × 500 mm' }] }],
  price: '1233,12 zł',
  link: 'https://example.test/?width=600',
  website: '',
}

const request = (body: unknown) =>
  new Request('https://example.test/api/inquiry', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const resend = (status = 200) => vi.fn<typeof fetch>(async () => new Response('{}', { status }))

describe('handleInquiry', () => {
  it('sends the inquiry to the shop through Resend', async () => {
    const send = resend()
    const response = await handleInquiry(request(payload), 'key', send)

    expect(response.status).toBe(200)
    const [url, init] = send.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer key' })
    const email = JSON.parse(String(init?.body))
    expect(email).toMatchObject({
      to: ['s.daszewski@gmail.com'],
      reply_to: 'anna@example.com',
      subject: 'Zapytanie: szafka 600 × 500 × 500 mm',
    })
    expect(email.text).toContain('  Korpus: 600 × 500 × 500 mm')
    expect(email.text).toContain('Projekt: https://example.test/?width=600')
  })

  it('refuses to work without an API key', async () => {
    const send = resend()
    expect((await handleInquiry(request(payload), undefined, send)).status).toBe(503)
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects broken JSON and invalid inquiries', async () => {
    const send = resend()
    expect((await handleInquiry(request('{'), 'key', send)).status).toBe(400)
    const invalid = { ...payload, inquiry: { ...payload.inquiry, email: 'nope' } }
    expect((await handleInquiry(request(invalid), 'key', send)).status).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects oversized requests', async () => {
    const big = { ...payload, title: 'x'.repeat(30_000) }
    expect((await handleInquiry(request(big), 'key', resend())).status).toBe(413)
  })

  it('quietly drops submissions that filled the hidden field', async () => {
    const send = resend()
    const response = await handleInquiry(request({ ...payload, website: 'spam' }), 'key', send)
    expect(response.status).toBe(200)
    expect(send).not.toHaveBeenCalled()
  })

  it('reports a failure when Resend refuses or cannot be reached', async () => {
    expect((await handleInquiry(request(payload), 'key', resend(422))).status).toBe(502)
    const offline = vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed')
    })
    expect((await handleInquiry(request(payload), 'key', offline)).status).toBe(502)
  })
})
