import * as React from "react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  children: React.ReactNode
  onChange: (url: string, file: File) => void | Promise<void>
  accept?: string
  maxSize?: number // in bytes
  className?: string
  disabled?: boolean
}

export function FileUpload({
  children,
  onChange,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  disabled = false,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      console.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
      return
    }

    const url = URL.createObjectURL(file)
    onChange(url, file)

    // Reset input so the same file can be selected again
    e.target.value = ""
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-pointer inline-block",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        disabled={disabled}
      />
    </div>
  )
}
