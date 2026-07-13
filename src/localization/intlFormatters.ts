import { i18n } from './i18n';

export interface IntlFormatterOptions {
  locale?: string;
  fallback?: string;
}

function resolveLocale(options?: IntlFormatterOptions): string {
  return options?.locale ?? i18n.resolvedLanguage ?? i18n.language ?? 'en';
}

/**
 * Format a number using Intl.NumberFormat.
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions & IntlFormatterOptions,
): string {
  const { locale, fallback, ...formatOptions } = options ?? {};
  return new Intl.NumberFormat(locale ?? resolveLocale(), formatOptions).format(value);
}

/**
 * Format a percentage value (0-100) as a localized percent string.
 */
export function formatPercent(
  value: number,
  options?: Intl.NumberFormatOptions & IntlFormatterOptions,
): string {
  const { locale, fallback, ...formatOptions } = options ?? {};
  return new Intl.NumberFormat(locale ?? resolveLocale(), {
    style: 'percent',
    maximumFractionDigits: 1,
    ...formatOptions,
  }).format(value / 100);
}

/**
 * Format a Date using Intl.DateTimeFormat.
 */
export function formatDate(
  value: Date | number,
  options?: Intl.DateTimeFormatOptions & IntlFormatterOptions,
): string {
  const { locale, fallback, ...formatOptions } = options ?? {};
  return new Intl.DateTimeFormat(locale ?? resolveLocale(), formatOptions).format(value);
}

/**
 * Format a Date with date and time using Intl.DateTimeFormat.
 */
export function formatDateTime(
  value: Date | number,
  options?: Intl.DateTimeFormatOptions & IntlFormatterOptions,
): string {
  const { locale, fallback, ...formatOptions } = options ?? {};
  return new Intl.DateTimeFormat(locale ?? resolveLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...formatOptions,
  }).format(value);
}

/**
 * Format a currency amount using Intl.NumberFormat.
 */
export function formatCurrency(
  value: number,
  currency: string,
  options?: Intl.NumberFormatOptions & IntlFormatterOptions,
): string {
  const { locale, fallback, ...formatOptions } = options ?? {};
  return new Intl.NumberFormat(locale ?? resolveLocale(), {
    style: 'currency',
    currency,
    ...formatOptions,
  }).format(value);
}

/**
 * Format a relative time using Intl.RelativeTimeFormat.
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions & IntlFormatterOptions,
): string {
  const { locale, fallback, ...formatOptions } = options ?? {};
  return new Intl.RelativeTimeFormat(locale ?? resolveLocale(), {
    numeric: 'auto',
    ...formatOptions,
  }).format(value, unit);
}
