import { z } from 'zod';

export const SUPPORTED_LOCALES = ['en', 'it-IT', 'pseudo', 'de', 'ar', 'ja', 'zh-CN'] as const;

export const DEFAULT_LOCALE = 'en' as const;

export const LOCALE_DIRECTIONS = ['ltr', 'rtl'] as const;

export const LOCALE_FONTS = ['default', 'serif', 'fantasy'] as const;

export const LOCALE_FAMILIES = {
  en: 'Cinzel, Crimson Text, Lato, "Noto Sans", sans-serif',
  de: 'Cinzel, Crimson Text, Lato, "Noto Sans", sans-serif',
  'it-IT': 'Cinzel, Crimson Text, Lato, "Noto Sans", sans-serif',
  pseudo: 'Cinzel, Crimson Text, Lato, "Noto Sans", sans-serif',
  ar: '"Noto Sans Arabic", "Noto Sans", sans-serif',
  ja: '"Source Han Sans JP", "Noto Sans JP", "Noto Sans", sans-serif',
  'zh-CN': '"Source Han Sans SC", "Noto Sans SC", "Noto Sans", sans-serif',
} as const;

export const LocaleConfigSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
  direction: z.enum(LOCALE_DIRECTIONS).default('ltr'),
  fontFamily: z.string().default('default'),
  fallbackLocale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
  textExpansionFactor: z.number().min(0).max(3).default(1.0),
});

export type LocaleConfig = z.infer<typeof LocaleConfigSchema>;
export type LocaleConfigInput = z.input<typeof LocaleConfigSchema>;
export type SupportedLocale = LocaleConfig['locale'];

export const DEFAULT_LOCALE_CONFIG: LocaleConfig = {
  locale: DEFAULT_LOCALE,
  direction: 'ltr',
  fontFamily: 'default',
  fallbackLocale: DEFAULT_LOCALE,
  textExpansionFactor: 1.0,
};

export function getDirectionForLocale(locale: string): 'ltr' | 'rtl' {
  const rtlLocales = ['ar', 'he', 'ur', 'fa', 'dv'];
  return rtlLocales.some((rtl) => locale.toLowerCase().startsWith(rtl)) ? 'rtl' : 'ltr';
}

export function isRTL(locale: string): boolean {
  return getDirectionForLocale(locale) === 'rtl';
}

export function getTextExpansionFactor(locale: string): number {
  if (locale === 'pseudo') return 1.3;
  if (locale === 'de') return 1.15;
  return 1.0;
}

export function getLocaleFontFamily(locale: string): string {
  return (LOCALE_FAMILIES as Record<string, string>)[locale] ?? LOCALE_FAMILIES.en;
}
