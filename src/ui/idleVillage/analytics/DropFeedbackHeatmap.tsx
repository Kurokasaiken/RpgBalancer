/**
 * Drop Feedback Heatmap Component
 * 
 * Interactive heatmap visualization for drop feedback telemetry.
 * Displays feedback density per slot with filters and export capabilities.
 * 
 * @module idleVillage/analytics/DropFeedbackHeatmap
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useDropFeedbackHeatmap } from '../hooks/useDropFeedbackHeatmap';
import { 
  DEFAULT_HEATMAP_CONFIG, 
  getGradientColor, 
  getBucketForCount,
} from './dropFeedbackHeatmapConfig';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { downloadHeatmapData, DropFeedbackHeatmapProps } from './dropFeedbackHeatmapHelpers';

/**
 * Drop Feedback Heatmap Component
 * 
 * Renders an interactive heatmap showing drop feedback density across slots.
 * Includes legend, filters, and export functionality.
 */
export function DropFeedbackHeatmap({
  config: customConfig,
  initialFilters,
  onViewed,
  onExport,
}: DropFeedbackHeatmapProps) {
  const config = useMemo(
    () => ({ ...DEFAULT_HEATMAP_CONFIG, ...customConfig }),
    [customConfig]
  );

  const [filters, _setFilters] = useState<HeatmapFilters>(initialFilters || {});
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<'valid' | 'invalid' | 'warning' | 'blocked' | 'combined'>('combined');
  
  const { dataset, loading, error, exportJSON, exportMarkdown, refreshData } = useDropFeedbackHeatmap(filters);
  const diagnostics = useMemo(() => createSandboxDiagnostics('drop-feedback-heatmap'), []);

  /**
   * Emit telemetry when heatmap is viewed
   */
  React.useEffect(() => {
    if (!loading && dataset.stats.totalEvents > 0) {
      diagnostics.info('iv_drop_heatmap_viewed', {
        totalEvents: dataset.stats.totalEvents,
        uniqueSlots: dataset.stats.uniqueSlots,
        filters,
        timestamp: Date.now(),
      });
      onViewed?.();
    }
  }, [loading, dataset.stats.totalEvents, dataset.stats.uniqueSlots, filters, diagnostics, onViewed]);

  /**
   * Handle export to JSON
   */
  const handleExportJSON = useCallback(() => {
    const json = exportJSON();
    downloadHeatmapData(json, 'application/json', 'json');
    
    diagnostics.info('iv_drop_heatmap_exported', { format: 'json', timestamp: Date.now() });
    onExport?.('json');
  }, [exportJSON, diagnostics, onExport]);

  /**
   * Handle export to Markdown
   */
  const handleExportMarkdown = useCallback(() => {
    const markdown = exportMarkdown();
    downloadHeatmapData(markdown, 'text/markdown', 'markdown');
    
    diagnostics.info('iv_drop_heatmap_exported', { format: 'markdown', timestamp: Date.now() });
    onExport?.('markdown');
  }, [exportMarkdown, diagnostics, onExport]);

  /**
   * Get color for a slot based on feedback type
   */
  const getSlotColor = useCallback((slotId: string, feedbackType: typeof selectedFeedbackType): string => {
    const slotData = dataset.slots.get(slotId);
    if (!slotData) return config.gradients.combined.minColor;

    let count = 0;
    let maxCount = dataset.stats.totalEvents;

    switch (feedbackType) {
      case 'valid':
        count = slotData.validCount;
        maxCount = dataset.stats.validEvents;
        break;
      case 'invalid':
        count = slotData.invalidCount;
        maxCount = dataset.stats.invalidEvents;
        break;
      case 'warning':
        count = slotData.warningCount;
        maxCount = dataset.stats.warningEvents;
        break;
      case 'blocked':
        count = slotData.blockedCount;
        maxCount = dataset.stats.blockedEvents;
        break;
      case 'combined':
        count = slotData.totalCount;
        maxCount = dataset.stats.totalEvents;
        break;
    }

    const normalized = maxCount > 0 ? count / maxCount : 0;
    return getGradientColor(normalized, config.gradients[feedbackType]);
  }, [dataset, config]);

  /**
   * Render heatmap cells
   */
  const renderHeatmapCells = useMemo(() => {
    const slots = Array.from(dataset.slots.values()).sort((a, b) => 
      b.totalCount - a.totalCount
    );

    return slots.map(slot => {
      const color = getSlotColor(slot.slotId, selectedFeedbackType);
      const bucket = getBucketForCount(slot.totalCount, config.buckets);

      return (
        <div
          key={slot.slotId}
          className="heatmap-cell"
          style={{
            backgroundColor: color,
            width: `${config.display.cellSize}px`,
            height: `${config.display.cellSize}px`,
            borderRadius: `${config.display.borderRadius}px`,
            margin: `${config.display.cellGap}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${config.display.fontSize}px`,
            fontWeight: 600,
            color: slot.totalCount > 20 ? 'white' : 'rgb(31, 41, 55)',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          title={`${slot.slotId}\nTotal: ${slot.totalCount}\nValid: ${slot.validCount}\nInvalid: ${slot.invalidCount}\nWarning: ${slot.warningCount}\nBlocked: ${slot.blockedCount}\nBucket: ${bucket?.label || 'Unknown'}`}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {config.display.showValues && slot.totalCount}
        </div>
      );
    });
  }, [dataset.slots, getSlotColor, selectedFeedbackType, config]);

  /**
   * Render legend
   */
  const renderLegend = useMemo(() => {
    if (!config.display.showLegend) return null;

    return (
      <div className="heatmap-legend" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Legend</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {config.buckets.map(bucket => (
            <div key={bucket.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: bucket.color,
                  borderRadius: '4px',
                }}
              />
              <span style={{ fontSize: '12px' }}>
                {bucket.label} ({bucket.min}-{bucket.max === Infinity ? '∞' : bucket.max})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }, [config]);

  if (loading) {
    return (
      <div className="heatmap-loading" style={{ padding: '20px', textAlign: 'center' }}>
        Loading heatmap data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="heatmap-error" style={{ padding: '20px', color: 'rgb(220, 38, 38)' }}>
        Error loading heatmap: {error.message}
      </div>
    );
  }

  if (dataset.stats.totalEvents === 0) {
    return (
      <div className="heatmap-empty" style={{ padding: '20px', textAlign: 'center' }}>
        No drop feedback events recorded yet.
      </div>
    );
  }

  return (
    <div className="drop-feedback-heatmap" style={{ padding: '20px' }}>
      {/* Header */}
      <div className="heatmap-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Drop Feedback Heatmap
        </h2>
        <p
          data-testid="heatmap-summary"
          style={{ fontSize: '14px', color: 'rgb(107, 114, 128)' }}
        >
          Visualizing {dataset.stats.totalEvents} feedback events across {dataset.stats.uniqueSlots} slots
        </p>
      </div>

      {/* Controls */}
      <div className="heatmap-controls" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <label
            htmlFor="drop-feedback-filter"
            style={{ fontSize: '12px', fontWeight: 600, marginRight: '8px' }}
          >
            Feedback Type:
          </label>
          <select
            id="drop-feedback-filter"
            value={selectedFeedbackType}
            onChange={(e) => setSelectedFeedbackType(e.target.value as typeof selectedFeedbackType)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid rgb(209, 213, 219)',
              fontSize: '14px',
            }}
          >
            <option value="combined">Combined</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
            <option value="warning">Warning</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <button
          onClick={refreshData}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid rgb(209, 213, 219)',
            backgroundColor: 'white',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>

        <button
          onClick={handleExportJSON}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid rgb(209, 213, 219)',
            backgroundColor: 'white',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Export JSON
        </button>

        <button
          onClick={handleExportMarkdown}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid rgb(209, 213, 219)',
            backgroundColor: 'white',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Export Markdown
        </button>
      </div>

      {/* Statistics */}
      <div className="heatmap-stats" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div
          data-testid="heatmap-stat-total"
          style={{ padding: '12px', backgroundColor: 'rgb(243, 244, 246)', borderRadius: '8px' }}
        >
          <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>Total Events</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{dataset.stats.totalEvents}</div>
        </div>
        <div
          data-testid="heatmap-stat-valid"
          style={{ padding: '12px', backgroundColor: 'rgb(220, 252, 231)', borderRadius: '8px' }}
        >
          <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>Valid</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{dataset.stats.validEvents}</div>
        </div>
        <div
          data-testid="heatmap-stat-invalid"
          style={{ padding: '12px', backgroundColor: 'rgb(254, 226, 226)', borderRadius: '8px' }}
        >
          <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>Invalid</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{dataset.stats.invalidEvents}</div>
        </div>
        <div
          data-testid="heatmap-stat-warning"
          style={{ padding: '12px', backgroundColor: 'rgb(254, 243, 199)', borderRadius: '8px' }}
        >
          <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>Warning</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{dataset.stats.warningEvents}</div>
        </div>
        <div
          data-testid="heatmap-stat-blocked"
          style={{ padding: '12px', backgroundColor: 'rgb(241, 245, 249)', borderRadius: '8px' }}
        >
          <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)' }}>Blocked</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{dataset.stats.blockedEvents}</div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div 
        className="heatmap-grid" 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          padding: '20px',
          backgroundColor: 'rgb(249, 250, 251)',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        {renderHeatmapCells}
      </div>

      {/* Legend */}
      {renderLegend}

      {/* Top Invalid Hotspots */}
      {dataset.hotspots.length > 0 && (
        <div className="heatmap-hotspots" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            Top Invalid Hotspots
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgb(243, 244, 246)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Rank</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Slot ID</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Invalid Count</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {dataset.hotspots.map((hotspot, i) => (
                  <tr key={hotspot.slotId} style={{ borderBottom: '1px solid rgb(229, 231, 235)' }}>
                    <td style={{ padding: '8px' }}>{i + 1}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{hotspot.slotId}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{hotspot.invalidCount}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{hotspot.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Default export for convenience
 */
export default DropFeedbackHeatmap;
