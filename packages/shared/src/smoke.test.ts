import { describe, expect, it } from "vitest"

describe("test harness", () => {
  it("runs in node", () => {
    expect("ok").toBe("ok")
  })
})
