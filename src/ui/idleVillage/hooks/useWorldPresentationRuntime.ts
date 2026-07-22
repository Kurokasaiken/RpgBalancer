import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RuntimeObject } from '../../../engine/world/model/RuntimeObject';
import { buildWorldPresentationModel } from '../../../engine/world/presentation/buildWorldPresentationModel';
import { WorldPresentationRuntime } from '../../../engine/world/presentation/WorldPresentationRuntime';
import type { PresentationOutput } from '../../../engine/world/presentation/types';
import { resolvePresentationEffect } from '../../../engine/world/presentation/config/presentationEffectRegistry';
import type { WorldSurfaceManifest, WorldSurfaceVisualStateOverride } from '../config/worldSurfaceConfig';
import type { PresentationScenario } from '../config/presentationConfig';
import { usePresentationClock } from './usePresentationClock';

interface WorldSurfaceRendererInput {
  manifest: WorldSurfaceManifest;
  camera: { panX: number; panY: number; zoom: number };
  onCameraChange: (camera: { panX: number; panY: number; zoom: number }) => void;
  activeVisualStateId?: string;
  visualStateOverrides?: WorldSurfaceVisualStateOverride[];
  visibleLayerIds?: string[];
  layerScales?: Record<string, number>;
  layerOffsets?: Record<string, { x: number; y: number }>;
  runtimeObjects?: RuntimeObject[];
}

export interface UseWorldPresentationRuntimeResult {
  output: PresentationOutput;
  tick: number;
  interpolation: number;
  isPlaying: boolean;
  seed: number;
  play: () => void;
  pause: () => void;
  step: () => void;
  setSeed: (seed: number) => void;
  setTick: (tick: number) => void;
  rendererProps: WorldSurfaceRendererInput;
}

/**
 * Adapter hook that maps `PresentationOutput` to `WorldSurfaceRenderer` props.
 *
 * Keeps a local camera state so the user can pan/zoom without mutating the
 * presentation runtime or `WorldState`.
 */
export function useWorldPresentationRuntime(scenario: PresentationScenario): UseWorldPresentationRuntimeResult {
  const [seed, setSeed] = useState(scenario.seed);
  const [camera, setCamera] = useState({ panX: 0, panY: 0, zoom: 1 });

  const {
    tick,
    interpolation,
    isPlaying,
    play,
    pause,
    step,
    setTick,
  } = usePresentationClock({ tickIntervalMs: 500, initialTick: 0 });

  const runtime = useMemo(() => {
    const model = buildWorldPresentationModel(scenario.worldState, scenario.rules);
    return new WorldPresentationRuntime({ model, manifest: scenario.manifest });
  }, [scenario]);

  useEffect(() => {
    const effectIds = scenario.effectIds ?? [];
    if (effectIds.length === 0) return undefined;

    const registeredIds: string[] = [];
    for (const effectId of effectIds) {
      const effect = resolvePresentationEffect(effectId);
      if (effect) {
        registeredIds.push(runtime.register(effect));
      }
    }

    return () => {
      for (const id of registeredIds) {
        runtime.unregister(id);
      }
    };
  }, [runtime, scenario.effectIds]);

  const output = useMemo(
    () => runtime.update(tick, seed, { deltaTick: 1, interpolation }),
    [runtime, tick, seed, interpolation],
  );

  // Preserve user pan/zoom while still layering runtime camera output on top.
  const handleCameraChange = useCallback(
    (next: { panX: number; panY: number; zoom: number }) => {
      setCamera({
        panX: next.panX,
        panY: next.panY,
        zoom: next.zoom / output.camera.zoom,
      });
    },
    [output.camera.zoom],
  );

  const rendererCamera = useMemo(
    () => ({
      panX: camera.panX,
      panY: camera.panY,
      zoom: output.camera.zoom * camera.zoom,
    }),
    [camera.panX, camera.panY, output.camera.zoom, camera.zoom],
  );

  const rendererProps: WorldSurfaceRendererInput = useMemo(
    () => ({
      manifest: scenario.manifest,
      camera: rendererCamera,
      onCameraChange: handleCameraChange,
      activeVisualStateId: output.activeVisualStateId,
      visualStateOverrides: output.visualStateOverrides as WorldSurfaceVisualStateOverride[],
      visibleLayerIds: output.visibleLayerIds,
      layerScales: output.layerScales,
      layerOffsets: output.layerOffsets,
      runtimeObjects: output.runtimeObjects,
    }),
    [scenario.manifest, rendererCamera, handleCameraChange, output],
  );

  return {
    output,
    tick,
    interpolation,
    isPlaying,
    seed,
    play,
    pause,
    step,
    setSeed,
    setTick,
    rendererProps,
  };
}
