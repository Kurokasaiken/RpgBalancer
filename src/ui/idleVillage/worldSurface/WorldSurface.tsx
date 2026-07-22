import React from 'react';
import { WorldLayer } from './layers/WorldLayer';
import { BreathLayer } from './layers/BreathLayer';
import { EventLayer } from './layers/EventLayer';
import { WonderLayer } from './layers/WonderLayer';
import { UnderwaterLayer } from './layers/UnderwaterLayer';

export const WorldSurface: React.FC = () => {
  return (
    <div data-testid="world-surface">
      <WorldLayer />
      <BreathLayer />
      <EventLayer />
      <WonderLayer />
      <UnderwaterLayer />
    </div>
  );
};
