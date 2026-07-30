import { describe, expect, it } from "vitest"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("forms routes", () => {
  it("lists, creates, and fetches forms", async () => {
    const { user } = await createUserAccount()

    const listEmpty = await client.forms.$get({}, withAuth(user.id))
    expect(listEmpty.status).toBe(200)
    expect(await listEmpty.json()).toEqual({ forms: [] })

    const createRes = await client.forms.$post(
      {
        json: {
          title: "Lead Form",
          description: "Capture leads",
          fields: [
            {
              id: "email",
              type: "email",
              label: "Email",
              required: true,
            },
          ],
        },
      },
      withAuth(user.id),
    )
    expect(createRes.status).toBe(201)
    if (!createRes.ok) throw new Error(`unexpected status ${createRes.status}`)
    const { form } = await createRes.json()
    expect(form).toMatchObject({ title: "Lead Form" })

    const getRes = await client.forms[":id"].$get(
      { param: { id: form.id } },
      withAuth(user.id),
    )
    expect(getRes.status).toBe(200)
    expect(await getRes.json()).toMatchObject({
      form: { id: form.id, title: "Lead Form" },
    })
  })

  it("returns 404 for an unknown form", async () => {
    const { user } = await createUserAccount()
    const res = await client.forms[":id"].$get(
      { param: { id: "missing-form-id" } },
      withAuth(user.id),
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Not found" })
  })
})
