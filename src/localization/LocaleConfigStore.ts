import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import {
  DEFAULT_LOCALE_CONFIG,
  LocaleConfigSchema,
  getDirectionForLocale,
  getTextExpansionFactor,
} from './LocaleConfig';
import { applyLocaleAttributes } from './rtlUtils';
import type { LocaleConfig, LocaleConfigInput, SupportedLocale } from './LocaleConfig';

export const LOCALE_CONFIG_KEY = 'rpg-locale-config';

function applyLocaleDefaults(config: LocaleConfig): LocaleConfig {
  return {
    ...config,
    direction: getDirectionForLocale(config.locale),
    fallbackLocale: config.fallbackLocale || DEFAULT_LOCALE_CONFIG.locale,
    textExpansionFactor: getTextExpansionFactor(config.locale),
  };
}

function parseConfig(input: unknown): LocaleConfig {
  const parsed = LocaleConfigSchema.safeParse(input);
  const base = parsed.success ? parsed.data : DEFAULT_LOCALE_CONFIG;
  return applyLocaleDefaults(base);
}

/**
 * Local store responsible for persisting and retrieving the selected locale.
 * Uses PersistenceService for all async persistence operations.
 */
export class LocaleConfigStore {
  private static instance: LocaleConfigStore;

  private config: LocaleConfig = DEFAULT_LOCALE_CONFIG;
  private initPromise: Promise<LocaleConfig> | null = null;
  private readonly listeners = new Set<() => void>();

  private constructor() {
    // singleton constructor intentionally private
  }

  public static getInstance(): LocaleConfigStore {
    if (!LocaleConfigStore.instance) {
      LocaleConfigStore.instance = new LocaleConfigStore();
    }
    return LocaleConfigStore.instance;
  }

  /**
   * Loads the persisted locale config or creates a default one.
   * Safe to call multiple times; the first call performs the async load.
   */
  public async init(): Promise<LocaleConfig> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = loadData<LocaleConfig | unknown>(
      LOCALE_CONFIG_KEY,
      DEFAULT_LOCALE_CONFIG,
    ).then((raw) => {
      const parsed = parseConfig(raw);
      this.config = parsed;
      applyLocaleAttributes(parsed.locale);
      return parsed;
    });

    return this.initPromise;
  }

  public getConfig(): LocaleConfig {
    return this.config;
  }

  /**
   * Updates the locale config and persists it asynchronously.
   * Notifies subscribers after a successful save.
   */
  public async setConfig(input: LocaleConfigInput): Promise<LocaleConfig> {
    const parsed = parseConfig(input);
    this.config = parsed;
    applyLocaleAttributes(parsed.locale);
    await saveData(LOCALE_CONFIG_KEY, parsed);
    this.notify();
    return parsed;
  }

  /**
   * Convenience setter for locale only.
   */
  public async setLocale(locale: SupportedLocale): Promise<LocaleConfig> {
    return this.setConfig({ ...this.config, locale });
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

export const localeConfigStore = LocaleConfigStore.getInstance();
