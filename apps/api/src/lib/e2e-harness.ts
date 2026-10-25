export function isE2ELoginAllowed(input: {
  parsedNodeEnv: string
  liveNodeEnv: string | undefined
  bypass: string | undefined
}) {
  if (input.parsedNodeEnv === "production") return false
  if (input.liveNodeEnv === "production") return false
  return input.bypass === "1"
}

export function isE2EHarnessEnabled(
  nodeEnv = process.env.NODE_ENV,
  bypass = process.env.E2E_AUTH_BYPASS,
) {
  return isE2ELoginAllowed({
    parsedNodeEnv: nodeEnv ?? "development",
    liveNodeEnv: nodeEnv,
    bypass,
  })
}
