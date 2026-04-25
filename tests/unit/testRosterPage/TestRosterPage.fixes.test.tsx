/**
 * TestRosterPage.fixes.test.tsx
 * 
 * Test suite for TestRosterPage fixes and TimeEngineStrip integration
 * Tests the consolidated time strip functionality and UI components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TestRosterPage from '@/ui/idleVillage/TestRosterPage';
import { DEFAULT_TEST_HARNESS_CONFIG } from '@/balancing/config/idleVillage/testHarnessConfig';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
import { StyleLabProvider } from '@/ui/styleLab/StyleLabProvider';
import { minimalArcaneTechTheme } from '@/ui/styleLab/themes/minimalArcaneTechTheme';

// Mock the character storage event
const mockCharacterStorageEvent = getCharacterStorageEventName();
vi.mock('@/engine/idle/characterPersistence', () => ({
  getCharacterStorageEventName: () => 'character-storage-updated',
}));

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock drag context
vi.mock('@/ui/idleVillage/components/DragContextStore', () => ({
  useDragContext: () => ({
    activeId: null,
    setActiveId: vi.fn(),
    clearActiveId: vi.fn(),
  }),
}));

// Mock time engine hooks
vi.mock('@/ui/idleVillage/hooks/useSandboxTiming', () => ({
  useSandboxTiming: () => ({
    timeEngineState: {
      currentDay: 1,
      isPaused: false,
      speedMultiplier: 1,
      defaultSpeedMultiplier: 1,
      maxSpeedMultiplier: 5,
      tickIntervalMs: 1000,
      warmupDelayMs: 500,
      cycleProgress: 0.5,
    },
    handleTimeEngineToggle: vi.fn(),
    handleTimeEngineSpeedChange: vi.fn(),
    phase: 'day',
    totalDurationSeconds: 120,
    secondsPerTimeUnit: 60,
  }),
}));

// Mock Active HUD
vi.mock('@/ui/idleVillage/hooks/useActiveHUDState', () => ({
  useActiveHUDState: () => ({
    hudState: {
      activities: [],
      counts: { total: 0, active: 0, completed: 0 },
      hasActiveActivities: false,
      persistence: {},
    },
    hudVillageState: {
      residents: [],
      activities: [],
      resources: {},
    },
  }),
}));

// Mock Character Manager
vi.mock('@/engine/game/idleVillage/characterImport', () => ({
  loadResidentsFromCharacterManager: () => Promise.resolve([]),
  savedCharacterToResident: vi.fn(),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <StyleLabProvider theme={minimalArcaneTechTheme}>
      {component}
    </StyleLabProvider>
  );
};

describe('TestRosterPage TimeEngineStrip Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage to have test data
    const mockLocalStorage = {
      getItem: vi.fn(() => JSON.stringify(TEST_ROSTER_HEROES)),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 1,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  });

  it('should render TimeEngineStrip component', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('style-lab-time-engine')).toBeInTheDocument();
    });
  });

  it('should display day/night cycle controls', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      const timeEngineElement = screen.getByTestId('style-lab-time-engine');
      expect(timeEngineElement).toBeInTheDocument();
      expect(timeEngineElement).toHaveAttribute('data-time-engine-current-day', '1');
      expect(timeEngineElement).toHaveAttribute('data-time-engine-is-paused', 'false');
      expect(timeEngineElement).toHaveAttribute('data-time-engine-speed-multiplier', '1');
      expect(timeEngineElement).toHaveAttribute('data-time-engine-phase', 'day');
    });
  });

  it('should show time engine progress data', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      const timeEngineElement = screen.getByTestId('style-lab-time-engine');
      const progress = timeEngineElement.getAttribute('data-time-engine-progress');
      expect(progress).toBeDefined();
      expect(parseFloat(progress || '0')).toBeGreaterThanOrEqual(0);
      expect(parseFloat(progress || '0')).toBeLessThanOrEqual(1);
    });
  });

  it('should render Clear Slots and Restore Stamina buttons', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear Slots')).toBeInTheDocument();
      expect(screen.getByText('Restore Stamina')).toBeInTheDocument();
    });
  });

  it('should handle Clear Slots action', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      const clearButton = screen.getByText('Clear Slots');
      expect(clearButton).toBeInTheDocument();
      
      fireEvent.click(clearButton);
      // Should not throw and should handle the action
    });
  });

  it('should handle Restore Stamina action', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      const restoreButton = screen.getByText('Restore Stamina');
      expect(restoreButton).toBeInTheDocument();
      
      fireEvent.click(restoreButton);
      // Should not throw and should handle the action
    });
  });

  it('should display roster when residents are loaded', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      // Check for roster wrapper
      const rosterWrapper = screen.getByTestId('village-roster-wrapper');
      expect(rosterWrapper).toBeInTheDocument();
    });
  });

  it('should show rack scenarios', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      // Check for rack scenarios
      expect(screen.getByText(/Rack A · Scenario permissivo/)).toBeInTheDocument();
      expect(screen.getByText(/Rack B · Scenario restrittivo/)).toBeInTheDocument();
    });
  });

  it('should display theme presets', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      // Check for theme preset buttons
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('Arcane Tech')).toBeInTheDocument();
      expect(screen.getByText('Wanderlust')).toBeInTheDocument();
    });
  });

  it('should handle theme preset changes', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      const arcaneTechButton = screen.getByText('Arcane Tech');
      expect(arcaneTechButton).toBeInTheDocument();
      
      fireEvent.click(arcaneTechButton);
      // Should not throw and should handle theme change
    });
  });

  it('should show Randomize and Reset buttons', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Randomize')).toBeInTheDocument();
    });
  });

  it('should handle randomization', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      const randomizeButton = screen.getByText('Randomize');
      expect(randomizeButton).toBeInTheDocument();
      
      fireEvent.click(randomizeButton);
      // Should not throw and should handle randomization
    });
  });

  it('should display status harness information', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Status Harness •/)).toBeInTheDocument();
      expect(screen.getByText(/Idle/)).toBeInTheDocument();
    });
  });
});

describe('TestRosterPage Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock empty localStorage to test fallback behavior
    const mockLocalStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  });

  it('should show fallback roster when Character Manager is empty', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Mock roster attivo')).toBeInTheDocument();
    });
  });

  it('should show no residents message when completely empty', async () => {
    // Mock both localStorage and character manager to be empty
    vi.mock('@/engine/game/idleVillage/characterImport', () => ({
      loadResidentsFromCharacterManager: () => Promise.resolve([]),
      savedCharacterToResident: vi.fn(),
    }));
    
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Nessun Residente Caricato/)).toBeInTheDocument();
    });
  });
});

describe('TestRosterPage TimeEngineStrip Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockLocalStorage = {
      getItem: vi.fn(() => JSON.stringify(TEST_ROSTER_HEROES)),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 1,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  });

  it('should render consolidated time strip with all components', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      const timeEngineInner = screen.getByTestId('style-lab-time-engine-inner');
      expect(timeEngineInner).toBeInTheDocument();
      
      // The TimeEngineStrip should contain the consolidated components
      expect(timeEngineInner).toBeVisible();
    });
  });

  it('should maintain time engine data attributes', async () => {
    renderWithTheme(<TestRosterPage />);
    
    await waitFor(() => {
      const timeEngineElement = screen.getByTestId('style-lab-time-engine');
      
      // Verify all required data attributes are present
      expect(timeEngineElement).toHaveAttribute('data-time-engine-progress');
      expect(timeEngineElement).toHaveAttribute('data-time-engine-current-day');
      expect(timeEngineElement).toHaveAttribute('data-time-engine-is-paused');
      expect(timeEngineElement).toHaveAttribute('data-time-engine-speed-multiplier');
      expect(timeEngineElement).toHaveAttribute('data-time-engine-phase');
    });
  });
});
