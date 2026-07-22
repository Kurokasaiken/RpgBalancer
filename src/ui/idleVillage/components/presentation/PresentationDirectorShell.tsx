import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldPresentationRuntime } from '../../hooks/useWorldPresentationRuntime';
import { WorldSurfaceRenderer } from '../WorldSurfaceRenderer';
import { SkinScope } from '../../skins/primitives/SkinScope';
import { SkinTitle } from '../../skins/primitives/SkinTitle';
import { SkinBadge } from '../../skins/primitives/SkinBadge';
import { ScenarioSelector } from './ScenarioSelector';
import { PlaybackControls } from './PlaybackControls';
import { PRESENTATION_SCENARIOS, getPresentationScenario } from '../../config/presentationConfig';
import type { WorldSurfaceLayer } from '../../config/worldSurfaceConfig';

/**
 * Minimal sandbox director shell: scenario selector, playback controls, and
 * the world surface viewport.  The runtime produces deterministic output; the
 * shell only reads it.
 */
export function PresentationDirectorShell() {
  const { t } = useTranslation('idleVillage');
  const [scenarioId, setScenarioId] = useState<string>('peaceful');

  const scenario = getPresentationScenario(scenarioId) ?? PRESENTATION_SCENARIOS[0];
  const { output, tick, isPlaying, seed, play, pause, step, setSeed, setTick, rendererProps } =
    useWorldPresentationRuntime(scenario);

  const allLayers = useMemo<WorldSurfaceLayer[]>(
    () =>
      [...scenario.manifest.surfaceLayers, ...scenario.manifest.atmosphereLayers].sort(
        (a, b) => a.zIndex - b.zIndex,
      ),
    [scenario],
  );

  const [surfaceLayerOrder, setSurfaceLayerOrder] = useState<string[] | undefined>(undefined);

  const orderedLayerIds = useMemo(
    () => surfaceLayerOrder ?? allLayers.map((layer) => layer.id),
    [surfaceLayerOrder, allLayers],
  );

  const orderedLayers = useMemo(() => {
    const byId = new Map(allLayers.map((layer) => [layer.id, layer]));
    return orderedLayerIds
      .map((id) => byId.get(id))
      .filter((layer): layer is WorldSurfaceLayer => layer !== undefined);
  }, [orderedLayerIds, allLayers]);

  const moveLayer = useCallback(
    (layerId: string, direction: 'up' | 'down') => {
      setSurfaceLayerOrder((prev) => {
        const current = prev ?? allLayers.map((layer) => layer.id);
        const index = current.indexOf(layerId);
        if (index === -1) return prev;

        const newIndex =
          direction === 'up'
            ? Math.max(0, index - 1)
            : Math.min(current.length - 1, index + 1);
        if (newIndex === index) return prev;

        const next = [...current];
        const [moved] = next.splice(index, 1);
        next.splice(newIndex, 0, moved);
        return next;
      });
    },
    [allLayers],
  );

  const scenarioItems = PRESENTATION_SCENARIOS.map((s) => ({ id: s.id, labelKey: s.labelKey }));

  return (
    <SkinScope className="presentation-director-shell flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <SkinTitle level="section">{t('idleVillage:presentation.director.title')}</SkinTitle>
        <SkinBadge data-testid="active-state-badge">
          {output.activeVisualStateId ?? t('idleVillage:presentation.states.unknown')}
        </SkinBadge>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 space-y-6 overflow-y-auto border-r border-white/10 p-4">
          <ScenarioSelector
            scenarios={scenarioItems}
            activeId={scenario.id}
            onSelect={setScenarioId}
          />
          <PlaybackControls
            isPlaying={isPlaying}
            tick={tick}
            seed={seed}
            onPlay={play}
            onPause={pause}
            onStep={step}
            onSeedChange={setSeed}
            onTickChange={setTick}
          />
          <section className="space-y-2 text-xs text-slate-400">
            <p>{t('idleVillage:presentation.objects')}: {output.runtimeObjects.length}</p>
            <p>{t('idleVillage:presentation.layers')}: {rendererProps.visibleLayerIds?.length ?? 0}</p>
          </section>

          <SkinScope className="rounded border border-white/10 bg-slate-900/50 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-200">
              {t('idleVillage:presentation.inspector.title')}
            </h3>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>
                {t('idleVillage:presentation.inspector.activeState')}:{' '}
                <SkinBadge data-testid="inspector-active-state">
                  {output.activeVisualStateId ?? t('idleVillage:presentation.states.unknown')}
                </SkinBadge>
              </p>
              <p data-testid="inspector-objects">
                {t('idleVillage:presentation.inspector.runtimeObjects')}: {output.runtimeObjects.length}
              </p>
              <p data-testid="inspector-overrides">
                {t('idleVillage:presentation.inspector.visualStateOverrides')}: {output.visualStateOverrides.length}
              </p>
              <p data-testid="inspector-tick">
                {t('idleVillage:presentation.inspector.tick')}: {tick}
              </p>
            </div>
          </SkinScope>

          <SkinScope className="rounded border border-white/10 bg-slate-900/50 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-200">
              {t('idleVillage:presentation.layerOrder.title')}
            </h3>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {orderedLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between rounded bg-slate-800/50 px-2 py-1 text-xs text-slate-200"
                >
                  <span className="truncate">{layer.id}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveLayer(layer.id, 'up')}
                      className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-700 hover:text-amber-200"
                      aria-label={`${layer.id} ${t('idleVillage:presentation.layerOrder.moveUp')}`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLayer(layer.id, 'down')}
                      className="rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-700 hover:text-amber-200"
                      aria-label={`${layer.id} ${t('idleVillage:presentation.layerOrder.moveDown')}`}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SkinScope>
        </aside>

        <section className="relative flex-1 overflow-hidden">
          <WorldSurfaceRenderer {...rendererProps} surfaceLayerOrder={surfaceLayerOrder} />
        </section>
      </main>
    </SkinScope>
  );
}
