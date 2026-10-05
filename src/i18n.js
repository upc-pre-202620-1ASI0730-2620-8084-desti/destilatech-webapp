import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import es from './locales/es.json';
import { STORAGE_KEYS } from '@/shared/infrastructure/base-api.js';

const resolveInitialLocale = () => {
    const storedLocale = localStorage.getItem(STORAGE_KEYS.locale);
    return storedLocale === 'en' || storedLocale === 'es' ? storedLocale : 'es';
};

const i18n = createI18n({
    legacy: false,
    locale: resolveInitialLocale(),
    fallbackLocale: 'en',
    messages: { en, es }
});

document.documentElement.lang = i18n.global.locale.value;

export default i18n;
