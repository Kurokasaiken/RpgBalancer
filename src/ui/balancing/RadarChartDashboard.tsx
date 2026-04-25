/**
 * Radar Chart Dashboard for Phase 10.5
 * 
 * Complete dashboard page for radar chart visualization of archetype stat profiles
 * with integration for stress testing, marginal utility analysis, and comparison features.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StatProfileRadar } from './components/StatProfileRadarChart';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import type { StressTestArchetype } from '@/balancing/stressTesting/types';
import type { BalancerConfig } from '@/balancing/config/types';

/**
 * Radar Chart Dashboard Component
 */
export function RadarChartDashboard() {
  const [balancerConfig, setBalancerConfig] = useState<BalancerConfig | null>(null);
  const [archetypes, setArchetypes] = useState<StressTestArchetype[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load configuration and generate archetypes
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Load balancer configuration
        const config = await BalancerConfigStore.load();
        setBalancerConfig(config);

        // Generate archetypes
        const generator = await StressTestArchetypeGenerator.create(42);
        const generatedArchetypes = generator.generateArchetypes();
        setArchetypes(generatedArchetypes);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('[RadarChartDashboard] Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter archetypes for display
  const displayArchetypes = useMemo(() => {
    if (!archetypes.length) return [];
    
    // Show a representative sample
    const sampleSize = Math.min(8, archetypes.length);
    return archetypes.slice(0, sampleSize);
  }, [archetypes]);

  // Loading state
  if (isLoading) {
    return (
      <div className="radar-dashboard p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading radar chart data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="radar-dashboard p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-2">Error loading radar chart</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!balancerConfig || !displayArchetypes.length) {
    return (
      <div className="radar-dashboard p-6">
        <div className="text-center">
          <p className="text-gray-500">No data available for radar chart visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="radar-dashboard p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Stat Profile Radar Charts
        </h1>
        <p className="text-gray-600">
          Visualize archetype stat profiles with interactive radar charts
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Stats</h3>
          <p className="text-2xl font-bold text-gray-900">
            {Object.keys(balancerConfig.stats).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Archetypes</h3>
          <p className="text-2xl font-bold text-gray-900">
            {archetypes.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Displayed</h3>
          <p className="text-2xl font-bold text-gray-900">
            {displayArchetypes.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Core Stats</h3>
          <p className="text-2xl font-bold text-gray-900">
            {Object.values(balancerConfig.stats).filter(stat => stat.isCore).length}
          </p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Archetype Stat Profiles
        </h2>
        <StatProfileRadar
          archetypes={displayArchetypes}
          balancerConfig={balancerConfig}
          size="large"
          showDatasetControls={true}
          showExportControls={true}
          className="mx-auto"
        />
      </div>

      {/* Archetype Details */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Archetype Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayArchetypes.map(archetype => (
            <div key={archetype.id} className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">{archetype.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{archetype.description}</p>
              <div className="text-xs text-gray-500">
                <p>Type: {archetype.type}</p>
                <p>Points per stat: {archetype.pointsPerStat}</p>
                <p>Stats tested: {archetype.testedStats.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Configuration Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Stat Categories</h3>
            <div className="space-y-1">
              {Object.entries(balancerConfig.stats).map(([id, stat]) => (
                <div key={id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className="text-gray-900">Weight: {stat.weight}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Chart Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Interactive dataset selection</li>
              <li>• Export to JSON/CSV</li>
              <li>• Configurable color schemes</li>
              <li>• Responsive sizing</li>
              <li>• Hover tooltips</li>
              <li>• Baseline comparison</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
