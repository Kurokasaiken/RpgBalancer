import type { ReactNode } from 'react';
import { PauseCircle } from 'lucide-react';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import { ActionCard } from './ActionCard';
import { formatMiniCardCountdown } from './cardFormatting';

/**
 * Props for DayNightActionCard component
 */
interface DayNightActionCardProps {
  /** Icon representing current phase (sun/moon) */
  phaseIcon: ReactNode;
  /** Whether the cycle is currently playing (!isPaused) */
  isPlaying: boolean;
  /** Progress through current phase (0-1) */
  progressFraction: number;
  /** Total duration of current phase in seconds */
  totalSeconds: number;
  /** Visual variant for the action card */
  variant?: VerbVisualVariant;
  /** Size of the progress halo in pixels */
  haloSizePx?: number;
  /** Stroke width of the progress halo */
  haloStrokeWidth?: number;
  /** Inner size percentage for the card */
  innerSizePercent?: number;
  /** Callback for pause/resume toggle */
  onToggle: () => void;
  /** Display label for the card */
  label?: string;
  /** Icon rendered when the cycle is paused (defaults to a PauseCircle) */
  pauseIcon?: ReactNode;
  /** Optional className to constrain the ActionCard wrapper */
  className?: string;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const clamp = (value: number, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
};

/**
 * Day/Night Action Card Component
 * 
 * Interactive card for controlling the day/night cycle.
 * Displays current phase, progress, and provides pause/resume toggle.
 * Uses ActionCard as base with day/night specific styling.
 * 
 * Features:
 * - Progress halo showing phase advancement
 * - Phase icon (sun/moon) or pause icon
 * - Click to toggle pause/resume
 * - Configurable visual parameters
 * 
 * @param props - Component props containing phase state and callbacks
 * @returns An interactive action card for day/night cycle control
 */
export default function DayNightActionCard({
  phaseIcon,
  isPlaying,
  progressFraction,
  totalSeconds,
  variant = 'solar',
  haloSizePx = 160,
  haloStrokeWidth = 6,
  innerSizePercent = 55,
  onToggle,
  label = 'Day/Night Cycle',
  pauseIcon = <PauseCircle aria-hidden data-testid="day-night-pause-icon" className="h-8 w-8" />,
  className,
}: DayNightActionCardProps) {
  const clampedProgress = clamp01(progressFraction);
  const elapsedSeconds = clampedProgress * totalSeconds;
  const icon = isPlaying ? phaseIcon : pauseIcon;
  const haloSize = clamp(haloSizePx, 80, 360, 160);
  const haloStroke = clamp(haloStrokeWidth, 2, 16, 6);
  const innerPercent = clamp(innerSizePercent, 10, 90, 55);

  return (
    <ActionCard
      label={label}
      icon={icon}
      progressFraction={clampedProgress}
      elapsedSeconds={elapsedSeconds}
      totalDurationSeconds={totalSeconds}
      isPlaying={isPlaying}
      variant={variant}
      onToggle={onToggle}
      hideHeader
      showStatusLabel={false}
      showStats={false}
      haloSizePx={haloSize}
      haloStrokeWidth={haloStroke}
      innerSizePercent={innerPercent}
      countdownFontSizePx={8}
      countdownFormatter={formatMiniCardCountdown}
      showHaloTrail={false}
      showHaloGlowFill={false}
      showHaloOrbit={false}
      chromeless
      className={className}
      haloWrapperClassName="drop-shadow-[0_25px_45px_rgba(0,0,0,0.55)]"
      dataTestId="day-night-card"
    />
  );
}
