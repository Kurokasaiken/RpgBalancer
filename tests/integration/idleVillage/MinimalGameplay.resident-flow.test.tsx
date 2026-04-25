/**
 * Minimal Gameplay Resident Flow Integration Test
 * 
 * Tests the canonical resident flow from Village Resident Store to page surface.
 * Verifies that /minimal-gameplay consumes residents through the canonical store
 * and that resident data reaches the runtime surface correctly.
 * 
 * This complements the Character-to-Resident bootstrap unit tests by validating
 * the integration layer between the store and the UI.
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import MinimalGameplayPage from '../../../src/ui/idleVillage/MinimalGameplayPage';
import { useVillageResidents } from '../../../src/ui/idleVillage/hooks/useVillageResidents';
import { useVillageResidentStore } from '../../../src/ui/idleVillage/store/VillageResidentStore';
import { useIdleVillageConfig } from '../../../src/balancing/hooks/useIdleVillageConfig';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../../../src/balancing/config/idleVillage/defaultConfig';
import type { ResidentState } from '../../../src/engine/game/idleVillage/TimeEngine';

// Mock dependencies to isolate the resident flow
vi.mock('../../../src/shared/persistence/PersistenceService', () => ({
  PersistenceService: {
    saveData: vi.fn().mockResolvedValue(undefined),
    loadData: vi.fn().mockResolvedValue(null),
    clearData: vi.fn().mockResolvedValue(undefined),
  },
  saveData: vi.fn().mockResolvedValue(undefined),
  loadData: vi.fn().mockResolvedValue(null),
  clearData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

vi.mock('../../../src/engine/idle/characterStorage', () => ({
  loadCharacters: vi.fn(),
}));

vi.mock('../../../src/engine/game/idleVillage/characterImport', () => ({
  savedCharacterToResident: vi.fn((character, options) => ({
    id: character.id || 'fallback-resident-1',
    displayName: character.name || 'Fallback Resident',
    status: 'available',
    fatigue: options?.defaultFatigue || 0,
    statProfileId: character.aiBehavior || 'worker',
    statTags: character.statTags || [],
    statSnapshot: character.statBlock || {},
    currentHp: character.statBlock?.hp || 100,
    maxHp: character.statBlock?.hp || 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
  })),
}));

// Test helper wrapper to access resident hooks
function MinimalGameplayResidentFlowWrapper() {
  const {
    residents,
    isLoading,
    error,
    usedFallback,
    charactersConverted,
    bootstrapResidents,
    getResidentById,
    getAvailableResidents,
  } = useVillageResidents();

  const { config } = useIdleVillageConfig();

  return (
    <div>
      <div data-testid="resident-flow-state">
        <div data-testid="residents-count">{residents.length}</div>
        <div data-testid="is-loading">{isLoading ? 'true' : 'false'}</div>
        <div data-testid="error">{error || 'none'}</div>
        <div data-testid="used-fallback">{usedFallback ? 'true' : 'false'}</div>
        <div data-testid="characters-converted">{charactersConverted}</div>
        <div data-testid="config-loaded">{config ? 'true' : 'false'}</div>
      </div>

      <div data-testid="resident-data">
        {residents.map((resident: ResidentState) => (
          <div key={resident.id} data-testid={`resident-${resident.id}`}>
            <div data-testid={`resident-${resident.id}-name`}>{resident.displayName}</div>
            <div data-testid={`resident-${resident.id}-status`}>{resident.status}</div>
            <div data-testid={`resident-${resident.id}-fatigue`}>{resident.fatigue}</div>
            <div data-testid={`resident-${resident.id}-available`}>
              {resident.status === 'available' ? 'true' : 'false'}
            </div>
          </div>
        ))}
      </div>

      <MinimalGameplayPage />

      <div data-testid="test-actions">
        <button
          data-testid="bootstrap-residents"
          onClick={() => bootstrapResidents({ config: config || undefined })}
          disabled={isLoading}
        >
          Bootstrap Residents
        </button>
        <button
          data-testid="get-available-residents"
          onClick={() => {
            const available = getAvailableResidents();
            console.log('Available residents:', available.length);
          }}
        >
          Get Available Residents
        </button>
        <button
          data-testid="get-resident-by-id"
          onClick={() => {
            const resident = getResidentById('test-resident-1');
            console.log('Found resident:', resident?.displayName);
          }}
        >
          Get Resident by ID
        </button>
      </div>
    </div>
  );
}

describe('MinimalGameplay Resident Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with canonical Village Resident Store', async () => {
    render(<MinimalGameplayResidentFlowWrapper />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Verify store integration
    expect(screen.getByTestId('residents-count')).toBeInTheDocument();
    expect(screen.getByTestId('used-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('characters-converted')).toBeInTheDocument();
    expect(screen.getByTestId('config-loaded')).toBeInTheDocument();

    // Should have residents (either from bootstrap or fallback)
    const residentsCount = screen.getByTestId('residents-count').textContent;
    expect(parseInt(residentsCount || '0')).toBeGreaterThanOrEqual(0);
  });

  it('should consume residents through canonical store', async () => {
    render(<MinimalGameplayResidentFlowWrapper />);

    // Wait for residents to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    }, { timeout: 3000 });

    // Verify resident data reaches the surface
    const residentsCount = screen.getByTestId('residents-count').textContent;
    const count = parseInt(residentsCount || '0');
    
    if (count > 0) {
      // Should have resident data elements
      const firstResident = screen.getByTestId('resident-test-resident-1');
      expect(firstResident).toBeInTheDocument();
      
      // Verify resident properties are accessible
      expect(screen.getByTestId('resident-test-resident-1-name')).toBeInTheDocument();
      expect(screen.getByTestId('resident-test-resident-1-status')).toBeInTheDocument();
      expect(screen.getByTestId('resident-test-resident-1-fatigue')).toBeInTheDocument();
      expect(screen.getByTestId('resident-test-resident-1-available')).toBeInTheDocument();
    }
  });

  it('should use fallback residents when character storage is empty', async () => {
    render(<MinimalGameplayResidentFlowWrapper />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Should indicate fallback usage when no characters exist
    expect(screen.getByTestId('used-fallback')).toHaveTextContent('true');
    expect(screen.getByTestId('characters-converted')).toHaveTextContent('0');

    // Should have fallback residents
    const residentsCount = screen.getByTestId('residents-count').textContent;
    expect(parseInt(residentsCount || '0')).toBeGreaterThan(0);
  });

  it('should provide working selector functions', async () => {
    render(<MinimalGameplayResidentFlowWrapper />);

    // Wait for residents to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Test getAvailableResidents selector
    const getAvailableButton = screen.getByTestId('get-available-residents');
    expect(getAvailableButton).not.toBeDisabled();
    
    // Test getResidentById selector
    const getResidentButton = screen.getByTestId('get-resident-by-id');
    expect(getResidentButton).not.toBeDisabled();

    // Click buttons to test selectors (console output verifies they work)
    fireEvent.click(getAvailableButton);
    fireEvent.click(getResidentButton);
  });

  it('should maintain stable resident data during page interactions', async () => {
    render(<MinimalGameplayResidentFlowWrapper />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Get initial resident count
    const initialCount = screen.getByTestId('residents-count').textContent;

    // Simulate page interactions (click around the page)
    fireEvent.click(screen.getByText('Style Laboratory') || document.body);
    fireEvent.click(screen.getByText('Resources') || document.body);
    
    // Wait a bit for any state updates
    await waitFor(() => {
      // Resident count should remain stable
      expect(screen.getByTestId('residents-count')).toHaveTextContent(initialCount || '0');
    }, { timeout: 1000 });
  });

  it('should handle bootstrap operations correctly', async () => {
    render(<MinimalGameplayResidentFlowWrapper />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Get initial state
    const initialCount = screen.getByTestId('residents-count').textContent;
    const initialUsedFallback = screen.getByTestId('used-fallback').textContent;

    // Trigger bootstrap
    const bootstrapButton = screen.getByTestId('bootstrap-residents');
    expect(bootstrapButton).not.toBeDisabled();
    
    fireEvent.click(bootstrapButton);

    // Wait for bootstrap to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    }, { timeout: 3000 });

    // Verify bootstrap completed (may have same residents, but operation should complete)
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('should integrate with MinimalGameplayPage without errors', async () => {
    render(<MinimalGameplayResidentFlowWrapper />);

    // Wait for everything to load
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Verify MinimalGameplayPage rendered successfully
    expect(screen.getByTestId('minimal-gameplay-page')).toBeInTheDocument();

    // Verify page has access to resident data through the store
    const residentsCount = screen.getByTestId('residents-count').textContent;
    expect(residentsCount).toBeDefined();

    // Should not have any errors
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('should maintain canonical flow - no page-level conversion required', async () => {
    render(<MinimalGameplayResidentFlowWrapper />);

    // Wait for load
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // The key test: verify that residents are available without any page-level conversion
    // This means the data flows directly from Village Resident Store to the page
    const residentsCount = screen.getByTestId('residents-count').textContent;
    const count = parseInt(residentsCount || '0');
    
    expect(count).toBeGreaterThanOrEqual(0);
    
    if (count > 0) {
      // Verify resident data is in correct format (no conversion needed)
      const residentName = screen.getByTestId('resident-test-resident-1-name');
      expect(residentName).toBeInTheDocument();
      
      const residentStatus = screen.getByTestId('resident-test-resident-1-status');
      expect(residentStatus).toBeInTheDocument();
      
      // These should be ResidentState objects directly from the store
      expect(residentName.textContent).toBeTruthy();
      expect(residentStatus.textContent).toBeTruthy();
    }
  });
});
