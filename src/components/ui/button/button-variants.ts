import { cva } from "class-variance-authority";

export const buttonVariants = cva(
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
                solid: "relative overflow-hidden bg-primary text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 hover:bg-primary/90 active:scale-95",
                "solid-secondary": "relative overflow-hidden bg-secondary text-secondary-foreground shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 hover:bg-secondary/90 active:scale-95",
                "solid-accent": "relative overflow-hidden bg-accent text-accent-foreground shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 hover:bg-accent/90 active:scale-95",
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
); 