import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';
import { dashboardTranslations } from './dashboardTranslations';
import { ordersTranslation } from './ordersTranslation';
import { inventoryTranslation } from './inventoryTranslation';

// Merge dashboard translations with existing resources
const mergedResources = {
  en: {
    translation: {
      ...resources.en.translation,
      ...dashboardTranslations.en,
      ...ordersTranslation.en,
      inventoryTranslation: inventoryTranslation.en
    }
  },
  tr: {
    translation: {
      ...resources.tr.translation,
      ...dashboardTranslations.tr,
      ...ordersTranslation.tr,
      inventoryTranslation: inventoryTranslation.tr
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