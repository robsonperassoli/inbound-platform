import { openai } from "@ai-sdk/openai"
import { streamText, tool } from "ai"
import { createId } from "@inbound/shared"
import { z } from "zod"
import * as forms from "../forms/index.ts"
import * as profiles from "../profiles/index.ts"
import { env } from "../../lib/env.ts"
import * as repository from "./repository.ts"

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
  const thread = await repository.getThreadById(threadId)
  if (!thread || thread.type !== "formSubmission" || !thread.formId) {
    throw new Error("Invalid session type")
  }

  const submission = await forms.ensureSubmissionForThread({
    threadId,
    userId: thread.userId,
    formId: thread.formId,
    formSubmissionId: thread.formSubmissionId,
  })

  if (thread.formSubmissionId !== submission.id) {
    await repository.updateThread(threadId, {
      formSubmissionId: submission.id,
      updatedAt: Date.now(),
    })
  }

  await forms.mergeSubmissionValues(submission.id, values)
  return submission.id
}

async function completeFormSubmission(threadId: string) {
  const thread = await repository.getThreadById(threadId)
  if (!thread || thread.type !== "formSubmission") {
    throw new Error("Invalid session type")
  }
  if (!thread.formSubmissionId) {
    throw new Error("Submission not found for thread")
  }

  await forms.completeSubmission(thread.formSubmissionId)
  const now = Date.now()
  await repository.updateThread(threadId, {
    sessionEndedAt: now,
    updatedAt: now,
  })
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

function formBuilderTools(
  userId: string,
  threadId: string,
  profileId?: string | null,
) {
  return {
    listForms: tool({
      description: "List User forms",
      inputSchema: z.object({}),
      execute: async () => forms.listFormsForAgent(userId),
    }),
    createForm: tool({
      description: "Create User form",
      inputSchema: z.object({
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(1000).optional(),
      }),
      execute: async (args) => {
        const form = await forms.createFormForUser({
          userId,
          title: args.title,
          description: args.description ?? null,
          fields: [],
        })
        await repository.updateThread(threadId, {
          formId: form.id,
          updatedAt: Date.now(),
        })

        if (profileId) {
          const order = await profiles.countLinksByProfile(profileId)
          await profiles.createFormLink({
            userId,
            profileId,
            title: args.title,
            formId: form.id,
            order,
          })
        }

        return { formId: form.id, message: "Form created successfully" }
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
        const thread = await repository.getThreadById(threadId)
        if (!thread?.formId) throw new Error("No form linked to thread")

        await forms.updateFormForUser(thread.formId, userId, {
          title: args.title,
          description: args.description ?? null,
          fields: args.fields,
        })

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
        await profiles.updateTheme(profileId, {
          theme: args.theme,
          backgroundColor: args.backgroundColor,
          fontFamily: args.fontFamily,
          textColor: args.textColor,
          buttonShape: args.buttonShape,
          buttonStyle: args.buttonStyle,
          buttonColor: args.buttonColor,
          buttonTextColor: args.buttonTextColor,
        })
        return { message: "Theme updated successfully" }
      },
    }),
  }
}

function toolsForThread(
  thread: NonNullable<Awaited<ReturnType<typeof repository.getThreadById>>>,
) {
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
  const thread = await repository.getThreadById(threadId)
  if (!thread) return

  const history = await repository.listMessagesByThread(threadId)

  const assistantMessageId = createId()
  await repository.createMessage({
    id: assistantMessageId,
    threadId,
    role: "assistant",
    content: "",
    status: "streaming",
  })

  if (!env.OPENAI_API_KEY) {
    await repository.updateMessage(assistantMessageId, {
      content:
        "Thanks! (AI is not configured in this environment — your message was saved.)",
      status: "complete",
    })
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
      await repository.updateMessage(assistantMessageId, {
        content,
        status: "streaming",
      })
    }

    await repository.updateMessage(assistantMessageId, {
      content: content || "(done)",
      status: "complete",
    })
  } catch (error) {
    console.error("Agent error", error)
    await repository.updateMessage(assistantMessageId, {
      content: "Sorry, something went wrong. Please try again.",
      status: "error",
    })
  }
}
