import { useTheme } from "@/contexts/useTheme";
import { Layout } from "@/components/ui/layout";
import { AssistantManagement } from "@/components/admin/AssistantManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { PhoneNumberManagement } from "@/components/admin/PhoneNumberManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Bot, Phone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useEffect } from "react";

export default function Admin() {
    const { user } = useUser();
    const { t } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            navigate('/');
        }
    }, [user, navigate]);

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return null;
    }

    const renderContent = () => {
        switch (currentPath) {
            case '/admin/users':
                return <UserManagement />;
            case '/admin/assistants':
                return <AssistantManagement />;
            case '/admin/phone-numbers':
                return <PhoneNumberManagement />;
            default:
                return (
                    <div className="text-center py-8">
                        <h2 className="text-xl font-semibold mb-2">{t('adminPanel')}</h2>
                        <p className="text-muted-foreground">{t('selectAssistant')}</p>
                    </div>
                );
        }
    };

    return (
        <Layout>
            <div className="flex-1">
                <div className="flex items-center justify-between p-8 border-b">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('adminPanel')}</h1>
                        <p className="text-muted-foreground">{t('settings')}</p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('dashboard')}
                    </Button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex gap-4">
                        <Button
                            variant={currentPath === "/admin/assistants" ? "default" : "outline"}
                            onClick={() => navigate('/admin/assistants')}
                            className="flex items-center gap-2"
                        >
                            <Bot className="h-4 w-4" />
                            {t('assistants')}
                        </Button>
                        <Button
                            variant={currentPath === "/admin/users" ? "default" : "outline"}
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            {t('users')}
                        </Button>
                        <Button
                            variant={currentPath === "/admin/phone-numbers" ? "default" : "outline"}
                            onClick={() => navigate('/admin/phone-numbers')}
                            className="flex items-center gap-2"
                        >
                            <Phone className="h-4 w-4" />
                            {t('phoneNumbers')}
                        </Button>
                    </div>

                    <div className="rounded-lg border bg-card">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </Layout>
    );
} 