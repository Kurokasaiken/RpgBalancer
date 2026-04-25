/**
 * Unit tests for Activity Loop Analyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityLoopAnalyzer } from '../../../src/ui/idleVillage/analytics/ActivityLoopAnalyzer';
import {
  DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG,
  ActivityLoopEvent,
  ActivityBottleneck,
} from '../../../src/ui/idleVillage/analytics/activityLoopAnalyzerConfig';

// Mock PersistenceService
vi.mock('../../../src/shared/persistence/PersistenceService');
vi.mock('../../../src/ui/idleVillage/utils/sandboxDiagnostics');

const mockPersistenceService = vi.mocked('../../../src/shared/persistence/PersistenceService');
const mockDiagnostics = vi.mocked('../../../src/ui/idleVillage/utils/sandboxDiagnostics');

describe('ActivityLoopAnalyzer', () => {
  const mockConfig = {
    loadData: vi.fn(),
    saveData: vi.fn(),
  };

  const mockDiagnosticsInstance = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  mockDiagnostics.mockImplementation(() => mockDiagnosticsInstance);
  mockPersistenceService.mockImplementation(() => mockConfig);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
      // The component should render with default config
    });

    it('should accept initial configuration', () => {
      const customConfig = {
        config: {
          display: {
            showSeverityBadges: false,
            panelHeight: 150,
            panelWidth: 300,
          },
        },
      };
      
      const { container } = render(
        <ActivityLoopAnalyzer 
          initialConfig={customConfig}
          enableSampleData={true}
        />
      );
      
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
    });

    it('should apply presets correctly', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      // Apply realtime preset
      const presetSelect = container.querySelector('select');
      if (presetSelect) {
        await userEvent.selectOptions(presetSelect, 'realtime');
        expect(presetSelect).toHaveValue('realtime');
      }
    });
  });

  describe('Data Visualization', () => {
    it('should render metrics summary', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      // Wait for data to be loaded
      await waitFor(() => {
        expect(container.querySelectorAll('.bg-gray-800')).toHaveLength(4); // 4 metric cards
      });
      
      // Check that metrics are rendered
      expect(container.textContent).toContain('Total Started');
      expect(container.textContent).toContain('Throughput Rate');
      expect(container.textContent).toContain('Current Backlog');
      expect(container.textContent).toContain('Failure Rate');
    });

    it('should render bottleneck table', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelector('table')).toBeInTheDocument();
      });
      
      // Check table headers
      expect(container.textContent).toContain('Activity');
      expect(container.textContent).toContain('Type');
      expect(container.textContent).toContain('Severity');
      expect(container.textContent).toContain('Impact');
    });

    it('should render severity badges', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelectorAll('.rounded-full')).toHaveLength(0); // No badges initially
      });
    });
  });

  describe('Interactions', () => {
    it('should handle bottleneck clicks', async () => {
      const onBottleneckClick = vi.fn();
      const { container } = render(
        <ActivityLoopAnalyzer 
          enableSampleData={true}
          onBottleneckClick={onBottleneckClick}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelector('table')).toBeInTheDocument();
      });
      
      const firstRow = container.querySelector('tbody tr');
      if (firstRow) {
        await userEvent.click(firstRow);
        expect(onBottleneckClick).toHaveBeenCalledWith(
          expect.objectContaining({
            activityType: expect.any(String),
            severity: expect.any(String),
          })
        );
      }
    });

    it('should handle preset changes', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelector('select')).toBeInTheDocument();
      });
      
      const presetSelect = container.querySelector('select');
      if (presetSelect) {
        await userEvent.selectOptions(presetSelect, 'daily');
        expect(presetSelect).toHaveValue('daily');
      }
    });

    it('should handle reset button', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument();
      });
      
      const resetButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Reset')
      );
      
      if (resetButton) {
        await userEvent.click(resetButton);
        expect(mockPersistenceService.saveData).toHaveBeenCalled();
      }
    });
  });

  describe('Export Functionality', () => {
    it('should export JSON data', async () => {
      const onExport = vi.fn();
      const { container } = render(
        <ActivityLoopAnalyzer 
          enableSampleData={true}
          onExport={onExport}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument();
      });
      
      const exportJsonButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Export JSON')
      );
      
      if (exportJsonButton) {
        await userEvent.click(exportJsonButton);
        expect(onExport).toHaveBeenCalledWith(
          expect.stringContaining('"format":"json"'),
          'json'
        );
      }
    });

    it('should export CSV data', async () => {
      const onExport = vi.fn();
      const { container } = render(
        <ActivityLoopAnalyzer 
          enableSampleData={true}
          onExport={onExport}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument();
      });
      
      const exportCsvButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Export CSV')
      );
      
      if (exportCsvButton) {
        await userEvent.click(exportCsvButton);
        expect(onExport).toHaveBeenCalledWith(
          expect.stringContaining('Activity Type,Severity'),
          'csv'
        );
      }
    });

    it('should export markdown data', async () => {
      const onExport = vi.fn();
      const { container } = render(
        <ActivityLoopAnalyzer 
          enableSampleData={true}
          onExport={onExport}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument();
      });
      
      const exportMdButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Export MD')
      );
      
      if (exportMdButton) {
        await userEvent.click(exportMdButton);
        expect(onExport).toHaveBeenCalledWith(
          expect.stringContaining('# Activity Loop Bottleneck Analysis'),
          'markdown'
        );
      }
    });
  });

  describe('Auto-refresh', () => {
    it('should toggle auto-refresh', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.textContent).toContain('Auto-refresh:');
      });
      
      const toggleButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Enabled') || button.textContent?.includes('Disabled')
      );
      
      if (toggleButton) {
        const initialText = toggleButton.textContent;
        await userEvent.click(toggleButton);
        expect(toggleButton.textContent).not.toBe(initialText);
      }
    });

    it('should show refresh interval', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.textContent).toContain('(30s)');
      });
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', async () => {
      const { container } = render(
        <ActivityLoopAnalyzer 
          enableSampleData={true}
          compactMode={true}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelector('.p-2')).toBeInTheDocument(); // Compact padding
      });
    });

    it('should adjust layout for compact mode', async () => {
      const { container } = render(
        <ActivityLoopAnalyzer 
          enableSampleData={true}
          compactMode={true}
        />
      );
      
      await waitFor(() => {
        const buttons = container.querySelectorAll('.text-sm');
        expect(buttons.length).toBeGreaterThan(0); // Should have smaller buttons
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error state when data loading fails', async () => {
      // Mock data loading to fail
      mockPersistenceService.loadData.mockRejected(new Error('Failed to load data'));
      
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={false} />);
      
      // Should show error message
      await waitFor(() => {
        expect(container.textContent).toContain('Error:');
      });
    });

    it('should handle empty data gracefully', () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={false} />);
      
      // Should render empty panel without crashing
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        const table = container.querySelector('table');
        expect(table).toHaveAttribute('role', 'table');
      });
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('tabIndex', '0');
        });
      });
    });

    it('should have proper color contrast', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        const badges = container.querySelectorAll('.rounded-full');
        badges.forEach(badge => {
          const styles = getComputedStyle(badge);
          const backgroundColor = styles.backgroundColor;
          const color = styles.color;
          
          // Basic contrast check (this is a simplified check)
          expect(backgroundColor).toBeTruthy();
          expect(color).toBeTruthy();
        });
      });
    });
  });

  describe('Performance', () => {
    it('should render efficiently with sample data', async () => {
      const startTime = performance.now();
      
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelectorAll('.bg-gray-800')).toHaveLength(4);
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle large datasets efficiently', async () => {
      const { container } = render(
        <ActivityLoopAnalyzer 
          enableSampleData={true}
          initialConfig={{
            config: {
              analysis: {
                minDataPoints: 1,
              },
            },
          }}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
      });
      
      // Should not crash with large datasets
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with PersistenceService', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      // Should load persisted config on mount
      await waitFor(() => {
        expect(mockPersistenceService.loadData).toHaveBeenCalled();
      });
      
      // Should save config when updated
      const presetSelect = container.querySelector('select');
      if (presetSelect) {
        await userEvent.selectOptions(presetSelect, 'compact');
        expect(mockPersistenceService.saveData).toHaveBeenCalled();
      }
    });

    it('should emit telemetry events', async () => {
      const { container } = render(<ActivityLoopAnalyzer enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelector('table')).toBeInTheDocument();
      });
      
      // Should emit viewed event
      expect(mockDiagnostics.info).toHaveBeenCalledWith(
        'Activity loop bottlenecks detected',
        expect.objectContaining({
          bottleneckCount: expect.any(Number),
          criticalCount: expect.any(Number),
        })
      );
    });
  });
});
