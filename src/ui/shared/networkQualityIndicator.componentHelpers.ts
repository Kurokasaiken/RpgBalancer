import type { NetworkQualityLevel, NetworkQualityConfig, NetworkMetrics } from './networkQualityIndicator.helpers';

export interface NetworkQualityIndicatorProps {
  config?: Partial<NetworkQualityConfig>;
  onQualityChange?: (quality: NetworkQualityLevel, metrics: NetworkMetrics) => void;
  onAdaptiveAction?: (action: string, quality: NetworkQualityLevel) => void;
  className?: string;
}

export type QualityDisplay = { color: string; icon: string; label: string };

export const POSITION_CLASSES: Record<NetworkQualityConfig['ui']['position'], string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export const QUALITY_DISPLAYS: Record<NetworkQualityLevel, QualityDisplay> = {
  excellent: { color: 'rgb(34, 197, 94)', icon: '🟢', label: 'Excellent' },
  good: { color: 'rgb(59, 130, 246)', icon: '🔵', label: 'Good' },
  fair: { color: 'rgb(251, 191, 36)', icon: '🟡', label: 'Fair' },
  poor: { color: 'rgb(239, 68, 68)', icon: '🔴', label: 'Poor' },
  offline: { color: 'rgb(107, 114, 128)', icon: '⚫', label: 'Offline' },
};

export const HISTORY_LIMIT = 5;

export const formatMetrics = (metrics: NetworkMetrics) => ({
  rtt: metrics.rtt === -1 ? 'N/A' : `${metrics.rtt}ms`,
  jitter: `${metrics.jitter}ms`,
  packetLoss: `${metrics.packetLoss}%`,
});
