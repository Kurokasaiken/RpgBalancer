import { getActivePreset, setActivePresetId, loadAllPresets } from './presetStorage';
import { BALANCE_PRESETS, type BalancePreset } from './balancePresets';
import { BalanceConfigStore } from './persistence/BalanceConfigStore';

export type { BalancePreset };
export { BALANCE_PRESETS };

export class BalanceConfigManager {
    private static currentPreset: BalancePreset = BALANCE_PRESETS.standard;
    private static initialized = false;

    /**
     * Initialize and load active preset from storage
     */
    static async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        // Try to load from new persistence store first
        const persistedWeights = await BalanceConfigStore.load<Record<string, number>>('weights');

        try {
            if (persistedWeights) {
                // If we have persisted weights, we might be in a "custom" state.
                // For now we still respect the active preset metadata while keeping the weights snapshot.
                this.currentPreset = await getActivePreset();
                this.currentPreset = {
                    ...this.currentPreset,
                    weights: persistedWeights,
                };
            } else {
                this.currentPreset = await getActivePreset();
            }
        } catch (error) {
            console.warn('BalanceConfigManager failed to initialize, falling back to standard preset.', error);
            this.currentPreset = BALANCE_PRESETS.standard;
        } finally {
            this.initialized = true;
        }
    }

    static async getActivePreset(): Promise<BalancePreset> {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.currentPreset;
    }

    static async setPreset(id: string): Promise<void> {
        const allPresets = await loadAllPresets();
        if (allPresets[id]) {
            this.currentPreset = allPresets[id];
            await setActivePresetId(id);

            // Persist this change
            await BalanceConfigStore.save('weights', this.currentPreset.weights, `Switched to preset: ${this.currentPreset.name}`);
        } else {
            console.warn(`Preset ${id} not found, keeping ${this.currentPreset?.id || 'standard'}`);
        }
    }

    static getWeights(): Record<string, number> {
        return this.currentPreset.weights;
    }

    /**
     * Get all available presets (built-in + user)
     */
    static async getAllPresets(): Promise<Record<string, BalancePreset>> {
        return await loadAllPresets();
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
    static async saveCurrentState(description: string): Promise<void> {
        if (this.currentPreset) {
            await BalanceConfigStore.save('weights', this.currentPreset.weights, description);
        }
    }
}

// Auto-initialize on module load (async)
BalanceConfigManager.initialize().catch((error) => {
    console.warn('Failed to initialize BalanceConfigManager:', error);
});
