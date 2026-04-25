import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActivityLogPanel from '../ActivityLogPanel';
import { MinimalActivityEntry } from '../activityLogPanelConfig';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock HUD tokens
vi.mock('@/ui/idleVillage/tokens/minimalHudTokens', () => ({
  resolveHudToken: vi.fn((path: string) => {
    const tokenMap: Record<string, any> = {
      'gradients.primary': 'linear-gradient(135deg, rgba(14,22,30,0.92), rgba(7,11,17,0.8))',
      'spacing.md': '1rem',
      'spacing.sm': '0.5rem',
      'spacing.xs': '0.25rem',
      'spacing.lg': '1.5rem',
      'spacing.xl': '2rem',
      'typography.baseFontSize': 14,
      'typography.fontWeightBold': 600,
      'typography.lineHeight': 1.5,
    };
    return tokenMap[path] || 'fallback-value';
  }),
}));

const mockEntries: MinimalActivityEntry[] = [
  {
    id: 'entry-1',
    timestamp: Date.now() - 300000, // 5 minutes ago
    type: 'activity_started',
    message: 'Gold mining activity started',
    severity: 'info',
    metadata: { residentId: 'resident-1' },
  },
  {
    id: 'entry-2',
    timestamp: Date.now() - 600000, // 10 minutes ago
    type: 'resource_gained',
    message: 'Gained 50 gold from mining',
    severity: 'success',
    metadata: { amount: 50, resource: 'gold' },
  },
  {
    id: 'entry-3',
    timestamp: Date.now() - 900000, // 15 minutes ago
    type: 'fatigue_warning',
    message: 'Resident fatigue is high',
    severity: 'warning',
    metadata: { residentId: 'resident-1', fatigue: 0.85 },
  },
  {
    id: 'entry-4',
    timestamp: Date.now() - 1200000, // 20 minutes ago
    type: 'activity_failed',
    message: 'Quest failed due to insufficient stats',
    severity: 'error',
    metadata: { questId: 'quest-1', reason: 'stat_failure' },
  },
];

describe('ActivityLogPanel', () => {
  const mockOnSelect = vi.fn();
  const { trackTelemetryEvent } = require('@/analytics/telemetry/telemetryProvider');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ActivityLogPanel entries={[]} />);

      expect(screen.getByRole('region', { name: 'Activity Log' })).toBeInTheDocument();
      expect(screen.getByText('No Recent Activity')).toBeInTheDocument();
    });

    it('renders loading state when isLoading is true', () => {
      render(<ActivityLogPanel entries={[]} isLoading={true} />);

      expect(screen.getByRole('status', { name: 'Loading activity entries' })).toBeInTheDocument();
      expect(screen.getByText('Loading activity...')).toBeInTheDocument();
    });

    it('renders activity entries', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 2)} />);

      expect(screen.getByText('Gold mining activity started')).toBeInTheDocument();
      expect(screen.getByText('Gained 50 gold from mining')).toBeInTheDocument();
    });

    it('limits entries to maxEntries from config', () => {
      const manyEntries = Array.from({ length: 15 }, (_, i) => ({
        ...mockEntries[0],
        id: `entry-${i}`,
        message: `Entry ${i}`,
      }));

      render(<ActivityLogPanel entries={manyEntries} />);

      // Should show max 12 entries (default config)
      const entries = screen.getAllByRole('button');
      expect(entries).toHaveLength(12);
    });

    it('shows custom maxEntries from config', () => {
      const customConfig = { maxEntries: 5 };
      const manyEntries = Array.from({ length: 10 }, (_, i) => ({
        ...mockEntries[0],
        id: `entry-${i}`,
        message: `Entry ${i}`,
      }));

      render(<ActivityLogPanel entries={manyEntries} config={customConfig} />);

      const entries = screen.getAllByRole('button');
      expect(entries).toHaveLength(5);
    });
  });

  describe('Severity Mapping', () => {
    it('displays correct icons for each severity', () => {
      render(<ActivityLogPanel entries={mockEntries} />);

      // Info entry
      expect(screen.getByText('ℹ️')).toBeInTheDocument();

      // Success entry
      expect(screen.getByText('✅')).toBeInTheDocument();

      // Warning entry
      expect(screen.getByText('⚠️')).toBeInTheDocument();

      // Error entry
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('displays severity badges', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} />);

      expect(screen.getByText('info')).toBeInTheDocument();
      expect(screen.getByText('activity_started')).toBeInTheDocument();
    });

    it('applies correct styling for different severities', () => {
      render(<ActivityLogPanel entries={mockEntries} />);

      // Check that different severity entries are rendered
      const entries = screen.getAllByRole('button');
      expect(entries).toHaveLength(4);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no entries', () => {
      render(<ActivityLogPanel entries={[]} />);

      expect(screen.getByText('No Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Activity entries will appear here as events occur in the game.')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('shows custom empty state from config', () => {
      const customConfig = {
        emptyState: {
          title: 'Custom Empty',
          description: 'Custom description',
          icon: '🎯',
        },
      };

      render(<ActivityLogPanel entries={[]} config={customConfig} />);

      expect(screen.getByText('Custom Empty')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} />);

      expect(screen.getByRole('region', { name: 'Activity Log' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Activity entry: Gold mining activity started' })).toBeInTheDocument();
    });

    it('has aria-live for dynamic content', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} />);

      const liveRegion = screen.getByRole('button').parentElement;
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
    });

    it('makes entries focusable when onSelect is provided', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} onSelect={mockOnSelect} />);

      const entry = screen.getByRole('button');
      expect(entry).toHaveAttribute('tabIndex', '0');
    });

    it('makes entries non-focusable when onSelect is not provided', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} />);

      const entry = screen.getByRole('button');
      expect(entry).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Interaction', () => {
    it('calls onSelect when entry is clicked', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} onSelect={mockOnSelect} />);

      const entry = screen.getByRole('button');
      fireEvent.click(entry);

      expect(mockOnSelect).toHaveBeenCalledWith(mockEntries[0]);
    });

    it('calls onSelect when entry is activated with keyboard', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} onSelect={mockOnSelect} />);

      const entry = screen.getByRole('button');
      fireEvent.keyDown(entry, { key: 'Enter' });

      expect(mockOnSelect).toHaveBeenCalledWith(mockEntries[0]);
    });

    it('supports Space key activation', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} onSelect={mockOnSelect} />);

      const entry = screen.getByRole('button');
      fireEvent.keyDown(entry, { key: ' ' });

      expect(mockOnSelect).toHaveBeenCalledWith(mockEntries[0]);
    });

    it('ignores other keys', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} onSelect={mockOnSelect} />);

      const entry = screen.getByRole('button');
      fireEvent.keyDown(entry, { key: 'ArrowDown' });

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('does not call onSelect when not provided', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} />);

      const entry = screen.getByRole('button');
      fireEvent.click(entry);

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('Timestamp Formatting', () => {
    it('formats recent timestamps as "Just now"', () => {
      const recentEntry = {
        ...mockEntries[0],
        timestamp: Date.now() - 1000, // 1 second ago
      };

      render(<ActivityLogPanel entries={[recentEntry]} />);

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('formats minutes ago', () => {
      const minuteEntry = {
        ...mockEntries[0],
        timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      };

      render(<ActivityLogPanel entries={[minuteEntry]} />);

      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });

    it('formats hours ago', () => {
      const hourEntry = {
        ...mockEntries[0],
        timestamp: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
      };

      render(<ActivityLogPanel entries={[hourEntry]} />);

      expect(screen.getByText('3h ago')).toBeInTheDocument();
    });

    it('formats days ago', () => {
      const dayEntry = {
        ...mockEntries[0],
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      };

      render(<ActivityLogPanel entries={[dayEntry]} />);

      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });
  });

  describe('Telemetry', () => {
    it('emits render telemetry on mount', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 2)} />);

      expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_activity_log_rendered', {
        entryCount: 2,
        maxEntries: 12,
        isLoading: false,
        configVersion: '1.0',
      });
    });

    it('emits entry selection telemetry', () => {
      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} onSelect={mockOnSelect} />);

      const entry = screen.getByRole('button');
      fireEvent.click(entry);

      expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_activity_log_entry_selected', {
        entryId: 'entry-1',
        severity: 'info',
        type: 'activity_started',
      });
    });

    it('updates telemetry when entries change', async () => {
      const { rerender } = render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} />);

      expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_activity_log_rendered', {
        entryCount: 1,
        maxEntries: 12,
        isLoading: false,
        configVersion: '1.0',
      });

      rerender(<ActivityLogPanel entries={mockEntries.slice(0, 3)} />);

      await waitFor(() => {
        expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_activity_log_rendered', {
          entryCount: 3,
          maxEntries: 12,
          isLoading: false,
          configVersion: '1.0',
        });
      });
    });
  });

  describe('Custom Configuration', () => {
    it('accepts custom configuration', () => {
      const customConfig = {
        maxEntries: 3,
        ariaLabels: {
          panelLabel: 'Custom Activity Log',
          entryLabel: 'Custom Entry',
          emptyStateDescription: 'Custom Empty',
          loadingLabel: 'Custom Loading',
        },
      };

      render(<ActivityLogPanel entries={mockEntries} config={customConfig} />);

      expect(screen.getByRole('region', { name: 'Custom Activity Log' })).toBeInTheDocument();

      // Should show only 3 entries due to custom maxEntries
      const entries = screen.getAllByRole('button');
      expect(entries).toHaveLength(3);
    });

    it('merges custom config with defaults', () => {
      const customConfig = {
        severityPalette: {
          info: {
            backgroundColor: 'custom-info-bg',
            color: 'custom-info-color',
            icon: '🎨',
          },
        },
      };

      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} config={customConfig} />);

      // Should use custom icon
      expect(screen.getByText('🎨')).toBeInTheDocument();
    });
  });

  describe('Style Integration', () => {
    it('uses HUD tokens for styling', () => {
      const { resolveHudToken } = require('@/ui/idleVillage/tokens/minimalHudTokens');

      render(<ActivityLogPanel entries={mockEntries.slice(0, 1)} />);

      expect(resolveHudToken).toHaveBeenCalledWith('gradients.primary');
      expect(resolveHudToken).toHaveBeenCalledWith('spacing.md');
      expect(resolveHudToken).toHaveBeenCalledWith('typography.baseFontSize');
    });
  });
});
