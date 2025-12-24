/**
 * Preset Storage - User-defined weight presets
 * 
 * Manages user-created presets with async PersistenceService
 */

import { BALANCE_PRESETS, type BalancePreset } from './balancePresets';
import { NORMALIZED_WEIGHTS } from './statWeights';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const STORAGE_KEY = 'rpg_balancer_user_presets';
const ACTIVE_PRESET_KEY = 'rpg_balancer_active_preset';

export interface UserPreset extends BalancePreset {
    isUserCreated: boolean;
    createdAt: Date;
    modifiedAt: Date;
}

/**
 * Load all presets (built-in + user-created)
 */
export async function loadAllPresets(): Promise<Record<string, BalancePreset>> {
    const userPresets = await loadUserPresets();
    return {
        ...BALANCE_PRESETS,
        ...userPresets
    };
}

/**
 * Load only user-created presets from storage
 */
export async function loadUserPresets(): Promise<Record<string, UserPreset>> {
    try {
        const parsed = await loadData<Record<string, UserPreset>>(STORAGE_KEY, {});
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(key => {
            if (parsed[key].createdAt) {
                parsed[key].createdAt = new Date(parsed[key].createdAt);
            }
            if (parsed[key].modifiedAt) {
                parsed[key].modifiedAt = new Date(parsed[key].modifiedAt);
            }
        });

        return parsed;
    } catch (error) {
        console.error('Error loading user presets:', error);
        return {};
    }
}

/**
 * Save user presets to storage
 */
async function saveUserPresets(presets: Record<string, UserPreset>): Promise<void> {
    try {
        await saveData(STORAGE_KEY, presets);
    } catch (error) {
        console.error('Error saving user presets:', error);
        throw error;
    }
}

/**
 * Create a new user preset
 */
export async function createUserPreset(
    name: string,
    description: string,
    weights: Record<string, number>
): Promise<UserPreset> {
    const id = `user_${Date.now()}_${name.toLowerCase().replace(/\s+/g, '_')}`;

    const preset: UserPreset = {
        id,
        name,
        description,
        weights,
        isUserCreated: true,
        createdAt: new Date(),
        modifiedAt: new Date()
    };

    const userPresets = await loadUserPresets();
    userPresets[id] = preset;
    await saveUserPresets(userPresets);

    return preset;
}

/**
 * Update an existing user preset
 */
export async function updateUserPreset(
    id: string,
    updates: Partial<Omit<UserPreset, 'id' | 'isUserCreated' | 'createdAt'>>
): Promise<void> {
    const userPresets = await loadUserPresets();

    if (!userPresets[id]) {
        throw new Error(`Preset ${id} not found or is not a user preset`);
    }

    userPresets[id] = {
        ...userPresets[id],
        ...updates,
        modifiedAt: new Date()
    };

    await saveUserPresets(userPresets);
}

/**
 * Delete a user preset
 */
export async function deleteUserPreset(id: string): Promise<void> {
    const userPresets = await loadUserPresets();

    if (!userPresets[id]) {
        throw new Error(`Preset ${id} not found or is not a user preset`);
    }

    delete userPresets[id];
    await saveUserPresets(userPresets);

    // If deleted preset was active, switch to standard
    if (await getActivePresetId() === id) {
        await setActivePresetId('standard');
    }
}

/**
 * Get active preset ID
 */
export async function getActivePresetId(): Promise<string> {
    try {
        const id = await loadData<string>(ACTIVE_PRESET_KEY, 'standard');
        return id || 'standard';
    } catch {
        return 'standard';
    }
}

/**
 * Set active preset ID
 */
export async function setActivePresetId(id: string): Promise<void> {
    await saveData(ACTIVE_PRESET_KEY, id);
}

/**
 * Get active preset
 */
export async function getActivePreset(): Promise<BalancePreset> {
    const id = await getActivePresetId();
    const allPresets = await loadAllPresets();
    return allPresets[id] || allPresets['standard'];
}

/**
 * Export preset to JSON string
 */
export function exportPresetJSON(preset: BalancePreset): string {
    return JSON.stringify(preset, null, 2);
}

/**
 * Import preset from JSON string
 */
export async function importPresetJSON(json: string): Promise<UserPreset> {
    try {
        const parsed = JSON.parse(json);

        // Validate required fields
        if (!parsed.name || !parsed.weights) {
            throw new Error('Invalid preset JSON: missing required fields');
        }

        // Create as new user preset
        return await createUserPreset(
            parsed.name,
            parsed.description || 'Imported preset',
            parsed.weights
        );
    } catch (error) {
        console.error('Error importing preset:', error);
        throw new Error('Failed to import preset: ' + (error as Error).message);
    }
}

/**
 * Export all user presets to JSON
 */
export async function exportAllPresetsJSON(): Promise<string> {
    const userPresets = await loadUserPresets();
    return JSON.stringify(Object.values(userPresets), null, 2);
}

/**
 * Create a preset from current weights
 */
export async function createPresetFromWeights(
    name: string,
    description: string,
    weights: Record<string, number>
): Promise<UserPreset> {
    return await createUserPreset(name, description, weights);
}

/**
 * Duplicate an existing preset
 */
export async function duplicatePreset(sourceId: string, newName: string): Promise<UserPreset> {
    const allPresets = await loadAllPresets();
    const source = allPresets[sourceId];

    if (!source) {
        throw new Error(`Preset ${sourceId} not found`);
    }

    return await createUserPreset(
        newName,
        `Copy of ${source.name}`,
        { ...source.weights }
    );
}

/**
 * Calculate diff between two presets
 */
export async function calculatePresetDiff(
    preset1Id: string,
    preset2Id: string
): Promise<Record<string, { old: number; new: number; diff: number; diffPercent: number }>> {
    const allPresets = await loadAllPresets();
    const preset1 = allPresets[preset1Id];
    const preset2 = allPresets[preset2Id];

    if (!preset1 || !preset2) {
        throw new Error('One or both presets not found');
    }

    const diff: Record<string, any> = {};
    const allKeys = new Set([
        ...Object.keys(preset1.weights),
        ...Object.keys(preset2.weights)
    ]);

    allKeys.forEach(key => {
        const old = preset1.weights[key] || 0;
        const newVal = preset2.weights[key] || 0;
        const diffVal = newVal - old;
        const diffPercent = old !== 0 ? (diffVal / old) * 100 : 0;

        if (diffVal !== 0) {
            diff[key] = {
                old,
                new: newVal,
                diff: diffVal,
                diffPercent
            };
        }
    });

    return diff;
}

/**
 * Get default preset weights
 */
export function getDefaultWeights(): Record<string, number> {
    return { ...NORMALIZED_WEIGHTS };
}
