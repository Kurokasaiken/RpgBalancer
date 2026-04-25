import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResourceMetadata } from '@/ui/idleVillage/hooks/useResourceMetadata';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

describe('useResourceMetadata', () => {
  it('returns label, icon, and colorClass for known resource', () => {
    const config: IdleVillageConfig = {
      version: '1.0.0',
      resources: {
        gold: {
          id: 'gold',
          label: 'Oro',
          icon: '🪙',
          colorClass: 'text-yellow-200',
          description: 'Moneta preziosa',
        },
      },
      activities: {},
      questTypes: {},
      mapSlots: {},
      passiveEffects: {},
      buildings: {},
      variance: {
        difficultyCategories: {},
        rewardCategories: {},
      },
      globalRules: {
        maxFatigueBeforeExhausted: 100,
        defaultActivityFatigueGain: 10,
        baseLightInjuryChanceAtMaxFatigue: 0.1,
        dangerInjuryMultiplierPerPoint: 0.01,
        injuryTiers: {},
        foodConsumptionPerResidentPerDay: 1,
        baseFoodPriceInGold: 1,
        questXpFormula: 'level * 10',
        maxActiveQuests: 3,
        questSpawnEveryNDays: 1,
        maxGlobalQuestOffers: 5,
        maxQuestOffersPerSlot: 2,
        fatigueRecoveryPerDay: 20,
        dayLengthInTimeUnits: 24,
        fatigueYellowThreshold: 50,
        fatigueRedThreshold: 80,
      },
      overlaySettings: {
        enabled: false,
        defaultPosition: 'top-right',
        defaultSize: 'compact',
        defaultZoom: 1,
        alwaysOnTop: false,
        transparency: false,
        enabledWidgets: [],
        autoHideTimeoutSeconds: 0,
        showSystemTrayIcon: false,
      },
    };

    const { result } = renderHook(() => useResourceMetadata(config));
    const metadata = result.current('gold');

    expect(metadata.label).toBe('Oro');
    expect(metadata.icon).toBe('🪙');
    expect(metadata.colorClass).toBe('text-yellow-200');
    expect(metadata.description).toBe('Moneta preziosa');
  });

  it('returns resourceId as label for unknown resource with fallbacks', () => {
    const config: IdleVillageConfig = {
      version: '1.0.0',
      resources: {},
      activities: {},
      questTypes: {},
      mapSlots: {},
      passiveEffects: {},
      buildings: {},
      variance: {
        difficultyCategories: {},
        rewardCategories: {},
      },
      globalRules: {
        maxFatigueBeforeExhausted: 100,
        defaultActivityFatigueGain: 10,
        baseLightInjuryChanceAtMaxFatigue: 0.1,
        dangerInjuryMultiplierPerPoint: 0.01,
        injuryTiers: {},
        foodConsumptionPerResidentPerDay: 1,
        baseFoodPriceInGold: 1,
        questXpFormula: 'level * 10',
        maxActiveQuests: 3,
        questSpawnEveryNDays: 1,
        maxGlobalQuestOffers: 5,
        maxQuestOffersPerSlot: 2,
        fatigueRecoveryPerDay: 20,
        dayLengthInTimeUnits: 24,
        fatigueYellowThreshold: 50,
        fatigueRedThreshold: 80,
      },
      overlaySettings: {
        enabled: false,
        defaultPosition: 'top-right',
        defaultSize: 'compact',
        defaultZoom: 1,
        alwaysOnTop: false,
        transparency: false,
        enabledWidgets: [],
        autoHideTimeoutSeconds: 0,
        showSystemTrayIcon: false,
      },
    };

    const { result } = renderHook(() => useResourceMetadata(config));
    const metadata = result.current('unknown');

    expect(metadata.label).toBe('unknown');
    expect(metadata.icon).toBeUndefined();
    expect(metadata.colorClass).toBeUndefined();
    expect(metadata.description).toBeUndefined();
  });

  it('handles null/undefined config gracefully', () => {
    const { result } = renderHook(() => useResourceMetadata(null));
    const metadata = result.current('any');

    expect(metadata.label).toBe('any');
    expect(metadata.icon).toBeUndefined();
    expect(metadata.colorClass).toBeUndefined();
    expect(metadata.description).toBeUndefined();
  });
});
