import { z } from 'zod';

/**
 * Contract for the World Surface debug panel.
 *
 * The panel receives a snapshot of runtime state without coupling to the
 * renderer internals.
 */

export const WorldSurfaceDebugContractSchema = z.object({
  /** Current camera state exposed by the loader. */
  camera: z.object({
    panX: z.number(),
    panY: z.number(),
    zoom: z.number(),
  }),
  /** Id of the visual state currently active. */
  activeVisualStateId: z.string(),
  /** Visible layer ids. */
  visibleLayerIds: z.array(z.string()),
  /** Regions under the current mouse world coordinate. */
  hoveredRegions: z.array(z.string()),
  /** World coordinate of the mouse pointer. */
  mouseWorld: z.object({
    x: z.number(),
    y: z.number(),
  }),
  /** Manifest metadata. */
  manifest: z.object({
    world: z.string(),
    variant: z.string(),
    canvasWidth: z.number(),
    canvasHeight: z.number(),
  }),
});

export type WorldSurfaceDebugContract = z.infer<
  typeof WorldSurfaceDebugContractSchema
>;
