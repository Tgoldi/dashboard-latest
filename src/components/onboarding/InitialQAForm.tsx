/** @jsxImportSource react */
import { useState } from 'react';
import { QAForm } from '../shared/QAForm';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { useTheme } from '@/contexts/useTheme';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { HotelQuestions } from '@/types/user';

interface MultilingualContent {
    en: string;
    he: string;
}

interface CustomQuestion {
    key: string;
    value: MultilingualContent;
}

export function InitialQAForm() {
    const { t, language } = useTheme();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Record<string, MultilingualContent>>({});
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

    const handleSubmit = () => {
        // Handle form submission
        navigate('/');
    };
    
    return (
        <div className="max-w-3xl mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>{t('beforeWeContinue')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-6 text-muted-foreground">
                        {language === 'he' ? 'קצת מידע לפני שממשיכים' : 'Some information before we continue'}
                    </p>
                    <QAForm
                        formData={formData}
                        setFormData={setFormData}
                        customQuestions={customQuestions}
                        setCustomQuestions={setCustomQuestions}
                        currentLanguage={language}
                        submitButton={
                            <Button 
                                type="submit" 
                                className="w-full"
                                onClick={handleSubmit}
                            >
                                {t('continue')}
                            </Button>
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
} 