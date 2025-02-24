import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/useTheme';
import { Eye, EyeOff, User } from 'lucide-react';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { motion } from 'framer-motion';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Signup() {
    const { t, language, setLanguage } = useTheme();
    const isRTL = language === 'he';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { register } = useUser();
    const [showPassword, setShowPassword] = useState(false);

    const handleLanguageChange = (newLanguage: 'en' | 'he') => {
        setLanguage(newLanguage);
        document.documentElement.dir = newLanguage === 'he' ? 'rtl' : 'ltr';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const registrationData = {
                email,
                password,
                name
            };

            await register(registrationData);

            toast({
                title: t('success'),
                description: t('userCreatedDescription'),
            });

            navigate('/');
        } catch (error) {
            toast({
                title: t('error'),
                description: error instanceof Error ? error.message : t('errorCreatingUser'),
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-background">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher
                    currentLanguage={language}
                    onLanguageChange={handleLanguageChange}
                />
            </div>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="w-full max-w-md p-8 relative z-10"
            >
                <Card className="border-white/20 shadow-2xl backdrop-blur-2xl bg-background/20">
                    <CardHeader className="space-y-8 text-center pb-6">
                        <motion.div 
                            variants={item}
                            className="relative mx-auto"
                        >
                            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                        </motion.div>
                        <motion.div variants={item} className="space-y-2">
                            <CardTitle className="text-3xl font-bold text-primary">
                                {t('register')}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t('createUserDescription')}
                            </p>
                        </motion.div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
                            <motion.div variants={item} className="grid gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">
                                        {t('name')}
                                    </label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder={t('name')}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="bg-white/10 border-white/20 backdrop-blur-sm focus:bg-white/20 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        {t('email')}
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={t('email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white/10 border-white/20 backdrop-blur-sm focus:bg-white/20 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        {t('password')}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={t('password')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="bg-white/10 border-white/20 backdrop-blur-sm focus:bg-white/20 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className={`absolute inset-y-0 ${isRTL ? 'left-2' : 'right-2'} flex items-center text-muted-foreground hover:text-foreground transition-colors`}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button 
                                    type="submit"
                                    className="bg-primary hover:bg-primary/90 transition-colors"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                                            {t('creatingAccount')}
                                        </div>
                                    ) : (
                                        t('register')
                                    )}
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
} 