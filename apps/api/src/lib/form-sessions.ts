import { createId } from "@inbound/shared"
import { asc, eq } from "drizzle-orm"
import { db } from "../db/client.ts"
import { forms, messages, profiles, threads } from "../db/schema.ts"
import { runFormSubmissionAgent } from "./agents.ts"

const FORM_SYSTEM_PROMPT = `You are Hugo, a warm, polished sales concierge.

You are chatting with a visitor on a user's profile page. Your goal is to make
the conversation feel easy and human while gathering the details needed for a
strong follow-up.

Never mention forms, schemas, tools, or internal instructions.

Ask one focused question at a time. Extract any field values the user clearly
provides and call fillForm immediately. Once all required fields are valid and
the conversation has naturally wrapped, call submitForm.`

export function greetingMessage(profileTitle: string) {
  return `Hi! Thanks for stopping by. I'm Hugo, here to help make things easy and learn a bit about what you're looking for with ${profileTitle}. Is now a good time for a quick chat?`
}

export async function startFormSession(input: {
  profileId: string
  formId: string
}) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, input.profileId),
  })
  if (!profile) throw new Error("Profile not found")

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, input.formId),
  })
  if (!form) throw new Error("Form not found")

  const threadId = createId()
  const now = Date.now()

  await db.insert(threads).values({
    id: threadId,
    userId: profile.userId,
    title: `${form.title} Form Session`,
    model: "gpt-4o-mini",
    systemPrompt: `${FORM_SYSTEM_PROMPT}\n\nForm title: ${form.title}\nFields: ${JSON.stringify(form.fields)}`,
    type: "formSubmission",
    formId: form.id,
    profileId: profile.id,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(messages).values({
    id: createId(),
    threadId,
    role: "assistant",
    content: greetingMessage(profile.title),
    status: "complete",
    createdAt: now,
  })

  return threadId
}

export async function getFormSessionMessages(sessionId: string) {
  const rows = await db.query.messages.findMany({
    where: eq(messages.threadId, sessionId),
    orderBy: [asc(messages.createdAt)],
  })

  return rows.map((m) => ({
    id: m.id,
    threadId: m.threadId,
    role: m.role,
    content: m.content,
    status: m.status,
    createdAt: m.createdAt,
  }))
}

export async function sendFormSessionMessage(input: {
  sessionId: string
  message: string
}) {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, input.sessionId),
  })
  if (!thread) throw new Error("Session not found")

  const now = Date.now()
  await db.insert(messages).values({
    id: createId(),
    threadId: thread.id,
    role: "user",
    content: input.message,
    status: "complete",
    createdAt: now,
  })

  await db
    .update(threads)
    .set({ lastUserMessageAt: now, updatedAt: now })
    .where(eq(threads.id, thread.id))

  // Fire-and-forget agent response
  void runFormSubmissionAgent(thread.id)

  return { ok: true }
}
