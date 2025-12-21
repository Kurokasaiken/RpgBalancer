import type { SpritePalette } from '../../shared/types/visual';

/**
 * Combat Sprite Registry
 *
 * Config-driven mapping between archetype tags and vector sprite assets.
 * All presentation layers should consume these definitions instead of
 * hardcoding sprite paths or colors.
 */

export type CombatSpriteState =
    | 'idle'
    | 'windup'
    | 'attack'
    | 'hit'
    | 'defeated'
    | 'statusFx';

export interface SpriteFrame {
    assetId: string;
    durationMs?: number;
}

export interface SpriteAsset {
    /** Primary asset id used when no frame sequence defined */
    assetId: string;
    /** Optional frame sequence for animated states */
    frames?: SpriteFrame[];
    loop?: boolean;
    /** Base width/height (px) for scaling */
    size: { width: number; height: number };
    /** Optional offset to align the sprite on stage */
    offset?: { x: number; y: number };
    /** Optional loop duration (ms) for idle/FX states */
    durationMs?: number;
}

export interface CombatSpriteFx {
    trail?: string;
    slash?: string;
    shield?: string;
    onHit?: string;
    aura?: string;
}

export interface CombatSpriteDefinition {
    id: string;
    label: string;
    archetypeTags: string[];
    palette: SpritePalette;
    states: Partial<Record<CombatSpriteState, SpriteAsset>>;
    fx?: CombatSpriteFx;
}

export const COMBAT_SPRITE_REGISTRY: CombatSpriteDefinition[] = [
    {
        id: 'tank_obsidian_guard',
        label: 'Obsidian Guard',
        archetypeTags: ['tank', 'defensive', 'shield'],
        palette: {
            primary: '#1b1f2a',
            secondary: '#4c5b6c',
            accent: '#c9a227'
        },
        states: {
            idle: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_idle_0.png',
                size: { width: 512, height: 512 },
                durationMs: 800
            },
            windup: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_run_0.png',
                size: { width: 512, height: 512 },
                durationMs: 280
            },
            attack: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_run_2.png',
                size: { width: 512, height: 512 },
                durationMs: 420
            },
            hit: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_run_3.png',
                size: { width: 512, height: 512 },
                durationMs: 200
            },
            defeated: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_death_2.png',
                size: { width: 512, height: 512 }
            },
            statusFx: {
                assetId: 'sprites/fx_shield.svg',
                size: { width: 220, height: 240 }
            }
        },
        fx: {
            trail: 'fx/trail_gold.json',
            shield: 'fx/shield_glow.json'
        }
    },
    {
        id: 'dps_arcane_blade',
        label: 'Arcane Blade',
        archetypeTags: ['dps', 'crit', 'assassin'],
        palette: {
            primary: '#2b1036',
            secondary: '#8f3aff',
            accent: '#f0efe4'
        },
        states: {
            idle: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_blade/character_idle_0.png',
                size: { width: 512, height: 512 },
                durationMs: 700
            },
            windup: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_blade/character_sword_Attack_0.png',
                size: { width: 512, height: 512 },
                durationMs: 220
            },
            attack: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_blade/character_sword_Attack_2.png',
                size: { width: 512, height: 512 },
                durationMs: 360
            },
            hit: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_blade/character_sword_Attack_3.png',
                size: { width: 512, height: 512 },
                durationMs: 160
            },
            defeated: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_blade/character_death_2.png',
                size: { width: 512, height: 512 }
            },
            statusFx: {
                assetId: 'sprites/fx_crit.svg',
                size: { width: 240, height: 260 }
            }
        },
        fx: {
            trail: 'fx/trail_magenta.json',
            slash: 'fx/slash_purple.json'
        }
    },
    {
        id: 'support_emerald_wisp',
        label: 'Emerald Wisp',
        archetypeTags: ['support', 'heal', 'sustain'],
        palette: {
            primary: '#0e1f17',
            secondary: '#2f6a4b',
            accent: '#8db3a5'
        },
        states: {
            idle: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_idle_2.png',
                size: { width: 512, height: 512 },
                durationMs: 900
            },
            windup: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_idle_3.png',
                size: { width: 512, height: 512 },
                durationMs: 260
            },
            attack: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_run_1.png',
                size: { width: 512, height: 512 },
                durationMs: 480
            },
            hit: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_run_2.png',
                size: { width: 512, height: 512 },
                durationMs: 220
            },
            defeated: {
                assetId: '/assets/characters/prototypes/fantasy_vector/knight_plain/character_death_0.png',
                size: { width: 512, height: 512 }
            },
            statusFx: {
                assetId: 'sprites/fx_heal.svg',
                size: { width: 260, height: 260 }
            }
        },
        fx: {
            trail: 'fx/trail_teal.json',
            shield: 'fx/aura_green.json',
            onHit: 'fx/heal_burst.json'
        }
    }
];

export function getCombatSpriteById(id?: string): CombatSpriteDefinition | undefined {
    if (!id) return undefined;
    return COMBAT_SPRITE_REGISTRY.find(entry => entry.id === id);
}

/**
 * Returns the best matching sprite definition for a given set of archetype tags.
 * Falls back to the first registry item if no tag matches.
 */
export function getCombatSpriteByTags(tags: string[]): CombatSpriteDefinition {
    if (!tags.length) return COMBAT_SPRITE_REGISTRY[0];

    const match = COMBAT_SPRITE_REGISTRY.find((entry) =>
        entry.archetypeTags.some((tag) => tags.includes(tag))
    );

    return match ?? COMBAT_SPRITE_REGISTRY[0];
}

export interface ArchetypeSpriteBinding {
    spriteId: string;
    palette: SpritePalette;
}

export function resolveSpriteForTags(tags: string[]): ArchetypeSpriteBinding {
    const entry = getCombatSpriteByTags(tags);
    return {
        spriteId: entry.id,
        palette: entry.palette
    };
}

export function resolveSpriteForArchetype(opts: { spriteId?: string; tags?: string[] }): ArchetypeSpriteBinding {
    const explicit = getCombatSpriteById(opts.spriteId);
    if (explicit) {
        return { spriteId: explicit.id, palette: explicit.palette };
    }

    return resolveSpriteForTags(opts.tags ?? []);
}
