import type { TOptions } from 'i18next';
import { i18n } from '../i18n';
import { localeConfigStore } from '../LocaleConfigStore';
import type { SupportedLocale } from '../LocaleConfig';
import type { WorkerTooltipCopy } from '../types';

export type { WorkerTooltipCopy };

/**
 * i18next-backed adapter that exposes the same API as the legacy
 * LocalizationService singleton.
 */
export class LocalizationServiceAdapter {
  private static instance: LocalizationServiceAdapter;

  private readonly listeners = new Set<() => void>();

  private constructor() {
    // i18next fires languageChanged both on programmatic changes and on fallback
    i18n.on('languageChanged', () => this.notify());
  }

  public static getInstance(): LocalizationServiceAdapter {
    if (!LocalizationServiceAdapter.instance) {
      LocalizationServiceAdapter.instance = new LocalizationServiceAdapter();
    }
    return LocalizationServiceAdapter.instance;
  }

  public getLocale(): SupportedLocale {
    const resolved = i18n.resolvedLanguage || i18n.language || localeConfigStore.getConfig().locale;
    return resolved as SupportedLocale;
  }

  public setLocale(locale: SupportedLocale): void {
    i18n.changeLanguage(locale).catch((error) => {
      console.warn('[LocalizationServiceAdapter] Failed to change language:', error);
    });
    localeConfigStore
      .setLocale(locale)
      .catch((error) => {
        console.warn('[LocalizationServiceAdapter] Failed to persist locale:', error);
      });
  }

  public getWorkerTooltipCopy(): WorkerTooltipCopy {
    const locale = this.getLocale();
    const bundle = i18n.getResourceBundle(locale, 'idleVillage') ||
      i18n.getResourceBundle('en', 'idleVillage') ||
      {};
    return (bundle.workerTooltip ?? {}) as WorkerTooltipCopy;
  }

  /**
   * Formats a template string with runtime parameters using ICU MessageFormat.
   * The template itself is used as the default value; key/namespace separators
   * are disabled so the template is treated as a literal string.
   */
  public format(template: string, params?: Record<string, string | number>): string {
    const options: TOptions = {
      keySeparator: false,
      nsSeparator: false,
      ...params,
    };
    return i18n.t(template, template, options) as string;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const localizationServiceAdapter = LocalizationServiceAdapter.getInstance();
