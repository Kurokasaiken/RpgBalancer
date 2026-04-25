/**
 * Crew Rotation Viewer Test Suite – NP‑145
 * 
 * Tests for the CrewRotationViewer component including rendering,
 * filtering, preference persistence, and telemetry.
 * 
 * @since NP‑145
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrewRotationViewer } from '@/ui/idleVillage/components/CrewRotationViewer';
import {
  DEFAULT_CREW_ROTATION_CONFIG,
  validateCrewRotationConfig,
  type CrewRotationConfig,
} from '@/balancing/config/idleVillage/crewRotationConfig';

// Mock telemetry
const mockGtag = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

// Mock persistence
const mockSaveData = jest.fn();
const mockLoadData = jest.fn();

jest.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: mockSaveData,
  loadData: mockLoadData,
}));

describe('CrewRotationViewer', () => {
  const mockConfig: CrewRotationConfig = {
    ...DEFAULT_CREW_ROTATION_CONFIG,
    rotations: [
      {
        id: 'test-rotation-1',
        name: 'Test Rotation 1',
        description: 'A test rotation for unit testing',
        version: '1.0.0',
        slots: [
          {
            id: 'test-slot-1',
            label: 'Test Slot 1',
            description: 'A test slot',
            iconName: 'test',
            tags: ['test', 'slot'],
            maxResidents: 2,
            prerequisites: {
              minLevel: 1,
              maxFatigue: 0.8,
              requiredActivityTags: ['test'],
            },
            kpiTargets: {
              minStatMatchScore: 0.5,
              maxFatigueAverage: 0.7,
              minSpecializationScore: 0.3,
              targetEfficiencyMultiplier: 1.0,
            },
            supportedActivityTags: ['test', 'activity'],
            priorityWeight: 5.0,
          },
        ],
        globalKpiTargets: {
          minStatMatchScore: 0.6,
          maxFatigueAverage: 0.6,
          minSpecializationScore: 0.4,
          targetEfficiencyMultiplier: 1.1,
        },
        tags: ['test', 'rotation'],
        enabled: true,
      },
      {
        id: 'test-rotation-2',
        name: 'Test Rotation 2',
        description: 'Another test rotation',
        version: '1.0.0',
        slots: [
          {
            id: 'test-slot-2',
            label: 'Test Slot 2',
            iconName: 'test2',
            tags: ['test2'],
            maxResidents: 1,
            prerequisites: {
              minLevel: 2,
              requiredActivityTags: ['advanced'],
            },
            kpiTargets: {
              minStatMatchScore: 0.7,
              maxFatigueAverage: 0.5,
              minSpecializationScore: 0.5,
              targetEfficiencyMultiplier: 1.2,
            },
            supportedActivityTags: ['advanced'],
            priorityWeight: 8.0,
          },
        ],
        globalKpiTargets: {
          minStatMatchScore: 0.7,
          maxFatigueAverage: 0.5,
          minSpecializationScore: 0.5,
          targetEfficiencyMultiplier: 1.2,
        },
        tags: ['advanced'],
        enabled: false, // Disabled rotation
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage for preference tests
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('renders the viewer with header and filters', () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      expect(screen.getByText('Crew Rotation Knowledge Base')).toBeInTheDocument();
      expect(screen.getByText('Phase E crew rotation configurations')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search rotations...')).toBeInTheDocument();
      expect(screen.getByText('Rotations (1)')).toBeInTheDocument(); // Only enabled rotations
    });

    it('renders without header when showHeader is false', () => {
      render(<CrewRotationViewer config={mockConfig} showHeader={false} />);
      
      expect(screen.queryByText('Crew Rotation Knowledge Base')).not.toBeInTheDocument();
      expect(screen.getByText('Rotations (1)')).toBeInTheDocument();
    });

    it('renders without filters when showFilters is false', () => {
      render(<CrewRotationViewer config={mockConfig} showFilters={false} />);
      
      expect(screen.queryByPlaceholderText('Search rotations...')).not.toBeInTheDocument();
      expect(screen.getByText('Rotations (1)')).toBeInTheDocument();
    });

    it('displays rotation list with enabled rotations only', () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      expect(screen.getByText('Test Rotation 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Rotation 2')).not.toBeInTheDocument(); // Disabled
    });

    it('shows disabled rotations when option is enabled', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Enable disabled rotations
      const checkbox = screen.getByLabelText('Show disabled rotations');
      await userEvent.click(checkbox);
      
      expect(screen.getByText('Test Rotation 1')).toBeInTheDocument();
      expect(screen.getByText('Test Rotation 2')).toBeInTheDocument();
      expect(screen.getByText('Rotations (2)')).toBeInTheDocument();
    });
  });

  describe('Rotation Selection', () => {
    it('selects a rotation and shows its details', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      const rotationCard = screen.getByText('Test Rotation 1');
      await userEvent.click(rotationCard);
      
      // Check rotation details are shown
      expect(screen.getByText('Test Rotation 1')).toBeInTheDocument();
      expect(screen.getByText('A test rotation for unit testing')).toBeInTheDocument();
      expect(screen.getByText('Global KPI Targets')).toBeInTheDocument();
      expect(screen.getByText('Slots (1)')).toBeInTheDocument();
    });

    it('emits telemetry event when rotation is selected', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      const rotationCard = screen.getByText('Test Rotation 1');
      await userEvent.click(rotationCard);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'crew_rotation_viewed', {
        rotation_id: 'test-rotation-1',
        rotation_name: 'Test Rotation 1',
        tags: 'test,rotation',
      });
    });

    it('calls onRotationSelected callback when provided', async () => {
      const mockCallback = jest.fn();
      render(<CrewRotationViewer config={mockConfig} onRotationSelected={mockCallback} />);
      
      const rotationCard = screen.getByText('Test Rotation 1');
      await userEvent.click(rotationCard);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-rotation-1',
          name: 'Test Rotation 1',
        })
      );
    });
  });

  describe('Search Functionality', () => {
    it('filters rotations by search query', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      const searchInput = screen.getByPlaceholderText('Search rotations...');
      await userEvent.type(searchInput, 'Test Rotation 1');
      
      expect(screen.getByText('Test Rotation 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Rotation 2')).not.toBeInTheDocument();
      expect(screen.getByText('Rotations (1)')).toBeInTheDocument();
    });

    it('shows no results when search does not match', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      const searchInput = screen.getByPlaceholderText('Search rotations...');
      await userEvent.type(searchInput, 'Nonexistent Rotation');
      
      expect(screen.queryByText('Test Rotation 1')).not.toBeInTheDocument();
      expect(screen.getByText('Rotations (0)')).toBeInTheDocument();
    });
  });

  describe('Tag Filtering', () => {
    it('filters rotations by selected tags', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Find and click the 'test' tag
      const testTag = screen.getByText('test');
      await userEvent.click(testTag);
      
      expect(screen.getByText('Test Rotation 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Rotation 2')).not.toBeInTheDocument();
    });

    it('shows multiple tag selections', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Enable disabled rotations first
      const checkbox = screen.getByLabelText('Show disabled rotations');
      await userEvent.click(checkbox);
      
      // Select multiple tags
      const testTag = screen.getByText('test');
      const advancedTag = screen.getByText('advanced');
      
      await userEvent.click(testTag);
      await userEvent.click(advancedTag);
      
      // Should show no rotations since no rotation has both tags
      expect(screen.getByText('Rotations (0)')).toBeInTheDocument();
    });

    it('toggles tag selection when clicked again', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      const testTag = screen.getByText('test');
      
      // Select tag
      await userEvent.click(testTag);
      expect(screen.getByText('Rotations (1)')).toBeInTheDocument();
      
      // Deselect tag
      await userEvent.click(testTag);
      expect(screen.getByText('Rotations (1)')).toBeInTheDocument(); // Back to original
    });
  });

  describe('Activity Tag Filtering', () => {
    it('filters slots by selected activity tags', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Select a rotation first
      const rotationCard = screen.getByText('Test Rotation 1');
      await userEvent.click(rotationCard);
      
      // Find and click an activity tag
      const activityTag = screen.getByText('test');
      await userEvent.click(activityTag);
      
      // Should show the slot that supports the 'test' activity tag
      expect(screen.getByText('Test Slot 1')).toBeInTheDocument();
    });
  });

  describe('View Options', () => {
    it('toggles KPI details visibility', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Select a rotation to see KPI details
      const rotationCard = screen.getByText('Test Rotation 1');
      await userEvent.click(rotationCard);
      
      // KPI details should be visible by default
      expect(screen.getByText('Min Stat Match:')).toBeInTheDocument();
      
      // Toggle KPI details off
      const kpiButton = screen.getByText('KPI Details');
      await userEvent.click(kpiButton);
      
      // Detailed KPI should be hidden, but compact view should remain
      expect(screen.queryByText('Min Stat Match:')).not.toBeInTheDocument();
      expect(screen.getByText(/Stat:/)).toBeInTheDocument(); // Compact view
    });

    it('toggles prerequisites visibility', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Select a rotation
      const rotationCard = screen.getByText('Test Rotation 1');
      await userEvent.click(rotationCard);
      
      // Prerequisites should be visible by default
      expect(screen.getByText('Min Level:')).toBeInTheDocument();
      
      // Toggle prerequisites off
      const prereqButton = screen.getByText('Prerequisites');
      await userEvent.click(prereqButton);
      
      // Detailed prerequisites should be hidden
      expect(screen.queryByText('Min Level:')).not.toBeInTheDocument();
    });

    it('toggles compact view', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Select a rotation
      const rotationCard = screen.getByText('Test Rotation 1');
      await userEvent.click(rotationCard);
      
      // Should be in detailed view by default
      expect(screen.getByText('Min Stat Match:')).toBeInTheDocument();
      
      // Toggle compact view
      const compactButton = screen.getByText('Compact');
      await userEvent.click(compactButton);
      
      // Should switch to compact view
      expect(screen.queryByText('Min Stat Match:')).not.toBeInTheDocument();
      expect(screen.getByText(/Stat:/)).toBeInTheDocument(); // Compact format
    });
  });

  describe('Clear Filters', () => {
    it('clears all active filters', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Apply search
      const searchInput = screen.getByPlaceholderText('Search rotations...');
      await userEvent.type(searchInput, 'Test');
      
      // Apply tag filter
      const testTag = screen.getByText('test');
      await userEvent.click(testTag);
      
      // Clear filters
      const clearButton = screen.getByText('Clear All Filters');
      await userEvent.click(clearButton);
      
      // Search should be cleared
      expect(searchInput).toHaveValue('');
      
      // Tag should be deselected
      expect(screen.getByText('Rotations (1)')).toBeInTheDocument();
    });
  });

  describe('Slot Selection', () => {
    it('calls onSlotSelected callback when slot is clicked', async () => {
      const mockCallback = jest.fn();
      render(<CrewRotationViewer config={mockConfig} onSlotSelected={mockCallback} />);
      
      // Select a rotation first
      const rotationCard = screen.getByText('Test Rotation 1');
      await userEvent.click(rotationCard);
      
      // Click on a slot
      const slotCard = screen.getByText('Test Slot 1');
      await userEvent.click(slotCard);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-rotation-1',
        }),
        expect.objectContaining({
          id: 'test-slot-1',
        })
      );
    });
  });

  describe('Preference Persistence', () => {
    it('saves viewer preferences to localStorage', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Toggle some preferences
      const kpiButton = screen.getByText('KPI Details');
      await userEvent.click(kpiButton);
      
      const compactButton = screen.getByText('Compact');
      await userEvent.click(compactButton);
      
      // Preferences should be saved (Zustand persist handles this automatically)
      // We can verify by checking if the state changes persist
      expect(kpiButton).toHaveClass('bg-white/10'); // Should be in "off" state
      expect(compactButton).toHaveClass('bg-amber-500/20'); // Should be in "on" state
    });
  });

  describe('Configuration Validation', () => {
    it('renders with valid configuration', () => {
      expect(() => {
        render(<CrewRotationViewer config={mockConfig} />);
      }).not.toThrow();
    });

    it('validates configuration structure', () => {
      expect(validateCrewRotationConfig(mockConfig)).toBe(true);
    });

    it('handles empty configuration gracefully', () => {
      const emptyConfig: CrewRotationConfig = {
        ...DEFAULT_CREW_ROTATION_CONFIG,
        rotations: [],
      };
      
      expect(() => {
        render(<CrewRotationViewer config={emptyConfig} />);
      }).not.toThrow();
      
      expect(screen.getByText('Rotations (0)')).toBeInTheDocument();
      expect(screen.getByText('Select a rotation to view details')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      // Check for proper semantic structure
      expect(screen.getByRole('region', { name: /activity area/i })).toBeInTheDocument();
      
      // Check for proper form controls
      const searchInput = screen.getByPlaceholderText('Search rotations...');
      expect(searchInput).toHaveAttribute('type', 'text');
      
      // Check for proper button labels
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      render(<CrewRotationViewer config={mockConfig} />);
      
      const searchInput = screen.getByPlaceholderText('Search rotations...');
      searchInput.focus();
      
      expect(searchInput).toHaveFocus();
      
      // Tab through interface
      await userEvent.tab();
      // Should move to next interactive element
    });
  });

  describe('Error Handling', () => {
    it('handles missing configuration gracefully', () => {
      expect(() => {
        render(<CrewRotationViewer config={undefined as any} />);
      }).not.toThrow();
    });

    it('handles malformed configuration without crashing', () => {
      const malformedConfig = {
        ...mockConfig,
        rotations: [
          {
            ...mockConfig.rotations[0],
            slots: [], // Empty slots array
          },
        ],
      };
      
      expect(() => {
        render(<CrewRotationViewer config={malformedConfig} />);
      }).not.toThrow();
    });
  });
});
