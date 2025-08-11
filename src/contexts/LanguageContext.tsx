import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations } from '../i18n/translations';

type Language = 'tr' | 'en';
type TranslationKey = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // Default to Turkish
  const [language, setLanguage] = useState<Language>('tr');

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('rayda-language') as Language;
    if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('rayda-language', lang);
  };

  // Translation function with fallback
  const t = (key: TranslationKey | string, fallback?: string): string => {
    // Handle nested keys like 'endpoints.halkalı-gebze'
    if (key.includes('.')) {
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Try English as fallback
          value = translations['en'];
          for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
              value = value[k];
            } else {
              return fallback || key;
            }
          }
          break;
        }
      }
      
      return typeof value === 'string' ? value : (fallback || key);
    }

    // Simple key lookup
    const translation = (translations[language] as any)[key];
    if (translation) {
      return translation;
    }

    // Fallback to English
    const englishTranslation = (translations['en'] as any)[key];
    if (englishTranslation) {
      return englishTranslation;
    }

    // Final fallback
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};