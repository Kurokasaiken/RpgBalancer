/**
 * SVG silhouettes for sea creatures — placeholder until artist designs final assets.
 * Proportioned for world-surface rendering (60-90px wide, matching bird scale).
 *
 * All creatures are rendered as React components consuming renderMode='custom'.
 */

export const OCTOPUS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90">
  <!-- Head/mantle -->
  <ellipse cx="40" cy="35" rx="28" ry="32" fill="currentColor" opacity="0.8"/>

  <!-- Eyes -->
  <circle cx="32" cy="30" r="4" fill="#ffffff" opacity="0.6"/>
  <circle cx="48" cy="30" r="4" fill="#ffffff" opacity="0.6"/>

  <!-- Tentacles: 8 curved paths -->
  <path d="M 20 65 Q 15 75 18 85" stroke="currentColor" stroke-width="3" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 30 68 Q 25 80 28 88" stroke="currentColor" stroke-width="3" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 40 70 Q 38 82 40 90" stroke="currentColor" stroke-width="3" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 50 68 Q 55 80 52 88" stroke="currentColor" stroke-width="3" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 60 65 Q 65 75 62 85" stroke="currentColor" stroke-width="3" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 35 62 Q 28 75 30 86" stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round"/>
  <path d="M 45 62 Q 52 75 50 86" stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round"/>
  <path d="M 40 65 Q 40 78 42 88" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>
</svg>
`;

export const SQUID_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 95">
  <!-- Head/mantle -->
  <ellipse cx="35" cy="30" rx="20" ry="28" fill="currentColor" opacity="0.8"/>

  <!-- Eye -->
  <circle cx="35" cy="26" r="3" fill="#ffffff" opacity="0.6"/>

  <!-- Tentacles: elongated squid style -->
  <path d="M 22 55 Q 15 70 14 88 Q 14 92 18 92" stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 30 58 Q 24 75 24 90" stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 35 60 Q 35 78 35 94" stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 40 58 Q 46 75 46 90" stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M 48 55 Q 55 70 56 88 Q 56 92 52 92" stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.7" stroke-linecap="round"/>

  <!-- Fins (sides) -->
  <path d="M 16 35 Q 8 40 12 48" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>
  <path d="M 54 35 Q 62 40 58 48" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>
</svg>
`;

export const LEVIATHAN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70">
  <!-- Body: elongated serpentine shape -->
  <path d="M 10 40 Q 25 30 40 35 Q 55 40 70 30 Q 85 25 95 35" stroke="currentColor" stroke-width="18" fill="none" opacity="0.75" stroke-linecap="round"/>

  <!-- Head -->
  <ellipse cx="8" cy="42" rx="8" ry="10" fill="currentColor" opacity="0.8"/>

  <!-- Eye -->
  <circle cx="6" cy="38" r="2" fill="#ffffff" opacity="0.6"/>

  <!-- Dorsal spikes -->
  <line x1="25" y1="30" x2="23" y2="18" stroke="currentColor" stroke-width="1.5" opacity="0.6" stroke-linecap="round"/>
  <line x1="40" y1="33" x2="40" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.6" stroke-linecap="round"/>
  <line x1="55" y1="28" x2="57" y2="16" stroke="currentColor" stroke-width="1.5" opacity="0.6" stroke-linecap="round"/>
  <line x1="70" y1="28" x2="72" y2="16" stroke="currentColor" stroke-width="1.5" opacity="0.6" stroke-linecap="round"/>
</svg>
`;

export type CreatureType = 'octopus' | 'squid' | 'leviathan';

export const CREATURE_SVGS: Record<CreatureType, string> = {
  octopus: OCTOPUS_SVG,
  squid: SQUID_SVG,
  leviathan: LEVIATHAN_SVG,
};

export function getCreatureSVG(type: CreatureType): string {
  return CREATURE_SVGS[type] || OCTOPUS_SVG;
}
