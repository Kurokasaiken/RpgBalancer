/**
 * @trailer-only
 *
 * TrailerPreparationPage — dedicated route for the Preparation scene.
 */

import React from 'react';
import { TrailerPreparation } from './TrailerPreparation';

export const TrailerPreparationPage: React.FC = () => (
  <div style={{ width: '100%', height: '100vh' }}>
    <TrailerPreparation autoStart captureMode={false} />
  </div>
);
