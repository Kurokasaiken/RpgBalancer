import type { SpellConfig } from './types';

// Minimal structural default for the Spell Creator config.
// NOTE: non contiene alcuna spell o preset di dominio.
// Verrà sostituito da una sorgente di config reale (file JSON/TS dedicato)
// quando progettiamo il config-driven Spell Creator in linea con la filosofia.

export const DEFAULT_SPELL_CONFIG: SpellConfig = {
  version: 1,
  spells: {},
  cards: {},
  presets: {},
  activePresetId: 'default',
};
