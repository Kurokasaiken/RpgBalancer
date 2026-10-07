import type { GameFrameWorldDressingConfig } from '@/balancing/config/idleVillage/gameFrameConfig';

/**
 * Manifest the screen loads: the graded map or the original, per config. In dev
 * builds `?map=original|graded` overrides it, to compare the two on the same screen.
 */
export function resolveWorldManifestPath(worldDressing: GameFrameWorldDressingConfig): string {
  let grade = worldDressing.grade;
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const override = new URLSearchParams(window.location.search).get('map');
    if (override === 'original' || override === 'graded') grade = override;
  }
  return grade === 'graded' ? worldDressing.gradedManifestPath : worldDressing.manifestPath;
}
