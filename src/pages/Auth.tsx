/** @jsxImportSource react */
import { useState } from 'react';
import { LoginForm, RegisterForm } from '../components/auth/AuthForms';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { Language, translations } from '../utils/translations';
import { useUser } from '../contexts/UserContext';
import { Navigate } from 'react-router-dom';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [language, setLanguage] = useState<Language>('he');
  const { user } = useUser();
  const t = translations[language];

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher
          currentLanguage={language}
          onLanguageChange={setLanguage}
        />
      </div>
      
      <div className="max-w-md w-full space-y-8" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? t.login : t.register}
          </h2>
        </div>

        {isLogin ? (
          <LoginForm language={language} />
        ) : (
          <RegisterForm language={language} />
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {isLogin
              ? (language === 'en' ? 'Need an account? Register' : 'אין לך חשבון? הירשם')
              : (language === 'en' ? 'Already have an account? Login' : 'יש לך חשבון? התחבר')}
          </button>
        </div>
      </div>
    </div>
  );
} 