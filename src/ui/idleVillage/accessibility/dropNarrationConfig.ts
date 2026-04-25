/**
 * Drop Narration Configuration
 * 
 * Config-first VoiceOver narration system for drag/drop outcomes
 * following "Il Drago" art direction with moodboard tokens.
 * 
 * @since NP-086 – Idle Village Drop VoiceOver Narration
 */

/**
 * Drop outcome types for narration
 */
export type DropOutcomeType = 
  | 'valid'
  | 'invalid' 
  | 'warning'
  | 'blocked';

/**
 * Narration context types
 */
export type NarrationContext = 
  | 'resident_to_activity'
  | 'resident_to_location'
  | 'activity_swap'
  | 'resident_rest'
  | 'equipment_transfer';

/**
 * Voice and tone configuration
 */
export interface VoiceConfiguration {
  /** Voice gender preference */
  gender: 'male' | 'female' | 'neutral';
  /** Voice age range */
  age: 'young' | 'adult' | 'elder';
  /** Voice pitch */
  pitch: 'low' | 'medium' | 'high';
  /** Speech rate */
  rate: 'slow' | 'normal' | 'fast';
  /** Voice volume */
  volume: number; // 0.0 to 1.0
}

/**
 * Narration phrase template
 */
export interface NarrationTemplate {
  /** Template string with tokens */
  template: string;
  /** Available tokens in template */
  tokens: string[];
  /** Priority for announcement */
  priority: 'polite' | 'assertive';
  /** Approximate duration in milliseconds */
  durationMs: number;
  /** Voice configuration override */
  voice?: Partial<VoiceConfiguration>;
}

/**
 * Locale-specific narration configuration
 */
export interface LocaleNarrationConfig {
  /** Locale code (ISO 639-1) */
  locale: string;
  /** Display name for locale */
  displayName: string;
  /** Narration templates by outcome type */
  templates: Record<DropOutcomeType, Record<NarrationContext, NarrationTemplate[]>>;
  /** Default voice configuration */
  defaultVoice: VoiceConfiguration;
  /** Moodboard tokens mapping */
  moodboardTokens: Record<string, string>;
}

/**
 * Global drop narration configuration
 */
export interface DropNarrationConfig {
  /** Enable/disable narration system */
  enabled: boolean;
  /** Supported locales */
  locales: LocaleNarrationConfig[];
  /** Current active locale */
  currentLocale: string;
  /** Global voice configuration */
  globalVoice: VoiceConfiguration;
  /** Narration timing settings */
  timing: {
    /** Delay before first narration */
    initialDelayMs: number;
    /** Minimum delay between narrations */
    minIntervalMs: number;
    /** Maximum narration duration */
    maxDurationMs: number;
    /** Fade out duration */
    fadeOutMs: number;
  };
  /** Feature flags */
  features: {
    /** Enable contextual variations */
    enableContextualVariations: boolean;
    /** Enable moodboard token substitution */
    enableMoodboardTokens: boolean;
    /** Enable voice synthesis */
    enableVoiceSynthesis: boolean;
    /** Enable narration caching */
    enableCaching: boolean;
  };
}

/**
 * Moodboard token mappings from "Il Drago" art direction
 */
export const MOODBOARD_TOKENS = {
  // Wilderness tokens
  'wilderness.timber': 'legno grezzo',
  'wilderness.stone': 'pietra alpina',
  'wilderness.thatch': 'paglia dorata',
  'wilderness.azure': 'cielo azzurro terso',
  'wilderness.river': 'fiume cristallino',
  'wilderness.forest': 'foresta antica',
  'wilderness.mountain': 'picchi montagnosi',
  
  // Empire tokens  
  'empire.basalt': 'basalto nero venato',
  'empire.bronze': 'bronzo barocco',
  'empire.silk': 'sete iridescenti',
  'empire.indigo': 'vuoto prismatico',
  'empire.desert': 'deserti basaltici',
  'empire.monument': 'architetture colossali',
  
  // Art direction tokens
  'art.solar_triumph': 'trionfo solare',
  'art.rude_beauty': 'rude bellezza',
  'art.prismatic': 'prismatico',
  'art.monumental': 'monumentale',
  'art.adventure': 'avventura',
  'art.nobility': 'nobiltà',
  
  // Material tokens
  'material.golden': 'dorato',
  'material.crystal': 'cristallino',
  'material.sacred': 'sacro',
  'material.ancient': 'antico',
  'material.weathered': 'invecchiato',
  'material.sculpted': 'scolpito',
  
  // Light tokens
  'light.solar': 'solare',
  'light.divine': 'divino',
  'light.prismatic': 'prismatico',
  'shadow.teal': 'ombra turchese',
  'shadow.deep': 'profondo',
  'shadow.cool': 'fresco',
} as const;

/**
 * English translations for moodboard tokens
 */
const ENGLISH_MOODBOARD_TRANSLATIONS: Record<string, string> = {
  'wilderness.timber': 'raw timber',
  'wilderness.stone': 'alpine stone',
  'wilderness.thatch': 'golden thatch',
  'wilderness.azure': 'clear azure sky',
  'wilderness.river': 'crystal river',
  'wilderness.forest': 'ancient forest',
  'wilderness.mountain': 'mountain peaks',
  'empire.basalt': 'veined black basalt',
  'empire.bronze': 'baroque bronze',
  'empire.silk': 'iridescent silks',
  'empire.indigo': 'prismatic void',
  'empire.desert': 'basaltic deserts',
  'empire.monument': 'colossal architecture',
  'art.solar_triumph': 'solar triumph',
  'art.rude_beauty': 'rugged beauty',
  'art.prismatic': 'prismatic',
  'art.monumental': 'monumental',
  'art.adventure': 'adventure',
  'art.nobility': 'nobility',
  'material.golden': 'golden',
  'material.crystal': 'crystalline',
  'material.sacred': 'sacred',
  'material.ancient': 'ancient',
  'material.weathered': 'weathered',
  'material.sculpted': 'sculpted',
  'light.solar': 'solar light',
  'light.divine': 'divine light',
  'light.prismatic': 'prismatic light',
  'shadow.teal': 'teal shadow',
  'shadow.deep': 'deep shadow',
  'shadow.cool': 'cool shadow',
};

/**
 * Italian locale configuration (primary)
 */
export const ITALIAN_LOCALE_CONFIG: LocaleNarrationConfig = {
  locale: 'it',
  displayName: 'Italiano',
  defaultVoice: {
    gender: 'neutral',
    age: 'adult',
    pitch: 'medium',
    rate: 'normal',
    volume: 0.8,
  },
  moodboardTokens: MOODBOARD_TOKENS,
  templates: {
    valid: {
      resident_to_activity: [
        {
          template: '{residentName} ha iniziato a lavorare a {activityName}. {locationDescription}',
          tokens: ['residentName', 'activityName', 'locationDescription'],
          priority: 'polite',
          durationMs: 3000,
        },
        {
          template: 'Perfetto! {residentName} ora è assegnato a {activityName} nel {locationType}',
          tokens: ['residentName', 'activityName', 'locationType'],
          priority: 'polite',
          durationMs: 2500,
        },
      ],
      resident_to_location: [
        {
          template: '{residentName} si è spostato verso {locationName}. {locationDescription}',
          tokens: ['residentName', 'locationName', 'locationDescription'],
          priority: 'polite',
          durationMs: 2800,
        },
      ],
      activity_swap: [
        {
          template: '{residentName} ha cambiato attività: da {oldActivity} a {newActivity}',
          tokens: ['residentName', 'oldActivity', 'newActivity'],
          priority: 'polite',
          durationMs: 2500,
        },
      ],
      resident_rest: [
        {
          template: '{residentName} si sta riposando. Riprenderà energie presto.',
          tokens: ['residentName'],
          priority: 'polite',
          durationMs: 2000,
        },
      ],
      equipment_transfer: [
        {
          template: '{itemName} trasferito a {recipientName} con successo.',
          tokens: ['itemName', 'recipientName'],
          priority: 'polite',
          durationMs: 2000,
        },
      ],
    },
    invalid: {
      resident_to_activity: [
        {
          template: 'Impossibile assegnare {residentName} a {activityName}. {reason}',
          tokens: ['residentName', 'activityName', 'reason'],
          priority: 'assertive',
          durationMs: 2500,
        },
        {
          template: '{residentName} non può lavorare qui. {suggestion}',
          tokens: ['residentName', 'suggestion'],
          priority: 'assertive',
          durationMs: 2000,
        },
      ],
      resident_to_location: [
        {
          template: '{locationName} non è accessibile per {residentName}. {reason}',
          tokens: ['locationName', 'residentName', 'reason'],
          priority: 'assertive',
          durationMs: 2500,
        },
      ],
      activity_swap: [
        {
          template: 'Cambio attività fallito per {residentName}. {reason}',
          tokens: ['residentName', 'reason'],
          priority: 'assertive',
          durationMs: 2000,
        },
      ],
      resident_rest: [
        {
          template: '{residentName} non può riposare ora. {reason}',
          tokens: ['residentName', 'reason'],
          priority: 'assertive',
          durationMs: 1800,
        },
      ],
      equipment_transfer: [
        {
          template: 'Trasferimento di {itemName} fallito. {reason}',
          tokens: ['itemName', 'reason'],
          priority: 'assertive',
          durationMs: 2000,
        },
      ],
    },
    warning: {
      resident_to_activity: [
        {
          template: 'Attenzione: {residentName} è stanco ma può lavorare a {activityName}',
          tokens: ['residentName', 'activityName'],
          priority: 'polite',
          durationMs: 2500,
        },
        {
          template: '{activityName} è quasi pieno, ma {residentName} può ancora unirsi',
          tokens: ['activityName', 'residentName'],
          priority: 'polite',
          durationMs: 2300,
        },
      ],
      resident_to_location: [
        {
          template: 'Attenzione: {locationName} è rischioso per {residentName}',
          tokens: ['locationName', 'residentName'],
          priority: 'polite',
          durationMs: 2000,
        },
      ],
      activity_swap: [
        {
          template: 'Attenzione: il cambio potrebbe affaticare {residentName}',
          tokens: ['residentName'],
          priority: 'polite',
          durationMs: 1800,
        },
      ],
      resident_rest: [
        {
          template: '{residentName} riposerà, ma potrebbe essere necessario presto',
          tokens: ['residentName'],
          priority: 'polite',
          durationMs: 2200,
        },
      ],
      equipment_transfer: [
        {
          template: 'Attenzione: trasferimento di {itemName} potrebbe influenzare le attività',
          tokens: ['itemName'],
          priority: 'polite',
          durationMs: 2500,
        },
      ],
    },
    blocked: {
      resident_to_activity: [
        {
          template: 'Bloccato: {activityName} non è disponibile per {residentName}',
          tokens: ['activityName', 'residentName'],
          priority: 'assertive',
          durationMs: 2000,
        },
        {
          template: 'Impossibile: {residentName} non può accedere a {activityName} in questo momento',
          tokens: ['residentName', 'activityName'],
          priority: 'assertive',
          durationMs: 2500,
        },
      ],
      resident_to_location: [
        {
          template: 'Accesso negato: {locationName} è bloccato',
          tokens: ['locationName'],
          priority: 'assertive',
          durationMs: 1800,
        },
      ],
      activity_swap: [
        {
          template: 'Cambio bloccato: {residentName} deve completare l\'attività corrente',
          tokens: ['residentName'],
          priority: 'assertive',
          durationMs: 2200,
        },
      ],
      resident_rest: [
        {
          template: '{residentName} non può riposare ora. Attività in corso.',
          tokens: ['residentName'],
          priority: 'assertive',
          durationMs: 2000,
        },
      ],
      equipment_transfer: [
        {
          template: 'Trasferimento bloccato: {itemName} è in uso',
          tokens: ['itemName'],
          priority: 'assertive',
          durationMs: 1800,
        },
      ],
    },
  },
};

/**
 * English locale configuration
 */
export const ENGLISH_LOCALE_CONFIG: LocaleNarrationConfig = {
  locale: 'en',
  displayName: 'English',
  defaultVoice: {
    gender: 'neutral',
    age: 'adult',
    pitch: 'medium',
    rate: 'normal',
    volume: 0.8,
  },
  moodboardTokens: Object.fromEntries(
    Object.entries(MOODBOARD_TOKENS).map(([key, value]) => [
      key,
      ENGLISH_MOODBOARD_TRANSLATIONS[key] || value,
    ])
  ),
  templates: {
    valid: {
      resident_to_activity: [
        {
          template: '{residentName} started working at {activityName}. {locationDescription}',
          tokens: ['residentName', 'activityName', 'locationDescription'],
          priority: 'polite',
          durationMs: 3000,
        },
        {
          template: 'Perfect! {residentName} is now assigned to {activityName} in the {locationType}',
          tokens: ['residentName', 'activityName', 'locationType'],
          priority: 'polite',
          durationMs: 2500,
        },
      ],
      resident_to_location: [
        {
          template: '{residentName} moved to {locationName}. {locationDescription}',
          tokens: ['residentName', 'locationName', 'locationDescription'],
          priority: 'polite',
          durationMs: 2800,
        },
      ],
      activity_swap: [
        {
          template: '{residentName} changed activity: from {oldActivity} to {newActivity}',
          tokens: ['residentName', 'oldActivity', 'newActivity'],
          priority: 'polite',
          durationMs: 2500,
        },
      ],
      resident_rest: [
        {
          template: '{residentName} is resting. Will regain energy soon.',
          tokens: ['residentName'],
          priority: 'polite',
          durationMs: 2000,
        },
      ],
      equipment_transfer: [
        {
          template: '{itemName} transferred to {recipientName} successfully.',
          tokens: ['itemName', 'recipientName'],
          priority: 'polite',
          durationMs: 2000,
        },
      ],
    },
    invalid: {
      resident_to_activity: [
        {
          template: 'Cannot assign {residentName} to {activityName}. {reason}',
          tokens: ['residentName', 'activityName', 'reason'],
          priority: 'assertive',
          durationMs: 2500,
        },
        {
          template: '{residentName} cannot work here. {suggestion}',
          tokens: ['residentName', 'suggestion'],
          priority: 'assertive',
          durationMs: 2000,
        },
      ],
      resident_to_location: [
        {
          template: '{locationName} is not accessible for {residentName}. {reason}',
          tokens: ['locationName', 'residentName', 'reason'],
          priority: 'assertive',
          durationMs: 2500,
        },
      ],
      activity_swap: [
        {
          template: 'Activity change failed for {residentName}. {reason}',
          tokens: ['residentName', 'reason'],
          priority: 'assertive',
          durationMs: 2000,
        },
      ],
      resident_rest: [
        {
          template: '{residentName} cannot rest now. {reason}',
          tokens: ['residentName', 'reason'],
          priority: 'assertive',
          durationMs: 1800,
        },
      ],
      equipment_transfer: [
        {
          template: 'Transfer of {itemName} failed. {reason}',
          tokens: ['itemName', 'reason'],
          priority: 'assertive',
          durationMs: 2000,
        },
      ],
    },
    warning: {
      resident_to_activity: [
        {
          template: 'Warning: {residentName} is tired but can work at {activityName}',
          tokens: ['residentName', 'activityName'],
          priority: 'polite',
          durationMs: 2500,
        },
        {
          template: '{activityName} is almost full, but {residentName} can still join',
          tokens: ['activityName', 'residentName'],
          priority: 'polite',
          durationMs: 2300,
        },
      ],
      resident_to_location: [
        {
          template: 'Warning: {locationName} is risky for {residentName}',
          tokens: ['locationName', 'residentName'],
          priority: 'polite',
          durationMs: 2000,
        },
      ],
      activity_swap: [
        {
          template: 'Warning: the change might tire {residentName}',
          tokens: ['residentName'],
          priority: 'polite',
          durationMs: 1800,
        },
      ],
      resident_rest: [
        {
          template: '{residentName} will rest, but might be needed soon',
          tokens: ['residentName'],
          priority: 'polite',
          durationMs: 2200,
        },
      ],
      equipment_transfer: [
        {
          template: 'Warning: transferring {itemName} might affect activities',
          tokens: ['itemName'],
          priority: 'polite',
          durationMs: 2500,
        },
      ],
    },
    blocked: {
      resident_to_activity: [
        {
          template: 'Blocked: {activityName} is not available for {residentName}',
          tokens: ['activityName', 'residentName'],
          priority: 'assertive',
          durationMs: 2000,
        },
        {
          template: 'Unable: {residentName} cannot access {activityName} at this time',
          tokens: ['residentName', 'activityName'],
          priority: 'assertive',
          durationMs: 2500,
        },
      ],
      resident_to_location: [
        {
          template: 'Access denied: {locationName} is blocked',
          tokens: ['locationName'],
          priority: 'assertive',
          durationMs: 1800,
        },
      ],
      activity_swap: [
        {
          template: 'Change blocked: {residentName} must complete current activity',
          tokens: ['residentName'],
          priority: 'assertive',
          durationMs: 2200,
        },
      ],
      resident_rest: [
        {
          template: '{residentName} cannot rest now. Activity in progress.',
          tokens: ['residentName'],
          priority: 'assertive',
          durationMs: 2000,
        },
      ],
      equipment_transfer: [
        {
          template: 'Transfer blocked: {itemName} is in use',
          tokens: ['itemName'],
          priority: 'assertive',
          durationMs: 1800,
        },
      ],
    },
  },
};

/**
 * Default drop narration configuration
 */
export const DEFAULT_DROP_NARRATION_CONFIG: DropNarrationConfig = {
  enabled: true,
  locales: [ITALIAN_LOCALE_CONFIG, ENGLISH_LOCALE_CONFIG],
  currentLocale: 'it',
  globalVoice: {
    gender: 'neutral',
    age: 'adult',
    pitch: 'medium',
    rate: 'normal',
    volume: 0.8,
  },
  timing: {
    initialDelayMs: 100,
    minIntervalMs: 500,
    maxDurationMs: 5000,
    fadeOutMs: 200,
  },
  features: {
    enableContextualVariations: true,
    enableMoodboardTokens: true,
    enableVoiceSynthesis: true,
    enableCaching: true,
  },
};

/**
 * Get locale configuration by code
 */
export function getLocaleConfig(locale: string): LocaleNarrationConfig {
  const config = DEFAULT_DROP_NARRATION_CONFIG.locales.find(l => l.locale === locale);
  return config || ITALIAN_LOCALE_CONFIG; // Fallback to Italian
}

/**
 * Get narration templates for outcome and context
 */
export function getNarrationTemplates(
  outcome: DropOutcomeType,
  context: NarrationContext,
  locale: string = 'it'
): NarrationTemplate[] {
  const localeConfig = getLocaleConfig(locale);
  return localeConfig.templates[outcome]?.[context] || [];
}

/**
 * Substitute moodboard tokens in template
 */
export function substituteMoodboardTokens(
  template: string,
  tokens: Record<string, string>,
  locale: string = 'it'
): string {
  const localeConfig = getLocaleConfig(locale);
  const moodboardTokens = localeConfig.moodboardTokens;
  
  let result = template;
  
  // Substitute moodboard tokens
  Object.entries(moodboardTokens).forEach(([token, value]) => {
    const tokenPattern = new RegExp(`{${token}}`, 'g');
    result = result.replace(tokenPattern, value);
  });
  
  // Substitute custom tokens
  Object.entries(tokens).forEach(([key, value]) => {
    const tokenPattern = new RegExp(`{${key}}`, 'g');
    result = result.replace(tokenPattern, value);
  });
  
  return result;
}
