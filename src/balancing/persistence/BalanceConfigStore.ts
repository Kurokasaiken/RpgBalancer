/**
 * Balance Config Store
 * Manages saving, loading, and history of balance configurations using localStorage.
 */

import type { BalanceSnapshot, ConfigType } from './types';
import { BalanceVersion } from './BalanceVersion';
import { MigrationManager } from './MigrationManager';

const STORAGE_KEY_PREFIX = 'rpg_balancer_config_';
const HISTORY_LIMIT = 10;

export class BalanceConfigStore {
    /**
     * Save a configuration snapshot.
     */
    static save<T>(type: ConfigType, data: T, description?: string): void {
        const key = `${STORAGE_KEY_PREFIX}${type}`;

        // Create snapshot
        const snapshot: BalanceSnapshot<T> = {
            version: BalanceVersion.CURRENT_VERSION,
            timestamp: Date.now(),
            configType: type,
            data: data,
            checksum: this.generateChecksum(data),
            description
        };

        // Save current
        localStorage.setItem(key, JSON.stringify(snapshot));

        // Update history
        this.addToHistory(type, snapshot);
    }

    /**
     * Load a configuration snapshot.
     */
    static load<T>(type: ConfigType): T | null {
        if (typeof localStorage === 'undefined') return null;
        const key = `${STORAGE_KEY_PREFIX}${type}`;
        const raw = localStorage.getItem(key);

        if (!raw) return null;

        try {
            const snapshot: BalanceSnapshot<T> = JSON.parse(raw);

            // Check version and migrate if needed
            const migration = MigrationManager.migrate<T>(
                snapshot.data,
                snapshot.version,
                BalanceVersion.CURRENT_VERSION
            );

            if (!migration.success) {
                console.error(`Failed to load ${type} config:`, migration.error);
                return null;
            }

            return migration.data!;
        } catch (error) {
            console.error(`Error parsing ${type} config:`, error);
            return null;
        }
    }

    /**
     * Get history of snapshots for a config type.
     */
    static getHistory(type: ConfigType): BalanceSnapshot[] {
        const key = `${STORAGE_KEY_PREFIX}${type}_history`;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    }

    /**
     * Add a snapshot to history, maintaining the limit.
     */
    private static addToHistory(type: ConfigType, snapshot: BalanceSnapshot): void {
        const key = `${STORAGE_KEY_PREFIX}${type}_history`;
        const history = this.getHistory(type);

        // Add new snapshot to front
        history.unshift(snapshot);

        // Trim to limit
        if (history.length > HISTORY_LIMIT) {
            history.length = HISTORY_LIMIT;
        }

        localStorage.setItem(key, JSON.stringify(history));
    }

    /**
     * Simple checksum generator (for integrity check).
     */
    private static generateChecksum(data: any): string {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    /**
     * Clear all data for a config type (Reset).
     */
    static clear(type: ConfigType): void {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${type}`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${type}_history`);
    }
}
