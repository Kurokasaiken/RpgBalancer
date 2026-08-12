/**
 * @trailer-only
 *
 * TrailerThreatComponentPage — isolated test page for the threat card.
 *
 * This page exists solely to preview the TrailerThreatComponent without the
 * full scene choreography (pergamena clouds, map split, etc.).
 */

import React from 'react';
import { TrailerThreatComponent } from './TrailerThreatComponent';

/**
 * Renders the threat card centered on a dark cinematic background.
 */
export const TrailerThreatComponentPage: React.FC = () => (
  <div
    className="trailer-scene trailer-background"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <TrailerThreatComponent autoPlay onReplay={() => undefined} />
  </div>
);

export default TrailerThreatComponentPage;
