import { Bell, Search, ChevronDown, MessageSquare } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { useTheme } from "@/contexts/useTheme";
import { useUser } from "@/contexts/UserContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./dropdown-menu";
import { motion } from "framer-motion";

export function Header() {
    const { t } = useTheme();
    const { user, logout } = useUser();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full flex h-12 items-center px-4">
                <div className="flex flex-1 items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('search')}
                                className="w-[200px] h-8 pl-8 bg-accent/10 border-accent/20 focus:bg-accent/20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative">
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                                        4
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[300px]">
                                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-[300px] overflow-auto">
                                    {[1, 2, 3, 4].map((i) => (
                                        <DropdownMenuItem key={i} className="flex items-start gap-4 p-4">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <MessageSquare className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">New message from John</p>
                                                <p className="text-xs text-muted-foreground">2 minutes ago</p>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-medium text-primary">
                                                {user?.name?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium hidden sm:inline-block">
                                            {user?.name || t('user')}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={logout}>
                                    {t('logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
} 