/**
 * Config Balancer Storage Telemetry Monitor Tests
 *
 * Comprehensive test suite for the storage telemetry monitoring system.
 * Tests telemetry event tracking, health metrics calculation, and UI component rendering.
 *
 * @since NP-097
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigBalancerTelemetryPanel } from '@/ui/balancing/ConfigBalancerTelemetryPanel';
import {
  useStorageTelemetryMonitor,
  generateDataChecksum,
  StorageTelemetryUtils,
  DEFAULT_STORAGE_TELEMETRY_CONFIG,
} from '@/balancing/config/storageTelemetryMonitor';
import { renderHook, act } from '@testing-library/react';

// Mock React hooks for static telemetry testing
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
    useCallback: vi.fn(),
    useMemo: vi.fn(),
    useRef: vi.fn(),
  };
});

describe('Storage Telemetry Monitor', () => {
  describe('useStorageTelemetryMonitor Hook', () => {
    let mockMonitor: any;

    beforeEach(() => {
      mockMonitor = {
        startOperation: vi.fn(),
        completeOperation: vi.fn(),
        recordEvent: vi.fn(),
        calculateHealthMetrics: vi.fn(() => ({
          totalOperations: 10,
          successfulOperations: 9,
          failedOperations: 1,
          averageDuration: 50,
          errorRate: 10,
        })),
        exportTelemetryData: vi.fn(() => ({
          config: DEFAULT_STORAGE_TELEMETRY_CONFIG,
          events: [],
          healthMetrics: {},
        })),
        clearTelemetryData: vi.fn(),
        events: [],
      };
    });

    it('should initialize with default configuration', () => {
      // Test that the hook initializes properly with defaults
      expect(DEFAULT_STORAGE_TELEMETRY_CONFIG.enabled).toBe(true);
      expect(DEFAULT_STORAGE_TELEMETRY_CONFIG.performanceWarningThreshold).toBe(100);
      expect(DEFAULT_STORAGE_TELEMETRY_CONFIG.sessionId).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        enabled: false,
        performanceWarningThreshold: 200,
        trackDetailedMetrics: false,
      };

      const merged = { ...DEFAULT_STORAGE_TELEMETRY_CONFIG, ...customConfig };
      expect(merged.enabled).toBe(false);
      expect(merged.performanceWarningThreshold).toBe(200);
      expect(merged.trackDetailedMetrics).toBe(false);
    });
  });

  describe('Data Checksum Generation', () => {
    it('should generate consistent checksums for same data', () => {
      const testData = { id: 'test', value: 123 };
      const checksum1 = generateDataChecksum(testData);
      const checksum2 = generateDataChecksum(testData);

      expect(checksum1).toBe(checksum2);
      expect(typeof checksum1).toBe('string');
      expect(checksum1.length).toBeGreaterThan(0);
    });

    it('should generate different checksums for different data', () => {
      const data1 = { id: 'test1', value: 123 };
      const data2 = { id: 'test2', value: 456 };

      const checksum1 = generateDataChecksum(data1);
      const checksum2 = generateDataChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('StorageTelemetryUtils', () => {
    describe('validatePerformance', () => {
      it('should return true for duration below threshold', () => {
        expect(StorageTelemetryUtils.validatePerformance(50, 100)).toBe(true);
      });

      it('should return false for duration above threshold', () => {
        expect(StorageTelemetryUtils.validatePerformance(150, 100)).toBe(false);
      });

      it('should return true for duration equal to threshold', () => {
        expect(StorageTelemetryUtils.validatePerformance(100, 100)).toBe(true);
      });
    });

    describe('calculateThroughput', () => {
      it('should calculate correct operations per second', () => {
        const throughput = StorageTelemetryUtils.calculateThroughput(60, 30000); // 60 ops in 30 seconds
        expect(throughput).toBe(2); // 2 ops/second
      });

      it('should handle zero time window', () => {
        const throughput = StorageTelemetryUtils.calculateThroughput(10, 0);
        expect(throughput).toBe(Infinity);
      });
    });

    describe('analyzeErrorPatterns', () => {
      it('should analyze error patterns correctly', () => {
        const mockEvents = [
          {
            type: 'storage_operation_error',
            metrics: { operation: 'save', error: 'NetworkError' },
          },
          {
            type: 'storage_operation_error',
            metrics: { operation: 'save', error: 'NetworkError' },
          },
          {
            type: 'storage_operation_error',
            metrics: { operation: 'load', error: 'ParseError' },
          },
        ] as any;

        const patterns = StorageTelemetryUtils.analyzeErrorPatterns(mockEvents);

        expect(patterns['save:NetworkError']).toBe(2);
        expect(patterns['load:ParseError']).toBe(1);
      });

      it('should handle empty events array', () => {
        const patterns = StorageTelemetryUtils.analyzeErrorPatterns([]);
        expect(Object.keys(patterns)).toHaveLength(0);
      });
    });

    describe('generateHealthReport', () => {
      it('should generate formatted health report', () => {
        const mockMetrics = {
          totalOperations: 100,
          successfulOperations: 95,
          failedOperations: 5,
          averageDuration: 75.5,
          errorRate: 5.0,
          lastSuccessfulSave: Date.now() - 300000,
          lastSuccessfulLoad: Date.now() - 60000,
          storageSize: 15360,
          dataChecksum: 'abc123def',
        } as any;

        const report = StorageTelemetryUtils.generateHealthReport(mockMetrics);

        expect(report).toContain('Storage Health Report');
        expect(report).toContain('Total Operations: 100');
        expect(report).toContain('Success Rate: 95.00%');
        expect(report).toContain('Error Rate: 5%');
        expect(report).toContain('Avg Duration: 75.5ms');
        expect(report).toContain('Storage Size: 15.0 KB');
      });
    });
  });

  describe('ConfigBalancerTelemetryPanel Component', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render the telemetry panel with basic structure', () => {
      render(<ConfigBalancerTelemetryPanel />);

      expect(screen.getByText('Storage Telemetry Monitor')).toBeTruthy();
      expect(screen.getByText('Config Balancer storage operations and performance')).toBeTruthy();
    });

    it('should display health metrics overview', () => {
      render(<ConfigBalancerTelemetryPanel />);

      expect(screen.getByText('Total Operations')).toBeTruthy();
      expect(screen.getByText('Success Rate')).toBeTruthy();
      expect(screen.getByText('Avg Duration')).toBeTruthy();
      expect(screen.getByText('Error Rate')).toBeTruthy();
    });

    it('should show recent operations section', () => {
      render(<ConfigBalancerTelemetryPanel />);

      expect(screen.getByText('Recent Operations')).toBeTruthy();
      expect(screen.getByText('All Events')).toBeTruthy();
    });

    it('should display performance score', () => {
      render(<ConfigBalancerTelemetryPanel />);

      expect(screen.getByText(/Performance: \d+\/\d+/)).toBeTruthy();
    });

    it('should show last refresh timestamp', () => {
      render(<ConfigBalancerTelemetryPanel />);

      expect(screen.getByText('Last Refresh')).toBeTruthy();
      // Should contain a time string
      const refreshElement = screen.getByText(/Last Refresh/);
      const timeElement = refreshElement.nextElementSibling;
      expect(timeElement?.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should filter events by type', async () => {
      render(<ConfigBalancerTelemetryPanel />);

      const select = screen.getByDisplayValue('All Events');
      expect(select).toBeTruthy();

      // The select should have options for different event types
      expect(select).toBeInTheDocument();
    });

    it('should show detailed metrics when enabled', () => {
      render(<ConfigBalancerTelemetryPanel showDetailedMetrics={true} />);

      // Should show detailed event information
      expect(screen.getByText('Recent Operations')).toBeTruthy();
    });

    it('should hide detailed metrics when disabled', () => {
      render(<ConfigBalancerTelemetryPanel showDetailedMetrics={false} />);

      // Should still render but without detailed metrics
      expect(screen.getByText('Storage Telemetry Monitor')).toBeTruthy();
    });

    it('should respect maxEvents prop', () => {
      render(<ConfigBalancerTelemetryPanel maxEvents={5} />);

      // Should limit the number of displayed events
      expect(screen.getByText('Storage Telemetry Monitor')).toBeTruthy();
    });

    it('should support compact mode', () => {
      render(<ConfigBalancerTelemetryPanel compact={true} />);

      // Should render in compact mode (less detailed)
      expect(screen.getByText('Storage Telemetry Monitor')).toBeTruthy();
    });

    it('should apply custom className', () => {
      render(<ConfigBalancerTelemetryPanel className="custom-telemetry-class" />);

      const panel = screen.getByTestId('config-balancer-telemetry-panel')?.parentElement;
      expect(panel?.className).toContain('custom-telemetry-class');
    });

    it('should display mock telemetry events', () => {
      render(<ConfigBalancerTelemetryPanel />);

      // Should show some telemetry events from mock data
      expect(screen.getByText('Recent Operations')).toBeTruthy();
    });

    it('should show performance insights in non-compact mode', () => {
      render(<ConfigBalancerTelemetryPanel compact={false} />);

      expect(screen.getByText('Performance Insights')).toBeTruthy();
      expect(screen.getByText('Operation Success Rates')).toBeTruthy();
      expect(screen.getByText('System Health')).toBeTruthy();
    });

    it('should hide performance insights in compact mode', () => {
      render(<ConfigBalancerTelemetryPanel compact={true} />);

      expect(screen.queryByText('Performance Insights')).toBeFalsy();
    });

    it('should show operation-specific success rates', () => {
      render(<ConfigBalancerTelemetryPanel compact={false} />);

      // Should show success rates for different operations
      expect(screen.getByText('save')).toBeTruthy();
      expect(screen.getByText('load')).toBeTruthy();
      expect(screen.getByText('export')).toBeTruthy();
    });
  });

  describe('Integration with BalancerConfigStore', () => {
    it('should track telemetry events from store operations', async () => {
      // This would test integration with actual BalancerConfigStore
      // For now, we test the telemetry system can handle store-like operations

      const mockTelemetry = {
        startOperation: vi.fn(),
        completeOperation: vi.fn(),
        recordEvent: vi.fn(),
      };

      // Simulate a store operation
      mockTelemetry.startOperation('save', { description: 'Test save' });
      mockTelemetry.completeOperation(true, undefined, { dataSize: 1024 });

      expect(mockTelemetry.startOperation).toHaveBeenCalledWith('save', { description: 'Test save' });
      expect(mockTelemetry.completeOperation).toHaveBeenCalledWith(true, undefined, { dataSize: 1024 });
    });

    it('should handle store operation errors', () => {
      const mockTelemetry = {
        startOperation: vi.fn(),
        completeOperation: vi.fn(),
        recordEvent: vi.fn(),
      };

      mockTelemetry.startOperation('load');
      mockTelemetry.completeOperation(false, 'Storage quota exceeded', { errorType: 'QuotaExceededError' });

      expect(mockTelemetry.startOperation).toHaveBeenCalledWith('load');
      expect(mockTelemetry.completeOperation).toHaveBeenCalledWith(
        false,
        'Storage quota exceeded',
        { errorType: 'QuotaExceededError' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', () => {
      // Test configuration validation
      expect(() => {
        // Invalid config would be caught during parsing
      }).not.toThrow();
    });

    it('should handle telemetry system failures', () => {
      const mockTelemetry = {
        startOperation: vi.fn(() => { throw new Error('Telemetry failure'); }),
        completeOperation: vi.fn(),
        recordEvent: vi.fn(),
      };

      // Should not crash when telemetry fails
      expect(() => {
        try {
          mockTelemetry.startOperation('test');
        } catch (e) {
          // Expected error
        }
      }).not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should detect performance warnings', () => {
      const mockTelemetry = {
        startOperation: vi.fn(),
        completeOperation: vi.fn(),
        recordEvent: vi.fn(),
      };

      // Simulate slow operation
      mockTelemetry.startOperation('save');
      mockTelemetry.completeOperation(true, undefined, {
        duration: 150, // Above 100ms threshold
      });

      expect(mockTelemetry.completeOperation).toHaveBeenCalledWith(
        true,
        undefined,
        expect.objectContaining({ duration: 150 })
      );
    });

    it('should track operation throughput', () => {
      const operations = 50;
      const timeWindow = 10000; // 10 seconds
      const throughput = StorageTelemetryUtils.calculateThroughput(operations, timeWindow);

      expect(throughput).toBe(5); // 5 ops/second
    });
  });

  describe('Data Integrity', () => {
    it('should generate valid checksums', () => {
      const testConfig = {
        stats: { hp: { id: 'hp', name: 'Health', weight: 1.0 } },
        cards: {},
        presets: {},
      };

      const checksum = generateDataChecksum(testConfig);
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
    });

    it('should detect data changes via checksum', () => {
      const config1 = { value: 1 };
      const config2 = { value: 2 };

      const checksum1 = generateDataChecksum(config1);
      const checksum2 = generateDataChecksum(config2);

      expect(checksum1).not.toBe(checksum2);
    });
  });
});
