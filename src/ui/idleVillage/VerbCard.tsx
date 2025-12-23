import React, { forwardRef } from 'react';
import { HearthstoneCard, type CardState, type CardVariant } from '@/ui/fantasy/atoms/HearthstoneCard';
import { GlowProgress, type ProgressVariant } from '@/ui/fantasy/atoms/GlowProgress';
import { OrbIcon, type OrbVariant } from '@/ui/fantasy/atoms/OrbIcon';

export type VerbTone = 'neutral' | 'job' | 'quest' | 'danger' | 'system';

export type DropState = 'idle' | 'valid' | 'invalid';

export type VerbVisualVariant = 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar';

export type ProgressStyle = 'border' | 'ribbon' | 'halo';

export interface VerbCardProps extends React.HTMLAttributes<HTMLDivElement> {
  // Core props
  icon: React.ReactNode;
  progressFraction: number; // 0 to 1
  elapsedSeconds: number;   // For timer display
  totalDuration: number;    // Total duration in seconds
  injuryPercentage: number; // 0-100 for risk stripe
  deathPercentage: number;  // 0-100 for risk stripe
  assignedCount: number;    // Number of assigned residents
  totalSlots: number;       // Total available slots

  // Interaction
  isInteractive?: boolean;
  dropState?: DropState;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  visualVariant?: VerbVisualVariant;
  progressStyle?: ProgressStyle;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const formatTime = (seconds?: number): string => {
  if (seconds === undefined || !Number.isFinite(seconds)) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const CARD_VARIANT_MAP: Record<VerbVisualVariant, CardVariant> = {
  azure: 'azure',
  ember: 'ember',
  jade: 'jade',
  amethyst: 'amethyst',
  solar: 'solar',
};

const ORB_VARIANT_MAP: Record<VerbVisualVariant, OrbVariant> = {
  azure: 'azure',
  ember: 'ember',
  jade: 'jade',
  amethyst: 'amethyst',
  solar: 'solar',
};

const PROGRESS_VARIANT_MAP: Record<VerbVisualVariant, ProgressVariant> = {
  azure: 'azure',
  ember: 'ember',
  jade: 'jade',
  amethyst: 'amethyst',
  solar: 'solar',
};

const VerbCard = forwardRef<HTMLDivElement, VerbCardProps>(function VerbCard(
  {
    icon,
    progressFraction,
    elapsedSeconds,
    totalDuration,
    injuryPercentage = 0,
    deathPercentage = 0,
    assignedCount = 0,
    totalSlots = 0,
    isInteractive = false,
    dropState = 'idle',
    onClick,
    onMouseEnter,
    onMouseLeave,
    className = '',
    visualVariant = 'azure',
    progressStyle = 'halo',
    ...rest
  },
  ref,
) {
  const clampedProgress = clamp01(progressFraction);
  const injuryLevel = Math.max(0, Math.min(100, injuryPercentage));
  const deathLevel = Math.max(0, Math.min(100, deathPercentage));

  // Calculate remaining time and active state
  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
  const isActive = elapsedSeconds > 0 && remainingSeconds > 0;

  const handleClick = () => {
    if (isInteractive && onClick) {
      onClick();
    }
  };

  const interactiveProps = isInteractive
    ? {
        role: 'button',
        tabIndex: 0,
        onClick: handleClick,
        'aria-pressed': isActive,
        'aria-label': `${isActive ? 'In progress' : 'Ready'}. ${assignedCount} of ${totalSlots} slots filled. ` +
          `Risk: ${injuryPercentage}% injury, ${deathPercentage}% death. ` +
          `${isActive ? `${formatTime(remainingSeconds)} remaining` : ''}`.trim(),
      }
    : {};

  const dropFrameClass =
    dropState === 'valid'
      ? 'ring-2 ring-emerald-400/70 drop-shadow-[0_0_26px_rgba(16,185,129,0.6)]'
      : dropState === 'invalid'
        ? 'ring-2 ring-rose-500/70 drop-shadow-[0_0_26px_rgba(244,63,94,0.55)]'
        : isActive
          ? 'drop-shadow-[0_0_22px_rgba(245,158,11,0.45)]'
          : 'drop-shadow-[0_0_24px_rgba(5,8,18,0.75)]';

  const timerDisplay = formatTime(isActive ? remainingSeconds : totalDuration);

  const progressDegrees = clampedProgress * 360;
  const haloStartDeg = -90; // start from top (12 o'clock)
  const haloHighlightStartDeg = haloStartDeg + Math.max(progressDegrees - 40, 0);

  const cardVariant = CARD_VARIANT_MAP[visualVariant] ?? 'default';
  const orbVariant = ORB_VARIANT_MAP[visualVariant] ?? 'neutral';
  const progressVariant = PROGRESS_VARIANT_MAP[visualVariant] ?? 'gold';

  const cardState: CardState =
    dropState === 'valid'
      ? 'valid'
      : dropState === 'invalid'
        ? 'invalid'
        : isActive
          ? 'active'
          : 'idle';

  const riskBadge =
    deathLevel > 0
      ? `💀${deathLevel}%`
      : injuryLevel > 0
        ? `⚠️${injuryLevel}%`
        : null;

  const riskStripeInjuryHeight = Math.min(100, injuryLevel);
  const riskStripeDeathHeight = Math.min(100, deathLevel);

  return (
    <HearthstoneCard
      ref={ref}
      variant={cardVariant}
      state={cardState}
      isInteractive={isInteractive}
      hasGlow={isActive || dropState !== 'idle'}
      frameVariant="plain"
      className={[
        'relative flex h-48 w-32 flex-col items-center gap-2 overflow-hidden p-3',
        dropFrameClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...interactiveProps}
      {...rest}
    >
      {/* Risk stripes */}
      {(injuryLevel > 0 || deathLevel > 0) && (
        <div className="pointer-events-none absolute inset-y-4 right-3 w-1.5 overflow-hidden rounded-full bg-slate-900/60 ring-1 ring-slate-800/60">
          {injuryLevel > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-warning/80"
              style={{ height: `${riskStripeInjuryHeight}%` }}
            />
          )}
          {deathLevel > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-error/80"
              style={{ height: `${riskStripeDeathHeight}%` }}
            />
          )}
        </div>
      )}

      {/* Progress overlays from legacy styles */}
      {progressStyle === 'ribbon' && (
        <div className="pointer-events-none absolute inset-x-6 bottom-4 h-1.5 overflow-hidden rounded-full border border-slate-900/70 bg-slate-950/70">
          <div
            className="h-full bg-gradient-to-r from-amber-300 via-rose-400 to-indigo-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]"
            style={{ width: `${clampedProgress * 100}%` }}
          />
        </div>
      )}
      {progressStyle === 'halo' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[8.4rem] w-[8.4rem]">
            <div className="absolute inset-1 rounded-full border border-slate-900/70" />
            <div
              className="absolute inset-2 rounded-full opacity-70 blur-[0.5px]"
              style={{
                background: `conic-gradient(from ${haloStartDeg}deg, var(--glow-${visualVariant}, rgba(251,191,36,0.55)) 0deg ${progressDegrees}deg, rgba(4,6,16,0.35) ${progressDegrees}deg 360deg)`,
              }}
            />
            <div
              className="absolute inset-3 rounded-full mix-blend-screen opacity-70"
              style={{
                background: `conic-gradient(from ${haloHighlightStartDeg}deg, rgba(255,255,255,0.4), transparent 120deg)`,
              }}
            />
            <div className="absolute inset-[10px] rounded-full border border-slate-900/60 border-dashed opacity-40 animate-[spin_14s_linear_infinite]" />
          </div>
        </div>
      )}

      {/* Orb + timer */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <GlowProgress progress={clampedProgress} variant={progressVariant} size="verb" showTrail>
          <OrbIcon icon={icon} variant={orbVariant} size="verb" isActive={isActive} />
        </GlowProgress>
      </div>

      {/* Stats row */}
      <div className="relative z-10 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory">
        <div className="flex flex-col text-[10px] leading-tight text-ivory">
          <span className="font-bold text-xs text-ivory">{timerDisplay}</span>
          <span className="text-[9px] text-ivory/80">
            {assignedCount}/{totalSlots}
          </span>
        </div>
        {riskBadge && (
          <div className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] text-amber-200 drop-shadow">
            {riskBadge}
          </div>
        )}
      </div>
    </HearthstoneCard>
  );
});

export default VerbCard;
