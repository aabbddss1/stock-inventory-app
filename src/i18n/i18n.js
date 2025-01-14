import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';
import { dashboardTranslations } from './dashboardTranslations';
import { ordersTranslation } from './ordersTranslation';
import { inventoryTranslation } from './inventoryTranslation';
import { customersTranslation } from './customersTranslation';
import { documentsTranslations } from './documentsTranslations';
import { salesTranslations } from './salesTranslations';
import { sidebarTranslations } from './sidebarTranslations';
import { loginPageTranslations } from './loginPageTranslations';

const mergedResources = {
  en: {
    translation: {
      ...resources.en.translation,
      ...dashboardTranslations.en,
      ...ordersTranslation.en,
      inventoryTranslation: inventoryTranslation.en,
      ...customersTranslation.en,
      ...documentsTranslations.en,
      ...salesTranslations.en,
      ...loginPageTranslations.en,
    },
    sidebar: sidebarTranslations.en.sidebar
  },
  tr: {
    translation: {
      ...resources.tr.translation,
      ...dashboardTranslations.tr,
      ...ordersTranslation.tr,
      inventoryTranslation: inventoryTranslation.tr,
      ...customersTranslation.tr,
      ...documentsTranslations.tr,
      ...salesTranslations.tr,
      ...loginPageTranslations.tr,
    },
    sidebar: sidebarTranslations.tr.sidebar
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