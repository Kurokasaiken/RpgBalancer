/**
 * @trailer-only
 *
 * TrailerOutroPage — dedicated route for the Outro scene.
 */

import React from 'react';
import { TrailerOutro } from './TrailerOutro';

export const TrailerOutroPage: React.FC = () => (
  <div style={{ width: '100%', height: '100vh' }}>
    <TrailerOutro autoStart captureMode={false} />
  </div>
);
