/**
 * @trailer-only
 *
 * TrailerSceneShell — shared chrome for every teaser scene.
 *
 * Gives each scene the canonical /primitives look: a `skin-scope` subtree
 * (role-based skin inheritance for h1/button/plaque), the materic obsidian
 * field background, and the `MatericAmbientField` atmosphere (nebula,
 * vignette, light leak, fireflies) instead of the old V9 glass painting.
 *
 * This component is part of the Steam teaser trailer production pipeline.
 * It is exempt from gameplay architecture requirements but must preserve
 * presentation architecture requirements.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 */

import React from 'react';
import { MatericAmbientField } from '@/ui/designSystem/primitives';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import './trailer.css';

export interface TrailerSceneShellProps {
  /** Adds `trailer-capture-mode` (hides non-cinematic UI). */
  captureMode?: boolean;
  /** Fireflies in the ambient field (default 4, max 8). */
  fireflyCount?: number;
  /** Pause the ambient field animations. */
  paused?: boolean;
  /** Extra classes on the scene root (e.g. `trailer-greyscale`). */
  className?: string;
  /** Extra styles on the scene root. */
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Full-screen scene root: materic field background + ambient atmosphere +
 * skin scope. Scene content is rendered above the atmosphere; give it an
 * explicit `zIndex` (scenes already use `zIndex: 20+`).
 */
export const TrailerSceneShell: React.FC<TrailerSceneShellProps> = ({
  captureMode = false,
  fireflyCount = 4,
  paused = false,
  className = '',
  style,
  children,
}) => (
  <SkinScope
    className={`trailer-root trailer-background ${captureMode ? 'trailer-capture-mode' : ''} ${className}`.trim()}
    style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
  >
    <MatericAmbientField
      paused={paused}
      fireflyCount={fireflyCount}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
    {children}
  </SkinScope>
);

export default TrailerSceneShell;
