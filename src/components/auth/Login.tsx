import { useState } from 'react';
import { User, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/useTheme';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Login() {
    const { login } = useUser();
    const { t } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login({ email, password });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-[400px]">
                <CardHeader>
                    <User className="h-6 w-6 mb-2" />
                    <CardTitle>{t('login')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                {t('email')}
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                {t('password')}
                            </label>
                            <div className="relative inline-block w-full">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pr-12"
                                />
                                <div 
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer bg-transparent hover:bg-gray-100 rounded-r-md"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ zIndex: 20 }}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="w-full">
                            {t('login')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 