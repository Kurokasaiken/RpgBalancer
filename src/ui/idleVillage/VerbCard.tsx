import React, { forwardRef } from 'react';

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

// Usa le variabili CSS del tema Fantasy
const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const formatTime = (seconds?: number): string => {
  if (seconds === undefined || !Number.isFinite(seconds)) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    className,
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
      ? 'ring-2 ring-emerald-400/60 border-emerald-400/60 shadow-[0_0_22px_rgba(16,185,129,0.4)]'
      : dropState === 'invalid'
        ? 'ring-2 ring-rose-500/60 border-rose-500/80 shadow-[0_0_22px_rgba(244,63,94,0.4)]'
        : isActive
          ? 'ring-1 ring-amber-400/60 shadow-[0_0_18px_rgba(245,158,11,0.35)]'
          : 'ring-1 ring-slate-800/70 shadow-[0_12px_28px_rgba(2,6,23,0.85)]';

  const CARD_WIDTH = 120;
  const CARD_HEIGHT = 168;
  const CARD_RADIUS = 28;
  const straightLength = 2 * (CARD_WIDTH + CARD_HEIGHT - 2 * CARD_RADIUS);
  const arcLength = 2 * Math.PI * CARD_RADIUS;
  const rectPerimeter = straightLength + arcLength;
  const progressStrokeOffset = rectPerimeter * (1 - clampedProgress);

  const baseStroke =
    deathLevel > 0
      ? 'var(--error)'
      : injuryLevel > 0
        ? 'var(--warning)'
        : 'rgba(148,163,184,0.6)';

  const strokeColor =
    dropState === 'valid'
      ? 'var(--success)'
      : dropState === 'invalid'
        ? 'var(--error)'
        : isActive
          ? 'var(--gold)'
          : baseStroke;

  const timerDisplay = formatTime(isActive ? remainingSeconds : totalDuration);

  const VARIANT_MAP: Record<
    VerbVisualVariant,
    {
      glowBg: string;
      ringBorder: string;
      orbBg: string;
      iconColor: string;
      timerColor: string;
      haloColor: string;
      haloAccent: string;
    }
  > = {
    azure: {
      glowBg: 'bg-[conic-gradient(from_120deg,rgba(14,165,233,0.4),rgba(129,140,248,0.35),rgba(14,165,233,0.4))]',
      ringBorder: 'border-cyan-400/40',
      orbBg: 'bg-gradient-to-b from-[#091222] via-[#050a12] to-[#03060a]',
      iconColor: 'text-sky-100',
      timerColor: 'text-cyan-200',
      haloColor: 'rgba(14,165,233,0.55)',
      haloAccent: 'rgba(129,140,248,0.55)',
    },
    ember: {
      glowBg: 'bg-[conic-gradient(from_90deg,rgba(251,146,60,0.4),rgba(244,63,94,0.35),rgba(251,146,60,0.4))]',
      ringBorder: 'border-orange-400/40',
      orbBg: 'bg-gradient-to-b from-[#1b0b05] via-[#2b0b08] to-[#140403]',
      iconColor: 'text-amber-200',
      timerColor: 'text-orange-200',
      haloColor: 'rgba(251,146,60,0.55)',
      haloAccent: 'rgba(244,63,94,0.5)',
    },
    jade: {
      glowBg: 'bg-[conic-gradient(from_45deg,rgba(16,185,129,0.4),rgba(45,212,191,0.35),rgba(16,185,129,0.4))]',
      ringBorder: 'border-emerald-300/40',
      orbBg: 'bg-gradient-to-b from-[#04140f] via-[#03201a] to-[#020a07]',
      iconColor: 'text-emerald-200',
      timerColor: 'text-teal-200',
      haloColor: 'rgba(16,185,129,0.55)',
      haloAccent: 'rgba(45,212,191,0.45)',
    },
    amethyst: {
      glowBg: 'bg-[conic-gradient(from_30deg,rgba(167,139,250,0.35),rgba(129,140,248,0.35),rgba(167,139,250,0.35))]',
      ringBorder: 'border-purple-300/40',
      orbBg: 'bg-gradient-to-b from-[#120320] via-[#1d0c26] to-[#08010f]',
      iconColor: 'text-violet-200',
      timerColor: 'text-fuchsia-200',
      haloColor: 'rgba(167,139,250,0.55)',
      haloAccent: 'rgba(129,140,248,0.5)',
    },
    solar: {
      glowBg: 'bg-[conic-gradient(from_60deg,rgba(250,204,21,0.35),rgba(251,191,36,0.3),rgba(250,204,21,0.35))]',
      ringBorder: 'border-amber-300/40',
      orbBg: 'bg-gradient-to-b from-[#251803] via-[#2d1a04] to-[#120901]',
      iconColor: 'text-amber-100',
      timerColor: 'text-amber-200',
      haloColor: 'rgba(251,191,36,0.55)',
      haloAccent: 'rgba(251,146,60,0.45)',
    },
  };

  const variant = VARIANT_MAP[visualVariant];

  const rootClass = [
    'relative inline-flex h-44 w-28 items-center justify-center overflow-hidden rounded-[28px]',
    'border border-slate-800/80 bg-gradient-to-b from-[#04060d] via-[#050914] to-[#03050a] px-4 py-5',
    'transition-all duration-300 ease-out backdrop-blur-[6px]',
    isInteractive ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default',
    dropFrameClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={rootClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...interactiveProps}
      {...rest}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_-10%,rgba(129,140,248,0.35),transparent_60%),radial-gradient(circle_at_140%_140%,rgba(45,212,191,0.25),transparent_60%)]" />
      </div>
      {progressStyle === 'border' && (
        <svg
          className="pointer-events-none absolute inset-3"
          viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect
            x={4}
            y={4}
            width={CARD_WIDTH - 8}
            height={CARD_HEIGHT - 8}
            rx={CARD_RADIUS - 4}
            ry={CARD_RADIUS - 4}
            fill="none"
            stroke={strokeColor}
            strokeWidth={3}
            strokeDasharray={rectPerimeter}
            strokeDashoffset={progressStrokeOffset}
            strokeLinecap="round"
          />
        </svg>
      )}
      {progressStyle === 'ribbon' && (
        <div className="absolute inset-x-6 bottom-4 h-1.5 overflow-hidden rounded-full bg-slate-900/80 border border-slate-800/70">
          <div
            className={[
              'h-full',
              'bg-linear-to-r from-amber-400 via-rose-400 to-indigo-400',
              'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
            ].join(' ')}
            style={{ width: `${clampedProgress * 100}%` }}
          />
        </div>
      )}
      {progressStyle === 'halo' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-28 w-28">
            <div className="absolute inset-1 rounded-full border border-slate-900/70" />
            <div
              className="absolute inset-2 rounded-full opacity-80 blur-[0.5px]"
              style={{
                background: `conic-gradient(${variant.haloColor} 0deg ${clampedProgress * 360}deg, rgba(4,6,16,0.35) ${clampedProgress * 360}deg 360deg)`,
              }}
            />
            <div
              className="absolute inset-3 rounded-full mix-blend-screen opacity-70"
              style={{
                background: `conic-gradient(from ${Math.max(clampedProgress * 360 - 40, 0)}deg, ${variant.haloAccent}, transparent 120deg)`,
              }}
            />
            <div className="absolute inset-[10px] rounded-full border border-slate-900/60 border-dashed opacity-40 animate-[spin_14s_linear_infinite]" />
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center">
        <div className={`absolute h-20 w-20 rounded-full blur-xl opacity-70 ${variant.glowBg}`} />
        <div className={`absolute h-[4.8rem] w-[4.8rem] rounded-full border ${variant.ringBorder}`}>
          <div className="absolute inset-0 rounded-full border border-slate-900/80 shadow-[0_0_12px_rgba(6,182,212,0.2)] opacity-80" />
          <div className="absolute inset-1 rounded-full border border-amber-400/20" />
          <div className="absolute inset-0 rounded-full border border-transparent [background:conic-gradient(rgba(255,255,255,0.08),transparent_50%,rgba(255,255,255,0.15))] [mask:border-box] mask-composite:exclude" />
          <div className="absolute inset-[3px] rounded-full border border-slate-900/60 animate-[spin_12s_linear_infinite]" />
        </div>
        <div className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-full border border-amber-500/70 ${variant.orbBg} shadow-inner shadow-black/50`}>
          <span className={`text-2xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] ${variant.iconColor}`}>
            {icon}
          </span>
          <div className={`mt-0.5 text-[11px] font-mono font-semibold leading-none tracking-[0.2em] ${variant.timerColor}`}>
            {timerDisplay}
          </div>
        </div>
      </div>
    </div>
  );
});

export default VerbCard;
