/** @jsxImportSource react */
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useTheme } from "@/contexts/useTheme";
import { HotelQuestions } from "@/types/user";
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from 'framer-motion';
import { TimeSelector } from './TimeSelector';

interface MultilingualContent {
    en: string;
    he: string;
}

interface QAFormProps {
    formData: Record<string, MultilingualContent>;
    setFormData: (data: Record<string, MultilingualContent>) => void;
    customQuestions: Array<{ key: string; value: MultilingualContent }>;
    setCustomQuestions: (questions: Array<{ key: string; value: MultilingualContent }>) => void;
    timeInputFields?: string[];
    currentLanguage: 'en' | 'he';
    submitButton?: React.ReactNode;
}

export function QAForm({ 
    formData, 
    setFormData, 
    customQuestions, 
    setCustomQuestions, 
    timeInputFields = [], 
    currentLanguage,
    submitButton 
}: QAFormProps) {
    const { t } = useTheme();
    const [currentSection, setCurrentSection] = useState(0);
    const isRTL = currentLanguage === 'he';
    const [showTimeFormatHint, setShowTimeFormatHint] = useState<Record<string, boolean>>({});

    const sections = [
        {
            title: t('propertyInformation'),
            fields: ['propertyName', 'location']
        },
        {
            title: t('servicesAndAmenities'),
            fields: ['breakfastService', 'lunchService', 'dinnerService']
        },
        {
            title: t('poolAndSpa'),
            fields: ['poolHours', 'spaServices']
        },
        {
            title: t('facilities'),
            fields: ['checkoutProcedures', 'ironingFacilities', 'iceMachineLocation']
        },
        {
            title: t('additionalServices'),
            fields: ['kidsClubServices', 'synagogueServices', 'gymFacilities']
        },
        {
            title: t('businessAndAccess'),
            fields: ['businessLounge', 'accessibilityFeatures', 'uniqueAmenities']
        },
        {
            title: t('contactInformation'),
            fields: ['contactPerson', 'contactEmail', 'contactPhone']
        },
        {
            title: t('customQuestions'),
            isCustom: true
        }
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData({
            ...formData,
            [field]: {
                ...formData[field],
                [currentLanguage]: value
            }
        });
    };

    const handleCustomQuestionChange = (index: number, key: string, value: string) => {
        const newQuestions = [...customQuestions];
        if (!newQuestions[index]) {
            newQuestions[index] = { key, value: { en: '', he: '' } };
        }
        if (key !== newQuestions[index].key) {
            newQuestions[index].key = key;
        } else {
            newQuestions[index].value = {
                ...newQuestions[index].value,
                [currentLanguage]: value
            };
        }
        setCustomQuestions(newQuestions);
    };

    const handleDeleteField = (field: string) => {
        const newFormData = { ...formData };
        delete newFormData[field];
        setFormData(newFormData);
    };

    const addCustomQuestion = () => {
        setCustomQuestions([...customQuestions, { key: '', value: { en: '', he: '' } }]);
    };

    const removeCustomQuestion = (index: number) => {
        setCustomQuestions(customQuestions.filter((_, i) => i !== index));
    };

    const renderInput = (field: string) => {
        if (timeInputFields.includes(field)) {
            const defaultValue = {
                en: 'from 09:00 till 18:00',
                he: 'מ-09:00 עד 18:00'
            };
            const value = formData[field]?.[currentLanguage] || defaultValue[currentLanguage];
            return (
                <TimeSelector
                    value={value}
                    onChange={(value) => handleInputChange(field, value)}
                />
            );
        }

        return (
            <Input
                value={formData[field]?.[currentLanguage] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={t(field as keyof typeof t) || field}
                dir={isRTL ? 'rtl' : 'ltr'}
            />
        );
    };

    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
                    disabled={currentSection === 0}
                >
                    {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <h3 className="text-lg font-medium">{sections[currentSection].title}</h3>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))}
                    disabled={currentSection === sections.length - 1}
                >
                    {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center gap-1 mb-6">
                {sections.map((_, index) => (
                    <div
                        key={index}
                        className={`h-1 w-8 rounded-full transition-colors ${
                            index === currentSection ? 'bg-primary' : 
                            index < currentSection ? 'bg-primary/50' : 'bg-gray-200'
                        }`}
                    />
                ))}
            </div>

            {!sections[currentSection].isCustom ? (
                <div className="space-y-4">
                    {sections[currentSection].fields?.map((field) => (
                        <div key={field} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">
                                    {t(field as keyof typeof t)}
                                </label>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => handleDeleteField(field)}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {renderInput(field)}
                                {timeInputFields.includes(field) && (
                                    <p className="text-xs text-muted-foreground">
                                        {t('timeFormat')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{t('customQuestions')}</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomQuestion}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {t('addNewQA')}
                        </Button>
                    </div>
                    {customQuestions.map((question, index) => (
                        <div key={index} className="flex gap-4 items-start">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder={t('questionKey')}
                                    value={question.key}
                                    onChange={(e) => handleCustomQuestionChange(index, e.target.value, question.value[currentLanguage])}
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                />
                                <Input
                                    placeholder={t('answer')}
                                    value={question.value[currentLanguage]}
                                    onChange={(e) => handleCustomQuestionChange(index, question.key, e.target.value)}
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomQuestion(index)}
                                className="mt-2"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {currentSection === sections.length - 1 && submitButton && (
                <div className="mt-8 pt-4 border-t">
                    {submitButton}
                </div>
            )}
        </div>
    );
} 