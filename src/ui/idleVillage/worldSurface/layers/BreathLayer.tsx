import React from 'react';
import { useBreathAnimation } from '../hooks/useBreathAnimation';

export const BreathLayer: React.FC = () => {
  const breathPhase = useBreathAnimation();

  return (
    <div style={{ opacity: breathPhase }} data-testid="breath-layer">
      {/* Clouds/fog/water/tree canopy motion layer content */}
    </div>
  );
};
