import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  localizationService,
  type SupportedLocale,
  type WorkerTooltipCopy,
} from '@/localization/LocalizationService';
import {
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatRelativeTime,
} from '@/localization/intlFormatters';

export interface LocalizationHandle {
  /** Currently active locale identifier */
  locale: SupportedLocale;
  /** Updates the active locale */
  setLocale: (locale: SupportedLocale) => void;
  /** Formats a template string with runtime params */
  format: (template: string, params?: Record<string, string | number>) => string;
  /** Copy dictionary for worker tooltips */
  workerTooltip: WorkerTooltipCopy;
  /** Locale-aware Intl formatters */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (value: number, currency: string, options?: Intl.NumberFormatOptions) => string;
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions) => string;
}

/**
 * React hook that subscribes to the LocalizationService singleton and exposes
 * localized copy plus convenience helpers to UI components.
 */
export function useLocalization(): LocalizationHandle {
  const locale = useSyncExternalStore(
    (listener) => localizationService.subscribe(listener),
    () => localizationService.getLocale(),
  );

  const workerTooltip = localizationService.getWorkerTooltipCopy();

  const setLocale = useCallback(
    (nextLocale: SupportedLocale) => localizationService.setLocale(nextLocale),
    [],
  );

  const format = useCallback(
    (template: string, params?: Record<string, string | number>) =>
      localizationService.format(template, params),
    [],
  );

  const formatters = useMemo(
    () => ({
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, { locale, ...options }),
      formatPercent: (value: number, options?: Intl.NumberFormatOptions) =>
        formatPercent(value, { locale, ...options }),
      formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, { locale, ...options }),
      formatDateTime: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
        formatDateTime(value, { locale, ...options }),
      formatCurrency: (value: number, currency: string, options?: Intl.NumberFormatOptions) =>
        formatCurrency(value, currency, { locale, ...options }),
      formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions) =>
        formatRelativeTime(value, unit, { locale, ...options }),
    }),
    [locale],
  );

  return {
    locale,
    setLocale,
    format,
    workerTooltip,
    ...formatters,
  };
}
