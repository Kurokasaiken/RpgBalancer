export interface Attributes {
    strength: number;
    dexterity: number;
    intelligence: number;
    constitution: number;
    wisdom: number;
}

export interface DerivedStats {
    maxHp: number;
    maxMana: number;
    attackPower: number;
    defense: number;
    speed: number;
    critChance: number;
}

export const BASE_STATS: DerivedStats = {
    maxHp: 50,
    maxMana: 20,
    attackPower: 5,
    defense: 0,
    speed: 10,
    critChance: 0.05,
};

export function calculateDerivedStats(attributes: Attributes): DerivedStats {
    return {
        maxHp: BASE_STATS.maxHp + attributes.constitution * 10,
        maxMana: BASE_STATS.maxMana + attributes.wisdom * 10 + attributes.intelligence * 5,
        attackPower: BASE_STATS.attackPower + attributes.strength * 2,
        defense: BASE_STATS.defense + attributes.constitution * 1 + attributes.strength * 0.5,
        speed: BASE_STATS.speed + attributes.dexterity * 2,
        critChance: BASE_STATS.critChance + attributes.dexterity * 0.01 + attributes.wisdom * 0.005,
    };
}

export function createEmptyAttributes(): Attributes {
    return {
        strength: 0,
        dexterity: 0,
        intelligence: 0,
        constitution: 0,
        wisdom: 0,
    };
}
