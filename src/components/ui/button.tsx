import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-xs font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider border",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 border-primary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive",
        outline:
          "border-foreground bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary",
        ghost: "hover:bg-accent hover:text-accent-foreground border-transparent",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-7 px-3 py-1",
        sm: "h-6 px-2",
        lg: "h-8 px-4",
        icon: "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
