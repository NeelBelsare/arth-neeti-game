export function getLocalizedText(item, field, language) {
    // item: object containing fields like title, title_hi, etc.
    // field: 'title', 'description', 'text', 'feedback'
    // language: current language code

    if (!item) return '';

    if (language === 'hi' && item[`${field}_hi`]) {
        return item[`${field}_hi`];
    }

    if (language === 'mr' && item[`${field}_mr`]) {
        return item[`${field}_mr`];
    }

    return item[field] || ''; // Fallback to English/Default
}
