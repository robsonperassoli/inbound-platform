import { openai } from "@ai-sdk/openai"
import { streamText, tool } from "ai"
import { createId } from "@inbound/shared"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client.ts"
import {
  forms,
  formSubmissions,
  links,
  messages,
  profiles,
  threads,
} from "../db/schema.ts"
import { env } from "./env.ts"

const themeSchema = z.object({
  theme: z.string(),
  backgroundColor: z.string(),
  backgroundImage: z.string().optional(),
  fontFamily: z.string(),
  textColor: z.string(),
  buttonShape: z.enum(["square", "rounded", "pill"]),
  buttonStyle: z.enum(["solid", "outline", "paper", "shadow", "3d", "ghost"]),
  buttonColor: z.string(),
  buttonTextColor: z.string(),
})

async function fillFormValues(
  threadId: string,
  values: Record<string, string | number | boolean | string[]>,
) {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  })
  if (!thread || thread.type !== "formSubmission" || !thread.formId) {
    throw new Error("Invalid session type")
  }

  let formSubmissionId = thread.formSubmissionId
  if (!formSubmissionId) {
    formSubmissionId = createId()
    await db.insert(formSubmissions).values({
      id: formSubmissionId,
      userId: thread.userId,
      formId: thread.formId,
      values: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    await db
      .update(threads)
      .set({ formSubmissionId, updatedAt: Date.now() })
      .where(eq(threads.id, threadId))
  }

  const submission = await db.query.formSubmissions.findFirst({
    where: eq(formSubmissions.id, formSubmissionId),
  })

  await db
    .update(formSubmissions)
    .set({
      values: {
        ...(submission?.values ?? {}),
        ...values,
      },
      updatedAt: Date.now(),
    })
    .where(eq(formSubmissions.id, formSubmissionId))

  return formSubmissionId
}

async function completeFormSubmission(threadId: string) {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  })
  if (!thread || thread.type !== "formSubmission") {
    throw new Error("Invalid session type")
  }
  if (!thread.formSubmissionId) {
    throw new Error("Submission not found for thread")
  }

  const now = Date.now()
  await db
    .update(formSubmissions)
    .set({ completedAt: now, updatedAt: now })
    .where(eq(formSubmissions.id, thread.formSubmissionId))
  await db
    .update(threads)
    .set({ sessionEndedAt: now, updatedAt: now })
    .where(eq(threads.id, threadId))
}

function formSubmissionTools(threadId: string) {
  return {
    fillForm: tool({
      description: "Fill form fields with data",
      inputSchema: z.object({
        values: z.array(
          z.object({
            fieldId: z.string(),
            value: z.union([
              z.string(),
              z.number(),
              z.array(z.string()),
              z.boolean(),
            ]),
          }),
        ),
      }),
      execute: async (args) => {
        const values = Object.fromEntries(
          args.values.map((v) => [v.fieldId, v.value]),
        )
        await fillFormValues(threadId, values)
        return { ok: true }
      },
    }),
    submitForm: tool({
      description: "Close the current chat session and submit the form",
      inputSchema: z.object({}),
      execute: async () => {
        await completeFormSubmission(threadId)
        return { ok: true }
      },
    }),
  }
}

function formBuilderTools(userId: string, threadId: string, profileId?: string | null) {
  return {
    listForms: tool({
      description: "List User forms",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db.query.forms.findMany({
          where: eq(forms.userId, userId),
          orderBy: [asc(forms.createdAt)],
        })
        return rows.map(({ userId: _userId, ...rest }) => rest)
      },
    }),
    createForm: tool({
      description: "Create User form",
      inputSchema: z.object({
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(1000).optional(),
      }),
      execute: async (args) => {
        const formId = createId()
        const now = Date.now()
        await db.insert(forms).values({
          id: formId,
          userId,
          title: args.title,
          description: args.description ?? null,
          fields: [],
          createdAt: now,
          updatedAt: now,
        })
        await db
          .update(threads)
          .set({ formId, updatedAt: now })
          .where(eq(threads.id, threadId))

        if (profileId) {
          const existing = await db.query.links.findMany({
            where: eq(links.profileId, profileId),
          })
          await db.insert(links).values({
            id: createId(),
            userId,
            profileId,
            title: args.title,
            order: existing.length,
            active: true,
            type: "form",
            formId,
            createdAt: now,
          })
        }

        return { formId, message: "Form created successfully" }
      },
    }),
    updateForm: tool({
      description: "Update User form",
      inputSchema: z.object({
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(1000).optional(),
        fields: z.array(
          z.object({
            id: z.string(),
            type: z.enum([
              "shortText",
              "longText",
              "email",
              "phoneNumber",
              "number",
              "select",
              "checkbox",
              "date",
              "dateTime",
            ]),
            label: z.string(),
            required: z.boolean(),
            options: z.array(z.string()).optional(),
          }),
        ),
      }),
      execute: async (args) => {
        const thread = await db.query.threads.findFirst({
          where: eq(threads.id, threadId),
        })
        if (!thread?.formId) throw new Error("No form linked to thread")

        await db
          .update(forms)
          .set({
            title: args.title,
            description: args.description ?? null,
            fields: args.fields,
            updatedAt: Date.now(),
          })
          .where(and(eq(forms.id, thread.formId), eq(forms.userId, userId)))

        return { message: "Form updated successfully" }
      },
    }),
  }
}

function themeDesignerTools(profileId: string) {
  return {
    updateTheme: tool({
      description:
        "Update the users page design using with the provided theme settings",
      inputSchema: themeSchema,
      execute: async (args) => {
        await db
          .update(profiles)
          .set({
            theme: args.theme,
            backgroundColor: args.backgroundColor,
            fontFamily: args.fontFamily,
            textColor: args.textColor,
            buttonShape: args.buttonShape,
            buttonStyle: args.buttonStyle,
            buttonColor: args.buttonColor,
            buttonTextColor: args.buttonTextColor,
            updatedAt: Date.now(),
          })
          .where(eq(profiles.id, profileId))
        return { message: "Theme updated successfully" }
      },
    }),
  }
}

function toolsForThread(thread: typeof threads.$inferSelect) {
  if (thread.type === "formSubmission") {
    return formSubmissionTools(thread.id)
  }
  if (thread.type === "formBuilder") {
    return formBuilderTools(thread.userId, thread.id, thread.profileId)
  }
  if (thread.type === "themeDesigner" && thread.profileId) {
    return themeDesignerTools(thread.profileId)
  }
  return undefined
}

export async function runFormSubmissionAgent(threadId: string) {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  })
  if (!thread) return

  const history = await db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: [asc(messages.createdAt)],
  })

  const assistantMessageId = createId()
  await db.insert(messages).values({
    id: assistantMessageId,
    threadId,
    role: "assistant",
    content: "",
    status: "streaming",
    createdAt: Date.now(),
  })

  if (!env.OPENAI_API_KEY) {
    await db
      .update(messages)
      .set({
        content:
          "Thanks! (AI is not configured in this environment — your message was saved.)",
        status: "complete",
      })
      .where(eq(messages.id, assistantMessageId))
    return
  }

  try {
    const tools = toolsForThread(thread)
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: thread.systemPrompt,
      messages: history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ...(tools ? { tools } : {}),
    })

    let content = ""
    for await (const chunk of result.textStream) {
      content += chunk
      await db
        .update(messages)
        .set({ content, status: "streaming" })
        .where(eq(messages.id, assistantMessageId))
    }

    await db
      .update(messages)
      .set({ content: content || "(done)", status: "complete" })
      .where(eq(messages.id, assistantMessageId))
  } catch (error) {
    console.error("Agent error", error)
    await db
      .update(messages)
      .set({
        content: "Sorry, something went wrong. Please try again.",
        status: "error",
      })
      .where(eq(messages.id, assistantMessageId))
  }
}

const THEME_DESIGNER_PROMPT = `You are a happy designer shaping bio-page themes.
You take lead and guide the user into a collaborative design process.
You have access to updateTheme. Be concise. Use hex colors. fontFamily must be an exact supported font name.`

const FORM_BUILDER_PROMPT = `You are Hugo — a friendly AI assistant that designs lead-capture forms.
Prefer creating an initial form quickly, then iterate.
Use listForms, createForm, and updateForm tools.
Present fields as Markdown tables.`

export async function startThemeDesignerThread(input: {
  userId: string
  profileId: string
}) {
  const threadId = createId()
  const now = Date.now()

  await db.insert(threads).values({
    id: threadId,
    userId: input.userId,
    title: "Theme Designer",
    model: "gpt-4o-mini",
    systemPrompt: THEME_DESIGNER_PROMPT,
    type: "themeDesigner",
    profileId: input.profileId,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(messages).values({
    id: createId(),
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

  await db.insert(threads).values({
    id: threadId,
    userId: input.userId,
    title: "Form Builder",
    model: "gpt-4o-mini",
    systemPrompt: FORM_BUILDER_PROMPT,
    type: "formBuilder",
    profileId: input.profileId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(messages).values({
    id: createId(),
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
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, input.threadId),
  })
  if (!thread) throw new Error("Thread not found")

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

  void runFormSubmissionAgent(thread.id)
  return { ok: true }
}
