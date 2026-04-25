/**
 * Stat Stress Telemetry Dashboard - NP-035
 * 
 * Interactive dashboard for visualizing stat stress testing results with
 * heatmaps, charts, filters, and real-time updates.
 * 
 * @since 2026-01-24
 * @author Helios-Balancer
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useStatStressTelemetry } from '../hooks/useStatStressTelemetry';
import type { FilterState } from '../hooks/useStatStressTelemetry';
import { getSynergyColor, isSynergy, isAntisynergy } from '../config/statStressTelemetryConfig';

/**
 * Dashboard component
 */
export function StatStressTelemetryDashboard() {
  const {
    data,
    filteredData,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    error,
    refresh,
    config,
  } = useStatStressTelemetry();

  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  const handleArchetypeTypeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as FilterState['archetypeType'];
    setFilters({ archetypeType: value });
  }, [setFilters]);

  const handleWinRateMinChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setFilters({ winRateRange: [value, filters.winRateRange[1]] });
  }, [filters.winRateRange, setFilters]);

  const handleWinRateMaxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setFilters({ winRateRange: [filters.winRateRange[0], value] });
  }, [filters.winRateRange, setFilters]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: event.target.value });
  }, [setFilters]);

  const handleCheckboxChange = useCallback((key: 'showSynergies' | 'showAntisynergies') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ [key]: event.target.checked });
  }, [setFilters]);

  // Track telemetry on mount
  useEffect(() => {
    if (config.telemetry.enabled) {
      const event = {
        event: 'balancer_stat_stress_dashboard_viewed',
        timestamp: Date.now(),
        data: {
          totalArchetypes: data?.summary.totalArchetypes || 0,
          synergies: data?.summary.synergies || 0,
          antisynergies: data?.summary.antisynergies || 0,
          avgWinRate: data?.summary.avgWinRate || 0,
        },
      };
      console.log('[Telemetry]', event);
    }
  }, [data, config.telemetry.enabled]);

  if (isLoading) {
    return (
      <div className="stat-stress-dashboard loading">
        <div className="loading-spinner">Loading stress test data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-stress-dashboard error">
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  if (!filteredData) {
    return null;
  }

  const heatmapConfig = config.charts.find(c => c.id === 'synergy-heatmap');

  return (
    <div className="stat-stress-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>{config.title}</h1>
        <p>{config.description}</p>
        <div className="header-actions">
          <button onClick={refresh} className="refresh-button">
            🔄 Refresh
          </button>
          <button onClick={resetFilters} className="reset-button">
            Reset Filters
          </button>
        </div>
      </header>

      {/* Summary Stats */}
      <section className="summary-stats">
        <div className="stat-card">
          <div className="stat-label">Total Archetypes</div>
          <div className="stat-value">{filteredData.summary.totalArchetypes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Win Rate</div>
          <div className="stat-value">{filteredData.summary.avgWinRate.toFixed(1)}%</div>
        </div>
        <div className="stat-card synergy">
          <div className="stat-label">Synergies</div>
          <div className="stat-value">{filteredData.summary.synergies}</div>
        </div>
        <div className="stat-card antisynergy">
          <div className="stat-label">Anti-synergies</div>
          <div className="stat-value">{filteredData.summary.antisynergies}</div>
        </div>
      </section>

      {/* Filters */}
      <section className="filters">
        <h2>Filters</h2>
        <div className="filter-grid">
          {/* Archetype Type Filter */}
          <div className="filter-item">
            <label>Archetype Type</label>
            <select
              value={filters.archetypeType}
              onChange={handleArchetypeTypeChange}
            >
              <option value="all">All Types</option>
              <option value="single">Single Stat</option>
              <option value="pair">Stat Pairs</option>
            </select>
          </div>

          {/* Win Rate Range */}
          <div className="filter-item">
            <label>Win Rate Range: {filters.winRateRange[0]}% - {filters.winRateRange[1]}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.winRateRange[0]}
              onChange={handleWinRateMinChange}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={filters.winRateRange[1]}
              onChange={handleWinRateMaxChange}
            />
          </div>

          {/* Toggles */}
          <div className="filter-item">
            <label>
              <input
                type="checkbox"
                checked={filters.showSynergies}
                onChange={handleCheckboxChange('showSynergies')}
              />
              Show Only Synergies
            </label>
          </div>

          <div className="filter-item">
            <label>
              <input
                type="checkbox"
                checked={filters.showAntisynergies}
                onChange={handleCheckboxChange('showAntisynergies')}
              />
              Show Only Anti-synergies
            </label>
          </div>

          {/* Search */}
          <div className="filter-item search">
            <label>Search Archetypes</label>
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </section>

      {/* Synergy Heatmap */}
      {heatmapConfig && (
        <section className="chart-section">
          <h2>{heatmapConfig.title}</h2>
          <p>{heatmapConfig.description}</p>
          <div className="synergy-heatmap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  {filteredData.stats.map(stat => (
                    <th key={stat}>{stat}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.marginalUtility.map(mu => (
                  <tr key={mu.stat}>
                    <th>{mu.stat}</th>
                    {filteredData.stats.map(stat2 => {
                      if (stat2 === mu.stat) {
                        return <td key={stat2} className="diagonal">-</td>;
                      }
                      const pair = mu.pairs.find(p => p.stat2 === stat2);
                      if (!pair) {
                        return <td key={stat2}>-</td>;
                      }
                      const color = getSynergyColor(pair.synergyMultiplier, heatmapConfig);
                      const className = isSynergy(pair.synergyMultiplier, heatmapConfig)
                        ? 'synergy'
                        : isAntisynergy(pair.synergyMultiplier, heatmapConfig)
                        ? 'antisynergy'
                        : 'neutral';
                      return (
                        <td
                          key={stat2}
                          className={className}
                          style={{ backgroundColor: color }}
                          title={`${mu.stat} + ${stat2}: ${pair.synergyMultiplier.toFixed(2)}x`}
                        >
                          {pair.synergyMultiplier.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Marginal Utility Bar Chart */}
      <section className="chart-section">
        <h2>Marginal Utility by Stat</h2>
        <div className="bar-chart">
          {filteredData.marginalUtility.map(mu => (
            <div key={mu.stat} className="bar-item">
              <div className="bar-label">{mu.stat}</div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(mu.singleStatWinRate / 100) * 100}%`,
                    backgroundColor: config.charts[1].colorScheme.primary,
                  }}
                >
                  {mu.singleStatWinRate.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Results Table */}
      <section className="chart-section">
        <h2>Detailed Results</h2>
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Archetype</th>
                <th>Type</th>
                <th>Win Rate</th>
                <th>Avg Damage</th>
                <th>Avg Survival</th>
                <th>Simulations</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.archetypes.slice(0, 20).map(archetype => (
                <tr
                  key={archetype.id}
                  className={selectedArchetype === archetype.id ? 'selected' : ''}
                  onClick={() => setSelectedArchetype(archetype.id)}
                >
                  <td>{archetype.name}</td>
                  <td>{archetype.type}</td>
                  <td>{archetype.winRate.toFixed(1)}%</td>
                  <td>{archetype.avgDamage.toFixed(0)}</td>
                  <td>{archetype.avgSurvival.toFixed(0)}</td>
                  <td>{archetype.simulations.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.archetypes.length > 20 && (
            <div className="table-footer">
              Showing 20 of {filteredData.archetypes.length} archetypes
            </div>
          )}
        </div>
      </section>

      {/* Legend */}
      <section className="legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color synergy"></div>
            <span>Synergy (≥1.15x)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color antisynergy"></div>
            <span>Anti-synergy (≤0.95x)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color neutral"></div>
            <span>Neutral (0.95-1.15x)</span>
          </div>
        </div>
      </section>

      <style>{`
        .stat-stress-dashboard {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Courier New', monospace;
          background: #1a1a2e;
          color: #eee;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: #ffd700;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .header-actions button {
          padding: 0.5rem 1rem;
          background: #2a2a4e;
          border: 1px solid #ffd700;
          color: #ffd700;
          cursor: pointer;
          font-family: inherit;
        }

        .header-actions button:hover {
          background: #3a3a6e;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #2a2a4e;
          padding: 1.5rem;
          border: 1px solid #444;
          text-align: center;
        }

        .stat-card.synergy {
          border-color: #10b981;
        }

        .stat-card.antisynergy {
          border-color: #ef4444;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #aaa;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #ffd700;
        }

        .filters {
          background: #2a2a4e;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid #444;
        }

        .filters h2 {
          margin-bottom: 1rem;
          color: #ffd700;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .filter-item label {
          display: block;
          margin-bottom: 0.5rem;
          color: #ccc;
        }

        .filter-item select,
        .filter-item input[type="text"] {
          width: 100%;
          padding: 0.5rem;
          background: #1a1a2e;
          border: 1px solid #444;
          color: #eee;
          font-family: inherit;
        }

        .filter-item input[type="range"] {
          width: 100%;
        }

        .chart-section {
          background: #2a2a4e;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid #444;
        }

        .chart-section h2 {
          margin-bottom: 0.5rem;
          color: #ffd700;
        }

        .synergy-heatmap {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .synergy-heatmap table {
          width: 100%;
          border-collapse: collapse;
        }

        .synergy-heatmap th,
        .synergy-heatmap td {
          padding: 0.75rem;
          text-align: center;
          border: 1px solid #444;
        }

        .synergy-heatmap th {
          background: #1a1a2e;
          color: #ffd700;
          font-weight: bold;
        }

        .synergy-heatmap td.diagonal {
          background: #1a1a2e;
          color: #666;
        }

        .synergy-heatmap td.synergy {
          color: #fff;
          font-weight: bold;
        }

        .synergy-heatmap td.antisynergy {
          color: #fff;
          font-weight: bold;
        }

        .bar-chart {
          margin-top: 1rem;
        }

        .bar-item {
          margin-bottom: 1rem;
        }

        .bar-label {
          margin-bottom: 0.25rem;
          color: #ccc;
        }

        .bar-container {
          background: #1a1a2e;
          height: 30px;
          border: 1px solid #444;
          position: relative;
        }

        .bar-fill {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 0.5rem;
          color: #fff;
          font-weight: bold;
        }

        .results-table-container {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
        }

        .results-table th,
        .results-table td {
          padding: 0.75rem;
          text-align: left;
          border: 1px solid #444;
        }

        .results-table th {
          background: #1a1a2e;
          color: #ffd700;
          font-weight: bold;
        }

        .results-table tr:hover {
          background: #3a3a6e;
          cursor: pointer;
        }

        .results-table tr.selected {
          background: #4a4a8e;
        }

        .table-footer {
          margin-top: 0.5rem;
          color: #aaa;
          font-size: 0.875rem;
        }

        .legend {
          background: #2a2a4e;
          padding: 1.5rem;
          border: 1px solid #444;
        }

        .legend h3 {
          margin-bottom: 1rem;
          color: #ffd700;
        }

        .legend-items {
          display: flex;
          gap: 2rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-color {
          width: 30px;
          height: 20px;
          border: 1px solid #444;
        }

        .legend-color.synergy {
          background: #10b981;
        }

        .legend-color.antisynergy {
          background: #ef4444;
        }

        .legend-color.neutral {
          background: #6b7280;
        }

        .loading, .error {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          font-size: 1.5rem;
        }

        .error-message {
          text-align: center;
        }

        .error-message button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #ef4444;
          border: none;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
