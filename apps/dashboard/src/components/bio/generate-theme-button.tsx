import { PaintBoardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useGenerateTheme } from "@/hooks/queries/profiles"

interface GenerateThemeButtonProps {
  profileId: string
}

export function GenerateThemeButton({ profileId }: GenerateThemeButtonProps) {
  const generateTheme = useGenerateTheme()

  const handleClick = async () => {
    try {
      await generateTheme.mutateAsync(profileId)
      toast.success("Magic theme generated!")
    } catch (error) {
      console.error(error)
      toast.error("Could not generate theme")
    }
  }

  const loading = generateTheme.isPending

  return (
    <Button
      variant="outline"
      className="w-full h-12 text-sm font-normal border-border bg-background hover:border-white hover:bg-muted/50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group"
      onClick={handleClick}
      disabled={loading}
    >
      <span className="absolute inset-0 bg-linear-to-r from-blue-600  via-yellow-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[gradient-x_5s_ease_infinite] bg-size-[300%_100%]" />

      <span className="relative flex items-center group-hover:text-white transition-colors duration-300">
        {loading ? (
          <Spinner className="size-5 mr-2" />
        ) : (
          <HugeiconsIcon
            icon={PaintBoardIcon}
            className="size-5 mr-2 text-primary group-hover:text-white transition-colors duration-300"
          />
        )}
        {loading ? (
          "Designing your theme..."
        ) : (
          <>
            <span className="group-hover:hidden">One-Click AI Design</span>
            <span className="hidden group-hover:inline">
              Generate a custom theme
            </span>
          </>
        )}
      </span>
    </Button>
  )
}
