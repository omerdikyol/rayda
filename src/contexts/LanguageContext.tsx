import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translations, type Language } from '../i18n/translations';

const STORAGE_KEY = 'rayda.language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'tr' || saved === 'en') return saved;
  } catch {
    // Storage can be unavailable in private contexts.
  }
  return 'tr';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore persistence failures.
    }
  }, [language]);

  const setLanguage = (next: Language) => setLanguageState(next);
  const toggleLanguage = () =>
    setLanguageState((current) => (current === 'tr' ? 'en' : 'tr'));

  const t = (key: string, fallback?: string): string => {
    const read = (dictionary: unknown): string | undefined => {
      let value: unknown = dictionary;
      for (const part of key.split('.')) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
      return typeof value === 'string' ? value : undefined;
    };

    return (
      read(translations[language]) ??
      read(translations.en) ??
      fallback ??
      key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
