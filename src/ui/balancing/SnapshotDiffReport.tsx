/**
 * Snapshot Diff Report Component
 * Visual diff report for balancer config snapshots
 * 
 * @see NP-122 – Config Snapshot Diff Tool
 */

import { type FC, useState, useMemo } from 'react';
import type {
  DiffReport,
  ChangeCategory,
  DiffChangeType,
  ImpactSeverity,
} from '../../balancing/config/snapshotDiffConfig';
import { groupByCategory, sortChanges, getSeverityLevel } from '../../balancing/config/snapshotDiffConfig';

interface SnapshotDiffReportProps {
  report: DiffReport;
  onClose?: () => void;
  className?: string;
}

/**
 * Snapshot Diff Report Component
 * 
 * Displays a visual diff report for config snapshots with:
 * - Summary statistics
 * - Impact analysis
 * - Breaking changes
 * - Categorized changes
 * - Filtering and sorting
 */
export const SnapshotDiffReport: FC<SnapshotDiffReportProps> = ({
  report,
  onClose,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ChangeCategory | 'all'>('all');
  const [minImpact, setMinImpact] = useState<ImpactSeverity>('none');
  const [sortBy, setSortBy] = useState<'impact' | 'path' | 'category'>('impact');

  // Filter and sort changes
  const filteredChanges = useMemo(() => {
    let changes = report.changes;

    // Filter by category
    if (selectedCategory !== 'all') {
      changes = changes.filter(c => c.category === selectedCategory);
    }

    // Filter by impact
    const minLevel = getSeverityLevel(minImpact);
    changes = changes.filter(c => getSeverityLevel(c.impact) >= minLevel);

    // Sort
    return sortChanges(changes, sortBy);
  }, [report.changes, selectedCategory, minImpact, sortBy]);

  // Group changes by category
  const groupedChanges = useMemo(() => {
    return groupByCategory(filteredChanges);
  }, [filteredChanges]);

  // Get icon for change type
  const getChangeIcon = (changeType: DiffChangeType): string => {
    const icons = {
      added: '➕',
      removed: '➖',
      modified: '✏️',
      unchanged: '⚪',
    };
    return icons[changeType];
  };

  // Get icon for impact
  const getImpactIcon = (impact: ImpactSeverity): string => {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
      none: '⚪',
    };
    return icons[impact];
  };

  // Get color class for impact
  const getImpactColor = (impact: ImpactSeverity): string => {
    const colors = {
      critical: 'text-red-400 border-red-500/30 bg-red-500/10',
      high: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
      low: 'text-green-400 border-green-500/30 bg-green-500/10',
      none: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
    };
    return colors[impact];
  };

  return (
    <div
      className={`snapshot-diff-report observatory-container ${className}`}
      data-testid="snapshot-diff-report"
    >
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-amber-50">Config Snapshot Diff</h1>
            <p className="mt-1 text-sm text-slate-400">
              {new Date(report.timestamp).toLocaleString()}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
            >
              Close
            </button>
          )}
        </div>

        {/* Snapshots Info */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-amber-200/20 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">Snapshot A (Before)</p>
            <p className="mt-2 text-sm text-slate-200">
              {new Date(report.snapshotA.timestamp).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">{report.snapshotA.description}</p>
            {report.snapshotA.checksum && (
              <p className="mt-1 font-mono text-xs text-slate-500">
                {report.snapshotA.checksum}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-amber-200/20 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">Snapshot B (After)</p>
            <p className="mt-2 text-sm text-slate-200">
              {new Date(report.snapshotB.timestamp).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">{report.snapshotB.description}</p>
            {report.snapshotB.checksum && (
              <p className="mt-1 font-mono text-xs text-slate-500">
                {report.snapshotB.checksum}
              </p>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 rounded-xl border border-amber-200/20 bg-white/5 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-200/80">Summary</p>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Total Changes</p>
              <p className="text-2xl font-semibold text-amber-50">{report.summary.totalChanges}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Added</p>
              <p className="text-2xl font-semibold text-green-400">+{report.summary.added}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Removed</p>
              <p className="text-2xl font-semibold text-red-400">-{report.summary.removed}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Modified</p>
              <p className="text-2xl font-semibold text-yellow-400">~{report.summary.modified}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2">
              <p className="text-xs text-red-400">🔴 Critical</p>
              <p className="text-lg font-semibold text-red-300">{report.summary.criticalImpact}</p>
            </div>
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2">
              <p className="text-xs text-orange-400">🟠 High</p>
              <p className="text-lg font-semibold text-orange-300">{report.summary.highImpact}</p>
            </div>
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2">
              <p className="text-xs text-yellow-400">🟡 Medium</p>
              <p className="text-lg font-semibold text-yellow-300">{report.summary.mediumImpact}</p>
            </div>
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-2">
              <p className="text-xs text-green-400">🟢 Low</p>
              <p className="text-lg font-semibold text-green-300">{report.summary.lowImpact}</p>
            </div>
          </div>
        </div>

        {/* Breaking Changes */}
        {report.impactAnalysis.breakingChanges.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-red-400">
              ⚠️ Breaking Changes ({report.impactAnalysis.breakingChanges.length})
            </p>
            <div className="space-y-3">
              {report.impactAnalysis.breakingChanges.map((breaking, index) => (
                <div key={index} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="font-mono text-sm text-red-300">{breaking.path}</p>
                  <p className="mt-1 text-xs text-red-400">{breaking.reason}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    <span className="font-semibold">Migration:</span> {breaking.migration}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.impactAnalysis.recommendations.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200/20 bg-white/5 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-200/80">
              Recommendations
            </p>
            <ul className="space-y-2">
              {report.impactAnalysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ChangeCategory | 'all')}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
            >
              <option value="all">All Categories</option>
              <option value="stat">Stats</option>
              <option value="card">Cards</option>
              <option value="preset">Presets</option>
              <option value="formula">Formulas</option>
              <option value="weight">Weights</option>
              <option value="metadata">Metadata</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Min Impact</label>
            <select
              value={minImpact}
              onChange={(e) => setMinImpact(e.target.value as ImpactSeverity)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
            >
              <option value="none">All</option>
              <option value="low">Low+</option>
              <option value="medium">Medium+</option>
              <option value="high">High+</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'impact' | 'path' | 'category')}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
            >
              <option value="impact">Impact</option>
              <option value="path">Path</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div className="flex items-end">
            <p className="text-sm text-slate-400">
              Showing {filteredChanges.length} of {report.changes.length} changes
            </p>
          </div>
        </div>

        {/* Changes by Category */}
        <div className="space-y-6">
          {Object.entries(groupedChanges).map(([category, changes]) => {
            if (changes.length === 0) return null;

            return (
              <div key={category} className="rounded-xl border border-amber-200/20 bg-white/5 p-4">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-200/80">
                  {category.charAt(0).toUpperCase() + category.slice(1)} Changes ({changes.length})
                </p>

                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${getImpactColor(change.impact)}`}
                      data-testid={`change-${change.path}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getChangeIcon(change.changeType)}</span>
                            <span className="font-mono text-sm">{change.path}</span>
                            <span className="text-lg">{getImpactIcon(change.impact)}</span>
                          </div>
                          <p className="mt-1 text-sm">{change.description}</p>
                          {change.affectedItems.length > 0 && (
                            <p className="mt-1 text-xs opacity-70">
                              Affected: {change.affectedItems.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs uppercase tracking-wider opacity-70">
                            {change.impact}
                          </span>
                        </div>
                      </div>

                      {/* Show old/new values for modified changes */}
                      {change.changeType === 'modified' && (
                        <div className="mt-2 grid gap-2 border-t border-current/20 pt-2 md:grid-cols-2">
                          <div>
                            <p className="text-xs opacity-70">Old Value</p>
                            <p className="font-mono text-xs">
                              {JSON.stringify(change.oldValue).substring(0, 100)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs opacity-70">New Value</p>
                            <p className="font-mono text-xs">
                              {JSON.stringify(change.newValue).substring(0, 100)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredChanges.length === 0 && (
          <div className="rounded-xl border border-amber-200/20 bg-white/5 p-8 text-center">
            <p className="text-slate-400">No changes match the current filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapshotDiffReport;
