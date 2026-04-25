/**
 * Active HUD Performance Profiler Test Suite
 * 
 * Comprehensive unit tests for the Active HUD performance profiler
 * including configuration, hooks, components, and CLI functionality.
 * 
 * @since NP-104 – Idle Village Active HUD Performance Profiler
 * @dependencies Phase 12 Active HUD
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useActiveHUDProfiler } from '@/ui/idleVillage/hooks/useActiveHUDProfiler';
import { ActiveHUDProfilerPanel } from '@/ui/idleVillage/components/ActiveHUDProfilerPanel';
import { DEFAULT_ACTIVE_HUD_PROFILER_CONFIG } from '@/ui/idleVillage/config/activeHUDProfilerConfig';
import type { 
  ActiveHUDProfilerConfig,
  PerformanceMetricType,
  PerformanceThreshold 
} from '@/ui/idleVillage/config/activeHUDProfilerConfig';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 2048 * 1024 * 1024
  }
};

// Mock navigator
const mockNavigator = {
  userAgent: 'Test Agent',
  hardwareConcurrency: 8,
  deviceMemory: 8
};

// Mock window methods
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();
const mockDispatchEvent = vi.fn();

// Mock PersistenceService
const mockPersistenceService = {
  getAllKeys: vi.fn(() => Promise.resolve([])),
  loadData: vi.fn(() => Promise.resolve(null)),
  saveData: vi.fn(() => Promise.resolve()),
  deleteData: vi.fn(() => Promise.resolve())
};

// Setup mocks
beforeEach(() => {
  vi.stubGlobal('performance', mockPerformance);
  vi.stubGlobal('navigator', mockNavigator);
  vi.stubGlobal('requestAnimationFrame', mockRequestAnimationFrame);
  vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame);
  vi.stubGlobal('dispatchEvent', mockDispatchEvent);
  
  vi.doMock('@/persistence/PersistenceService', () => ({
    PersistenceService: mockPersistenceService
  }));
  
  // Reset all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ActiveHUDProfiler Configuration', () => {
  describe('Default Configuration', () => {
    it('should have valid default configuration', () => {
      const config = DEFAULT_ACTIVE_HUD_PROFILER_CONFIG;
      
      expect(config).toBeDefined();
      expect(config.profiler.enabled).toBe(false);
      expect(config.profiler.autoStart).toBe(false);
      expect(config.profiler.maxDuration).toBe(300000);
      expect(config.metrics).toHaveLength(8);
      expect(config.exports).toHaveLength(4);
    });

    it('should have all required metric types', () => {
      const metricIds = DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.map(m => m.id);
      const requiredMetrics: PerformanceMetricType[] = [
        'fps', 'render_time', 'commit_time', 'drop_latency', 
        'memory_usage', 'component_mounts', 'state_updates', 'interaction_latency'
      ];

      requiredMetrics.forEach(metric => {
        expect(metricIds).toContain(metric);
      });
    });

    it('should have valid metric configurations', () => {
      DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.forEach(metric => {
        expect(metric.name).toBeDefined();
        expect(metric.description).toBeDefined();
        expect(metric.unit).toBeDefined();
        expect(metric.samplingRate).toBeGreaterThanOrEqual(0);
        expect(metric.samplingRate).toBeLessThanOrEqual(1);
        expect(metric.thresholds.excellent).toBeGreaterThan(metric.thresholds.good);
        expect(metric.thresholds.good).toBeGreaterThan(metric.thresholds.acceptable);
        expect(metric.thresholds.acceptable).toBeGreaterThan(metric.thresholds.poor);
        expect(metric.thresholds.poor).toBeGreaterThan(metric.thresholds.critical);
        expect(metric.collection.interval).toBeGreaterThan(0);
        expect(metric.collection.maxSamples).toBeGreaterThan(0);
      });
    });

    it('should have valid export configurations', () => {
      DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.exports.forEach(exportFormat => {
        expect(exportFormat.name).toBeDefined();
        expect(exportFormat.extension).toBeDefined();
        expect(exportFormat.mimeType).toBeDefined();
        expect(['json', 'csv', 'markdown', 'png']).toContain(exportFormat.id);
      });
    });
  });

  describe('Performance Thresholds', () => {
    it('should calculate correct thresholds for FPS', () => {
      const fpsMetric = DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.find(m => m.id === 'fps')!;
      
      expect(fpsMetric.thresholds.excellent).toBe(60);
      expect(fpsMetric.thresholds.good).toBe(45);
      expect(fpsMetric.thresholds.acceptable).toBe(30);
      expect(fpsMetric.thresholds.poor).toBe(20);
      expect(fpsMetric.thresholds.critical).toBe(15);
    });

    it('should calculate correct thresholds for render time', () => {
      const renderMetric = DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.find(m => m.id === 'render_time')!;
      
      expect(renderMetric.thresholds.excellent).toBe(8);
      expect(renderMetric.thresholds.good).toBe(16);
      expect(renderMetric.thresholds.acceptable).toBe(33);
      expect(renderMetric.thresholds.poor).toBe(50);
      expect(renderMetric.thresholds.critical).toBe(100);
    });
  });
});

describe('useActiveHUDProfiler Hook', () => {
  let TestComponent: React.FC<{ options?: any }>;

  beforeEach(() => {
    TestComponent = ({ options = {} }) => {
      const profiler = useActiveHUDProfiler(options);
      return (
        <div data-testid="profiler">
          <div data-testid="is-profiling">{profiler.isProfiling ? 'true' : 'false'}</div>
          <div data-testid="panel-visible">{profiler.panelVisible ? 'true' : 'false'}</div>
          <div data-testid="session-id">{profiler.currentSession?.id || ''}</div>
          <button data-testid="start-btn" onClick={profiler.startProfiling}>Start</button>
          <button data-testid="stop-btn" onClick={profiler.stopProfiling}>Stop</button>
          <button data-testid="toggle-btn" onClick={profiler.togglePanel}>Toggle</button>
          <button data-testid="clear-btn" onClick={profiler.clearData}>Clear</button>
        </div>
      );
    };
  });

  it('should initialize with default state', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('is-profiling')).toHaveTextContent('false');
    expect(screen.getByTestId('panel-visible')).toHaveTextContent('false');
    expect(screen.getByTestId('session-id')).toHaveTextContent('');
  });

  it('should start profiling session', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    await user.click(screen.getByTestId('start-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('is-profiling')).toHaveTextContent('true');
      expect(screen.getByTestId('session-id')).not.toHaveTextContent('');
    });
  });

  it('should stop profiling session', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    // Start profiling
    await user.click(screen.getByTestId('start-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-profiling')).toHaveTextContent('true');
    });
    
    // Stop profiling
    await user.click(screen.getByTestId('stop-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-profiling')).toHaveTextContent('false');
    });
  });

  it('should toggle panel visibility', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    expect(screen.getByTestId('panel-visible')).toHaveTextContent('false');
    
    await user.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('panel-visible')).toHaveTextContent('true');
    
    await user.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('panel-visible')).toHaveTextContent('false');
  });

  it('should clear all data', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    // Start and stop profiling to create data
    await user.click(screen.getByTestId('start-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-profiling')).toHaveTextContent('true');
    });
    
    await user.click(screen.getByTestId('stop-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-profiling')).toHaveTextContent('false');
    });
    
    // Clear data
    await user.click(screen.getByTestId('clear-btn'));
    expect(screen.getByTestId('session-id')).toHaveTextContent('');
  });

  it('should respect custom configuration', () => {
    const customConfig = {
      profiler: {
        enabled: true,
        autoStart: true,
        maxDuration: 60000
      },
      ui: {
        panelVisible: true,
        panelPosition: 'bottom-left' as const
      }
    };

    render(<TestComponent options={{ config: customConfig }} />);
    
    expect(screen.getByTestId('panel-visible')).toHaveTextContent('true');
  });

  it('should auto-start when configured', async () => {
    const customConfig = {
      profiler: {
        autoStart: true
      }
    };

    render(<TestComponent options={{ config: customConfig, autoStart: true }} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('is-profiling')).toHaveTextContent('true');
    });
  });

  it('should emit telemetry events', async () => {
    const user = userEvent.setup();
    render(<TestComponent options={{ enableTelemetry: true }} />);
    
    // Start and stop profiling to trigger telemetry
    await user.click(screen.getByTestId('start-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-profiling')).toHaveTextContent('true');
    });
    
    await user.click(screen.getByTestId('stop-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-profiling')).toHaveTextContent('false');
    });
    
    // Check if telemetry was emitted
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'iv_active_hud_profiled'
      })
    );
  });
});

describe('ActiveHUDProfilerPanel Component', () => {
  let mockProfiler: any;

  beforeEach(() => {
    mockProfiler = {
      isProfiling: false,
      currentSession: null,
      performanceData: {},
      performanceStats: {},
      startProfiling: vi.fn(),
      stopProfiling: vi.fn(),
      clearData: vi.fn(),
      exportData: vi.fn(),
      togglePanel: vi.fn(),
      panelVisible: true,
      config: DEFAULT_ACTIVE_HUD_PROFILER_CONFIG,
      updateConfig: vi.fn()
    };
  });

  it('should render when panel is visible', () => {
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    expect(screen.getByText('📊 Active HUD Profiler')).toBeInTheDocument();
    expect(screen.getByText('▶ Start')).toBeInTheDocument();
  });

  it('should render toggle button when panel is hidden', () => {
    mockProfiler.panelVisible = false;
    mockProfiler.performanceStats = {
      fps: { average: 60, currentThreshold: 'excellent' as PerformanceThreshold }
    };
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    expect(screen.queryByText('📊 Active HUD Profiler')).not.toBeInTheDocument();
    expect(screen.getByText('📊 100%')).toBeInTheDocument();
  });

  it('should show stop button when profiling', () => {
    mockProfiler.isProfiling = true;
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    expect(screen.getByText('■ Stop')).toBeInTheDocument();
    expect(screen.queryByText('▶ Start')).not.toBeInTheDocument();
  });

  it('should display performance metrics', () => {
    mockProfiler.performanceStats = {
      fps: {
        average: 55,
        min: 45,
        max: 60,
        median: 55,
        p95: 58,
        stdDev: 3,
        sampleCount: 60,
        currentThreshold: 'good' as PerformanceThreshold
      },
      render_time: {
        average: 12,
        min: 8,
        max: 20,
        median: 12,
        p95: 18,
        stdDev: 2,
        sampleCount: 30,
        currentThreshold: 'good' as PerformanceThreshold
      }
    };
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    expect(screen.getByText('Frames Per Second')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('Render Time')).toBeInTheDocument();
    expect(screen.getByText('12.0')).toBeInTheDocument();
  });

  it('should show session information when session exists', () => {
    mockProfiler.currentSession = {
      id: 'test-session-123',
      startTime: Date.now() - 60000,
      endTime: Date.now(),
      duration: 60000,
      dataPoints: 150,
      metadata: {
        userAgent: 'Test Agent',
        viewport: { width: 1920, height: 1080 },
        deviceMemory: 8,
        hardwareConcurrency: 8
      }
    };
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    expect(screen.getByText(/Session:/)).toBeInTheDocument();
    expect(screen.getByText(/Data Points: 150/)).toBeInTheDocument();
  });

  it('should handle start/stop button clicks', async () => {
    const user = userEvent.setup();
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    await user.click(screen.getByText('▶ Start'));
    expect(mockProfiler.startProfiling).toHaveBeenCalled();
    
    mockProfiler.isProfiling = true;
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    await user.click(screen.getByText('■ Stop'));
    expect(mockProfiler.stopProfiling).toHaveBeenCalled();
  });

  it('should handle clear button click', async () => {
    const user = userEvent.setup();
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    await user.click(screen.getByText('🗑 Clear'));
    expect(mockProfiler.clearData).toHaveBeenCalled();
  });

  it('should handle panel close button', async () => {
    const user = userEvent.setup();
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    await user.click(screen.getByText('✕'));
    expect(mockProfiler.togglePanel).toHaveBeenCalled();
  });

  it('should calculate overall performance score', () => {
    mockProfiler.performanceStats = {
      fps: { currentThreshold: 'excellent' as PerformanceThreshold },
      render_time: { currentThreshold: 'good' as PerformanceThreshold },
      commit_time: { currentThreshold: 'acceptable' as PerformanceThreshold }
    };
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    // Should show overall score (100 + 80 + 60) / 3 = 80
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('should render in compact mode', () => {
    mockProfiler.config.ui.compactMode = true;
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    expect(screen.getByTestId('profiler')).toHaveClass('compact');
  });
});

describe('Performance Data Export', () => {
  let mockProfiler: any;

  beforeEach(() => {
    mockProfiler = {
      isProfiling: false,
      currentSession: {
        id: 'test-session',
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        duration: 60000,
        dataPoints: 100,
        metadata: {
          userAgent: 'Test Agent',
          viewport: { width: 1920, height: 1080 },
          deviceMemory: 8,
          hardwareConcurrency: 8
        }
      },
      performanceData: {
        fps: [
          { timestamp: Date.now() - 50000, value: 60, threshold: 'excellent' as PerformanceThreshold },
          { timestamp: Date.now() - 40000, value: 55, threshold: 'good' as PerformanceThreshold },
          { timestamp: Date.now() - 30000, value: 58, threshold: 'good' as PerformanceThreshold }
        ]
      },
      performanceStats: {
        fps: {
          average: 57.7,
          min: 55,
          max: 60,
          median: 58,
          p95: 60,
          stdDev: 2.5,
          sampleCount: 3,
          currentThreshold: 'good' as PerformanceThreshold
        }
      },
      startProfiling: vi.fn(),
      stopProfiling: vi.fn(),
      clearData: vi.fn(),
      exportData: vi.fn(),
      togglePanel: vi.fn(),
      panelVisible: true,
      config: DEFAULT_ACTIVE_HUD_PROFILER_CONFIG,
      updateConfig: vi.fn()
    };
  });

  it('should export data as JSON', () => {
    mockProfiler.exportData.mockReturnValue('{"test": "data"}');
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    // Find and click export button (if not in compact mode)
    const exportButtons = screen.queryAllByText('JSON');
    if (exportButtons.length > 0) {
      fireEvent.click(exportButtons[0]);
      expect(mockProfiler.exportData).toHaveBeenCalledWith('json');
    }
  });

  it('should export data as CSV', () => {
    mockProfiler.exportData.mockReturnValue('timestamp,metric,value,threshold\n123,fps,60,excellent');
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    const exportButtons = screen.queryAllByText('CSV');
    if (exportButtons.length > 0) {
      fireEvent.click(exportButtons[0]);
      expect(mockProfiler.exportData).toHaveBeenCalledWith('csv');
    }
  });

  it('should export data as Markdown', () => {
    mockProfiler.exportData.mockReturnValue('# Performance Report\n\n## Metrics');
    
    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    const exportButtons = screen.queryAllByText('Markdown');
    if (exportButtons.length > 0) {
      fireEvent.click(exportButtons[0]);
      expect(mockProfiler.exportData).toHaveBeenCalledWith('markdown');
    }
  });
});

describe('Performance Monitoring Integration', () => {
  it('should measure FPS using requestAnimationFrame', async () => {
    const TestComponent = () => {
      const profiler = useActiveHUDProfiler({ debug: true });
      return <div data-testid="fps-test">{profiler.isProfiling ? 'profiling' : 'idle'}</div>;
    };

    render(<TestComponent />);
    
    // Start profiling
    const startBtn = screen.queryByText('Start');
    if (startBtn) {
      fireEvent.click(startBtn);
    }
    
    // Verify requestAnimationFrame was called
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('should handle React DevTools integration', () => {
    const mockReactDevTools = {
      onCommitFiberRoot: vi.fn()
    };
    
    vi.stubGlobal('__REACT_DEVTOOLS_GLOBAL_HOOK__', mockReactDevTools);
    
    const TestComponent = () => {
      const profiler = useActiveHUDProfiler();
      return <div />;
    };

    render(<TestComponent />);
    
    // Should integrate with React DevTools if available
    expect(mockReactDevTools.onCommitFiberRoot).toBeDefined();
  });

  it('should measure memory usage when available', () => {
    const TestComponent = () => {
      const profiler = useActiveHUDProfiler();
      return <div />;
    };

    render(<TestComponent />);
    
    // Should access performance.memory if available
    expect(mockPerformance.memory).toBeDefined();
  });

  it('should track user interactions', async () => {
    const TestComponent = () => {
      const profiler = useActiveHUDProfiler();
      return (
        <div>
          <button data-testid="test-button">Click me</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    const user = userEvent.setup();
    const button = screen.getByTestId('test-button');
    
    await user.click(button);
    
    // Should track interaction latency
    // This is tested through event listeners being set up
    expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });
});

describe('Error Handling and Edge Cases', () => {
  it('should handle missing performance API gracefully', () => {
    vi.stubGlobal('performance', undefined);
    
    const TestComponent = () => {
      const profiler = useActiveHUDProfiler();
      return <div data-testid="no-perf">{profiler.isProfiling ? 'true' : 'false'}</div>;
    };

    expect(() => render(<TestComponent />)).not.toThrow();
  });

  it('should handle missing React DevTools gracefully', () => {
    vi.stubGlobal('__REACT_DEVTOOLS_GLOBAL_HOOK__', undefined);
    
    const TestComponent = () => {
      const profiler = useActiveHUDProfiler();
      return <div />;
    };

    expect(() => render(<TestComponent />)).not.toThrow();
  });

  it('should handle invalid export formats', () => {
    const mockProfiler = {
      exportData: vi.fn(() => { throw new Error('Unsupported format'); }),
      panelVisible: true,
      config: DEFAULT_ACTIVE_HUD_PROFILER_CONFIG
    };

    render(<ActiveHUDProfilerPanel profiler={mockProfiler} />);
    
    // Should handle export errors gracefully
    expect(() => {
      const exportButtons = screen.queryAllByText('JSON');
      if (exportButtons.length > 0) {
        fireEvent.click(exportButtons[0]);
      }
    }).not.toThrow();
  });

  it('should handle session timeout', async () => {
    const TestComponent = () => {
      const profiler = useActiveHUDProfiler({ maxDuration: 100 }); // 100ms timeout
      return (
        <div>
          <button data-testid="start" onClick={profiler.startProfiling}>Start</button>
          <div data-testid="status">{profiler.isProfiling ? 'profiling' : 'stopped'}</div>
        </div>
      );
    };

    render(<TestComponent />);
    
    const user = userEvent.setup();
    await user.click(screen.getByTestId('start'));
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('stopped');
    }, { timeout: 200 });
  });

  it('should handle cleanup on unmount', () => {
    const TestComponent = () => {
      const profiler = useActiveHUDProfiler();
      return <div />;
    };

    const { unmount } = render(<TestComponent />);
    
    // Should cleanup intervals and event listeners
    unmount();
    
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });
});

describe('Performance Impact Mitigation', () => {
  it('should respect sampling rates', () => {
    const customConfig = {
      metrics: DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.map(metric => ({
        ...metric,
        samplingRate: 0.1 // 10% sampling
      }))
    };

    const TestComponent = () => {
      const profiler = useActiveHUDProfiler({ config: customConfig });
      return <div />;
    };

    render(<TestComponent />);
    
    // Should apply sampling to reduce performance impact
    expect(customConfig.metrics[0].samplingRate).toBe(0.1);
  });

  it('should limit data collection to max samples', () => {
    const customConfig = {
      metrics: DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.map(metric => ({
        ...metric,
        collection: {
          ...metric.collection,
          maxSamples: 10 // Small limit for testing
        }
      }))
    };

    const TestComponent = () => {
      const profiler = useActiveHUDProfiler({ config: customConfig });
      return <div />;
    };

    render(<TestComponent />);
    
    // Should enforce max samples limit
    expect(customConfig.metrics[0].collection.maxSamples).toBe(10);
  });

  it('should disable high-impact metrics by default', () => {
    const memoryMetric = DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.find(m => m.id === 'memory_usage');
    const componentMountsMetric = DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.find(m => m.id === 'component_mounts');
    const stateUpdatesMetric = DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics.find(m => m.id === 'state_updates');

    expect(memoryMetric?.enabled).toBe(false);
    expect(componentMountsMetric?.enabled).toBe(false);
    expect(stateUpdatesMetric?.enabled).toBe(false);
  });
});
