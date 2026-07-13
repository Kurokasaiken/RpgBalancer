import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import { LocalizationServiceAdapter } from '@/localization/adapters/LocalizationServiceAdapter';
import { localeConfigStore } from '@/localization/LocaleConfigStore';

const workerTooltip: Record<string, unknown> = {
  labels: {
    hp: 'HP',
    fatigue: 'Fatigue',
  },
};

async function initTestI18n() {
  await i18next
    .use(initReactI18next)
    .use(ICU)
    .init({
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'idleVillage',
      ns: ['idleVillage'],
      resources: {
        en: {
          idleVillage: {
            workerTooltip,
          },
        },
        pseudo: {
          idleVillage: {
            workerTooltip: {
              labels: {
                hp: 'pseudo HP',
                fatigue: 'pseudo Fatigue',
              },
            },
          },
        },
      },
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

describe('LocalizationServiceAdapter', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset i18next instance state to avoid module singleton side effects
    await initTestI18n();
    LocalizationServiceAdapter['instance'] = undefined;
  });

  it('getLocale returns the current i18next language', async () => {
    await initTestI18n();
    const adapter = LocalizationServiceAdapter.getInstance();
    expect(adapter.getLocale()).toBe('en');
  });

  it('setLocale updates i18next and persists via LocaleConfigStore', async () => {
    const setLocaleSpy = vi.spyOn(localeConfigStore, 'setLocale').mockResolvedValue({
      locale: 'pseudo',
      direction: 'ltr',
      fontFamily: 'default',
      fallbackLocale: 'en',
      textExpansionFactor: 1.3,
    });

    await initTestI18n();
    const adapter = LocalizationServiceAdapter.getInstance();
    await adapter.setLocale('pseudo');

    expect(i18next.language).toBe('pseudo');
    expect(setLocaleSpy).toHaveBeenCalledWith('pseudo');
  });

  it('getWorkerTooltipCopy returns the loaded resource bundle', async () => {
    await initTestI18n();
    const adapter = LocalizationServiceAdapter.getInstance();
    const copy = adapter.getWorkerTooltipCopy();
    expect(copy.labels?.hp).toBe('HP');
  });

  it('format replaces ICU placeholders', async () => {
    await initTestI18n();
    const adapter = LocalizationServiceAdapter.getInstance();
    const result = adapter.format('Hello {name}', { name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('subscribe notifies listeners when language changes', async () => {
    await initTestI18n();
    const adapter = LocalizationServiceAdapter.getInstance();
    const listener = vi.fn();
    adapter.subscribe(listener);

    await adapter.setLocale('pseudo');

    expect(listener).toHaveBeenCalled();
  });
});
