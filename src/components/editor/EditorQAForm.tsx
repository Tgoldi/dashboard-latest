/** @jsxImportSource react */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QAForm } from '@/components/shared/QAForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/useTheme';
import { useUser } from '@/contexts/UserContext';
import { HotelQuestions } from '@/types/user';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Languages } from 'lucide-react';
import { motion } from 'framer-motion';

interface MultilingualContent {
    en: string;
    he: string;
}

interface CustomQuestion {
    key: string;
    value: MultilingualContent;
}

const timeInputFields = [
    'breakfastService',
    'lunchService',
    'dinnerService',
    'poolHours',
    'spaServices',
    'gymFacilities',
    'businessLounge'
];

export function EditorQAForm() {
    const { t, language, setLanguage } = useTheme();
    const { user } = useUser();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Record<string, MultilingualContent>>({});
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

    // Fetch existing QA data
    useEffect(() => {
        const fetchQAData = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabaseAdmin
                    .from('users')
                    .select('questions, qa_form_submitted')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                // If QA form is already submitted, redirect to dashboard
                if (data.qa_form_submitted) {
                    navigate('/');
                    return;
                }

                // Set existing QA data if available
                if (data?.questions) {
                    const standardKeys = [
                        'propertyName', 'location', 'breakfastService', 'lunchService',
                        'dinnerService', 'poolHours', 'spaServices', 'checkoutProcedures',
                        'ironingFacilities', 'iceMachineLocation', 'kidsClubServices',
                        'synagogueServices', 'gymFacilities', 'businessLounge',
                        'accessibilityFeatures', 'uniqueAmenities', 'contactPerson',
                        'contactEmail', 'contactPhone'
                    ];

                    // Extract standard fields with multilingual support
                    const standardFields = Object.fromEntries(
                        Object.entries(data.questions)
                            .filter(([key]) => standardKeys.includes(key))
                            .map(([key, value]) => {
                                const val = value || '';
                                if (typeof val === 'object' && 'en' in val && 'he' in val) {
                                    return [key, val as MultilingualContent];
                                }
                                return [key, { en: String(val), he: String(val) }];
                            })
                    );

                    // Extract custom fields with multilingual support
                    const customFields = Object.entries(data.questions)
                        .filter(([key]) => !standardKeys.includes(key))
                        .map(([key, value]) => {
                            const val = value || '';
                            return {
                                key,
                                value: typeof val === 'object' && 'en' in val && 'he' in val
                                    ? val as MultilingualContent
                                    : { en: String(val), he: String(val) }
                            };
                        });

                    setFormData(standardFields);
                    setCustomQuestions(customFields);
                }
            } catch (error) {
                console.error('Error fetching QA data:', error);
                toast({
                    title: t('error'),
                    description: t('errorFetchingData'),
                    variant: "destructive"
                });
            }
        };

        fetchQAData();
    }, [user?.id, navigate, t, toast]);

    const handleSubmit = async () => {
        if (!user?.id) return;

        setIsLoading(true);
        try {
            // Combine standard and custom questions
            const combinedData = {
                ...formData,
                ...Object.fromEntries(
                    customQuestions
                        .filter(({ key, value }) => key && (value.en || value.he))
                        .map(({ key, value }) => [key, value])
                )
            };

            const { error } = await supabaseAdmin
                .from('users')
                .update({
                    questions: combinedData,
                    qa_form_submitted: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            toast({
                title: t('success'),
                description: t('qaUpdateSuccess')
            });

            // Redirect to dashboard after successful submission
            navigate('/');
        } catch (error) {
            console.error('Error updating QA data:', error);
            toast({
                title: t('error'),
                description: t('errorUpdatingQA'),
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Update user's language preference
    const updateUserLanguage = async (newLanguage: 'en' | 'he') => {
        try {
            const { error } = await supabaseAdmin
                .from('users')
                .update({ language: newLanguage })
                .eq('id', user?.id);

            if (error) throw error;
            
            // Update the language in the theme context
            setLanguage(newLanguage);
            
            // Update document direction
            document.documentElement.dir = newLanguage === 'he' ? 'rtl' : 'ltr';
        } catch (error) {
            console.error('Error updating language:', error);
            toast({
                title: t('error'),
                description: 'Failed to update language preference',
                variant: "destructive"
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Language Switcher */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={() => updateUserLanguage(language === 'en' ? 'he' : 'en')}
                    className="flex items-center gap-2 text-base"
                >
                    <Languages className="h-5 w-5" />
                    {language === 'en' ? 'עברית' : 'English'}
                </Button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card>
                    <CardHeader className="space-y-6">
                        <div>
                            <CardTitle className="text-3xl font-bold">
                                {t('welcomeEditor')}
                            </CardTitle>
                            <CardDescription className="mt-2 text-lg">
                                {t('beforeWeContinue')}
                            </CardDescription>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                {t('editorQADescription')}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <QAForm
                            formData={formData}
                            setFormData={setFormData}
                            customQuestions={customQuestions}
                            setCustomQuestions={setCustomQuestions}
                            timeInputFields={timeInputFields}
                            currentLanguage={language}
                            submitButton={
                                <Button
                                    onClick={handleSubmit}
                                    className="w-full mt-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('saving') : t('continue')}
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
} 