import { createContext, useState, useContext, useEffect } from 'react';
import { dictionary } from '../../core/localization/dictionary.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => localStorage.getItem('shleeh_lang') || 'en');

    useEffect(() => {
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        localStorage.setItem('shleeh_lang', lang);
    }, [lang]);

    const toggleLanguage = () => setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
    const t = (key, vars) => {
        let str = dictionary[lang]?.[key] ?? key;
        if (vars) {
            Object.entries(vars).forEach(([k, v]) => {
                str = str.replace(`{${k}}`, v);
            });
        }
        return str;
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useTranslation = () => useContext(LanguageContext);
