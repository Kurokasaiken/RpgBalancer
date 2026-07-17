/**
 * @trailer-only
 *
 * TrailerConsequencePage — dedicated route for the Consequence scene.
 */

import React from 'react';
import { TrailerConsequence } from './TrailerConsequence';

export const TrailerConsequencePage: React.FC = () => (
  <div style={{ width: '100%', height: '100vh' }}>
    <TrailerConsequence autoStart captureMode={false} />
  </div>
);
