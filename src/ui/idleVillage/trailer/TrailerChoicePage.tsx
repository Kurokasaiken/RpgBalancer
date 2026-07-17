/**
 * @trailer-only
 *
 * TrailerChoicePage — dedicated route for the Choice scene.
 */

import React from 'react';
import { TrailerChoice } from './TrailerChoice';

export const TrailerChoicePage: React.FC = () => (
  <div style={{ width: '100%', height: '100vh' }}>
    <TrailerChoice autoStart captureMode={false} />
  </div>
);
