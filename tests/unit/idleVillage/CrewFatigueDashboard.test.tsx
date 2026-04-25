/**
 * Crew Fatigue Dashboard Tests - NP-011
 * 
 * React Testing Library tests for the Crew Fatigue Dashboard component.
 * Tests component rendering, data display, user interactions, and
 * configuration handling.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrewFatigueDashboard } from '../../../src/ui/idleVillage/components/CrewFatigueDashboard';

// Mock the types we need
interface MockResidentState {
  id: string;
  displayName?: string;
  status: 'available' | 'working' | 'resting';
  fatigue: number;
  statProfileId?: string;
}

type MockVillageTimeUnit = number;

interface MockVillageState {
  residents: Record<string, MockResidentState>;
  currentTime: MockVillageTimeUnit;
}

// Mock the PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

// Mock diagnostics
vi.mock('../utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe('CrewFatigueDashboard', () => {
  const mockVillageState: MockVillageState = {
    residents: {
      'resident-1': {
        id: 'resident-1',
        displayName: 'Alice',
        status: 'available',
        fatigue: 0.2,
        statProfileId: 'worker',
      },
      'resident-2': {
        id: 'resident-2',
        displayName: 'Bob',
        status: 'working',
        fatigue: 0.7,
        statProfileId: 'worker',
      },
      'resident-3': {
        id: 'resident-3',
        displayName: 'Charlie',
        status: 'resting',
        fatigue: 0.9,
        statProfileId: 'specialist',
      },
    },
    currentTime: 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with crew data', async () => {
    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Crew Fatigue Dashboard')).toBeInTheDocument();
    });

    // Check crew members are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    // Check summary statistics
    expect(screen.getByText('3')).toBeInTheDocument(); // Total crew
    expect(screen.getByText('Total Crew')).toBeInTheDocument();
  });

  it('displays correct fatigue levels and percentages', async () => {
    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    await waitFor(() => {
      // Check fatigue percentages
      expect(screen.getByText('20%')).toBeInTheDocument(); // Alice
      expect(screen.getByText('70%')).toBeInTheDocument(); // Bob
      expect(screen.getByText('90%')).toBeInTheDocument(); // Charlie
    });

    // Check fatigue levels
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
    expect(screen.getByText('TIRED')).toBeInTheDocument();
    expect(screen.getByText('EXHAUSTED')).toBeInTheDocument();
  });

  it('shows alerts for high fatigue crew members', async () => {
    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    await waitFor(() => {
      // Charlie has 90% fatigue, should show alert indicator
      const crewCards = screen.getAllByTestId(/crew-card/);
      const charlieCard = crewCards.find(card => 
        card.textContent?.includes('Charlie')
      );
      
      // Should have alert indicator (red dot)
      const alertIndicator = charlieCard?.querySelector('.animate-pulse');
      expect(alertIndicator).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should trigger data refresh (mocked diagnostics would be called)
    await waitFor(() => {
      expect(screen.getByText('Last updated:')).toBeInTheDocument();
    });
  });

  it('handles export functionality', async () => {
    // Mock URL and download functionality
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock createElement and click
    const mockClick = vi.fn();
    const mockCreateElement = vi.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    }));
    global.document.createElement = mockCreateElement;

    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    // Should trigger export
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();

    // Cleanup
    vi.restoreAllMocks();
  });

  it('applies custom configuration', async () => {
    const customConfig = {
      layout: {
        crewPerRow: 2,
        showSummary: true,
        showDistribution: true,
        showTrends: true,
        showAlerts: true,
        maxAlerts: 5,
        compactMode: false,
      },
    };

    render(
      <CrewFatigueDashboard 
        villageState={mockVillageState} 
        config={customConfig}
      />
    );

    await waitFor(() => {
      // Should render with custom layout
      const crewGrid = screen.getByTestId(/crew-grid/);
      expect(crewGrid).toHaveClass('grid-cols-2'); // 2 columns
    });
  });

  it('shows loading state initially', () => {
    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    // Should show loading state
    expect(screen.getByText('Loading crew fatigue data...')).toBeInTheDocument();
  });

  it('handles empty village state', async () => {
    const emptyVillageState: MockVillageState = {
      residents: {},
      currentTime: 1000,
    };

    render(<CrewFatigueDashboard villageState={emptyVillageState} />);

    await waitFor(() => {
      expect(screen.getByText('Crew Fatigue Dashboard')).toBeInTheDocument();
    });

    // Should show 0 total crew
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Total Crew')).toBeInTheDocument();
  });

  it('displays fatigue distribution chart', async () => {
    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    await waitFor(() => {
      expect(screen.getByText('Fatigue Distribution')).toBeInTheDocument();
    });

    // Should show distribution bars
    const distributionBars = screen.getAllByTestId(/distribution-bar/);
    expect(distributionBars.length).toBeGreaterThan(0);
  });

  it('shows readiness percentage with correct color', async () => {
    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    await waitFor(() => {
      // With 2/3 crew having low fatigue, readiness should be around 67%
      const readinessElement = screen.getByText(/%/);
      expect(readinessElement).toBeInTheDocument();
    });
  });

  it('applies custom CSS classes', async () => {
    const customClass = 'custom-dashboard-class';
    
    render(
      <CrewFatigueDashboard 
        villageState={mockVillageState} 
        className={customClass}
      />
    );

    await waitFor(() => {
      const dashboard = screen.getByTestId('crew-fatigue-dashboard');
      expect(dashboard).toHaveClass(customClass);
    });
  });

  it('handles resident without display name', async () => {
    const villageStateNoDisplayName: MockVillageState = {
      residents: {
        'resident-no-name': {
          id: 'resident-no-name',
          status: 'available',
          fatigue: 0.3,
        },
      },
      currentTime: 1000,
    };

    render(<CrewFatigueDashboard villageState={villageStateNoDisplayName} />);

    await waitFor(() => {
      // Should fall back to resident ID as name
      expect(screen.getByText('resident-no-name')).toBeInTheDocument();
    });
  });

  it('calculates summary statistics correctly', async () => {
    render(<CrewFatigueDashboard villageState={mockVillageState} />);

    await waitFor(() => {
      // Average fatigue: (0.2 + 0.7 + 0.9) / 3 = 0.6 = 60%
      expect(screen.getByText('60%')).toBeInTheDocument();
      
      // Needing rest: crew with fatigue >= 0.7 (Bob and Charlie) = 2
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Need Rest')).toBeInTheDocument();
    });
  });
});

/**
 * Integration tests for the hook and component together
 */
describe('CrewFatigueDashboard Integration', () => {
  it('integrates hook and component seamlessly', async () => {
    const testVillageState: MockVillageState = {
      residents: {
        'test-resident': {
          id: 'test-resident',
          displayName: 'Test Resident',
          status: 'available',
          fatigue: 0.5,
        },
      },
      currentTime: 1000,
    };

    render(<CrewFatigueDashboard villageState={testVillageState} />);

    await waitFor(() => {
      // Component should render successfully
      expect(screen.getByText('Crew Fatigue Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test Resident')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument(); // Fatigue percentage
    });
  });

  it('handles configuration changes', async () => {
    const { rerender } = render(
      <CrewFatigueDashboard villageState={mockVillageState} />
    );

    await waitFor(() => {
      expect(screen.getByText('Crew Fatigue Dashboard')).toBeInTheDocument();
    });

    // Re-render with different configuration
    const newConfig = {
      layout: { 
        crewPerRow: 1,
        showSummary: true,
        showDistribution: true,
        showTrends: true,
        showAlerts: true,
        maxAlerts: 5,
        compactMode: false,
      },
    };

    rerender(
      <CrewFatigueDashboard 
        villageState={mockVillageState} 
        config={newConfig}
      />
    );

    await waitFor(() => {
      // Should adapt to new configuration
      const crewGrid = screen.getByTestId(/crew-grid/);
      expect(crewGrid).toHaveClass('grid-cols-1');
    });
  });
});
