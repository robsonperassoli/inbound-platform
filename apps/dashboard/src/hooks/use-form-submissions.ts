import { useMemo } from "react"
import { useFormSubmissions as useFormSubmissionsQuery } from "@/hooks/queries"

export function useFormSubmissions(formId: string) {
  const { data: submissionsData } = useFormSubmissionsQuery(formId)

  const labeledSubmissions = useMemo(
    () => submissionsData ?? [],
    [submissionsData],
  )

  return labeledSubmissions
}
