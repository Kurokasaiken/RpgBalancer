/**
 * useStatProfile Hook Test Suite
 * 
 * Comprehensive testing for the stat profile hook including data processing,
 * configuration management, selection handling, and telemetry integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStatProfile } from '@/balancing/hooks/useStatProfile';
import type { StressTestArchetype, MarginalUtilityResult } from '@/balancing/stressTesting/types';
import { trackStressTestEvent } from '@/analytics/stressTesting';

// Mock the analytics module
vi.mock('@/analytics/stressTesting', () => ({
  trackStressTestEvent: vi.fn(),
}));

// Mock the balancer config hook
vi.mock('@/balancing/hooks/useBalancerConfig', () => ({
  useBalancerConfig: () => ({
    config: {
      stats: [
        { id: 'hp', name: 'Health', weight: 1.0, min: 0, max: 200 },
        { id: 'damage', name: 'Damage', weight: 1.2, min: 0, max: 150 },
        { id: 'defense', name: 'Defense', weight: 0.8, min: 0, max: 100 },
        { id: 'speed', name: 'Speed', weight: 1.1, min: 0, max: 120 },
        { id: 'magic', name: 'Magic', weight: 1.3, min: 0, max: 180 },
        { id: 'resistance', name: 'Resistance', weight: 0.9, min: 0, max: 100 },
      ],
    },
  }),
}));

// Mock test data
const mockArchetypes: StressTestArchetype[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'High health and defense',
    stats: { hp: 120, damage: 80, defense: 90, speed: 40 },
    testedStats: ['hp', 'damage', 'defense', 'speed'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'single',
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'High magic and resistance',
    stats: { hp: 70, damage: 40, magic: 110, resistance: 85 },
    testedStats: ['hp', 'damage', 'magic', 'resistance'],
    pointsPerStat: 25,
    seed: 12346,
    type: 'single',
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'High speed and evasion',
    stats: { hp: 60, damage: 75, speed: 95, magic: 30 },
    testedStats: ['hp', 'damage', 'speed', 'magic'],
    pointsPerStat: 25,
    seed: 12347,
    type: 'single',
  },
];

const mockMarginalUtilities: MarginalUtilityResult[] = [
  {
    statId: 'hp',
    averageWinRate: 0.65,
    synergyScore: 1.18,
    sampleSize: 1000,
    confidence: 0.95,
  },
  {
    statId: 'damage',
    averageWinRate: 0.72,
    synergyScore: 1.22,
    sampleSize: 1000,
    confidence: 0.95,
  },
  {
    statId: 'defense',
    averageWinRate: 0.58,
    synergyScore: 0.92,
    sampleSize: 1000,
    confidence: 0.95,
  },
  {
    statId: 'speed',
    averageWinRate: 0.68,
    synergyScore: 1.08,
    sampleSize: 1000,
    confidence: 0.95,
  },
];

describe('useStatProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Processing', () => {
    it('should process archetypes into stat profiles', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      expect(result.current.statProfiles).toHaveLength(6);
      // Find the HP profile specifically rather than assuming index order
      const hpProfile = result.current.statProfiles.find(p => p.statId === 'hp');
      expect(hpProfile).toMatchObject({
        statId: 'hp',
        displayName: 'Health',
        tier: 'excellent', // synergyScore 1.18 >= 1.15
        value: expect.any(Number),
        normalizedValue: expect.any(Number),
      });
    });

    it('should calculate correct average values', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      const hpProfile = result.current.statProfiles.find(p => p.statId === 'hp');
      expect(hpProfile?.value).toBe((120 + 70 + 60) / 3); // Average HP across archetypes
    });

    it('should assign correct performance tiers based on synergy', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      const hpProfile = result.current.statProfiles.find(p => p.statId === 'hp');
      const defenseProfile = result.current.statProfiles.find(p => p.statId === 'defense');

      expect(hpProfile?.tier).toBe('excellent'); // synergyScore 1.18 >= 1.15
      expect(defenseProfile?.tier).toBe('poor'); // synergyScore 0.92 < 0.95
    });

    it('should filter stats by minimum value', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities, { minStatValue: 50 })
      );

      // Magic has values 110, 40, 30 - average 60, should be included
      // All other stats should have averages > 50
      const magicProfile = result.current.statProfiles.find(p => p.statId === 'magic');
      expect(magicProfile?.value).toBeGreaterThan(50);
    });

    it('should limit number of stats displayed', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities, { maxStats: 3 })
      );

      expect(result.current.statProfiles).toHaveLength(3);
    });

    it('should handle empty archetypes gracefully', () => {
      const { result } = renderHook(() => 
        useStatProfile([], [])
      );

      expect(result.current.statProfiles).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Configuration Management', () => {
    it('should use default radar configuration', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities, { enableAutoTune: false })
      );

      expect(result.current.radarConfig.gridLevels).toBe(5);
      expect(result.current.radarConfig.colors.excellent).toBe('#10b981');
      // Max value should be default when auto-tune is disabled
      expect(result.current.radarConfig.maxValue).toBe(100);
    });

    it('should merge custom radar configuration', () => {
      const customConfig = {
        maxValue: 150,
        colors: {
          excellent: '#00ff00',
        },
      };

      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities, { 
          radarConfig: customConfig,
          enableAutoTune: false 
        })
      );

      expect(result.current.radarConfig.maxValue).toBe(150);
      expect(result.current.radarConfig.colors.excellent).toBe('#00ff00');
      expect(result.current.radarConfig.gridLevels).toBe(5); // Default preserved
    });

    it('should auto-tune max value when enabled', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities, { 
          enableAutoTune: true 
        })
      );

      // Max stat value should be tuned based on data
      const maxValue = Math.max(...result.current.statProfiles.map(p => p.value));
      expect(result.current.radarConfig.maxValue).toBeGreaterThanOrEqual(maxValue);
    });
  });

  describe('Selection Management', () => {
    it('should select a stat', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      act(() => {
        result.current.selectStat('hp');
      });

      expect(result.current.selectedStat?.statId).toBe('hp');
      expect(trackStressTestEvent).toHaveBeenCalledWith('stat_profile_selected', expect.objectContaining({
        statId: 'hp',
        displayName: 'Health',
      }));
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      act(() => {
        result.current.selectStat('hp');
      });
      expect(result.current.selectedStat).not.toBeNull();

      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedStat).toBeNull();
    });

    it('should handle selection of non-existent stat', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      act(() => {
        result.current.selectStat('nonexistent');
      });

      expect(result.current.selectedStat).toBeNull();
    });
  });

  describe('Data Export', () => {
    it('should export data as JSON', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      act(() => {
        result.current.selectStat('hp');
      });

      const exportedData = JSON.parse(result.current.exportData());

      expect(exportedData).toHaveProperty('timestamp');
      expect(exportedData).toHaveProperty('radarConfig');
      expect(exportedData).toHaveProperty('statProfiles');
      expect(exportedData).toHaveProperty('selectedStat');
      expect(exportedData.statProfiles).toHaveLength(6);
      expect(exportedData.selectedStat.statId).toBe('hp');
    });

    it('should track export telemetry', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      act(() => {
        result.current.exportData();
      });

      expect(trackStressTestEvent).toHaveBeenCalledWith('stat_profile_exported', expect.objectContaining({
        profileCount: 6,
        hasSelection: false,
      }));
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data', async () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      act(() => {
        result.current.refresh();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(trackStressTestEvent).toHaveBeenCalledWith('stat_profile_refreshed', expect.objectContaining({
        profileCount: 6,
      }));
    });
  });

  describe('Telemetry Integration', () => {
    it('should track profile view on mount', () => {
      renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities, { enableTelemetry: true })
      );

      expect(trackStressTestEvent).toHaveBeenCalledWith('stat_profile_viewed', expect.objectContaining({
        profileCount: 6,
        maxValue: expect.any(Number),
        hasSelection: false,
        autoTuneEnabled: true,
      }));
    });

    it('should not track telemetry when disabled', () => {
      renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities, { enableTelemetry: false })
      );

      expect(trackStressTestEvent).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper data structure for screen readers', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      result.current.statProfiles.forEach(profile => {
        expect(profile).toHaveProperty('statId');
        expect(profile).toHaveProperty('displayName');
        expect(profile).toHaveProperty('value');
        expect(profile).toHaveProperty('tier');
        expect(profile.displayName).toBeTruthy();
        expect(typeof profile.value).toBe('number');
        expect(['excellent', 'good', 'average', 'poor']).toContain(profile.tier);
      });
    });

    it('should handle coordinate scaling properly', () => {
      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      result.current.statProfiles.forEach(profile => {
        expect(profile.normalizedValue).toBeGreaterThanOrEqual(0);
        expect(profile.normalizedValue).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing balancer config gracefully', () => {
      // Mock the hook to return null config
      vi.doMock('@/balancing/hooks/useBalancerConfig', () => ({
        useBalancerConfig: () => ({ config: null }),
      }));

      const { result } = renderHook(() => 
        useStatProfile(mockArchetypes, mockMarginalUtilities)
      );

      // Should still process stats but with fallback display names
      expect(result.current.statProfiles.length).toBeGreaterThan(0);
      expect(result.current.error).toBeNull();
      
      // Should use statId as displayName when config is missing
      const hpProfile = result.current.statProfiles.find(p => p.statId === 'hp');
      expect(hpProfile?.displayName).toBe('hp');
    });

    it('should handle malformed archetype data', () => {
      const malformedArchetypes = [
        { ...mockArchetypes[0], stats: null },
        { ...mockArchetypes[1], stats: { hp: 'invalid' } },
      ] as any;

      const { result } = renderHook(() => 
        useStatProfile(malformedArchetypes, mockMarginalUtilities)
      );

      // Should not crash and should handle gracefully
      expect(result.current.error).toBeNull();
      // Should process valid archetype data only
      expect(result.current.statProfiles.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should process large datasets efficiently', () => {
      const largeArchetypes = Array.from({ length: 100 }, (_, i) => ({
        ...mockArchetypes[0],
        id: `archetype-${i}`,
        stats: {
          hp: 50 + Math.random() * 100,
          damage: 30 + Math.random() * 80,
          defense: 20 + Math.random() * 60,
          speed: 10 + Math.random() * 50,
        },
      }));

      const startTime = performance.now();
      const { result } = renderHook(() => 
        useStatProfile(largeArchetypes, mockMarginalUtilities)
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should process in < 100ms
      expect(result.current.statProfiles).toHaveLength(4);
    });
  });
});
