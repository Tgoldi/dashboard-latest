// External Dependencies
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/useTheme";

// Components
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CallStatsPieChart } from "@/components/dashboard/CallStatsPieChart";
import { cn } from "@/lib/utils";

// Types
interface StatCardProps {
    title: string;
    value?: number;
    description?: string;
    icon?: ReactNode;
    trend?: number;
    variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'default';
    additionalInfo?: string;
    callStats?: {
        completed: number;
        failed: number;
        userHangup: number;
        assistantHangup: number;
    };
    className?: string;
}

/**
 * StatCard Component
 * Displays a statistic with an optional icon and different color variants
 */
export function StatCard({ title, value, description, icon, trend, variant = 'primary', additionalInfo, callStats, className }: StatCardProps) {
    const { language, t } = useTheme();
    const isRTL = language === 'he';
    const [isOpen, setIsOpen] = useState(false);
    
    const getVariantStyles = (variant: StatCardProps['variant']) => {
        switch (variant) {
            case 'primary':
                return 'bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30 hover:border-primary/30 dark:hover:border-primary/40';
            case 'secondary':
                return 'bg-secondary/10 dark:bg-secondary/20 border-secondary/20 dark:border-secondary/30 hover:border-secondary/30 dark:hover:border-secondary/40';
            case 'accent':
                return 'bg-accent/10 dark:bg-accent/20 border-accent/20 dark:border-accent/30 hover:border-accent/30 dark:hover:border-accent/40';
            case 'success':
                return 'bg-emerald-100/10 dark:bg-emerald-900/20 border-emerald-200/20 dark:border-emerald-800/30 hover:border-emerald-300/30 dark:hover:border-emerald-700/40';
            case 'warning':
                return 'bg-amber-100/10 dark:bg-amber-900/20 border-amber-200/20 dark:border-amber-800/30 hover:border-amber-300/30 dark:hover:border-amber-700/40';
            default:
                return 'bg-card hover:bg-card/80 border-border/50';
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <motion.div
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        'p-6 rounded-xl border backdrop-blur-sm transition-colors duration-200',
                        getVariantStyles(variant),
                        'shadow-lg hover:shadow-xl',
                        className
                    )}
                >
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between space-y-0`}>
                        <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <p className="text-sm font-medium text-muted-foreground/80">
                                {title}
                            </p>
                            <div className={`flex items-baseline ${isRTL ? 'flex-row-reverse' : ''} space-x-2`}>
                                {value === undefined ? (
                                    <Skeleton className="h-7 w-20" />
                                ) : (
                                    <>
                                        <motion.h2
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                                        >
                                            {value.toLocaleString()}
                                        </motion.h2>
                                        {trend !== undefined && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={cn(
                                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                                    trend > 0 
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                                                        : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                                                )}
                                            >
                                                {trend > 0 ? "+" : ""}{trend}%
                                            </motion.span>
                                        )}
                                    </>
                                )}
                            </div>
                            {description && (
                                <p className="text-xs text-muted-foreground/70">
                                    {description}
                                </p>
                            )}
                        </div>
                        {icon && (
                            <motion.div
                                whileHover={{ rotate: 15, scale: 1.1 }}
                                className={cn(
                                    "p-2.5 rounded-xl",
                                    variant === 'primary' && "bg-primary/10 text-primary",
                                    variant === 'secondary' && "bg-secondary/10 text-secondary",
                                    variant === 'accent' && "bg-accent/10 text-accent",
                                    variant === 'success' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
                                    variant === 'warning' && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
                                    variant === 'default' && "bg-muted text-muted-foreground"
                                )}
                            >
                                {icon}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </DialogTrigger>
            {callStats && (
                <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-background to-background/80 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {icon && <span className="text-xl">{icon}</span>}
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground/80">{t('callOutcomes')}</DialogDescription>
                    </DialogHeader>
                    <div className="p-4 h-[450px] bg-card/50 rounded-lg border border-border/50">
                        <CallStatsPieChart data={callStats} />
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}