import { Resend, type CreateEmailOptions } from "resend"
import { env } from "../lib/env"

function getResend() {
  if (!env.RESEND_API_KEY) return null
  return new Resend(env.RESEND_API_KEY)
}

async function deliver(payload: CreateEmailOptions, devLabel: string) {
  const resend = getResend()
  if (!resend) {
    console.info("[resend:dev]", devLabel, payload)
    return { id: "dev-email" }
  }

  const result = await resend.emails.send(payload)
  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`)
  }
  return result.data
}

/** Low-level HTML/text send. Prefer domain helpers in `domains/emails`. */
export async function sendEmail(input: {
  to: string
  subject: string
  html?: string
  text?: string
  from: string
  replyTo?: string | string[]
}) {
  if (!input.html && !input.text) {
    throw new Error("Email requires html or text content")
  }

  const base = {
    from: input.from,
    to: input.to,
    subject: input.subject,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  }

  const payload: CreateEmailOptions = input.html
    ? { ...base, html: input.html, ...(input.text ? { text: input.text } : {}) }
    : { ...base, text: input.text! }

  return deliver(payload, `${input.subject} -> ${input.to}`)
}

/** Low-level Resend template send. Prefer domain helpers in `domains/emails`. */
export async function sendTemplateEmail(input: {
  to: string
  from: string
  templateId: string
  variables: Record<string, string | number>
  headers?: Record<string, string>
  subject?: string
}) {
  return deliver(
    {
      from: input.from,
      to: input.to,
      ...(input.subject ? { subject: input.subject } : {}),
      template: {
        id: input.templateId,
        variables: input.variables,
      },
      ...(input.headers ? { headers: input.headers } : {}),
    },
    `${input.templateId} -> ${input.to}`,
  )
}
