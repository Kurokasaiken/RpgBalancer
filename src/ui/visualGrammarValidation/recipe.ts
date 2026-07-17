/**
 * Visual Grammar Validation Spike — shared RECIPE (the visual language).
 *
 * Intentionally shared between Reference and Rebuild: proving fidelity means
 * proving that the same GRAMMAR (material + surface + inner primitives) yields
 * a coherent screen with DIFFERENT content. The grammar is shared; the data is
 * not. Nothing here encodes content.
 *
 * Extracted verbatim from the golden reference:
 * src/pages/v9-skin-sandbox.tsx → tab "Layout Primitives".
 */

import type { MaterialLayerConfig } from '@/ui/wanderlust-surface/WanderlustSurface';
import type { MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';

/** Interior surface background inside the frame (the obsidian well). */
export const OBSIDIAN_BG = 'var(--skin-surface-bg)';

/** Frame material of the golden reference. */
export const SURFACE_MATERIAL: MaterialPreset = 'bronze';

/** Material layer config matching the reference (presentation flags only). */
export const SURFACE_MATERIAL_LAYER: MaterialLayerConfig = {
  physicalDepth: true,
  rimLight: true,
  backgroundMode: 'bg',
  microInteraction: false,
  heavyFeel: false,
};
