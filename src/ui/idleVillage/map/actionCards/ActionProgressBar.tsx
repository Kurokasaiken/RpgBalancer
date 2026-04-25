import { useMemo } from 'react';
import { GlowProgress, type ProgressVariant } from '@/ui/fantasy/atoms/GlowProgress';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

export interface ActionProgressBarProps {
  /** Progress fraction (0-1) */
  progressFraction: number;
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Total duration in seconds */
  totalDurationSeconds: number;
  /** Optional variant for visual styling */
  variant?: ProgressVariant;
  /** Optional custom formatter for remaining time */
  countdownFormatter?: (remainingSeconds: number) => string;
  /** Optional font size for countdown */
  countdownFontSizePx?: number;
  /** Optional className */
  className?: string;
  /** Optional data-testid for Playwright */
  dataTestId?: string;
  /** Optional pillar for Style Lab tokens */
  pillar?: StyleLabPillar;
}

/**
 * ActionProgressBar – Isolated progress ring component using Style Lab tokens.
 * Wraps GlowProgress with WL-STY-004 actionCardFeel interaction physics.
 * Designed to be composed by ActionCardBase and semantic wrappers.
 */
export function ActionProgressBar({
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  variant = 'solar',
  countdownFormatter,
  countdownFontSizePx = 12,
  className,
  dataTestId,
  _pillar,
}: ActionProgressBarProps) {
  const tokens = useStyleLabTokens();

  const formatSeconds = (seconds?: number): string => {
    if (seconds == null || Number.isNaN(seconds)) return '--';
    if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainder}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${remainder}`;
  };

  const defaultFormatter = countdownFormatter || formatSeconds;
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  const progressStyle = useMemo(() => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none' as const,
  }), []);

  const containerStyle = useMemo(() => ({
    position: 'relative',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }), []);

  const countdownStyle = useMemo(() => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: `${countdownFontSizePx}px`,
    fontWeight: 'bold',
    color: tokens.preset.text.primary,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    pointerEvents: 'none' as const,
    textAlign: 'center',
    whiteSpace: 'nowrap' as const,
  }), [tokens, countdownFontSizePx]);

  return (
    <div className={className} data-testid={dataTestId ?? 'action-progress-bar'} style={containerStyle}>
      <GlowProgress
        variant={variant}
        progress={progressFraction}
        size={60}
        strokeWidth={4}
        style={progressStyle}
      />
      <div style={countdownStyle}>
        {defaultFormatter(remainingSeconds)}
      </div>
    </div>
  );
}

export default ActionProgressBar;
