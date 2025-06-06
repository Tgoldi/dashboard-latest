import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "relative overflow-hidden bg-gradient-to-r from-primary-400 to-primary-600 text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 hover:from-primary-500 hover:to-primary-700 active:scale-95",
        "gradient-secondary": "relative overflow-hidden bg-gradient-to-r from-secondary-400 to-secondary-600 text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 hover:from-secondary-500 hover:to-secondary-700 active:scale-95",
        "gradient-accent": "relative overflow-hidden bg-gradient-to-r from-accent-400 to-accent-600 text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 hover:from-accent-500 hover:to-accent-700 active:scale-95",
        glass: "relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 text-foreground shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 hover:bg-white/20 active:scale-95",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
