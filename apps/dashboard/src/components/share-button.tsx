import { Copy01Icon, Share03Icon, Tick01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useCopyToClipboard } from "@/hooks/copy-to-clipboard"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import { Button } from "./ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./ui/popover"

export const BIO_DOMAIN = "s.uper.bio"

export function ShareButton() {
  const profileData = useSelectedProfile()
  const profile = profileData?.profile
  const { copyToClipboard, copied } = useCopyToClipboard()

  const visibleLink = useMemo(
    () => (profile ? `${BIO_DOMAIN}/${profile.username}` : ""),
    [profile],
  )

  const link = useMemo(
    () => (visibleLink ? `https://${visibleLink}` : ""),
    [visibleLink],
  )

  if (!profile) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost">
          <HugeiconsIcon icon={Share03Icon} />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>Share</PopoverTitle>
          <PopoverDescription>
            Copy and share this link on social media platforms like Facebook,
            Twitter, and LinkedIn.
          </PopoverDescription>
        </PopoverHeader>
        {profile && (
          <InputGroup>
            <InputGroupInput value={link} readOnly />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Copy"
                title="Copy"
                size="icon-xs"
                onClick={() => {
                  copyToClipboard(link)
                }}
              >
                <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        )}
      </PopoverContent>
    </Popover>
  )
}
