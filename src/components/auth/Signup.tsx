import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QAForm } from '@/components/shared/QAForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HotelQuestions } from '@/types/user';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserRegistrationData {
    email: string;
    password: string;
    name: string;
    questions: HotelQuestions;
}

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

export function Signup() {
    const { t } = useTheme();
    const { register } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [formData, setFormData] = useState<Partial<HotelQuestions>>({
        propertyName: '',
        location: '',
        breakfastService: '',
        lunchService: '',
        dinnerService: '',
        poolHours: '',
        spaServices: '',
        checkoutProcedures: '',
        ironingFacilities: '',
        iceMachineLocation: '',
        kidsClubServices: '',
        synagogueServices: '',
        gymFacilities: '',
        businessLounge: '',
        accessibilityFeatures: '',
        uniqueAmenities: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: ''
    });
    const [customQuestions, setCustomQuestions] = useState<Array<{ key: string; value: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const customQuestionsObj = customQuestions.reduce((acc, { key, value }) => {
                if (key) acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            const userData: UserRegistrationData = {
                email: email.trim(),
                password,
                name,
                questions: {
                    ...formData,
                    ...customQuestionsObj
                } as HotelQuestions
            };
            
            await register(userData);

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
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-[10px] opacity-50">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5" />
                    <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-secondary/5" />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5" />
                </div>
            </div>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="w-full max-w-2xl p-8 relative z-10"
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
                            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-2xl" />
                        </motion.div>
                        <motion.div variants={item} className="space-y-2">
                            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                {t('register')}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t('createUserDescription')}
                            </p>
                        </motion.div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <motion.div variants={item} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t('email')}
                                    </label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white/10 border-white/20 backdrop-blur-sm focus:bg-white/20 transition-colors"
                                        placeholder="you@example.com"
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
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="bg-white/10 border-white/20 backdrop-blur-sm focus:bg-white/20 transition-colors"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t('name')}
                                    </label>
                                    <Input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="bg-white/10 border-white/20 backdrop-blur-sm focus:bg-white/20 transition-colors"
                                        placeholder={t('name')}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={item} className="space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="px-2 bg-background/50 backdrop-blur-sm text-muted-foreground">
                                            {t('hotelQuestions')}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                                    <QAForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        customQuestions={customQuestions}
                                        setCustomQuestions={setCustomQuestions}
                                        submitButton={
                                            <Button 
                                                type="submit" 
                                                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity mt-6" 
                                                disabled={isLoading}
                                                size="lg"
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
                                        }
                                    />
                                </div>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
} 