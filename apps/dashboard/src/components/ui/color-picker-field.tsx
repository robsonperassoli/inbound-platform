import * as React from "react"
import { HexColorPicker } from "react-colorful"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type ColorPickerFieldProps = {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

const presetColors = [
  { name: "Slate 900", value: "#0f172a" },
  { name: "Gray 700", value: "#374151" },
  { name: "Zinc 500", value: "#71717a" },
  { name: "Stone 300", value: "#d6d3d1" },
  { name: "Red 500", value: "#ef4444" },
  { name: "Amber 400", value: "#fbbf24" },
  { name: "Emerald 500", value: "#10b981" },
  { name: "Sky 500", value: "#0ea5e9" },
  { name: "Blue 600", value: "#2563eb" },
  { name: "Violet 500", value: "#8b5cf6" },
  { name: "Pink 500", value: "#ec4899" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
] as const

function normalizeHex(value: string) {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  const normalized = withHash.toLowerCase()

  if (/^#[0-9a-f]{3}$/.test(normalized)) {
    const [r, g, b] = normalized.slice(1)
    return `#${r}${r}${g}${g}${b}${b}`
  }

  if (/^#[0-9a-f]{6}$/.test(normalized)) {
    return normalized
  }

  return null
}

export function ColorPickerField({
  value,
  onChange,
  className,
  disabled,
}: ColorPickerFieldProps) {
  const [draft, setDraft] = React.useState(value)
  const [open, setOpen] = React.useState(false)
  const isPickerInteractingRef = React.useRef(false)
  const draftRef = React.useRef(value)

  draftRef.current = draft

  React.useEffect(() => {
    setDraft(value)
  }, [value])

  const commitValue = React.useCallback(
    (nextValue: string) => {
      const normalized = normalizeHex(nextValue)
      if (!normalized) {
        setDraft(value)
        return false
      }

      setDraft(normalized)

      if (normalized !== value) {
        onChange(normalized)
      }

      return true
    },
    [onChange, value],
  )

  React.useEffect(() => {
    const handlePointerUp = () => {
      if (!isPickerInteractingRef.current) {
        return
      }

      isPickerInteractingRef.current = false
      commitValue(draftRef.current)
    }

    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)

    return () => {
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [commitValue])

  const handleDraftCommit = () => {
    commitValue(draft)
  }

  const handlePresetSelect = (preset: string) => {
    setDraft(preset)
    onChange(preset)
  }

  const normalizedValue = normalizeHex(value)
  const swatchValue = normalizeHex(draft) ?? normalizedValue ?? "#000000"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup data-disabled={disabled} className={cn("w-32!", className)}>
        <InputGroupAddon align="inline-start" className="pl-1.5">
          <PopoverTrigger asChild>
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-xs"
              style={{ backgroundColor: swatchValue }}
            >
              <span className="block h-full w-full" />
            </InputGroupButton>
          </PopoverTrigger>
        </InputGroupAddon>

        <InputGroupInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleDraftCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleDraftCommit()
            }
          }}
          disabled={disabled}
          className="font-mono tracking-wide"
          aria-label="Hex color value"
        />
      </InputGroup>

      <PopoverContent align="start" className="w-64 gap-3">
        <div
          onPointerDown={() => {
            isPickerInteractingRef.current = true
          }}
        >
          <HexColorPicker
            color={swatchValue}
            onChange={(nextValue) => setDraft(nextValue)}
            className="h-50! w-full!"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {presetColors.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={cn(
                "rounded size-6 shadow-sm",
                swatchValue === preset.value && "border-foreground",
              )}
              style={{ backgroundColor: preset.value }}
              onClick={() => handlePresetSelect(preset.value)}
              aria-label={`Use ${preset.name}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
