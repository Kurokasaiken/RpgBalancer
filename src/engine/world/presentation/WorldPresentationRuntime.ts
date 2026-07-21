import { createPresentationRandom } from './PresentationRandom';
import { composeOutput } from './OutputComposer';
import {
  type PresentationContext,
  type PresentationEffect,
  type PresentationManifest,
  type PresentationOutput,
  type WorldPresentationModel,
  PresentationOutputSchema,
} from './types';

function createBaseOutput(
  model: WorldPresentationModel,
  manifest: PresentationManifest,
): PresentationOutput {
  const stateIds = model.activeStateIds;
  const visualStateMap = new Map(manifest.visualStates.map((s) => [s.id, s]));

  let activeVisualStateId = stateIds.find((id) => visualStateMap.has(id));
  if (!activeVisualStateId) {
    activeVisualStateId = manifest.visualStates.find((s) => s.base)?.id ?? manifest.visualStates[0]?.id;
  }

  const allLayers = [
    ...(manifest.surfaceLayers ?? []),
    ...(manifest.atmosphereLayers ?? []),
  ];

  return {
    activeVisualStateId,
    visualStateOverrides: [],
    runtimeObjects: model.runtimeObjects,
    camera: {
      panX: 0,
      panY: 0,
      zoom: manifest.camera?.defaultZoom ?? 1,
    },
    visibleLayerIds: allLayers.map((layer) => layer.id),
    layerScales: {},
    layerOffsets: {},
  };
}

function createContext(
  model: WorldPresentationModel,
  manifest: PresentationManifest,
  tick: number,
  deltaTick: number,
  interpolation: number,
  seed: number,
): PresentationContext {
  return {
    model,
    manifest,
    tick,
    deltaTick,
    interpolation,
    random: createPresentationRandom(seed),
  };
}

export interface WorldPresentationRuntimeOptions {
  model: WorldPresentationModel;
  manifest: PresentationManifest;
}

/**
 * Deterministic runtime that converts a `WorldPresentationModel` into a
 * JSON-serializable `PresentationOutput`.  Effects are pure and read-only;
 * `WorldState` is never mutated.
 */
export class WorldPresentationRuntime {
  private readonly model: WorldPresentationModel;

  private readonly manifest: PresentationManifest;

  private readonly effects = new Map<string, PresentationEffect>();

  private effectCounter = 0;

  constructor({ model, manifest }: WorldPresentationRuntimeOptions) {
    this.model = model;
    this.manifest = manifest;
  }

  /**
   * Register an effect and return its stable id.
   */
  register(effect: PresentationEffect): string {
    const id = effect.id ?? `presentation-effect-${(this.effectCounter += 1)}`;
    this.effects.set(id, effect);
    return id;
  }

  /**
   * Remove an effect by id.
   */
  unregister(id: string): void {
    this.effects.delete(id);
  }

  /**
   * Produce a deterministic `PresentationOutput` for the given tick and seed.
   */
  update(
    tick: number,
    seed: number,
    options: { deltaTick?: number; interpolation?: number } = {},
  ): PresentationOutput {
    const deltaTick = options.deltaTick ?? 1;
    const interpolation = Math.max(0, Math.min(1, options.interpolation ?? 1));

    const context = createContext(
      this.model,
      this.manifest,
      tick,
      deltaTick,
      interpolation,
      seed,
    );

    const base = createBaseOutput(this.model, this.manifest);
    const overrides: Array<Partial<PresentationOutput>> = [];

    for (const effect of this.effects.values()) {
      if (effect.enabled && !effect.enabled(context)) {
        continue;
      }
      overrides.push(effect.update(context));
    }

    const output = composeOutput(base, overrides);
    return PresentationOutputSchema.parse(output);
  }
}
