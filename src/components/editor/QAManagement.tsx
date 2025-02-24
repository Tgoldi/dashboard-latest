/** @jsxImportSource react */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Languages } from "lucide-react";
import { useTheme } from "@/contexts/useTheme";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase-browser';
import { QAForm } from "@/components/shared/QAForm";
import { HotelQuestions } from "@/types/user";

const timeFields = [
    'breakfastService',
    'lunchService',
    'dinnerService',
    'poolHours',
    'spaServices',
    'gymFacilities',
    'businessLounge'
] as const;

type TimeField = typeof timeFields[number];

interface MultilingualContent {
    en: string;
    he: string;
}

interface QueryError {
    message: string;
}

interface CustomQuestion {
    key: string;
    value: MultilingualContent;
}

export function QAManagement() {
    const { t, language, setLanguage } = useTheme();
    const { user } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Record<string, MultilingualContent>>({});
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

    // Update user's language preference
    const updateUserLanguage = async (newLanguage: 'en' | 'he') => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ language: newLanguage })
                .eq('id', user?.id);

            if (error) throw error;
            
            // Update the language in the theme context
            setLanguage(newLanguage);
            
            // Update document direction
            document.documentElement.dir = newLanguage === 'he' ? 'rtl' : 'ltr';
            
            // Refetch QA data to get translations
            queryClient.invalidateQueries({ queryKey: ['qa-data'] });
        } catch (error) {
            console.error('Error updating language:', error);
            toast({
                title: t('error'),
                description: 'Failed to update language preference',
                variant: "destructive"
            });
        }
    };

    // Fetch QA data
    const { data: qaData, isLoading, error } = useQuery({
        queryKey: ['qa-data', user?.id],
        queryFn: async () => {
            console.log('Fetching QA data for user:', user?.id);
            const { data, error } = await supabase
                .from('users')
                .select('questions')
                .eq('id', user?.id)
                .single();

            if (error) {
                throw new Error(error.message);
            }
            console.log('Received QA data:', data?.questions);
            return data?.questions as Partial<HotelQuestions>;
        },
        enabled: !!user?.id
    });

    useEffect(() => {
        if (qaData) {
            const standardKeys = [
                'propertyName', 'location', 'breakfastService', 'lunchService',
                'dinnerService', 'poolHours', 'spaServices', 'checkoutProcedures',
                'ironingFacilities', 'iceMachineLocation', 'kidsClubServices',
                'synagogueServices', 'gymFacilities', 'businessLounge',
                'accessibilityFeatures', 'uniqueAmenities', 'contactPerson',
                'contactEmail', 'contactPhone'
            ] as const;

            // Extract standard fields with multilingual support
            const standardFields = Object.fromEntries(
                Object.entries(qaData).filter(([key]) => standardKeys.includes(key as typeof standardKeys[number])).map(([key, value]) => {
                    // If the value is already multilingual, use it as is
                    if (value && typeof value === 'object' && 'en' in value && 'he' in value) {
                        return [key, value as MultilingualContent];
                    }
                    // If it's a string, convert it to multilingual format
                    return [key, { en: value as string, he: value as string }];
                })
            );

            // Extract custom fields with multilingual support
            const customFields = Object.entries(qaData)
                .filter(([key]) => !standardKeys.includes(key as typeof standardKeys[number]))
                .map(([key, value]) => ({
                    key,
                    value: typeof value === 'object' && 'en' in value && 'he' in value
                        ? value as MultilingualContent
                        : { en: value as string, he: value as string }
                }));

            setFormData(standardFields);
            setCustomQuestions(customFields);
        }
    }, [qaData]);

    // Update QA data
    const updateMutation = useMutation({
        mutationFn: async (data: Partial<HotelQuestions>) => {
            const { data: result, error } = await supabase
                .from('users')
                .update({ questions: data })
                .eq('id', user?.id)
                .single();

            if (error) throw new Error(error.message);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qa-data'] });
            setEditMode(false);
            toast({
                title: t('success'),
                description: t('userUpdatedDescription')
            });
        },
        onError: (error) => {
            toast({
                title: t('error'),
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handleEdit = () => {
        // Initialize with current data or defaults for time fields
        const initialData = { ...formData };
        timeFields.forEach(field => {
            if (!initialData[field]) {
                initialData[field] = {
                    en: 'from 09:00 till 18:00',
                    he: 'מ-09:00 עד 18:00'
                };
            }
        });
        setFormData(initialData);
        setEditMode(true);
    };

    const handleSave = () => {
        // Combine and save with multilingual support
        const combinedData = {
            ...formData,
            ...Object.fromEntries(
                customQuestions
                    .filter(({ key, value }) => key && (value.en || value.he))
                    .map(({ key, value }) => [key, value])
            )
        };

        console.log('Saving data:', combinedData);
        updateMutation.mutate(combinedData);
    };

    const getTranslation = (key: string): string => {
        const translation = t[key as keyof typeof t];
        return typeof translation === 'string' ? translation : key;
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {(error as QueryError).message}</div>;
    if (!qaData) return <div>No QA data available</div>;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{t('hotelQuestions')}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateUserLanguage(language === 'en' ? 'he' : 'en')}
                            className="w-10 h-10"
                        >
                            <Languages className="h-5 w-5" />
                        </Button>
                        {!editMode ? (
                            <Button onClick={handleEdit}>{t('edit')}</Button>
                        ) : (
                            <>
                                <Button onClick={handleSave}>{t('save')}</Button>
                                <Button variant="outline" onClick={() => setEditMode(false)}>
                                    {t('cancel')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent dir={language === 'he' ? 'rtl' : 'ltr'}>
                <div className="space-y-4">
                    {editMode ? (
                        <QAForm
                            formData={formData}
                            setFormData={setFormData}
                            customQuestions={customQuestions}
                            setCustomQuestions={setCustomQuestions}
                            timeInputFields={Array.from(timeFields)}
                            currentLanguage={language}
                        />
                    ) : (
                        // Display mode
                        <>
                            {Object.entries(formData).map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                    <div className="font-medium">
                                        {getTranslation(key)}
                                    </div>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {value[language] || '-'}
                                    </div>
                                </div>
                            ))}
                            {customQuestions.map(({ key, value }) => (
                                <div key={key} className="space-y-1">
                                    <div className="font-medium">{key}</div>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {value[language] || '-'}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 