import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";
import type { ButtonProps } from "./types";

export function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: ButtonProps) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
} 