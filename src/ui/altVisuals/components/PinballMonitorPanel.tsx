import clsx from 'clsx';
import type { PinballMonitorOptions } from '@/ui/altVisuals/hooks/usePinballMonitor';
import { usePinballMonitor } from '@/ui/altVisuals/hooks/usePinballMonitor';

export interface PinballMonitorPanelProps extends PinballMonitorOptions {
  className?: string;
  title?: string;
}

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-slate-700 text-slate-100',
  waiting_bridge: 'bg-amber-600 text-white',
  monitoring: 'bg-emerald-600 text-white',
  recovering: 'bg-amber-700 text-white',
  error: 'bg-rose-700 text-white',
};

export function PinballMonitorPanel({
  className,
  title = 'Alt Visuals · Pinball Monitor',
  ...options
}: PinballMonitorPanelProps) {
  const { status, summary, derived, events, lastScan, lastRecovery, scanNow, forceBallRelaunch, forceSceneRelaunch } =
    usePinballMonitor(options);

  const lastEvent = events.at(-1);

  const infoItems: { label: string; value: string | number | null }[] = [
    {
      label: 'Scene ID',
      value: summary?.sceneId ?? '—',
    },
    {
      label: 'Enemy Pillars',
      value: summary ? `${summary.enemyPillarsLanded}/${summary.totalPillars}` : '—',
    },
    {
      label: 'Player Pillars',
      value: summary ? `${summary.playerPillarsLanded}/${summary.totalPillars}` : '—',
    },
    {
      label: 'Ball Active',
      value: summary ? (summary.ballActive ? 'Yes' : 'No') : '—',
    },
    {
      label: 'Runtime',
      value: derived?.ballRuntimeMs != null ? formatDuration(derived.ballRuntimeMs) : '—',
    },
    {
      label: 'Impact Δ',
      value: derived?.timeSinceImpactMs != null ? formatDuration(derived.timeSinceImpactMs) : '—',
    },
    {
      label: 'Last Scan',
      value: lastScan ? formatRelativeTime(lastScan) : '—',
    },
    {
      label: 'Last Recovery',
      value: lastRecovery ? `${formatRelativeTime(lastRecovery.timestamp)} (${lastRecovery.reason})` : '—',
    },
  ];

  const diagnosticFlags = derived?.flags ?? {
    bridgeReady: false,
    ballStuck: false,
    pillarStalled: false,
    awaitingAutoLaunch: false,
  };

  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.idle;

  return (
    <section
      className={clsx(
        'rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-slate-100 shadow-[0_20px_60px_rgba(8,10,20,0.6)] backdrop-blur',
        className,
      )}
      data-testid="pinball-monitor-panel"
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Telemetry Watchdog</p>
          <h2 className="text-lg font-semibold tracking-[0.12em] text-ivory">{title}</h2>
        </div>
        <span
          className={clsx(
            'inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]',
            statusColor,
          )}
          data-testid="pinball-monitor-status"
        >
          {status}
        </span>
      </header>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {infoItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/5 bg-slate-800/40 px-3 py-2 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
            <p className="text-sm font-mono text-ivory">{item.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Watchdog Flags</p>
          <dl className="mt-2 grid gap-2 text-sm font-mono">
            {Object.entries(diagnosticFlags).map(([flag, value]) => (
              <div key={flag} className="flex items-center justify-between">
                <dt className="text-slate-400">{flag}</dt>
                <dd className={value ? 'text-emerald-300' : 'text-slate-500'}>{value ? 'true' : 'false'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Last Event</p>
          {lastEvent ? (
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-semibold text-slate-200">{lastEvent.reason}</p>
              <p className="text-xs text-slate-400">{formatRelativeTime(lastEvent.timestamp)}</p>
              <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-black/40 p-2 text-xs text-emerald-200">
                {JSON.stringify(
                  {
                    action: lastEvent.action,
                    severity: lastEvent.severity,
                    origin: lastEvent.origin,
                    flags: lastEvent.diagnostics,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No events recorded.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-xl border border-emerald-500/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:bg-emerald-500/10"
          onClick={() => scanNow()}
        >
          Manual Scan
        </button>
        <button
          type="button"
          className="rounded-xl border border-amber-500/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 transition hover:bg-amber-500/10"
          onClick={() => forceBallRelaunch('manual_relaunch')}
        >
          Relaunch Ball
        </button>
        <button
          type="button"
          className="rounded-xl border border-rose-500/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200 transition hover:bg-rose-500/10"
          onClick={() => forceSceneRelaunch('manual_relaunch')}
        >
          Relaunch Scene
        </button>
      </div>

      <div className="mt-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Recent Telemetry</p>
        <div className="mt-2 space-y-2">
          {events.slice(-4).reverse().map((event) => (
            <article
              key={event.timestamp}
              className="rounded-2xl border border-white/5 bg-black/30 p-3 text-xs"
              data-testid="pinball-monitor-event"
            >
              <header className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{event.reason}</span>
                <span className="text-slate-500">{formatRelativeTime(event.timestamp)}</span>
              </header>
              <p className="mt-1 text-slate-400">
                {event.severity} · action: {event.action} · origin: {event.origin}
              </p>
            </article>
          ))}
          {events.length === 0 && <p className="text-xs text-slate-500">No telemetry yet.</p>}
        </div>
      </div>
    </section>
  );
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRelativeTime(timestamp: number) {
  const deltaMs = Date.now() - timestamp;
  const deltaSeconds = Math.round(deltaMs / 1000);
  const absSeconds = Math.abs(deltaSeconds);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  for (const [unit, secondsPerUnit] of units) {
    if (absSeconds >= secondsPerUnit || unit === 'second') {
      const value = Math.round(deltaSeconds / secondsPerUnit);
      return formatter.format(-value, unit);
    }
  }

  return 'just now';
}

export default PinballMonitorPanel;
