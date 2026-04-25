import type { ReactNode } from 'react';
import type { ThemePresetId } from '@/data/themePresets';

export interface StyleLabDescriptor {
  /** Optional helper copy that overrides the default preset description. */
  description?: string;
  /** Optional decorative badge rendered near the description. */
  badge?: ReactNode;
}

/**
 * Additional descriptors for the Style Laboratory presets.
 * This augments the base `themePresets` data with badges/notes used by UI surfaces.
 */
export const STYLE_LAB_DESCRIPTORS: Partial<Record<ThemePresetId, StyleLabDescriptor>> = {
  epicFrontier: {
    description: 'Basalto con inserti bronzo e bagliori cobalto per i test “heroic frontier”.',
    badge: (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-100">
        ✦ Observatory Deck
      </span>
    ),
  },
  frontier: {
    description: 'Pelle conciata, rame e luci calde: il baseline del Gilded Frontier.',
    badge: (
      <span className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-orange-200">
        ⟡ Field Study
      </span>
    ),
  },
  obsidian: {
    description: 'Plasma violetto e noir futurista per concept sci-fantasy.',
    badge: (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-violet-200">
        ⦿ Nebula Study
      </span>
    ),
  },
  ethereal: {
    description: 'Pietra alabastro e oro satinato, ideale per prove high-contrast.',
    badge: (
      <span className="inline-flex items-center gap-2 rounded-full border border-yellow-200/40 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-amber-600">
        ☼ Atelier Sheet
      </span>
    ),
  },
  vellumLight: {
    description: 'Pergamena calda e ottone per assicurare leggibilità massima.',
    badge: (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#d9c394] px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[#a0782a]">
        ☼ Atelier Sheet
      </span>
    ),
  },
};
