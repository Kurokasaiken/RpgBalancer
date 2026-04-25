import { useMemo, useState, useCallback } from 'react';
import type { SynergyResult } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import { getAssessmentColor } from '@/balancing/stressTesting/types';

/**
 * Props for SynergyHeatmap component
 */
export interface SynergyHeatmapProps {
  synergies: SynergyResult[];
  className?: string;
  onCellHover?: (stat1: string, stat2: string, synergy: SynergyResult | null) => void;
  onCellClick?: (stat1: string, stat2: string, synergy: SynergyResult | null) => void;
  exportable?: boolean;
}

/**
 * Configuration for heatmap visualization
 */
const HEATMAP_CONFIG = {
  opThreshold: 1.15,
  weakThreshold: 0.95,
  colorSchemes: {
    op: { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)', text: 'white' },
    strong: { bg: 'rgba(251, 146, 60, 0.8)', border: 'rgb(251, 146, 60)', text: 'white' },
    balanced: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)', text: 'white' },
    weak: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)', text: 'white' },
    underpowered: { bg: 'rgba(147, 51, 234, 0.8)', border: 'rgb(147, 51, 234)', text: 'white' },
    neutral: { bg: 'rgba(107, 114, 128, 0.4)', border: 'rgb(107, 114, 128)', text: 'white' },
  }
} as const;

/**
 * Enhanced SynergyHeatmap component with interactive features and Gilded Observatory theme
 */
export function SynergyHeatmap({ 
  synergies, 
  className = '', 
  onCellHover,
  onCellClick,
  exportable = true 
}: SynergyHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ stat1: string; stat2: string; synergy: SynergyResult } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ stat1: string; stat2: string; synergy: SynergyResult | null } | null>(null);
  const [showThresholds, setShowThresholds] = useState(true);

  const { stats, matrix, statistics } = useMemo(() => {
    const statSet = new Set<string>();
    synergies.forEach(synergy => {
      statSet.add(synergy.statIds[0]);
      statSet.add(synergy.statIds[1]);
    });
    const stats = Array.from(statSet).sort();
    
    // Build synergy matrix
    const matrix: Record<string, Record<string, SynergyResult | null>> = {};
    stats.forEach(stat => {
      matrix[stat] = {};
      stats.forEach(otherStat => {
        matrix[stat][otherStat] = null;
      });
    });
    
    synergies.forEach(synergy => {
      const [stat1, stat2] = synergy.statIds;
      matrix[stat1][stat2] = synergy;
      matrix[stat2][stat1] = synergy;
    });

    // Calculate statistics
    const validSynergies = synergies.filter(s => s.synergyMultiplier > 0);
    const opCount = validSynergies.filter(s => s.synergyMultiplier > HEATMAP_CONFIG.opThreshold).length;
    const weakCount = validSynergies.filter(s => s.synergyMultiplier < HEATMAP_CONFIG.weakThreshold).length;
    const avgMultiplier = validSynergies.length > 0 
      ? validSynergies.reduce((sum, s) => sum + s.synergyMultiplier, 0) / validSynergies.length 
      : 0;

    return { 
      stats, 
      matrix,
      statistics: {
        total: validSynergies.length,
        opCount,
        weakCount,
        avgMultiplier,
        maxMultiplier: Math.max(...validSynergies.map(s => s.synergyMultiplier), 0),
        minMultiplier: Math.min(...validSynergies.map(s => s.synergyMultiplier), 0),
      }
    };
  }, [synergies]);

  const getCellColor = useCallback((synergy: SynergyResult | null) => {
    if (!synergy) return HEATMAP_CONFIG.colorSchemes.neutral;
    
    const multiplier = synergy.synergyMultiplier;
    if (multiplier > HEATMAP_CONFIG.opThreshold) return HEATMAP_CONFIG.colorSchemes.op;
    if (multiplier > 1.05) return HEATMAP_CONFIG.colorSchemes.strong;
    if (multiplier >= HEATMAP_CONFIG.weakThreshold) return HEATMAP_CONFIG.colorSchemes.balanced;
    if (multiplier > 0.85) return HEATMAP_CONFIG.colorSchemes.weak;
    return HEATMAP_CONFIG.colorSchemes.underpowered;
  }, []);

  const getCellAssessment = useCallback((synergy: SynergyResult | null) => {
    if (!synergy) return 'neutral';
    const multiplier = synergy.synergyMultiplier;
    if (multiplier > HEATMAP_CONFIG.opThreshold) return 'OP';
    if (multiplier > 1.05) return 'strong';
    if (multiplier >= HEATMAP_CONFIG.weakThreshold) return 'balanced';
    if (multiplier > 0.85) return 'weak';
    return 'underpowered';
  }, []);

  const handleCellClick = useCallback((stat1: string, stat2: string, synergy: SynergyResult | null) => {
    if (synergy) {
      setSelectedCell({ stat1, stat2, synergy });
      onCellClick?.(stat1, stat2, synergy);
    }
  }, [onCellClick]);

  const handleCellHover = useCallback((stat1: string, stat2: string, synergy: SynergyResult | null) => {
    setHoveredCell({ stat1, stat2, synergy });
    onCellHover?.(stat1, stat2, synergy);
  }, [onCellHover]);

  const exportHeatmapData = useCallback(() => {
    const exportData = {
      metadata: {
        timestamp: Date.now(),
        stats,
        thresholds: HEATMAP_CONFIG,
        statistics,
      },
      synergies: synergies.map(s => ({
        pair: s.statIds.join(' + '),
        multiplier: s.synergyMultiplier,
        assessment: getCellAssessment(s),
        pairScore: s.pairScore,
        expectedScore: s.expectedScore,
        isOp: s.isOpSynergy,
        isWeak: s.isWeakSynergy,
      })),
      matrix: Object.fromEntries(
        stats.map(stat1 => [
          stat1,
          Object.fromEntries(
            stats.map(stat2 => [
              stat2,
              matrix[stat1][stat2]?.synergyMultiplier ?? null
            ])
          )
        ])
      ),
    };

    return JSON.stringify(exportData, null, 2);
  }, [stats, synergies, matrix, statistics, getCellAssessment]);

  return (
    <div className={`observatory-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-indigo-200 mb-2">Synergy Heatmap</h3>
          <p className="text-sm text-slate-400">
            Interactive matrix showing stat pair synergies and multipliers
          </p>
        </div>
        
        {exportable && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowThresholds(!showThresholds)}
              className="px-3 py-1 text-xs rounded-full border border-indigo-500/60 text-indigo-200 hover:bg-indigo-500/10 transition-colors"
            >
              {showThresholds ? 'Hide' : 'Show'} Thresholds
            </button>
            <button
              onClick={() => {
                const data = exportHeatmapData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'synergy-heatmap.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 text-xs rounded-full border border-cyan-500/60 text-cyan-200 hover:bg-cyan-500/10 transition-colors"
            >
              Export
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-2xl font-bold text-indigo-200">{statistics.total}</div>
          <div className="text-xs text-slate-400">Total Synergies</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-2xl font-bold text-red-400">{statistics.opCount}</div>
          <div className="text-xs text-slate-400">OP Synergies</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-2xl font-bold text-blue-400">{statistics.weakCount}</div>
          <div className="text-xs text-slate-400">Weak Synergies</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-2xl font-bold text-green-400">{statistics.avgMultiplier.toFixed(2)}x</div>
          <div className="text-xs text-slate-400">Avg Multiplier</div>
        </div>
      </div>

      {/* Thresholds Legend */}
      {showThresholds && (
        <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
          <h4 className="text-sm font-semibold text-indigo-200 mb-2">Thresholds & Color Scheme</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: HEATMAP_CONFIG.colorSchemes.op.bg }}></div>
              <span className="text-slate-300">OP: &gt;{HEATMAP_CONFIG.opThreshold}x</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: HEATMAP_CONFIG.colorSchemes.strong.bg }}></div>
              <span className="text-slate-300">Strong: 1.05-1.15x</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: HEATMAP_CONFIG.colorSchemes.balanced.bg }}></div>
              <span className="text-slate-300">Balanced: {HEATMAP_CONFIG.weakThreshold}-1.05x</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: HEATMAP_CONFIG.colorSchemes.weak.bg }}></div>
              <span className="text-slate-300">Weak: 0.85-{HEATMAP_CONFIG.weakThreshold}x</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: HEATMAP_CONFIG.colorSchemes.underpowered.bg }}></div>
              <span className="text-slate-300">Under: &lt;0.85x</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: HEATMAP_CONFIG.colorSchemes.neutral.bg }}></div>
              <span className="text-slate-300">No Data</span>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Matrix */}
      <div className="overflow-auto max-h-96 border border-slate-700 rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 bg-slate-900 border border-slate-600 px-2 py-1 text-indigo-200"></th>
              {stats.map(stat => (
                <th key={stat} className="sticky top-0 bg-slate-900 border border-slate-600 px-2 py-1 text-indigo-200 font-mono">
                  {stat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map(stat => (
              <tr key={stat}>
                <th className="sticky left-0 bg-slate-900 border border-slate-600 px-2 py-1 text-indigo-200 font-mono">
                  {stat}
                </th>
                {stats.map(otherStat => {
                  const synergy = matrix[stat][otherStat];
                  const color = getCellColor(synergy);
                  const isHovered = hoveredCell?.stat1 === stat && hoveredCell?.stat2 === otherStat;
                  const isSelected = selectedCell?.stat1 === stat && selectedCell?.stat2 === otherStat;
                  
                  return (
                    <td
                      key={otherStat}
                      className={`border border-slate-700 px-1 py-1 text-center cursor-pointer transition-all ${
                        isHovered ? 'ring-2 ring-indigo-400 ring-inset' : ''
                      } ${isSelected ? 'ring-2 ring-cyan-400 ring-inset' : ''}`}
                      style={{ 
                        backgroundColor: color.bg,
                        borderColor: isSelected ? 'rgb(34, 211, 238)' : color.border,
                      }}
                      title={synergy ? `${synergy.statIds.join(' + ')}: ${synergy.synergyMultiplier.toFixed(4)}x (${getCellAssessment(synergy)})` : 'No data'}
                      onClick={() => handleCellClick(stat, otherStat, synergy)}
                      onMouseEnter={() => handleCellHover(stat, otherStat, synergy)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {synergy ? (
                        <div className="text-xs font-semibold" style={{ color: color.text }}>
                          {synergy.synergyMultiplier.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-xs" style={{ color: color.text }}>-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-cyan-500/40">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-cyan-200">
              {selectedCell.stat1} + {selectedCell.stat2}
            </h4>
            <button
              onClick={() => setSelectedCell(null)}
              className="px-2 py-1 text-xs rounded-full border border-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-400 text-xs">Pair Score</div>
              <div className="font-mono text-indigo-200">{selectedCell.synergy.pairScore.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Expected Score</div>
              <div className="font-mono text-indigo-200">{selectedCell.synergy.expectedScore.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Synergy Multiplier</div>
              <div className={`font-mono font-semibold ${getAssessmentColor(getCellAssessment(selectedCell.synergy))}`}>
                {selectedCell.synergy.synergyMultiplier.toFixed(4)}x
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Classification</div>
              <div className={`font-semibold capitalize ${getAssessmentColor(getCellAssessment(selectedCell.synergy))}`}>
                {getCellAssessment(selectedCell.synergy)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="text-xs text-slate-400">
              Runtime: {(selectedCell.synergy as { runtimeMs?: number }).runtimeMs || 'N/A'}ms • 
              {selectedCell.synergy.isOpSynergy ? ' OP Synergy' : selectedCell.synergy.isWeakSynergy ? ' Weak Synergy' : ' Neutral'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
