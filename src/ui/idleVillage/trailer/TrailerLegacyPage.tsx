/**
 * @trailer-only
 *
 * TrailerLegacyPage — dedicated route for the Legacy scene.
 */

import React from 'react';
import { TrailerLegacy } from './TrailerLegacy';

export const TrailerLegacyPage: React.FC = () => (
  <div style={{ width: '100%', height: '100vh' }}>
    <TrailerLegacy autoStart captureMode={false} />
  </div>
);
