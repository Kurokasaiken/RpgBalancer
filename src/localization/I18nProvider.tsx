import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n, i18nReady } from './i18n';
import { localeConfigStore } from './LocaleConfigStore';

export interface I18nProviderProps {
  children: ReactNode;
}

/**
 * React provider that wraps the application with the i18next instance.
 *
 * It waits for i18next initialization, loads the persisted locale config,
 * switches the active language accordingly, and then renders children.
 * No Suspense is used.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      await i18nReady;
      const config = await localeConfigStore.init();
      if (mounted) {
        await i18n.changeLanguage(config.locale);
        setReady(true);
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{ready ? children : null}</I18nextProvider>;
}
