import { Sparkles } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useSelectedProfileId } from "@/stores/profiles"
import { apiClient } from "@/lib/api"

const DEFAULT_PROMPT_EXAMPLES = [
  {
    label: "Real Estate Buyer Leads",
    prompt:
      "Create a lead capture form for real estate buyers with name, email, phone, preferred neighborhood, and budget range.",
  },
  {
    label: "Dental Appointment Request",
    prompt:
      "Build a contact form for a dental clinic with patient name, phone, preferred appointment date, and reason for visit.",
  },
  {
    label: "Newsletter Signup",
    prompt:
      "Make a short newsletter signup form that asks for full name, email, and topics of interest.",
  },
]

export function CreateFormPrompt({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState("")
  const [hoveredExample, setHoveredExample] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const profileId = useSelectedProfileId()

  const trimmedPrompt = prompt.trim()
  const isEmpty = trimmedPrompt.length === 0
  const canSubmit = !isEmpty && !isSubmitting

  useEffect(() => {
    if (!open) {
      setPrompt("")
      setHoveredExample(null)
    }
  }, [open])

  const submitPrompt = async () => {
    try {
      if (!canSubmit) return

      setSubmitting(true)

      const { threadId } = await apiClient.startFormBuilder(profileId ?? undefined)
      await apiClient.sendThreadMessage(threadId, prompt.trim())

      navigate({
        to: "/forms/builder/$threadId",
        params: { threadId },
        search: { returnTo: "bio" },
      })
    } catch (err) {
      console.error(err)
      toast.error(err?.message ?? "Could not create form")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
        <div className="border-b bg-linear-to-br from-primary/10 via-secondary/30 to-transparent p-6">
          <DialogHeader className="gap-3">
            <div className="bg-background/90 ring-foreground/10 inline-flex size-9 items-center justify-center rounded-full ring-1">
              <HugeiconsIcon icon={Sparkles} className="size-4" />
            </div>
            <DialogTitle className="text-xl">Describe your form</DialogTitle>
            <DialogDescription>
              Give the assistant your first prompt and it will start building
              the form structure with you.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          className="grid gap-5 p-6"
          onSubmit={async (event) => {
            event.preventDefault()
            await submitPrompt()
          }}
        >
          {isEmpty && (
            <div className="grid gap-3">
              <p className="text-center text-sm text-muted-foreground">
                Not sure where to start? Pick a direction below, then tailor the
                prompt to match your business.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {DEFAULT_PROMPT_EXAMPLES.map((example) => (
                  <Button
                    key={example.prompt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-border/60 bg-background px-3"
                    onClick={() => setPrompt(example.prompt)}
                    onMouseEnter={() => setHoveredExample(example.prompt)}
                    onMouseLeave={() => setHoveredExample(null)}
                    onFocus={() => setHoveredExample(example.prompt)}
                    onBlur={() => setHoveredExample(null)}
                  >
                    <HugeiconsIcon icon={Sparkles} className="size-3.5" />
                    {example.label}
                  </Button>
                ))}
              </div>
              <div className="min-h-20">
                {hoveredExample && (
                  <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {hoveredExample}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Create a form for..."
            className="min-h-44 resize-y rounded-2xl border-border/60 bg-background px-4 py-3 text-sm leading-relaxed"
            onKeyDown={async (event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault()
                await submitPrompt()
              }
            }}
            autoFocus
          />

          <DialogFooter className="items-center justify-between sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Press Ctrl/Cmd + Enter to send
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? "Starting..." : "Start thread"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
