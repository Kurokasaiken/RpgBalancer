import type { JSX } from 'react';
import type { WarningLevel } from '@/balancing/config/idleVillage/types/survivalTypes';

export interface GameplayHeaderProps {
  gold: number;
  foodCurrent: number;
  foodMax: number;
  foodWarningLevel: WarningLevel;
  fatiguePercent: number;
  currentDay: number;
  isPaused: boolean;
  cyclePhaseLabel: string;
  cycleProgressFraction: number;
  isDayPhase: boolean;
}

interface HudChipProps {
  label: string;
  value: string;
  helper?: string;
  status?: 'warning' | 'critical' | 'normal';
}

const chipColors: Record<string, string> = {
  normal: 'var(--card-border-color, rgba(255,255,255,0.18))',
  warning: 'var(--accent-color, rgba(240, 171, 12, 0.85))',
  critical: 'var(--color-crimson, #ef4444)',
};

function HudChip({ label, value, helper, status = 'normal' }: HudChipProps) {
  const borderColor = chipColors[status] ?? chipColors.normal;
  const background = status === 'critical'
    ? 'rgba(239, 68, 68, 0.15)'
    : status === 'warning'
      ? 'rgba(240, 171, 12, 0.12)'
      : 'rgba(255, 255, 255, 0.06)';

  return (
    <div
      style={{
        minWidth: 120,
        flex: '1 1 120px',
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        padding: '12px 16px',
        background,
        boxShadow: '0 15px 30px rgba(0,0,0,0.35)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--slot-helper-color, rgba(255,255,255,0.55))',
        }}
      >
        {label}
      </p>
      <div
        style={{
          marginTop: 6,
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-primary, #f7f2d8)',
        }}
      >
        {value}
      </div>
      {helper && (
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: 12,
            color: 'var(--text-muted, rgba(226,232,240,0.7))',
          }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

function DayNightIndicator({
  label,
  progress,
  isDayPhase,
  isPaused,
}: {
  label: string;
  progress: number;
  isDayPhase: boolean;
  isPaused: boolean;
}) {
  const normalizedProgress = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - normalizedProgress * circumference;
  const phaseColor = isDayPhase
    ? 'var(--accent-color, #f59e0b)'
    : 'var(--slot-ring-active, #38bdf8)';

  return (
    <div
      aria-label="Indicatore ciclo giorno/notte"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 20px',
        borderRadius: 24,
        border: `1px solid var(--panel-border, rgba(255,255,255,0.18))`,
        background: 'radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 55%), rgba(5,6,9,0.75)',
      }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" role="presentation">
        <circle
          cx="60"
          cy="60"
          r="42"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          stroke={phaseColor}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 240ms ease' }}
        />
        <circle cx="60" cy="60" r="30" fill="rgba(0,0,0,0.45)" />
        <text
          x="60"
          y="65"
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill="var(--text-primary, #f4f1de)"
        >
          {isDayPhase ? 'DAY' : 'NIGHT'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--slot-helper-color, rgba(255,255,255,0.55))',
          }}
        >
          {label}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--text-primary, #f7f2d8)',
            }}
          >
            {(normalizedProgress * 100).toFixed(0)}%
          </span>
          {isPaused && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px solid ${phaseColor}`,
                color: phaseColor,
                fontSize: 12,
                letterSpacing: '0.2em',
              }}
            >
              ⏸ Paused
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function GameplayHeader({
  gold,
  foodCurrent,
  foodMax,
  foodWarningLevel,
  fatiguePercent,
  currentDay,
  isPaused,
  cyclePhaseLabel,
  cycleProgressFraction,
  isDayPhase,
}: GameplayHeaderProps): JSX.Element {
  const formattedGold = Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(gold);

  const foodHelper = `${Math.floor(foodCurrent)}/${foodMax}`;
  const fatigueHelper = `${Math.min(Math.max(fatiguePercent, 0), 100).toFixed(0)}%`;        
  const dayHelper = `Day ${Math.max(1, currentDay)}`;

  const chips: HudChipProps[] = [
    { label: 'Gold', value: formattedGold, helper: 'Available treasury' },
    {
      label: 'Food',
      value: foodHelper,
      helper: foodWarningLevel.toUpperCase(),
      status: foodWarningLevel === 'critical' ? 'critical' : foodWarningLevel === 'low' ? 'warning' : 'normal',
    },
    { label: 'Fatigue', value: fatigueHelper, helper: 'Village average' },
    { label: 'Cycle', value: dayHelper, helper: cyclePhaseLabel },
  ];

  return (
    <section
      aria-label="HUD principale"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '16px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {chips.map((chip) => (
          <HudChip key={chip.label} {...chip} />
        ))}
      </div>

      <DayNightIndicator
        label="Day • Night Cycle"
        progress={cycleProgressFraction}
        isDayPhase={isDayPhase}
        isPaused={isPaused}
      />
    </section>
  );
}

export default GameplayHeader;
