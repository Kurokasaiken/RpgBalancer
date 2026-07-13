import { getDirectionForLocale, isRTL, getLocaleFontFamily } from './LocaleConfig';

export { getDirectionForLocale, isRTL, getLocaleFontFamily };

/**
 * Apply locale direction and font-family to the document root element.
 * Should be called whenever the active locale changes.
 */
export function applyLocaleAttributes(locale: string): void {
  if (typeof document === 'undefined') return;
  const dir = getDirectionForLocale(locale);
  const fontFamily = getLocaleFontFamily(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  document.documentElement.style.fontFamily = fontFamily;
  document.documentElement.style.setProperty('--font-family-locale', fontFamily);
}
