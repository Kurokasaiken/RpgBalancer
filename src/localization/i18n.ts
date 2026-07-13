import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

export const i18n = i18next;

export const i18nReady = i18next
  .use(initReactI18next)
  .use(ICU)
  .use(HttpBackend)
  .use(LanguageDetector)
  .init({
    debug: false,
    fallbackLng: 'en',
    supportedLngs: ['en', 'it-IT', 'pseudo', 'de', 'ar', 'ja', 'zh-CN'],
    nonExplicitSupportedLngs: true,
    load: 'currentOnly',
    defaultNS: 'common',
    ns: ['common', 'idleVillage'],
    saveMissing: true,
    missingKeyHandler: (lng, namespace, key, fallbackValue) => {
      trackTelemetryEvent('translation_missing', {
        language: lng,
        namespace,
        key,
        fallbackValue,
      });
      if (fallbackValue !== undefined && fallbackValue !== key) {
        trackTelemetryEvent('translation_fallback_used', {
          language: lng,
          namespace,
          key,
          fallbackValue,
        });
      }
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['navigator', 'htmlTag'],
      caches: [],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

if (typeof window !== 'undefined' && (import.meta.env?.DEV || false)) {
  (window as unknown as { __i18n?: typeof i18n }).__i18n = i18n;
}

export default i18n;
