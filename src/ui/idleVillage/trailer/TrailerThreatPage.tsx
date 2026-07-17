/**
 * @trailer-only
 *
 * TrailerThreatPage — dedicated route for the Threat scene.
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
import { TrailerThreat } from './TrailerThreat';

/**
 * Renders the Threat trailer scene on its own page without auto-cycling.
 */
export const TrailerThreatPage: React.FC = () => (
  <div style={{ width: '100%', height: '100vh' }}>
    <TrailerThreat autoStart captureMode={false} />
  </div>
);
