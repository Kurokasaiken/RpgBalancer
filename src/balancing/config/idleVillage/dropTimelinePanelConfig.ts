/**
 * Drop Timeline Panel configuration (NP-141)
 *
 * Config-first description of the Drop Timeline Telemetry panel so UI components
 * can stay declarative and leverage Style Laboratory tokens.
 */

import type {
  DropTimelinePhase,
  DropTimelineSessionSummary,
} from '@/analytics/idleVillageDropTimeline';

export type DropTimelineMetricId =
  | 'sessionCount'
  | 'totalEvents'
  | 'validDrops'
  | 'blockedDrops'
  | 'cancelledDrops'
  | 'averageValidationMs'
  | 'averageApplyMs'
  | 'blockedRate';

export type DropTimelineMetricFormatter = 'number' | 'milliseconds' | 'percentage';

export interface DropTimelineMetricConfig {
  id: DropTimelineMetricId;
  label: string;
  formatter: DropTimelineMetricFormatter;
  accentClass: string;
  description?: string;
}

export interface DropTimelinePanelTheme {
  containerClass: string;
  borderClass: string;
  mutedTextClass: string;
  sectionTitleClass: string;
  metricCardClass: string;
  chipClass: string;
  timelineBackgroundClass: string;
}

export interface DropTimelineTimelineConfig {
  laneHeightPx: number;
  markerSizePx: number;
  phasePalette: Record<DropTimelinePhase, string>;
  resultPalette: Record<DropTimelineSessionSummary['dropResult'], string>;
}

export interface DropTimelineFilterConfig {
  maxSelectableResidents: number;
  maxSelectableActivities: number;
  timeWindowOptions: number[];
  sessionLimitOptions: number[];
  contextLabels: Record<string, string>;
}

export interface DropTimelineExportConfig {
  filenamePrefix: string;
}

export interface DropTimelinePanelConfig {
  title: string;
  description: string;
  theme: DropTimelinePanelTheme;
  metrics: DropTimelineMetricConfig[];
  timeline: DropTimelineTimelineConfig;
  filters: DropTimelineFilterConfig;
  export: DropTimelineExportConfig;
}

export const DEFAULT_DROP_TIMELINE_PANEL_CONFIG: DropTimelinePanelConfig = {
  title: 'Drop Timeline Telemetry',
  description: 'Phase E drag-and-drop diagnostics aggregated from Style Laboratory probes.',
  theme: {
    containerClass: 'bg-slate-950/80 backdrop-blur-xl border border-amber-500/20 text-amber-50',
    borderClass: 'border-slate-800/70',
    mutedTextClass: 'text-slate-400',
    sectionTitleClass: 'text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200',
    metricCardClass: 'bg-slate-900/70 border border-amber-500/20 rounded-lg px-4 py-3 shadow-lg shadow-amber-500/5',
    chipClass: 'inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-slate-900/70 px-2 py-1 text-[11px] font-medium text-amber-100',
    timelineBackgroundClass: 'bg-slate-900/60 border border-slate-800/70 rounded-md',
  },
  metrics: [
    {
      id: 'sessionCount',
      label: 'Sessions',
      formatter: 'number',
      accentClass: 'text-amber-300',
    },
    {
      id: 'totalEvents',
      label: 'Events',
      formatter: 'number',
      accentClass: 'text-emerald-300',
    },
    {
      id: 'validDrops',
      label: 'Applied',
      formatter: 'number',
      accentClass: 'text-emerald-400',
    },
    {
      id: 'blockedDrops',
      label: 'Blocked',
      formatter: 'number',
      accentClass: 'text-rose-300',
    },
    {
      id: 'cancelledDrops',
      label: 'Cancelled',
      formatter: 'number',
      accentClass: 'text-amber-200',
    },
    {
      id: 'averageValidationMs',
      label: 'Validation (ms)',
      formatter: 'milliseconds',
      accentClass: 'text-sky-300',
      description: 'Average time between validation_start and validation_end',
    },
    {
      id: 'averageApplyMs',
      label: 'Apply (ms)',
      formatter: 'milliseconds',
      accentClass: 'text-cyan-300',
      description: 'Average time between validation_end and drop_apply',
    },
    {
      id: 'blockedRate',
      label: 'Blocked %',
      formatter: 'percentage',
      accentClass: 'text-rose-200',
    },
  ],
  timeline: {
    laneHeightPx: 10,
    markerSizePx: 12,
    phasePalette: {
      drag: 'bg-emerald-400',
      validation: 'bg-sky-400',
      drop: 'bg-amber-400',
      feedback: 'bg-fuchsia-400',
      other: 'bg-slate-500',
    },
    resultPalette: {
      applied: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
      blocked: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
      cancelled: 'text-amber-200 border-amber-500/40 bg-amber-500/10',
      unknown: 'text-slate-200 border-slate-600/50 bg-slate-800/60',
    },
  },
  filters: {
    maxSelectableResidents: 25,
    maxSelectableActivities: 25,
    timeWindowOptions: [1, 6, 12, 24, 48, 72],
    sessionLimitOptions: [10, 25, 50, 100],
    contextLabels: {
      map_drag: 'Map',
      roster_drag: 'Roster',
      theater_drag: 'Theater',
      unknown: 'Unknown',
    },
  },
  export: {
    filenamePrefix: 'idle-village-drop-timeline',
  },
};
