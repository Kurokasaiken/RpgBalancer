/**
 * @trailer-only
 *
 * TrailerLegacyV2Page — dedicated route for the Legacy V2
 * ("Preservation Table") iteration of scene 6.
 */

import React from 'react';
import { TrailerLegacyV2 } from './TrailerLegacyV2';

export const TrailerLegacyV2Page: React.FC = () => (
  <div style={{ width: '100%', height: '100vh' }}>
    <TrailerLegacyV2 autoStart captureMode={false} />
  </div>
);
