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
import { topNavbarTranslations } from './topNavbarTranslations';
import { adminUsersTranslations } from './adminUsersTranslations';
import { userInventoryTranslations } from './userInventoryTranslations';
import { userDocumentsTranslations } from './userDocumentsTranslations';

const mergedResources = {
  en: {
    translation: {
      ...resources.en?.translation,
      ...dashboardTranslations.en,
      ...ordersTranslation?.en,
      inventoryTranslation: inventoryTranslation?.en,
      ...customersTranslation?.en,
      ...documentsTranslations?.en,
      ...salesTranslations?.en,
      ...loginPageTranslations?.en,
      ...topNavbarTranslations.en,
      ...adminUsersTranslations.en,
      ...userInventoryTranslations.en,
      ...userDocumentsTranslations.en
    },
    sidebar: sidebarTranslations.en.sidebar
  },
  tr: {
    translation: {
      ...resources.tr?.translation,
      ...dashboardTranslations.tr,
      ...ordersTranslation?.tr,
      inventoryTranslation: inventoryTranslation?.tr,
      ...customersTranslation?.tr,
      ...documentsTranslations?.tr,
      ...salesTranslations?.tr,
      ...loginPageTranslations?.tr,
      ...topNavbarTranslations.tr,
      ...adminUsersTranslations.tr,
      ...userInventoryTranslations.tr,
      ...userDocumentsTranslations.tr
    },
    sidebar: sidebarTranslations.tr.sidebar
  },
  de: {
    translation: {
      ...resources.de?.translation || {},
      ...dashboardTranslations.de,
      ...ordersTranslation?.de || {},
      inventoryTranslation: inventoryTranslation?.de || {},
      ...customersTranslation?.de || {},
      ...documentsTranslations?.de || {},
      ...salesTranslations?.de || {},
      ...loginPageTranslations?.de || {},
      ...topNavbarTranslations.de,
      ...adminUsersTranslations.de,
      ...userInventoryTranslations.de,
      ...userDocumentsTranslations.de
    },
    sidebar: sidebarTranslations.de.sidebar
  },
  es: {
    translation: {
      ...resources.es?.translation || {},
      ...dashboardTranslations.es,
      ...ordersTranslation?.es || {},
      inventoryTranslation: inventoryTranslation?.es || {},
      ...customersTranslation?.es || {},
      ...documentsTranslations?.es || {},
      ...salesTranslations?.es || {},
      ...loginPageTranslations?.es || {},
      ...topNavbarTranslations.es,
      ...adminUsersTranslations.es,
      ...userInventoryTranslations.es,
      ...userDocumentsTranslations.es
    },
    sidebar: sidebarTranslations.es.sidebar
  }
};

try {
  i18n
    .use(initReactI18next)
    .init({
      resources: mergedResources,
      lng: localStorage.getItem('language') || 'en',
      fallbackLng: 'en',
      supportedLngs: ['en', 'tr', 'de', 'es'],
      interpolation: {
        escapeValue: false
      }
    });
} catch (error) {
  console.error('i18n initialization error:', error);
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: mergedResources.en
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      }
    });
}

export default i18n; 