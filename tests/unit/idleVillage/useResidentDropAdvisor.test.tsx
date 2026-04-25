/**
 * Tests for useResidentDropAdvisor hook
 *
 * Comprehensive test suite for the AI drop suggestion system.
 * Tests integration with the drop suggestion engine and UI components.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useResidentDropAdvisor } from '@/ui/idleVillage/hooks/useResidentDropAdvisor';
import type { ActivityDefinition, ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { AssignmentFailureReason, ValidationFailureDetails } from '@/ui/idleVillage/slots/residentSlotValidators';
import { useVillageStateStore } from '@/ui/idleVillage/useVillageStateStore';

// Mock the village state store
vi.mock('@/ui/idleVillage/useVillageStateStore', () => ({
  useVillageStateStore: vi.fn(),
}));

const mockUseVillageStateStore = vi.mocked(useVillageStateStore);

// Mock test data
const mockResident: ResidentState = {
  id: 'resident-1',
  name: 'Test Resident',
  stats: { strength: 5, agility: 3, intelligence: 7 },
  fatigue: 20,
  status: 'available' as const,
  personality: { traits: [], preferences: {} },
  history: { activitiesCompleted: 0, totalFatigue: 0, totalRewards: {} },
};

const mockActivity: ActivityDefinition = {
  id: 'activity-1',
  name: 'Test Activity',
  label: 'Test Activity',
  description: 'A test activity',
  statRequirement: {
    allOf: ['strength'],
    anyOf: ['agility', 'intelligence'],
    noneOf: [],
  },
  maxSlots: 3,
  rewards: [{ resourceId: 'food', amount: 10 }],
  fatigueProfile: { baseGain: 5 },
  dangerRating: 2,
};

const mockVillagesState = {
  residents: { 'resident-1': mockResident },
  activities: [mockActivity],
};

describe('useResidentDropAdvisor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVillageStateStore.mockReturnValue(mockVillagesState);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Hook initialization', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.analysis).toBeNull;
      expect(result.current.isEnabled).toBe(true);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        enabled: false,
        maxSuggestions: 5,
        minPriority: 'high' as const,
      };

      const { result } = renderHook(() => useResidentDropAdvisor({ config: customConfig }));

      expect(result.current.isEnabled).toBe(false);
    });

    it('should respect autoClearOnSuccess option', () => {
      const { result } = renderHook(() =>
        useResidentDropAdvisor({ autoClearOnSuccess: false })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('analyzeDrop functionality', () => {
    it('should return disabled analysis when AI is not enabled', () => {
      const { result } = renderHook(() =>
        useResidentDropAdvisor({ config: { enabled: false } })
      );

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        undefined,
        undefined
      );

      expect(analysis.isValid).toBe(true);
      expect(analysis.suggestions).toEqual([]);
      expect(analysis.analysisScore).toBe(0.5);
    });

    it('should analyze successful drop operations', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        undefined, // No failure reason = success
        undefined
      );

      expect(analysis.isValid).toBe(true);
      expect(analysis.failureReason).toBeUndefined();
      expect(analysis.analysisScore).toBeGreaterThan(0.5); // Good score for success
    });

    it('should analyze validation failures', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const validationDetails: ValidationFailureDetails = {
        missingAllOf: ['strength'],
        anyOfMatched: false,
        blockedBy: [],
        requirementDescription: 'Test requirement',
      };

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'VALIDATION_FAILED' as AssignmentFailureReason,
        validationDetails
      );

      expect(analysis.isValid).toBe(false);
      expect(analysis.failureReason).toBe('VALIDATION_FAILED');
      expect(analysis.validationDetails).toBe(validationDetails);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle fatigue threshold failures', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'FATIGUE_THRESHOLD' as AssignmentFailureReason,
        undefined
      );

      expect(analysis.isValid).toBe(false);
      expect(analysis.failureReason).toBe('FATIGUE_THRESHOLD');
      expect(analysis.analysisScore).toBeLessThan(0.5);
    });

    it('should handle resident not found', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const analysis = result.current.analyzeDrop(
        'nonexistent-resident',
        mockActivity,
        'RESIDENT_NOT_FOUND' as AssignmentFailureReason,
        undefined
      );

      expect(analysis.isValid).toBe(false);
      expect(analysis.failureReason).toBe('RESIDENT_NOT_FOUND');
      expect(analysis.suggestions).toEqual([]);
      expect(analysis.analysisScore).toBe(0);
    });

    it('should handle unavailable resident', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'RESIDENT_UNAVAILABLE' as AssignmentFailureReason,
        undefined
      );

      expect(analysis.isValid).toBe(false);
      expect(analysis.failureReason).toBe('RESIDENT_UNAVAILABLE');
      expect(analysis.analysisScore).toBeLessThan(0.5);
    });

    it('should handle scheduler conflicts', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'SCHEDULER_REJECTED' as AssignmentFailureReason,
        undefined
      );

      expect(analysis.isValid).toBe(false);
      expect(analysis.failureReason).toBe('SCHEDULER_REJECTED');
    });
  });

  describe('Suggestion generation', () => {
    it('should generate rest suggestions for fatigue issues', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'FATIGUE_THRESHOLD' as AssignmentFailureReason,
        undefined
      );

      const restSuggestions = analysis.suggestions.filter(
        s => s.type === 'REST_RESIDENT'
      );
      expect(restSuggestions.length).toBeGreaterThan(0);
      expect(restSuggestions[0].priority).toBe('high');
    });

    it('should generate stat upgrade suggestions for validation failures', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const validationDetails: ValidationFailureDetails = {
        missingAllOf: ['strength'],
        anyOfMatched: false,
        blockedBy: [],
        requirementDescription: 'Missing strength requirement',
      };

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'VALIDATION_FAILED' as AssignmentFailureReason,
        validationDetails
      );

      const upgradeSuggestions = analysis.suggestions.filter(
        s => s.type === 'STAT_UPGRADE'
      );
      expect(upgradeSuggestions.length).toBeGreaterThan(0);
      expect(upgradeSuggestions[0].statHints).toContain('strength');
    });

    it('should generate alternative activity suggestions', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const validationDetails: ValidationFailureDetails = {
        missingAllOf: ['nonexistent-stat'],
        anyOfMatched: false,
        blockedBy: [],
        requirementDescription: 'Test mismatch',
      };

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'VALIDATION_FAILED' as AssignmentFailureReason,
        validationDetails
      );

      const alternativeSuggestions = analysis.suggestions.filter(
        s => s.type === 'ALTERNATIVE_ACTIVITY'
      );
      expect(alternativeSuggestions.length).toBeGreaterThan(0);
    });

    it('should prioritize high-priority suggestions', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const validationDetails: ValidationFailureDetails = {
        missingAllOf: ['critical-stat'],
        anyOfMatched: false,
        blockedBy: [],
        requirementDescription: 'Critical mismatch',
      };

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'VALIDATION_FAILED' as AssignmentFailureReason,
        validationDetails
      );

      // First suggestion should be high priority for validation failures
      expect(analysis.suggestions[0].priority).toBe('high');
    });

    it('should limit suggestions based on configuration', () => {
      const { result } = renderHook(() =>
        useResidentDropAdvisor({ config: { maxSuggestions: 2 } })
      );

      const validationDetails: ValidationFailureDetails = {
        missingAllOf: ['stat1', 'stat2', 'stat3'],
        anyOfMatched: false,
        blockedBy: [],
        requirementDescription: 'Multiple stat issues',
      };

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'VALIDATION_FAILED' as AssignmentFailureReason,
        validationDetails
      );

      expect(analysis.suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Hook state management', () => {
    it('should update suggestions after analysis', async () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      expect(result.current.suggestions).toEqual([]);

      act(() => {
        result.current.analyzeDrop(
          'resident-1',
          mockActivity,
          'VALIDATION_FAILED' as AssignmentFailureReason,
          { missingAllOf: ['strength'] }
        );
      });

      // Wait for debounced update
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(result.current.suggestions.length).toBeGreaterThan(0);
      expect(result.current.analysis).not.toBeNull();
    });

    it('should clear suggestions when requested', async () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      act(() => {
        result.current.analyzeDrop(
          'resident-1',
          mockActivity,
          'VALIDATION_FAILED' as AssignmentFailureReason,
          { missingAllOf: ['strength'] }
        );
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(result.current.suggestions.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearSuggestions();
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.analysis).toBeNull();
    });

    it('should auto-clear suggestions on successful drops', async () => {
      const { result } = renderHook(() =>
        useResidentDropAdvisor({ autoClearOnSuccess: true })
      );

      act(() => {
        result.current.analyzeDrop(
          'resident-1',
          mockActivity,
          undefined, // Success
          undefined
        );
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(result.current.suggestions.length).toBeGreaterThan(0);

      // Wait for auto-clear timeout
      await new Promise(resolve => setTimeout(resolve, 2100));

      expect(result.current.suggestions).toEqual([]);
    });

    it('should not auto-clear when disabled', async () => {
      const { result } = renderHook(() =>
        useResidentDropAdvisor({ autoClearOnSuccess: false })
      );

      act(() => {
        result.current.analyzeDrop(
          'resident-1',
          mockActivity,
          undefined, // Success
          undefined
        );
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      const initialSuggestionCount = result.current.suggestions.length;
      expect(initialSuggestionCount).toBeGreaterThan(0);

      // Wait for auto-clear timeout
      await new Promise(resolve => setTimeout(resolve, 2100));

      // Suggestions should still be there
      expect(result.current.suggestions.length).toBe(initialSuggestionCount);
    });
  });

  describe('Configuration updates', () => {
    it('should update configuration dynamically', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      expect(result.current.isEnabled).toBe(true);

      act(() => {
        result.current.updateConfig({ enabled: false });
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should maintain custom configuration across updates', () => {
      const { result } = renderHook(() =>
        useResidentDropAdvisor({ config: { maxSuggestions: 5 } })
      );

      act(() => {
        result.current.updateConfig({ enabled: false });
      });

      // Should maintain maxSuggestions while updating enabled
      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('Debounced updates', () => {
    it('should debounce suggestion updates', async () => {
      const { result } = renderHook(() =>
        useResidentDropAdvisor({ debounceMs: 100 })
      );

      let updateCount = 0;
      const originalAnalyze = result.current.analyzeDrop;

      // Mock to track updates
      const mockAnalyze = vi.fn((...args) => {
        updateCount++;
        return originalAnalyze(...args);
      });

      // Multiple rapid calls
      act(() => { mockAnalyze('resident-1', mockActivity, 'VALIDATION_FAILED', { missingAllOf: ['strength'] }); });
      act(() => { mockAnalyze('resident-1', mockActivity, 'VALIDATION_FAILED', { missingAllOf: ['agility'] }); });
      act(() => { mockAnalyze('resident-1', mockActivity, 'VALIDATION_FAILED', { missingAllOf: ['intelligence'] }); });

      // Should only update once due to debouncing
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(updateCount).toBe(1);
    });
  });

  describe('Integration with village state', () => {
    it('should use village activities for alternative suggestions', () => {
      const activitiesWithAlternatives = [
        mockActivity,
        {
          ...mockActivity,
          id: 'activity-2',
          name: 'Alternative Activity',
          label: 'Alternative Activity',
          statRequirement: {
            allOf: ['agility'],
            anyOf: [],
            noneOf: [],
          },
        },
      ];

      mockUseVillageStateStore.mockReturnValue({
        ...mockVillagesState,
        activities: activitiesWithAlternatives,
      });

      const { result } = renderHook(() => useResidentDropAdvisor());

      const analysis = result.current.analyzeDrop(
        'resident-1',
        mockActivity,
        'VALIDATION_FAILED' as AssignmentFailureReason,
        { missingAllOf: ['strength'] }
      );

      // Should suggest alternative activities
      const alternativeSuggestions = analysis.suggestions.filter(
        s => s.type === 'ALTERNATIVE_ACTIVITY'
      );
      expect(alternativeSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed validation details gracefully', () => {
      const { result } = renderHook(() => useResidentDropAdvisor());

      const malformedDetails = {
        missingAllOf: null,
        anyOfMatched: 'invalid' as any,
        blockedBy: undefined,
      } as any;

      expect(() => {
        result.current.analyzeDrop(
          'resident-1',
          mockActivity,
          'VALIDATION_FAILED' as AssignmentFailureReason,
          malformedDetails
        );
      }).not.toThrow();
    });

    it('should handle missing resident data gracefully', () => {
      mockUseVillageStateStore.mockReturnValue({
        ...mockVillagesState,
        residents: {}, // Empty residents
      });

      const { result } = renderHook(() => useResidentDropAdvisor());

      const analysis = result.current.analyzeDrop(
        'missing-resident',
        mockActivity,
        'RESIDENT_NOT_FOUND' as AssignmentFailureReason,
        undefined
      );

      expect(analysis.isValid).toBe(false);
      expect(analysis.analysisScore).toBe(0);
    });
  });
});
