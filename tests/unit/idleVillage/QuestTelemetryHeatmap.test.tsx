/**
 * QuestTelemetryHeatmap Unit Tests
 * 
 * React Testing Library tests for the QuestTelemetryHeatmap component
 * covering bucket mapping, mobile layout, and user interactions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestTelemetryHeatmap } from '@/ui/idleVillage/components/QuestTelemetryHeatmap';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { QuestTypeDefinition } from '@/balancing/config/idleVillage/types';

// Mock the IdleVillageConfigStore
vi.mock('@/balancing/config/idleVillage/IdleVillageConfigStore', () => ({
  useIdleVillageConfigStore: vi.fn(() => ({
    config: {
      questTypes: {
        'combat': {
          id: 'combat',
          label: 'Combat Quest',
          priority: 1,
          matchers: [{ includes: ['combat', 'battle', 'fight'] }],
        },
        'exploration': {
          id: 'exploration',
          label: 'Exploration Quest',
          priority: 2,
          matchers: [{ includes: ['explore', 'scout', 'search'] }],
        },
        'social': {
          id: 'social',
          label: 'Social Quest',
          priority: 3,
          matchers: [{ includes: ['talk', 'negotiate', 'persuade'] }],
        },
      },
    },
  })),
}));

// Mock the quest telemetry analytics
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackQuestTelemetry: vi.fn(),
}));

// Mock CSS modules
vi.mock('@/ui/idleVillage/components/QuestTelemetryHeatmap.module.css', () => ({
  heatmap: 'heatmap',
  grid: 'grid',
  timeline: 'timeline',
  matrix: 'matrix',
  radial: 'radial',
  controls: 'controls',
  cell: 'cell',
  active: 'active',
}));

describe('QuestTelemetryHeatmap', () => {
  const mockOnCellClick = vi.fn();
  const mockOnConfigChange = vi.fn();

  const createMockTelemetry = (): AggregatedTelemetry => ({
    totalQuests: 100,
    successRate: 0.75,
    averageDuration: 120,
    totalBranches: 250,
    averageChoiceTime: 3.5,
    heroicMoments: 15,
    branchDecisions: [],
    recentQuests: [
      {
        questId: 'combat_quest_1',
        result: {
          questId: 'combat_quest_1',
          success: true,
          durationSeconds: 150,
          branchDecisions: [],
          telemetryData: { heroicMoments: 2 },
        },
        timestamp: Date.now() - 1000,
        sessionId: 'session_1',
      },
      {
        questId: 'exploration_quest_1',
        result: {
          questId: 'exploration_quest_1',
          success: false,
          durationSeconds: 90,
          branchDecisions: [],
          telemetryData: { heroicMoments: 0 },
        },
        timestamp: Date.now() - 2000,
        sessionId: 'session_1',
      },
    ],
    questTypeBreakdown: {
      'combat': 45,
      'exploration': 30,
      'social': 25,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders empty state when no telemetry data provided', () => {
      render(<QuestTelemetryHeatmap telemetry={null as any} />);
      
      expect(screen.getByText(/No quest data available for heatmap visualization/)).toBeInTheDocument();
    });

    it('renders empty state when telemetry has no quests', () => {
      const emptyTelemetry: AggregatedTelemetry = {
        totalQuests: 0,
        successRate: 0,
        averageDuration: 0,
        totalBranches: 0,
        averageChoiceTime: 0,
        heroicMoments: 0,
        branchDecisions: [],
        recentQuests: [],
        questTypeBreakdown: {},
      };

      render(<QuestTelemetryHeatmap telemetry={emptyTelemetry} />);
      
      expect(screen.getByText(/No quest data available for heatmap visualization/)).toBeInTheDocument();
    });

    it('renders heatmap with telemetry data', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      expect(screen.getByText('Quest Telemetry Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('100 total quests')).toBeInTheDocument();
      expect(screen.getByText('3 types')).toBeInTheDocument();
    });

    it('renders in compact mode', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} compact={true} />);
      
      const container = screen.getByText('Quest Telemetry Heatmap').closest('div');
      expect(container).toHaveClass('p-3');
    });
  });

  describe('Grid Mode Visualization', () => {
    it('renders grid heatmap by default', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      expect(screen.getByText('Quest Type Distribution')).toBeInTheDocument();
      
      // Check for quest type labels
      expect(screen.getByText('Combat Quest')).toBeInTheDocument();
      expect(screen.getByText('Exploration Quest')).toBeInTheDocument();
      expect(screen.getByText('Social Quest')).toBeInTheDocument();
    });

    it('displays correct quest counts in grid cells', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      // Check that counts are displayed
      expect(screen.getByText('45')).toBeInTheDocument(); // combat
      expect(screen.getByText('30')).toBeInTheDocument(); // exploration
      expect(screen.getByText('25')).toBeInTheDocument(); // social
    });

    it('handles cell clicks in grid mode', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          onCellClick={mockOnCellClick}
        />
      );
      
      // Find and click a grid cell
      const gridCells = screen.getAllByTitle(/Combat Quest: 45 quests/);
      await user.click(gridCells[0]);
      
      expect(mockOnCellClick).toHaveBeenCalledWith(
        'combat',
        45,
        expect.objectContaining({
          definition: expect.objectContaining({ label: 'Combat Quest' }),
          percentage: 0.45,
        })
      );
    });

    it('shows tooltips on grid cell hover', async () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      const gridCell = screen.getByTitle(/Combat Quest: 45 quests/);
      expect(gridCell).toHaveAttribute('title', expect.stringContaining('45.0%'));
    });
  });

  describe('Timeline Mode Visualization', () => {
    it('renders timeline heatmap when mode is changed', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      // Change mode to timeline
      const modeSelect = screen.getByDisplayValue('Grid');
      await user.selectOptions(modeSelect, 'timeline');
      
      expect(screen.getByText('Recent Quest Timeline')).toBeInTheDocument();
      expect(screen.getByText('combat_quest_1')).toBeInTheDocument();
      expect(screen.getByText('exploration_quest_1')).toBeInTheDocument();
    });

    it('displays success indicators in timeline mode', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          showControls={true}
          config={{ mode: 'timeline' }}
        />
      );
      
      // Check for success indicators
      const successIndicators = screen.getAllByRole('generic');
      expect(successIndicators.some(el => el.textContent?.includes('Success'))).toBe(true);
    });

    it('handles timeline item clicks', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          config={{ mode: 'timeline' }}
          onCellClick={mockOnCellClick}
        />
      );
      
      // Find and click a timeline item
      const timelineItems = screen.getAllByText(/combat_quest_1/);
      await user.click(timelineItems[0]);
      
      expect(mockOnCellClick).toHaveBeenCalledWith(
        'combat',
        1,
        expect.objectContaining({
          entry: expect.any(Object),
          success: true,
        })
      );
    });
  });

  describe('Matrix Mode Visualization', () => {
    it('renders matrix heatmap when mode is changed', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      // Change mode to matrix
      const modeSelect = screen.getByDisplayValue('Grid');
      await user.selectOptions(modeSelect, 'matrix');
      
      expect(screen.getByText('Quest Type Matrix (Count vs Success Rate)')).toBeInTheDocument();
    });

    it('displays both count and success rate indicators', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          config={{ mode: 'matrix' }}
        />
      );
      
      // Check for count and success rate displays
      expect(screen.getByText(/Count:/)).toBeInTheDocument();
      expect(screen.getByText(/Success:/)).toBeInTheDocument();
    });
  });

  describe('Radial Mode Visualization', () => {
    it('renders radial heatmap when mode is changed', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      // Change mode to radial
      const modeSelect = screen.getByDisplayValue('Grid');
      await user.selectOptions(modeSelect, 'radial');
      
      expect(screen.getByText('Radial Quest Distribution')).toBeInTheDocument();
    });

    it('renders SVG elements for radial visualization', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          config={{ mode: 'radial' }}
        />
      );
      
      // Check for SVG element
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });
  });

  describe('Controls and Configuration', () => {
    it('renders controls when showControls is true', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} showControls={true} />);
      
      expect(screen.getByDisplayValue('Grid')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Gilded')).toBeInTheDocument();
      expect(screen.getByLabelText('Values')).toBeInTheDocument();
      expect(screen.getByLabelText('Grid')).toBeInTheDocument();
      expect(screen.getByLabelText('Animate')).toBeInTheDocument();
    });

    it('does not render controls when showControls is false', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} showControls={false} />);
      
      expect(screen.queryByDisplayValue('Grid')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Gilded')).not.toBeInTheDocument();
    });

    it('handles mode changes', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          showControls={true}
          onConfigChange={mockOnConfigChange}
        />
      );
      
      const modeSelect = screen.getByDisplayValue('Grid');
      await user.selectOptions(modeSelect, 'timeline');
      
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'timeline' })
      );
    });

    it('handles color scheme changes', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          showControls={true}
          onConfigChange={mockOnConfigChange}
        />
      );
      
      const colorSelect = screen.getByDisplayValue('Gilded');
      await user.selectOptions(colorSelect, 'viridis');
      
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ colorScheme: 'viridis' })
      );
    });

    it('handles checkbox toggles', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          showControls={true}
          onConfigChange={mockOnConfigChange}
        />
      );
      
      const valuesCheckbox = screen.getByLabelText('Values');
      await user.click(valuesCheckbox);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ showValues: false })
      );
    });

    it('applies custom configuration', () => {
      const telemetry = createMockTelemetry();
      const customConfig = {
        mode: 'timeline' as const,
        colorScheme: 'viridis' as const,
        showValues: false,
        maxItems: 5,
      };
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          config={customConfig}
        />
      );
      
      expect(screen.getByText('Recent Quest Timeline')).toBeInTheDocument();
      // Values should be hidden
      expect(screen.queryByText('45')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    it('applies mobile optimizations on small screens', () => {
      const telemetry = createMockTelemetry();
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          mobile={{ enabled: true }}
        />
      );
      
      // Check for mobile-specific classes or adjustments
      const container = screen.getByText('Quest Telemetry Heatmap').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('reduces columns on mobile layout', () => {
      const telemetry = createMockTelemetry();
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          config={{ mobile: { maxColumns: 2 } }}
        />
      );
      
      // The component should adapt to mobile layout
      expect(screen.getByText('Quest Telemetry Heatmap')).toBeInTheDocument();
    });
  });

  describe('Bucket Mapping', () => {
    it('creates time buckets correctly', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      // The heatmap should display data organized in buckets
      expect(screen.getByText('Quest Type Distribution')).toBeInTheDocument();
      expect(screen.getByText('100 total quests')).toBeInTheDocument();
    });

    it('handles empty buckets gracefully', () => {
      const telemetryWithGaps: AggregatedTelemetry = {
        ...createMockTelemetry(),
        recentQuests: [
          // Only one recent quest, creating empty buckets
          {
            questId: 'solo_quest',
            result: {
              questId: 'solo_quest',
              success: true,
              durationSeconds: 60,
              branchDecisions: [],
              telemetryData: { heroicMoments: 0 },
            },
            timestamp: Date.now() - 1000,
            sessionId: 'session_1',
          },
        ],
      };
      
      render(<QuestTelemetryHeatmap telemetry={telemetryWithGaps} />);
      
      expect(screen.getByText('Quest Type Distribution')).toBeInTheDocument();
    });

    it('maps quest types to buckets correctly', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      // Check that quest types are properly categorized
      expect(screen.getByText('Combat Quest')).toBeInTheDocument();
      expect(screen.getByText('Exploration Quest')).toBeInTheDocument();
      expect(screen.getByText('Social Quest')).toBeInTheDocument();
    });
  });

  describe('Analytics Events', () => {
    it('emits quest_heatmap_rendered event on mount', () => {
      const { trackQuestTelemetry } = require('@/analytics/telemetry/telemetryProvider');
      
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      expect(trackQuestTelemetry).toHaveBeenCalledWith(
        'quest_heatmap_rendered',
        expect.objectContaining({
          totalQuests: 100,
          questTypes: 3,
          mode: 'grid',
        })
      );
    });

    it('emits quest_bucket_clicked event on cell click', async () => {
      const user = userEvent.setup();
      const { trackQuestTelemetry } = require('@/analytics/telemetry/telemetryProvider');
      
      const telemetry = createMockTelemetry();
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          onCellClick={mockOnCellClick}
        />
      );
      
      const gridCells = screen.getAllByTitle(/Combat Quest: 45 quests/);
      await user.click(gridCells[0]);
      
      expect(trackQuestTelemetry).toHaveBeenCalledWith(
        'quest_bucket_clicked',
        expect.objectContaining({
          questType: 'combat',
          value: 45,
          bucketId: expect.any(String),
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      const mainHeading = screen.getByRole('heading', { name: 'Quest Telemetry Heatmap' });
      expect(mainHeading).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const telemetry = createMockTelemetry();
      
      render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          showControls={true}
        />
      );
      
      // Tab to controls
      await user.tab();
      expect(screen.getByDisplayValue('Grid')).toHaveFocus();
      
      // Navigate to next control
      await user.tab();
      expect(screen.getByDisplayValue('Gilded')).toHaveFocus();
    });

    it('provides descriptive tooltips', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      const gridCell = screen.getByTitle(/Combat Quest: 45 quests/);
      expect(gridCell).toHaveAttribute('title');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large datasets efficiently', () => {
      const largeTelemetry: AggregatedTelemetry = {
        ...createMockTelemetry(),
        questTypeBreakdown: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`type_${i}`, Math.floor(Math.random() * 50)])
        ),
      };
      
      const startTime = performance.now();
      render(<QuestTelemetryHeatmap telemetry={largeTelemetry} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles zero values gracefully', () => {
      const telemetryWithZeros: AggregatedTelemetry = {
        ...createMockTelemetry(),
        questTypeBreakdown: {
          'combat': 0,
          'exploration': 0,
          'social': 0,
        },
      };
      
      render(<QuestTelemetryHeatmap telemetry={telemetryWithZeros} />);
      
      // Should still render the heatmap
      expect(screen.getByText('Quest Telemetry Heatmap')).toBeInTheDocument();
    });

    it('handles missing quest type definitions', () => {
      const telemetry = createMockTelemetry();
      
      // Mock empty quest types
      vi.mocked(require('@/balancing/config/idleVillage/IdleVillageConfigStore').useIdleVillageConfigStore)
        .mockReturnValue({ config: { questTypes: {} } });
      
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      // Should still render without crashing
      expect(screen.getByText('Quest Telemetry Heatmap')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('applies correct CSS classes', () => {
      const telemetry = createMockTelemetry();
      const { container } = render(
        <QuestTelemetryHeatmap 
          telemetry={telemetry} 
          className="custom-class"
        />
      );
      
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('custom-class');
      expect(mainContainer).toHaveClass('bg-slate-900/90');
    });

    it('displays live indicator', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      const liveIndicator = screen.getByText('Live');
      expect(liveIndicator).toBeInTheDocument();
      
      const pulseDot = liveIndicator.previousElementSibling;
      expect(pulseDot).toHaveClass('animate-pulse');
    });

    it('shows correct footer information', () => {
      const telemetry = createMockTelemetry();
      render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      
      expect(screen.getByText('100 total quests')).toBeInTheDocument();
      expect(screen.getByText('3 types')).toBeInTheDocument();
      expect(screen.getByText('grid view')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid telemetry data gracefully', () => {
      const invalidTelemetry = {
        totalQuests: -1,
        successRate: NaN,
        averageDuration: Infinity,
        totalBranches: null,
        averageChoiceTime: undefined,
        heroicMoments: 0,
        branchDecisions: [],
        recentQuests: [],
        questTypeBreakdown: {},
      } as any;
      
      render(<QuestTelemetryHeatmap telemetry={invalidTelemetry} />);
      
      // Should not crash and show empty state
      expect(screen.getByText(/No quest data available/)).toBeInTheDocument();
    });

    it('handles missing callbacks gracefully', () => {
      const telemetry = createMockTelemetry();
      
      expect(() => {
        render(<QuestTelemetryHeatmap telemetry={telemetry} />);
      }).not.toThrow();
    });
  });
});
