/**
 * Test suite for TestRosterPage drag & drop behavior
 * Tests the fix for IV-DRAG-FIX: no auto-assignment, only slot-specific assignment
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ResidentSlotAssignResult } from '@/ui/idleVillage/slots/types';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';

// Mock the config
vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: () => ({ config: DEFAULT_IDLE_VILLAGE_CONFIG }),
}));

// Mock character import
vi.mock('@/engine/game/idleVillage/characterImport', () => ({
  loadResidentsFromCharacterManager: () => [],
  getCharacterStorageEventName: () => 'character-storage',
}));

// Mock theme presets
vi.mock('@/data/themePresets', () => ({
  themePresets: [],
  themePresetMap: {},
  DEFAULT_THEME_ID: 'default-theme',
}));

// Mock style lab tokens
vi.mock('@/ui/idleVillage/hooks/useMinimalStyleLabTokens', () => ({
  useMinimalStyleLabTokens: () => ({
    colors: {
      primary: '#000',
      secondary: '#fff',
      accent: '#f00',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
    },
  }),
}));

// Mock theme switcher
vi.mock('@/hooks/useThemeSwitcher', () => ({
  useThemeSwitcher: () => ({
    currentTheme: 'default-theme',
    setTheme: vi.fn(),
  }),
}));

// Mock drag preview to avoid canvas issues
vi.mock('@/ui/idleVillage/hooks/useResidentDragPreview', () => ({
  useResidentDragPreview: () => ({
    renderPreview: vi.fn(),
    clearPreview: vi.fn(),
  }),
}));

describe('IV-DRAG-FIX Integration: useResidentSlotController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject assignment without slotId', () => {
    // Mock the dependencies
    const mockActivities = [
      { id: 'activity1', label: 'Test Activity 1', tags: [], slotTags: [], resolutionEngineId: 'system', durationFormula: '10', metadata: {}, rewards: [] },
    ];
    
    const mockResidents = {
      resident1: {
        id: 'resident1',
        name: 'Test Resident',
        displayName: 'Test Resident',
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        portraitUrl: '',
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      },
    };

    // Create the hook with mocked data
    const { assignResidentToSlot } = useResidentSlotController({
      activities: mockActivities,
      residents: mockResidents,
      assignments: {},
      onWarningsChange: vi.fn(),
      customValidator: vi.fn(),
      scheduler: {
        canAssignResident: vi.fn(() => true),
        startActivity: vi.fn(() => true),
      },
      maxFatigueBeforeExhausted: 100,
    });

    // Test the key fix: assignment without slotId should fail
    const result: ResidentSlotAssignResult = assignResidentToSlot('resident1', undefined);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('VALIDATION_FAILED');
    expect(result.details).toBe('Slot specifico richiesto per le operazioni drag.');
  });

  it('should accept assignment with specific slotId', () => {
    // Mock the dependencies
    const mockActivities = [
      { id: 'activity1', label: 'Test Activity 1', tags: [], slotTags: [], resolutionEngineId: 'system', durationFormula: '10', metadata: {}, rewards: [] },
    ];
    
    const mockResidents = {
      resident1: {
        id: 'resident1',
        name: 'Test Resident',
        displayName: 'Test Resident',
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        portraitUrl: '',
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      },
    };

    // Create the hook with mocked data
    const { assignResidentToSlot } = useResidentSlotController({
      activities: mockActivities,
      residents: mockResidents,
      assignments: {},
      onWarningsChange: vi.fn(),
      customValidator: vi.fn(),
      scheduler: {
        canAssignResident: vi.fn(() => true),
        startActivity: vi.fn(() => true),
      },
      maxFatigueBeforeExhausted: 100,
    });

    // Test assignment with specific slotId should work
    const result: ResidentSlotAssignResult = assignResidentToSlot('resident1', 'activity1-slot-0');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slotId).toBe('activity1-slot-0');
    }
  });
});
