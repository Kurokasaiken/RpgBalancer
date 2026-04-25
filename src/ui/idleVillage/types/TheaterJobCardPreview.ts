/**
 * Shared shape describing compact job previews rendered inside the Theater view.
 * Centralized here to avoid duplicating the contract between hooks and UI layers.
 */
export interface TheaterJobCardPreview {
  id: string;
  slotId: string;
  label: string;
  icon: string;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  isPlaying: boolean;
}
