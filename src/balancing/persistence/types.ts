/**
 * Balance Persistence Types
 */

export type ConfigType = 'weights' | 'formulas' | 'archetypes' | 'global';

export interface BalanceSnapshot<T = any> {
    version: string;       // Semantic version (e.g., "1.0.0")
    timestamp: number;     // Unix timestamp
    configType: ConfigType;
    data: T;               // The actual configuration data
    checksum: string;      // SHA-256 or simple hash for integrity
    parentVersion?: string;// ID/Version of the previous state (for history)
    description?: string;  // Optional description of the change
}

export interface MigrationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    migratedFrom?: string;
    migratedTo?: string;
}

export interface BalanceConfig {
    // This interface will evolve as we define the full config shape
    // For now it acts as a container for the various modules
    weights: Record<string, number>;
    // Future: formulas, etc.
}
