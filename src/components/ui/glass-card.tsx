import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    variant?: "primary" | "secondary" | "accent" | "success" | "warning";
    hover?: boolean;
    onClick?: () => void;
}

export function GlassCard({ 
    children, 
    className, 
    variant = "primary",
    hover = true,
    onClick 
}: GlassCardProps) {
    const variantStyles = {
        primary: "bg-primary/10 dark:bg-primary/20",
        secondary: "bg-secondary/10 dark:bg-secondary/20",
        accent: "bg-accent/10 dark:bg-accent/20",
        success: "bg-success-100/50 dark:bg-success-900/20",
        warning: "bg-warning-100/50 dark:bg-warning-900/20",
    };

    return (
        <motion.div
            whileHover={hover ? { 
                scale: 1.02,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
            } : undefined}
            whileTap={hover ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-xl border backdrop-blur-md",
                "border-white/20 shadow-xl dark:border-white/10",
                variantStyles[variant],
                hover && "cursor-pointer",
                className
            )}
        >
            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Hover effect */}
            {hover && (
                <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 0.1 }}
                    className={cn(
                        "absolute inset-0",
                        variant === "primary" && "bg-primary",
                        variant === "secondary" && "bg-secondary",
                        variant === "accent" && "bg-accent",
                        variant === "success" && "bg-success-500",
                        variant === "warning" && "bg-warning-500"
                    )}
                />
            )}
        </motion.div>
    );
} 