import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { 
    Sidebar, 
    SidebarContent, 
    SidebarHeader, 
    SidebarProvider, 
    SidebarFooter,
} from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/useTheme";
import { useUser } from "@/contexts/UserContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {  
    Settings, 
    Phone, 
    LogOut,
    Bot,
    HelpCircle,
    Sun,
    Moon,
    Languages,
    Home,
    Edit,
    Users
} from "lucide-react";
import { Button } from "./button";
import { motion } from "framer-motion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import vapiService from "@/services/vapiService";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface LayoutProps {
    children: ReactNode;
    className?: string;
}

export function Layout({ children, className }: LayoutProps) {
    const { t, isDark, toggleTheme, language, setLanguage } = useTheme();
    const { user, logout } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentAssistantId = searchParams.get('assistant') || user?.default_assistant_id || '';
    const isRTL = language === 'he';
    const isEditorQAForm = location.pathname === '/editor/qa';

    // Fetch available assistants based on user role
    const { data: assistantsResponse } = useQuery({
        queryKey: ['assistants', user?.id],
        queryFn: async () => {
            if (!user) {
                console.log('No user found, returning empty array');
                return { data: [] };
            }

            try {
                console.log('Fetching assistants for user:', {
                    userId: user.id,
                    role: user.role,
                    assignedAssistants: user.assigned_assistants,
                    defaultAssistantId: user.default_assistant_id
                });

                const response = await vapiService.getAssistants();
                console.log('API Response:', response);

                // Only owners see all assistants
                if (user.role === 'owner') {
                    console.log('User is owner, returning all assistants');
                    return response;
                }
                
                // For editors, check default assistant first
                if (user.role === 'editor' && user.default_assistant_id) {
                    console.log('Editor with default assistant:', user.default_assistant_id);
                    const defaultAssistant = response.data.find(a => a.id === user.default_assistant_id);
                    if (defaultAssistant) {
                        console.log('Found default assistant:', defaultAssistant);
                        return {
                            ...response,
                            data: [defaultAssistant]
                        };
                    }
                }

                // For admins and editors with assigned assistants
                if (Array.isArray(user.assigned_assistants) && user.assigned_assistants.length > 0) {
                    console.log('User has assigned assistants:', user.assigned_assistants);
                    const filteredAssistants = response.data.filter(assistant => 
                        user.assigned_assistants?.includes(assistant.id)
                    );
                    console.log('Filtered assistants:', filteredAssistants);

                    return {
                        ...response,
                        data: filteredAssistants
                    };
                }
                
                console.log('No assistants found for user');
                return { data: [] };
            } catch (error) {
                console.error('Error fetching assistants:', error);
                throw error;
            }
        },
        enabled: !!user
    });

    const assistants = assistantsResponse?.data || [];

    // Define menu items based on user role
    const menuItems = [
        // Dashboard is visible to all roles
        {
            label: t('dashboard'),
            icon: <Home className="h-4 w-4" />,
            path: '/',
        },
        // Admin panel is only visible to owners
        ...(user?.role === 'owner' ? [{
            label: t('adminPanel'),
            icon: <Settings className="h-4 w-4" />,
            path: '/admin',
        }] : []),
        // User management is visible to owners and admins
        ...(user?.role === 'owner' || user?.role === 'admin' ? [{
            label: t('userManagement'),
            icon: <Users className="h-4 w-4" />,
            path: '/admin/users',
        }] : []),
        // Editor panel is only visible to editors
        ...(user?.role === 'editor' ? [{
            label: t('editorPanel'),
            icon: <Edit className="h-4 w-4" />,
            path: '/editor',
        }] : []),
        // Phone numbers management is visible to owners and admins
        ...(user?.role === 'owner' || user?.role === 'admin' ? [{
            label: t('phoneNumbers'),
            icon: <Phone className="h-4 w-4" />,
            path: '/admin/phone-numbers',
        }] : [])
    ];

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname === path;
    };

    // For regular users or editor QA form, return a simplified layout without sidebar
    if ((user?.role === 'user' || user?.role === 'editor') && !user.qa_form_submitted && isEditorQAForm) {
        return (
            <div className="min-h-screen h-screen flex overflow-hidden bg-gradient-to-br from-background via-background/95 to-background/90">
                <main className="flex-1 h-screen overflow-hidden">
                    <div className="h-full p-6 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen h-screen flex overflow-hidden bg-gradient-to-br from-background via-background/95 to-background/90">
            <SidebarProvider>
                <Sidebar 
                    variant="inset"
                    collapsible="none"
                    className="fixed top-0 left-0 h-screen w-[280px] border-r border-border/40 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 shadow-2xl"
                    style={{ "--sidebar-width": "280px" } as React.CSSProperties}
                >
                    <div className="flex flex-col h-full">
                        <SidebarHeader className="sticky top-0 z-10 flex flex-col gap-4 p-6 border-b border-border/40 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40">
                            <div className="flex items-center justify-between">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Bot className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                        {t('dashboard')}
                                    </span>
                                </motion.div>
                            </div>

                            {/* Show assistant selector for all roles */}
                            <Select
                                value={currentAssistantId}
                                onValueChange={(value) => setSearchParams({ assistant: value })}
                            >
                                <SelectTrigger className="w-full bg-background/50 border-border/50 hover:bg-background/80 transition-colors">
                                    <SelectValue placeholder={t('selectAssistant')}>
                                        {assistants.find(a => a.id === currentAssistantId)?.name || t('selectAssistant')}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {assistants.map((assistant) => (
                                        <SelectItem 
                                            key={assistant.id} 
                                            value={assistant.id}
                                        >
                                            {assistant.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    className="flex-1 hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
                                    className="flex-1 hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                    <Languages className="h-4 w-4" />
                                </Button>
                            </div>
                        </SidebarHeader>

                        <SidebarContent className="flex-1 overflow-auto px-2">
                            <nav className="grid gap-1 p-2">
                                {menuItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                                            isActive(item.path)
                                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                                : "text-muted-foreground hover:bg-primary/5 hover:text-primary hover:translate-x-1"
                                        )}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </SidebarContent>

                        <SidebarFooter className="border-t border-border/40 p-4 bg-background/60 backdrop-blur-xl">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start hover:bg-primary/5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-medium text-primary">
                                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm font-medium">
                                                    {user?.name || t('user')}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {user?.email}
                                                </span>
                                            </div>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        {t('logout')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarFooter>
                    </div>
                </Sidebar>
                <main className={cn("flex-1 h-screen overflow-hidden pl-[280px]", className)}>
                    <div className="h-full p-6 overflow-auto">
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        </div>
    );
} 