import { createId } from "@inbound/shared"
import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import * as forms from "../forms/index"
import * as profiles from "../profiles/index"
import * as chat from "../chat/index"
import { env } from "../../lib/env"
import { runAgent } from "./execute"
import * as formSubmission from "./form-submission"
import * as formBuilder from "./form-builder"
import * as themeDesigner from "./theme-designer"
import { themeSchema } from "./tools"

export { runAgent }

async function sendMessageAndRun(threadId: string, message: string) {
  const thread = await chat.getThreadById(threadId)
  if (!thread) throw new Error("Thread not found")

  const now = Date.now()
  await chat.createMessage({
    threadId: thread.id,
    role: "user",
    content: message,
    status: "complete",
    createdAt: now,
  })

  await chat.createMessage({
    threadId: thread.id,
    role: "assistant",
    content: "",
    status: "pending",
    createdAt: now + 1,
  })

  await chat.updateThread(thread.id, {
    lastUserMessageAt: now,
    updatedAt: now,
  })

  void runAgent(thread.id)
  return { ok: true as const }
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

  await chat.createThread({
    id: threadId,
    userId: profile.userId,
    title: `${form.title} Form Session`,
    systemPrompt: formSubmission.systemPrompt,
    type: "formSubmission",
    formId: form.id,
    profileId: profile.id,
    createdAt: now,
    updatedAt: now,
  })

  await chat.createMessage({
    threadId,
    role: "assistant",
    content: formSubmission.greetingMessage(profile.title),
    status: "complete",
    createdAt: now,
  })

  return threadId
}

export async function sendFormSessionMessage(input: {
  sessionId: string
  message: string
}) {
  const thread = await chat.getThreadById(input.sessionId)
  if (!thread) throw new Error("Session not found")
  return sendMessageAndRun(thread.id, input.message)
}

export async function startThemeDesignerThread(input: {
  userId: string
  profileId: string
}) {
  const threadId = createId()
  const now = Date.now()

  await chat.createThread({
    id: threadId,
    userId: input.userId,
    title: "Theme Designer",
    systemPrompt: themeDesigner.systemPrompt,
    type: "themeDesigner",
    profileId: input.profileId,
    createdAt: now,
    updatedAt: now,
  })

  await chat.createMessage({
    threadId,
    role: "assistant",
    content: themeDesigner.greetingMessage,
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

  await chat.createThread({
    id: threadId,
    userId: input.userId,
    title: "Form Builder",
    systemPrompt: formBuilder.systemPrompt,
    type: "formBuilder",
    profileId: input.profileId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  await chat.createMessage({
    threadId,
    role: "assistant",
    content: "What kind of form do you want to build?",
    status: "complete",
    createdAt: now,
  })

  return threadId
}

export async function sendThreadMessage(input: {
  threadId: string
  message: string
}) {
  return sendMessageAndRun(input.threadId, input.message)
}

export async function generateTheme(input: {
  username: string
  title: string
  subtitle: string
}) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("AI is not configured in this environment")
  }

  const vibeResult = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `Give me one strong visual vibe for a link in bio page based on this profile. Keep it short, specific, and creative. Describe the overall feel, the color direction, the typography vibe, and the button style in plain English. Do not give me multiple options. Avoid generic blue startup-style themes unless it clearly fits.
    Username: ${input.username}
    Title: ${input.title}
    Subtitle: ${input.subtitle}
    `,
  })

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: themeDesigner.oneShootSystemPrompt,
    prompt: `Please generate a theme with this vibe: ${vibeResult.text}`,
    output: Output.object({ schema: themeSchema }),
  })

  return result.output
}

export async function generateThemeForProfile(
  profileId: string,
  accountId: string,
) {
  const profile = await profiles.getProfileForAccount(profileId, accountId)
  if (!profile) return null

  const theme = await generateTheme({
    username: profile.username,
    title: profile.title,
    subtitle: profile.bio ?? "",
  })

  if (!theme) return null

  await profiles.updateTheme(profileId, {
    theme: theme.theme,
    backgroundColor: theme.backgroundColor,
    fontFamily: theme.fontFamily,
    textColor: theme.textColor,
    buttonShape: theme.buttonShape,
    buttonStyle: theme.buttonStyle,
    buttonColor: theme.buttonColor,
    buttonTextColor: theme.buttonTextColor,
  })

  return profiles.getProfileById(profileId)
}
