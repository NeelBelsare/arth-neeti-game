import React from 'react';
import { useTranslation } from 'react-i18next';
// import './LanguageSwitcher.css'; // Inline styles for now or create CSS file if needed

function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang); // Persist preference
    };

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिंदी' },
        { code: 'mr', label: 'मराठी' }
    ];

    return (
        <div className="language-switcher flex gap-2">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
            ${i18n.language === lang.code
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    onClick={() => changeLanguage(lang.code)}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
}

export default LanguageSwitcher;
