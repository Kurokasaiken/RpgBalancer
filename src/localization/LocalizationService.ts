import idleVillageTooltipsJson from '@/data/idleVillage/tooltips.json';

export type WorkerRiskLevelKey = 'low' | 'medium' | 'high' | 'critical';
export type WorkerRecommendationKey = 'lowHp' | 'highFatigue' | 'injured' | 'critical';

/**
 * Label entries exposed to the UI when rendering worker tooltips.
 */
export interface WorkerTooltipLabels {
  hp?: string;
  fatigue?: string;
  performance?: string;
  specialties?: string;
  bio?: string;
  recommendations?: string;
  risk?: string;
}

/**
 * Copy dictionary for Idle Village worker tooltips.
 */
export interface WorkerTooltipCopy {
  labels?: WorkerTooltipLabels;
  statuses?: Partial<Record<string, string>>;
  riskLevels?: Partial<Record<WorkerRiskLevelKey, string>>;
  recommendations?: Partial<Record<WorkerRecommendationKey, string>>;
  accessibility?: {
    tooltipDetails?: string;
    riskBadge?: string;
    closeTooltip?: string;
  };
  actions?: Partial<Record<'close', string>>;
  sections?: Partial<Record<'quote', string>>;
}

/**
 * Localization bundle containing Idle Village dictionaries per locale.
 */
interface IdleVillageLocalizationBundle {
  workerTooltip: WorkerTooltipCopy;
}

type IdleVillageTooltipDictionary = Record<string, IdleVillageLocalizationBundle>;

const idleVillageTooltips = idleVillageTooltipsJson as IdleVillageTooltipDictionary;

export type SupportedLocale = keyof typeof idleVillageTooltips;

/**
 * Centralized localization service in charge of loading dictionaries,
 * tracking the active locale, and providing helpers for components/hooks.
 */
export class LocalizationService {
  private static instance: LocalizationService;

  private currentLocale: SupportedLocale = 'en';
  private readonly tooltipsDictionary: IdleVillageTooltipDictionary;
  private readonly listeners = new Set<() => void>();

  private constructor(tooltipsDictionary: IdleVillageTooltipDictionary = idleVillageTooltips) {
    this.tooltipsDictionary = tooltipsDictionary;
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

  /**
   * Returns the currently active locale.
   */
  public getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Sets the active locale if the dictionary exists.
   */
  public setLocale(locale: SupportedLocale): void {
    if (!this.tooltipsDictionary[locale]) {
      throw new Error(`Locale ${locale} is not supported.`);
    }
    this.currentLocale = locale;
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Returns the worker tooltip copy for the active locale.
   */
  public getWorkerTooltipCopy(): WorkerTooltipCopy {
    return this.tooltipsDictionary[this.currentLocale].workerTooltip;
  }

  /**
   * Replaces placeholders in the provided template with runtime parameters.
   */
  public format(template: string, params?: Record<string, string | number>): string {
    if (!params) {
      return template;
    }
    return Object.entries(params).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`{${key}}`, 'g'), String(value)),
      template,
    );
  }

  /**
   * Registers a listener that will be notified whenever the locale changes.
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const localizationService = LocalizationService.getInstance();
