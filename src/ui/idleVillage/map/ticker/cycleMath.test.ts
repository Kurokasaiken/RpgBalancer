import { describe, it, expect } from 'vitest';
import { deriveCycleConfig, deriveCycleState } from './cycleMath';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

describe('deriveCycleConfig', () => {
    it('should derive config with default secondsPerTimeUnit', () => {
        const config: IdleVillageConfig = {
            globalRules: {
                dayLengthInTimeUnits: 5,
                dayNightCycle: { dayTimeUnits: 3, nightTimeUnits: 4 },
            },
        } as IdleVillageConfig;

        const result = deriveCycleConfig(config);

        expect(result.secondsPerTimeUnit).toBe(1);
        expect(result.dayTimeUnits).toBe(3);
        expect(result.nightTimeUnits).toBe(4);
        expect(result.totalCycleUnits).toBe(7);
        expect(result.totalCycleSeconds).toBe(7);
    });

    it('should use custom secondsPerTimeUnit', () => {
        const config: IdleVillageConfig = {
            globalRules: {
                secondsPerTimeUnit: 2,
                dayLengthInTimeUnits: 5,
                dayNightCycle: { dayTimeUnits: 2, nightTimeUnits: 3 },
            },
        } as IdleVillageConfig;

        const result = deriveCycleConfig(config);

        expect(result.secondsPerTimeUnit).toBe(2);
        expect(result.totalCycleSeconds).toBe(10); // 5 * 2
    });

    it('should fallback to dayLengthInTimeUnits when dayNightCycle is missing', () => {
        const config: IdleVillageConfig = {
            globalRules: {
                dayLengthInTimeUnits: 6,
            },
        } as IdleVillageConfig;

        const result = deriveCycleConfig(config);

        expect(result.dayTimeUnits).toBe(6);
        expect(result.nightTimeUnits).toBe(6);
        expect(result.totalCycleUnits).toBe(12);
    });

    it('should enforce minimum 1 time unit', () => {
        const config: IdleVillageConfig = {
            globalRules: {
                dayNightCycle: { dayTimeUnits: 0, nightTimeUnits: -1 },
            },
        } as IdleVillageConfig;

        const result = deriveCycleConfig(config);

        expect(result.dayTimeUnits).toBe(1);
        expect(result.nightTimeUnits).toBe(1);
        expect(result.totalCycleUnits).toBe(2);
    });
});

describe('deriveCycleState', () => {
    const configSnapshot = {
        secondsPerTimeUnit: 1,
        dayTimeUnits: 5,
        nightTimeUnits: 5,
        totalCycleUnits: 10,
        totalCycleSeconds: 10,
    };

    it('should derive day phase for time 0', () => {
        const result = deriveCycleState(configSnapshot, 0);

        expect(result.isDayPhase).toBe(true);
        expect(result.phaseLabel).toBe('Fase giorno');
        expect(result.phaseIcon).toBe('☀️');
        expect(result.progressFraction).toBe(0);
        expect(result.elapsedSeconds).toBe(0);
    });

    it('should derive day phase for time 4 (within day)', () => {
        const result = deriveCycleState(configSnapshot, 4);

        expect(result.isDayPhase).toBe(true);
        expect(result.progressFraction).toBe(0.4);
        expect(result.elapsedSeconds).toBe(4);
    });

    it('should derive night phase for time 6 (after day)', () => {
        const result = deriveCycleState(configSnapshot, 6);

        expect(result.isDayPhase).toBe(false);
        expect(result.phaseLabel).toBe('Fase notte');
        expect(result.phaseIcon).toBe('🌙');
        expect(result.progressFraction).toBe(0.6);
    });

    it('should cycle back to day after total units', () => {
        const result = deriveCycleState(configSnapshot, 10);

        expect(result.isDayPhase).toBe(true);
        expect(result.progressFraction).toBe(0);
    });

    it('should handle large time units', () => {
        const result = deriveCycleState(configSnapshot, 25); // 2 full cycles + 5

        expect(result.isDayPhase).toBe(false);
        expect(result.progressFraction).toBe(0.5);
    });

    it('should handle negative time units', () => {
        const result = deriveCycleState(configSnapshot, -1);

        expect(result.elapsedSeconds).toBe(0);
        expect(result.progressFraction).toBe(0);
    });
});
