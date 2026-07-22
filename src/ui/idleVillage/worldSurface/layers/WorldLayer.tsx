import React from 'react';
import { WORLD_SURFACE_CONFIG } from '../config/worldSurfaceConfig';

export const WorldLayer: React.FC = () => {
  return (
    <div style={{ opacity: WORLD_SURFACE_CONFIG.calibration.baseOpacity }} data-testid="world-layer">
      {/* Static terrain/cities/roads layer content */}
    </div>
  );
};
