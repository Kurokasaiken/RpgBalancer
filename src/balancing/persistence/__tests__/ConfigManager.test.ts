/**
 * Tests for ConfigManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../ConfigManager';
import { getDefaultBalanceConfig } from '../balanceConfig';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

// @ts-ignore
global.localStorage = localStorageMock;

describe('ConfigManager', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    it('should save and load config', () => {
        const config = getDefaultBalanceConfig();
        config.metadata.name = 'Test Config';

        ConfigManager.saveCurrentConfig(config);
        const loaded = ConfigManager.loadConfig();

        expect(loaded.metadata.name).toBe('Test Config');
    });

    it('should return default config if none exists', () => {
        const config = ConfigManager.loadConfig();
        expect(config.metadata.name).toBe('Default Configuration');
    });

    it('should export and import config', () => {
        const config = getDefaultBalanceConfig();
        config.metadata.name = 'Export Test';

        const json = ConfigManager.exportConfig(config);
        expect(json).toContain('Export Test');

        const success = ConfigManager.importConfig(json);
        expect(success).toBe(true);

        const loaded = ConfigManager.loadConfig();
        expect(loaded.metadata.name).toBe('Export Test');
    });

    it('should reject invalid JSON on import', () => {
        const success = ConfigManager.importConfig('{ invalid json');
        expect(success).toBe(false);
    });

    it('should reject config with missing fields', () => {
        const invalidConfig = { version: '1.0.0' }; // Missing weights and metadata
        const success = ConfigManager.importConfig(JSON.stringify(invalidConfig));
        expect(success).toBe(false);
    });

    it('should maintain history', () => {
        const config = getDefaultBalanceConfig();

        for (let i = 0; i < 5; i++) {
            config.metadata.name = `Config ${i}`;
            ConfigManager.saveCurrentConfig(config, `Save ${i}`);
        }

        const history = ConfigManager.getHistory();
        expect(history.length).toBe(5);
    });

    it('should restore from history', () => {
        const config = getDefaultBalanceConfig();
        config.metadata.name = 'Original';
        ConfigManager.saveCurrentConfig(config);

        const timestamp = ConfigManager.getHistory()[0].timestamp;

        config.metadata.name = 'Modified';
        ConfigManager.saveCurrentConfig(config);

        const success = ConfigManager.restoreFromHistory(timestamp);
        expect(success).toBe(true);
    });

    it('should clear all configs', () => {
        const config = getDefaultBalanceConfig();
        ConfigManager.saveCurrentConfig(config);

        ConfigManager.clearAll();

        const history = ConfigManager.getHistory();
        expect(history.length).toBe(0);
    });
});
