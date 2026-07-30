import { tool } from "ai"
import { z } from "zod"
import * as forms from "../forms/index"
import * as profiles from "../profiles/index"
import * as chat from "../chat/index"

export const themeSchema = z.object({
  theme: z.string().describe("The name of the theme"),
  backgroundColor: z.string(),
  backgroundImage: z
    .string()
    .describe("Valid image URL, or empty string if none"),
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
  const thread = await chat.getThreadById(threadId)
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
    await chat.updateThread(threadId, {
      formSubmissionId: submission.id,
      updatedAt: Date.now(),
    })
  }

  await forms.mergeSubmissionValues(submission.id, values)
  return submission.id
}

async function completeFormSubmission(threadId: string) {
  const thread = await chat.getThreadById(threadId)
  if (!thread || thread.type !== "formSubmission") {
    throw new Error("Invalid session type")
  }
  if (!thread.formSubmissionId) {
    throw new Error("Submission not found for thread")
  }

  await forms.completeSubmission(thread.formSubmissionId)
  const now = Date.now()
  await chat.updateThread(threadId, {
    sessionEndedAt: now,
    updatedAt: now,
  })
}

export function createFillFormTool(threadId: string) {
  return tool({
    description: "Fill form fields with data",
    inputSchema: z.object({
      values: z.array(
        z.object({
          fieldId: z.string().describe("The ID of the form field to fill"),
          value: z
            .union([z.string(), z.number(), z.array(z.string()), z.boolean()])
            .describe("The value to fill the field with"),
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
  })
}

export function createSubmitFormTool(threadId: string) {
  return tool({
    description: "Close the current chat session and submit the form",
    inputSchema: z.object({}),
    execute: async () => {
      await completeFormSubmission(threadId)
      return { ok: true }
    },
  })
}

export function createListFormsTool(userId: string) {
  return tool({
    description: "List User forms",
    inputSchema: z.object({}),
    execute: async () => forms.listFormsForAgent(userId),
  })
}

export function createCreateFormTool(
  userId: string,
  threadId: string,
  profileId?: string | null,
) {
  return tool({
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
      await chat.updateThread(threadId, {
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
  })
}

export function createUpdateFormTool(userId: string, threadId: string) {
  return tool({
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
      const thread = await chat.getThreadById(threadId)
      if (!thread?.formId) throw new Error("No form linked to thread")

      await forms.updateFormForUser(thread.formId, userId, {
        title: args.title,
        description: args.description ?? null,
        fields: args.fields,
      })

      return { message: "Form updated successfully" }
    },
  })
}

export function createUpdateThemeTool(profileId: string) {
  return tool({
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
  })
}
