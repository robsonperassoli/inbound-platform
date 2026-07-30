import * as accounts from "../accounts/index"
import { env } from "../../lib/env"
import { getFirstName, sendChatCompletedEmail } from "../emails/index"
import * as repository from "./repository"

const SILENT_CLOSE_AFTER_MS = 2 * 60 * 60 * 1000
const ABANDONED_IDLE_AFTER_MS = 25 * 60 * 1000

export function formSubmissionTranscriptUrl(
  formId: string,
  submissionId: string,
) {
  return `${env.DASHBOARD_URL}/forms/${formId}/submissions/${submissionId}/transcript`
}

export { getFirstName }

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

export async function autoCloseAbandonedThreads(now = Date.now()) {
  const openThreads = await repository.listOpenFormSubmissionThreads()
  const silentCutoff = now - SILENT_CLOSE_AFTER_MS
  const abandonedCutoff = now - ABANDONED_IDLE_AFTER_MS

  let closedSilent = 0
  let closedAbandoned = 0

  for (const thread of openThreads) {
    const neverStarted = !thread.lastUserMessageAt || !thread.formSubmissionId

    if (neverStarted) {
      if (thread.createdAt < silentCutoff) {
        await endFormSession(thread.id)
        closedSilent += 1
      }
      continue
    }

    if (
      thread.lastUserMessageAt &&
      thread.lastUserMessageAt < abandonedCutoff &&
      thread.formSubmissionId &&
      thread.formId
    ) {
      await endFormSession(thread.id)
      closedAbandoned += 1

      const owner = await accounts.getUserById(thread.userId)
      if (owner?.email) {
        try {
          await sendChatCompletedEmail({
            to: owner.email,
            firstName: getFirstName(owner.name),
            transcriptUrl: formSubmissionTranscriptUrl(
              thread.formId,
              thread.formSubmissionId,
            ),
            formSubmissionId: thread.formSubmissionId,
            status: "abandoned",
          })
        } catch (error) {
          console.error(
            `[auto-close] failed to send abandoned email for ${thread.id}`,
            error,
          )
        }
      }
    }
  }

  return { closedSilent, closedAbandoned }
}

export async function linkFormToThread(threadId: string, formId: string) {
  return repository.updateThread(threadId, {
    formId,
    updatedAt: Date.now(),
  })
}

export {
  getThreadById,
  getThreadByFormSubmissionId,
  createThread,
  updateThread,
  listMessagesByThread,
  createMessage,
  updateMessage,
  listOpenFormSubmissionThreads,
} from "./repository"
