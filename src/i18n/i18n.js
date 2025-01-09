import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';
import { dashboardTranslations } from './dashboardTranslations';

// Merge dashboard translations with existing resources
const mergedResources = {
  en: {
    translation: {
      ...resources.en.translation,
      ...dashboardTranslations.en
    }
  },
  tr: {
    translation: {
      ...resources.tr.translation,
      ...dashboardTranslations.tr
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: mergedResources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 