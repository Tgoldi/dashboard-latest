import React, { createContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/utils/translations';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const t = (key: TranslationKey): string => {
    return (translations[language] as Record<TranslationKey, string>)[key];
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [isDark, language]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, language, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
}