import { useCallback, useEffect, useRef, useState } from 'react';
import {
  mergeNetworkQualityConfig,
  getNetworkQualityFromMetrics,
  type NetworkQualityConfig,
  type NetworkQualityLevel,
  type NetworkMetrics,
} from '../networkQualityIndicator.helpers';

interface UseNetworkMonitoringOptions {
  config?: Partial<NetworkQualityConfig>;
  onQualityChange?: (quality: NetworkQualityLevel, metrics: NetworkMetrics) => void;
  onAdaptiveAction?: (action: string, quality: NetworkQualityLevel) => void;
}

interface UseNetworkMonitoringResult {
  config: NetworkQualityConfig;
  quality: NetworkQualityLevel;
  metrics: NetworkMetrics | null;
  history: NetworkMetrics[];
  isOffline: boolean;
}

export function useNetworkMonitoring(options: UseNetworkMonitoringOptions = {}): UseNetworkMonitoringResult {
  const { config, onQualityChange, onAdaptiveAction } = options;
  const [localConfig, setLocalConfig] = useState<NetworkQualityConfig>(() => mergeNetworkQualityConfig(config));
  const [currentQuality, setCurrentQuality] = useState<NetworkQualityLevel>('excellent');
  const [currentMetrics, setCurrentMetrics] = useState<NetworkMetrics | null>(null);
  const [history, setHistory] = useState<NetworkMetrics[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    setLocalConfig(mergeNetworkQualityConfig(config));
  }, [config]);

  const emitTelemetryEvent = useCallback((quality: NetworkQualityLevel, metrics: NetworkMetrics) => {
    const event = {
      eventType: 'network_quality_measured',
      timestamp: Date.now(),
      data: {
        quality,
        rtt: metrics.rtt,
        jitter: metrics.jitter,
        packetLoss: metrics.packetLoss,
        timestamp: metrics.timestamp,
        config: localConfig,
      },
    };

    if (typeof window !== 'undefined') {
      type WindowWithGtag = Window & {
        gtag?: (
          command: string,
          eventName: string,
          eventCategory: string,
          params: Record<string, unknown>
        ) => void;
      };

      const telemetryWindow = window as unknown as WindowWithGtag;
      telemetryWindow.gtag?.('event', 'network_quality_measured', 'network_monitor', {
        event_category: 'network',
        event_label: quality,
        custom_data: event.data,
      });
    }
  }, [localConfig]);

  const applyAdaptiveStrategies = useCallback((quality: NetworkQualityLevel) => {
    if (!localConfig.adaptive.enabled) return;

    const strategies = localConfig.adaptive.fallbackStrategies;

    switch (quality) {
      case 'excellent':
        break;
      case 'good':
        if (strategies.includes('reduce-quality')) {
          onAdaptiveAction?.('reduce-quality', quality);
        }
        break;
      case 'fair':
        if (strategies.includes('increase-timeout')) {
          onAdaptiveAction?.('increase-timeout', quality);
        }
        if (strategies.includes('disable-animations')) {
          onAdaptiveAction?.('disable-animations', quality);
        }
        break;
      case 'poor':
        strategies.forEach(strategy => {
          onAdaptiveAction?.(strategy, quality);
        });
        break;
      case 'offline':
        onAdaptiveAction?.('offline-mode', quality);
        break;
      default:
        break;
    }
  }, [localConfig.adaptive.enabled, localConfig.adaptive.fallbackStrategies, onAdaptiveAction]);

  const measureRTT = useCallback(async (): Promise<NetworkMetrics> => {
    const startTime = Date.now();
    let rtt = -1;
    let jitter = 0;
    let packetLoss = 0;

    try {
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(localConfig.monitoring.timeout),
      });

      rtt = Date.now() - startTime;

      if (!response.ok) {
        packetLoss = 100;
      }

      if (lastPingRef.current > 0) {
        jitter = Math.abs(rtt - lastPingRef.current);
      }
      lastPingRef.current = rtt;
    } catch (_error) {
      rtt = -1;
      packetLoss = 100;
      setIsOffline(true);
    }

    return {
      rtt,
      jitter,
      packetLoss,
      timestamp: Date.now(),
    };
  }, [localConfig.monitoring.timeout]);

  const collectMetrics = useCallback(async (): Promise<NetworkMetrics> => {
    const samples: NetworkMetrics[] = [];

    for (let i = 0; i < localConfig.monitoring.sampleSize; i++) {
      try {
        const metrics = await measureRTT();
        samples.push(metrics);

        if (i < localConfig.monitoring.sampleSize - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (_error) {
        continue;
      }
    }

    const validSamples = samples.filter(sample => sample.rtt > 0);

    if (validSamples.length === 0) {
      return {
        rtt: -1,
        jitter: 0,
        packetLoss: 100,
        timestamp: Date.now(),
      };
    }

    const avgRTT = validSamples.reduce((sum, sample) => sum + sample.rtt, 0) / validSamples.length;
    const avgJitter = validSamples.reduce((sum, sample) => sum + sample.jitter, 0) / validSamples.length;
    const avgPacketLoss = samples.reduce((sum, sample) => sum + sample.packetLoss, 0) / samples.length;

    return {
      rtt: Math.round(avgRTT),
      jitter: Math.round(avgJitter),
      packetLoss: Math.round(avgPacketLoss * 10) / 10,
      timestamp: Date.now(),
    };
  }, [localConfig.monitoring.sampleSize, measureRTT]);

  const monitor = useCallback(async () => {
    try {
      const metrics = await collectMetrics();
      const quality = getNetworkQualityFromMetrics(metrics, localConfig.thresholds);

      setCurrentMetrics(metrics);
      setCurrentQuality(quality);
      setIsOffline(false);
      setHistory(prev => [...prev.slice(-19), metrics]);

      onQualityChange?.(quality, metrics);
      applyAdaptiveStrategies(quality);
      emitTelemetryEvent(quality, metrics);
    } catch (error) {
      console.error('Network monitoring error:', error);
      setIsOffline(true);
      setCurrentQuality('offline');
    }
  }, [collectMetrics, localConfig.thresholds, onQualityChange, applyAdaptiveStrategies, emitTelemetryEvent]);

  const startMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }

    monitor();
    monitoringIntervalRef.current = setInterval(monitor, localConfig.monitoring.interval);
  }, [monitor, localConfig.monitoring.interval]);

  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleOnline = () => {
      setIsOffline(false);
      startMonitoring();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setCurrentQuality('offline');
      stopMonitoring();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    config: localConfig,
    quality: currentQuality,
    metrics: currentMetrics,
    history,
    isOffline,
  };
}
