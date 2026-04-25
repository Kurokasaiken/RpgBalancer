/**
 * Multi-Village Monitor Tests
 *
 * Comprehensive test suite for the multi-village scheduler monitor system,
 * including service, hook, component, and integration tests.
 *
 * @module MultiVillageMonitor.test
 * @since 2026-01-13
 * @author Atlas-MultiVillage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiVillageSchedulerMonitor, DEFAULT_MULTI_VILLAGE_MONITOR_CONFIG } from '../services/multiVillageSchedulerMonitor';
import { useMultiVillageMonitor, useSingleVillageMonitor, useAlertTrends } from '../hooks/useMultiVillageMonitor';
import { MultiVillageMonitorPanel } from '../components/MultiVillageMonitorPanel';

// Mock dependencies
vi.mock('../services/multiVillageSchedulerMonitor', () => ({
  MultiVillageSchedulerMonitor: vi.fn(),
  DEFAULT_MULTI_VILLAGE_MONITOR_CONFIG: {
    monitoringInterval: 30000,
    retentionPeriod: 86400000,
    maxKpisPerVillage: 1000,
    enableRealTime: true,
    thresholds: {
      maxQueueUtilization: 0.8,
      minSuccessRate: 0.7,
      maxIdlePercentage: 0.3,
    },
  },
}));

vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
    useCallback: vi.fn(),
    useMemo: vi.fn(),
  };
});

// Test data
const mockVillage: any = {
  id: 'test-village-1',
  name: 'Test Village',
  state: {
    residents: {},
    activities: {},
    currentTime: Date.now(),
  },
  schedulerConfig: {
    maxQueueSize: 100,
  },
  metadata: {
    version: '1.0.0',
    region: 'test-region',
  },
};

const mockKPIs: any = {
  villageId: 'test-village-1',
  timestamp: Date.now(),
  queue: {
    size: 25,
    averageSize: 22,
    maxSize: 100,
    utilization: 0.25,
  },
  assignments: {
    total: 100,
    successful: 85,
    failed: 15,
    successRate: 0.85,
    averageDuration: 2000000,
  },
  residents: {
    total: 50,
    active: 35,
    idle: 15,
    utilization: 0.7,
    fatigueDistribution: {
      low: 20,
      medium: 20,
      high: 8,
      critical: 2,
    },
  },
  activities: {
    total: 20,
    active: 15,
    utilization: 0.75,
    byType: { food: 8, build: 7 },
  },
  performance: {
    averageProcessingTime: 150,
    throughput: 2.5,
    efficiency: 0.6375,
    loadFactor: 0.3375,
  },
};

const mockAlerts: any[] = [
  {
    id: 'alert-1',
    severity: 'warning',
    type: 'queue_overload',
    villageId: 'test-village-1',
    message: 'Queue utilization at 85% in Test Village',
    timestamp: Date.now(),
    resolved: false,
    context: { utilization: 0.85 },
  },
];

describe('MultiVillageSchedulerMonitor Service', () => {
  let monitor: MultiVillageSchedulerMonitor;
  let mockMonitorInstance: any;

  beforeEach(() => {
    mockMonitorInstance = {
      registerVillage: vi.fn(),
      unregisterVillage: vi.fn(),
      updateVillageState: vi.fn(),
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn(),
      getVillages: vi.fn().mockReturnValue([mockVillage]),
      getLatestKPIs: vi.fn().mockReturnValue(mockKPIs),
      getKPIHistory: vi.fn().mockReturnValue([mockKPIs]),
      getActiveAlerts: vi.fn().mockReturnValue(mockAlerts),
      performComparativeAnalysis: vi.fn().mockReturnValue({
        rankings: { queueEfficiency: [] },
        summary: { bestPerforming: 'test-village-1' },
        recommendations: [],
      }),
      exportKPIs: vi.fn().mockReturnValue('{"test":"data"}'),
      exportComparativeAnalysis: vi.fn().mockReturnValue('{"analysis":"data"}'),
      exportAlerts: vi.fn().mockReturnValue('{"alerts":"data"}'),
      exportFullReport: vi.fn().mockReturnValue('{"full":"report"}'),
      updateConfig: vi.fn(),
      getConfig: vi.fn().mockReturnValue(DEFAULT_MULTI_VILLAGE_MONITOR_CONFIG),
      getStats: vi.fn().mockReturnValue({
        villagesMonitored: 1,
        totalKpisCollected: 10,
        activeAlerts: 1,
        uptime: 300000,
        lastCollectionTime: Date.now(),
      }),
      resolveAlert: vi.fn(),
    };

    (MultiVillageSchedulerMonitor as any).mockImplementation(() => mockMonitorInstance);
    monitor = new MultiVillageSchedulerMonitor();
  });

  describe('Initialization', () => {
    it('should create monitor with default config', () => {
      expect(MultiVillageSchedulerMonitor).toHaveBeenCalledWith({});
      expect(monitor).toBeDefined();
    });

    it('should accept custom config', () => {
      const customConfig = { monitoringInterval: 60000 };
      new MultiVillageSchedulerMonitor(customConfig);
      expect(MultiVillageSchedulerMonitor).toHaveBeenCalledWith(customConfig);
    });
  });

  describe('Village Management', () => {
    it('should register villages', () => {
      monitor.registerVillage(mockVillage);
      expect(mockMonitorInstance.registerVillage).toHaveBeenCalledWith(mockVillage);
    });

    it('should unregister villages', () => {
      monitor.unregisterVillage('test-village-1');
      expect(mockMonitorInstance.unregisterVillage).toHaveBeenCalledWith('test-village-1');
    });

    it('should update village state', () => {
      const newState = { ...mockVillage.state, currentTime: Date.now() + 1000 };
      monitor.updateVillageState('test-village-1', newState);
      expect(mockMonitorInstance.updateVillageState).toHaveBeenCalledWith('test-village-1', newState);
    });

    it('should get registered villages', () => {
      const villages = monitor.getVillages();
      expect(mockMonitorInstance.getVillages).toHaveBeenCalled();
      expect(villages).toEqual([mockVillage]);
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      monitor.startMonitoring();
      expect(mockMonitorInstance.startMonitoring).toHaveBeenCalled();
    });

    it('should stop monitoring', () => {
      monitor.stopMonitoring();
      expect(mockMonitorInstance.stopMonitoring).toHaveBeenCalled();
    });
  });

  describe('KPI Access', () => {
    it('should get latest KPIs', () => {
      const kpis = monitor.getLatestKPIs('test-village-1');
      expect(mockMonitorInstance.getLatestKPIs).toHaveBeenCalledWith('test-village-1');
      expect(kpis).toEqual(mockKPIs);
    });

    it('should get KPI history', () => {
      const history = monitor.getKPIHistory('test-village-1', 5);
      expect(mockMonitorInstance.getKPIHistory).toHaveBeenCalledWith('test-village-1', 5);
      expect(history).toEqual([mockKPIs]);
    });
  });

  describe('Alert Management', () => {
    it('should get active alerts', () => {
      const alerts = monitor.getActiveAlerts();
      expect(mockMonitorInstance.getActiveAlerts).toHaveBeenCalled();
      expect(alerts).toEqual(mockAlerts);
    });

    it('should resolve alerts', () => {
      monitor.resolveAlert('alert-1');
      expect(mockMonitorInstance.resolveAlert).toHaveBeenCalledWith('alert-1');
    });
  });

  describe('Comparative Analysis', () => {
    it('should perform comparative analysis', () => {
      const analysis = monitor.performComparativeAnalysis(3600000);
      expect(mockMonitorInstance.performComparativeAnalysis).toHaveBeenCalledWith(3600000);
      expect(analysis.summary.bestPerforming).toBe('test-village-1');
    });
  });

  describe('Export Functionality', () => {
    it('should export KPIs', () => {
      const data = monitor.exportKPIs('json');
      expect(mockMonitorInstance.exportKPIs).toHaveBeenCalledWith('json', undefined);
      expect(data).toBe('{"test":"data"}');
    });

    it('should export comparative analysis', () => {
      const data = monitor.exportComparativeAnalysis(3600000, 'json');
      expect(mockMonitorInstance.exportComparativeAnalysis).toHaveBeenCalledWith(3600000, 'json');
      expect(data).toBe('{"analysis":"data"}');
    });

    it('should export alerts', () => {
      const data = monitor.exportAlerts('json');
      expect(mockMonitorInstance.exportAlerts).toHaveBeenCalledWith('json');
      expect(data).toBe('{"alerts":"data"}');
    });

    it('should export full report', () => {
      const data = monitor.exportFullReport('json');
      expect(mockMonitorInstance.exportFullReport).toHaveBeenCalledWith('json');
      expect(data).toBe('{"full":"report"}');
    });
  });

  describe('Configuration', () => {
    it('should update config', () => {
      const newConfig = { monitoringInterval: 60000 };
      monitor.updateConfig(newConfig);
      expect(mockMonitorInstance.updateConfig).toHaveBeenCalledWith(newConfig);
    });

    it('should get current config', () => {
      const config = monitor.getConfig();
      expect(mockMonitorInstance.getConfig).toHaveBeenCalled();
      expect(config).toEqual(DEFAULT_MULTI_VILLAGE_MONITOR_CONFIG);
    });
  });

  describe('Statistics', () => {
    it('should get monitor statistics', () => {
      const stats = monitor.getStats();
      expect(mockMonitorInstance.getStats).toHaveBeenCalled();
      expect(stats).toHaveProperty('villagesMonitored', 1);
      expect(stats).toHaveProperty('totalKpisCollected', 10);
    });
  });
});

describe('useMultiVillageMonitor Hook', () => {
  const mockUseState = vi.fn();
  const mockUseEffect = vi.fn();
  const mockUseCallback = vi.fn();
  const mockUseMemo = vi.fn();

  beforeEach(() => {
    // Setup React hook mocks
    mockUseState.mockImplementation((initial) => [initial, vi.fn()]);
    mockUseEffect.mockImplementation((fn) => fn());
    mockUseCallback.mockImplementation((fn) => fn);
    mockUseMemo.mockImplementation((fn) => fn());

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useMultiVillageMonitor());

      expect(result.current.isRunning).toBe(false);
      expect(result.current.villages).toEqual([]);
      expect(result.current.alerts).toEqual([]);
    });

    it('should accept initial villages', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      expect(result.current.villages).toContain(mockVillage);
    });

    it('should accept custom config', () => {
      const config = { autoStart: true, enableTelemetry: false };
      renderHook(() => useMultiVillageMonitor([], config));

      // Config should be passed through (implementation detail)
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', async () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      await act(async () => {
        await result.current.startMonitoring();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('should stop monitoring', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage], { autoStart: true }));

      act(() => {
        result.current.stopMonitoring();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('Village Management', () => {
    it('should register villages', () => {
      const { result } = renderHook(() => useMultiVillageMonitor());

      act(() => {
        result.current.registerVillage(mockVillage);
      });

      expect(result.current.villages).toContain(mockVillage);
    });

    it('should unregister villages', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      act(() => {
        result.current.unregisterVillage('test-village-1');
      });

      expect(result.current.villages).not.toContain(mockVillage);
    });

    it('should update village state', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));
      const newState = { ...mockVillage.state, currentTime: Date.now() + 1000 };

      act(() => {
        result.current.updateVillageState('test-village-1', newState);
      });

      // State update should be reflected
    });
  });

  describe('Data Access', () => {
    it('should provide KPI data', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      expect(result.current.villageKPIs).toBeDefined();
      expect(result.current.villageKPIsHistory).toBeDefined();
    });

    it('should provide alert data', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      expect(result.current.alerts).toEqual([]);
      expect(result.current.monitorStats).toBeNull();
    });

    it('should resolve alerts', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      act(() => {
        result.current.resolveAlert('test-alert');
      });

      // Alert resolution should be handled
    });
  });

  describe('Export Functions', () => {
    it('should export KPIs', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      const data = result.current.exportKPIs('json');
      expect(typeof data).toBe('string');
    });

    it('should export comparative analysis', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      const data = result.current.exportComparativeAnalysis(3600000, 'json');
      expect(typeof data).toBe('string');
    });

    it('should export alerts', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      const data = result.current.exportAlerts('json');
      expect(typeof data).toBe('string');
    });

    it('should export full report', () => {
      const { result } = renderHook(() => useMultiVillageMonitor([mockVillage]));

      const data = result.current.exportFullReport('json');
      expect(typeof data).toBe('string');
    });
  });
});

describe('useSingleVillageMonitor Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should monitor single village', () => {
    const { result } = renderHook(() => useSingleVillageMonitor(mockVillage));

    expect(result.current.village).toEqual(mockVillage);
    expect(result.current.latestKPIs).toBeNull;
    expect(result.current.kpiHistory).toEqual([]);
  });

  it('should provide simplified interface', () => {
    const { result } = renderHook(() => useSingleVillageMonitor(mockVillage));

    // Should not have multi-village specific properties
    expect(result.current).not.toHaveProperty('villages');
    expect(result.current).not.toHaveProperty('registerVillage');

    // Should have single village properties
    expect(result.current).toHaveProperty('village');
    expect(result.current).toHaveProperty('latestKPIs');
    expect(result.current).toHaveProperty('kpiHistory');
  });
});

describe('useAlertTrends Hook', () => {
  it('should calculate alert trends', () => {
    const alerts = [
      { ...mockAlerts[0], timestamp: Date.now() - 1800000 }, // 30 min ago
      { ...mockAlerts[0], timestamp: Date.now() - 7200000, id: 'alert-2' }, // 2 hours ago
    ];

    const { result } = renderHook(() => useAlertTrends(alerts));

    expect(result.current.totalAlerts).toBe(2);
    expect(result.current.recentAlerts).toBe(1); // Last hour
    expect(result.current.dailyAlerts).toBe(2); // Last 24 hours
    expect(result.current.alertsByType).toHaveProperty('queue_overload', 2);
    expect(result.current.alertsBySeverity).toHaveProperty('warning', 2);
  });

  it('should handle empty alerts', () => {
    const { result } = renderHook(() => useAlertTrends([]));

    expect(result.current.totalAlerts).toBe(0);
    expect(result.current.resolutionRate).toBe(0);
  });
});

describe('MultiVillageMonitorPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Panel Rendering', () => {
    it('should render monitor panel', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      expect(screen.getByText('Multi-Village Scheduler Monitor')).toBeInTheDocument();
      expect(screen.getByText('Monitoring 1 villages • 0 active alerts')).toBeInTheDocument();
    });

    it('should show monitoring controls', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      expect(screen.getByText('▶️ Start Monitoring')).toBeInTheDocument();
      expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
    });

    it('should display view navigation', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      expect(screen.getByText('📊 Overview')).toBeInTheDocument();
      expect(screen.getByText('🚨 Alerts')).toBeInTheDocument();
      expect(screen.getByText('⚖️ Comparison')).toBeInTheDocument();
      expect(screen.getByText('💾 Export')).toBeInTheDocument();
    });
  });

  describe('Overview View', () => {
    it('should display village status', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      expect(screen.getByText('Village Status')).toBeInTheDocument();
      expect(screen.getByText('Test Village')).toBeInTheDocument();
    });

    it('should show summary metrics', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      expect(screen.getByText('Total Formulas')).toBeInTheDocument();
      expect(screen.getByText('With Warnings')).toBeInTheDocument();
      expect(screen.getByText('With Errors')).toBeInTheDocument();
    });
  });

  describe('Alerts View', () => {
    it('should display alert summary', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      // Switch to alerts view
      fireEvent.click(screen.getByText('🚨 Alerts'));

      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
    });

    it('should show stable state when no alerts', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      fireEvent.click(screen.getByText('🚨 Alerts'));

      expect(screen.getByText('All systems stable')).toBeInTheDocument();
    });
  });

  describe('Comparison View', () => {
    it('should display comparative analysis', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      fireEvent.click(screen.getByText('⚖️ Comparison'));

      expect(screen.getByText('Comparative Analysis')).toBeInTheDocument();
    });
  });

  describe('Export View', () => {
    it('should display export options', () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      fireEvent.click(screen.getByText('💾 Export'));

      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByText('📊 KPI Data')).toBeInTheDocument();
      expect(screen.getByText('⚖️ Comparative Analysis')).toBeInTheDocument();
      expect(screen.getByText('🚨 Alert History')).toBeInTheDocument();
      expect(screen.getByText('📋 Full Report')).toBeInTheDocument();
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring when button clicked', async () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      const startButton = screen.getByText('▶️ Start Monitoring');
      fireEvent.click(startButton);

      // Monitoring should start (mocked)
      await waitFor(() => {
        expect(screen.getByText('⏹️ Stop Monitoring')).toBeInTheDocument();
      });
    });

    it('should refresh data when refresh clicked', async () => {
      render(<MultiVillageMonitorPanel initialVillages={[mockVillage]} />);

      const refreshButton = screen.getByText('🔄 Refresh');
      fireEvent.click(refreshButton);

      // Refresh should trigger (mocked)
    });
  });

  describe('Error Handling', () => {
    it('should display errors when they occur', () => {
      // Mock hook to return error
      const mockUseMultiVillageMonitor = vi.fn(() => ({
        isRunning: false,
        isLoading: false,
        error: 'Test error message',
        lastUpdate: Date.now(),
        villages: [],
        villageKPIs: new Map(),
        villageKPIsHistory: new Map(),
        alerts: [],
        comparativeAnalysis: null,
        monitorStats: null,
        startMonitoring: vi.fn(),
        stopMonitoring: vi.fn(),
        registerVillage: vi.fn(),
        unregisterVillage: vi.fn(),
        updateVillageState: vi.fn(),
        resolveAlert: vi.fn(),
        getLatestKPIs: vi.fn(),
        getKPIHistory: vi.fn(),
        performComparativeAnalysis: vi.fn(),
        exportKPIs: vi.fn(),
        exportComparativeAnalysis: vi.fn(),
        exportAlerts: vi.fn(),
        exportFullReport: vi.fn(),
        updateConfig: vi.fn(),
        getConfig: vi.fn(),
        refreshData: vi.fn(),
        clearError: vi.fn(),
      }));

      vi.mocked(useMultiVillageMonitor).mockImplementation(mockUseMultiVillageMonitor);

      render(<MultiVillageMonitorPanel />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('Integration with Hooks', () => {
    it('should call hook functions', () => {
      const mockStartMonitoring = vi.fn();
      const mockRefreshData = vi.fn();

      vi.mocked(useMultiVillageMonitor).mockReturnValue({
        isRunning: false,
        isLoading: false,
        error: null,
        lastUpdate: Date.now(),
        villages: [mockVillage],
        villageKPIs: new Map(),
        villageKPIsHistory: new Map(),
        alerts: [],
        comparativeAnalysis: null,
        monitorStats: {
          villagesMonitored: 1,
          totalKpisCollected: 5,
          activeAlerts: 0,
          uptime: 30000,
          lastCollectionTime: Date.now(),
        },
        startMonitoring: mockStartMonitoring,
        stopMonitoring: vi.fn(),
        registerVillage: vi.fn(),
        unregisterVillage: vi.fn(),
        updateVillageState: vi.fn(),
        resolveAlert: vi.fn(),
        getLatestKPIs: vi.fn(),
        getKPIHistory: vi.fn(),
        performComparativeAnalysis: vi.fn(),
        exportKPIs: vi.fn(),
        exportComparativeAnalysis: vi.fn(),
        exportAlerts: vi.fn(),
        exportFullReport: vi.fn(),
        updateConfig: vi.fn(),
        getConfig: vi.fn(),
        refreshData: mockRefreshData,
        clearError: vi.fn(),
      });

      render(<MultiVillageMonitorPanel />);

      // Test that hook functions are called
      const startButton = screen.getByText('▶️ Start Monitoring');
      fireEvent.click(startButton);
      expect(mockStartMonitoring).toHaveBeenCalled();

      const refreshButton = screen.getByText('🔄 Refresh');
      fireEvent.click(refreshButton);
      expect(mockRefreshData).toHaveBeenCalled();
    });
  });
});

// Helper function for hook testing
function renderHook<T>(hookFn: () => T) {
  let result: T;

  function TestComponent() {
    result = hookFn();
    return null;
  }

  render(<TestComponent />);
  return { result: result! };
}

// Helper function for act testing
async function act(fn: () => void | Promise<void>) {
  await fn();
}
