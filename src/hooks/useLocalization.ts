import { useCallback, useSyncExternalStore } from 'react';
import {
  localizationService,
  type SupportedLocale,
  type WorkerTooltipCopy,
} from '@/localization/LocalizationService';

export interface LocalizationHandle {
  /** Currently active locale identifier */
  locale: SupportedLocale;
  /** Updates the active locale */
  setLocale: (locale: SupportedLocale) => void;
  /** Formats a template string with runtime params */
  format: (template: string, params?: Record<string, string | number>) => string;
  /** Copy dictionary for worker tooltips */
  workerTooltip: WorkerTooltipCopy;
}

/**
 * React hook that subscribes to the LocalizationService singleton and exposes
 * localized copy plus convenience helpers to UI components.
 */
export function useLocalization(): LocalizationHandle {
  const locale = useSyncExternalStore(
    (listener) => localizationService.subscribe(listener),
    () => localizationService.getLocale(),
  );

  const workerTooltip = localizationService.getWorkerTooltipCopy();

  const setLocale = useCallback(
    (nextLocale: SupportedLocale) => localizationService.setLocale(nextLocale),
    [],
  );

  const format = useCallback(
    (template: string, params?: Record<string, string | number>) =>
      localizationService.format(template, params),
    [],
  );

  return {
    locale,
    setLocale,
    format,
    workerTooltip,
  };
}
