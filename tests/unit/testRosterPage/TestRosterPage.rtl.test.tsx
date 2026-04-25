import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import TestRosterPage from '@/ui/idleVillage/TestRosterPage';

// Mock complex dependencies to isolate layout rendering
vi.mock('@/engine/game/idleVillage/characterImport', () => ({
  loadResidentsFromCharacterManager: () => [],
}));

vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: () => ({
    config: DEFAULT_IDLE_VILLAGE_CONFIG,
    isInitializing: false,
  }),
}));

vi.mock('@/ui/idleVillage/hooks/useMinimalStyleLabTokens', () => ({
  useMinimalStyleLabTokens: () => ({ cssVars: {} }),
}));

vi.mock('@/ui/idleVillage/hooks/useActiveHUDState', () => {
  const mockState = {
    activities: [],
    counts: {
      jobs: 0,
      quests: 0,
      maintenance: 0,
      total: 0,
    },
    hasActiveActivities: false,
    persistence: {
      preferences: {
        collapsed: false,
        maxVisible: 10,
        sortBy: 'remaining-time' as const,
        showTypeBadges: true,
        compactMode: false,
      },
      uiState: {
        selectedTypeFilter: 'all' as const,
        telemetryPanelOpen: false,
        position: 'top' as const,
      },
      metadata: {
        lastSaved: 0,
        version: 'test',
      },
    },
    updatePreferences: vi.fn(),
    updateUIState: vi.fn(),
    resetPreferences: vi.fn(),
    saveState: vi.fn(),
  };

  return {
    useActiveHUDState: () => mockState,
  };
});

describe('TestRosterPage', () => {
  it('renders without crashing', async () => {
    render(<TestRosterPage />);
    
    // Check for main container
    const page = await screen.findByTestId('test-roster-page');
    expect(page).toBeInTheDocument();
  });
});
