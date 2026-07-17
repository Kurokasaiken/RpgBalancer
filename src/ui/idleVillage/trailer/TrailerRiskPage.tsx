/**
 * @trailer-only
 *
 * TrailerRiskPage — dedicated route for the Risk scene (AstrolabeTrailerController).
 */

import React from 'react';
import { AstrolabeTrailerController } from './AstrolabeTrailerController';

export const TrailerRiskPage: React.FC = () => (
  <div style={{ width: '100%', height: '100vh' }}>
    <AstrolabeTrailerController autoStart hideControls />
  </div>
);
