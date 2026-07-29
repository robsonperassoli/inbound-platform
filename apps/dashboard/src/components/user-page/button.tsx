import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  `
  flex h-12 flex-1 items-center justify-center
  whitespace-nowrap
  border-2 border-transparent
  px-5 text-base font-medium
  transition-all duration-150
  outline-none
  select-none
  @md/user-page:h-14 @md/user-page:px-7
  `,
  {
    variants: {
      buttonStyle: {
        solid:
          "bg-up-button text-up-button-foreground hover:-translate-y-0.5 hover:brightness-[1.03]",
        outline:
          "border-up-button bg-transparent text-up-button hover:-translate-y-0.5 hover:bg-up-button/10",
        paper:
          "border-[color:color-mix(in_rgb,var(--color-up-button)_50%,black)] bg-up-button text-up-button-foreground shadow-[0_1px_0_rgba(255,255,255,0.14),0_3px_0_rgba(0,0,0,0.08),0_10px_18px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.18),0_4px_0_rgba(0,0,0,0.1),0_14px_22px_rgba(15,23,42,0.14)]",
        shadow:
          "bg-up-button text-up-button-foreground shadow-[0_6px_12px_rgb(0_0_0_/_0.25)] hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgb(0_0_0_/_0.28)]",
        "3d": "bg-up-button text-up-button-foreground shadow-[6px_6px_0px_0px_black] -translate-y-0.5 hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_black] active:translate-y-0.5 active:shadow-none",
        ghost:
          "border-up-button/20 bg-up-button/8 text-up-button shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:-translate-y-0.5 hover:border-up-button/30 hover:bg-up-button/14",
      },
      shape: {
        square: "rounded-none",
        rounded: "rounded-lg",
        pill: "rounded-full",
      },
    },

    defaultVariants: {
      shape: "rounded",
      buttonStyle: "solid",
    },
  },
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  className?: string
  labelClassName?: string
  href?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
  children?: React.ReactNode
  [key: string]: unknown
}

function Button({
  className,
  labelClassName,
  shape = "rounded",
  buttonStyle = "solid",
  href,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ shape, buttonStyle }), className)

  if (href) {
    return (
      <a
        data-slot="button"
        href={href}
        target="_blank"
        className={classes}
        onClick={onClick}
        {...props}
      >
        <span className={labelClassName}>{children}</span>
      </a>
    )
  }

  return (
    <button
      data-slot="button"
      type="button"
      className={classes}
      onClick={onClick}
      {...props}
    >
      <span className={labelClassName}>{children}</span>
    </button>
  )
}

export { Button, buttonVariants }
