/**
 * Migration Manager
 * Handles upgrading configuration data from older versions to the current schema.
 */

import { BalanceVersion } from './BalanceVersion';
import type { MigrationResult } from './types';

type MigrationFn = (data: any) => any;

export class MigrationManager {
    private static migrations: Map<string, MigrationFn> = new Map();

    /**
     * Register a migration function.
     * Key format: "v1.0.0->v1.1.0"
     */
    static register(fromVersion: string, toVersion: string, fn: MigrationFn) {
        this.migrations.set(`${fromVersion}->${toVersion}`, fn);
    }

    /**
     * Attempt to migrate data to the target version.
     */
    static migrate<T>(data: any, fromVersion: string, toVersion: string = BalanceVersion.CURRENT_VERSION): MigrationResult<T> {
        if (fromVersion === toVersion) {
            return { success: true, data: data as T };
        }

        // Simple direct migration check for now
        // In a complex system, we would find a path through the graph of versions
        const key = `${fromVersion}->${toVersion}`;
        const migrationFn = this.migrations.get(key);

        if (migrationFn) {
            try {
                const migratedData = migrationFn(data);
                return {
                    success: true,
                    data: migratedData,
                    migratedFrom: fromVersion,
                    migratedTo: toVersion
                };
            } catch (error) {
                return {
                    success: false,
                    error: `Migration failed: ${(error as Error).message}`
                };
            }
        }

        // If no direct migration, check if versions are compatible enough to just load
        if (BalanceVersion.isCompatible(fromVersion, toVersion)) {
            // Warn but allow if major versions match (assuming backward compatibility for minor/patch)
            console.warn(`No explicit migration from ${fromVersion} to ${toVersion}, but versions are compatible. Loading as is.`);
            return { success: true, data: data as T };
        }

        return {
            success: false,
            error: `No migration path found from ${fromVersion} to ${toVersion}`
        };
    }
}
