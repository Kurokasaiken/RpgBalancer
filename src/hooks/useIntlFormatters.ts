import { useMemo } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import {
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatRelativeTime,
} from '@/localization/intlFormatters';

export interface IntlFormatters {
  formatNumber: typeof formatNumber;
  formatPercent: typeof formatPercent;
  formatDate: typeof formatDate;
  formatDateTime: typeof formatDateTime;
  formatCurrency: typeof formatCurrency;
  formatRelativeTime: typeof formatRelativeTime;
}

/**
 * Hook that returns locale-aware Intl formatters using the current i18n language.
 */
export function useIntlFormatters(): IntlFormatters {
  const { i18n } = useTranslation('common');
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en';

  return useMemo(
    () => ({
      formatNumber: (value, options) => formatNumber(value, { locale, ...options }),
      formatPercent: (value, options) => formatPercent(value, { locale, ...options }),
      formatDate: (value, options) => formatDate(value, { locale, ...options }),
      formatDateTime: (value, options) => formatDateTime(value, { locale, ...options }),
      formatCurrency: (value, currency, options) =>
        formatCurrency(value, currency, { locale, ...options }),
      formatRelativeTime: (value, unit, options) =>
        formatRelativeTime(value, unit, { locale, ...options }),
    }),
    [locale],
  );
}
