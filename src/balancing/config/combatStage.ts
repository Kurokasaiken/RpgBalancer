import type { CSSProperties } from 'react';

export type CombatStageLayerType = 'gradient' | 'runeGrid' | 'spotlight' | 'fog' | 'noise';

export interface CombatStageLayer {
    id: string;
    type: CombatStageLayerType;
    opacity?: number;
    blendMode?: CSSProperties['mixBlendMode'];
    /**
     * Gradient definition for gradient/fog layers. Values are CSS color tokens (prefer CSS vars).
     */
    gradientStops?: { color: string; position: number }[];
    /** Grid/rune layer settings */
    grid?: {
        cellSize: number;
        stroke: string;
        strokeOpacity: number;
        tiltDeg?: number;
    };
    /** Spotlight halo configuration */
    spotlights?: {
        position: { xPercent: number; yPercent: number };
        radius: number;
        color: string;
        intensity: number;
    }[];
    /** Noise texture settings */
    noise?: {
        texture: string;
        opacity: number;
        scale: number;
    };
}

export interface CombatStageSlot {
    id: string;
    team: 'A' | 'B';
    label: string;
    position: { xPercent: number; yPercent: number };
    scale: number;
    rotation?: number;
    zIndex?: number;
}

export interface CombatStageConfig {
    id: string;
    name: string;
    palette: {
        backdrop: string;
        rim: string;
        glow: string;
        fog: string;
    };
    layers: CombatStageLayer[];
    slots: CombatStageSlot[];
}

export const DEFAULT_COMBAT_STAGE: CombatStageConfig = {
    id: 'observatory_spire',
    name: 'Observatory Spire',
    palette: {
        backdrop: 'var(--obsidian-950)',
        rim: 'var(--gilded-400)',
        glow: 'var(--arcane-teal-400)',
        fog: 'rgba(12, 20, 28, 0.8)'
    },
    layers: [
        {
            id: 'backdrop-gradient',
            type: 'gradient',
            gradientStops: [
                { color: 'rgb(5, 5, 9)', position: 0 },
                { color: 'rgb(10, 16, 24)', position: 35 },
                { color: 'rgb(12, 25, 36)', position: 100 }
            ]
        },
        {
            id: 'rune-grid',
            type: 'runeGrid',
            opacity: 0.4,
            grid: {
                cellSize: 48,
                stroke: 'rgba(73, 133, 161, 0.4)',
                strokeOpacity: 0.65,
                tiltDeg: -8
            }
        },
        {
            id: 'spotlights',
            type: 'spotlight',
            spotlights: [
                { position: { xPercent: 30, yPercent: 55 }, radius: 220, color: 'rgba(82, 226, 255, 0.45)', intensity: 0.9 },
                { position: { xPercent: 70, yPercent: 55 }, radius: 220, color: 'rgba(255, 196, 152, 0.35)', intensity: 0.8 }
            ],
            blendMode: 'screen'
        },
        {
            id: 'fog',
            type: 'fog',
            opacity: 0.55,
            gradientStops: [
                { color: 'rgba(8, 13, 19, 0)', position: 0 },
                { color: 'rgba(8, 13, 19, 0.8)', position: 100 }
            ]
        }
    ],
    slots: [
        {
            id: 'team-a-front',
            team: 'A',
            label: 'Vanguard',
            position: { xPercent: 32, yPercent: 62 },
            scale: 1,
            rotation: -2,
            zIndex: 2
        },
        {
            id: 'team-a-reserve',
            team: 'A',
            label: 'Reserve',
            position: { xPercent: 24, yPercent: 72 },
            scale: 0.9,
            rotation: -4,
            zIndex: 1
        },
        {
            id: 'team-a-support',
            team: 'A',
            label: 'Support',
            position: { xPercent: 40, yPercent: 72 },
            scale: 0.9,
            rotation: -1,
            zIndex: 1
        },
        {
            id: 'team-b-front',
            team: 'B',
            label: 'Vanguard',
            position: { xPercent: 68, yPercent: 62 },
            scale: 1,
            rotation: 2,
            zIndex: 2
        },
        {
            id: 'team-b-reserve',
            team: 'B',
            label: 'Reserve',
            position: { xPercent: 76, yPercent: 72 },
            scale: 0.9,
            rotation: 4,
            zIndex: 1
        },
        {
            id: 'team-b-support',
            team: 'B',
            label: 'Support',
            position: { xPercent: 60, yPercent: 72 },
            scale: 0.9,
            rotation: 1,
            zIndex: 1
        }
    ]
};
