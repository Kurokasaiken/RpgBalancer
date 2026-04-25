import type { HeatmapFilters } from '../hooks/useDropFeedbackHeatmap';
import type { DropFeedbackHeatmapConfig } from './dropFeedbackHeatmapConfig';

export interface DropFeedbackHeatmapProps {
  /** Optional custom configuration */
  config?: Partial<DropFeedbackHeatmapConfig>;
  /** Optional initial filters */
  initialFilters?: HeatmapFilters;
  /** Callback when heatmap is viewed */
  onViewed?: () => void;
  /** Callback when data is exported */
  onExport?: (format: 'json' | 'markdown') => void;
}

export const HEATMAP_DOWNLOAD_PREFIX = 'drop-feedback-heatmap';

export type HeatmapExportFormat = 'json' | 'markdown';

/**
 * Trigger a client-side download for heatmap data
 */
export function downloadHeatmapData(
  payload: string,
  mimeType: string,
  extension: HeatmapExportFormat
): void {
  const blob = new Blob([payload], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${HEATMAP_DOWNLOAD_PREFIX}-${Date.now()}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
