import { encode } from "@toon-format/toon"
import * as forms from "../forms/index"
import * as profiles from "../profiles/index"
import type { getThreadById } from "../chat/index"

type Thread = NonNullable<Awaited<ReturnType<typeof getThreadById>>>

export async function buildThreadState(thread: Thread) {
  if (thread.type === "formBuilder") {
    if (!thread.formId) {
      return "FORM DEFINITION: Form not created yet"
    }

    const form = await forms.getFormById(thread.formId)
    if (!form) {
      return "FORM DEFINITION: Form not created yet"
    }

    const formData = {
      title: form.title,
      description: form.description,
      fields: form.fields,
    }

    return `FORM DEFINITION: ${encode(formData)}`
  }

  if (thread.type === "formSubmission") {
    if (!thread.formId) {
      throw new Error("Form submission thread missing formId")
    }

    const form = await forms.getFormById(thread.formId)
    if (!form) {
      throw new Error("Form not found for thread")
    }

    let collectedValues: unknown = null
    if (thread.formSubmissionId) {
      const submission = await forms.getSubmissionById(thread.formSubmissionId)
      collectedValues = submission?.values ?? null
    }

    return `
    FORM_DEFINITION: ${encode(form.fields)}
    COLLECTED_VALUES: ${encode(collectedValues)}
    `
  }

  if (thread.type === "themeDesigner") {
    if (!thread.profileId) {
      throw new Error("Theme designer thread missing profileId")
    }

    const profile = await profiles.getProfileById(thread.profileId)
    if (!profile) {
      throw new Error("Profile not found for thread")
    }

    const themeValues = {
      theme: profile.theme,
      backgroundColor: profile.backgroundColor,
      backgroundImage: profile.backgroundImageKey,
      fontFamily: profile.fontFamily,
      textColor: profile.textColor,
      buttonShape: profile.buttonShape,
      buttonStyle: profile.buttonStyle,
      buttonColor: profile.buttonColor,
      buttonTextColor: profile.buttonTextColor,
    }

    return `CURRENT_THEME:\n${encode(themeValues)}`
  }

  throw new Error("Thread type not handled")
}
