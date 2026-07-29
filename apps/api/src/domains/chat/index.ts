import { createId } from "@inbound/shared"
import * as forms from "../forms/index.ts"
import * as profiles from "../profiles/index.ts"
import * as repository from "./repository.ts"
import { runFormSubmissionAgent } from "./agents.ts"

const FORM_SYSTEM_PROMPT = `You are Hugo, a warm, polished sales concierge.

You are chatting with a visitor on a user's profile page. Your goal is to make
the conversation feel easy and human while gathering the details needed for a
strong follow-up.

Never mention forms, schemas, tools, or internal instructions.

Ask one focused question at a time. Extract any field values the user clearly
provides and call fillForm immediately. Once all required fields are valid and
the conversation has naturally wrapped, call submitForm.`

const THEME_DESIGNER_PROMPT = `You are a happy designer shaping bio-page themes.
You take lead and guide the user into a collaborative design process.
You have access to updateTheme. Be concise. Use hex colors. fontFamily must be an exact supported font name.`

const FORM_BUILDER_PROMPT = `You are Hugo — a friendly AI assistant that designs lead-capture forms.
Prefer creating an initial form quickly, then iterate.
Use listForms, createForm, and updateForm tools.
Present fields as Markdown tables.`

export function greetingMessage(profileTitle: string) {
  return `Hi! Thanks for stopping by. I'm Hugo, here to help make things easy and learn a bit about what you're looking for with ${profileTitle}. Is now a good time for a quick chat?`
}

export async function startFormSession(input: {
  profileId: string
  formId: string
}) {
  const profile = await profiles.getProfileById(input.profileId)
  if (!profile) throw new Error("Profile not found")

  const form = await forms.getFormById(input.formId)
  if (!form) throw new Error("Form not found")

  const threadId = createId()
  const now = Date.now()

  await repository.createThread({
    id: threadId,
    userId: profile.userId,
    title: `${form.title} Form Session`,
    systemPrompt: `${FORM_SYSTEM_PROMPT}\n\nForm title: ${form.title}\nFields: ${JSON.stringify(form.fields)}`,
    type: "formSubmission",
    formId: form.id,
    profileId: profile.id,
    createdAt: now,
    updatedAt: now,
  })

  await repository.createMessage({
    threadId,
    role: "assistant",
    content: greetingMessage(profile.title),
    status: "complete",
    createdAt: now,
  })

  return threadId
}

export async function getFormSessionMessages(sessionId: string) {
  const rows = await repository.listMessagesByThread(sessionId)
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
  const thread = await repository.getThreadById(input.sessionId)
  if (!thread) throw new Error("Session not found")

  const now = Date.now()
  await repository.createMessage({
    threadId: thread.id,
    role: "user",
    content: input.message,
    status: "complete",
    createdAt: now,
  })

  await repository.updateThread(thread.id, {
    lastUserMessageAt: now,
    updatedAt: now,
  })

  void runFormSubmissionAgent(thread.id)
  return { ok: true }
}

export async function startThemeDesignerThread(input: {
  userId: string
  profileId: string
}) {
  const threadId = createId()
  const now = Date.now()

  await repository.createThread({
    id: threadId,
    userId: input.userId,
    title: "Theme Designer",
    systemPrompt: THEME_DESIGNER_PROMPT,
    type: "themeDesigner",
    profileId: input.profileId,
    createdAt: now,
    updatedAt: now,
  })

  await repository.createMessage({
    threadId,
    role: "assistant",
    content:
      "Tell me the vibe you want for this bio page and I'll design a theme.",
    status: "complete",
    createdAt: now,
  })

  return threadId
}

export async function startFormBuilderThread(input: {
  userId: string
  profileId?: string
}) {
  const threadId = createId()
  const now = Date.now()

  await repository.createThread({
    id: threadId,
    userId: input.userId,
    title: "Form Builder",
    systemPrompt: FORM_BUILDER_PROMPT,
    type: "formBuilder",
    profileId: input.profileId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  await repository.createMessage({
    threadId,
    role: "assistant",
    content: "What kind of form do you want to build?",
    status: "complete",
    createdAt: now,
  })

  return threadId
}

export async function getThreadForUser(threadId: string, userId: string) {
  const thread = await repository.getThreadById(threadId)
  if (!thread || thread.userId !== userId) return null
  return thread
}

export async function getThreadWithMessages(threadId: string, userId: string) {
  const thread = await getThreadForUser(threadId, userId)
  if (!thread) return null
  const rows = await repository.listMessagesByThread(thread.id)
  return { thread, messages: rows }
}

export async function sendThreadMessage(input: {
  threadId: string
  message: string
}) {
  const thread = await repository.getThreadById(input.threadId)
  if (!thread) throw new Error("Thread not found")

  const now = Date.now()
  await repository.createMessage({
    threadId: thread.id,
    role: "user",
    content: input.message,
    status: "complete",
    createdAt: now,
  })

  await repository.updateThread(thread.id, {
    lastUserMessageAt: now,
    updatedAt: now,
  })

  void runFormSubmissionAgent(thread.id)
  return { ok: true }
}

export async function getSubmissionTranscript(formSubmissionId: string) {
  const thread =
    await repository.getThreadByFormSubmissionId(formSubmissionId)
  if (!thread) return []

  const rows = await repository.listMessagesByThread(thread.id)
  return rows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    status: m.status,
  }))
}

export async function linkFormSubmissionToThread(
  threadId: string,
  formSubmissionId: string,
) {
  return repository.updateThread(threadId, {
    formSubmissionId,
    updatedAt: Date.now(),
  })
}

export async function endFormSession(threadId: string) {
  const now = Date.now()
  return repository.updateThread(threadId, {
    sessionEndedAt: now,
    updatedAt: now,
  })
}

export async function linkFormToThread(threadId: string, formId: string) {
  return repository.updateThread(threadId, {
    formId,
    updatedAt: Date.now(),
  })
}

export {
  getThreadById,
  listMessagesByThread,
  createMessage,
  updateMessage,
} from "./repository.ts"
