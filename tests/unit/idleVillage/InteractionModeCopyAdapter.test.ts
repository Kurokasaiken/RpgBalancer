/**
 * InteractionModeCopyAdapter tests
 *
 * Verifies the i18next-backed adapter reads interaction mode copy, preserves
 * metadata, and falls back to the key when data is missing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionModeCopyAdapter } from '@/localization/adapters/InteractionModeCopyAdapter';
import type { InteractionModeCopyEntry } from '@/localization/types';

function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const { i18nMock, resetResources } = vi.hoisted(() => {
  const defaultResources = {
    en: {
      idleVillage: {
        interactionMode: {
          mode: {
            sandbox: {
              text: 'Sandbox',
              description: 'Sandbox mode for testing',
              fallback: 'Sandbox',
              category: 'mode',
              context: 'picker',
              translatable: true,
              maxLength: 20,
              accessibility: {
                ariaLabel: 'Sandbox Mode',
                keyHint: 'S',
              },
            },
            planning: {
              text: 'Planning',
              description: 'Planning mode for organising activities',
              fallback: 'Planning',
              category: 'mode',
              context: 'picker',
              translatable: true,
              maxLength: 20,
              accessibility: {
                ariaLabel: 'Planning Mode',
                keyHint: 'P',
              },
            },
          },
          action: {
            switch_mode: {
              text: 'Switch mode',
              description: 'Change the current interaction mode',
              fallback: 'Switch mode',
              category: 'action',
              context: 'picker',
              translatable: true,
              maxLength: 30,
              accessibility: {
                ariaLabel: 'Switch interaction mode',
                keyHint: 'M',
              },
            },
          },
          accessibility: {
            mode_changed: {
              text: 'Mode changed to {mode}',
              description: 'Announced when the interaction mode changes',
              fallback: 'Mode changed to {mode}',
              category: 'help',
              context: 'accessibility',
              translatable: true,
              maxLength: 40,
              accessibility: {
                ariaLabel: 'Mode changed to {mode}',
                keyHint: '',
              },
            },
          },
        },
      },
    },
    'it-IT': {
      idleVillage: {
        interactionMode: {
          mode: {
            sandbox: {
              text: 'Modalità sandbox',
              description: 'Modalità sandbox per test',
              fallback: 'Sandbox',
              category: 'mode',
              context: 'picker',
              translatable: true,
              maxLength: 25,
              accessibility: {
                ariaLabel: 'Modalità sandbox',
                keyHint: 'S',
              },
            },
          },
          accessibility: {
            mode_changed: {
              text: 'Modalità cambiata in {mode}',
              description: 'Annunciato quando cambia la modalità',
              fallback: 'Modalità cambiata in {mode}',
              category: 'help',
              context: 'accessibility',
              translatable: true,
              maxLength: 45,
              accessibility: {
                ariaLabel: 'Modalità cambiata in {mode}',
                keyHint: '',
              },
            },
          },
        },
      },
    },
  };

  let resources: typeof defaultResources = JSON.parse(JSON.stringify(defaultResources));

  const i18nMock = {
    language: 'en',
    resolvedLanguage: 'en',
    t: vi.fn((key: string, options?: { lng?: string; defaultValue?: unknown }) => {
      const lng = options?.lng || 'en';
      const defaultValue = options?.defaultValue;
      const stripped = key.replace(/^idleVillage:/, '');
      const value = getNestedValue(resources[lng as keyof typeof resources]?.idleVillage, stripped);
      if (value === undefined) return defaultValue;
      return value;
    }),
    getResourceBundle: vi.fn((lng: string, _ns: string) => {
      return resources[lng as keyof typeof resources]?.idleVillage;
    }),
  };

  return {
    i18nMock,
    resetResources: () => {
      resources = JSON.parse(JSON.stringify(defaultResources));
    },
  };
});

vi.mock('@/localization/i18n', () => ({
  i18n: i18nMock,
  i18nReady: Promise.resolve(),
}));

describe('InteractionModeCopyAdapter', () => {
  beforeEach(() => {
    resetResources();
    vi.clearAllMocks();
  });

  it('returns a copy entry with all metadata', () => {
    const entry = InteractionModeCopyAdapter.getCopyEntry('mode.sandbox');

    expect(entry).not.toBeNull();
    expect(entry?.key).toBe('mode.sandbox');
    expect(entry?.text).toBe('Sandbox');
    expect(entry?.description).toBe('Sandbox mode for testing');
    expect(entry?.fallback).toBe('Sandbox');
    expect(entry?.category).toBe('mode');
    expect(entry?.context).toBe('picker');
    expect(entry?.translatable).toBe(true);
    expect(entry?.maxLength).toBe(20);
    expect(entry?.accessibility).toEqual({
      ariaLabel: 'Sandbox Mode',
      keyHint: 'S',
    });
  });

  it('returns text for a key', () => {
    expect(InteractionModeCopyAdapter.getCopyText('mode.sandbox')).toBe('Sandbox');
  });

  it('returns description for a key', () => {
    expect(InteractionModeCopyAdapter.getCopyDescription('mode.sandbox')).toBe('Sandbox mode for testing');
  });

  it('returns the key itself when data is missing', () => {
    expect(InteractionModeCopyAdapter.getCopyText('missing.key')).toBe('missing.key');
    expect(InteractionModeCopyAdapter.getCopyDescription('missing.key')).toBe('');
  });

  it('filters entries by category', () => {
    const modeEntries = InteractionModeCopyAdapter.getCopyByCategory('mode');
    expect(modeEntries.length).toBe(2);
    expect(modeEntries.map((e) => e.key)).toEqual(['mode.sandbox', 'mode.planning']);
  });

  it('filters entries by context', () => {
    const accessibilityEntries = InteractionModeCopyAdapter.getCopyByContext('accessibility');
    expect(accessibilityEntries.length).toBe(1);
    expect(accessibilityEntries[0].key).toBe('accessibility.mode_changed');
  });

  it('reports translatable status', () => {
    expect(InteractionModeCopyAdapter.isCopyTranslatable('mode.sandbox')).toBe(true);
  });

  it('returns accessibility metadata', () => {
    const a11y = InteractionModeCopyAdapter.getCopyAccessibility('mode.sandbox');
    expect(a11y).toEqual({
      ariaLabel: 'Sandbox Mode',
      keyHint: 'S',
    });
  });

  it('formats text with placeholders', () => {
    const formatted = InteractionModeCopyAdapter.formatCopyText('accessibility.mode_changed', { mode: 'Sandbox' });
    expect(formatted).toBe('Mode changed to Sandbox');
  });

  it('returns localized entries for a specific locale', () => {
    const entry = InteractionModeCopyAdapter.getCopyEntry('mode.sandbox', 'it-IT');
    expect(entry?.text).toBe('Modalità sandbox');
    expect(entry?.locale).toBe('it-IT');
  });

  it('formats localized text with placeholders', () => {
    const formatted = InteractionModeCopyAdapter.formatCopyText(
      'accessibility.mode_changed',
      { mode: 'Sandbox' },
      'it-IT',
    );
    expect(formatted).toBe('Modalità cambiata in Sandbox');
  });

  it('returns a full copy configuration object', () => {
    const config = InteractionModeCopyAdapter.getCopyConfig();

    expect(config.defaultLocale).toBe('en');
    expect(config.supportedLocales).toEqual(['en', 'it-IT', 'pseudo']);
    expect(config.entries.length).toBeGreaterThan(0);
    expect(config.metadata.totalEntries).toBe(config.entries.length);
    expect(config.entries.some((e) => e.key === 'mode.sandbox')).toBe(true);
  });

  it('uses base locale when no locale is specified', () => {
    expect(InteractionModeCopyAdapter.getBaseLocale()).toBe('en');
  });
});
