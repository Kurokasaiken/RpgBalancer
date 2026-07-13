/**
 * interactionModeCopy tests
 *
 * Verifies the interaction mode copy config delegates to the
 * InteractionModeCopyAdapter and falls back to the static local entries.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCopyEntry,
  getCopyText,
  getCopyDescription,
  getCopyByCategory,
  getCopyByContext,
  isCopyTranslatable,
  getCopyAccessibility,
  formatCopyText,
  DEFAULT_INTERACTION_MODE_COPY_CONFIG,
} from '@/ui/idleVillage/config/interactionModeCopy';

const { adapterMock } = vi.hoisted(() => {
  const adapterMock = {
    getCopyEntry: vi.fn(),
    getCopyText: vi.fn(),
    getCopyDescription: vi.fn(),
    getCopyByCategory: vi.fn(),
    getCopyByContext: vi.fn(),
    isCopyTranslatable: vi.fn(),
    getCopyAccessibility: vi.fn(),
    formatCopyText: vi.fn(),
  };
  return { adapterMock };
});

vi.mock('@/localization/adapters/InteractionModeCopyAdapter', () => ({
  InteractionModeCopyAdapter: adapterMock,
}));

describe('interactionModeCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns adapter entry when available', () => {
    const adapterEntry = {
      key: 'mode.sandbox',
      text: 'Sandbox',
      description: 'Sandbox mode',
      fallback: 'Sandbox',
      locale: 'en',
      category: 'mode' as const,
      context: 'picker' as const,
      translatable: true,
      maxLength: 20,
      accessibility: { ariaLabel: 'Sandbox Mode', keyHint: 'S' },
    };
    adapterMock.getCopyEntry.mockReturnValue(adapterEntry);

    const entry = getCopyEntry('mode.sandbox', 'en');

    expect(entry).toEqual(adapterEntry);
    expect(adapterMock.getCopyEntry).toHaveBeenCalledWith('mode.sandbox', 'en');
  });

  it('falls back to static entry when adapter returns null', () => {
    adapterMock.getCopyEntry.mockReturnValue(null);

    const entry = getCopyEntry('mode.sandbox');

    expect(entry).not.toBeNull();
    expect(entry?.key).toBe('mode.sandbox');
    expect(entry?.text).toBe('Sandbox');
  });

  it('returns text for a key', () => {
    adapterMock.getCopyEntry.mockReturnValue(null);

    expect(getCopyText('mode.sandbox')).toBe('Sandbox');
  });

  it('returns key itself when no adapter or static entry is found', () => {
    expect(getCopyText('unknown.key')).toBe('unknown.key');
  });

  it('returns description for a key', () => {
    adapterMock.getCopyEntry.mockReturnValue(null);

    expect(getCopyDescription('mode.sandbox')).toContain('Modalità sandbox');
  });

  it('formats text with placeholders', () => {
    adapterMock.getCopyEntry.mockReturnValue(null);

    const formatted = formatCopyText('accessibility.mode_changed', { mode: 'Sandbox' });
    expect(formatted).toBe('Modalità cambiata in Sandbox');
  });

  it('returns entries by category from adapter', () => {
    const adapterEntries = [
      {
        key: 'mode.sandbox',
        text: 'Sandbox',
        description: 'Sandbox mode',
        fallback: 'Sandbox',
        locale: 'en',
        category: 'mode' as const,
        context: 'picker' as const,
        translatable: true,
      },
    ];
    adapterMock.getCopyByCategory.mockReturnValue(adapterEntries);

    expect(getCopyByCategory('mode')).toEqual(adapterEntries);
  });

  it('falls back to static entries by category when adapter returns empty', () => {
    adapterMock.getCopyByCategory.mockReturnValue([]);

    const entries = getCopyByCategory('mode');

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.key === 'mode.sandbox')).toBe(true);
  });

  it('returns entries by context from adapter', () => {
    const adapterEntries = [
      {
        key: 'ftue.welcome_title',
        text: 'Welcome',
        description: 'Welcome title',
        fallback: 'Welcome',
        locale: 'en',
        category: 'help' as const,
        context: 'ftue' as const,
        translatable: true,
      },
    ];
    adapterMock.getCopyByContext.mockReturnValue(adapterEntries);

    expect(getCopyByContext('ftue')).toEqual(adapterEntries);
  });

  it('falls back to static entries by context when adapter returns empty', () => {
    adapterMock.getCopyByContext.mockReturnValue([]);

    const entries = getCopyByContext('ftue');

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.key === 'ftue.welcome_title')).toBe(true);
  });

  it('reports translatable status from adapter', () => {
    adapterMock.isCopyTranslatable.mockReturnValue(true);

    expect(isCopyTranslatable('mode.sandbox')).toBe(true);
  });

  it('falls back to static translatable status when adapter returns undefined', () => {
    adapterMock.isCopyTranslatable.mockReturnValue(undefined);

    expect(isCopyTranslatable('mode.sandbox')).toBe(true);
  });

  it('returns accessibility metadata', () => {
    adapterMock.getCopyEntry.mockReturnValue(null);

    const a11y = getCopyAccessibility('mode.sandbox');

    expect(a11y).toEqual({
      ariaLabel: 'Modalità Sandbox',
      keyHint: 'S',
    });
  });

  it('returns the default configuration object', () => {
    expect(DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale).toBe('en');
    expect(DEFAULT_INTERACTION_MODE_COPY_CONFIG.entries.length).toBeGreaterThan(0);
    expect(DEFAULT_INTERACTION_MODE_COPY_CONFIG.metadata.totalEntries).toBe(
      DEFAULT_INTERACTION_MODE_COPY_CONFIG.entries.length
    );
  });
});
