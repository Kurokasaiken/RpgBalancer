/**
 * Custom hook for managing user default spell configuration in localStorage
 * Consolidates all localStorage reading logic in one place
 */

import { useState } from 'react';
import type { Spell } from '../../balancing/spellTypes';
import { createEmptySpell } from '../../balancing/spellTypes';
import { DEFAULT_SPELLS } from '../../balancing/defaultSpells';
import { DEFAULT_SPELL_STAT_ORDER } from '../../balancing/spell/spellSliderConfig';

/**
 * Configuration object for default spell settings stored in localStorage.
 */
interface DefaultConfig {
    spell: Spell;
    statOrder: string[];
    collapsedStats: string[];
    statSteps: Record<string, Array<{ value: number; weight: number }>>;
    selectedTicks: Record<string, number>;
}

const DEFAULT_STAT_ORDER = [...DEFAULT_SPELL_STAT_ORDER];

export const useDefaultStorage = () => {
    // Load default configuration once
    const loadDefaultConfig = (): DefaultConfig => {
        try {
            const savedDefault = localStorage.getItem('userDefaultSpell');
            if (savedDefault) {
                const config = JSON.parse(savedDefault);
                return {
                    spell: config.spell || createEmptySpell(),
                    statOrder: config.statOrder || DEFAULT_STAT_ORDER,
                    collapsedStats: config.collapsedStats || [],
                    statSteps: config.statSteps || {},
                    selectedTicks: config.selectedTicks || {}
                };
            }
        } catch (error) {
            console.error('Failed to load default config:', error);
        }

        const template: Spell = (DEFAULT_SPELLS[0] as Spell) ?? createEmptySpell();
        const baseline: Spell = { ...template, id: crypto.randomUUID() };

        return {
            spell: baseline,
            statOrder: DEFAULT_STAT_ORDER,
            collapsedStats: [],
            statSteps: {},
            selectedTicks: {}
        };
    };

    const defaultConfig = loadDefaultConfig();

    const [spell, setSpell] = useState<Spell>(defaultConfig.spell);
    const [statOrder, setStatOrder] = useState<string[]>(defaultConfig.statOrder);
    const [collapsedStats, setCollapsedStats] = useState<Set<string>>(
        new Set(defaultConfig.collapsedStats)
    );
    const [statSteps, setStatSteps] = useState<Record<string, Array<{ value: number; weight: number }>>>(
        defaultConfig.statSteps
    );
    const [selectedTicks, setSelectedTicks] = useState<Record<string, number>>(
        defaultConfig.selectedTicks
    );

    // Save configuration to localStorage
    const saveDefaultConfig = (config: {
        spell: Spell;
        statOrder: string[];
        collapsedStats: Set<string>;
        statSteps: Record<string, Array<{ value: number; weight: number }>>;
        selectedTicks: Record<string, number>;
    }) => {
        try {
            const configToSave = {
                spell: config.spell,
                statOrder: config.statOrder,
                collapsedStats: Array.from(config.collapsedStats),
                statSteps: config.statSteps,
                selectedTicks: config.selectedTicks
            };
            localStorage.setItem('userDefaultSpell', JSON.stringify(configToSave));

            // Also save as baseline for budget calculations
            localStorage.setItem('userSpellBaseline', JSON.stringify(config.spell));

            return true;
        } catch (error) {
            console.error('Failed to save default config:', error);
            return false;
        }
    };

    // Reset to saved defaults
    const resetToDefaults = () => {
        const config = loadDefaultConfig();
        setSpell(config.spell);
        setStatOrder(config.statOrder);
        setCollapsedStats(new Set(config.collapsedStats));
        setStatSteps(config.statSteps);
        setSelectedTicks(config.selectedTicks);
    };

    return {
        spell,
        setSpell,
        statOrder,
        setStatOrder,
        collapsedStats,
        setCollapsedStats,
        statSteps,
        setStatSteps,
        selectedTicks,
        setSelectedTicks,
        saveDefaultConfig,
        resetToDefaults
    };
};
