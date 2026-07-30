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

export async function sendChatCompletedEmail(input: {
  to: string
  firstName: string
  transcriptUrl: string
  status: "abandoned" | "finished"
}) {
  const statusMessage =
    input.status === "abandoned"
      ? "The visitor stopped responding before finishing the conversation. You can still review what was captured up to that moment."
      : "The conversation finished and Hugo collected all the key details. The lead is ready for you to review."

  return sendEmail({
    to: input.to,
    subject:
      input.status === "abandoned"
        ? "A visitor left a conversation unfinished"
        : "A new lead conversation is ready",
    html: `<p>Hi ${input.firstName},</p><p>${statusMessage}</p><p><a href="${input.transcriptUrl}">Review the transcript</a></p>`,
  })
}
