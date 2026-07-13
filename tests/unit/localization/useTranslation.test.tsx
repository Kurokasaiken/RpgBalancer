import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { useTranslation } from '@/localization/useTranslation';

function TestComponent() {
  const { t, i18n } = useTranslation('common');
  return (
    <div>
      <span data-testid="welcome">{t('welcome')}</span>
      <button
        type="button"
        data-testid="switch"
        onClick={() => i18n.changeLanguage('pseudo')}
      >
        Switch
      </button>
      <span data-testid="missing">{t('missing_key' as any)}</span>
    </div>
  );
}

async function initTestI18n() {
  await i18next
    .use(initReactI18next)
    .init({
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common'],
      resources: {
        en: {
          common: {
            welcome: 'Welcome',
            appName: 'RPG Balancer',
          },
        },
        pseudo: {
          common: {
            welcome: '!! Wééļččöméméé !!',
            appName: '!! RRPPGG ββååļļååñççéérr !!',
          },
        },
      },
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

describe('useTranslation', () => {
  beforeEach(async () => {
    await initTestI18n();
  });

  it('renders the current translation', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <TestComponent />
      </I18nextProvider>
    );

    expect(screen.getByTestId('welcome').textContent).toBe('Welcome');
  });

  it('switches language when i18n changes', async () => {
    render(
      <I18nextProvider i18n={i18next}>
        <TestComponent />
      </I18nextProvider>
    );

    fireEvent.click(screen.getByTestId('switch'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByTestId('welcome').textContent).toContain('!!');
  });

  it('returns the key when a translation is missing', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <TestComponent />
      </I18nextProvider>
    );

    expect(screen.getByTestId('missing').textContent).toBe('missing_key');
  });
});
