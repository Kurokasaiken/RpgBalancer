/**
 * Custom hook for managing user default spell configuration in storage
 * Consolidates all storage reading logic in one place
 */

import { useState, useEffect } from 'react';
import type { Spell } from '../../balancing/spellTypes';
import { createEmptySpell } from '../../balancing/spellTypes';
import { DEFAULT_SPELLS } from '../../balancing/defaultSpells';
import { DEFAULT_SPELL_STAT_ORDER } from '../../balancing/spell/spellSliderConfig';
import { saveData, loadData } from '../persistence/PersistenceService';

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
    const loadDefaultConfig = async (): Promise<DefaultConfig> => {
        try {
            const savedDefault = await loadData('userDefaultSpell', null);
            if (savedDefault) {
                const config = savedDefault;
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

    // Create default configuration
    const createDefaultConfig = (): DefaultConfig => {
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

    const defaultConfig = createDefaultConfig();

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

    // Load from storage on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await loadDefaultConfig();
                setSpell(config.spell);
                setStatOrder(config.statOrder);
                setCollapsedStats(new Set(config.collapsedStats));
                setStatSteps(config.statSteps);
                setSelectedTicks(config.selectedTicks);
            } catch (error) {
                console.error('Failed to load config in hook:', error);
            }
        };
        loadConfig();
    }, []);

    // Save configuration to storage
    const saveDefaultConfig = async (config: {
        spell: Spell;
        statOrder: string[];
        collapsedStats: Set<string>;
        statSteps: Record<string, Array<{ value: number; weight: number }>>;
        selectedTicks: Record<string, number>;
    }): Promise<boolean> => {
        try {
            const configToSave = {
                spell: config.spell,
                statOrder: config.statOrder,
                collapsedStats: Array.from(config.collapsedStats),
                statSteps: config.statSteps,
                selectedTicks: config.selectedTicks
            };
            await saveData('userDefaultSpell', configToSave);

            // Also save as baseline for budget calculations
            await saveData('userSpellBaseline', config.spell);

            return true;
        } catch (error) {
            console.error('Failed to save default config:', error);
            return false;
        }
    };

    // Reset to saved defaults
    const resetToDefaults = async () => {
        try {
            const config = await loadDefaultConfig();
            setSpell(config.spell);
            setStatOrder(config.statOrder);
            setCollapsedStats(new Set(config.collapsedStats));
            setStatSteps(config.statSteps);
            setSelectedTicks(config.selectedTicks);
        } catch (error) {
            console.error('Failed to reset to defaults:', error);
        }
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
