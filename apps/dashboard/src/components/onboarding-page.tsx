import { useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  type ComponentProps,
  type FormEvent,
  startTransition,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"
import z from "zod"
import logo from "@/assets/logo.svg"
import { PostHogUserIdentify } from "@/components/posthog-user-identity"
import { BIO_DOMAIN } from "@/components/share-button"
import { Button } from "@/components/ui/button"
import { FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"
import { setSelectedProfile } from "@/stores/profiles"

const createProfileSchema = z.object({
  title: z.string().trim().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Use letters, numbers, underscores, and hyphens only",
    ),
  bio: z.string().trim().min(2, "Bio must be at least 2 characters"),
})

const starterLinks = [
  {
    title: "Book a call",
    url: "https://cal.com",
  },
  {
    title: "Visit website",
    url: "https://example.com",
  },
  {
    title: "Latest work",
    url: "https://www.behance.net",
  },
] as const

const bioInspirationOptions = [
  "Founder building tools for modern teams",
  "Designer crafting brands and websites",
  "Helping startups grow through better marketing",
  "Creator sharing ideas on product and growth",
  "Operator building systems that scale",
] as const

const stepOrder = ["intro", "title", "username", "bio"] as const

const previousStepByStep = {
  title: "intro",
  username: "title",
  bio: "username",
} as const satisfies Record<Exclude<Step, "intro">, Step>

const introHighlights = [
  {
    title: "Start with a strong base",
    description: "Your page gets a starter theme and ready-to-edit layout.",
  },
  {
    title: "Skip the blank canvas",
    description: "We add a few starter links so you can publish faster.",
  },
  {
    title: "Change everything later",
    description:
      "Update your colors, copy, links, and layout right after setup.",
  },
] as const

const fieldSurfaceClassName =
  "border-[#2D2E2C]/12 bg-white/82 shadow-[0_18px_44px_rgba(45,46,44,0.07)] backdrop-blur-sm"

type Step = (typeof stepOrder)[number]
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "error"
type MotionTransition = ComponentProps<typeof motion.div>["transition"]

const questions: Record<
  Step,
  {
    eyebrow: string
    title: string
    description: string
  }
> = {
  intro: {
    eyebrow: "Welcome aboard",
    title: "Let's launch your first page.",
    description:
      "We only need three quick details before we get started: your page name, your URL handle, and a short bio.",
  },
  title: {
    eyebrow: "Name your page",
    title: "What should visitors call you?",
    description:
      "Use your real name, your brand, or the name you want on the page header.",
  },
  username: {
    eyebrow: "Claim your URL",
    title: "Pick the username for your page link.",
    description:
      "We suggested one from your sign-in details. You can change it now and edit it later.",
  },
  bio: {
    eyebrow: "Add one quick intro",
    title: "What should people know before they click?",
    description:
      "A short sentence is enough. You can fine-tune your copy after the page is live.",
  },
}

function getQuestion(step: Step) {
  return questions[step]
}

function getStepProgress(step: Step) {
  if (step === "intro") {
    return 0
  }

  return (stepOrder.indexOf(step) / (stepOrder.length - 1)) * 100
}

function getTitleError(value: string) {
  return createProfileSchema.shape.title.safeParse(value.trim()).error
    ?.issues[0]?.message
}

function getUsernameError(value: string) {
  return createProfileSchema.shape.username.safeParse(value.trim()).error
    ?.issues[0]?.message
}

function getBioError(value: string) {
  return createProfileSchema.shape.bio.safeParse(value.trim()).error?.issues[0]
    ?.message
}

function getUsernameStatusText({
  normalizedUsername,
  usernameBlurred,
  usernameError,
  usernameStatus,
  lastCheckedUsername,
}: {
  normalizedUsername: string
  usernameBlurred: boolean
  usernameError?: string
  usernameStatus: UsernameStatus
  lastCheckedUsername: string
}) {
  if (!normalizedUsername) {
    return usernameBlurred && usernameError
      ? usernameError
      : "Choose a unique handle for your page URL."
  }

  if (usernameError) {
    return usernameBlurred
      ? usernameError
      : "Use 3-30 characters with letters, numbers, _ or -."
  }

  if (usernameStatus === "checking") {
    return "Checking username availability…"
  }

  if (
    usernameStatus === "available" &&
    lastCheckedUsername === normalizedUsername
  ) {
    return `Available. Your page will live at ${BIO_DOMAIN}/${normalizedUsername}`
  }

  if (usernameStatus === "taken") {
    return "This username is already taken."
  }

  if (usernameStatus === "error") {
    return "Could not verify availability right now."
  }

  return `Your page will live at ${BIO_DOMAIN}/${normalizedUsername}`
}

function getPrimaryActionLabel({
  step,
  isSubmitting,
  usernameStatus,
}: {
  step: Step
  isSubmitting: boolean
  usernameStatus: UsernameStatus
}) {
  if (isSubmitting) {
    return "Creating…"
  }

  if (step === "intro") {
    return "Let's Get Started"
  }

  if (step === "bio") {
    return "Create My Page"
  }

  if (step === "username" && usernameStatus === "checking") {
    return "Checking…"
  }

  return "Continue"
}

function useUsernameAvailability(username: string) {
  const initialUsername = username.trim()
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>(
    initialUsername ? "available" : "idle",
  )
  const [lastCheckedUsername, setLastCheckedUsername] =
    useState(initialUsername)
  const [usernameBlurred, setUsernameBlurred] = useState(false)
  const requestRef = useRef(0)

  const resetUsernameAvailability = useEffectEvent(() => {
    requestRef.current += 1
    setUsernameStatus("idle")
    setLastCheckedUsername("")
  })

  const checkUsernameAvailability = useEffectEvent(
    async (value: string): Promise<UsernameStatus> => {
      const normalized = value.trim()
      const validationError = getUsernameError(normalized)

      if (!normalized || validationError) {
        setUsernameStatus("idle")
        setLastCheckedUsername("")
        return "idle"
      }

      if (normalized === lastCheckedUsername) {
        if (usernameStatus === "available" || usernameStatus === "taken") {
          return usernameStatus
        }
      }

      const requestId = ++requestRef.current
      setUsernameStatus("checking")

      try {
        const { available } = await apiClient.isUsernameAvailable(normalized)

        if (requestId !== requestRef.current) {
          return "idle"
        }

        setLastCheckedUsername(normalized)
        const nextStatus = available ? "available" : "taken"
        setUsernameStatus(nextStatus)
        return nextStatus
      } catch {
        if (requestId !== requestRef.current) {
          return "idle"
        }

        setUsernameStatus("error")
        return "error"
      }
    },
  )

  useEffect(() => {
    const normalized = username.trim()

    if (!normalized || getUsernameError(normalized)) {
      return
    }

    const timeout = setTimeout(() => {
      void checkUsernameAvailability(normalized)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [username])

  return {
    checkUsernameAvailability,
    lastCheckedUsername,
    resetUsernameAvailability,
    setUsernameBlurred,
    usernameBlurred,
    usernameStatus,
  }
}

export function OnboardingPage({
  draft,
  greetingName,
}: {
  draft: {
    title: string
    username: string
    bio: string
  }
  greetingName: string
}) {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const [step, setStep] = useState<Step>("intro")
  const [title, setTitle] = useState(draft.title)
  const [username, setUsername] = useState(draft.username)
  const [bio, setBio] = useState(draft.bio)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showTitleError, setShowTitleError] = useState(false)
  const [showBioError, setShowBioError] = useState(false)

  const titleFieldId = useId()
  const titleFeedbackId = useId()
  const usernameFieldId = useId()
  const usernameFeedbackId = useId()
  const bioFieldId = useId()
  const bioFeedbackId = useId()

  const titleError = getTitleError(title)
  const normalizedUsername = username.trim()
  const usernameError = getUsernameError(username)
  const bioError = getBioError(bio)
  const question = getQuestion(step)
  const progress = getStepProgress(step)
  const motionTransition: MotionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: "easeOut" }

  const {
    checkUsernameAvailability,
    lastCheckedUsername,
    resetUsernameAvailability,
    setUsernameBlurred,
    usernameBlurred,
    usernameStatus,
  } = useUsernameAvailability(username)

  const usernameStatusText = getUsernameStatusText({
    normalizedUsername,
    usernameBlurred,
    usernameError,
    usernameStatus,
    lastCheckedUsername,
  })

  const isUsernameInvalid = Boolean(
    usernameError && (normalizedUsername || usernameBlurred),
  )
  const isUsernameAvailable =
    usernameStatus === "available" && lastCheckedUsername === normalizedUsername
  const isCheckingUsername =
    step === "username" && usernameStatus === "checking"
  const isBusy = isSubmitting || isCheckingUsername
  const primaryActionLabel = getPrimaryActionLabel({
    step,
    isSubmitting,
    usernameStatus,
  })

  function goToStep(nextStep: Step) {
    setSubmitError(null)
    setStep(nextStep)
  }

  function handleTitleChange(nextValue: string) {
    setTitle(nextValue)
    setSubmitError(null)
  }

  function handleUsernameChange(nextValue: string) {
    resetUsernameAvailability()
    setUsername(nextValue)
    setSubmitError(null)
  }

  function handleUsernameBlur() {
    setUsernameBlurred(true)

    if (usernameError) {
      resetUsernameAvailability()
      return
    }

    if (!normalizedUsername) {
      return
    }

    void checkUsernameAvailability(normalizedUsername)
  }

  function handleBioChange(nextValue: string) {
    setBio(nextValue)
    setSubmitError(null)
  }

  async function continueFromUsername() {
    setUsernameBlurred(true)

    if (usernameError) {
      resetUsernameAvailability()
      return
    }

    const availability = await checkUsernameAvailability(normalizedUsername)

    if (availability === "available") {
      goToStep("bio")
    }
  }

  async function submitProfile() {
    setShowTitleError(true)
    setShowBioError(true)
    setUsernameBlurred(true)
    setSubmitError(null)

    if (titleError || usernameError || bioError) {
      return
    }

    setIsSubmitting(true)

    try {
      const availability = await checkUsernameAvailability(normalizedUsername)

      if (availability !== "available") {
        setSubmitError(
          availability === "error"
            ? "Could not verify username availability right now"
            : availability === "taken"
              ? "Username is already taken"
              : "Choose a valid username",
        )
        return
      }

      const { profile } = await apiClient.createProfile({
        title: title.trim(),
        username: normalizedUsername,
        bio: bio.trim(),
      })

      await Promise.all(
        starterLinks.map((link, order) =>
          apiClient.createLink(profile.id, {
            title: link.title,
            type: "url",
            url: link.url,
            order,
            active: true,
          }),
        ),
      )

      toast.success("Page created")
      startTransition(() => {
        setSelectedProfile(profile.id)
      })
      await navigate({ to: "/bio" })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create page"
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStepSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (step === "intro") {
      goToStep("title")
      return
    }

    if (step === "title") {
      setShowTitleError(true)

      if (!titleError) {
        goToStep("username")
      }

      return
    }

    if (step === "username") {
      void continueFromUsername()
      return
    }

    void submitProfile()
  }

  function handleBack() {
    if (step === "intro") {
      return
    }

    goToStep(previousStepByStep[step])
  }

  return (
    <>
      <PostHogUserIdentify />

      <main className="fixed inset-0 z-50 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(238,122,100,0.16),transparent_26%),radial-gradient(circle_at_84%_18%,rgba(248,199,81,0.14),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(113,208,172,0.16),transparent_24%),linear-gradient(180deg,#fffdf9_0%,#ffffff_38%,#f8fbfa_100%)] text-[#2D2E2C]">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute top-20 left-[7%] h-56 w-56 rounded-full bg-[#EE7A64]/10 blur-3xl" />
          <div className="absolute top-[16%] right-[10%] h-40 w-40 rounded-full bg-[#F7C664]/12 blur-3xl" />
          <div className="absolute right-[8%] bottom-16 h-64 w-64 rounded-full bg-[#71D0AC]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-full w-full max-w-3xl items-start px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
          <div className="w-full space-y-10">
            <OnboardingHeader
              progress={progress}
              transition={motionTransition}
            />

            <AnimatePresence mode="wait">
              <motion.section
                key={step}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12 }
                }
                transition={motionTransition}
              >
                <form
                  onSubmit={handleStepSubmit}
                  aria-busy={isSubmitting}
                  className="space-y-12"
                >
                  {step === "intro" ? (
                    <IntroStep
                      greetingName={greetingName}
                      description={question.description}
                    />
                  ) : (
                    <QuestionStep
                      title={question.title}
                      description={question.description}
                    >
                      {step === "title" ? (
                        <TitleStepField
                          fieldId={titleFieldId}
                          feedbackId={titleFeedbackId}
                          value={title}
                          error={titleError}
                          showError={showTitleError}
                          disabled={isBusy}
                          onChange={handleTitleChange}
                        />
                      ) : null}

                      {step === "username" ? (
                        <UsernameStepField
                          fieldId={usernameFieldId}
                          feedbackId={usernameFeedbackId}
                          value={username}
                          statusText={usernameStatusText}
                          isChecking={usernameStatus === "checking"}
                          isInvalid={isUsernameInvalid}
                          isAvailable={isUsernameAvailable}
                          disabled={isBusy}
                          onBlur={handleUsernameBlur}
                          onChange={handleUsernameChange}
                        />
                      ) : null}

                      {step === "bio" ? (
                        <BioStepField
                          fieldId={bioFieldId}
                          feedbackId={bioFeedbackId}
                          value={bio}
                          error={bioError}
                          showError={showBioError}
                          disabled={isBusy}
                          onChange={handleBioChange}
                        />
                      ) : null}
                    </QuestionStep>
                  )}

                  <OnboardingFooter
                    step={step}
                    submitError={submitError}
                    isBusy={isBusy}
                    isSubmitting={isSubmitting}
                    onBack={handleBack}
                    primaryActionLabel={primaryActionLabel}
                  />
                </form>
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  )
}

function OnboardingHeader({
  progress,
  transition,
}: {
  progress: number
  transition: MotionTransition
}) {
  return (
    <header className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex justify-between items-center w-full ">
          <img src={logo} alt="Inbound.click" className="h-5 w-auto" />

          <div className="w-full max-w-52 space-y-2 sm:w-52">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2D2E2C]/52">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#2D2E2C]/8">
              <motion.div
                className="h-full rounded-full bg-[#2D2E2C]"
                animate={{ width: `${progress}%` }}
                transition={transition}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function IntroStep({
  greetingName,
  description,
}: {
  greetingName: string
  description: string
}) {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl">
          Welcome, {greetingName}.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-[#2D2E2C]/70 sm:text-xl">
          {description}
        </p>
      </div>

      <div className="grid gap-5 border-t border-[#2D2E2C]/10 py-6 sm:grid-cols-3 sm:gap-6 sm:py-7">
        {introHighlights.map((highlight) => (
          <div key={highlight.title} className="space-y-2">
            <p className="text-sm font-semibold">{highlight.title}</p>
            <p className="text-sm leading-6 text-[#2D2E2C]/66">
              {highlight.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuestionStep({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ComponentProps<"div">["children"]
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-xl text-base leading-7 text-[#2D2E2C]/66 sm:text-lg">
          {description}
        </p>
      </div>

      {children}
    </div>
  )
}

function TitleStepField({
  fieldId,
  feedbackId,
  value,
  error,
  showError,
  disabled,
  onChange,
}: {
  fieldId: string
  feedbackId: string
  value: string
  error?: string
  showError: boolean
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <FieldLabel
        htmlFor={fieldId}
        className="text-sm font-semibold text-[#2D2E2C]"
      >
        Page name
      </FieldLabel>
      <InputGroup
        className={cn("h-16 rounded-[1.6rem] sm:h-18", fieldSurfaceClassName)}
      >
        <InputGroupInput
          id={fieldId}
          name="title"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Alex Jordan…"
          className="px-6 text-xl sm:text-2xl"
          autoComplete="name"
          autoFocus
          disabled={disabled}
          aria-invalid={Boolean(showError && error)}
          aria-describedby={feedbackId}
        />
      </InputGroup>
      {showError && error ? (
        <FieldError id={feedbackId}>{error}</FieldError>
      ) : (
        <FieldDescription id={feedbackId}>
          This is the name visitors will see at the top of your page.
        </FieldDescription>
      )}
    </div>
  )
}

function UsernameStepField({
  fieldId,
  feedbackId,
  value,
  statusText,
  isChecking,
  isInvalid,
  isAvailable,
  disabled,
  onBlur,
  onChange,
}: {
  fieldId: string
  feedbackId: string
  value: string
  statusText: string
  isChecking: boolean
  isInvalid: boolean
  isAvailable: boolean
  disabled: boolean
  onBlur: () => void
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <FieldLabel
        htmlFor={fieldId}
        className="text-sm font-semibold text-[#2D2E2C]"
      >
        Public URL
      </FieldLabel>
      <InputGroup
        className={cn("h-16 rounded-[1.6rem] sm:h-18", fieldSurfaceClassName)}
      >
        <InputGroupAddon className="pl-6 text-sm text-[#2D2E2C]/48 sm:text-base">
          {BIO_DOMAIN}/
        </InputGroupAddon>
        <InputGroupInput
          id={fieldId}
          name="username"
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder="alex-jordan…"
          className="pr-6 text-xl sm:text-2xl"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          disabled={disabled}
          aria-invalid={isInvalid}
          aria-describedby={feedbackId}
        />
      </InputGroup>
      <FieldDescription
        id={feedbackId}
        aria-live="polite"
        className={cn(
          "flex items-center gap-2",
          isInvalid && "text-destructive",
          isAvailable && "text-emerald-700",
        )}
      >
        {isChecking ? <Spinner className="size-4" /> : null}
        {statusText}
      </FieldDescription>
    </div>
  )
}

function BioStepField({
  fieldId,
  feedbackId,
  value,
  error,
  showError,
  disabled,
  onChange,
}: {
  fieldId: string
  feedbackId: string
  value: string
  error?: string
  showError: boolean
  disabled: boolean
  onChange: (value: string) => void
}) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    if (value.length > 0) {
      return
    }

    const interval = setInterval(() => {
      setPlaceholderIndex((currentIndex) => {
        return (currentIndex + 1) % bioInspirationOptions.length
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [value])

  const bioPlaceholder = bioInspirationOptions[placeholderIndex]

  return (
    <div className="space-y-4">
      <FieldLabel
        htmlFor={fieldId}
        className="text-sm font-semibold text-[#2D2E2C]"
      >
        Short intro
      </FieldLabel>
      <InputGroup
        className={cn("min-h-52 rounded-[1.9rem]", fieldSurfaceClassName)}
      >
        <InputGroupTextarea
          id={fieldId}
          name="bio"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={bioPlaceholder}
          className="min-h-52 px-6 py-6 text-base leading-8 sm:text-lg"
          autoComplete="off"
          autoFocus
          disabled={disabled}
          aria-invalid={Boolean(showError && error)}
          aria-describedby={feedbackId}
        />
      </InputGroup>
      {showError && error ? (
        <FieldError id={feedbackId}>{error}</FieldError>
      ) : (
        <FieldDescription id={feedbackId}>
          Keep it simple for now. The placeholder rotates through example bios
          every few seconds while the field is empty.
        </FieldDescription>
      )}
    </div>
  )
}

function OnboardingFooter({
  step,
  submitError,
  isBusy,
  isSubmitting,
  onBack,
  primaryActionLabel,
}: {
  step: Step
  submitError: string | null
  isBusy: boolean
  isSubmitting: boolean
  onBack: () => void
  primaryActionLabel: string
}) {
  return (
    <div className="space-y-5 border-t border-[#2D2E2C]/10 pt-6 sm:pt-7">
      {submitError ? (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#2D2E2C]/60">
          {step === "intro" ? (
            <span>About a minute to finish.</span>
          ) : (
            <span>
              Step {stepOrder.indexOf(step)} of {stepOrder.length - 1}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {step !== "intro" ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onBack}
              disabled={isBusy}
              className="border border-[#2D2E2C]/12 bg-white/60 text-[#2D2E2C] hover:bg-white"
            >
              Back
            </Button>
          ) : null}
          <Button
            type="submit"
            size="lg"
            disabled={isBusy}
            className={cn(
              "min-w-44 bg-[#2D2E2C] text-white shadow-[0_14px_34px_rgba(45,46,44,0.18)] hover:bg-[#2D2E2C]/92",
              step === "intro" &&
                !isSubmitting &&
                "motion-safe:animate-[onboardingCtaPulse_3.2s_ease-in-out_infinite] motion-reduce:animate-none",
            )}
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                {primaryActionLabel}
              </>
            ) : (
              primaryActionLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
