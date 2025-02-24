import { useTheme } from "@/contexts/useTheme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { QAManagement } from "@/components/editor/QAManagement";
import { PhoneNumberManagement } from "@/components/admin/PhoneNumberManagement";

export default function Editor() {
    const { user } = useUser();
    const { t } = useTheme();
    const navigate = useNavigate();

    // Redirect if not editor
    if (!user || user.role !== 'editor') {
        navigate('/');
        return null;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('dashboard')}
                </Button>
            </div>
            <Tabs defaultValue="qa">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="qa">{t('hotelQuestions')}</TabsTrigger>
                    <TabsTrigger value="phone-numbers">{t('phoneNumbers')}</TabsTrigger>
                </TabsList>
                <TabsContent value="qa">
                    <QAManagement />
                </TabsContent>
                <TabsContent value="phone-numbers">
                    <PhoneNumberManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
} 