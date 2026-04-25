import type { Attributes } from '../core/stats';

export type ModuleType = 'weapon' | 'armor' | 'skill' | 'spell';

export interface BaseModule {
    id: string;
    name: string;
    description: string;
    type: ModuleType;
    cost: number; // Point cost
}

export interface StatModifierModule extends BaseModule {
    attributeModifiers?: Partial<Attributes>;
    // Could add derived stat modifiers directly if needed
}

export interface WeaponModule extends StatModifierModule {
    type: 'weapon';
    damage: number;
    attackSpeed: number; // Multiplier, 1.0 is base
    range: number;
}

export interface ArmorModule extends StatModifierModule {
    type: 'armor';
    defenseValue: number;
    weight: number; // Might affect speed
}

export interface Effect {
    type: 'damage' | 'heal' | 'buff' | 'debuff';
    value: number;
    duration?: number; // Turns
    target: 'self' | 'enemy' | 'all_enemies' | 'all_allies';
}

export interface SkillModule extends BaseModule {
    type: 'skill' | 'spell';
    manaCost: number;
    cooldown: number;
    effects: Effect[];
}

// Helper to calculate cost based on power (simple heuristic for now)
export function calculateModuleCost(module: Partial<WeaponModule | ArmorModule | SkillModule>): number {
    let cost = 0;

    // Base costs
    if (module.type === 'weapon') {
        const w = module as WeaponModule;
        cost += (w.damage || 0) * 5;
        cost += ((w.attackSpeed || 1) - 1) * 20;
    } else if (module.type === 'armor') {
        const a = module as ArmorModule;
        cost += (a.defenseValue || 0) * 4;
    } else if (module.type === 'skill' || module.type === 'spell') {
        const s = module as SkillModule;
        cost += (s.effects?.reduce((acc, eff) => acc + eff.value, 0) || 0) * 2;
        cost -= (s.manaCost || 0) * 0.5;
        cost -= (s.cooldown || 0) * 2;
    }

    // Attribute modifiers
    if ((module as StatModifierModule).attributeModifiers) {
        const mods = (module as StatModifierModule).attributeModifiers!;
        Object.values(mods).forEach(val => {
            cost += (val || 0) * 10;
        });
    }

    return Math.max(1, Math.floor(cost));
}
