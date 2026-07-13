import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { LocaleConfigStore, LOCALE_CONFIG_KEY } from '@/localization/LocaleConfigStore';
import { DEFAULT_LOCALE_CONFIG } from '@/localization/LocaleConfig';

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(),
  saveData: vi.fn(),
}));

describe('LocaleConfigStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const store = LocaleConfigStore.getInstance();
    // Reset internal init promise so each test can re-run init
    (store as unknown as { initPromise: Promise<unknown> | null }).initPromise = null;
  });

  it('initializes with default config when persistence is empty', async () => {
    vi.mocked(loadData).mockResolvedValueOnce(DEFAULT_LOCALE_CONFIG);

    const store = LocaleConfigStore.getInstance();
    const config = await store.init();

    expect(config.locale).toBe(DEFAULT_LOCALE_CONFIG.locale);
    expect(config.direction).toBe('ltr');
    expect(config.textExpansionFactor).toBe(1.0);
  });

  it('loads persisted config and applies locale defaults', async () => {
    vi.mocked(loadData).mockResolvedValueOnce({
      locale: 'it-IT',
      direction: 'rtl',
      fontFamily: 'serif',
      fallbackLocale: 'en',
      textExpansionFactor: 1.0,
    });

    const store = LocaleConfigStore.getInstance();
    const config = await store.init();

    expect(config.locale).toBe('it-IT');
    expect(config.direction).toBe('ltr');
    expect(config.fontFamily).toBe('serif');
    expect(loadData).toHaveBeenCalledWith(LOCALE_CONFIG_KEY, DEFAULT_LOCALE_CONFIG);
  });

  it('saves config and notifies listeners', async () => {
    vi.mocked(loadData).mockResolvedValueOnce(DEFAULT_LOCALE_CONFIG);
    vi.mocked(saveData).mockResolvedValueOnce(undefined);

    const store = LocaleConfigStore.getInstance();
    await store.init();

    const listener = vi.fn();
    store.subscribe(listener);

    const updated = await store.setLocale('pseudo');

    expect(updated.locale).toBe('pseudo');
    expect(updated.textExpansionFactor).toBe(1.3);
    expect(saveData).toHaveBeenCalledWith(LOCALE_CONFIG_KEY, expect.objectContaining({ locale: 'pseudo' }));
    expect(listener).toHaveBeenCalled();
  });

  it('falls back to default config when persisted data is corrupted', async () => {
    vi.mocked(loadData).mockResolvedValueOnce({ unexpected: 'data', locale: 'invalid-locale' });

    const store = LocaleConfigStore.getInstance();
    const config = await store.init();

    expect(config.locale).toBe(DEFAULT_LOCALE_CONFIG.locale);
  });

  it('returns the current config synchronously', async () => {
    vi.mocked(loadData).mockResolvedValueOnce({ locale: 'it-IT' });

    const store = LocaleConfigStore.getInstance();
    await store.init();

    expect(store.getConfig().locale).toBe('it-IT');
  });
});
