import { handleInquiry } from '../src/server/inquiry.js'

export function POST(request: Request): Promise<Response> {
  return handleInquiry(request, process.env.RESEND_API_KEY)
}
