import React from 'react';

export type VerbTone = 'neutral' | 'job' | 'quest' | 'danger' | 'system';

const VERB_TONE_ACTIVE_COLORS: Record<VerbTone, string> = {
  neutral: 'rgba(148,163,184,1)',
  job: 'rgba(59,130,246,1)',
  quest: 'rgba(52,211,153,1)',
  danger: 'rgba(248,113,113,1)',
  system: 'rgba(56,189,248,1)',
};

interface VerbCardProps {
  label: string;
  icon: React.ReactNode;
  kindLabel?: string | null;
  assignees: string[];
  rewardsLabel?: string | null;
  deadlineLabel?: string | null;
  riskLabel?: string | null;
  progressFraction: number;
  state: 'idle' | 'running' | 'completed';
  isQuest?: boolean;
  isJob?: boolean;
  pulseOnMount?: boolean;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  toneColors?: Partial<Record<VerbTone, string>>;
  tone?: VerbTone;
}

const clamp01 = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const VerbCard: React.FC<VerbCardProps> = ({
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
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled,
  toneColors,
  tone,
}) => {
  const clamped = clamp01(progressFraction);
  const progressDegrees = clamped * 360;

  const resolvedTone: VerbTone = tone || (isQuest ? 'quest' : isJob ? 'job' : 'neutral');

  const baseTrackColor = 'rgba(15,23,42,1)';
  const activeColor = (toneColors && toneColors[resolvedTone]) || VERB_TONE_ACTIVE_COLORS[resolvedTone];

  const backgroundImage = `conic-gradient(${activeColor} 0deg ${progressDegrees}deg, ${baseTrackColor} ${progressDegrees}deg 360deg)`;

  const stateOpacity = state === 'idle' ? 'opacity-80' : state === 'completed' ? 'opacity-100' : 'opacity-95';
  const pulseClass = pulseOnMount ? 'animate-[pulse_0.7s_ease-out_1]' : '';

  const showPrimaryAction = !!primaryActionLabel && typeof onPrimaryAction === 'function';

  return (
    <div
      className={`rounded-lg p-px shadow-[0_10px_24px_rgba(15,23,42,0.9)] ${stateOpacity} ${pulseClass}`}
      style={{ backgroundImage }}
    >
      <div className="rounded-[7px] bg-obsidian/95 border border-slate-800 px-2.5 py-1.5 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded bg-black/80 border border-slate-600 flex items-center justify-center text-xs shrink-0">
              {icon}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-100 truncate">
                {label}
              </div>
              <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-400">
                {kindLabel && (
                  <span className="uppercase tracking-[0.18em] text-slate-400">
                    {kindLabel}
                  </span>
                )}
                {deadlineLabel && (
                  <span className="text-xs text-amber-300">
                    {deadlineLabel}
                  </span>
                )}
                {riskLabel && (
                  <span className="text-[9px] text-rose-300">
                    {riskLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-[9px] text-slate-300 shrink-0">
            {assignees.length > 0 && (
              <div className="flex flex-wrap justify-end gap-0.5 max-w-[120px]">
                {assignees.map((name) => (
                  <span
                    key={name}
                    className="px-1 py-px rounded-full bg-slate-900/90 border border-slate-700 text-[9px] leading-tight truncate"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
            {rewardsLabel && (
              <div className="text-[9px] text-emerald-300 truncate max-w-[120px]">
                {rewardsLabel}
              </div>
            )}
          </div>
        </div>
        {showPrimaryAction && (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={primaryActionDisabled}
              className="px-2 py-0.5 rounded-full border border-emerald-400/70 bg-emerald-500/10 text-[9px] uppercase tracking-[0.16em] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {primaryActionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerbCard;
