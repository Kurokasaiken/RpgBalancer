/**
 * Interaction Mode Copy Configuration
 * 
 * Centralized copy strings for Idle Village Interaction Mode picker
 * Supports localization with fallbacks and structured metadata
 */

import { z } from 'zod';

/**
 * Copy entry structure for interaction mode strings
 */
export interface InteractionModeCopyEntry {
  /** Unique identifier for the copy entry */
  key: string;
  /** Primary text content */
  text: string;
  /** Detailed description for tooltips or help text */
  description: string;
  /** Fallback text if translation is missing */
  fallback: string;
  /** Locale identifier (e.g., 'it-IT', 'en-US') */
  locale: string;
  /** Category for organization (e.g., 'mode', 'action', 'help') */
  category: 'mode' | 'action' | 'help' | 'tooltip';
  /** Context where this copy is used */
  context: 'picker' | 'ftue' | 'help' | 'accessibility';
  /** Whether this copy should be translated */
  translatable: boolean;
  /** Maximum length for UI constraints */
  maxLength?: number;
  /** Accessibility attributes */
  accessibility?: {
    /** ARIA label for screen readers */
    ariaLabel?: string;
    /** ARIA description for additional context */
    ariaDescription?: string;
    /** Keyboard shortcut hint */
    keyHint?: string;
  };
}

/**
 * Interaction mode copy configuration schema
 */
export const InteractionModeCopyConfigSchema = z.object({
  /** Default locale for the application */
  defaultLocale: z.string().default('it-IT'),
  /** Supported locales */
  supportedLocales: z.array(z.string()).default(['it-IT', 'en-US']),
  /** Copy entries organized by key */
  entries: z.array(z.object({
    key: z.string(),
    text: z.string(),
    description: z.string(),
    fallback: z.string(),
    locale: z.string(),
    category: z.enum(['mode', 'action', 'help', 'tooltip']),
    context: z.enum(['picker', 'ftue', 'help', 'accessibility']),
    translatable: z.boolean(),
    maxLength: z.number().optional(),
    accessibility: z.object({
      ariaLabel: z.string().optional(),
      ariaDescription: z.string().optional(),
      keyHint: z.string().optional(),
    }).optional(),
  })),
  /** Metadata about the copy configuration */
  metadata: z.object({
    version: z.string(),
    lastUpdated: z.number(),
    totalEntries: z.number(),
    translationStatus: z.record(z.string(), z.enum(['complete', 'partial', 'missing'])),
  }),
});

/**
 * Type for interaction mode copy configuration
 */
export type InteractionModeCopyConfig = z.infer<typeof InteractionModeCopyConfigSchema>;

/**
 * Default interaction mode copy entries
 */
export const DEFAULT_INTERACTION_MODE_COPY_ENTRIES: InteractionModeCopyEntry[] = [
  // Mode Names
  {
    key: 'mode.sandbox',
    text: 'Sandbox',
    description: 'Modalità sandbox per test e sperimentazione',
    fallback: 'Sandbox',
    locale: 'it-IT',
    category: 'mode',
    context: 'picker',
    translatable: true,
    maxLength: 20,
    accessibility: {
      ariaLabel: 'Modalità Sandbox',
      keyHint: 'S',
    },
  },
  {
    key: 'mode.planning',
    text: 'Pianificazione',
    description: 'Modalità pianificazione per organizzare attività',
    fallback: 'Planning',
    locale: 'it-IT',
    category: 'mode',
    context: 'picker',
    translatable: true,
    maxLength: 20,
    accessibility: {
      ariaLabel: 'Modalità Pianificazione',
      keyHint: 'P',
    },
  },
  {
    key: 'mode.execution',
    text: 'Esecuzione',
    description: 'Modalità esecuzione per attività in corso',
    fallback: 'Execution',
    locale: 'it-IT',
    category: 'mode',
    context: 'picker',
    translatable: true,
    maxLength: 20,
    accessibility: {
      ariaLabel: 'Modalità Esecuzione',
      keyHint: 'E',
    },
  },
  {
    key: 'mode.analytics',
    text: 'Analitica',
    description: 'Modalità analitica per statistiche e report',
    fallback: 'Analytics',
    locale: 'it-IT',
    category: 'mode',
    context: 'picker',
    translatable: true,
    maxLength: 20,
    accessibility: {
      ariaLabel: 'Modalità Analitica',
      keyHint: 'A',
    },
  },

  // Actions
  {
    key: 'action.switch_mode',
    text: 'Cambia modalità',
    description: 'Cambia la modalità di interazione corrente',
    fallback: 'Switch mode',
    locale: 'it-IT',
    category: 'action',
    context: 'picker',
    translatable: true,
    maxLength: 30,
    accessibility: {
      ariaLabel: 'Cambia modalità di interazione',
      keyHint: 'M',
    },
  },
  {
    key: 'action.confirm_switch',
    text: 'Conferma cambio',
    description: 'Conferma il cambio di modalità',
    fallback: 'Confirm switch',
    locale: 'it-IT',
    category: 'action',
    context: 'picker',
    translatable: true,
    maxLength: 25,
    accessibility: {
      ariaLabel: 'Conferma cambio modalità',
      keyHint: 'Enter',
    },
  },
  {
    key: 'action.cancel_switch',
    text: 'Annulla',
    description: 'Annulla il cambio di modalità',
    fallback: 'Cancel',
    locale: 'it-IT',
    category: 'action',
    context: 'picker',
    translatable: true,
    maxLength: 15,
    accessibility: {
      ariaLabel: 'Annulla cambio',
      keyHint: 'Escape',
    },
  },

  // Help and Tooltips
  {
    key: 'help.mode_description',
    text: 'Seleziona la modalità di interazione per il villaggio',
    description: 'Descrizione del selettore modalità di interazione',
    fallback: 'Select interaction mode for the village',
    locale: 'it-IT',
    category: 'help',
    context: 'picker',
    translatable: true,
    maxLength: 60,
    accessibility: {
      ariaLabel: 'Aiuto selezione modalità',
      ariaDescription: 'Usa le frecce per navigare tra le modalità disponibili',
    },
  },
  {
    key: 'tooltip.sandbox_info',
    text: 'Modalità sandbox: testa nuove funzionalità senza effetti persistenti',
    description: 'Informazioni sulla modalità sandbox',
    fallback: 'Sandbox mode: test new features without persistent effects',
    locale: 'it-IT',
    category: 'tooltip',
    context: 'picker',
    translatable: true,
    maxLength: 80,
  },
  {
    key: 'tooltip.planning_info',
    text: 'Modalità pianificazione: organizza attività e assegna residenti',
    description: 'Informazioni sulla modalità pianificazione',
    fallback: 'Planning mode: organize activities and assign residents',
    locale: 'it-IT',
    category: 'tooltip',
    context: 'picker',
    translatable: true,
    maxLength: 80,
  },
  {
    key: 'tooltip.execution_info',
    text: 'Modalità esecuzione: monitora attività in tempo reale',
    description: 'Informazioni sulla modalità esecuzione',
    fallback: 'Execution mode: monitor activities in real time',
    locale: 'it-IT',
    category: 'tooltip',
    context: 'picker',
    translatable: true,
    maxLength: 80,
  },
  {
    key: 'tooltip.analytics_info',
    text: 'Modalità analitica: visualizza statistiche e report',
    description: 'Informazioni sulla modalità analitica',
    fallback: 'Analytics mode: view statistics and reports',
    locale: 'it-IT',
    category: 'tooltip',
    context: 'picker',
    translatable: true,
    maxLength: 80,
  },

  // FTUE Messages
  {
    key: 'ftue.welcome_title',
    text: 'Benvenuto nel Villaggio Idlio',
    description: 'Titolo di benvenuto per il FTUE',
    fallback: 'Welcome to Idle Village',
    locale: 'it-IT',
    category: 'help',
    context: 'ftue',
    translatable: true,
    maxLength: 40,
    accessibility: {
      ariaLabel: 'Titolo di benvenuto',
    },
  },
  {
    key: 'ftue.mode_selection_title',
    text: 'Scegli la tua modalità',
    description: 'Titolo per la selezione della modalità nel FTUE',
    fallback: 'Choose your mode',
    locale: 'it-IT',
    category: 'help',
    context: 'ftue',
    translatable: true,
    maxLength: 30,
    accessibility: {
      ariaLabel: 'Selezione modalità',
    },
  },
  {
    key: 'ftue.mode_selection_description',
    text: 'Ogni modalità offre un modo diverso di interagire con il villaggio. Inizia con la modalità Sandbox per imparare!',
    description: 'Descrizione della selezione modalità nel FTUE',
    fallback: 'Each mode offers a different way to interact with the village. Start with Sandbox mode to learn!',
    locale: 'it-IT',
    category: 'help',
    context: 'ftue',
    translatable: true,
    maxLength: 120,
    accessibility: {
      ariaLabel: 'Descrizione modalità',
      ariaDescription: 'Informazioni sulle diverse modalità di interazione disponibili',
    },
  },

  // Accessibility Messages
  {
    key: 'accessibility.mode_changed',
    text: 'Modalità cambiata in {mode}',
    description: 'Annuncio di cambio modalità per screen reader',
    fallback: 'Mode changed to {mode}',
    locale: 'it-IT',
    category: 'help',
    context: 'accessibility',
    translatable: true,
    maxLength: 50,
    accessibility: {
      ariaLabel: 'Notifica cambio modalità',
      ariaDescription: 'Annuncio quando la modalità di interazione viene cambiata',
    },
  },
  {
    key: 'accessibility.mode_selector_open',
    text: 'Selettore modalità aperto',
    description: 'Annuncio di apertura selettore modalità',
    fallback: 'Mode selector opened',
    locale: 'it-IT',
    category: 'help',
    context: 'accessibility',
    translatable: true,
    maxLength: 30,
    accessibility: {
      ariaLabel: 'Selettore modalità aperto',
      ariaDescription: 'Il selettore di modalità è stato aperto',
    },
  },
  {
    key: 'accessibility.mode_selector_closed',
    text: 'Selettore modalità chiuso',
    description: 'Annuncio di chiusura selettore modalità',
    fallback: 'Mode selector closed',
    locale: 'it-IT',
    category: 'help',
    context: 'accessibility',
    translatable: true,
    maxLength: 30,
    accessibility: {
      ariaLabel: 'Selettore modalità chiuso',
      ariaDescription: 'Il selettore di modalità è stato chiuso',
    },
  },
];

/**
 * Default interaction mode copy configuration
 */
export const DEFAULT_INTERACTION_MODE_COPY_CONFIG: InteractionModeCopyConfig = {
  defaultLocale: 'it-IT',
  supportedLocales: ['it-IT', 'en-US'],
  entries: DEFAULT_INTERACTION_MODE_COPY_ENTRIES,
  metadata: {
    version: '1.0.0',
    lastUpdated: Date.now(),
    totalEntries: DEFAULT_INTERACTION_MODE_COPY_ENTRIES.length,
    translationStatus: {
      'it-IT': 'complete',
      'en-US': 'partial',
    },
  },
};

/**
 * Get copy entry by key and locale
 */
export function getCopyEntry(
  key: string,
  locale: string = DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale
): InteractionModeCopyEntry | null {
  const entry = DEFAULT_INTERACTION_MODE_COPY_CONFIG.entries.find(
    e => e.key === key && e.locale === locale
  );
  
  if (!entry) {
    // Try fallback locale
    const fallbackEntry = DEFAULT_INTERACTION_MODE_COPY_CONFIG.entries.find(
      e => e.key === key && e.locale === DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale
    );
    
    if (fallbackEntry) {
      return fallbackEntry;
    }
    
    // Try any locale as last resort
    const anyEntry = DEFAULT_INTERACTION_MODE_COPY_CONFIG.entries.find(
      e => e.key === key
    );
    
    return anyEntry || null;
  }
  
  return entry;
}

/**
 * Get copy text by key and locale
 */
export function getCopyText(
  key: string,
  locale: string = DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale
): string {
  const entry = getCopyEntry(key, locale);
  return entry?.text || key;
}

/**
 * Get copy description by key and locale
 */
export function getCopyDescription(
  key: string,
  locale: string = DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale
): string {
  const entry = getCopyEntry(key, locale);
  return entry?.description || '';
}

/**
 * Get copy entries by category
 */
export function getCopyByCategory(
  category: InteractionModeCopyEntry['category'],
  locale: string = DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale
): InteractionModeCopyEntry[] {
  return DEFAULT_INTERACTION_MODE_COPY_CONFIG.entries.filter(
    entry => entry.category === category && entry.locale === locale
  );
}

/**
 * Get copy entries by context
 */
export function getCopyByContext(
  context: InteractionModeCopyEntry['context'],
  locale: string = DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale
): InteractionModeCopyEntry[] {
  return DEFAULT_INTERACTION_MODE_COPY_CONFIG.entries.filter(
    entry => entry.context === context && entry.locale === locale
  );
}

/**
 * Check if copy entry is translatable
 */
export function isCopyTranslatable(key: string): boolean {
  const entry = DEFAULT_INTERACTION_MODE_COPY_CONFIG.entries.find(e => e.key === key);
  return entry?.translatable ?? false;
}

/**
 * Get accessibility attributes for a copy entry
 */
export function getCopyAccessibility(
  key: string,
  locale: string = DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale
): InteractionModeCopyEntry['accessibility'] | null {
  const entry = getCopyEntry(key, locale);
  return entry?.accessibility || null;
}

/**
 * Format copy text with placeholders
 */
export function formatCopyText(
  key: string,
  placeholders: Record<string, string>,
  locale: string = DEFAULT_INTERACTION_MODE_COPY_CONFIG.defaultLocale
): string {
  const text = getCopyText(key, locale);
  let formatted = text;
  
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    formatted = formatted.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
  });
  
  return formatted;
}
