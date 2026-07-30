import * as repository from "./repository"

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
} from "./repository"
