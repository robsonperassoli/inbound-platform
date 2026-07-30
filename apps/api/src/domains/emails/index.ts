import { env } from "../../lib/env"
import * as resend from "../../integrations/resend"

const DEFAULT_FROM = "Inbound.click <robson@send.inbound.click>"
const NOTIFICATIONS_FROM = "Inbound.Click <notifications@send.inbound.click>"
const ACTIVATION_FROM = "Robson <robson@send.inbound.click>"

export function getFirstName(name?: string | null) {
  const trimmed = name?.trim()
  if (!trimmed) return "there"
  return trimmed.split(/\s+/)[0] ?? "there"
}

function formatLine(label: string, value?: string | null) {
  return `${label}: ${value?.trim() ? value.trim() : "Not provided"}`
}

function profileChatHeaders(formSubmissionId: string) {
  return {
    "In-Reply-To": `<${formSubmissionId}@inbound.click>`,
    References: `<${formSubmissionId}@inbound.click>`,
  }
}

export async function sendInviteEmail(input: {
  to: string
  inviteUrl: string
  inviterName?: string | null
}) {
  const inviter = input.inviterName?.trim() || "Someone"
  return resend.sendEmail({
    from: DEFAULT_FROM,
    to: input.to,
    subject: "You've been invited to join Inbound.click",
    text: [
      `${inviter} has invited you to join their team on Inbound.click.`,
      "",
      "Accept your invitation:",
      input.inviteUrl,
      "",
      "This invitation expires in 7 days.",
    ].join("\n"),
  })
}

export async function sendSupportEmail(input: {
  fromEmail: string
  message: string
}) {
  const to = env.SUPPORT_EMAIL
  if (!to) {
    console.info("[support:dev]", input)
    return { id: "dev-support" }
  }

  return resend.sendEmail({
    from: DEFAULT_FROM,
    to,
    replyTo: input.fromEmail,
    subject: `[Support] request from ${input.fromEmail}`,
    text: [
      "A new support request was submitted.",
      "",
      `Customer email: ${input.fromEmail}`,
      "",
      "Message",
      input.message.trim(),
    ].join("\n"),
  })
}

export async function sendFeedbackEmail(input: {
  fromEmail: string
  message: string
}) {
  const to = env.FEEDBACK_EMAIL ?? env.SUPPORT_EMAIL
  if (!to) {
    console.info("[feedback:dev]", input)
    return { id: "dev-feedback" }
  }

  return resend.sendEmail({
    from: DEFAULT_FROM,
    to,
    replyTo: input.fromEmail,
    subject: `[Feedback] from ${input.fromEmail}`,
    text: [
      "A new feedback submission was received.",
      "",
      `Customer email: ${input.fromEmail}`,
      "",
      "Message",
      input.message.trim(),
    ].join("\n"),
  })
}

export async function sendSalesLeadEmail(input: {
  email: string
  phone: string
  companyName: string
  leadName?: string | null
  username?: string | null
  userAgent?: string | null
}) {
  const to = env.SALES_EMAIL ?? env.SUPPORT_EMAIL
  if (!to) {
    console.info("[sales:dev]", input)
    return { id: "dev-sales" }
  }

  return resend.sendEmail({
    from: DEFAULT_FROM,
    to,
    replyTo: input.email,
    subject: "[Sales Lead] Team pricing inquiry",
    text: [
      "A new sales lead was submitted.",
      "",
      formatLine("Lead email", input.email),
      formatLine("Lead name", input.leadName),
      formatLine("Phone", input.phone),
      formatLine("Company name", input.companyName),
      formatLine("Subject", "Team pricing inquiry"),
      "",
      "Technical metadata",
      formatLine("Browser", input.userAgent),
      formatLine("Submitted at", new Date().toISOString()),
      formatLine("Username", input.username),
    ].join("\n"),
  })
}

export async function sendNewConversationEmail(input: {
  to: string
  firstName: string
  transcriptUrl: string
  formSubmissionId: string
}) {
  return resend.sendTemplateEmail({
    from: NOTIFICATIONS_FROM,
    to: input.to,
    templateId: "new-conversation",
    variables: {
      firstName: input.firstName,
      formSubmissionTranscriptUrl: input.transcriptUrl,
    },
    headers: profileChatHeaders(input.formSubmissionId),
  })
}

export async function sendChatCompletedEmail(input: {
  to: string
  firstName: string
  transcriptUrl: string
  formSubmissionId: string
  status: "abandoned" | "finished"
}) {
  const statusMessage =
    input.status === "abandoned"
      ? "The visitor stopped responding before finishing the conversation. You can still review what was captured up to that moment."
      : "The conversation finished and Hugo collected all the key details. The lead is ready for you to review."

  return resend.sendTemplateEmail({
    from: NOTIFICATIONS_FROM,
    to: input.to,
    templateId: "chat-completed",
    variables: {
      firstName: input.firstName,
      formSubmissionTranscriptUrl: input.transcriptUrl,
      statusMessage,
    },
    headers: profileChatHeaders(input.formSubmissionId),
  })
}

export async function sendActivationEmail(input: {
  to: string
  firstName: string
  username: string
}) {
  return resend.sendTemplateEmail({
    from: ACTIVATION_FROM,
    to: input.to,
    templateId: "lead-capture-activation-1",
    variables: {
      firstName: input.firstName,
      username: input.username,
    },
  })
}
