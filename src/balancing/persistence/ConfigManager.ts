/**
 * ConfigManager
 * High-level API for managing balance configurations.
 */

import { BalanceConfigStore } from './BalanceConfigStore';
import { BalanceVersion } from './BalanceVersion';
import type { BalanceConfig } from './balanceConfig';
import { getDefaultBalanceConfig } from './balanceConfig';

export class ConfigManager {
    /**
     * Save the current configuration with optional description.
     */
    static saveCurrentConfig(config: BalanceConfig, description?: string): void {
        const configWithMetadata: BalanceConfig = {
            ...config,
            version: BalanceVersion.CURRENT_VERSION,
            metadata: {
                ...config.metadata,
                modifiedAt: Date.now()
            }
        };

        BalanceConfigStore.save('global', configWithMetadata, description);
    }

    /**
     * Load the current configuration.
     * Returns default if none exists.
     */
    static loadConfig(): BalanceConfig {
        const loaded = BalanceConfigStore.load<BalanceConfig>('global');
        return loaded || getDefaultBalanceConfig();
    }

    /**
     * Export configuration as JSON string.
     */
    static exportConfig(config?: BalanceConfig): string {
        const configToExport = config || this.loadConfig();
        return JSON.stringify(configToExport, null, 2);
    }

    /**
     * Import configuration from JSON string.
     * Returns true if successful.
     */
    static importConfig(json: string, description?: string): boolean {
        try {
            const config: BalanceConfig = JSON.parse(json);

            // Validate basic structure
            if (!config.version || !config.weights || !config.metadata) {
                console.error('Invalid config structure');
                return false;
            }

            // Save imported config
            this.saveCurrentConfig(config, description || 'Imported configuration');
            return true;
        } catch (error) {
            console.error('Failed to import config:', error);
            return false;
        }
    }

    /**
     * Get history of saved configurations.
     */
    static getHistory() {
        return BalanceConfigStore.getHistory('global');
    }

    /**
     * Restore a configuration from history.
     */
    static restoreFromHistory(timestamp: number): boolean {
        const history = this.getHistory();
        const snapshot = history.find(s => s.timestamp === timestamp);

        if (!snapshot) {
            console.error('Snapshot not found');
            return false;
        }

        this.saveCurrentConfig(snapshot.data as BalanceConfig, 'Restored from history');
        return true;
    }

    /**
     * Download configuration as JSON file.
     */
    static downloadConfigAsJSON(config?: BalanceConfig): void {
        const configToExport = config || this.loadConfig();
        const json = this.exportConfig(configToExport);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `balance-config-${configToExport.metadata.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Upload configuration from file.
     */
    static async uploadConfigFromFile(file: File): Promise<boolean> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const json = e.target?.result as string;
                const success = this.importConfig(json, `Imported from ${file.name}`);
                resolve(success);
            };
            reader.onerror = () => resolve(false);
            reader.readAsText(file);
        });
    }

    /**
     * Clear all saved configurations (reset to default).
     */
    static clearAll(): void {
        BalanceConfigStore.clear('global');
    }
}
