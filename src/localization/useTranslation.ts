import { useTranslation as useI18nTranslation } from 'react-i18next';
import type Resources from './i18n.types';

/**
 * Typed wrapper around react-i18next's useTranslation.
 * Forces `useSuspense: false` and narrows the namespace to the resources
 * generated from `public/locales/en/*.json`.
 */
export function useTranslation<N extends keyof Resources>(ns: N) {
  return useI18nTranslation(ns, { useSuspense: false });
}

export { Trans } from './Trans';
export type { UseTranslationOptions, UseTranslationResponse } from 'react-i18next';
