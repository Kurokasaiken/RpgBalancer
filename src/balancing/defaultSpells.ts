// src/balancing/defaultSpells.ts – loads spells from JSON (currently only the base spell)

import type { Spell } from './spellTypes';
import spells from './spells.json';

export const DEFAULT_SPELLS: Spell[] = spells as Spell[];
