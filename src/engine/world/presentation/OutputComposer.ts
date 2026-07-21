import {
  type PresentationOutput,
  type LayerOffset,
} from './types';

/**
 * Compose a base `PresentationOutput` with a list of override objects.
 *
 * This is intentionally simple: shallow object merges, arrays concatenated,
 * scalar values overwritten by the last override that provides them.  No
 * arbitration or priority logic belongs in the foundation implementation.
 */
function mergeLayerOffsets(
  base: Record<string, LayerOffset>,
  override: Record<string, LayerOffset> | undefined,
): Record<string, LayerOffset> {
  if (!override) return base;
  return { ...base, ...override };
}

function mergeLayerScales(
  base: Record<string, number>,
  override: Record<string, number> | undefined,
): Record<string, number> {
  if (!override) return base;
  return { ...base, ...override };
}

function mergeVisualStateOverrides(
  base: PresentationOutput['visualStateOverrides'],
  override: PresentationOutput['visualStateOverrides'] | undefined,
): PresentationOutput['visualStateOverrides'] {
  if (!override || override.length === 0) return base;
  return [...base, ...override];
}

function mergeRuntimeObjects(
  base: PresentationOutput['runtimeObjects'],
  override: PresentationOutput['runtimeObjects'] | undefined,
): PresentationOutput['runtimeObjects'] {
  if (!override || override.length === 0) return base;
  return [...base, ...override];
}

function mergeCamera(
  base: PresentationOutput['camera'],
  override: Partial<PresentationOutput['camera']> | undefined,
): PresentationOutput['camera'] {
  if (!override) return base;
  return { ...base, ...override };
}

/**
 * Merge a single override into a base output.
 */
function mergeOne(base: PresentationOutput, override: Partial<PresentationOutput>): PresentationOutput {
  return {
    activeVisualStateId: override.activeVisualStateId ?? base.activeVisualStateId,
    visualStateOverrides: mergeVisualStateOverrides(base.visualStateOverrides, override.visualStateOverrides),
    runtimeObjects: mergeRuntimeObjects(base.runtimeObjects, override.runtimeObjects),
    camera: mergeCamera(base.camera, override.camera),
    visibleLayerIds: override.visibleLayerIds ?? base.visibleLayerIds,
    layerScales: mergeLayerScales(base.layerScales, override.layerScales),
    layerOffsets: mergeLayerOffsets(base.layerOffsets, override.layerOffsets),
  };
}

/**
 * Compose `base` with every override in order.
 */
export function composeOutput(
  base: PresentationOutput,
  overrides: Array<Partial<PresentationOutput>>,
): PresentationOutput {
  let result: PresentationOutput = base;
  for (const override of overrides) {
    result = mergeOne(result, override);
  }
  return result;
}
