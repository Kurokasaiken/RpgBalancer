import React from 'react';
import { render } from '@testing-library/react';
import { WorldSurface } from '../../../src/ui/idleVillage/worldSurface/WorldSurface';
import { WORLD_SURFACE_CONFIG } from '../../../src/ui/idleVillage/worldSurface/config/worldSurfaceConfig';

describe('WorldSurfaceV3Foundation', () => {
  it('renders world surface container', () => {
    const { getByTestId } = render(<WorldSurface />);
    expect(getByTestId('world-surface')).toBeTruthy();
  });

  it('exports a valid world surface config', () => {
    expect(WORLD_SURFACE_CONFIG.parallax.multipliers).toEqual([1.2, 1.1, 1.02, 1, 0.9, 0.75]);
    expect(WORLD_SURFACE_CONFIG.calibration.baseOpacity).toBe(0.5);
  });
});
