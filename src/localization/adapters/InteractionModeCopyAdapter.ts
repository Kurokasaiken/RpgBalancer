import { i18n } from '../i18n';
import type {
  InteractionModeCopyEntry,
  InteractionModeCopyConfig,
} from '../types';

export type { InteractionModeCopyEntry } from '../types';

interface InteractionModeEntryData {
  text?: string;
  description?: string;
  fallback?: string;
  category?: 'mode' | 'action' | 'help' | 'tooltip';
  context?: 'picker' | 'ftue' | 'help' | 'accessibility';
  maxLength?: number;
  translatable?: boolean;
  accessibility?: {
    ariaLabel?: string;
    ariaDescription?: string;
    keyHint?: string;
  };
}

const INTERACTION_MODE_ROOT = 'interactionMode';

function getBaseLocale(): string {
  return i18n.resolvedLanguage || i18n.language || 'en';
}

function getEntryData(locale: string, key: string): InteractionModeEntryData | null {
  const data = i18n.t(`idleVillage:${INTERACTION_MODE_ROOT}.${key}`, {
    lng: locale,
    returnObjects: true,
    defaultValue: null,
  });

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  return data as unknown as InteractionModeEntryData;
}

function collectKeys(
  obj: unknown,
  prefix: string,
  keys: string[],
): void {
  if (!obj || typeof obj !== 'object') return;

  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (typeof v.text === 'string') {
        keys.push(path);
      } else {
        collectKeys(v, path, keys);
      }
    }
  }
}

function getAllKeys(): string[] {
  const bundle = i18n.getResourceBundle('en', 'idleVillage');
  const root = bundle?.[INTERACTION_MODE_ROOT];
  const keys: string[] = [];
  if (root) {
    collectKeys(root, '', keys);
  }
  return keys;
}

function normalizeEntry(
  key: string,
  data: InteractionModeEntryData,
  locale: string,
): InteractionModeCopyEntry {
  const fallback = data.fallback || data.text || key;
  return {
    key,
    text: data.text || fallback,
    description: data.description || data.text || fallback,
    fallback,
    locale: locale || getBaseLocale(),
    category: data.category || 'help',
    context: data.context || 'picker',
    translatable: data.translatable ?? true,
    maxLength: data.maxLength,
    accessibility: data.accessibility || null,
  };
}

/**
 * i18next-backed adapter for Idle Village interaction mode copy.
 *
 * It reads structured entries from `idleVillage:interactionMode.*` and
 * preserves the same `InteractionModeCopyEntry` shape and helpers as the
 * legacy `interactionModeCopy.ts` module.
 */
export const InteractionModeCopyAdapter = {
  getBaseLocale,

  getCopyEntry(key: string, locale?: string): InteractionModeCopyEntry | null {
    const lng = locale || getBaseLocale();
    const data = getEntryData(lng, key);
    if (!data) return null;
    return normalizeEntry(key, data, lng);
  },

  getCopyText(key: string, locale?: string): string {
    return this.getCopyEntry(key, locale)?.text || key;
  },

  getCopyDescription(key: string, locale?: string): string {
    return this.getCopyEntry(key, locale)?.description || '';
  },

  getCopyByCategory(
    category: InteractionModeCopyEntry['category'],
    locale?: string,
  ): InteractionModeCopyEntry[] {
    const lng = locale || getBaseLocale();
    return getAllKeys()
      .map((key) => this.getCopyEntry(key, lng))
      .filter((entry): entry is InteractionModeCopyEntry => entry !== null)
      .filter((entry) => entry.category === category);
  },

  getCopyByContext(
    context: InteractionModeCopyEntry['context'],
    locale?: string,
  ): InteractionModeCopyEntry[] {
    const lng = locale || getBaseLocale();
    return getAllKeys()
      .map((key) => this.getCopyEntry(key, lng))
      .filter((entry): entry is InteractionModeCopyEntry => entry !== null)
      .filter((entry) => entry.context === context);
  },

  isCopyTranslatable(key: string): boolean {
    return this.getCopyEntry(key, getBaseLocale())?.translatable ?? false;
  },

  getCopyAccessibility(
    key: string,
    locale?: string,
  ): InteractionModeCopyEntry['accessibility'] | null {
    return this.getCopyEntry(key, locale)?.accessibility || null;
  },

  formatCopyText(
    key: string,
    placeholders: Record<string, string>,
    locale?: string,
  ): string {
    let text = this.getCopyText(key, locale);
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
    });
    return text;
  },

  getCopyConfig(locale?: string): InteractionModeCopyConfig {
    const lng = locale || getBaseLocale();
    const entries = getAllKeys()
      .map((key) => this.getCopyEntry(key, lng))
      .filter((entry): entry is InteractionModeCopyEntry => entry !== null);

    return {
      defaultLocale: 'en',
      supportedLocales: ['en', 'it-IT', 'pseudo'],
      entries,
      metadata: {
        version: '1.0.0',
        lastUpdated: Date.now(),
        totalEntries: entries.length,
        translationStatus: {
          en: 'complete',
          'it-IT': 'complete',
          pseudo: 'complete',
        },
      },
    };
  },
};
