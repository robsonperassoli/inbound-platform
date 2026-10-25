import { describe, expect, it } from "vitest"
import { systemPrompt } from "./form-builder"

describe("form builder prompt", () => {
  it("keeps the tool, table, and approval contract", () => {
    expect(systemPrompt).toContain("listForms")
    expect(systemPrompt).toContain("getForm")
    expect(systemPrompt).toContain("createForm")
    expect(systemPrompt).toContain("updateForm")
    expect(systemPrompt).toContain("| Field | Type |")
    expect(systemPrompt).toContain("| Field | Type | Options |")
    expect(systemPrompt).toContain("Field IDs/keys should remain the same")
    expect(systemPrompt).toContain("Reply ‘approve’")
    expect(systemPrompt).toContain("Only then call updateForm")
  })
})
