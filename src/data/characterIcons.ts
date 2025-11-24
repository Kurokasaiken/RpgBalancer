// Character icon data with SVG and emoji
export interface CharacterIcon {
    id: string;
    name: string;
    emoji: string; // Fallback emoji
    svg?: string; // Optional SVG
    color: string;
    description: string;
}

export const CHARACTER_ICONS: Record<string, CharacterIcon> = {
    warrior: {
        id: 'warrior',
        name: 'Warrior',
        emoji: '🛡️',
        color: '#3b82f6', // Blue
        description: 'Brave melee fighter with sword and shield',
        svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#3b82f6"/>
      <path d="M32 24 L28 32 L36 32 Z" fill="#ffffff" stroke="#1e40af" stroke-width="2"/>
      <rect x="28" y="32" width="8" height="12" fill="#60a5fa" stroke="#1e40af" stroke-width="2"/>
      <circle cx="32" cy="20" r="6" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>
    </svg>`,
    },
    orc: {
        id: 'orc',
        name: 'Orc',
        emoji: '👹',
        color: '#ef4444', // Red
        description: 'Fierce orc raider with axe',
        svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#ef4444"/>
      <path d="M24 28 L40 28 L36 36 L28 36 Z" fill="#7f1d1d"/>
      <rect x="28" y="36" width="8" height="10" fill="#991b1b" stroke="#450a0a" stroke-width="2"/>
      <circle cx="32" cy="22" r="7" fill="#86efac" stroke="#14532d" stroke-width="2"/>
      <circle cx="28" cy="20" r="2" fill="#ffffff"/>
      <circle cx="36" cy="20" r="2" fill="#ffffff"/>
    </svg>`,
    },
    archer: {
        id: 'archer',
        name: 'Archer',
        emoji: '🏹',
        color: '#10b981', // Green
        description: 'Skilled ranger with bow and arrows',
        svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#10b981"/>
      <path d="M28 24 L36 32 L28 40" stroke="#ffffff" stroke-width="3" fill="none"/>
      <line x1="22" y1="32" x2="38" y2="32" stroke="#92400e" stroke-width="2"/>
      <circle cx="32" cy="20" r="5" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>
    </svg>`,
    },
    mage: {
        id: 'mage',
        name: 'Mage',
        emoji: '🧙',
        color: '#8b5cf6', // Purple
        description: 'Powerful spellcaster with arcane magic',
        svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#8b5cf6"/>
      <path d="M32 18 L28 26 L36 26 Z" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>
      <line x1="32" y1="26" x2="32" y2="42" stroke="#92400e" stroke-width="3"/>
      <circle cx="24" cy="34" r="3" fill="#60a5fa"/>
      <circle cx="40" cy="34" r="3" fill="#60a5fa"/>
      <circle cx="32" cy="20" r="5" fill="#f9a8d4" stroke="#831843" stroke-width="2"/>
    </svg>`,
    },
    skeleton: {
        id: 'skeleton',
        name: 'Skeleton',
        emoji: '💀',
        color: '#6b7280', // Gray
        description: 'Undead warrior risen from the grave',
        svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#6b7280"/>
      <circle cx="32" cy="24" r="8" fill="#f3f4f6" stroke="#1f2937" stroke-width="2"/>
      <circle cx="28" cy="22" r="2" fill="#000000"/>
      <circle cx="36" cy="22" r="2" fill="#000000"/>
      <rect x="28" y="32" width="8" height="12" fill="#e5e7eb" stroke="#1f2937" stroke-width="2"/>
    </svg>`,
    },
    dragon: {
        id: 'dragon',
        name: 'Dragon',
        emoji: '🐉',
        color: '#dc2626', //Dark Red
        description: 'Legendary dragon with fire breath',
        svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#dc2626"/>
      <path d="M20 28 L32 20 L44 28 L32 36 Z" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>
      <circle cx="26" cy="26" r="2" fill="#ffffff"/>
      <circle cx="38" cy="26" r="2" fill="#ffffff"/>
      <path d="M28 34 L32 38 L36 34" stroke="#92400e" stroke-width="2" fill="none"/>
    </svg>`,
    },
};

export const TILE_TYPES = {
    grass: {
        name: 'Grass',
        color: '#22c55e',
        pattern: true,
    },
    stone: {
        name: 'Stone',
        color: '#64748b',
        pattern: true,
    },
    sand: {
        name: 'Sand',
        color: '#fbbf24',
        pattern: true,
    },
    water: {
        name: 'Water',
        color: '#3b82f6',
        pattern: true,
    },
};
