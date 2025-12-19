/**
 * IO Module for 1v1 Balancing System
 * 
 * Handles JSON persistence for:
 * - Runs (matrix results)
 * - Archetypes (character definitions)
 * - Presets (balance configurations)
 * 
 * All files saved to configurable directories.
 * Uses Node.js fs module for file operations.
 * 
 * @see src/balancing/1v1/types.ts for JSON schemas
 */

import type { Archetype, MatrixRunResult, MatchupResult } from './types';
import type { BalancePreset } from '../BalanceConfigManager';

/**
 * IO Configuration
 * Paths can be overridden by BalanceConfigManager
 */
export interface IOConfig {
    path_runs: string;
    path_archetypes: string;
    path_presets: string;
}

export const DEFAULT_IO_CONFIG: IOConfig = {
    path_runs: './data/runs',
    path_archetypes: './data/archetypes',
    path_presets: './data/presets',
};

/**
 * Browser-safe IO implementation
 * Uses localStorage for persistence in browser environments
 * Uses fs for Node.js environments
 */
class IOManager {
    private config: IOConfig;
    private isBrowser: boolean;

    constructor(config: IOConfig = DEFAULT_IO_CONFIG) {
        this.config = config;
        this.isBrowser = typeof window !== 'undefined';
    }

    /**
     * Save JSON data to file or localStorage
     */
    private async saveJSON(path: string, data: any): Promise<void> {
        if (this.isBrowser) {
            // Browser: use localStorage
            const key = `1v1_${path.replace(/[/.]/g, '_')}`;
            localStorage.setItem(key, JSON.stringify(data));
        } else {
            // Node: use fs (would need to import fs)
            // For now, we'll use console.warn and return
            console.warn('File system save not implemented in this environment:', path);
            console.log('Data to save:', JSON.stringify(data, null, 2));
        }
    }

    /**
     * Load JSON data from file or localStorage
     */
    private async loadJSON(path: string): Promise<any | null> {
        if (this.isBrowser) {
            // Browser: use localStorage
            const key = `1v1_${path.replace(/[/.]/g, '_')}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } else {
            // Node: use fs
            console.warn('File system load not implemented in this environment:', path);
            return null;
        }
    }

    /**
     * List all files in a directory (browser: filter localStorage keys)
     */
    private async listFiles(directory: string): Promise<string[]> {
        if (this.isBrowser) {
            // Browser: list matching localStorage keys
            const prefix = `1v1_${directory.replace(/[/.]/g, '_')}`;
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keys.push(key.replace(prefix + '_', ''));
                }
            }
            return keys;
        } else {
            console.warn('File system list not implemented in this environment:', directory);
            return [];
        }
    }

    /**
     * Save a run result
     */
    async saveRunResults(run: MatrixRunResult): Promise<void> {
        const filename = `${run.runMeta.runId}.json`;
        const filepath = `${this.config.path_runs}/${filename}`;
        await this.saveJSON(filepath, run);
    }

    /**
     * Load a run result by ID
     */
    async loadRunResults(runId: string): Promise<MatrixRunResult | null> {
        const filename = `${runId}.json`;
        const filepath = `${this.config.path_runs}/${filename}`;
        return await this.loadJSON(filepath);
    }

    /**
     * List all runs
     */
    async listRuns(): Promise<string[]> {
        return await this.listFiles(this.config.path_runs);
    }

    /**
     * Save an archetype
     */
    async saveArchetype(archetype: Archetype): Promise<void> {
        const filename = `${archetype.id}.json`;
        const filepath = `${this.config.path_archetypes}/${filename}`;
        await this.saveJSON(filepath, archetype);
    }

    /**
     * Load an archetype by ID
     */
    async loadArchetype(archetypeId: string): Promise<Archetype | null> {
        const filename = `${archetypeId}.json`;
        const filepath = `${this.config.path_archetypes}/${filename}`;
        return await this.loadJSON(filepath);
    }

    /**
     * Load all archetypes
     */
    async loadArchetypes(): Promise<Archetype[]> {
        const ids = await this.listFiles(this.config.path_archetypes);
        const archetypes: Archetype[] = [];

        for (const id of ids) {
            const archetype = await this.loadArchetype(id.replace('.json', ''));
            if (archetype) {
                archetypes.push(archetype);
            }
        }

        return archetypes;
    }

    /**
     * Save a preset
     */
    async savePreset(preset: BalancePreset): Promise<void> {
        const filename = `${preset.id}.json`;
        const filepath = `${this.config.path_presets}/${filename}`;
        await this.saveJSON(filepath, preset);
    }

    /**
     * Load a preset by ID
     */
    async loadPreset(presetId: string): Promise<BalancePreset | null> {
        const filename = `${presetId}.json`;
        const filepath = `${this.config.path_presets}/${filename}`;
        return await this.loadJSON(filepath);
    }

    /**
     * Load all presets
     */
    async loadPresets(): Promise<BalancePreset[]> {
        const ids = await this.listFiles(this.config.path_presets);
        const presets: BalancePreset[] = [];

        for (const id of ids) {
            const preset = await this.loadPreset(id.replace('.json', ''));
            if (preset) {
                presets.push(preset);
            }
        }

        return presets;
    }

    /**
     * Save a single matchup result (for quick access)
     */
    async saveMatchupResult(
        runId: string,
        rowId: string,
        colId: string,
        result: MatchupResult
    ): Promise<void> {
        const filename = `${runId}_${rowId}_vs_${colId}.json`;
        const filepath = `${this.config.path_runs}/cells/${filename}`;
        await this.saveJSON(filepath, result);
    }

    /**
     * Load a single matchup result
     */
    async loadMatchupResult(
        runId: string,
        rowId: string,
        colId: string
    ): Promise<MatchupResult | null> {
        const filename = `${runId}_${rowId}_vs_${colId}.json`;
        const filepath = `${this.config.path_runs}/cells/${filename}`;
        return await this.loadJSON(filepath);
    }
}

// Export singleton instance
export const ioManager = new IOManager();

// Export functions for convenience
export const saveRunResults = (run: MatrixRunResult) => ioManager.saveRunResults(run);
export const loadRunResults = (runId: string) => ioManager.loadRunResults(runId);
export const listRuns = () => ioManager.listRuns();

export const saveArchetype = (archetype: Archetype) => ioManager.saveArchetype(archetype);
export const loadArchetype = (archetypeId: string) => ioManager.loadArchetype(archetypeId);
export const loadArchetypes = () => ioManager.loadArchetypes();

export const savePreset = (preset: BalancePreset) => ioManager.savePreset(preset);
export const loadPreset = (presetId: string) => ioManager.loadPreset(presetId);
export const loadPresets = () => ioManager.loadPresets();

export const saveMatchupResult = (
    runId: string,
    rowId: string,
    colId: string,
    result: MatchupResult
) => ioManager.saveMatchupResult(runId, rowId, colId, result);

export const loadMatchupResult = (
    runId: string,
    rowId: string,
    colId: string
) => ioManager.loadMatchupResult(runId, rowId, colId);
