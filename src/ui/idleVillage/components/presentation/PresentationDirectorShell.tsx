import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldPresentationRuntime } from '../../hooks/useWorldPresentationRuntime';
import { WorldSurfaceRenderer } from '../WorldSurfaceRenderer';
import { SkinScope } from '../../skins/primitives/SkinScope';
import { SkinTitle } from '../../skins/primitives/SkinTitle';
import { SkinBadge } from '../../skins/primitives/SkinBadge';
import { ScenarioSelector } from './ScenarioSelector';
import { PlaybackControls } from './PlaybackControls';
import { PRESENTATION_SCENARIOS, getPresentationScenario } from '../../config/presentationConfig';

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

  const scenarioItems = PRESENTATION_SCENARIOS.map((s) => ({ id: s.id, labelKey: s.labelKey }));

  return (
    <SkinScope className="presentation-director-shell flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <SkinTitle level="section">{t('presentation.director.title')}</SkinTitle>
        <SkinBadge data-testid="active-state-badge">
          {output.activeVisualStateId ?? t('presentation.states.unknown')}
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
            <p>{t('presentation.objects')}: {output.runtimeObjects.length}</p>
            <p>{t('presentation.layers')}: {rendererProps.visibleLayerIds?.length ?? 0}</p>
          </section>
        </aside>

        <section className="relative flex-1 overflow-hidden">
          <WorldSurfaceRenderer {...rendererProps} />
        </section>
      </main>
    </SkinScope>
  );
}
