import { useState, useCallback } from 'react';
import { en, Locale } from '../locales/en';

type SupportedLanguage = 'en';

export const useLocalization = () => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  
  const locales: Record<SupportedLanguage, Locale> = {
    en,
  };

  const t = useCallback((key: string, variables?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = locales[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      return key; // Return key if translation not found
    }
    
    if (variables) {
      return Object.entries(variables).reduce(
        (acc, [variable, replacement]) => 
          acc.replace(`{${variable}}`, String(replacement)),
        value
      );
    }
    
    return value;
  }, [currentLanguage]);

  const changeLanguage = useCallback((language: SupportedLanguage) => {
    setCurrentLanguage(language);
  }, []);

  return {
    t,
    currentLanguage,
    changeLanguage,
    supportedLanguages: Object.keys(locales) as SupportedLanguage[],
  };
};