/**
 * Idle Village Crew Fatigue Dashboard - NP-011
 * 
 * React component for displaying crew fatigue dashboard with mini-charts,
 * real-time updates, and configurable visual styling. Follows Gilded
 * Observatory theme with compact, analytics-focused design.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import React, { useMemo } from 'react';
import type { VillageTimeUnit } from '@/engine/game/idleVillage/TimeEngine';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useCrewFatigueData } from '../hooks/useCrewFatigueData';
import type { FatigueLevel } from '../config/fatigueDashboardConfig';
import { getFatigueColor } from '../config/fatigueDashboardConfig';

/**
 * Component props
 */
export interface CrewFatigueDashboardProps {
  /** Village state for fatigue calculations */
  villageState: {
    residents: Record<string, ResidentState>;
    currentTime: VillageTimeUnit;
  };
  /** Custom configuration override */
  config?: Partial<import('../config/fatigueDashboardConfig').FatigueDashboardConfig>;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show compact view */
  compact?: boolean;
}

/**
 * Simple sparkline component for fatigue trends
 */
function FatigueSparkline({ 
  data, 
  color, 
  width = 60, 
  height = 20 
}: { 
  data: number[]; 
  color: string; 
  width?: number; 
  height?: number; 
}) {
  if (data.length < 2) {
    return (
      <div 
        className="inline-block bg-gray-700 rounded"
        style={{ width, height }}
      />
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Crew card component
 */
function CrewCard({ 
  crew, 
  config 
}: { 
  crew: import('../hooks/useCrewFatigueData').CrewFatigueData;
  config: import('../config/fatigueDashboardConfig').FatigueDashboardConfig;
}) {
  const fatigueColor = getFatigueColor(crew.fatigueLevel, config.palette);
  const fatiguePercentage = Math.round(crew.currentFatigue * 100);

  // Generate simple trend data for sparkline (deterministic)
  const trendData = useMemo(() => {
    const base = crew.currentFatigue;
    const hash = crew.crewId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 10 }, (_, i) => {
      // Use hash for deterministic "random" variation
      const variation = ((hash * (i + 1)) % 100 - 50) / 1000; // -0.05 to 0.05
      return Math.max(0, Math.min(1, base + variation));
    });
  }, [crew.currentFatigue, crew.crewId]);

  return (
    <div 
      className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors"
      style={{ 
        borderColor: crew.hasAlert ? config.palette.critical : undefined,
        borderWidth: crew.hasAlert ? '2px' : '1px'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-100 truncate">
          {crew.crewName}
        </h3>
        {crew.hasAlert && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Fatigue bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Fatigue</span>
          <span className="text-xs text-gray-300">{fatiguePercentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${fatiguePercentage}%`,
              backgroundColor: fatigueColor,
            }}
          />
        </div>
      </div>

      {/* Status and trend */}
      <div className="flex justify-between items-center">
        <span 
          className="text-xs font-medium px-2 py-1 rounded"
          style={{
            backgroundColor: `${fatigueColor}20`,
            color: fatigueColor,
          }}
        >
          {crew.fatigueLevel.toUpperCase()}
        </span>
        <div className="flex items-center gap-1">
          <FatigueSparkline data={trendData} color={fatigueColor} />
          <span className="text-xs text-gray-400">
            {crew.trend === 'increasing' ? '↑' : crew.trend === 'decreasing' ? '↓' : '→'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Summary statistics component
 */
function DashboardSummary({ 
  summary, 
  config 
}: { 
  summary: import('../hooks/useCrewFatigueData').FatigueDashboardSummary;
  config: import('../config/fatigueDashboardConfig').FatigueDashboardConfig;
}) {
  const readinessColor = summary.readinessPercentage >= 70 
    ? config.palette.rested 
    : summary.readinessPercentage >= 40 
    ? config.palette.tired 
    : config.palette.critical;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-100 mb-3">Crew Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total crew */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-100">{summary.totalCrew}</div>
          <div className="text-xs text-gray-400">Total Crew</div>
        </div>

        {/* Readiness */}
        <div className="text-center">
          <div 
            className="text-2xl font-bold"
            style={{ color: readinessColor }}
          >
            {Math.round(summary.readinessPercentage)}%
          </div>
          <div className="text-xs text-gray-400">Ready</div>
        </div>

        {/* Average fatigue */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-100">
            {Math.round(summary.averageFatigue * 100)}%
          </div>
          <div className="text-xs text-gray-400">Avg Fatigue</div>
        </div>

        {/* Needing rest */}
        <div className="text-center">
          <div 
            className="text-2xl font-bold"
            style={{ color: summary.needingRest > 0 ? config.palette.critical : config.palette.rested }}
          >
            {summary.needingRest}
          </div>
          <div className="text-xs text-gray-400">Need Rest</div>
        </div>
      </div>

      {/* Fatigue distribution */}
      <div className="mt-4">
        <div className="text-sm text-gray-300 mb-2">Fatigue Distribution</div>
        <div className="flex gap-1 h-6">
          {Object.entries(summary.crewByLevel).map(([level, count]) => {
            const color = getFatigueColor(level as FatigueLevel, config.palette);
            const percentage = summary.totalCrew > 0 ? (count / summary.totalCrew) * 100 : 0;
            
            return (
              <div
                key={level}
                className="flex-1 rounded flex items-center justify-center text-xs text-gray-100"
                style={{ 
                  backgroundColor: color,
                  minWidth: percentage > 0 ? '40px' : '0'
                }}
              >
                {percentage > 10 && count}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {Object.entries(summary.crewByLevel).map(([level, count]) => (
            <div key={level} className="flex-1 text-xs text-gray-400 text-center">
              {level} ({count})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Crew Fatigue Dashboard component
 */
export function CrewFatigueDashboard({
  villageState,
  config: customConfig,
  className = '',
}: Omit<CrewFatigueDashboardProps, 'compact'>) {
  const {
    config,
    crewData,
    summary,
    isLoading,
    lastUpdate,
    exportData,
    refreshData,
  } = useCrewFatigueData({
    config: customConfig,
    villageState,
  });

  const crewList = useMemo(() => Object.values(crewData), [crewData]);

  if (isLoading) {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="animate-pulse">Loading crew fatigue data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-6 ${className}`} data-testid="crew-fatigue-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-100">Crew Fatigue Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              const data = exportData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `crew-fatigue-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Summary */}
      {config.layout.showSummary && (
        <DashboardSummary summary={summary} config={config} />
      )}

      {/* Crew grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-100 mb-3">Crew Status</h2>
        <div 
          className="grid gap-3"
          data-testid="crew-grid"
          style={{
            gridTemplateColumns: `repeat(${config.layout.crewPerRow}, minmax(0, 1fr))`,
          }}
        >
          {crewList.map((crew) => (
            <CrewCard key={crew.crewId} crew={crew} config={config} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default CrewFatigueDashboard;
