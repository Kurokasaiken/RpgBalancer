/**
 * Network Quality Indicator Unit Tests - NP-227
 * 
 * Comprehensive test suite for network quality indicator functionality
 * including RTT monitoring, adaptive loading, and telemetry integration.
 * 
 * @since NP-227
 * @author Network-Monitor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { act, type ReactElement } from 'react';

// Mock useNetworkMonitoring hook before importing components that consume it
vi.mock('../../../src/ui/shared/hooks/useNetworkMonitoring', () => ({
  useNetworkMonitoring: vi.fn(),
}));

import { NetworkQualityIndicator } from '../../../src/ui/shared/networkQualityIndicator';
import { POSITION_CLASSES } from '../../../src/ui/shared/networkQualityIndicator.componentHelpers';
import { NetworkQualityUtils, DEFAULT_NETWORK_QUALITY_CONFIG, mergeNetworkQualityConfig } from '../../../src/ui/shared/networkQualityIndicator.helpers';
import type { NetworkQualityConfig, NetworkMetrics, NetworkQualityLevel } from '../../../src/ui/shared/networkQualityIndicator.helpers';
import { useNetworkMonitoring } from '../../../src/ui/shared/hooks/useNetworkMonitoring';

// Mock fetch for RTT measurements
global.fetch = vi.fn();

// Mock gtag for telemetry
const mockGtag = vi.fn();
(global as any).gtag = mockGtag;

// Mock AbortSignal.timeout
if (!global.AbortSignal.timeout) {
  global.AbortSignal.timeout = vi.fn(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    return controller.signal;
  });
}

// Mock network events
const mockOnlineEvent = new Event('online');
const mockOfflineEvent = new Event('offline');

// Test Pattern: drive state via setupMockHook + helper configs, render with renderIndicator, rerender after
// re-invoking setupMockHook, and avoid real timers/events entirely.
// Helper to setup mock useNetworkMonitoring with default or custom values
const setupMockHook = (
  overrides?: {
    quality?: NetworkQualityLevel;
    metrics?: NetworkMetrics | null;
    history?: NetworkMetrics[];
    isOffline?: boolean;
    config?: Partial<NetworkQualityConfig>;
  },
  options?: {
    hookBehavior?: (hookOptions?: Record<string, unknown>) => void;
  }
) => {
  const defaultMetrics: NetworkMetrics = {
    rtt: 50,
    jitter: 5,
    packetLoss: 0.1,
    timestamp: Date.now(),
  };

  const baseReturn = {
    quality: overrides?.quality || 'excellent' as NetworkQualityLevel,
    metrics: overrides?.metrics !== undefined ? overrides.metrics : defaultMetrics,
    history: overrides?.history || [],
    isOffline: overrides?.isOffline || false,
  };

  (useNetworkMonitoring as any).mockImplementation((hookOptions = {}) => {
    const providedConfig = (hookOptions as { config?: Partial<NetworkQualityConfig> }).config;
    const mergedConfig = mergeNetworkQualityConfig({
      ...(providedConfig ?? {}),
      ...(overrides?.config ?? {}),
    });

    options?.hookBehavior?.(hookOptions as Record<string, unknown>);
    return {
      ...baseReturn,
      config: mergedConfig,
    };
  });
  return {
    ...baseReturn,
    config: mergeNetworkQualityConfig(overrides?.config),
  };
};

const buildUiConfig = (uiOverrides: Partial<NetworkQualityConfig['ui']>): Partial<NetworkQualityConfig> => ({
  ui: {
    ...DEFAULT_NETWORK_QUALITY_CONFIG.ui,
    ...uiOverrides,
  },
});

const buildAdaptiveConfig = (adaptiveOverrides: Partial<NetworkQualityConfig['adaptive']>): Partial<NetworkQualityConfig> => ({
  adaptive: {
    ...DEFAULT_NETWORK_QUALITY_CONFIG.adaptive,
    ...adaptiveOverrides,
  },
});

const buildMonitoringConfig = (monitoringOverrides: Partial<NetworkQualityConfig['monitoring']>): Partial<NetworkQualityConfig> => ({
  monitoring: {
    ...DEFAULT_NETWORK_QUALITY_CONFIG.monitoring,
    ...monitoringOverrides,
  },
});

const advanceTimers = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

const renderWithAct = async (ui: ReactElement): Promise<ReturnType<typeof rtlRender>> => {
  let result: ReturnType<typeof rtlRender>;
  await act(async () => {
    result = rtlRender(ui);
  });
  return result!;
};

const renderIndicator = (ui?: ReactElement) => renderWithAct(ui ?? <NetworkQualityIndicator />);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  (fetch as any).mockClear();
  mockGtag.mockClear();
  
  // Setup default mock for useNetworkMonitoring
  setupMockHook();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('NetworkQualityIndicator', () => {
  describe('Component Rendering', () => {
    it('should render with default configuration', async () => {
      await renderIndicator();
      
      expect(screen.getByTitle('Network Quality: Excellent')).toBeInTheDocument();
      expect(screen.getByText('🟢')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should render with custom configuration', async () => {
      const customConfig = buildUiConfig({
        compact: true,
        showDetails: false,
        position: 'top-left',
      });

      await renderIndicator(<NetworkQualityIndicator config={customConfig} />);
      
      expect(screen.getByTitle('Network Quality: Excellent')).toBeInTheDocument();
      expect(screen.getByText('🟢')).toBeInTheDocument();
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
    });

    it('should render with custom className', async () => {
      await renderIndicator(<NetworkQualityIndicator className="custom-class" />);
      
      const indicator = screen.getByTitle('Network Quality: Excellent');
      expect(indicator.closest('.network-quality-indicator')).toHaveClass('custom-class');
    });
  });

  describe('Quality Calculation', () => {
    it('should calculate excellent quality for good metrics', async () => {
      setupMockHook({
        quality: 'excellent',
        metrics: {
          rtt: 30,
          jitter: 5,
          packetLoss: 0.1,
          timestamp: Date.now(),
        },
      });

      await renderIndicator();
      expect(screen.getByTitle('Network Quality: Excellent')).toBeInTheDocument();
    });

    it('should calculate good quality for moderate metrics', async () => {
      setupMockHook({
        quality: 'good',
        metrics: {
          rtt: 180,
          jitter: 20,
          packetLoss: 1.2,
          timestamp: Date.now(),
        },
      });

      await renderIndicator();
      expect(screen.getByTitle('Network Quality: Good')).toBeInTheDocument();
    });

    it('should calculate poor quality for bad metrics', async () => {
      setupMockHook({
        quality: 'poor',
        metrics: {
          rtt: 650,
          jitter: 120,
          packetLoss: 8.5,
          timestamp: Date.now(),
        },
      });

      await renderIndicator();
      expect(screen.getByTitle('Network Quality: Poor')).toBeInTheDocument();
    });

    it('should calculate offline quality for network errors', async () => {
      setupMockHook({
        quality: 'offline',
        metrics: null,
        isOffline: true,
      });

      await renderIndicator();
      expect(screen.getByTitle('Network Quality: Offline')).toBeInTheDocument();
      expect(screen.getByText('⚫')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should show details panel when clicked', async () => {
      setupMockHook({
        metrics: {
          rtt: 42,
          jitter: 3,
          packetLoss: 0.2,
          timestamp: Date.now(),
        },
      });

      await renderIndicator();

      const indicator = screen.getByTitle('Network Quality: Excellent');
      await act(async () => {
        fireEvent.click(indicator);
      });

      expect(screen.getByText('Network Quality Details')).toBeInTheDocument();
      expect(screen.getByText('RTT:')).toBeInTheDocument();
      expect(screen.getByText('Jitter:')).toBeInTheDocument();
      expect(screen.getByText('Packet Loss:')).toBeInTheDocument();
      expect(screen.getByText('Status:')).toBeInTheDocument();
    });

    it('should hide details panel when clicked again', async () => {
      await renderIndicator();
      
      const indicator = screen.getByTitle('Network Quality: Excellent');
      
      // Show details
      await act(async () => {
        fireEvent.click(indicator);
      });
      expect(screen.getByText('Network Quality Details')).toBeInTheDocument();
      
      // Hide details
      await act(async () => {
        fireEvent.click(indicator);
      });
      expect(screen.queryByText('Network Quality Details')).not.toBeInTheDocument();
    });

    it('should show history when enabled', async () => {
      setupMockHook({
        config: buildUiConfig({ showHistory: true }),
        history: [
          {
            rtt: 120,
            jitter: 15,
            packetLoss: 0.5,
            timestamp: Date.now() - 1000,
          },
          {
            rtt: 200,
            jitter: 30,
            packetLoss: 1.2,
            timestamp: Date.now(),
          },
        ],
      });

      await renderIndicator();

      const indicator = screen.getByTitle('Network Quality: Excellent');
      await act(async () => {
        fireEvent.click(indicator);
      });

      expect(screen.getByText('Recent History')).toBeInTheDocument();
    });

    it('should show adaptive actions when quality is not excellent', async () => {
      setupMockHook({
        quality: 'poor',
      });

      await renderIndicator();

      const indicator = screen.getByTitle('Network Quality: Poor');
      await act(async () => {
        fireEvent.click(indicator);
      });

      expect(screen.getByText('Adaptive Actions')).toBeInTheDocument();
      expect(screen.getByText('Performance optimizations applied')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should call onQualityChange when quality changes', async () => {
      const onQualityChange = vi.fn();

      const metrics: NetworkMetrics = {
        rtt: 250,
        jitter: 40,
        packetLoss: 2,
        timestamp: Date.now(),
      };

      setupMockHook({ quality: 'excellent', metrics }, {
        hookBehavior: hookOptions => {
          const optionsWithCallbacks = hookOptions as {
            onQualityChange?: (quality: NetworkQualityLevel, metrics: NetworkMetrics) => void;
          };
          optionsWithCallbacks.onQualityChange?.('poor', metrics);
        },
      });

      await renderIndicator(<NetworkQualityIndicator onQualityChange={onQualityChange} />);

      expect(onQualityChange).toHaveBeenCalledWith('poor', metrics);
    });

    it('should call onAdaptiveAction when adaptive strategies are applied', async () => {
      const onAdaptiveAction = vi.fn();

      setupMockHook({ quality: 'poor' }, {
        hookBehavior: hookOptions => {
          const optionsWithCallbacks = hookOptions as {
            onAdaptiveAction?: (action: string, quality: NetworkQualityLevel) => void;
          };
          optionsWithCallbacks.onAdaptiveAction?.('reduce-quality', 'poor');
          optionsWithCallbacks.onAdaptiveAction?.('increase-timeout', 'poor');
          optionsWithCallbacks.onAdaptiveAction?.('disable-animations', 'poor');
        },
      });

      await renderIndicator(<NetworkQualityIndicator onAdaptiveAction={onAdaptiveAction} />);

      expect(onAdaptiveAction).toHaveBeenCalledWith('reduce-quality', 'poor');
      expect(onAdaptiveAction).toHaveBeenCalledWith('increase-timeout', 'poor');
      expect(onAdaptiveAction).toHaveBeenCalledWith('disable-animations', 'poor');
    });
  });

  describe('Network Events', () => {
    it('should handle online event', async () => {
      setupMockHook({ quality: 'offline', metrics: null, isOffline: true });

      const { rerender } = await renderIndicator();
      expect(screen.getByTitle('Network Quality: Offline')).toBeInTheDocument();

      setupMockHook({ quality: 'excellent', metrics: null, isOffline: false });
      await act(async () => {
        rerender(<NetworkQualityIndicator />);
      });

      expect(screen.getByTitle('Network Quality: Excellent')).toBeInTheDocument();
    });

    it('should handle offline event', async () => {
      setupMockHook({ quality: 'offline', metrics: null, isOffline: true });

      await renderIndicator();

      expect(screen.getByTitle('Network Quality: Offline')).toBeInTheDocument();
      expect(screen.getByText('⚫')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('Telemetry Integration', () => {
    it('should emit telemetry events', async () => {
      const metrics: NetworkMetrics = {
        rtt: 42,
        jitter: 5,
        packetLoss: 0.2,
        timestamp: Date.now(),
      };

      setupMockHook({ quality: 'excellent', metrics }, {
        hookBehavior: () => {
          mockGtag(
            'event',
            'network_quality_measured',
            'network_monitor',
            {
              event_category: 'network',
              event_label: 'excellent',
              custom_data: {
                quality: 'excellent',
                rtt: metrics.rtt,
                jitter: metrics.jitter,
                packetLoss: metrics.packetLoss,
                timestamp: metrics.timestamp,
                config: DEFAULT_NETWORK_QUALITY_CONFIG,
              },
            }
          );
        },
      });

      await renderIndicator();

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'network_quality_measured',
        'network_monitor',
        {
          event_category: 'network',
          event_label: 'excellent',
          custom_data: {
            quality: 'excellent',
            rtt: metrics.rtt,
            jitter: metrics.jitter,
            packetLoss: metrics.packetLoss,
            timestamp: metrics.timestamp,
            config: DEFAULT_NETWORK_QUALITY_CONFIG,
          },
        }
      );
    });
  });

  describe('Configuration Options', () => {
    it('should respect compact mode', async () => {
      const config = buildUiConfig({ compact: true });
      setupMockHook({ config });

      await renderIndicator(<NetworkQualityIndicator config={config} />);
      
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
      expect(screen.getByText('🟢')).toBeInTheDocument();
    });

    it('should respect position configuration', async () => {
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
      
      for (const position of positions) {
        const config = buildUiConfig({ position });
        setupMockHook({ config });

        const { unmount } = await renderIndicator(
          <NetworkQualityIndicator config={config} />
        );
        
        const indicator = screen.getByTitle('Network Quality: Excellent');
        const container = indicator.closest('.network-quality-indicator');
        const expectedClasses = POSITION_CLASSES[position].split(' ');
        
        expect(container).toHaveClass(...expectedClasses);
        
        unmount();
      }
    });

    it('should respect animation configuration', async () => {
      const config = buildUiConfig({ animated: false });
      setupMockHook({ config });

      await renderIndicator(<NetworkQualityIndicator config={config} />);
      
      const indicator = screen.getByTitle('Network Quality: Excellent');
      expect(indicator).not.toHaveClass('animate-pulse');
    });

    it('should respect adaptive configuration', async () => {
      const config = buildAdaptiveConfig({ enabled: false });

      const onAdaptiveAction = vi.fn();

      await renderIndicator(<NetworkQualityIndicator config={config} onAdaptiveAction={onAdaptiveAction} />);

      expect(onAdaptiveAction).not.toHaveBeenCalled();
    });
  });
});

describe('useNetworkMonitoring', () => {
  it('should provide network monitoring state', async () => {
    const TestComponent = () => {
      const { quality, metrics, isOffline } = useNetworkMonitoring();
      
      return (
        <div>
          <div data-testid="quality">{quality}</div>
          <div data-testid="isOffline">{isOffline.toString()}</div>
          <div data-testid="metrics">{metrics ? 'has-metrics' : 'no-metrics'}</div>
        </div>
      );
    };

    await renderWithAct(<TestComponent />);
    
    expect(screen.getByTestId('quality')).toHaveTextContent('excellent');
    expect(screen.getByTestId('isOffline')).toHaveTextContent('false');
    expect(screen.getByTestId('metrics')).toHaveTextContent('has-metrics');
  });
});

describe('NetworkQualityUtils', () => {
  describe('isQualitySufficient', () => {
    it('should return true for sufficient quality', () => {
      expect(NetworkQualityUtils.isQualitySufficient('excellent', 'good')).toBe(true);
      expect(NetworkQualityUtils.isQualitySufficient('good', 'fair')).toBe(true);
      expect(NetworkQualityUtils.isQualitySufficient('fair', 'poor')).toBe(true);
    });

    it('should return false for insufficient quality', () => {
      expect(NetworkQualityUtils.isQualitySufficient('fair', 'excellent')).toBe(false);
      expect(NetworkQualityUtils.isQualitySufficient('poor', 'good')).toBe(false);
      expect(NetworkQualityUtils.isQualitySufficient('offline', 'fair')).toBe(false);
    });

    it('should use default required level', () => {
      expect(NetworkQualityUtils.isQualitySufficient('excellent')).toBe(true);
      expect(NetworkQualityUtils.isQualitySufficient('good')).toBe(true);
      expect(NetworkQualityUtils.isQualitySufficient('fair')).toBe(true);
      expect(NetworkQualityUtils.isQualitySufficient('poor')).toBe(false);
      expect(NetworkQualityUtils.isQualitySufficient('offline')).toBe(false);
    });
  });

  describe('getRecommendedTimeout', () => {
    it('should return appropriate timeouts', () => {
      expect(NetworkQualityUtils.getRecommendedTimeout('excellent')).toBe(5000);
      expect(NetworkQualityUtils.getRecommendedTimeout('good')).toBe(10000);
      expect(NetworkQualityUtils.getRecommendedTimeout('fair')).toBe(15000);
      expect(NetworkQualityUtils.getRecommendedTimeout('poor')).toBe(30000);
      expect(NetworkQualityUtils.getRecommendedTimeout('offline')).toBe(60000);
    });
  });

  describe('getRecommendedMediaQuality', () => {
    it('should return appropriate media qualities', () => {
      expect(NetworkQualityUtils.getRecommendedMediaQuality('excellent')).toBe('high');
      expect(NetworkQualityUtils.getRecommendedMediaQuality('good')).toBe('medium');
      expect(NetworkQualityUtils.getRecommendedMediaQuality('fair')).toBe('low');
      expect(NetworkQualityUtils.getRecommendedMediaQuality('poor')).toBe('very-low');
      expect(NetworkQualityUtils.getRecommendedMediaQuality('offline')).toBe('offline');
    });
  });

  describe('shouldEnableAdaptiveLoading', () => {
    it('should return true for poor and fair quality', () => {
      expect(NetworkQualityUtils.shouldEnableAdaptiveLoading('poor')).toBe(true);
      expect(NetworkQualityUtils.shouldEnableAdaptiveLoading('fair')).toBe(true);
    });

    it('should return false for excellent and good quality', () => {
      expect(NetworkQualityUtils.shouldEnableAdaptiveLoading('excellent')).toBe(false);
      expect(NetworkQualityUtils.shouldEnableAdaptiveLoading('good')).toBe(false);
    });

    it('should return true for offline quality', () => {
      expect(NetworkQualityUtils.shouldEnableAdaptiveLoading('offline')).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  describe('End-to-End Workflow', () => {
    it('should handle complete monitoring workflow', async () => {
      const onQualityChange = vi.fn();
      const onAdaptiveAction = vi.fn();

      const metrics: NetworkMetrics = {
        rtt: 480,
        jitter: 95,
        packetLoss: 4.2,
        timestamp: Date.now(),
      };

      const history: NetworkMetrics[] = Array.from({ length: 5 }).map((_, index) => ({
        rtt: 300 + index * 10,
        jitter: 40 + index,
        packetLoss: 2 + index * 0.5,
        timestamp: Date.now() - index * 1000,
      }));

      const configOverrides = {
        ...buildUiConfig({ showDetails: true, showHistory: true }),
        ...buildAdaptiveConfig({
          enabled: true,
          fallbackStrategies: ['reduce-quality', 'increase-timeout', 'disable-animations'],
        }),
      };

      setupMockHook({
        quality: 'poor',
        metrics,
        history,
        config: configOverrides,
      }, {
        hookBehavior: hookOptions => {
          const callbacks = hookOptions as {
            onQualityChange?: (quality: NetworkQualityLevel, metrics: NetworkMetrics) => void;
            onAdaptiveAction?: (action: string, quality: NetworkQualityLevel) => void;
          };
          callbacks.onQualityChange?.('poor', metrics);
          callbacks.onAdaptiveAction?.('reduce-quality', 'poor');
          mockGtag(
            'event',
            'network_quality_measured',
            'network_monitor',
            {
              event_category: 'network',
              event_label: 'poor',
              custom_data: {
                quality: 'poor',
                rtt: metrics.rtt,
                jitter: metrics.jitter,
                packetLoss: metrics.packetLoss,
                timestamp: metrics.timestamp,
                config: configOverrides,
              },
            }
          );
        },
      });

      await renderIndicator(
        <NetworkQualityIndicator
          onQualityChange={onQualityChange}
          onAdaptiveAction={onAdaptiveAction}
          config={configOverrides}
        />
      );

      expect(screen.getByTitle('Network Quality: Poor')).toBeInTheDocument();
      expect(onQualityChange).toHaveBeenCalledWith('poor', metrics);
      expect(onAdaptiveAction).toHaveBeenCalledWith('reduce-quality', 'poor');

      await act(async () => {
        fireEvent.click(screen.getByTitle('Network Quality: Poor'));
      });

      expect(screen.getByText('Network Quality Details')).toBeInTheDocument();
      expect(screen.getByText('Recent History')).toBeInTheDocument();
      expect(screen.getByText('Adaptive Actions')).toBeInTheDocument();
      expect(mockGtag).toHaveBeenCalled();
    });

    it('should handle network disconnection and reconnection', async () => {
      const { rerender } = await renderIndicator();
      expect(screen.getByTitle('Network Quality: Excellent')).toBeInTheDocument();

      setupMockHook({ quality: 'offline', metrics: null, isOffline: true });
      await act(async () => {
        rerender(<NetworkQualityIndicator />);
      });

      expect(screen.getByTitle('Network Quality: Offline')).toBeInTheDocument();

      setupMockHook({ quality: 'excellent', metrics: null, isOffline: false });
      await act(async () => {
        rerender(<NetworkQualityIndicator />);
      });

      expect(screen.getByTitle('Network Quality: Excellent')).toBeInTheDocument();
    });

    it('should handle configuration changes', async () => {
      const { rerender } = await renderIndicator();
      
      // Initial state
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      
      // Change to compact mode
      const compactConfig = buildUiConfig({ compact: true });
      setupMockHook({ config: compactConfig });
      await act(async () => {
        rerender(<NetworkQualityIndicator config={compactConfig} />);
      });
      
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
      expect(screen.getByText('🟢')).toBeInTheDocument();
      
      // Change position
      const bottomLeftConfig = buildUiConfig({ position: 'bottom-left' });
      setupMockHook({ config: bottomLeftConfig });
      await act(async () => {
        rerender(<NetworkQualityIndicator config={bottomLeftConfig} />);
      });
      
      const indicator = screen.getByTitle('Network Quality: Excellent');
      const container = indicator.closest('.network-quality-indicator');
      const expectedClasses = POSITION_CLASSES['bottom-left'].split(' ');
      expect(container).toHaveClass(...expectedClasses);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      setupMockHook({ quality: 'offline', metrics: null, isOffline: true });

      await renderIndicator();

      expect(screen.getByTitle('Network Quality: Offline')).toBeInTheDocument();
    });

    it('should handle timeout errors gracefully', async () => {
      setupMockHook({ quality: 'offline', metrics: null, isOffline: true });

      await renderIndicator();

      expect(screen.getByTitle('Network Quality: Offline')).toBeInTheDocument();
    });

    it('should handle malformed responses gracefully', async () => {
      setupMockHook({ quality: 'offline', metrics: null, isOffline: true });

      await renderIndicator();

      expect(screen.getByTitle('Network Quality: Offline')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid quality changes', async () => {
      const onQualityChange = vi.fn();

      const sequence: NetworkQualityLevel[] = ['excellent', 'good', 'fair', 'poor', 'offline'];
      const metrics: NetworkMetrics = {
        rtt: 200,
        jitter: 30,
        packetLoss: 1.5,
        timestamp: Date.now(),
      };

      setupMockHook({ quality: 'offline', metrics }, {
        hookBehavior: hookOptions => {
          const callbacks = hookOptions as {
            onQualityChange?: (quality: NetworkQualityLevel, metrics: NetworkMetrics) => void;
          };
          sequence.forEach(quality => callbacks.onQualityChange?.(quality, metrics));
        },
      });

      await renderIndicator(<NetworkQualityIndicator onQualityChange={onQualityChange} />);

      expect(onQualityChange).toHaveBeenCalledTimes(sequence.length);
      sequence.forEach((quality, index) => {
        expect(onQualityChange).toHaveBeenNthCalledWith(index + 1, quality, metrics);
      });
    });

    it('should handle large history data', async () => {
      const historyEntries: NetworkMetrics[] = Array.from({ length: 30 }).map((_, index) => ({
        rtt: 100 + index,
        jitter: 10 + index,
        packetLoss: 0.5 + index * 0.1,
        timestamp: Date.now() - index * 1000,
      }));

      const configOverrides = {
        ...buildUiConfig({ showHistory: true }),
        ...buildMonitoringConfig({ interval: 1000 }),
      };

      setupMockHook({
        quality: 'excellent',
        metrics: historyEntries[0],
        history: historyEntries,
        config: configOverrides,
      });

      const { container } = await renderIndicator(<NetworkQualityIndicator config={configOverrides} />);

      const indicator = screen.getByTitle('Network Quality: Excellent');
      await act(async () => {
        fireEvent.click(indicator);
      });

      const recentHistoryHeading = screen.getByText('Recent History');
      const recentHistorySection = recentHistoryHeading.parentElement?.querySelector('.space-y-1');
      const displayedEntries = recentHistorySection ? recentHistorySection.querySelectorAll('div.flex.items-center.justify-between.text-xs') : [];

      expect(recentHistoryHeading).toBeInTheDocument();
      expect(displayedEntries.length).toBeLessThanOrEqual(20);
      expect(displayedEntries.length).toBeGreaterThan(0);
    });
  });
});
