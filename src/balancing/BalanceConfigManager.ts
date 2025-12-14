import { getActivePreset, setActivePresetId, loadAllPresets } from './presetStorage';
import { BALANCE_PRESETS, type BalancePreset } from './balancePresets';
import { BalanceConfigStore } from './persistence/BalanceConfigStore';

export type { BalancePreset };
export { BALANCE_PRESETS };

export class BalanceConfigManager {
    private static currentPreset: BalancePreset | null = null;

    /**
     * Initialize and load active preset from storage
     */
    static initialize() {
        // Try to load from new persistence store first
        const persistedWeights = BalanceConfigStore.load<Record<string, number>>('weights');

        if (persistedWeights) {
            // If we have persisted weights, we might be in a "custom" state
            // For now, we'll just load the active preset ID and see if it matches
            this.currentPreset = getActivePreset();

            // If the persisted weights differ from the preset, we should probably respect persistence
            // But for this phase, let's keep it simple: Persistence Store backs up the "user_custom" presets
        } else {
            this.currentPreset = getActivePreset();
        }
    }

    static get activePreset(): BalancePreset {
        if (!this.currentPreset) {
            this.initialize();
        }
        return this.currentPreset!;
    }

    static setPreset(id: string) {
        const allPresets = loadAllPresets();
        if (allPresets[id]) {
            this.currentPreset = allPresets[id];
            setActivePresetId(id);

            // Persist this change
            BalanceConfigStore.save('weights', this.currentPreset.weights, `Switched to preset: ${this.currentPreset.name}`);
        } else {
            console.warn(`Preset ${id} not found, keeping ${this.currentPreset?.id || 'standard'}`);
        }
    }

    static getWeights(): Record<string, number> {
        return this.activePreset.weights;
    }

    /**
     * Get all available presets (built-in + user)
     */
    static getAllPresets(): Record<string, BalancePreset> {
        return loadAllPresets();
    }

    /**
     * Check if a preset is user-created
     */
    static isUserPreset(id: string): boolean {
        return id.startsWith('user_');
    }

    /**
     * Save current weights as a new snapshot
     */
    static saveCurrentState(description: string) {
        if (this.currentPreset) {
            BalanceConfigStore.save('weights', this.currentPreset.weights, description);
        }
    }
}

// Auto-initialize on module load
BalanceConfigManager.initialize();
