import React from 'react';

export type VerbTone = 'neutral' | 'job' | 'quest' | 'danger' | 'system';

const VERB_TONE_ACTIVE_COLORS: Record<VerbTone, string> = {
  neutral: 'rgba(148,163,184,1)',
  job: 'rgba(59,130,246,1)',
  quest: 'rgba(52,211,153,1)',
  danger: 'rgba(248,113,113,1)',
  system: 'rgba(56,189,248,1)',
};

type DropState = 'idle' | 'valid' | 'invalid';

interface VerbCardProps {
  label?: string;
  icon: React.ReactNode;
  kindLabel?: string | null;
  assignees?: string[];
  rewardsLabel?: string | null;
  deadlineLabel?: string | null;
  riskLabel?: string | null;
  progressFraction: number;
  state: 'idle' | 'running' | 'completed';
  isQuest?: boolean;
  isJob?: boolean;
  pulseOnMount?: boolean;
  toneColors?: Partial<Record<VerbTone, string>>;
  tone?: VerbTone;
  tooltip?: string;
  isRejecting?: boolean;
  isInteractive?: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  slotRequirementLabel?: string;
  assignedLabel?: string | null;
  dropState?: DropState;
}

const clamp01 = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export default function VerbCard({
  label,
  icon,
  kindLabel,
  assignees,
  rewardsLabel,
  deadlineLabel,
  riskLabel,
  progressFraction,
  state,
  isQuest,
  isJob,
  pulseOnMount,
  toneColors,
  tone,
  tooltip,
  isRejecting,
  isInteractive,
  onClick,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  slotRequirementLabel,
  assignedLabel,
  dropState = 'idle',
}: VerbCardProps) {
  const clamped = clamp01(progressFraction);
  const progressDegrees = clamped * 360;
  const resolvedTone: VerbTone = tone || (isQuest ? 'quest' : isJob ? 'job' : 'neutral');
  const baseTrackColor = 'rgba(15,23,42,0.6)';
  const activeColor = (toneColors && toneColors[resolvedTone]) || VERB_TONE_ACTIVE_COLORS[resolvedTone];
  const ringBackground = `conic-gradient(${activeColor} 0deg ${progressDegrees}deg, ${baseTrackColor} ${progressDegrees}deg 360deg)`;

  const stateOpacity = state === 'idle' ? 'opacity-85' : state === 'completed' ? 'opacity-100' : 'opacity-95';
  const pulseClass = pulseOnMount ? 'animate-[pulse_0.7s_ease-out_1]' : '';
  const handleSelect = () => {
    if (!isInteractive) return;
    onClick?.();
    onSelect?.();
  };

  const interactiveProps =
    isInteractive && onClick
      ? {
          role: 'button' as const,
          tabIndex: 0,
          onClick: handleSelect,
          onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleSelect();
            }
          },
        }
      : {};

  const metaChunks = [
    label,
    kindLabel ? `Type: ${kindLabel}` : null,
    slotRequirementLabel ? `Req: ${slotRequirementLabel}` : null,
    assignedLabel ? `Assigned: ${assignedLabel}` : null,
    riskLabel ? `Risk: ${riskLabel}` : null,
    rewardsLabel ? `Rewards: ${rewardsLabel}` : null,
    assignees && assignees.length ? `Members: ${assignees.join(', ')}` : null,
  ].filter(Boolean) as string[];

  const ariaLabel = metaChunks.length ? metaChunks.join(' · ') : undefined;

  const dropHighlight =
    dropState === 'valid'
      ? 'ring-2 ring-emerald-300/80'
      : dropState === 'invalid' || isRejecting
        ? 'ring-2 ring-rose-400/80'
        : '';

  return (
    <div
      className={[
        'group inline-flex flex-col items-center select-none',
        'rounded-full border border-transparent p-1 transition-all duration-200',
        stateOpacity,
        pulseClass,
        isInteractive ? 'cursor-pointer' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...interactiveProps}
    >
      {ariaLabel && <span className="sr-only">{ariaLabel}</span>}
      <div
        className={[
          'relative p-1 rounded-full transition-all duration-200 shadow-[0_18px_45px_rgba(0,0,0,0.6)]',
          dropHighlight,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ backgroundImage: ringBackground }}
      >
        <div
          className={[
            'flex h-24 w-24 flex-col items-center justify-center rounded-full border border-slate-900 bg-obsidian/95 text-ivory transition-all duration-200',
            state === 'running' ? 'shadow-[0_0_20px_rgba(45,212,191,0.35)]' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="text-3xl drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]">{icon}</span>
          {deadlineLabel && (
            <div className="mt-1 text-[11px] font-mono text-amber-200">{deadlineLabel}</div>
          )}
          {tooltip && (
            <div className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-slate-200 opacity-0 transition group-hover:opacity-100">
              {tooltip}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
