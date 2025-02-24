import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/useTheme";
import { useUser } from "@/contexts/UserContext";
import {
    Calendar,
    CreditCard,
    Settings,
    User,
    LogOut,
    Sun,
    Moon,
    Languages,
    Search,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const { isDark, toggleTheme, language, setLanguage, t } = useTheme();
    const { user, logout } = useUser();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleCommand = (command: string) => {
        switch (command) {
            case "theme":
                toggleTheme();
                break;
            case "language":
                setLanguage(language === "en" ? "he" : "en");
                break;
            case "profile":
                navigate("/profile");
                break;
            case "settings":
                navigate("/settings");
                break;
            case "admin":
                navigate("/admin");
                break;
            case "editor":
                navigate("/editor");
                break;
            case "logout":
                logout();
                break;
        }
        setOpen(false);
    };

    return (
        <AnimatePresence>
            {open && (
                <CommandDialog open={open} onOpenChange={setOpen}>
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <CommandInput 
                            placeholder={t("name")} 
                            className="pl-10 pr-4"
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                    </div>
                    <CommandList className="max-h-[400px] overflow-y-auto">
                        <CommandEmpty className="py-6 text-center text-sm">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {t("error")}
                            </motion.div>
                        </CommandEmpty>

                        <CommandGroup heading={t("dashboard")} className="px-2">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ staggerChildren: 0.1 }}
                            >
                                <CommandItem 
                                    onSelect={() => handleCommand("profile")}
                                    className="group relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors"
                                >
                                    <User className="mr-2 h-4 w-4 text-primary" />
                                    <span>{t("profile")}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </CommandItem>
                                <CommandItem 
                                    onSelect={() => handleCommand("settings")}
                                    className="group relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors"
                                >
                                    <Settings className="mr-2 h-4 w-4 text-primary" />
                                    <span>{t("settings")}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </CommandItem>
                                {user?.role === "admin" && (
                                    <CommandItem 
                                        onSelect={() => handleCommand("admin")}
                                        className="group relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors"
                                    >
                                        <CreditCard className="mr-2 h-4 w-4 text-primary" />
                                        <span>{t("adminPanel")}</span>
                                        <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </CommandItem>
                                )}
                                {user?.role === "editor" && (
                                    <CommandItem 
                                        onSelect={() => handleCommand("editor")}
                                        className="group relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors"
                                    >
                                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                                        <span>{t("editorPanel")}</span>
                                        <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </CommandItem>
                                )}
                            </motion.div>
                        </CommandGroup>

                        <CommandSeparator className="my-2" />

                        <CommandGroup heading={t("settings")} className="px-2">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ staggerChildren: 0.1, delay: 0.1 }}
                            >
                                <CommandItem 
                                    onSelect={() => handleCommand("theme")}
                                    className="group relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors"
                                >
                                    {isDark ? (
                                        <Sun className="mr-2 h-4 w-4 text-primary" />
                                    ) : (
                                        <Moon className="mr-2 h-4 w-4 text-primary" />
                                    )}
                                    <span>{isDark ? t("lightMode") : t("darkMode")}</span>
                                    <CommandShortcut className="ml-auto text-xs text-muted-foreground">⌘T</CommandShortcut>
                                </CommandItem>
                                <CommandItem 
                                    onSelect={() => handleCommand("language")}
                                    className="group relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors"
                                >
                                    <Languages className="mr-2 h-4 w-4 text-primary" />
                                    <span>{t("language")}</span>
                                    <CommandShortcut className="ml-auto text-xs text-muted-foreground">⌘L</CommandShortcut>
                                </CommandItem>
                            </motion.div>
                        </CommandGroup>

                        <CommandSeparator className="my-2" />

                        <CommandGroup heading={t("user")} className="px-2">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ staggerChildren: 0.1, delay: 0.2 }}
                            >
                                <CommandItem 
                                    onSelect={() => handleCommand("logout")} 
                                    className="group relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors text-red-600 dark:text-red-400"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>{t("logout")}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </CommandItem>
                            </motion.div>
                        </CommandGroup>
                    </CommandList>
                </CommandDialog>
            )}
        </AnimatePresence>
    );
} 