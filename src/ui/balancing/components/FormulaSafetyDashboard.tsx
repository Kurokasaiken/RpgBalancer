/**
 * Formula Safety Dashboard
 *
 * React component for displaying FormulaEngine safety analysis, linting results,
 * and cycle detection in the Config Balancer system. Provides interactive filtering,
 * detailed views, and export capabilities.
 *
 * @module FormulaSafetyDashboard
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback } from 'react';
import { useFormulaSafety, type FormulaSafetyFilters } from '../hooks/useFormulaSafety';
import type { StatDefinition } from '@/balancing/config/types';

export interface FormulaSafetyDashboardProps {
  /** Configuration for the formula safety analysis */
  config?: {
    /** Auto-refresh interval in milliseconds */
    autoRefreshInterval?: number;
    /** Custom stat definitions */
    statDefinitions?: StatDefinition[];
    /** Enable telemetry */
    enableTelemetry?: boolean;
  };
  /** CSS class name */
  className?: string;
}

/**
 * Formula Safety Dashboard Component
 *
 * Displays comprehensive formula safety analysis with filtering and export capabilities.
 *
 * @example
 * ```tsx
 * <FormulaSafetyDashboard
 *   config={{
 *     autoRefreshInterval: 30000,
 *     enableTelemetry: true
 *   }}
 * />
 * ```
 */
export const FormulaSafetyDashboard: React.FC<FormulaSafetyDashboardProps> = ({
  config = {},
  className = '',
}) => {
  const {
    formulas,
    filteredFormulas,
    filters,
    stats,
    isLoading,
    error,
    lastRefresh,
    setFilters,
    refreshAnalysis,
    analyzeFormula,
    clearAll,
    exportData,
  } = useFormulaSafety(config);

  const [selectedFormula, setSelectedFormula] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const currentError = error || localError;

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey: keyof FormulaSafetyFilters, value: string | boolean | undefined) => {
    setFilters({ [filterKey]: value });
  }, [setFilters]);

  // Handle formula selection
  const handleFormulaSelect = useCallback((formulaId: string) => {
    setSelectedFormula(formulaId === selectedFormula ? null : formulaId);
  }, [selectedFormula]);

  // Handle export
  const handleExport = useCallback((format: 'json' | 'csv') => {
    const data = exportData(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formula-safety-analysis.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportData]);

  // Handle manual formula analysis
  const handleAnalyzeFormula = useCallback(async () => {
    const cardName = prompt('Enter card name:');
    const formula = prompt('Enter formula:');

    if (cardName && formula) {
      const id = `manual_${Date.now()}`;
      await analyzeFormula(id, cardName, formula);
    }
  }, [analyzeFormula]);

  const selectedFormulaData = selectedFormula
    ? formulas.find(f => f.id === selectedFormula)
    : null;

  return (
    <div className={`formula-safety-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <h2>🛡️ Formula Safety Dashboard</h2>
        <div className="header-controls">
          <button
            className="control-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button
            className="control-button"
            onClick={handleAnalyzeFormula}
            disabled={isLoading}
          >
            Analyze Formula
          </button>
          <button
            className="control-button"
            onClick={() => refreshAnalysis()}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          <button
            className="control-button danger"
            onClick={clearAll}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Error Display */}
      {currentError && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{currentError}</span>
          <button
            className="error-close"
            onClick={() => setLocalError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-value">{stats.totalFormulas}</div>
          <div className="stat-label">Total Formulas</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.formulasWithWarnings}</div>
          <div className="stat-label">With Warnings</div>
        </div>
        <div className="stat-card error">
          <div className="stat-value">{stats.formulasWithErrors}</div>
          <div className="stat-label">With Errors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.formulasWithCycles}</div>
          <div className="stat-label">With Cycles</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.formulasWithRangeIssues}</div>
          <div className="stat-label">Range Issues</div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <h3>Filters</h3>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Severity:</label>
              <select
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value || undefined)}
              >
                <option value="">All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Card Name:</label>
              <input
                type="text"
                value={filters.cardName || ''}
                onChange={(e) => handleFilterChange('cardName', e.target.value || undefined)}
                placeholder="Filter by card name..."
              />
            </div>

            <div className="filter-group">
              <label>Warning Type:</label>
              <select
                value={filters.warningType || ''}
                onChange={(e) => handleFilterChange('warningType', e.target.value || undefined)}
              >
                <option value="">All</option>
                <option value="range">Range</option>
                <option value="division">Division</option>
                <option value="complexity">Complexity</option>
                <option value="performance">Performance</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Complexity:</label>
              <select
                value={filters.complexity || ''}
                onChange={(e) => handleFilterChange('complexity', e.target.value || undefined)}
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={filters.hasCycles || false}
                  onChange={(e) => handleFilterChange('hasCycles', e.target.checked || undefined)}
                />
                Has Cycles
              </label>
            </div>

            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={filters.hasRangeIssues || false}
                  onChange={(e) => handleFilterChange('hasRangeIssues', e.target.checked || undefined)}
                />
                Range Issues
              </label>
            </div>
          </div>

          <div className="filter-actions">
            <button
              className="filter-button"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Export Controls */}
      <div className="export-controls">
        <span className="export-label">Export:</span>
        <button
          className="export-button"
          onClick={() => handleExport('json')}
          disabled={filteredFormulas.length === 0}
        >
          📄 JSON
        </button>
        <button
          className="export-button"
          onClick={() => handleExport('csv')}
          disabled={filteredFormulas.length === 0}
        >
          📊 CSV
        </button>
        <span className="last-refresh">
          Last refresh: {new Date(lastRefresh).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Formula List */}
        <div className="formula-list">
          <h3>Formulas ({filteredFormulas.length})</h3>
          {filteredFormulas.length === 0 ? (
            <div className="empty-state">
              <p>No formulas match the current filters.</p>
              <p>Add formulas using the "Analyze Formula" button above.</p>
            </div>
          ) : (
            <div className="formula-items">
              {filteredFormulas.map(formula => (
                <div
                  key={formula.id}
                  className={`formula-item ${formula.id === selectedFormula ? 'selected' : ''}`}
                  onClick={() => handleFormulaSelect(formula.id)}
                >
                  <div className="formula-header">
                    <span className="formula-card">{formula.cardName}</span>
                    <div className="formula-badges">
                      {formula.validationResult.warnings?.map((warning, index) => (
                        <span
                          key={index}
                          className={`badge ${warning.severity}`}
                        >
                          {warning.type}
                        </span>
                      ))}
                      {formula.validationResult.safety?.hasCycles && (
                        <span className="badge error">Cycle</span>
                      )}
                      {formula.validationResult.safety?.rangeIssues.length > 0 && (
                        <span className="badge warning">Range</span>
                      )}
                    </div>
                  </div>
                  <div className="formula-content">
                    <code className="formula-text">{formula.formula}</code>
                  </div>
                  <div className="formula-meta">
                    <span className="complexity">
                      Complexity: {formula.validationResult.safety?.complexity || 'unknown'}
                    </span>
                    <span className="last-analyzed">
                      {new Date(formula.lastAnalyzed).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedFormulaData && (
          <div className="detail-panel">
            <h3>Formula Details</h3>
            <div className="detail-content">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Card:</span>
                    <span className="value">{selectedFormulaData.cardName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Formula:</span>
                    <code className="value formula">{selectedFormulaData.formula}</code>
                  </div>
                  <div className="detail-item">
                    <span className="label">Valid:</span>
                    <span className={`value ${selectedFormulaData.validationResult.valid ? 'success' : 'error'}`}>
                      {selectedFormulaData.validationResult.valid ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedFormulaData.validationResult.safety && (
                <div className="detail-section">
                  <h4>Safety Analysis</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Cycles:</span>
                      <span className={`value ${selectedFormulaData.validationResult.safety.hasCycles ? 'error' : 'success'}`}>
                        {selectedFormulaData.validationResult.safety.hasCycles ? '⚠️ Detected' : '✅ None'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Complexity:</span>
                      <span className="value">{selectedFormulaData.validationResult.safety.complexity}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Operations:</span>
                      <span className="value">{selectedFormulaData.validationResult.safety.estimatedOperations}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Division Risk:</span>
                      <span className={`value ${selectedFormulaData.validationResult.safety.divisionRisk ? 'warning' : 'success'}`}>
                        {selectedFormulaData.validationResult.safety.divisionRisk ? '⚠️ Yes' : '✅ No'}
                      </span>
                    </div>
                  </div>

                  {selectedFormulaData.validationResult.safety.rangeIssues.length > 0 && (
                    <div className="range-issues">
                      <h5>Range Issues:</h5>
                      <ul>
                        {selectedFormulaData.validationResult.safety.rangeIssues.map((issue, index) => (
                          <li key={index} className="range-issue">
                            <strong>{issue.stat}:</strong> {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedFormulaData.validationResult.warnings && selectedFormulaData.validationResult.warnings.length > 0 && (
                <div className="detail-section">
                  <h4>Warnings ({selectedFormulaData.validationResult.warnings.length})</h4>
                  <div className="warnings-list">
                    {selectedFormulaData.validationResult.warnings.map((warning, index) => (
                      <div key={index} className={`warning-item ${warning.severity}`}>
                        <div className="warning-header">
                          <span className="warning-type">{warning.type}</span>
                          <span className={`warning-severity ${warning.severity}`}>
                            {warning.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="warning-message">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
