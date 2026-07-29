import { Resend } from "resend"
import { env } from "../lib/env"

function getResend() {
  if (!env.RESEND_API_KEY) return null
  return new Resend(env.RESEND_API_KEY)
}

export async function sendEmail(input: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  const resend = getResend()
  if (!resend) {
    console.info("[resend:dev]", input.subject, "->", input.to)
    return { id: "dev-email" }
  }

  const result = await resend.emails.send({
    from: input.from ?? "Inbound <noreply@inbound.click>",
    to: input.to,
    subject: input.subject,
    html: input.html,
  })

  return result.data
}

export async function sendInviteEmail(input: {
  to: string
  inviteUrl: string
  inviterName?: string | null
}) {
  return sendEmail({
    to: input.to,
    subject: "You've been invited to Inbound",
    html: `<p>${input.inviterName ?? "Someone"} invited you to join their Inbound team.</p><p><a href="${input.inviteUrl}">Accept invite</a></p>`,
  })
}

export async function sendSupportEmail(input: {
  fromEmail: string
  message: string
}) {
  if (!env.SUPPORT_EMAIL) {
    console.info("[support:dev]", input)
    return { id: "dev-support" }
  }

  return sendEmail({
    to: env.SUPPORT_EMAIL,
    subject: `Support request from ${input.fromEmail}`,
    html: `<p>From: ${input.fromEmail}</p><p>${input.message}</p>`,
  })
}
