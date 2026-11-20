/**
 * Map Performance Profiler - Comprehensive Unit Tests
 *
 * Test suite for the Idle Village Map Performance Profiler (NP-024).
 * Covers configuration, engine, HUD, exporter, hooks, and components.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the sandbox diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance.now
global.performance = {
  now: vi.fn(() => Date.now()),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntries: vi.fn(() => []),
  setResourceTimingBufferSize: vi.fn(),
  toJSON: vi.fn(),
} as any;

import {
  DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
  PerformanceMetricType,
  PerformanceSeverity,
  generatePerformanceId,
  getPerformanceThreshold,
  getPerformanceSeverity,
  isOptimal,
  isAcceptable,
  requiresAttention,
  formatPerformanceValue,
  formatTimestamp,
  calculatePerformanceScore,
  generateRecommendations,
  validateProfilerConfig,
} from '@/ui/idleVillage/config/mapPerformanceProfilerConfig';

import { MapPerformanceProfilerEngine } from '@/ui/idleVillage/utils/mapPerformanceProfilerEngine';
import { MapPerformanceProfilerExporter } from '@/ui/idleVillage/utils/mapPerformanceProfilerExporter';
import { MapPerformanceProfilerHUD } from '@/ui/idleVillage/components/MapPerformanceProfilerHUD';
import { MapPerformanceProfiler } from '@/ui/idleVillage/components/MapPerformanceProfiler';
import { useMapPerformanceProfiler } from '@/ui/idleVillage/hooks/useMapPerformanceProfiler';

describe('Map Performance Profiler Configuration', () => {
  it('should have valid default configuration', () => {
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG).toBeDefined();
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.enabled).toBe(true);
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.autoStart).toBe(true);
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.realTime).toBe(true);
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.monitoring).toBeDefined();
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.visualization).toBeDefined();
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud).toBeDefined();
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.export).toBeDefined();
    expect(DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.analysis).toBeDefined();
  });

  it('should validate performance metric types', () => {
    expect(PerformanceMetricType.FPS).toBe('fps');
    expect(PerformanceMetricType.FRAME_TIME).toBe('frame_time');
    expect(PerformanceMetricType.MEMORY_USAGE).toBe('memory_usage');
    expect(PerformanceMetricType.CPU_USAGE).toBe('cpu_usage');
    expect(PerformanceMetricType.RENDER_TIME).toBe('render_time');
    expect(PerformanceMetricType.SCRIPT_TIME).toBe('script_time');
    expect(PerformanceMetricType.PAINT_TIME).toBe('paint_time');
    expect(PerformanceMetricType.LAYOUT_SHIFT).toBe('layout_shift');
    expect(PerformanceMetricType.LONG_TASKS).toBe('long_tasks');
    expect(PerformanceMetricType.INTERACTION_DELAY).toBe('interaction_delay');
    expect(PerformanceMetricType.NETWORK_REQUESTS).toBe('network_requests');
    expect(PerformanceMetricType.ANIMATION_FRAME_DROPS).toBe('animation_frame_drops');
  });

  it('should validate severity levels', () => {
    expect(PerformanceSeverity.GOOD).toBe('good');
    expect(PerformanceSeverity.WARNING).toBe('warning');
    expect(PerformanceSeverity.CRITICAL).toBe('critical');
    expect(PerformanceSeverity.UNKNOWN).toBe('unknown');
  });

  it('should generate unique performance IDs', () => {
    const id1 = generatePerformanceId();
    const id2 = generatePerformanceId();
    
    expect(id1).toMatch(/^perf-\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^perf-\d+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should get performance thresholds correctly', () => {
    const threshold = getPerformanceThreshold(PerformanceMetricType.FPS, 45);
    expect(threshold).toBeDefined();
    expect(threshold!.metric).toBe(PerformanceMetricType.FPS);
    expect(threshold!.severity).toBe(PerformanceSeverity.WARNING);
  });

  it('should get performance severity correctly', () => {
    expect(getPerformanceSeverity(PerformanceMetricType.FPS, 60)).toBe(PerformanceSeverity.GOOD);
    expect(getPerformanceSeverity(PerformanceMetricType.FPS, 30)).toBe(PerformanceSeverity.WARNING);
    expect(getPerformanceSeverity(PerformanceMetricType.FPS, 15)).toBe(PerformanceSeverity.CRITICAL);
  });

  it('should check optimal values correctly', () => {
    expect(isOptimal(PerformanceMetricType.FPS, 60)).toBe(true);
    expect(isOptimal(PerformanceMetricType.FPS, 30)).toBe(false);
    expect(isOptimal(PerformanceMetricType.FRAME_TIME, 16.67)).toBe(true);
    expect(isOptimal(PerformanceMetricType.FRAME_TIME, 50)).toBe(false);
  });

  it('should check acceptable values correctly', () => {
    expect(isAcceptable(PerformanceMetricType.FPS, 45)).toBe(true);
    expect(isAcceptable(PerformanceMetricType.FPS, 15)).toBe(false);
    expect(isAcceptable(PerformanceMetricType.FRAME_TIME, 33.33)).toBe(true);
    expect(isAcceptable(PerformanceMetricType.FRAME_TIME, 100)).toBe(false);
  });

  it('should check attention required values correctly', () => {
    expect(requiresAttention(PerformanceMetricType.FPS, 15)).toBe(true);
    expect(requiresAttention(PerformanceMetricType.FPS, 60)).toBe(false);
    expect(requiresAttention(PerformanceMetricType.FRAME_TIME, 100)).toBe(true);
    expect(requiresAttention(PerformanceMetricType.FRAME_TIME, 16.67)).toBe(false);
  });

  it('should format performance values correctly', () => {
    expect(formatPerformanceValue(PerformanceMetricType.FPS, 60)).toBe('60');
    expect(formatPerformanceValue(PerformanceMetricType.FRAME_TIME, 16.67)).toBe('16.67ms');
    expect(formatPerformanceValue(PerformanceMetricType.MEMORY_USAGE, 1024)).toBe('1.00MB');
    expect(formatPerformanceValue(PerformanceMetricType.CPU_USAGE, 75.5)).toBe('75.5%');
  });

  it('should format timestamps correctly', () => {
    const timestamp = Date.now();
    const formatted = formatTimestamp(timestamp);
    expect(formatted).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2}/);
  });

  it('should calculate performance score correctly', () => {
    const metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 100,
      cpuUsage: 25,
      renderTime: 8,
      scriptTime: 8,
      paintTime: 8,
      layoutShift: 0,
      longTasks: 0,
      interactionDelay: 50,
      networkRequests: 5,
      animationFrameDrops: 0,
      junk: 0,
      duration: 16.67,
      totalDuration: 1000,
      selfTime: 16.67,
      timestamp: Date.now(),
    };

    const score = calculatePerformanceScore(metrics);
    expect(score).toBe(100);
  });

  it('should generate recommendations correctly', () => {
    const metrics = {
      fps: 15,
      frameTime: 66.67,
      memoryUsage: 600,
      cpuUsage: 85,
      renderTime: 50,
      scriptTime: 50,
      paintTime: 50,
      layoutShift: 5,
      longTasks: 150,
      interactionDelay: 250,
      networkRequests: 60,
      animationFrameDrops: 15,
      junk: 60,
      duration: 66.67,
      totalDuration: 1000,
      selfTime: 66.67,
      timestamp: Date.now(),
    };

    const recommendations = generateRecommendations([metrics]);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].severity).toBe(PerformanceSeverity.CRITICAL);
  });

  it('should validate profiler configuration correctly', () => {
    const validConfig = {
      visualization: {
        opacity: 0.9,
        fontSize: 12,
        maxWidth: 300,
        maxHeight: 200,
      },
      hud: {
        width: 300,
        height: 200,
        opacity: 0.9,
      },
      export: {
        maxRecords: 10000,
        decimalPlaces: 2,
      },
      monitoring: {
        sampleRate: 60,
        bufferSize: 1000,
        maxBufferAge: 60000,
      },
    };

    const result = validateProfilerConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject invalid profiler configuration', () => {
    const invalidConfig = {
      visualization: {
        opacity: 1.5, // Invalid: > 1
        fontSize: 30, // Invalid: > 24
        maxWidth: 50, // Invalid: < 100
        maxHeight: 20, // Invalid: < 50
      },
      hud: {
        width: 700, // Invalid: > 600
        height: 500, // Invalid: > 400
        opacity: 1.5, // Invalid: > 1
      },
      export: {
        maxRecords: 50, // Invalid: < 100
        decimalPlaces: 10, // Invalid: > 6
      },
      monitoring: {
        sampleRate: 150, // Invalid: > 120
        bufferSize: 50, // Invalid: < 100
        maxBufferAge: 500, // Invalid: < 1000
      },
    };

    const result = validateProfilerConfig(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Map Performance Profiler Engine', () => {
  let engine: MapPerformanceProfilerEngine;

  beforeEach(() => {
    engine = new MapPerformanceProfilerEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it('should initialize with default state', () => {
    expect(engine.isObserving).toBe(false);
    expect(engine.getFrameBuffer()).toEqual([]);
    expect(engine.getStatistics().totalFrames).toBe(0);
  });

  it('should start and stop monitoring', () => {
    engine.start();
    expect(engine.isObserving).toBe(true);
    
    engine.stop();
    expect(engine.isObserving).toBe(false);
  });

  it('should update configuration', () => {
    const newConfig = {
      monitoring: {
        sampleRate: 30,
        bufferSize: 500,
      },
    };

    engine.updateConfig(newConfig);
    const config = engine.getConfig();
    expect(config.monitoring.sampleRate).toBe(30);
    expect(config.monitoring.bufferSize).toBe(500);
  });

  it('should get current metrics', () => {
    const metrics = engine.getCurrentMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.fps).toBe(0);
    expect(metrics.frameTime).toBe(0);
  });

  it('should get recent entries', () => {
    const entries = engine.getRecentEntries(10);
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeLessThanOrEqual(10);
  });

  it('should clear data', () => {
    engine.clearData();
    expect(engine.getFrameBuffer()).toEqual([]);
    expect(engine.getStatistics().totalFrames).toBe(0);
  });

  it('should export data', () => {
    const data = engine.exportData();
    expect(data).toBeDefined();
    expect(data.entries).toEqual([]);
    expect(data.statistics).toBeDefined();
    expect(data.config).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it('should handle event listeners', () => {
    const mockListener = vi.fn();
    
    engine.addEventListener('metrics-updated', mockListener);
    engine.removeEventListener('metrics-updated', mockListener);
    
    // Should not throw
    expect(() => {
      engine.addEventListener('error', vi.fn());
    }).not.toThrow();
  });
});

describe('Map Performance Profiler Exporter', () => {
  let exporter: MapPerformanceProfilerExporter;

  beforeEach(() => {
    exporter = new MapPerformanceProfilerExporter();
  });

  it('should initialize with default configuration', () => {
    const config = exporter.getConfig();
    expect(config).toBeDefined();
    expect(config.enabled).toBe(true);
    expect(config.format).toBe('csv');
  });

  it('should export to CSV format', () => {
    const data = {
      entries: [
        {
          frameNumber: 1,
          timestamp: Date.now(),
          duration: 16.67,
          metrics: {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 100,
            cpuUsage: 25,
            renderTime: 8,
            scriptTime: 8,
            paintTime: 8,
            layoutShift: 0,
            longTasks: 0,
            interactionDelay: 50,
            networkRequests: 5,
            animationFrameDrops: 0,
            junk: 0,
            duration: 16.67,
            totalDuration: 1000,
            selfTime: 16.67,
            timestamp: Date.now(),
          },
          severity: 'good',
          recommendations: [],
        },
      ],
      statistics: {
        totalFrames: 1,
        averageFps: 60,
        averageFrameTime: 16.67,
        maxFrameTime: 16.67,
        minFrameTime: 16.67,
        p95FrameTime: 16.67,
        p99FrameTime: 16.67,
        averageMemoryUsage: 100,
        peakMemoryUsage: 100,
        averageCpuUsage: 25,
        totalJank: 0,
        totalLongTasks: 0,
        totalAnimationDrops: 0,
        sessionDuration: 1000,
        recommendations: [],
      },
      recommendations: [],
      config: DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
      timestamp: Date.now(),
    };

    const csv = exporter.exportToCSV(data);
    expect(csv).toContain('timestamp,frameNumber,duration,fps,frameTime');
    expect(csv).toContain('60,16.67ms');
  });

  it('should export to JSON format', () => {
    const data = {
      entries: [],
      statistics: {
        totalFrames: 0,
        averageFps: 0,
        averageFrameTime: 0,
        maxFrameTime: 0,
        minFrameTime: 0,
        p95FrameTime: 0,
        p99FrameTime: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        averageCpuUsage: 0,
        totalJank: 0,
        totalLongTasks: 0,
        totalAnimationDrops: 0,
        sessionDuration: 0,
        recommendations: [],
      },
      recommendations: [],
      config: DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
      timestamp: Date.now(),
    };

    const json = exporter.exportToJSON(data);
    expect(json).toContain('"metadata"');
    expect(json).toContain('"statistics"');
    expect(json).toContain('"entries"');
  });

  it('should generate filename correctly', () => {
    const filename = exporter.generateFilename('csv');
    expect(filename).toMatch(/^performance-data-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.csv$/);
  });

  it('should update configuration', () => {
    const newConfig = {
      format: 'json',
      filename: 'custom-metrics',
    };

    exporter.updateConfig(newConfig);
    const config = exporter.getConfig();
    expect(config.format).toBe('json');
    expect(config.filename).toBe('custom-metrics');
  });
});

describe('Map Performance Profiler HUD', () => {
  const mockMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 100,
    cpuUsage: 25,
    renderTime: 8,
    scriptTime: 8,
    paintTime: 8,
    layoutShift: 0,
    longTasks: 0,
    interactionDelay: 50,
    networkRequests: 5,
    animationFrameDrops: 0,
    junk: 0,
    duration: 16.67,
    totalDuration: 1000,
    selfTime: 16.67,
    timestamp: Date.now(),
  };

  const mockStatistics = {
    totalFrames: 1000,
    averageFps: 60,
    averageFrameTime: 16.67,
    maxFrameTime: 33.33,
    minFrameTime: 8.33,
    p95FrameTime: 25.00,
    p99FrameTime: 30.00,
    averageMemoryUsage: 100,
    peakMemoryUsage: 150,
    averageCpuUsage: 25,
    totalJank: 0,
    totalLongTasks: 5,
    totalAnimationDrops: 2,
    sessionDuration: 60000,
    recommendations: [],
  };

  it('should render HUD with metrics', () => {
    render(
      <MapPerformanceProfilerHUD
        metrics={mockMetrics}
        statistics={mockStatistics}
        recommendations={[]}
        visible={true}
      />
    );

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('16.67ms')).toBeInTheDocument();
  });

  it('should render compact HUD', () => {
    render(
      <MapPerformanceProfilerHUD
        metrics={mockMetrics}
        statistics={mockStatistics}
        recommendations={[]}
        visible={true}
        compact={true}
      />
    );

    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('should handle toggle visibility', () => {
    const onToggle = vi.fn();
    
    render(
      <MapPerformanceProfilerHUD
        metrics={mockMetrics}
        statistics={mockStatistics}
        recommendations={[]}
        visible={true}
        onToggle={onToggle}
      />
    );

    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
    
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('should handle export actions', () => {
    const onExport = vi.fn();
    
    render(
      <MapPerformanceProfilerHUD
        metrics={mockMetrics}
        statistics={mockStatistics}
        recommendations={[]}
        visible={true}
        onExport={onExport}
      />
    );

    const csvButton = screen.getByText('CSV');
    fireEvent.click(csvButton);
    
    expect(onExport).toHaveBeenCalledWith('csv');
  });

  it('should handle clear action', () => {
    const onClear = vi.fn();
    
    render(
      <MapPerformanceProfilerHUD
        metrics={mockMetrics}
        statistics={mockStatistics}
        recommendations={[]}
        visible={true}
        onClear={onClear}
      />
    );

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    expect(onClear).toHaveBeenCalled();
  });

  it('should render recommendations', () => {
    const recommendations = [
      {
        id: 'test-1',
        type: PerformanceMetricType.FPS,
        severity: PerformanceSeverity.WARNING,
        title: 'Low FPS Detected',
        description: 'Frame rate is below optimal',
        suggestion: 'Enable hardware acceleration',
        impact: 'medium',
        automated: false,
        applied: false,
      },
    ];

    render(
      <MapPerformanceProfilerHUD
        metrics={mockMetrics}
        statistics={mockStatistics}
        recommendations={recommendations}
        visible={true}
      />
    );

    expect(screen.getByText('Low FPS Detected')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });
});

describe('Map Performance Profiler Component', () => {
  it('should render with default props', () => {
    render(<MapPerformanceProfiler visible={true} />);
    
    // Should not throw and should render performance score indicator
    expect(document.querySelector('.fixed')).toBeInTheDocument();
  });

  it('should render with custom configuration', () => {
    const config = {
      hud: {
        width: 400,
        height: 300,
        position: 'top-left',
      },
    };

    render(
      <MapPerformanceProfiler
        visible={true}
        config={config}
      />
    );

    expect(document.querySelector('.fixed')).toBeInTheDocument();
  });

  it('should handle start/stop actions', async () => {
    render(<MapPerformanceProfiler visible={true} />);
    
    const startButton = screen.getByText('Start');
    await userEvent.click(startButton);
    
    // Should not throw
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('should handle export actions', async () => {
    render(<MapPerformanceProfiler visible={true} showExport={true} />);
    
    const exportCSVButton = screen.getByText('Export CSV');
    await userEvent.click(exportCSVButton);
    
    // Should not throw
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('should handle analysis actions', async () => {
    render(<MapPerformanceProfiler visible={true} showAnalysis={true} />);
    
    const analyzeButton = screen.getByText('Analyze Performance');
    await userEvent.click(analyzeButton);
    
    // Should not throw
    expect(screen.getByText('Analyze Performance')).toBeInTheDocument();
  });

  it('should render compact variant', () => {
    render(<CompactMapPerformanceProfiler visible={true} />);
    
    expect(document.querySelector('.fixed')).toBeInTheDocument();
  });

  it('should render full-screen variant', () => {
    render(<FullScreenMapPerformanceProfiler visible={true} />);
    
    expect(document.querySelector('.inset-0')).toBeInTheDocument();
  });

  it('should render floating variant', () => {
    render(<FloatingMapPerformanceProfiler visible={true} />);
    
    expect(document.querySelector('.fixed')).toBeInTheDocument();
  });

  it('should render minimal variant', () => {
    render(<MinimalMapPerformanceProfiler visible={true} />);
    
    expect(document.querySelector('.fixed')).toBeInTheDocument();
  });
});

describe('useMapPerformanceProfiler Hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    expect(result.current.isRunning).toBe(false);
    expect(result.current.metrics.fps).toBe(0);
    expect(result.current.statistics.totalFrames).toBe(0);
    expect(result.current.recommendations).toEqual([]);
  });

  it('should start and stop profiler', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    act(() => {
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);
    
    act(() => {
      result.current.stop();
    });
    expect(result.current.isRunning).toBe(false);
  });

  it('should toggle HUD visibility', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    act(() => {
      result.current.toggleHUD();
    });
    expect(result.current.isHUDVisible).toBe(false);
  });

  it('should toggle compact mode', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    act(() => {
      result.current.toggleCompact();
    });
    expect(result.current.isCompactMode).toBe(true);
  });

  it('should clear data', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    act(() => {
      result.current.clearData();
    });
    expect(result.current.statistics.totalFrames).toBe(0);
  });

  it('should export data', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    act(() => {
      result.current.exportData('csv');
    });
    
    // Should not throw
    expect(result.current.statistics.totalFrames).toBe(0);
  });

  it('should update configuration', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    const newConfig = {
      monitoring: {
        sampleRate: 30,
      },
    };

    act(() => {
      result.current.updateConfig(newConfig);
    });
    
    const config = result.current.getConfig();
    expect(config.monitoring.sampleRate).toBe(30);
  });

  it('should analyze performance', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    const analysis = result.current.analyzePerformance();
    expect(analysis).toBeDefined();
  });

  it('should get recent entries', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    const entries = result.current.getRecentEntries(10);
    expect(Array.isArray(entries)).toBe(true);
  });
});

describe('Performance Metrics Display Component', () => {
  const mockMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 100,
    cpuUsage: 25,
    renderTime: 8,
    scriptTime: 8,
    paintTime: 8,
    layoutShift: 0,
    longTasks: 0,
    interactionDelay: 50,
    networkRequests: 5,
    animationFrameDrops: 0,
    junk: 0,
    duration: 16.67,
    totalDuration: 1000,
    selfTime: 16.67,
    timestamp: Date.now(),
  };

  it('should render metrics display', () => {
    render(<PerformanceMetricsDisplay metrics={mockMetrics} />);
    
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('FPS:')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(<PerformanceMetricsDisplay metrics={mockMetrics} showTitle={false} />);
    
    expect(screen.queryByText('Performance Metrics')).not.toBeInTheDocument();
    expect(screen.getByText('FPS:')).toBeInTheDocument();
  });

  it('should render without details', () => {
    render(<PerformanceMetricsDisplay metrics={mockMetrics} showDetails={false} />);
    
    expect(screen.getByText('FPS:')).toBeInTheDocument();
    expect(screen.getByText('Render:')).not.toBeInTheDocument();
  });
});

describe('Performance Recommendations Display Component', () => {
  const mockRecommendations = [
    {
      id: 'test-1',
      type: PerformanceMetricType.FPS,
      severity: PerformanceSeverity.WARNING,
      title: 'Low FPS Detected',
      description: 'Frame rate is below optimal',
      suggestion: 'Enable hardware acceleration',
      impact: 'medium',
      automated: false,
      applied: false,
    },
  ];

  it('should render recommendations display', () => {
    render(<PerformanceRecommendationsDisplay recommendations={mockRecommendations} />);
    
    expect(screen.getByText('Performance Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Low FPS Detected')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(<PerformanceRecommendationsDisplay recommendations={mockRecommendations} showTitle={false} />);
    
    expect(screen.queryByText('Performance Recommendations')).not.toBeInTheDocument();
    expect(screen.getByText('Low FPS Detected')).toBeInTheDocument();
  });

  it('should render without impact', () => {
    render(<PerformanceRecommendationsDisplay recommendations={mockRecommendations} showImpact={false} />);
    
    expect(screen.getByText('Low FPS Detected')).toBeInTheDocument();
    expect(screen.queryByText('medium')).not.toBeInTheDocument();
  });

  it('should render applied status', () => {
    const appliedRecommendations = [
      {
        ...mockRecommendations[0],
        applied: true,
      },
    ];

    render(<PerformanceRecommendationsDisplay recommendations={appliedRecommendations} showApplied={true} />);
    
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(<PerformanceRecommendationsDisplay recommendations={[]} />);
    
    expect(screen.getByText('No recommendations available')).toBeInTheDocument();
  });
});

describe('Performance Statistics Display Component', () => {
  const mockStatistics = {
    totalFrames: 1000,
    averageFps: 60,
    averageFrameTime: 16.67,
    maxFrameTime: 33.33,
    minFrameTime: 8.33,
    p95FrameTime: 25.00,
    p99FrameTime: 30.00,
    averageMemoryUsage: 100,
    peakMemoryUsage: 150,
    averageCpuUsage: 25,
    totalJank: 0,
    totalLongTasks: 5,
    totalAnimationDrops: 2,
    sessionDuration: 60000,
    recommendations: [],
  };

  it('should render statistics display', () => {
    render(<PerformanceStatisticsDisplay statistics={mockStatistics} />);
    
    expect(screen.getByText('Performance Statistics')).toBeInTheDocument();
    expect(screen.getByText('Session Duration:')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(<PerformanceStatisticsDisplay statistics={mockStatistics} showTitle={false} />);
    
    expect(screen.queryByText('Performance Statistics')).not.toBeInTheDocument();
    expect(screen.getByText('Session Duration:')).toBeInTheDocument();
  });

  it('should render without details', () => {
    render(<PerformanceStatisticsDisplay statistics={mockStatistics} showDetails={false} />);
    
    expect(screen.getByText('Session Duration:')).toBeInTheDocument();
    expect(screen.getByText('Max Frame Time:')).not.toBeInTheDocument();
  });

  it('should render empty state', () => {
    const emptyStatistics = {
      totalFrames: 0,
      averageFps: 0,
      averageFrameTime: 0,
      maxFrameTime: 0,
      minFrameTime: 0,
      p95FrameTime: 0,
      p99FrameTime: 0,
      averageMemoryUsage: 0,
      peakMemoryUsage: 0,
      averageCpuUsage: 0,
      totalJank: 0,
      totalLongTasks: 0,
      totalAnimationDrops: 0,
      sessionDuration: 0,
      recommendations: [],
    };

    render(<PerformanceStatisticsDisplay statistics={emptyStatistics} />);
    
    expect(screen.getByText('No statistics available')).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  it('should handle complete profiler workflow', async () => {
    const { result } = renderHook(() => useMapPerformanceProfiler({
      autoStart: true,
    }));

    // Should auto-start
    expect(result.current.isRunning).toBe(true);

    // Should have metrics
    expect(result.current.metrics).toBeDefined();

    // Should be able to export
    act(() => {
      result.current.exportData('csv');
    });

    // Should be able to analyze
    const analysis = result.current.analyzePerformance();
    expect(analysis).toBeDefined();

    // Should be able to stop
    act(() => {
      result.current.stop();
    });
    expect(result.current.isRunning).toBe(false);
  });

  it('should handle configuration changes', async () => {
    const { result, rerender } = renderHook(
      (config) => useMapPerformanceProfiler(config),
      { initialProps: {} }
    );

    const initialConfig = result.current.getConfig();
    expect(initialConfig.monitoring.sampleRate).toBe(60);

    rerender({
      monitoring: {
        sampleRate: 30,
      },
    });

    const updatedConfig = result.current.getConfig();
    expect(updatedConfig.monitoring.sampleRate).toBe(30);
  });

  it('should handle event callbacks', async () => {
    const onMetricsUpdated = vi.fn();
    const onThresholdExceeded = vi.fn();
    const onRecommendationsGenerated = vi.fn();

    const { result } = renderHook(() => useMapPerformanceProfiler());

    result.current.onMetricsUpdated(onMetricsUpdated);
    result.current.onThresholdExceeded(onThresholdExceeded);
    result.current.onRecommendationsGenerated(onRecommendationsGenerated);

    // Should not throw
    expect(result.current.isRunning).toBe(false);
  });
});

describe('Performance Tests', () => {
  it('should handle large datasets efficiently', () => {
    const engine = new MapPerformanceProfilerEngine();
    
    const startTime = performance.now();
    
    // Simulate large dataset
    for (let i = 0; i < 10000; i++) {
      engine.getFrameBuffer();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should be under 100ms
    
    engine.destroy();
  });

  it('should handle rapid configuration changes', () => {
    const { result } = renderHook(() => useMapPerformanceProfiler());
    
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      act(() => {
        result.current.updateConfig({
          monitoring: {
            sampleRate: 60 + i,
          },
        });
      });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(50); // Should be under 50ms
  });

  it('should handle rapid export operations', () => {
    const exporter = new MapPerformanceProfilerExporter();
    
    const data = {
      entries: Array.from({ length: 1000 }, (_, i) => ({
        frameNumber: i,
        timestamp: Date.now(),
        duration: 16.67,
        metrics: {
          fps: 60,
          frameTime: 16.67,
          memoryUsage: 100,
          cpuUsage: 25,
          renderTime: 8,
          scriptTime: 8,
          paintTime: 8,
          layoutShift: 0,
          longTasks: 0,
          interactionDelay: 50,
          networkRequests: 5,
          animationFrameDrops: 0,
          junk: 0,
          duration: 16.67,
          totalDuration: 1000,
          selfTime: 16.67,
          timestamp: Date.now(),
        },
        severity: 'good',
        recommendations: [],
      })),
      statistics: {
        totalFrames: 1000,
        averageFps: 60,
        averageFrameTime: 16.67,
        maxFrameTime: 16.67,
        minFrameTime: 16.67,
        p95FrameTime: 16.67,
        p99FrameTime: 16.67,
        averageMemoryUsage: 100,
        peakMemoryUsage: 100,
        averageCpuUsage: 25,
        totalJank: 0,
        totalLongTasks: 0,
        totalAnimationDrops: 0,
        sessionDuration: 60000,
        recommendations: [],
      },
      recommendations: [],
      config: DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
      timestamp: Date.now(),
    };

    const startTime = performance.now();
    
    for (let i = 0; i < 10; i++) {
      exporter.exportToCSV(data);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should be under 100ms
  });
});

describe('Error Handling', () => {
  it('should handle invalid configuration gracefully', () => {
    expect(() => {
      new MapPerformanceProfilerEngine({
        monitoring: {
          sampleRate: -1, // Invalid
        },
      } as any);
    }).not.toThrow();
  });

  it('should handle export errors gracefully', () => {
    const exporter = new MapPerformanceProfilerExporter();
    
    expect(() => {
      exporter.exportToCSV(null as any);
    }).not.toThrow();
  });

  it('should handle component errors gracefully', () => {
    expect(() => {
      render(<MapPerformanceProfiler config={null as any} />);
    }).not.toThrow();
  });

  it('should handle hook errors gracefully', () => {
    expect(() => {
      const { result } = renderHook(() => useMapPerformanceProfiler(null as any));
      expect(result.current).toBeDefined();
    }).not.toThrow();
  });
});
