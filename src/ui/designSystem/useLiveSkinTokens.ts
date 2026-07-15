import { useEffect, useMemo, useState } from 'react';
import {
  BASE_SKIN_CSS_VARS,
  getSkinCssVariables,
} from '@/ui/idleVillage/skins/skinCssVariables';
import type { SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';

/**
 * useLiveSkinTokens — the live-token engine of the UI Review Room.
 *
 * Token names come from `getSkinCssVariables(presetId)` (the single source of
 * truth) and values are read LIVE from the document root via getComputedStyle,
 * so swatches always show what components actually consume — never a copied
 * hex. Re-reads whenever the preset changes.
 */

export interface LiveSkinToken {
  /** Full custom property name, e.g. '--skin-title-color' */
  name: string;
  /** Live resolved value (falls back to the registry value pre-mount) */
  value: string;
  /** 'override' when the active preset overrides the base value */
  source: 'base' | 'override';
  /** Group derived from the name prefix, e.g. 'surface', 'title', 'btn' */
  group: string;
}

export type LiveSkinTokenGroups = Record<string, LiveSkinToken[]>;

function groupOf(name: string): string {
  // '--skin-surface-bg' → 'surface' · '--skin-btn2-bg' → 'btn2'
  const rest = name.replace(/^--skin-/, '');
  return rest.split('-')[0];
}

export function useLiveSkinTokens(presetId: SkinPresetId): LiveSkinTokenGroups {
  const registryVars = useMemo(() => getSkinCssVariables(presetId), [presetId]);
  const [liveValues, setLiveValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // useSkinPreferences applies the vars inline on <html> in an effect
    // declared before this one, so a same-pass read sees fresh values.
    const computed = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const name of Object.keys(registryVars)) {
      next[name] = computed.getPropertyValue(name).trim();
    }
    setLiveValues(next);
  }, [registryVars]);

  return useMemo(() => {
    const groups: LiveSkinTokenGroups = {};
    for (const [name, registryValue] of Object.entries(registryVars)) {
      if (!name.startsWith('--skin-')) continue; // skip legacy --wl-* bridge
      const token: LiveSkinToken = {
        name,
        value: liveValues[name] || registryValue,
        source: BASE_SKIN_CSS_VARS[name as `--${string}`] === registryValue ? 'base' : 'override',
        group: groupOf(name),
      };
      (groups[token.group] ??= []).push(token);
    }
    return groups;
  }, [registryVars, liveValues]);
}

export default useLiveSkinTokens;
