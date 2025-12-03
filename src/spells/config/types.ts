import type { z } from 'zod';

// Core spell definition used by the config-driven Spell Creator
export interface SpellDefinition {
  id: string;
  name: string;
  description: string;
  school:
    | 'evocation'
    | 'abjuration'
    | 'conjuration'
    | 'divination'
    | 'enchantment'
    | 'illusion'
    | 'necromancy'
    | 'transmutation';
  level: number; // 0-9
  castTime: string; // es. "1 action", "1 bonus action", "1 reaction"
  range: string; // es. "60 ft", "Self", "Touch"
  components: {
    v: boolean;
    s: boolean;
    m: string | null; // descrizione materiale o null
  };
  duration: string; // es. "Instantaneous", "Concentration, up to 1 minute"

  // Stats numeriche configurabili
  baseDamage: number; // danno base a livello indicato
  scaling: number; // moltiplicatore o incremento per slot/livello
  areaOfEffect: number; // raggio o lato area, in piedi
  saveDC: number; // Classe difficoltà salvataggio

  // Formule derivate opzionali (danno medio, DPS, ecc.)
  isDerived: boolean;
  formula?: string;

  // UI / metadati
  icon?: string;
  bgColor?: string;
  isLocked: boolean;
  isHidden: boolean;
}

export interface SpellCard {
  id: string;
  title: string;
  color: string; // es. "text-indigo-300"
  icon: string; // es. "🔥"
  spellIds: string[];
  isCore: boolean;
  order: number;
  isHidden: boolean;
}

export interface SpellPreset {
  id: string;
  name: string;
  description?: string;
  // override per configurazioni future (es. per archetipi o temi)
  spellOverrides: Record<string, Partial<SpellDefinition>>;
}

export interface SpellConfig {
  version: number;
  spells: Record<string, SpellDefinition>;
  cards: Record<string, SpellCard>;
  presets: Record<string, SpellPreset>;
  activePresetId: string;
}

export interface SpellConfigSnapshot {
  timestamp: number;
  label: string;
  config: SpellConfig;
}

// Helper per collegare Zod ai tipi TS
export type SpellDefinitionFromSchema<TSchema extends z.ZodTypeAny> = z.infer<TSchema>;
