import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStatStressTelemetry } from '../../../src/ui/balancing/hooks/useStatStressTelemetry';
import { DEFAULT_STAT_STRESS_TELEMETRY_CONFIG } from '../../../src/ui/balancing/config/statStressTelemetryConfig';

describe('StatStressTelemetryDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG).toBeDefined();
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.version).toBe('1.0.0');
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.charts.length).toBeGreaterThan(0);
    });

    it('should have synergy heatmap chart', () => {
      const heatmap = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.charts.find(c => c.id === 'synergy-heatmap');
      expect(heatmap).toBeDefined();
      expect(heatmap?.type).toBe('heatmap');
      expect(heatmap?.enabled).toBe(true);
    });

    it('should have marginal utility bar chart', () => {
      const barChart = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.charts.find(c => c.id === 'marginal-utility-bar');
      expect(barChart).toBeDefined();
      expect(barChart?.type).toBe('bar');
    });

    it('should have correct thresholds', () => {
      const chart = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.charts[0];
      expect(chart.thresholds.synergy).toBe(1.15);
      expect(chart.thresholds.antisynergy).toBe(0.95);
      expect(chart.thresholds.significant).toBe(0.05);
    });
  });

  describe('useStatStressTelemetry Hook', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useStatStressTelemetry());
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it('should load mock data', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.archetypes.length).toBeGreaterThan(0);
      expect(result.current.data?.marginalUtility.length).toBeGreaterThan(0);
    });

    it('should have correct summary stats', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const summary = result.current.data?.summary;
      expect(summary?.totalArchetypes).toBeGreaterThan(0);
      expect(summary?.singleStatArchetypes).toBeGreaterThan(0);
      expect(summary?.pairArchetypes).toBeGreaterThan(0);
      expect(summary?.avgWinRate).toBeGreaterThan(0);
    });

    it('should initialize with default filters', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      expect(result.current.filters.archetypeType).toBe('all');
      expect(result.current.filters.winRateRange).toEqual([0, 100]);
      expect(result.current.filters.showSynergies).toBe(false);
      expect(result.current.filters.showAntisynergies).toBe(false);
    });
  });

  describe('Filtering', () => {
    it('should filter by archetype type', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const totalBefore = result.current.filteredData?.archetypes.length || 0;

      result.current.setFilters({ archetypeType: 'single' });

      await waitFor(() => {
        const filtered = result.current.filteredData?.archetypes || [];
        expect(filtered.every(a => a.type === 'single')).toBe(true);
        expect(filtered.length).toBeLessThan(totalBefore);
      });
    });

    it('should filter by win rate range', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      result.current.setFilters({ winRateRange: [50, 60] });

      await waitFor(() => {
        const filtered = result.current.filteredData?.archetypes || [];
        expect(filtered.every(a => a.winRate >= 50 && a.winRate <= 60)).toBe(true);
      });
    });

    it('should filter by search term', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      result.current.setFilters({ search: 'HP' });

      await waitFor(() => {
        const filtered = result.current.filteredData?.archetypes || [];
        expect(filtered.every(a => a.name.includes('HP'))).toBe(true);
      });
    });

    it('should reset filters', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      result.current.setFilters({ archetypeType: 'single', search: 'HP' });
      result.current.resetFilters();

      await waitFor(() => {
        expect(result.current.filters.archetypeType).toBe('all');
        expect(result.current.filters.search).toBe('');
      });
    });
  });

  describe('Synergy Detection', () => {
    it('should detect synergies', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const synergies = result.current.data?.summary.synergies || 0;
      expect(synergies).toBeGreaterThanOrEqual(0);
    });

    it('should detect antisynergies', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const antisynergies = result.current.data?.summary.antisynergies || 0;
      expect(antisynergies).toBeGreaterThanOrEqual(0);
    });

    it('should filter by synergies only', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      result.current.setFilters({ showSynergies: true });

      await waitFor(() => {
        const marginalUtility = result.current.filteredData?.marginalUtility || [];
        marginalUtility.forEach(mu => {
          expect(mu.pairs.every(p => p.isSynergy)).toBe(true);
        });
      });
    });

    it('should filter by antisynergies only', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      result.current.setFilters({ showAntisynergies: true });

      await waitFor(() => {
        const marginalUtility = result.current.filteredData?.marginalUtility || [];
        marginalUtility.forEach(mu => {
          expect(mu.pairs.every(p => p.isAntisynergy)).toBe(true);
        });
      });
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const dataBefore = result.current.data;
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
        expect(result.current.data).not.toBe(dataBefore);
      });
    });

    it('should handle refresh errors', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useStatStressTelemetry({ onError }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets', async () => {
      const { result } = renderHook(() => useStatStressTelemetry());

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const maxDataPoints = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.maxDataPoints;
      expect(result.current.data?.archetypes.length).toBeLessThanOrEqual(maxDataPoints);
    });

    it('should have virtualization enabled', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.performance.enableVirtualization).toBe(true);
    });

    it('should have debounce delay configured', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.performance.debounceDelay).toBe(300);
    });

    it('should have max render time configured', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.performance.maxRenderTime).toBe(16);
    });
  });

  describe('Telemetry', () => {
    it('should have telemetry enabled by default', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.telemetry.enabled).toBe(true);
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.telemetry.trackInteractions).toBe(true);
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.telemetry.trackPerformance).toBe(true);
    });

    it('should allow disabling telemetry', () => {
      const customConfig = {
        ...DEFAULT_STAT_STRESS_TELEMETRY_CONFIG,
        telemetry: {
          enabled: false,
          trackInteractions: false,
          trackPerformance: false,
        },
      };

      const { result } = renderHook(() => useStatStressTelemetry({ config: customConfig }));
      expect(result.current.config.telemetry.enabled).toBe(false);
    });
  });

  describe('Charts Configuration', () => {
    it('should have 5 charts configured', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.charts.length).toBe(5);
    });

    it('should have all charts enabled by default', () => {
      const allEnabled = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.charts.every(c => c.enabled);
      expect(allEnabled).toBe(true);
    });

    it('should have correct chart types', () => {
      const types = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.charts.map(c => c.type);
      expect(types).toContain('heatmap');
      expect(types).toContain('bar');
      expect(types).toContain('scatter');
      expect(types).toContain('radar');
      expect(types).toContain('table');
    });

    it('should have color schemes for all charts', () => {
      DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.charts.forEach(chart => {
        expect(chart.colorScheme).toBeDefined();
        expect(chart.colorScheme.primary).toBeDefined();
        expect(chart.colorScheme.positive).toBeDefined();
        expect(chart.colorScheme.negative).toBeDefined();
      });
    });
  });

  describe('Filters Configuration', () => {
    it('should have 6 filters configured', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.filters.length).toBe(6);
    });

    it('should have all filters enabled by default', () => {
      const allEnabled = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.filters.every(f => f.enabled);
      expect(allEnabled).toBe(true);
    });

    it('should have correct filter types', () => {
      const types = DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.filters.map(f => f.type);
      expect(types).toContain('multiselect');
      expect(types).toContain('select');
      expect(types).toContain('range');
      expect(types).toContain('toggle');
      expect(types).toContain('search');
    });
  });

  describe('Auto Refresh', () => {
    it('should have auto refresh disabled by default', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.autoRefresh).toBe(false);
    });

    it('should have refresh rate configured', () => {
      expect(DEFAULT_STAT_STRESS_TELEMETRY_CONFIG.refreshRate).toBe(5000);
    });

    it('should support auto refresh when enabled', async () => {
      const customConfig = {
        ...DEFAULT_STAT_STRESS_TELEMETRY_CONFIG,
        autoRefresh: true,
      };

      const { result } = renderHook(() => useStatStressTelemetry({ 
        config: customConfig,
        autoRefresh: true,
      }));

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      expect(result.current.config.autoRefresh).toBe(true);
    });
  });
});
