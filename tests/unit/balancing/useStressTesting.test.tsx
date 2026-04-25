import { renderHook, screen, fireEvent, waitFor } from '@testing-library/react';
import { useStressTesting } from '@/ui/balancing/hooks/useStressTesting';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import { createMarginalUtilityCalculator } from '@/balancing/stressTesting/MarginalUtilityCalculator';

// Mock dependencies
vi.mock('@/balancing/hooks/useBalancerConfig', () => ({
  useBalancerConfig: () => ({
    config: {
      version: '1.0.0',
      stats: {
        hp: { id: 'hp', label: 'Health', type: 'number', min: 50, max: 200, step: 5, defaultValue: 100, weight: 1.0, isCore: true, isDerived: false },
        damage: { id: 'damage', label: 'Damage', type: 'number', min: 5, max: 50, step: 1, defaultValue: 15, weight: 1.0, isCore: true, isDerived: false },
        crit: { id: 'crit', label: 'Crit Chance', type: 'percentage', min: 0, max: 100, step: 5, defaultValue: 10, weight: 0.8, isCore: false, isDerived: false },
        dodge: { id: 'dodge', label: 'Dodge', type: 'percentage', min: 0, max: 100, step: 5, defaultValue: 5, weight: 0.6, isCore: false, isDerived: false }
      },
      cards: {},
      presets: {}
    }
  })
}));

vi.mock('@/balancing/stressTesting/StressTestArchetypeGenerator');
vi.mock('@/balancing/stressTesting/MarginalUtilityCalculator');
vi.mock('@/shared/persistence/PersistenceService', () => ({
  PersistenceService: {
    loadData: vi.fn(),
    saveData: vi.fn()
  }
}));

describe('useStressTesting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useStressTesting());
      
      expect(result.current.currentConfig).toEqual({
        pointsPerStat: 25,
        simulationCount: 1000,
        opSynergyThreshold: 1.15,
        weakSynergyThreshold: 0.95,
        seed: 12345,
        includeDerived: false,
        includeHidden: false
      });
    });

    it('should have empty initial state', () => {
      const { result } = renderHook(() => useStressTesting());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.archetypes).toEqual([]);
      expect(result.current.marginalUtilities).toEqual([]);
      expect(result.current.synergies).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });

    it('should generate stat labels from config', () => {
      const { result } = renderHook(() => useStressTesting());
      
      expect(result.current.statLabels).toEqual({
        hp: 'Health',
        damage: 'Damage',
        crit: 'Crit Chance',
        dodge: 'Dodge'
      });
    });
  });

  describe('generateArchetypes', () => {
    it('should generate archetypes successfully', async () => {
      const mockArchetypes = [
        {
          id: 'test-archetype',
          name: 'Test Archetype',
          description: 'Test description',
          stats: { hp: 125, damage: 20 },
          testedStats: ['hp'],
          pointsPerStat: 25,
          seed: 12345,
          type: 'single' as const
        }
      ];

      const mockGenerator = {
        generateArchetypes: vi.fn().mockReturnValue(mockArchetypes)
      };
      (StressTestArchetypeGenerator as any).mockImplementation(() => mockGenerator);

      const { result } = renderHook(() => useStressTesting());
      
      await act(async () => {
        await result.current.generateArchetypes();
      });

      expect(result.current.archetypes).toEqual(mockArchetypes);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle generation errors', async () => {
      const mockGenerator = {
        generateArchetypes: vi.fn().mockRejectedValue(new Error('Generation failed'))
      };
      (StressTestArchetypeGenerator as any).mockImplementation(() => mockGenerator);

      const { result } = renderHook(() => useStressTesting());
      
      await act(async () => {
        await expect(result.current.generateArchetypes()).rejects.toThrow('Generation failed');
      });

      expect(result.current.error).toBe('Generation failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('runAnalysis', () => {
    it('should run analysis successfully', async () => {
      const mockArchetypes = [
        {
          id: 'test-archetype',
          name: 'Test Archetype',
          description: 'Test description',
          stats: { hp: 125, damage: 20 },
          testedStats: ['hp'],
          pointsPerStat: 25,
          seed: 12345,
          type: 'single' as const
        }
      ];

      const mockUtilityResults = [
        {
          archetype: mockArchetypes[0],
          averageScore: 0.6,
          marginalUtility: 5.0,
          standardDeviation: 0.1,
          simulationCount: 1000,
          runtimeMs: 100
        }
      ];

      const mockSynergyResults = [
        {
          pairArchetype: mockArchetypes[0],
          statIds: ['hp', 'damage'] as [string, string],
          pairScore: 0.7,
          expectedScore: 0.6,
          synergyMultiplier: 1.17,
          isOpSynergy: true,
          isWeakSynergy: false,
          runtimeMs: 50
        }
      ];

      const mockCalculator = {
        analyzeArchetypes: vi.fn().mockReturnValue(mockUtilityResults),
        analyzeSynergies: vi.fn().mockReturnValue(mockSynergyResults)
      };
      (createMarginalUtilityCalculator as any).mockReturnValue(mockCalculator);

      const { result } = renderHook(() => useStressTesting());
      
      // Set up archetypes first
      result.current.archetypes = mockArchetypes;

      await act(async () => {
        await result.current.runAnalysis();
      });

      expect(result.current.marginalUtilities).toEqual(mockUtilityResults);
      expect(result.current.synergies).toEqual(mockSynergyResults);
      expect(result.current.hasResults).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should calculate derived metrics', async () => {
      const mockArchetypes = [
        { id: 'arch1', name: 'Arch 1', stats: { hp: 125 }, testedStats: ['hp'], pointsPerStat: 25, seed: 12345, type: 'single' },
        { id: 'arch2', name: 'Arch 2', stats: { damage: 20 }, testedStats: ['damage'], pointsPerStat: 25, seed: 12345, type: 'single' }
      ];

      const mockUtilityResults = [
        { archetype: mockArchetypes[0], averageScore: 0.6, marginalUtility: 5.0, standardDeviation: 0.1, simulationCount: 1000, runtimeMs: 100 },
        { archetype: mockArchetypes[1], averageScore: 0.4, marginalUtility: -2.0, standardDeviation: 0.2, simulationCount: 1000, runtimeMs: 100 }
      ];

      const mockSynergyResults = [
        { pairArchetype: mockArchetypes[0], statIds: ['hp', 'damage'], pairScore: 0.7, expectedScore: 0.6, synergyMultiplier: 1.17, isOpSynergy: true, isWeakSynergy: false, runtimeMs: 50 }
      ];

      const mockCalculator = {
        analyzeArchetypes: vi.fn().mockReturnValue(mockUtilityResults),
        analyzeSynergies: vi.fn().mockReturnValue(mockSynergyResults)
      };
      (createMarginalUtilityCalculator as any).mockReturnValue(mockCalculator);

      const { result } = renderHook(() => useStressTesting());
      result.current.archetypes = mockArchetypes;

      await act(async () => {
        await result.current.runAnalysis();
      });

      expect(result.current.totalArchetypes).toBe(2);
      expect(result.current.opSynergies).toBe(1);
      expect(result.current.weakSynergies).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const { result } = renderHook(() => useStressTesting());
      
      act(() => {
        result.current.updateConfig({ pointsPerStat: 30, simulationCount: 2000 });
      });

      expect(result.current.currentConfig.pointsPerStat).toBe(30);
      expect(result.current.currentConfig.simulationCount).toBe(2000);
    });
  });

  describe('clearData', () => {
    it('should clear all data', () => {
      const { result } = renderHook(() => useStressTesting());
      
      // Set some data first
      result.current.archetypes = [{ id: 'test' } as any];
      result.current.marginalUtilities = [{ archetype: { id: 'test' } }] as any;
      result.current.synergies = [{ pairArchetype: { id: 'test' } }] as any;
      result.current.error = 'test error';

      act(() => {
        result.current.clearData();
      });

      expect(result.current.archetypes).toEqual([]);
      expect(result.current.marginalUtilities).toEqual([]);
      expect(result.current.synergies).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('exportResults', () => {
    it('should export results as JSON', () => {
      const mockCreateObjectURL = vi.fn();
      const mockRevokeObjectURL = vi.fn();
      const mockCreateElement = vi.fn();
      const mockClick = vi.fn();

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
      global.document.createElement = mockCreateElement;
      mockCreateElement.mockReturnValue({
        href: '',
        download: '',
        click: mockClick
      });

      const { result } = renderHook(() => useStressTesting());
      
      // Set some test data
      result.current.currentConfig = { pointsPerStat: 25 } as any;
      result.current.archetypes = [{ id: 'test' }] as any;
      result.current.marginalUtilities = [{ archetype: { id: 'test' } }] as any;
      result.current.synergies = [{ pairArchetype: { id: 'test' } }] as any;

      act(() => {
        result.current.exportResults('json');
      });

      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.any(Blob),
        { type: 'application/json' }
      );
      expect(mockClick).toHaveBeenCalled();
    });
  });
});

// Helper function for async testing
async function act<T>(callback: () => T | Promise<T>): Promise<T> {
  return await callback();
}
