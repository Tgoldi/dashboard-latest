/** @jsxImportSource react */
import { Language } from '../../utils/translations';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <button
      onClick={() => onLanguageChange(currentLanguage === 'en' ? 'he' : 'en')}
      className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium"
      aria-label={currentLanguage === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
    >
      {currentLanguage === 'en' ? 'עברית' : 'English'}
    </button>
  );
} 