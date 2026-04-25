import { calculateDerivedStats } from './stats';
import type { Attributes, DerivedStats } from './stats';
import type { WeaponModule, ArmorModule, SkillModule } from '../modules/definitions';
import type { StatBlock } from '../../balancing/types';
import type { Spell } from '../../balancing/spellTypes';
import type { SpritePalette } from '../../shared/types/visual';

export class Entity {
    id: string;
    name: string;
    attributes: Attributes;
    derivedStats: DerivedStats;
    currentHp: number;
    currentMana: number;

    // Compatibility fields for Idle Combat Engine
    currentHealth: number;
    stats: {
        health: number;
        attack: number;
        defense: number;
        magic: number;
        speed: number;
    };

    equipment: {
        weapon?: WeaponModule;
        armor?: ArmorModule;
    };

    skills: SkillModule[];
    spells: Spell[] = [];

    // Optional StatBlock for Balancing Lab simulations
    statBlock?: StatBlock;
    spriteId?: string;
    spritePalette?: SpritePalette;
    tags?: string[];

    constructor(id: string, name: string, baseAttributes: Attributes) {
        this.id = id;
        this.name = name;
        this.attributes = { ...baseAttributes };
        this.equipment = {};
        this.skills = [];

        // Initial calculation
        this.derivedStats = calculateDerivedStats(this.attributes);
        this.currentHp = this.derivedStats.maxHp;
        this.currentMana = this.derivedStats.maxMana;

        // Initialize compatibility fields
        this.currentHealth = this.derivedStats.maxHp;
        this.stats = {
            health: this.derivedStats.maxHp,
            attack: this.attributes.strength * 2, // Simplified mapping
            defense: this.derivedStats.defense,
            magic: this.attributes.intelligence * 2, // Simplified mapping
            speed: this.attributes.dexterity
        };
    }

    /**
     * Factory method to create Entity from StatBlock (for Idle Combat)
     * This bypasses the Attributes system and uses pure StatBlock
     */
    static fromStatBlock(id: string, name: string, statBlock: StatBlock): Entity {
        // Create a dummy attributes object (won't be used)
        const dummyAttributes: Attributes = {
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            constitution: 10,
            wisdom: 10
        };

        const entity = new Entity(id, name, dummyAttributes);

        // Override with StatBlock
        entity.statBlock = statBlock;
        entity.currentHealth = statBlock.hp;
        entity.currentHp = statBlock.hp;
        entity.stats = {
            health: statBlock.hp,
            attack: statBlock.damage,
            defense: statBlock.armor,
            magic: statBlock.damage, // Use damage for magic too
            speed: 100 // Default speed, can be customized
        };

        return entity;
    }

    equipWeapon(weapon: WeaponModule) {
        this.equipment.weapon = weapon;
        this.recalculateStats();
    }

    equipArmor(armor: ArmorModule) {
        this.equipment.armor = armor;
        this.recalculateStats();
    }

    learnSkill(skill: SkillModule) {
        this.skills.push(skill);
    }

    private recalculateStats() {
        // Start with base attributes
        // In a real complex system, we might store "base" vs "current" attributes separately
        // For now, let's assume attributes are modified permanently or we re-apply modifiers from base

        // Actually, better approach: Store Base Attributes, and calculate Effective Attributes
        // But to keep it simple for this iteration:
        // We will just recalculate derived stats based on current attributes + equipment bonuses

        // Reset derived stats to base calculation
        const effectiveAttributes = { ...this.attributes };

        // Apply equipment attribute modifiers
        if (this.equipment.weapon?.attributeModifiers) {
            this.applyModifiers(effectiveAttributes, this.equipment.weapon.attributeModifiers);
        }
        if (this.equipment.armor?.attributeModifiers) {
            this.applyModifiers(effectiveAttributes, this.equipment.armor.attributeModifiers);
        }

        this.derivedStats = calculateDerivedStats(effectiveAttributes);

        // Apply direct derived stat bonuses from gear (e.g. Armor Defense)
        if (this.equipment.armor) {
            this.derivedStats.defense += this.equipment.armor.defenseValue;
        }

        // Clamp current values
        this.currentHp = Math.min(this.currentHp, this.derivedStats.maxHp);
        this.currentMana = Math.min(this.currentMana, this.derivedStats.maxMana);

        // Update compatibility fields
        this.currentHealth = this.currentHp;
        this.stats = {
            health: this.derivedStats.maxHp,
            attack: effectiveAttributes.strength * 2,
            defense: this.derivedStats.defense,
            magic: effectiveAttributes.intelligence * 2,
            speed: effectiveAttributes.dexterity
        };
    }

    private applyModifiers(base: Attributes, mods: Partial<Attributes>) {
        if (mods.strength) base.strength += mods.strength;
        if (mods.dexterity) base.dexterity += mods.dexterity;
        if (mods.intelligence) base.intelligence += mods.intelligence;
        if (mods.constitution) base.constitution += mods.constitution;
        if (mods.wisdom) base.wisdom += mods.wisdom;
    }

    isAlive(): boolean {
        return this.currentHp > 0;
    }

    takeDamage(amount: number) {
        // If using StatBlock (Balancing Lab), mitigation is already applied in logic.ts
        // So we apply damage directly.
        // If using Legacy Attributes, we apply simple defense here.
        let actualDamage = amount;

        if (!this.statBlock) {
            actualDamage = Math.max(1, amount - this.derivedStats.defense);
        }

        this.currentHp = Math.max(0, this.currentHp - actualDamage);
        this.currentHealth = this.currentHp; // Sync
    }

    heal(amount: number) {
        this.currentHp = Math.min(this.derivedStats.maxHp, this.currentHp + amount);
        this.currentHealth = this.currentHp; // Sync
    }
}
