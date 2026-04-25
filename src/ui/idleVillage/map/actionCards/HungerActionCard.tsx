import type { ReactNode } from 'react';
import ActionCard from './ActionCard';
import { formatMiniCardCountdown } from './cardFormatting';
import { HungerGlyph } from './icons/HungerGlyph';

/**
 * Props for {@link HungerActionCard}, a passive upkeep monitor tied to the global day/night timer.
 */
export interface HungerActionCardProps {
  /** Progress fraction shared with the day/night cycle (0-1). */
  progressFraction: number;
  /** Total cycle duration in seconds. */
  totalSeconds: number;
  /** Whether the underlying cycle is currently running. */
  isPlaying?: boolean;
  /** Optional click handler (e.g. open market), otherwise card is read-only. */
  onAction?: () => void;
  /** Icon rendered inside the halo, defaults to the Lucide Drumstick glyph. */
  icon?: ReactNode;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

/**
 * Compact passive card mirroring the day/night timer but focused on village hunger upkeep.
 * Displays current food reserves and inherits the global cycle countdown for clarity.
 */
export const HungerActionCard: React.FC<HungerActionCardProps> = ({
  progressFraction,
  totalSeconds,
  isPlaying = false,
  onAction,
  icon = <HungerGlyph data-testid="hunger-icon" className="h-8 w-8" />,
}) => {
  const clampedProgress = clamp01(progressFraction);
  const elapsedSeconds = clampedProgress * totalSeconds;

  return (
    <ActionCard
      label=""
      subtitle=""
      helperText={undefined}
      icon={icon}
      progressFraction={clampedProgress}
      elapsedSeconds={elapsedSeconds}
      totalDurationSeconds={totalSeconds}
      isPlaying={isPlaying}
      variant="solar"
      onToggle={onAction}
      showStats={false}
      hideHeader
      showStatusLabel={false}
      showHaloTrail={false}
      haloStrokeWidth={2.5}
      innerSizePercent={84}
      countdownFontSizePx={9}
      countdownFormatter={formatMiniCardCountdown}
      chromeless
    />
  );
};

export default HungerActionCard;
