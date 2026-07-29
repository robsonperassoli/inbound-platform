import { describe, expect, it } from "vitest"
import * as forms from "./index.ts"
import { createFormForAccount, createUserAccount } from "../../test/factories.ts"

describe("forms domain", () => {
  it("creates and lists forms for a user", async () => {
    const { user } = await createUserAccount()

    const form = await forms.createFormForUser({
      userId: user.id,
      title: "Contact",
      description: "Say hello",
      fields: [
        {
          id: "name",
          type: "text",
          label: "Name",
          required: true,
        },
      ],
    })

    const listed = await forms.listFormsForUser(user.id)
    expect(listed).toHaveLength(1)
    expect(listed[0]).toMatchObject({
      id: form.id,
      title: "Contact",
      userId: user.id,
    })
  })

  it("scopes form reads and updates to the owning user", async () => {
    const owner = await createUserAccount()
    const other = await createUserAccount()
    const { form } = await createFormForAccount({
      userId: owner.user.id,
      title: "Owner Form",
    })

    await expect(forms.getFormForUser(form.id, other.user.id)).resolves.toBeNull()
    await expect(
      forms.updateFormForUser(form.id, other.user.id, { title: "Hacked" }),
    ).resolves.toBeNull()

    const updated = await forms.updateFormForUser(form.id, owner.user.id, {
      title: "Updated Form",
      publishedAt: Date.now(),
    })
    expect(updated).toMatchObject({
      id: form.id,
      title: "Updated Form",
    })
    expect(updated?.publishedAt).toEqual(expect.any(Number))
  })

  it("merges submission values and completes a submission", async () => {
    const { user, form } = await createFormForAccount({
      fields: [
        {
          id: "email",
          type: "email",
          label: "Email",
          required: true,
        },
        {
          id: "company",
          type: "text",
          label: "Company",
          required: false,
        },
      ],
    })

    const submission = await forms.ensureSubmissionForThread({
      threadId: "thread_unused",
      userId: user.id,
      formId: form.id,
      formSubmissionId: null,
    })

    await forms.mergeSubmissionValues(submission.id, {
      email: "lead@example.com",
    })
    await forms.mergeSubmissionValues(submission.id, {
      company: "Inbound",
    })

    const merged = await forms.getSubmissionById(submission.id)
    expect(merged?.values).toEqual({
      email: "lead@example.com",
      company: "Inbound",
    })
    expect(merged?.completedAt).toBeNull()

    const completed = await forms.completeSubmission(submission.id)
    expect(completed?.completedAt).toEqual(expect.any(Number))

    const scoped = await forms.getSubmissionForUserForm(
      form.id,
      submission.id,
      user.id,
    )
    expect(scoped?.submission.id).toBe(submission.id)
  })

  it("returns null submissions for forms the user does not own", async () => {
    const owner = await createUserAccount()
    const other = await createUserAccount()
    const { form } = await createFormForAccount({ userId: owner.user.id })

    const submission = await forms.ensureSubmissionForThread({
      threadId: "thread_unused",
      userId: owner.user.id,
      formId: form.id,
      formSubmissionId: null,
    })

    await expect(
      forms.listSubmissionsForUserForm(form.id, other.user.id),
    ).resolves.toBeNull()
    await expect(
      forms.getSubmissionForUserForm(form.id, submission.id, other.user.id),
    ).resolves.toBeNull()
  })

  it("reuses an existing submission when formSubmissionId is provided", async () => {
    const { user, form } = await createFormForAccount()
    const first = await forms.ensureSubmissionForThread({
      threadId: "thread_1",
      userId: user.id,
      formId: form.id,
      formSubmissionId: null,
    })

    const second = await forms.ensureSubmissionForThread({
      threadId: "thread_1",
      userId: user.id,
      formId: form.id,
      formSubmissionId: first.id,
    })

    expect(second.id).toBe(first.id)
  })
})
