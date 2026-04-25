/**
 * NP-033 – Idle Village Quest Narrative Telemetry Correlator
 * 
 * Dashboard component for visualizing narrative-outcome correlations
 * with interactive charts, filters, and export capabilities.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CorrelationData,
  CorrelationDashboardConfig,
  CorrelationWidget,
  NarrativeType,
  NarrativeTone,
  NarrativeStyle,
  QuestOutcome,
  QuestDifficulty,
  QuestCategory,
} from '../types/narrativeCorrelation';

export interface NarrativeCorrelationDashboardProps {
  correlations: CorrelationData[];
  config: CorrelationDashboardConfig;
  isLoading?: boolean;
  error?: string | null;
  onConfigChange?: (config: CorrelationDashboardConfig) => void;
  onExport?: (format: 'csv' | 'json') => void;
  onRefresh?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const NarrativeCorrelationDashboard: React.FC<NarrativeCorrelationDashboardProps> = ({
  correlations,
  config,
  isLoading = false,
  error = null,
  onConfigChange,
  onExport,
  onRefresh,
  className = '',
  style = {},
}) => {
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    timeRange: '7d',
    narrativeTypes: [] as NarrativeType[],
    tones: [] as NarrativeTone[],
    styles: [] as NarrativeStyle[],
    categories: [] as QuestCategory[],
    difficulties: [] as QuestDifficulty[],
    outcomes: [] as QuestOutcome[],
    minStrength: 0.3,
    minSignificance: 0.05,
  });

  // Filter correlations based on current filters
  const filteredCorrelations = useMemo(() => {
    return correlations.filter(correlation => {
      // Apply strength filter
      if (correlation.correlation.strength < filters.minStrength) {
        return false;
      }

      // Apply significance filter
      if (correlation.correlation.significance < filters.minSignificance) {
        return false;
      }

      return true;
    });
  }, [correlations, filters]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredCorrelations.length;
    const significant = filteredCorrelations.filter(c => c.correlation.significance > 0.5).length;
    const positive = filteredCorrelations.filter(c => c.correlation.direction === 'positive').length;
    const negative = filteredCorrelations.filter(c => c.correlation.direction === 'negative').length;
    const strong = filteredCorrelations.filter(c => c.correlation.strength > 0.7).length;

    return {
      total,
      significant,
      positive,
      negative,
      strong,
      averageStrength: total > 0 ? filteredCorrelations.reduce((sum, c) => sum + c.correlation.strength, 0) / total : 0,
      averageSignificance: total > 0 ? filteredCorrelations.reduce((sum, c) => sum + c.correlation.significance, 0) / total : 0,
    };
  }, [filteredCorrelations]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle widget selection
  const handleWidgetClick = useCallback((widgetId: string) => {
    setSelectedWidget(widgetId === selectedWidget ? null : widgetId);
  }, [selectedWidget]);

  // Render correlation matrix widget
  const renderCorrelationMatrix = useCallback(() => {
    const matrixSize = Math.min(10, filteredCorrelations.length);
    const matrix = filteredCorrelations.slice(0, matrixSize);

    return (
      <div className="correlation-matrix">
        <h4>Correlation Matrix</h4>
        <div className="matrix-grid">
          {matrix.map((correlation, index) => (
            <div
              key={correlation.id}
              className="matrix-cell"
              style={{
                backgroundColor: correlation.correlation.direction === 'positive' 
                  ? `rgba(34, 197, 94, ${correlation.correlation.strength})`
                  : `rgba(239, 68, 68, ${correlation.correlation.strength})`,
                border: selectedWidget === `matrix-${index}` ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              }}
              onClick={() => handleWidgetClick(`matrix-${index}`)}
              title={`${correlation.analysis.method}: ${correlation.correlation.strength.toFixed(3)}`}
            >
              <div className="cell-content">
                <div className="method">{correlation.analysis.method}</div>
                <div className="strength">{correlation.correlation.strength.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="matrix-legend">
          <div className="legend-item">
            <div className="legend-color positive"></div>
            <span>Positive</span>
          </div>
          <div className="legend-item">
            <div className="legend-color negative"></div>
            <span>Negative</span>
          </div>
          <div className="legend-item">
            <span>Intensity = Correlation Strength</span>
          </div>
        </div>
      </div>
    );
  }, [filteredCorrelations, selectedWidget, handleWidgetClick]);

  // Render statistics widget
  const renderStatistics = useCallback(() => {
    return (
      <div className="statistics-widget">
        <h4>Correlation Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{statistics.total}</div>
            <div className="stat-label">Total Correlations</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{statistics.significant}</div>
            <div className="stat-label">Significant (p &lt; 0.5)</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{statistics.strong}</div>
            <div className="stat-label">Strong (&gt; 0.7)</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{statistics.positive}</div>
            <div className="stat-label">Positive</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{statistics.negative}</div>
            <div className="stat-label">Negative</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{statistics.averageStrength.toFixed(3)}</div>
            <div className="stat-label">Avg Strength</div>
          </div>
        </div>
      </div>
    );
  }, [statistics]);

  // Render top correlations widget
  const renderTopCorrelations = useCallback(() => {
    const topCorrelations = [...filteredCorrelations]
      .sort((a, b) => b.correlation.strength - a.correlation.strength)
      .slice(0, 10);

    return (
      <div className="top-correlations-widget">
        <h4>Top Correlations</h4>
        <div className="correlations-list">
          {topCorrelations.map((correlation, index) => (
            <div
              key={correlation.id}
              className={`correlation-item ${correlation.correlation.direction}`}
              onClick={() => handleWidgetClick(`correlation-${index}`)}
            >
              <div className="correlation-header">
                <span className="method">{correlation.analysis.method}</span>
                <span className="strength">{correlation.correlation.strength.toFixed(3)}</span>
              </div>
              <div className="correlation-details">
                <span className="direction">{correlation.correlation.direction}</span>
                <span className="significance">
                  p: {correlation.analysis.pValue.toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [filteredCorrelations, handleWidgetClick]);

  // Render distribution widget
  const renderDistribution = useCallback(() => {
    const methodDistribution = filteredCorrelations.reduce((acc, correlation) => {
      acc[correlation.analysis.method] = (acc[correlation.analysis.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(methodDistribution).reduce((sum, count) => sum + count, 0);

    return (
      <div className="distribution-widget">
        <h4>Method Distribution</h4>
        <div className="distribution-bars">
          {Object.entries(methodDistribution).map(([method, count]) => (
            <div key={method} className="distribution-item">
              <div className="distribution-label">{method}</div>
              <div className="distribution-bar">
                <div
                  className="distribution-fill"
                  style={{
                    width: `${(count / total) * 100}%`,
                    backgroundColor: config.theme.primary,
                  }}
                ></div>
              </div>
              <div className="distribution-value">{count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [filteredCorrelations, config.theme.primary]);

  // Render filters widget
  const renderFilters = useCallback(() => {
    return (
      <div className="filters-widget">
        <h4>Filters</h4>
        <div className="filter-controls">
          <div className="filter-group">
            <label>Min Strength</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={filters.minStrength}
              onChange={(e) => handleFilterChange({ minStrength: parseFloat(e.target.value) })}
            />
            <span>{filters.minStrength.toFixed(1)}</span>
          </div>
          
          <div className="filter-group">
            <label>Min Significance</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={filters.minSignificance}
              onChange={(e) => handleFilterChange({ minSignificance: parseFloat(e.target.value) })}
            />
            <span>{filters.minSignificance.toFixed(2)}</span>
          </div>

          <div className="filter-group">
            <label>Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange({ timeRange: e.target.value })}
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={() => handleFilterChange({})}>Reset Filters</button>
            <button onClick={onRefresh}>Refresh Data</button>
          </div>
        </div>
      </div>
    );
  }, [filters, handleFilterChange, onRefresh]);

  // Render export widget
  const renderExport = useCallback(() => {
    return (
      <div className="export-widget">
        <h4>Export</h4>
        <div className="export-controls">
          <div className="export-group">
            <label>Format</label>
            <select>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          
          <div className="export-group">
            <label>Include</label>
            <div className="checkbox-group">
              <label>
                <input type="checkbox" defaultChecked />
                Correlations
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                Statistics
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                Metadata
              </label>
            </div>
          </div>

          <div className="export-actions">
            <button onClick={() => onExport?.('csv')}>Export CSV</button>
            <button onClick={() => onExport?.('json')}>Export JSON</button>
          </div>
        </div>
      </div>
    );
  }, [onExport]);

  // Render widget based on type
  const renderWidget = useCallback((widget: CorrelationWidget) => {
    switch (widget.type) {
      case 'correlation_matrix':
        return renderCorrelationMatrix();
      case 'summary_stats':
        return renderStatistics();
      case 'insights':
        return renderTopCorrelations();
      case 'histogram':
        return renderDistribution();
      case 'custom':
        if (widget.id === 'filters') return renderFilters();
        if (widget.id === 'export') return renderExport();
        return <div>Custom Widget: {widget.id}</div>;
      default:
        return <div>Unknown Widget Type: {widget.type}</div>;
    }
  }, [renderCorrelationMatrix, renderStatistics, renderTopCorrelations, renderDistribution, renderFilters, renderExport]);

  // Generate default widgets if not provided
  const widgets = useMemo(() => {
    if (config.widgets.length > 0) {
      return config.widgets;
    }

    return [
      {
        id: 'correlation_matrix',
        type: 'correlation_matrix',
        title: 'Correlation Matrix',
        position: { x: 0, y: 0, width: 2, height: 2 },
        config: {
          dataSource: 'correlations',
          filters: {},
          visualization: { type: 'matrix', options: {} },
          interaction: { clickable: true, hoverable: true, selectable: false, zoomable: false },
        },
        data: { query: '', parameters: {}, cache: true, refreshInterval: 0 },
        metadata: { version: '1.0.0', tags: ['correlation', 'matrix'] },
      },
      {
        id: 'statistics',
        type: 'summary_stats',
        title: 'Statistics',
        position: { x: 2, y: 0, width: 1, height: 1 },
        config: {
          dataSource: 'correlations',
          filters: {},
          visualization: { type: 'stats', options: {} },
          interaction: { clickable: false, hoverable: true, selectable: false, zoomable: false },
        },
        data: { query: '', parameters: {}, cache: true, refreshInterval: 0 },
        metadata: { version: '1.0.0', tags: ['statistics', 'summary'] },
      },
      {
        id: 'insights',
        type: 'insights',
        title: 'Top Correlations',
        position: { x: 2, y: 1, width: 1, height: 1 },
        config: {
          dataSource: 'correlations',
          filters: {},
          visualization: { type: 'list', options: { limit: 10 } },
          interaction: { clickable: true, hoverable: true, selectable: false, zoomable: false },
        },
        data: { query: '', parameters: {}, cache: true, refreshInterval: 0 },
        metadata: { version: '1.0.0', tags: ['insights', 'correlations'] },
      },
      {
        id: 'distribution',
        type: 'histogram',
        title: 'Method Distribution',
        position: { x: 0, y: 2, width: 2, height: 1 },
        config: {
          dataSource: 'correlations',
          filters: {},
          visualization: { type: 'bar', options: {} },
          interaction: { clickable: false, hoverable: true, selectable: false, zoomable: false },
        },
        data: { query: '', parameters: {}, cache: true, refreshInterval: 0 },
        metadata: { version: '1.0.0', tags: ['distribution', 'methods'] },
      },
      {
        id: 'filters',
        type: 'custom',
        title: 'Filters',
        position: { x: 2, y: 2, width: 1, height: 1 },
        config: {
          dataSource: 'filters',
          filters: {},
          visualization: { type: 'controls', options: {} },
          interaction: { clickable: true, hoverable: false, selectable: false, zoomable: false },
        },
        data: { query: '', parameters: {}, cache: false, refreshInterval: 0 },
        metadata: { version: '1.0.0', tags: ['filters', 'controls'] },
      },
      {
        id: 'export',
        type: 'custom',
        title: 'Export',
        position: { x: 0, y: 3, width: 1, height: 1 },
        config: {
          dataSource: 'export',
          filters: {},
          visualization: { type: 'controls', options: {} },
          interaction: { clickable: true, hoverable: false, selectable: false, zoomable: false },
        },
        data: { query: '', parameters: {}, cache: false, refreshInterval: 0 },
        metadata: { version: '1.0.0', tags: ['export', 'controls'] },
      },
    ] as CorrelationWidget[];
  }, [config.widgets, renderCorrelationMatrix, renderStatistics, renderTopCorrelations, renderDistribution, renderFilters, renderExport]);

  // Main dashboard style
  const dashboardStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${config.layout.columns}, 1fr)`,
    gridTemplateRows: `repeat(${config.layout.rows}, 1fr)`,
    gap: `${config.layout.gaps}px`,
    padding: '16px',
    backgroundColor: config.theme.background,
    color: config.theme.text,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    ...style,
  }), [config.layout, config.theme, style]);

  // Widget container style
  const widgetStyle = useMemo(() => ({
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out',
  }), []);

  return (
    <div className={`narrative-correlation-dashboard ${className}`} style={dashboardStyle}>
      {/* Header */}
      <div className="dashboard-header" style={{ gridColumn: '1 / -1' }}>
        <div className="header-content">
          <h2>{config.name}</h2>
          {config.description && <p>{config.description}</p>}
        </div>
        <div className="header-actions">
          <button onClick={onRefresh} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <select onChange={(e) => onExport?.(e.target.value as 'csv' | 'json')}>
            <option value="">Export...</option>
            <option value="csv">Export CSV</option>
            <option value="json">Export JSON</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="dashboard-error" style={{ gridColumn: '1 / -1' }}>
          <div className="error-content">
            <h4>Error</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading Display */}
      {isLoading && (
        <div className="dashboard-loading" style={{ gridColumn: '1 / -1' }}>
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Analyzing correlations...</p>
          </div>
        </div>
      )}

      {/* Widgets */}
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className="dashboard-widget"
          style={{
            ...widgetStyle,
            gridColumn: `span ${widget.position.width}`,
            gridRow: `span ${widget.position.height}`,
          }}
        >
          <div className="widget-header">
            <h3>{widget.title}</h3>
            {selectedWidget === widget.id && (
              <button onClick={() => setSelectedWidget(null)}>×</button>
            )}
          </div>
          <div className="widget-content">
            {renderWidget(widget)}
          </div>
        </div>
      ))}

      {/* CSS Styles */}
      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 16px;
          background: linear-gradient(135deg, ${config.theme.primary}10, ${config.theme.secondary}10);
          border-radius: 8px;
        }

        .header-content h2 {
          margin: 0;
          color: ${config.theme.text};
          font-size: 24px;
          font-weight: 600;
        }

        .header-content p {
          margin: 4px 0 0 0;
          color: ${config.theme.secondary};
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .header-actions button,
        .header-actions select {
          padding: 8px 16px;
          border: 1px solid ${config.theme.primary};
          background: white;
          color: ${config.theme.primary};
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .header-actions button:hover,
        .header-actions select:hover {
          background: ${config.theme.primary};
          color: white;
        }

        .dashboard-error {
          padding: 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .error-content h4 {
          margin: 0 0 8px 0;
          color: #dc2626;
        }

        .error-content p {
          margin: 0;
          color: #991b1b;
        }

        .dashboard-loading {
          padding: 32px;
          text-align: center;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .loading-content .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid ${config.theme.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .widget-header h3 {
          margin: 0;
          color: ${config.theme.text};
          font-size: 16px;
          font-weight: 600;
        }

        .widget-header button {
          background: none;
          border: none;
          color: ${config.theme.secondary};
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .widget-header button:hover {
          color: ${config.theme.text};
        }

        .correlation-matrix .matrix-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 4px;
          margin-bottom: 16px;
        }

        .matrix-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease-in-out;
        }

        .matrix-cell:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .cell-content {
          text-align: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .cell-content .method {
          font-size: 10px;
          opacity: 0.8;
        }

        .matrix-legend {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: ${config.theme.secondary};
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-color.positive {
          background: #22c55e;
        }

        .legend-color.negative {
          background: #ef4444;
        }

        .statistics-widget .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 16px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: ${config.theme.primary};
        }

        .stat-label {
          font-size: 12px;
          color: ${config.theme.secondary};
          margin-top: 4px;
        }

        .top-correlations-widget .correlations-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .correlation-item {
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }

        .correlation-item:hover {
          border-color: ${config.theme.primary};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .correlation-item.positive {
          border-left: 4px solid #22c55e;
        }

        .correlation-item.negative {
          border-left: 4px solid #ef4444;
        }

        .correlation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .correlation-header .method {
          font-size: 12px;
          color: ${config.theme.secondary};
        }

        .correlation-header .strength {
          font-weight: 600;
          color: ${config.theme.text};
        }

        .correlation-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: ${config.theme.secondary};
          margin-top: 4px;
        }

        .distribution-widget .distribution-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .distribution-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .distribution-label {
          min-width: 80px;
          font-size: 12px;
          color: ${config.theme.text};
        }

        .distribution-bar {
          flex: 1;
          height: 20px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }

        .distribution-fill {
          height: 100%;
          transition: width 0.3s ease-in-out;
        }

        .distribution-value {
          min-width: 30px;
          text-align: right;
          font-size: 12px;
          color: ${config.theme.text};
          font-weight: 600;
        }

        .filters-widget .filter-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: ${config.theme.text};
        }

        .filter-group input,
        .filter-group select {
          padding: 4px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-size: 12px;
        }

        .filter-actions {
          display: flex;
          gap: 8px;
        }

        .filter-actions button {
          padding: 6px 12px;
          border: 1px solid ${config.theme.primary};
          background: white;
          color: ${config.theme.primary};
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .filter-actions button:hover {
          background: ${config.theme.primary};
          color: white;
        }

        .export-widget .export-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .export-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .export-group label {
          font-size: 12px;
          font-weight: 600;
          color: ${config.theme.text};
        }

        .export-group select {
          padding: 4px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-size: 12px;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: ${config.theme.text};
        }

        .export-actions {
          display: flex;
          gap: 8px;
        }

        .export-actions button {
          padding: 6px 12px;
          border: 1px solid ${config.theme.primary};
          background: white;
          color: ${config.theme.primary};
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .export-actions button:hover {
          background: ${config.theme.primary};
          color: white;
        }
      `}</style>
    </div>
  );
};

export default NarrativeCorrelationDashboard;
