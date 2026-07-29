import { useState } from "react"

export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), timeout)
  }

  return { copied, copyToClipboard }
}
