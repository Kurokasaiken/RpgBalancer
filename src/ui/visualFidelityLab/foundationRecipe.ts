import type { MaterialLayerConfig } from '@/ui/wanderlust-surface/WanderlustSurface';
import type { MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';

/**
 * Visual Fidelity Lab — shared foundation (the GRAMMAR, not the content).
 *
 * Identical material language to the frozen reference (v9-skin-sandbox,
 * "Layout Primitives"). The rebuild MAY change hierarchy/spacing/rhythm but
 * MUST NOT introduce a new palette, frame, or material language. These three
 * constants encode exactly that boundary.
 */
export const OBSIDIAN_BG = 'var(--skin-surface-bg)';

/** Same frame material as the reference. Not negotiable for the spike. */
export const SURFACE_MATERIAL: MaterialPreset = 'bronze';

/** Same depth/rim treatment as the reference panel. */
export const SURFACE_MATERIAL_LAYER: MaterialLayerConfig = {
  physicalDepth: true,
  rimLight: true,
  backgroundMode: 'bg',
  microInteraction: false,
  heavyFeel: false,
};
