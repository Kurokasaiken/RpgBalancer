import React, { useMemo, useState } from 'react';
import { getNetworkQualityFromMetrics } from './networkQualityIndicator.helpers';
import { useNetworkMonitoring } from './hooks/useNetworkMonitoring';
import {
  POSITION_CLASSES,
  QUALITY_DISPLAYS,
  HISTORY_LIMIT,
  formatMetrics,
} from './networkQualityIndicator.componentHelpers';
import type {
  NetworkQualityIndicatorProps,
  QualityDisplay,
} from './networkQualityIndicator.componentHelpers';

export const NetworkQualityIndicator: React.FC<NetworkQualityIndicatorProps> = ({
  config,
  onQualityChange,
  onAdaptiveAction,
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const { config: resolvedConfig, quality, metrics, history } = useNetworkMonitoring({
    config,
    onQualityChange,
    onAdaptiveAction,
  });

  const display = QUALITY_DISPLAYS[quality];
  const formattedMetrics = useMemo(() => (metrics ? formatMetrics(metrics) : null), [metrics]);

  const recentHistory = useMemo(() => {
    if (!resolvedConfig.ui.showHistory || history.length === 0) {
      return [] as Array<{ key: string; timestamp: string; display: QualityDisplay }>;
    }

    return history.slice(-HISTORY_LIMIT).reverse().map((entry, index) => {
      const entryQuality = getNetworkQualityFromMetrics(entry, resolvedConfig.thresholds);
      return {
        key: `${entry.timestamp}-${index}`,
        timestamp: new Date(entry.timestamp).toLocaleTimeString(),
        display: QUALITY_DISPLAYS[entryQuality],
      };
    });
  }, [history, resolvedConfig]);

  const adaptiveMessage = useMemo(() => {
    if (!resolvedConfig.adaptive.enabled || quality === 'excellent') {
      return null;
    }

    switch (quality) {
      case 'offline':
        return 'Offline mode activated';
      case 'poor':
        return 'Performance optimizations applied';
      case 'fair':
        return 'Moderate optimizations applied';
      case 'good':
        return 'Minor optimizations applied';
      default:
        return null;
    }
  }, [quality, resolvedConfig.adaptive.enabled]);

  const containerClasses = `${
    POSITION_CLASSES[resolvedConfig.ui.position]
  } ${className ?? ''}`.trim();

  const indicatorClasses = `flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${
    resolvedConfig.ui.compact ? 'text-xs' : 'text-sm'
  } ${resolvedConfig.ui.animated ? 'animate-pulse' : ''}`;

  return (
    <div className={`network-quality-indicator ${containerClasses}`}>
      <div
        className={indicatorClasses}
        style={{
          backgroundColor: `${display.color}20`,
          border: `2px solid ${display.color}`,
          color: display.color,
        }}
        onClick={() => {
          if (resolvedConfig.ui.showDetails) {
            setShowDetails(prev => !prev);
          }
        }}
        title={`Network Quality: ${display.label}`}
      >
        <span className="text-lg">{display.icon}</span>
        {!resolvedConfig.ui.compact && (
          <span className="font-medium">{display.label}</span>
        )}
        {resolvedConfig.ui.showDetails && (
          <span className="text-xs opacity-75">{formattedMetrics?.rtt}</span>
        )}
      </div>

      {showDetails && resolvedConfig.ui.showDetails && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-64 z-50">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Network Quality Details
          </h4>

          {formattedMetrics && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">RTT:</span>
                <span className="font-medium">{formattedMetrics.rtt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Jitter:</span>
                <span className="font-medium">{formattedMetrics.jitter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Packet Loss:</span>
                <span className="font-medium">{formattedMetrics.packetLoss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium flex items-center gap-1">
                  {display.icon} {display.label}
                </span>
              </div>
            </div>
          )}

          {resolvedConfig.ui.showHistory && recentHistory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Recent History
              </h5>
              <div className="space-y-1">
                {recentHistory.map(entry => (
                  <div key={entry.key} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{entry.timestamp}</span>
                    <span className="flex items-center gap-1">
                      {entry.display.icon} {entry.display.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adaptiveMessage && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Adaptive Actions
              </h5>
              <div className="text-xs text-gray-600 dark:text-gray-400">{adaptiveMessage}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
