import type { JSX } from 'react';

export interface ClockWidgetProps {
  currentDay: number;
  isPaused: boolean;
  speedMultiplier: number;
  defaultSpeedMultiplier: number;
  maxSpeedMultiplier: number;
  tickIntervalMs: number;
  warmupDelayMs: number;
  accentHex: string;
  onSpeedChange: (value: number) => void;
  /** Toggle display of tick/warmup timing details for compact layouts. */
  showTimingDetails?: boolean;
  /** Optional class override for compact layouts. */
  className?: string;
  /** Optional handler to toggle pause/resume state. */
  onTogglePause?: () => void;
}

const formatSeconds = (milliseconds: number): string => `${(milliseconds / 1000).toFixed(1)}s`;

const formatSpeed = (speed: number): string => `${Number(speed.toFixed(2))}×`;

const buildSpeedOptions = (current: number, max: number, fallback: number): number[] => {
  const options = new Set<number>();
  const normalizedMax = Math.max(1, Math.floor(max));
  for (let step = 1; step <= normalizedMax; step += 1) {
    options.add(step);
  }
  options.add(Number(max.toFixed(2)));
  options.add(Number(current.toFixed(2)));
  options.add(Number(fallback.toFixed(2)));
  options.add(5);
  return [...options]
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
};

/**
 * Compact widget displaying the minimal gameplay clock status (day/phase/speed) with speed controls.
 */
export function ClockWidget({
  currentDay,
  isPaused,
  speedMultiplier,
  defaultSpeedMultiplier,
  maxSpeedMultiplier,
  tickIntervalMs,
  warmupDelayMs,
  accentHex,
  onSpeedChange,
  showTimingDetails = true,
  className,
  onTogglePause,
}: ClockWidgetProps): JSX.Element {
  const resolvedDefaultSpeed = Number.isFinite(defaultSpeedMultiplier) && defaultSpeedMultiplier > 0 ? defaultSpeedMultiplier : 1;
  const resolvedSpeedMultiplier = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : resolvedDefaultSpeed;
  const resolvedMaxSpeed = Number.isFinite(maxSpeedMultiplier) && maxSpeedMultiplier > 0 ? maxSpeedMultiplier : Math.max(resolvedSpeedMultiplier, resolvedDefaultSpeed);
  const resolvedTickInterval = Number.isFinite(tickIntervalMs) && tickIntervalMs > 0 ? tickIntervalMs : 1000;
  const resolvedWarmupDelay = Number.isFinite(warmupDelayMs) && warmupDelayMs >= 0 ? warmupDelayMs : 0;
  const resolvedDay = Number.isFinite(currentDay) && currentDay > 0 ? Math.floor(currentDay) : 1;
  const resolvedAccentHex = accentHex ?? '#4ade80';

  const speedOptions = buildSpeedOptions(resolvedSpeedMultiplier, resolvedMaxSpeed, resolvedDefaultSpeed);
  const statusLabel = isPaused ? 'Paused' : 'Running';
  const statusColor = isPaused ? 'text-[#f97316]' : 'text-[#4ade80]';
  const rootClassName = ['rounded-2xl border border-white/5 bg-[#0a111c] p-6 shadow-md', className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={rootClassName} data-testid="minimal-clock-widget">
      <div className="flex flex-wrap items-center gap-3" aria-label="Time engine controls">
        <p className="font-serif text-xl text-[#f0efe4]">Day {resolvedDay}</p>
        <span className={`text-xs font-semibold tracking-wide ${statusColor}`} aria-live="polite">
          {statusLabel}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2" aria-label="Loop speed options">
          {onTogglePause ? (
            <button
              type="button"
              onClick={onTogglePause}
              aria-pressed={isPaused}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                isPaused ? 'text-[#05070c]' : 'text-slate-200'
              }`}
              style={{
                backgroundColor: isPaused ? resolvedAccentHex : 'rgba(255, 255, 255, 0.05)',
                border: isPaused ? `1px solid ${resolvedAccentHex}` : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          ) : null}
          {speedOptions.map((speed) => {
            const isActive = Number(resolvedSpeedMultiplier.toFixed(2)) === Number(speed.toFixed(2));
            return (
              <button
                key={speed}
                type="button"
                aria-pressed={isActive}
                aria-label={`Set speed to ${formatSpeed(speed)}`}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                  isActive ? 'text-[#05070c]' : 'text-slate-200'
                }`}
                style={{
                  backgroundColor: isActive ? resolvedAccentHex : 'rgba(255, 255, 255, 0.05)',
                  border: isActive ? `1px solid ${resolvedAccentHex}` : '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onClick={() => onSpeedChange(speed)}
              >
                {formatSpeed(speed)}
              </button>
            );
          })}
        </div>
      </div>

      {showTimingDetails && (
        <dl className="mt-4 grid gap-3 text-sm text-slate-300" aria-label="Loop timings">
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Tick Interval</dt>
            <dd className="mt-1 font-semibold text-slate-100">{formatSeconds(resolvedTickInterval)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Warmup Delay</dt>
            <dd className="mt-1 font-semibold text-slate-100">{formatSeconds(resolvedWarmupDelay)}</dd>
          </div>
        </dl>
      )}

    </section>
  );
}
