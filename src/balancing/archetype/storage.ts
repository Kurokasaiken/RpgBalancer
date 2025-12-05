/**
 * Archetype Storage - Load/Save archetype templates
 * 
 * Similar to spellStorage.ts, provides persistence for archetypes
 */

import type { ArchetypeTemplate, TTKTarget, BudgetTier, BalanceConfiguration } from './types';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage paths
const ARCHETYPES_PATH = join(__dirname, 'archetypes.json');
const TTK_TARGETS_PATH = join(__dirname, 'ttk_targets.json');
const BUDGET_TIERS_PATH = join(__dirname, 'budget_tiers.json');
const BALANCE_CONFIG_PATH = join(__dirname, 'balance_config.json');

// =====================
// ARCHETYPE TEMPLATES
// =====================

export function loadArchetypes(): ArchetypeTemplate[] {
    try {
        if (!existsSync(ARCHETYPES_PATH)) {
            console.warn('archetypes.json not found, returning empty array');
            return [];
        }
        const data = readFileSync(ARCHETYPES_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading archetypes:', error);
        return [];
    }
}

export function saveArchetypes(archetypes: ArchetypeTemplate[]): void {
    try {
        writeFileSync(ARCHETYPES_PATH, JSON.stringify(archetypes, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving archetypes:', error);
        throw error;
    }
}

export function upsertArchetype(archetype: ArchetypeTemplate): void {
    const archetypes = loadArchetypes();
    const index = archetypes.findIndex(a => a.id === archetype.id);

    if (index >= 0) {
        archetypes[index] = archetype;
    } else {
        archetypes.push(archetype);
    }

    saveArchetypes(archetypes);
}

export function deleteArchetype(id: string): void {
    const archetypes = loadArchetypes().filter(a => a.id !== id);
    saveArchetypes(archetypes);
}

export function getArchetype(id: string): ArchetypeTemplate | undefined {
    return loadArchetypes().find(a => a.id === id);
}

// =====================
// TTK TARGETS
// =====================

export function loadTTKTargets(): TTKTarget[] {
    try {
        if (!existsSync(TTK_TARGETS_PATH)) {
            console.warn('ttk_targets.json not found, returning empty array');
            return [];
        }
        const data = readFileSync(TTK_TARGETS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading TTK targets:', error);
        return [];
    }
}

export function saveTTKTargets(targets: TTKTarget[]): void {
    try {
        writeFileSync(TTK_TARGETS_PATH, JSON.stringify(targets, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving TTK targets:', error);
        throw error;
    }
}

export function upsertTTKTarget(target: TTKTarget): void {
    const targets = loadTTKTargets();
    const index = targets.findIndex(
        t => t.matchup.archetypeA === target.matchup.archetypeA && t.matchup.archetypeB === target.matchup.archetypeB
    );

    if (index >= 0) {
        targets[index] = target;
    } else {
        targets.push(target);
    }

    saveTTKTargets(targets);
}

export function deleteTTKTarget(archetypeA: string, archetypeB: string): void {
    const targets = loadTTKTargets().filter(
        t => !(t.matchup.archetypeA === archetypeA && t.matchup.archetypeB === archetypeB)
    );
    saveTTKTargets(targets);
}

// =====================
// BUDGET TIERS
// =====================

export function loadBudgetTiers(): BudgetTier[] {
    try {
        if (!existsSync(BUDGET_TIERS_PATH)) {
            console.warn('budget_tiers.json not found, returning default tiers');
            return getDefaultBudgetTiers();
        }
        const data = readFileSync(BUDGET_TIERS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading budget tiers:', error);
        return getDefaultBudgetTiers();
    }
}

export function saveBudgetTiers(tiers: BudgetTier[]): void {
    try {
        writeFileSync(BUDGET_TIERS_PATH, JSON.stringify(tiers, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving budget tiers:', error);
        throw error;
    }
}

function getDefaultBudgetTiers(): BudgetTier[] {
    return [
        { name: 'Early Game', points: 10, description: 'Level 1-3' },
        { name: 'Mid Game', points: 20, description: 'Level 4-6' },
        { name: 'Late Game', points: 50, description: 'Level 7-9' },
        { name: 'Endgame', points: 75, description: 'Level 10+' },
        { name: 'Epic', points: 100, description: 'Boss/Raid tier' },
    ];
}

// =====================
// BALANCE CONFIGURATION
// =====================

export function loadBalanceConfig(): BalanceConfiguration {
    try {
        if (!existsSync(BALANCE_CONFIG_PATH)) {
            console.warn('balance_config.json not found, returning default config');
            return getDefaultBalanceConfig();
        }
        const data = readFileSync(BALANCE_CONFIG_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading balance config:', error);
        return getDefaultBalanceConfig();
    }
}

export function saveBalanceConfig(config: BalanceConfiguration): void {
    try {
        writeFileSync(BALANCE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving balance config:', error);
        throw error;
    }
}

function getDefaultBalanceConfig(): BalanceConfiguration {
    return {
        ttkTargets: [],
        budgetTiers: getDefaultBudgetTiers(),
    };
}

// =====================
// UTILITY FUNCTIONS
// =====================

/**
 * Initialize storage with default data if files don't exist
 */
export function initializeArchetypeStorage(): void {
    if (!existsSync(ARCHETYPES_PATH)) {
        console.log('Initializing archetypes.json with empty array');
        saveArchetypes([]);
    }

    if (!existsSync(TTK_TARGETS_PATH)) {
        console.log('Initializing ttk_targets.json with empty array');
        saveTTKTargets([]);
    }

    if (!existsSync(BUDGET_TIERS_PATH)) {
        console.log('Initializing budget_tiers.json with defaults');
        saveBudgetTiers(getDefaultBudgetTiers());
    }

    if (!existsSync(BALANCE_CONFIG_PATH)) {
        console.log('Initializing balance_config.json with defaults');
        saveBalanceConfig(getDefaultBalanceConfig());
    }
}

/**
 * Export all data for backup
 */
export function exportArchetypeData() {
    return {
        archetypes: loadArchetypes(),
        ttkTargets: loadTTKTargets(),
        budgetTiers: loadBudgetTiers(),
        balanceConfig: loadBalanceConfig(),
    };
}

/**
 * Import data from backup
 */
export function importArchetypeData(data: {
    archetypes?: ArchetypeTemplate[];
    ttkTargets?: TTKTarget[];
    budgetTiers?: BudgetTier[];
    balanceConfig?: BalanceConfiguration;
}): void {
    if (data.archetypes) saveArchetypes(data.archetypes);
    if (data.ttkTargets) saveTTKTargets(data.ttkTargets);
    if (data.budgetTiers) saveBudgetTiers(data.budgetTiers);
    if (data.balanceConfig) saveBalanceConfig(data.balanceConfig);
}
