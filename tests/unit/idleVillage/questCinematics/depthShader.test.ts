import { describe, expect, it } from 'vitest';
import { DEPTH_FRAG } from '@/ui/idleVillage/questS1Lab/render/depthShader';

describe('depth shader focus rack', () => {
  it('uses a spatial blur kernel instead of coarse mip-level magnification', () => {
    expect(DEPTH_FRAG).toContain('uBlurPx');
    expect(DEPTH_FRAG).toContain('uViewSize');
    expect(DEPTH_FRAG).toContain('texture(uScene,');
    expect(DEPTH_FRAG).not.toContain('textureLod(uScene');
  });
});
