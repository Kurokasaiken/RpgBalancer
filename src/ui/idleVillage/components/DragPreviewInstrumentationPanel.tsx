import { useCallback, useMemo, useState } from 'react';
import { resolveDragPreviewMetricSeverity, type DragPreviewMetricPayload } from '@/analytics/idleVillageDragInstrumentation';
import { useDragPreviewInstrumentation } from '@/ui/idleVillage/hooks/useDragPreviewInstrumentation';
import { getDragPreviewInstrumentationConfig } from '@/ui/idleVillage/config/dragPreviewInstrumentationConfig';
import { createSandboxDiagnostics, isSandboxDiagnosticsRuntimeEnabled } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const severityStyles: Record<string, string> = {
  ok: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  error: 'border-rose-400/40 bg-rose-500/10 text-rose-200',
};

const formatMs = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return `${value.toFixed(1)} ms`;
};

const formatCount = (value?: number) => {
  if (typeof value !== 'number') {
    return '0';
  }
  return value.toString();
};

export function DragPreviewInstrumentationPanel() {
  const diagnostics = useMemo(() => createSandboxDiagnostics('DragPreviewInstrumentationPanel', 'drag'), []);
  const runtimeEnabled = isSandboxDiagnosticsRuntimeEnabled();
  const config = useMemo(() => getDragPreviewInstrumentationConfig(), []);
  const { state, setEnabled } = useDragPreviewInstrumentation();
  const [isPersisting, setIsPersisting] = useState(false);

  if (!runtimeEnabled || !config.indicator.enabled) {
    return null;
  }

  const latestPayload = state.latestMeasurement;
  const latestSeverity = latestPayload ? resolveDragPreviewMetricSeverity(latestPayload) : undefined;
  const latestMeasurement = latestPayload?.measurement;

  const handleToggle = useCallback(async () => {
    const nextEnabled = !state.enabled;
    setIsPersisting(true);
    diagnostics.info('drag-preview-toggle', { nextEnabled });
    try {
      await setEnabled(nextEnabled);
    } finally {
      setIsPersisting(false);
    }
  }, [diagnostics, setEnabled, state.enabled]);

  const getSeverityBadgeClass = (payload: DragPreviewMetricPayload | undefined) => {
    if (!payload) {
      return 'border-slate-500/40 bg-slate-500/10 text-slate-300';
    }
    const severity = resolveDragPreviewMetricSeverity(payload);
    return severityStyles[severity] ?? severityStyles.ok;
  };

  const recentSamples = state.samples.slice(0, config.indicator.maxSamples);

  return (
    <div
      className="fixed bottom-4 left-4 z-40 w-96 max-w-full rounded-2xl border border-white/15 bg-[rgba(4,7,12,0.92)] p-4 text-xs text-amber-50 shadow-[0_12px_35px_rgba(0,0,0,0.55)] backdrop-blur-lg"
      data-testid="drag-preview-instrumentation-panel"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-amber-200/80">Drag Preview</p>
          <p className="text-sm font-semibold text-ivory">Instrumentation Monitor</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPersisting}
          className={[
            'rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em]',
            state.enabled
              ? 'border-emerald-400/60 text-emerald-200 hover:border-emerald-200'
              : 'border-slate-500/60 text-slate-300 hover:border-slate-300',
            isPersisting ? 'opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {state.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400">Status</p>
          <p
            className={[
              'mt-2 inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold tracking-[0.2em]',
              getSeverityBadgeClass(latestPayload),
            ].join(' ')}
          >
            {state.enabled ? latestSeverity ?? 'Idle' : 'Disabled'}
          </p>
          <p className="mt-2 text-[10px] text-slate-400">
            Pending measurements: <span className="text-slate-100">{state.pendingMeasurements}</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400">Budgets</p>
          <div className="mt-2 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>Creation</span>
              <span className="text-amber-100">{formatMs(config.thresholds.creationBudgetMs)}</span>
            </div>
            <div className="flex justify-between">
              <span>First paint (warn)</span>
              <span className="text-amber-100">{formatMs(config.thresholds.frameWarningBudgetMs)}</span>
            </div>
            <div className="flex justify-between">
              <span>First paint (error)</span>
              <span className="text-rose-200">{formatMs(config.thresholds.frameErrorBudgetMs)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
        <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400">Latest measurement</p>
        {latestMeasurement ? (
          <dl className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <dt className="text-slate-500">Creation time</dt>
              <dd className="text-amber-100">{formatMs(latestMeasurement.creationDurationMs)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">First paint</dt>
              <dd className="text-amber-100">{formatMs(latestMeasurement.timeToFirstPaintMs)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Long frames</dt>
              <dd className="text-amber-100">{formatCount(latestMeasurement.longFrameCount)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Budget breach</dt>
              <dd className="text-rose-200">{latestMeasurement.frameBudgetBreached ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-[10px] text-slate-500">No metrics recorded yet.</p>
        )}
      </div>

      {recentSamples.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400">Recent samples</p>
          <div className="mt-2 space-y-1 text-[10px] text-slate-200">
            {recentSamples.map((sample, index) => (
              <div key={`sample-${index}`} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-2 py-1">
                <span className="text-slate-400">#{index + 1}</span>
                <span className="text-amber-100">{formatMs(sample.creationDurationMs)}</span>
                <span className="text-slate-500">LP {formatCount(sample.longFrameCount)}</span>
                <span className="text-slate-500">FP {formatMs(sample.timeToFirstPaintMs)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DragPreviewInstrumentationPanel;
