import type { Spell } from '@/balancing/spellTypes';
import { DEFAULT_SPELLS } from '@/balancing/defaultSpells';

export interface SpellLibraryPreset {
  id: string;
  label: string;
  description?: string;
  spells: Spell[];
}

export const SPELL_LIBRARY_PRESETS: SpellLibraryPreset[] = [
  {
    id: 'baseline-arsenal',
    label: 'Baseline Arsenal',
    description: 'Default trio used by the legacy Spell Library view.',
    spells: DEFAULT_SPELLS,
  },
];
