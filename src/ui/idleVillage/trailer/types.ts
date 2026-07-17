/**
 * @trailer-only
 *
 * Shared types for the Steam teaser trailer production pipeline.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 * NO Zod validation
 */

/**
 * Common props provided to every trailer scene component by the shell.
 */
export interface TrailerSceneProps {
  /** Called when the scene has finished its scripted sequence. */
  onComplete?: () => void;
  /** Whether the scene should start its sequence automatically. */
  autoStart?: boolean;
  /** Capture mode hides non-cinematic UI such as debug overlays. */
  captureMode?: boolean;
}
