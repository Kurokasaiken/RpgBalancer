/**
 * Tests for BalanceConfigStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BalanceConfigStore } from '../BalanceConfigStore';
import type { BalanceConfig } from '../balanceConfig';

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

describe('BalanceConfigStore', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    it('should save and load config', () => {
        const config: Partial<BalanceConfig> = {
            version: '1.0.0',
            weights: {
                hp: 1.0,
                damage: 5.0,
                txc: 0.2,
                evasion: 0.2,
                agility: 0.5,
                critChance: 0.05,
                critMult: 0.5,
                critTxCBonus: 0.1,
                failChance: 0.05,
                failMult: 0.0,
                failTxCMalus: 0.1,
                armor: 5.0,
                resistance: 20.0,
                armorPen: 5.0,
                penPercent: 20.0,
                lifesteal: 10.0,
                regen: 2.0,
                ward: 1.0,
                block: 10.0,
                energyShield: 1.0,
                thorns: 3.0,
                cooldownReduction: 0.0,
                castSpeed: 0.0,
                movementSpeed: 0.0
            }
        };

        BalanceConfigStore.save('global', config, 'Test save');
        const loaded = BalanceConfigStore.load('global');

        expect(loaded).not.toBeNull();
        expect(loaded?.weights.hp).toBe(1.0);
        expect(loaded?.weights.damage).toBe(5.0);
    });

    it('should maintain history limit', () => {
        for (let i = 0; i < 15; i++) {
            const config = { version: '1.0.0', iteration: i };
            BalanceConfigStore.save('global', config, `Iteration ${i}`);
        }

        const history = BalanceConfigStore.getHistory('global');
        expect(history.length).toBeLessThanOrEqual(10);
    });

    it('should generate consistent checksums', () => {
        const config = { version: '1.0.0', data: 'test' };

        BalanceConfigStore.save('global', config);
        const snapshot1 = BalanceConfigStore.getHistory('global')[0];

        BalanceConfigStore.save('global', config);
        const snapshot2 = BalanceConfigStore.getHistory('global')[0];

        expect(snapshot1.checksum).toBe(snapshot2.checksum);
    });

    it('should clear config and history', () => {
        const config = { version: '1.0.0' };
        BalanceConfigStore.save('global', config);

        expect(BalanceConfigStore.load('global')).not.toBeNull();
        expect(BalanceConfigStore.getHistory('global').length).toBeGreaterThan(0);

        BalanceConfigStore.clear('global');

        expect(BalanceConfigStore.load('global')).toBeNull();
        expect(BalanceConfigStore.getHistory('global').length).toBe(0);
    });

    it('should return null for non-existent config', () => {
        const loaded = BalanceConfigStore.load('weights');
        expect(loaded).toBeNull();
    });
});
