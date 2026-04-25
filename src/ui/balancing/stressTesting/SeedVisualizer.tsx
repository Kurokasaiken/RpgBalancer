/**
 * Seed Visualizer Component
 * 
 * Retro terminal-styled visualizer for LCG seed analysis and diagnostics.
 * Displays seed representations, quality metrics, and distribution histograms.
 * 
 * @module SeedVisualizer
 * @since 2026-01-11
 * @author Atlas-RNG
 */

import React, { useState, useMemo } from 'react';
import {
  generateSeedVisualization,
  runLCGDiagnostics,
  compareSeedSequences,
} from '@/balancing/utils/archmage/LCGDiagnostics';

/**
 * Default seed value (computed once at module load)
 */
const DEFAULT_SEED = Date.now();

/**
 * Props for SeedVisualizer component
 */
export interface SeedVisualizerProps {
  /** Initial seed to visualize */
  initialSeed?: number;
  /** Whether to show advanced diagnostics */
  showDiagnostics?: boolean;
  /** Whether to enable seed comparison mode */
  enableComparison?: boolean;
  /** Callback when seed changes */
  onSeedChange?: (seed: number) => void;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Seed Visualizer component with retro terminal styling
 * 
 * @example
 * ```tsx
 * <SeedVisualizer
 *   initialSeed={12345}
 *   showDiagnostics={true}
 *   onSeedChange={handleSeedChange}
 * />
 * ```
 */
export const SeedVisualizer: React.FC<SeedVisualizerProps> = ({
  initialSeed = DEFAULT_SEED,
  showDiagnostics = false,
  enableComparison = false,
  onSeedChange,
  testId = 'seed-visualizer',
}) => {
  const [seed, setSeed] = useState(initialSeed);
  const [compareSeed, setCompareSeed] = useState<number | null>(null);
  const [sampleCount, setSampleCount] = useState(10000);

  // Generate visualization data
  const vizData = useMemo(() => generateSeedVisualization(seed), [seed]);
  
  // Generate diagnostics if enabled
  const diagnostics = useMemo(
    () => (showDiagnostics ? runLCGDiagnostics(seed, sampleCount) : null),
    [seed, sampleCount, showDiagnostics]
  );

  // Generate comparison if enabled
  const comparison = useMemo(
    () => (enableComparison && compareSeed !== null
      ? compareSeedSequences(seed, compareSeed, 100)
      : null),
    [seed, compareSeed, enableComparison]
  );

  const handleSeedChange = (newSeed: number) => {
    setSeed(newSeed);
    onSeedChange?.(newSeed);
  };

  const handleRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 4294967296);
    handleSeedChange(randomSeed);
  };

  return (
    <div
      className="seed-visualizer font-mono bg-slate-900 text-green-400 p-6 rounded-lg border-2 border-green-600"
      data-testid={testId}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-300 mb-2">
          ⚙️ LCG Seed Visualizer
        </h2>
        <p className="text-green-500 text-sm">
          Deterministic RNG Analysis & Diagnostics
        </p>
      </div>

      {/* Seed Input */}
      <div className="mb-6 p-4 bg-black/40 rounded border border-green-700">
        <label className="block text-green-300 mb-2 font-bold">
          SEED INPUT
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={seed}
            onChange={(e) => handleSeedChange(Number(e.target.value))}
            className="flex-1 bg-black text-green-400 border border-green-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            data-testid={`${testId}-input`}
          />
          <button
            onClick={handleRandomSeed}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-black font-bold rounded transition-colors"
            data-testid={`${testId}-random-btn`}
          >
            RANDOM
          </button>
        </div>
      </div>

      {/* Seed Representations */}
      <div className="mb-6 p-4 bg-black/40 rounded border border-green-700">
        <h3 className="text-green-300 font-bold mb-3">REPRESENTATIONS</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-500">Original:</span>
            <span className="text-green-400 font-bold">{vizData.seed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-500">Normalized:</span>
            <span className="text-green-400 font-bold">{vizData.normalizedSeed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-500">Hexadecimal:</span>
            <span className="text-green-400 font-bold">{vizData.hex}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-green-500">Binary:</span>
            <span className="text-green-400 font-mono text-xs break-all">
              {vizData.binary}
            </span>
          </div>
        </div>
      </div>

      {/* Quality Score */}
      <div className="mb-6 p-4 bg-black/40 rounded border border-green-700">
        <h3 className="text-green-300 font-bold mb-3">QUALITY SCORE</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-black rounded-full h-8 border border-green-600 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
              style={{ width: `${vizData.qualityScore}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-green-300 min-w-[4rem] text-right">
            {Math.round(vizData.qualityScore)}%
          </span>
        </div>
        <p className="text-green-500 text-xs mt-2">
          Based on distribution uniformity (higher is better)
        </p>
      </div>

      {/* Distribution Histogram */}
      <div className="mb-6 p-4 bg-black/40 rounded border border-green-700">
        <h3 className="text-green-300 font-bold mb-3">DISTRIBUTION (1000 samples)</h3>
        <div className="flex items-end gap-1 h-32">
          {vizData.histogram.map((count, idx) => {
            const height = (count / Math.max(...vizData.histogram)) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-green-600 rounded-t transition-all duration-300"
                  style={{ height: `${height}%` }}
                  title={`Bucket ${idx}: ${count} samples`}
                />
                <span className="text-green-500 text-xs">{idx}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Values */}
      <div className="mb-6 p-4 bg-black/40 rounded border border-green-700">
        <h3 className="text-green-300 font-bold mb-3">PREVIEW (first 20 values)</h3>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {vizData.preview.map((val, idx) => (
            <div key={idx} className="bg-black px-2 py-1 rounded border border-green-700">
              <span className="text-green-500">[{idx}]</span>{' '}
              <span className="text-green-400">{val.toFixed(6)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Diagnostics */}
      {showDiagnostics && diagnostics && (
        <div className="mb-6 p-4 bg-black/40 rounded border border-amber-600">
          <h3 className="text-amber-300 font-bold mb-3">ADVANCED DIAGNOSTICS</h3>
          
          {/* Sample Count Control */}
          <div className="mb-4">
            <label className="block text-amber-400 mb-2 text-sm">
              Sample Count: {sampleCount.toLocaleString()}
            </label>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={sampleCount}
              onChange={(e) => setSampleCount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Distribution Stats */}
          <div className="mb-4 space-y-2 text-sm">
            <h4 className="text-amber-300 font-bold">Distribution Statistics</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-amber-500">Mean:</span>{' '}
                <span className="text-amber-400">{diagnostics.distribution.mean.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-amber-500">Std Dev:</span>{' '}
                <span className="text-amber-400">{diagnostics.distribution.stdDev.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-amber-500">Min:</span>{' '}
                <span className="text-amber-400">{diagnostics.distribution.min.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-amber-500">Max:</span>{' '}
                <span className="text-amber-400">{diagnostics.distribution.max.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Chi-Squared Test */}
          <div className="mb-4 space-y-2 text-sm">
            <h4 className="text-amber-300 font-bold">Chi-Squared Uniformity Test</h4>
            <div className="space-y-1">
              <div>
                <span className="text-amber-500">Statistic:</span>{' '}
                <span className="text-amber-400">{diagnostics.chiSquared.statistic.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-amber-500">Degrees of Freedom:</span>{' '}
                <span className="text-amber-400">{diagnostics.chiSquared.degreesOfFreedom}</span>
              </div>
              <div>
                <span className="text-amber-500">Result:</span>{' '}
                <span className={diagnostics.chiSquared.isUniform ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.chiSquared.isUniform ? '✓ UNIFORM' : '✗ NON-UNIFORM'}
                </span>
              </div>
            </div>
          </div>

          {/* Reproducibility */}
          <div className="mb-4 space-y-2 text-sm">
            <h4 className="text-amber-300 font-bold">Reproducibility Test</h4>
            <div>
              <span className="text-amber-500">Status:</span>{' '}
              <span className={diagnostics.reproducibility.isReproducible ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.reproducibility.isReproducible ? '✓ REPRODUCIBLE' : '✗ NOT REPRODUCIBLE'}
              </span>
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-2 text-sm">
            <h4 className="text-amber-300 font-bold">Performance Metrics</h4>
            <div className="space-y-1">
              <div>
                <span className="text-amber-500">Generation Time:</span>{' '}
                <span className="text-amber-400">{diagnostics.performance.generationTime.toFixed(2)} ms</span>
              </div>
              <div>
                <span className="text-amber-500">Throughput:</span>{' '}
                <span className="text-amber-400">
                  {Math.round(diagnostics.performance.samplesPerMs).toLocaleString()} samples/ms
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seed Comparison */}
      {enableComparison && (
        <div className="p-4 bg-black/40 rounded border border-blue-600">
          <h3 className="text-blue-300 font-bold mb-3">SEED COMPARISON</h3>
          <div className="mb-4">
            <label className="block text-blue-400 mb-2 text-sm">
              Compare with Seed:
            </label>
            <input
              type="number"
              value={compareSeed ?? ''}
              onChange={(e) => setCompareSeed(e.target.value ? Number(e.target.value) : null)}
              placeholder="Enter seed to compare"
              className="w-full bg-black text-blue-400 border border-blue-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid={`${testId}-compare-input`}
            />
          </div>

          {comparison && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-blue-500">Correlation:</span>{' '}
                <span className="text-blue-400">{comparison.correlation.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-blue-500">Divergence Point:</span>{' '}
                <span className="text-blue-400">
                  {comparison.divergencePoint !== null ? `Sample ${comparison.divergencePoint}` : 'None'}
                </span>
              </div>
              <div>
                <span className="text-blue-500">Max Difference:</span>{' '}
                <span className="text-blue-400">{comparison.maxDifference.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-blue-500">Avg Difference:</span>{' '}
                <span className="text-blue-400">{comparison.averageDifference.toFixed(6)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeedVisualizer;
