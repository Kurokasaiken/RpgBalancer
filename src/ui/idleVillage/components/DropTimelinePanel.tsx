/**
 * Drop Timeline Telemetry Panel (NP-141)
 *
 * React component that visualizes Phase E drag-and-drop sessions using the
 * useDropTimelineData hook and the config-first DropTimelinePanelConfig.
 */

import React, { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Download, RefreshCw, Filter as FilterIcon, AlertTriangle } from 'lucide-react';

import type { DragDropTelemetryPayload } from '@/ui/idleVillage/utils/dragDropTelemetry';
import {
  useDropTimelineData,
  type UseDropTimelineDataOptions,
} from '@/ui/idleVillage/hooks/useDropTimelineData';
import type {
  DropTimelineSession,
  DropTimelineFilters,
} from '@/analytics/idleVillageDropTimeline';
import {
  DEFAULT_DROP_TIMELINE_PANEL_CONFIG,
  type DropTimelinePanelConfig,
  type DropTimelineMetricConfig,
  type DropTimelineMetricId,
} from '@/balancing/config/idleVillage/dropTimelinePanelConfig';

/**
 * Props supported by the DropTimelinePanel component.
 */
export interface DropTimelinePanelProps {
  /** Optional wrapper className to stack with config theme classes. */
  className?: string;
  /** Config overrides merged with DEFAULT_DROP_TIMELINE_PANEL_CONFIG. */
  config?: Partial<DropTimelinePanelConfig>;
  /** Options passed down to useDropTimelineData (storage key, seeds, etc.). */
  hookOptions?: UseDropTimelineDataOptions;
  /** Limit of sessions rendered in the timeline list. */
  maxSessionsToRender?: number;
}

/**
 * Formats milliseconds into a compact label (e.g., 1.2s, 950ms).
 */
const formatDurationMs = (value?: number): string => {
  if (!value || value <= 0) {
    return '—';
  }
  if (value < 1000) {
    return `${value}ms`;
  }
  if (value < 60_000) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.round((value % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
};

/**
 * Creates a downloadable Blob for CSV/JSON payloads emitted by the hook.
 */
const downloadPayload = (content: string, filename: string, mime: string) => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * Merge helper to keep config-first overrides predictable.
 */
const mergePanelConfig = (overrides?: Partial<DropTimelinePanelConfig>): DropTimelinePanelConfig => {
  if (!overrides) {
    return DEFAULT_DROP_TIMELINE_PANEL_CONFIG;
  }
  return {
    ...DEFAULT_DROP_TIMELINE_PANEL_CONFIG,
    ...overrides,
    theme: {
      ...DEFAULT_DROP_TIMELINE_PANEL_CONFIG.theme,
      ...overrides.theme,
    },
    metrics: overrides.metrics ?? DEFAULT_DROP_TIMELINE_PANEL_CONFIG.metrics,
    timeline: {
      ...DEFAULT_DROP_TIMELINE_PANEL_CONFIG.timeline,
      ...overrides.timeline,
      phasePalette: {
        ...DEFAULT_DROP_TIMELINE_PANEL_CONFIG.timeline.phasePalette,
        ...overrides.timeline?.phasePalette,
      },
      resultPalette: {
        ...DEFAULT_DROP_TIMELINE_PANEL_CONFIG.timeline.resultPalette,
        ...overrides.timeline?.resultPalette,
      },
    },
    filters: {
      ...DEFAULT_DROP_TIMELINE_PANEL_CONFIG.filters,
      ...overrides.filters,
      contextLabels: {
        ...DEFAULT_DROP_TIMELINE_PANEL_CONFIG.filters.contextLabels,
        ...overrides.filters?.contextLabels,
      },
    },
    export: {
      ...DEFAULT_DROP_TIMELINE_PANEL_CONFIG.export,
      ...overrides.export,
    },
  };
};

/**
 * Component rendering the Drop Timeline Telemetry panel with metrics,
 * filters, export controls, and a compact timeline for each session.
 */
export const DropTimelinePanel: React.FC<DropTimelinePanelProps> = ({
  className,
  config: configOverrides,
  hookOptions,
  maxSessionsToRender = 50,
}) => {
  const panelConfig = useMemo(() => mergePanelConfig(configOverrides), [configOverrides]);
  const {
    data,
    filters,
    isLoading,
    error,
    lastUpdated,
    updateFilters,
    resetFilters,
    refresh,
    exportAsCSV,
    exportAsJSON,
  } = useDropTimelineData(hookOptions);

  const [residentSearch, setResidentSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');

  const availableResidents = useMemo(() => {
    const catalog = data?.catalog.residents ?? [];
    if (!residentSearch) return catalog;
    return catalog.filter((resident) => resident.toLowerCase().includes(residentSearch.toLowerCase()));
  }, [data?.catalog.residents, residentSearch]);

  const availableActivities = useMemo(() => {
    const catalog = data?.catalog.activities ?? [];
    if (!activitySearch) return catalog;
    return catalog.filter((activity) => activity.toLowerCase().includes(activitySearch.toLowerCase()));
  }, [data?.catalog.activities, activitySearch]);

  const availableContexts = useMemo(() => {
    const fromData = data?.catalog.contexts ?? [];
    const fromConfig = Object.keys(panelConfig.filters.contextLabels);
    return Array.from(new Set([...fromData, ...fromConfig]));
  }, [data?.catalog.contexts, panelConfig.filters.contextLabels]);

  const metricValues: Record<DropTimelineMetricId, number> | null = useMemo(() => {
    if (!data) return null;
    const { metrics } = data;
    const blockedRate = metrics.sessionCount ? metrics.blockedDrops / metrics.sessionCount : 0;
    return {
      sessionCount: metrics.sessionCount,
      totalEvents: metrics.totalEvents,
      validDrops: metrics.validDrops,
      blockedDrops: metrics.blockedDrops,
      cancelledDrops: metrics.cancelledDrops,
      averageValidationMs: metrics.averageValidationMs,
      averageApplyMs: metrics.averageApplyMs,
      blockedRate,
    };
  }, [data]);

  const sessionsToRender = useMemo(() => {
    if (!data) return [] as DropTimelineSession[];
    return data.sessions.slice(0, Math.max(1, Math.min(maxSessionsToRender, data.sessions.length)));
  }, [data, maxSessionsToRender]);

  const handleListFilterToggle = useCallback(
    (key: keyof Pick<DropTimelineFilters, 'residentIds' | 'activityIds' | 'contexts'>, value: string, limit?: number) => {
      const current = filters[key];
      const exists = current.includes(value);
      if (!exists && limit && current.length >= limit) {
        return;
      }
      const next = exists ? current.filter((item) => item !== value) : [...current, value];
      updateFilters({ [key]: next });
    },
    [filters, updateFilters],
  );

  const handleBooleanFilter = useCallback(
    (partial: Partial<Pick<DropTimelineFilters, 'showBlockedOnly'>>) => {
      updateFilters(partial);
    },
    [updateFilters],
  );

  const handleNumericFilter = useCallback(
    (key: keyof Pick<DropTimelineFilters, 'sessionLimit' | 'timeWindowHours'>, value: string) => {
      if (value === 'all') {
        updateFilters({ [key]: null });
        return;
      }
      const numeric = Number(value);
      updateFilters({ [key]: Number.isFinite(numeric) ? numeric : null });
    },
    [updateFilters],
  );

  const handleExport = useCallback(
    (format: 'json' | 'csv') => {
      const payload = format === 'json' ? exportAsJSON() : exportAsCSV();
      if (!payload) return;
      const filename = `${panelConfig.export.filenamePrefix}-${new Date().toISOString().replace(/[:]/g, '-')}.${format}`;
      const mime = format === 'json' ? 'application/json' : 'text/csv';
      downloadPayload(payload, filename, mime);
    },
    [exportAsCSV, exportAsJSON, panelConfig.export.filenamePrefix],
  );

  const formatMetric = useCallback(
    (config: DropTimelineMetricConfig) => {
      if (!metricValues) return '—';
      const raw = metricValues[config.id];
      if (raw === undefined || raw === null) return '—';
      switch (config.formatter) {
        case 'milliseconds':
          return formatDurationMs(raw);
        case 'percentage':
          return `${(raw * 100).toFixed(1)}%`;
        default:
          return raw.toLocaleString();
      }
    },
    [metricValues],
  );

  const renderStatusChip = (label: string, className?: string) => (
    <span className={clsx(panelConfig.theme.chipClass, className)}>{label}</span>
  );

  return (
    <section
      className={clsx(
        panelConfig.theme.containerClass,
        panelConfig.theme.borderClass,
        'rounded-2xl p-5 shadow-2xl transition-colors',
        className,
      )}
    >
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-amber-100">{panelConfig.title}</h2>
          <p className={clsx('text-sm', panelConfig.theme.mutedTextClass)}>{panelConfig.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refresh().catch(() => undefined)}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => handleExport('json')}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/10"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/10"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-amber-200">
        {renderStatusChip(`Last updated: ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}`)}
        {renderStatusChip(`Sessions: ${data?.metrics.sessionCount ?? 0}`)}
        {filters.showBlockedOnly && renderStatusChip('Blocked only', 'bg-rose-500/10 border-rose-500/40 text-rose-100')}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <section className="mt-6 grid gap-3 md:grid-cols-4">
        {panelConfig.metrics.map((metric) => (
          <article key={metric.id} className={panelConfig.theme.metricCardClass}>
            <p className="text-[11px] uppercase tracking-widest text-slate-400">{metric.label}</p>
            <p className={clsx('text-2xl font-semibold', metric.accentClass)}>{formatMetric(metric)}</p>
            {metric.description && <p className="text-[11px] text-slate-500">{metric.description}</p>}
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-amber-500/10 bg-slate-900/60 p-4">
        <header className="mb-4 flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-amber-300" />
          <h3 className={panelConfig.theme.sectionTitleClass}>Crew Filters</h3>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-amber-100">
              Residents
              <span className="text-[10px] text-slate-400">
                {filters.residentIds.length}/{panelConfig.filters.maxSelectableResidents}
              </span>
            </label>
            <input
              type="text"
              placeholder="Search residents"
              value={residentSearch}
              onChange={(event) => setResidentSearch(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-amber-50"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {availableResidents.length === 0 && (
                <span className="text-[11px] text-slate-500">No residents</span>
              )}
              {availableResidents.map((resident) => (
                <button
                  type="button"
                  key={resident}
                  onClick={() =>
                    handleListFilterToggle('residentIds', resident, panelConfig.filters.maxSelectableResidents)
                  }
                  className={clsx(
                    panelConfig.theme.chipClass,
                    filters.residentIds.includes(resident)
                      ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-100'
                      : undefined,
                  )}
                >
                  {resident}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-amber-100">
              Activities / Targets
              <span className="text-[10px] text-slate-400">
                {filters.activityIds.length}/{panelConfig.filters.maxSelectableActivities}
              </span>
            </label>
            <input
              type="text"
              placeholder="Search activities"
              value={activitySearch}
              onChange={(event) => setActivitySearch(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-amber-50"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {availableActivities.length === 0 && (
                <span className="text-[11px] text-slate-500">No activities</span>
              )}
              {availableActivities.map((activity) => (
                <button
                  type="button"
                  key={activity}
                  onClick={() =>
                    handleListFilterToggle('activityIds', activity, panelConfig.filters.maxSelectableActivities)
                  }
                  className={clsx(
                    panelConfig.theme.chipClass,
                    filters.activityIds.includes(activity)
                      ? 'bg-sky-500/20 border-sky-400/60 text-sky-100'
                      : undefined,
                  )}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {availableContexts.map((context) => (
            <button
              type="button"
              key={context}
              onClick={() => handleListFilterToggle('contexts', context)}
              className={clsx(
                panelConfig.theme.chipClass,
                filters.contexts.includes(context)
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-100'
                  : undefined,
              )}
            >
              {panelConfig.filters.contextLabels[context] ?? context}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col text-xs text-amber-100">
            Time window
            <select
              value={filters.timeWindowHours ?? 'all'}
              onChange={(event) => handleNumericFilter('timeWindowHours', event.target.value)}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-amber-100"
            >
              <option value="all">All</option>
              {panelConfig.filters.timeWindowOptions.map((option) => (
                <option key={option} value={option}>
                  {option}h
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-xs text-amber-100">
            Session limit
            <select
              value={filters.sessionLimit ?? 'all'}
              onChange={(event) => handleNumericFilter('sessionLimit', event.target.value)}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-amber-100"
            >
              <option value="all">All</option>
              {panelConfig.filters.sessionLimitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-amber-100">
            <input
              type="checkbox"
              checked={filters.showBlockedOnly}
              onChange={(event) => handleBooleanFilter({ showBlockedOnly: event.target.checked })}
              className="rounded border-slate-600 bg-slate-900 text-amber-500"
            />
            Show blocked only
          </label>
        </div>

        <div className="mt-4 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => resetFilters()}
            className="rounded-lg border border-slate-700 px-3 py-1 text-amber-100"
          >
            Reset filters
          </button>
          <button
            type="button"
            onClick={() => refresh().catch(() => undefined)}
            className="rounded-lg border border-emerald-500/40 px-3 py-1 text-emerald-100"
          >
            Refresh data
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h3 className={panelConfig.theme.sectionTitleClass}>Sessions</h3>
        {isLoading && (
          <div className="mt-3 rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
            Loading drop timeline telemetry…
          </div>
        )}

        {!isLoading && sessionsToRender.length === 0 && (
          <div className="mt-3 rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
            No sessions match the current filters.
          </div>
        )}

        <div className="mt-4 space-y-3">
          {sessionsToRender.map((session) => (
            <article
              key={session.sessionId}
              className="rounded-xl border border-slate-800/60 bg-slate-950/50 p-4 shadow-inner"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="font-semibold text-amber-200">{session.residentId}</span>
                {session.activityId && (
                  <span className="text-sky-300">{session.activityId}</span>
                )}
                <span className="text-slate-500">{new Date(session.startedAt).toLocaleString()}</span>
                <span className={clsx(panelConfig.theme.chipClass, panelConfig.timeline.resultPalette[session.summary.dropResult])}>
                  {session.summary.dropResult.toUpperCase()}
                </span>
                {session.summary.validationLatencyMs && (
                  <span className="text-slate-400">
                    Validation: {formatDurationMs(session.summary.validationLatencyMs)}
                  </span>
                )}
                {session.summary.applyLatencyMs && (
                  <span className="text-slate-400">Apply: {formatDurationMs(session.summary.applyLatencyMs)}</span>
                )}
                <span className="text-slate-500">{session.summary.eventsCount} events</span>
              </div>

              <div className={clsx('mt-3 flex items-center gap-1 overflow-hidden rounded-full px-2 py-1', panelConfig.theme.timelineBackgroundClass)}>
                {session.events.map((event) => (
                  <div
                    key={`${session.sessionId}-${event.eventType}-${event.timestamp}`}
                    title={`${event.displayLabel} @ ${new Date(event.timestamp).toLocaleTimeString()}`}
                    className={clsx(
                      'rounded-full',
                      panelConfig.timeline.phasePalette[event.phase],
                    )}
                    style={{
                      width: `${Math.max(1, (event.offsetPct / 100) * 100)}%`,
                      minWidth: `${panelConfig.timeline.markerSizePx}px`,
                      height: panelConfig.timeline.laneHeightPx,
                    }}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export default DropTimelinePanel;
