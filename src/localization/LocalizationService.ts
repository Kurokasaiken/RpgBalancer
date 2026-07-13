import { LocalizationServiceAdapter } from './adapters/LocalizationServiceAdapter';
import type { SupportedLocale } from './LocaleConfig';
import type {
  WorkerRiskLevelKey,
  WorkerRecommendationKey,
  WorkerTooltipLabels,
  WorkerTooltipCopy,
} from './types';

export type {
  WorkerRiskLevelKey,
  WorkerRecommendationKey,
  WorkerTooltipLabels,
  WorkerTooltipCopy,
  SupportedLocale,
};

/**
 * Legacy LocalizationService facade.
 * Delegates all operations to the i18next-backed LocalizationServiceAdapter
 * while preserving the original public API.
 */
export class LocalizationService {
  private static instance: LocalizationService;

  private readonly adapter: LocalizationServiceAdapter;

  private constructor() {
    this.adapter = LocalizationServiceAdapter.getInstance();
  }

  /**
   * Returns the singleton instance of the service.
   */
  public static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService();
    }
    return LocalizationService.instance;
  }

  public getLocale(): SupportedLocale {
    return this.adapter.getLocale();
  }

  public setLocale(locale: SupportedLocale): void {
    this.adapter.setLocale(locale);
  }

  public getWorkerTooltipCopy(): WorkerTooltipCopy {
    return this.adapter.getWorkerTooltipCopy();
  }

  public format(template: string, params?: Record<string, string | number>): string {
    return this.adapter.format(template, params);
  }

  public subscribe(listener: () => void): () => void {
    return this.adapter.subscribe(listener);
  }
}

export const localizationService = LocalizationService.getInstance();
