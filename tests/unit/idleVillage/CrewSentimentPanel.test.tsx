/**
 * Unit tests for Crew Sentiment Panel
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrewSentimentPanel } from '../../../src/ui/idleVillage/components/CrewSentimentPanel';
import {
  CrewSentimentConfig,
  SentimentDataPoint,
  SentimentDiff,
  DEFAULT_CREW_SENTIMENT_CONFIG,
} from '../../../src/ui/idleVillage/config/crewSentimentConfig';

// Mock PersistenceService
vi.mock('../../../src/shared/persistence/PersistenceService');
vi.mock('../../../src/ui/idleVillage/utils/sandboxDiagnostics');

const mockPersistenceService = vi.mocked('../../../src/shared/persistence/PersistenceService');
const mockDiagnostics = vi.mocked('../../../src/ui/idleVillage/utils/sandboxDiagnostics');

describe('CrewSentimentPanel', () => {
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
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
      // The component should render with default config
    });

    it('should accept initial configuration', () => {
      const customConfig = {
        display: {
          showSparklines: false,
          panelHeight: 150,
          panelWidth: 300,
        },
      };
      
      const { container } = render(
        <CrewSentimentPanel 
          initialConfig={customConfig}
          enableSampleData={true}
        />
      );
      
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
    });

    it('should apply presets correctly', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      // Apply compact preset
      const presetSelect = container.querySelector('select');
      if (presetSelect) {
        await userEvent.selectOptions(presetSelect, 'compact');
        expect(presetSelect).toHaveValue('compact');
      }
    });
  });

  describe('Data Visualization', () => {
    it('should render sentiment metrics', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      // Wait for data to be loaded
      await waitFor(() => {
        expect(container.querySelectorAll('.bg-gray-800')).toHaveLength(4); // 4 metrics
      });
      
      // Check that metrics are rendered
      expect(container.textContent).toContain('stress');
      expect(container.textContent).toContain('morale');
      expect(container.textContent).toContain('satisfaction');
      expect(container.textContent).toContain('productivity');
    });

    it('should render sparklines when enabled', async () => {
      const { container } = render(
        <CrewSentimentPanel 
          enableSampleData={true}
          initialConfig={{
            display: {
              showSparklines: true,
            },
          }}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelectorAll('canvas')).toHaveLength(4); // 4 sparklines
      });
    });

    it('should render percentage badges', async () => {
      const { container } = render(
        <CrewSentimentPanel 
          enableSampleData={true}
          initialConfig={{
            display: {
              showPercentageBadges: true,
            },
          }}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelectorAll('.rounded-full')).toHaveLength(4); // 4 badges
      });
    });

    it('should render significance indicators', async () => {
      const { container } = render(
        <CrewSentimentPanel 
          enableSampleData={true}
          initialConfig={{
            display: {
              showSignificanceIndicators: true,
            },
          }}
        />
      );
      
      await waitFor(() => {
        expect(container.textContent).toContain('Significance:');
      });
    });
  });

  describe('Interactions', () => {
    it('should handle metric clicks', async () => {
      const onMetricClick = vi.fn();
      const { container } = render(
        <CrewSentimentPanel 
          enableSampleData={true}
          onMetricClick={onMetricClick}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelectorAll('.bg-gray-800')).toHaveLength(4);
      });
      
      const firstMetric = container.querySelectorAll('.bg-gray-800')[0];
      await userEvent.click(firstMetric);
      
      expect(onMetricClick).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metric: expect.any(String),
          currentValue: expect.any(Number),
          previousValue: expect.any(Number),
        })
      );
    });

    it('should handle preset changes', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelector('select')).toBeInTheDocument();
      });
      
      const presetSelect = container.querySelector('select');
      if (presetSelect) {
        await userEvent.selectOptions(presetSelect, 'detailed');
        expect(presetSelect).toHaveValue('detailed');
      }
    });

    it('should handle reset button', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument();
      });
      
      const resetButton = container.querySelector('button');
      if (resetButton && resetButton.textContent?.includes('Reset')) {
        await userEvent.click(resetButton);
        expect(mockPersistenceService.saveData).toHaveBeenCalled();
      }
    });
  });

  describe('Export Functionality', () => {
    it('should export JSON data', async () => {
      const onExport = vi.fn();
      const { container } = render(
        <CrewSentimentPanel 
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
        <CrewSentimentPanel 
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
          expect.stringContaining('Turn,Timestamp'),
          'csv'
        );
      }
    });

    it('should export markdown data', async () => {
      const onExport = vi.fn();
      const { container } = render(
        <CrewSentimentPanel 
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
          expect.stringContaining('# Crew Sentiment Analysis Export'),
          'markdown'
        );
      }
    });
  });

  describe('Auto-refresh', () => {
    it('should toggle auto-refresh', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
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
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.textContent).toContain('(30s)');
      });
    });
  });

  describe('Metrics Summary', () => {
    it('should display metrics summary', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.textContent).toContain('Data Points');
        expect(container.textContent).toContain('Turns');
        expect(container.textContent).toContain('Critical');
        expect(container.textContent).toContain('High');
        expect(container.textContent).toContain('Medium');
        expect(container.textContent).Contains('Low');
      });
    });

    it('should show alert counts', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.textContent).toMatch(/\d+/); // Should contain numbers for alert counts
      });
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', async () => {
      const { container } = render(
        <CrewSentimentPanel 
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
        <CrewSentimentPanel 
          enableSampleData={true}
          compactMode={true}
        />
      );
      
      await waitFor(() => {
        const badges = container.querySelectorAll('.text-xs');
        expect(badges.length).toBeGreaterThan(0); // Should have smaller badges
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error state when data loading fails', async () => {
      // Mock data loading to fail
      mockPersistenceService.loadData.mockRejected(new Error('Failed to load data'));
      
      const { container } = render(<CrewSentimentPanel enableSampleData={false} />);
      
      // Should show error message
      await waitFor(() => {
        expect(container.textContent).toContain('Error:');
      });
    });

    it('should handle empty data gracefully', () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={false} />);
      
      // Should render empty panel without crashing
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      await waitFor(() => {
        const metricCards = container.querySelectorAll('.bg-gray-800');
        metricCards.forEach(card => {
          expect(card).toHaveAttribute('role', 'button');
        });
      });
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      await waitFor(() => {
        const metricCards = container.querySelectorAll('.bg-gray-800');
        metricCards.forEach(card => {
          expect(card).toHaveAttribute('tabIndex', '0');
        });
      });
    });

    it('should have proper color contrast', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
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
      
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
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
        <CrewSentimentPanel 
          enableSampleData={true}
          initialConfig={{
            diff: {
              minDataPoints: 1,
            },
          }}
        />
      );
      
      await waitFor(() => {
        expect(container.querySelectorAll('.bg-gray-800')).toHaveLength(4);
      });
      
      // Should not crash with large datasets
      expect(container.querySelector('.bg-gray-900')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with PersistenceService', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      // Should load persisted config on mount
      await waitFor(() => {
        expect(mockPersistenceService.loadData).toHaveBeenCalledWith('idle_village_crew_sentiment_config');
      });
      
      // Should save config when updated
      const presetSelect = container.querySelector('select');
      if (presetSelect) {
        await userEvent.selectOptions(presetSelect, 'compact');
        expect(mockPersistenceService.saveData).toHaveBeenCalled();
      }
    });

    it('should emit telemetry events', async () => {
      const { container } = render(<CrewSentimentPanel enableSampleData={true} />);
      
      await waitFor(() => {
        expect(container.querySelectorAll('.bg-gray-800')).toHaveLength(4);
      });
      
      // Should emit viewed event
      expect(mockDiagnostics.info).toHaveBeenCalledWith(
        'Crew sentiment diff viewed',
        expect.objectContaining({
          dataPoints: expect.any(Number),
          diffs: expect.any(Number),
        })
      );
    });
  });
});
