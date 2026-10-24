export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (!first || !last) return ""
  if (parts.length === 1)
    return Array.from(first).slice(0, 2).join("").toUpperCase()

  const firstInitial = Array.from(first)[0] ?? ""
  const lastInitial = Array.from(last)[0] ?? ""
  return `${firstInitial}${lastInitial}`.toUpperCase()
}
