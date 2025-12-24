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
    static async initialize(): Promise<void> {
        // Try to load from new persistence store first
        const persistedWeights = await BalanceConfigStore.load<Record<string, number>>('weights');

        if (persistedWeights) {
            // If we have persisted weights, we might be in a "custom" state
            // For now, we'll just load the active preset ID and see if it matches
            this.currentPreset = await getActivePreset();

            // If the persisted weights differ from the preset, we should probably respect persistence
            // But for this phase, let's keep it simple: Persistence Store backs up the "user_custom" presets
        } else {
            this.currentPreset = await getActivePreset();
        }
    }

    static async getActivePreset(): Promise<BalancePreset> {
        if (!this.currentPreset) {
            await this.initialize();
        }
        return this.currentPreset!;
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

    static async getWeights(): Promise<Record<string, number>> {
        const preset = await this.getActivePreset();
        return preset.weights;
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
