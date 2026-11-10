import React, { useCallback, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { DirectorPanel, type DirectorAction } from './DirectorPanel';
import type { VillageScreenViewHandle, VillageScreenViewProps } from './VillageScreenView';
import { VillageBuildingLayers, useVillageLayers, villageLayersBaseUrl } from './VillageBuildingLayers';

/**
 * `VillageDirectorView` — the village page on `/game` (2026-11-09 rework).
 *
 * The base is the painting WITHOUT buildings. Each building of the original
 * painting is a fixed layer (`public/assets/village/layers/layers.json`), placed
 * at its exact spot; the DirectorPanel lists them and shows/hides each one in
 * place. Showing every building gives back the original painting pixel for pixel.
 * The free-plot model (`VILLAGE_PLOTS`) is no longer used by this view.
 */
export const VillageDirectorView: React.FC<VillageScreenViewProps> = ({ ref }) => {
  const { t } = useTranslation('idleVillage');
  const manifest = useVillageLayers();
  const [shown, setShown] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setShown((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const actions: DirectorAction[] = (manifest?.layers ?? []).map((ly) => ({
    id: ly.id,
    label: ly.id,
    active: shown.has(ly.id),
    onTrigger: () => toggle(ly.id),
  }));

  React.useImperativeHandle(ref as Ref<VillageScreenViewHandle> | undefined, () => ({
    escape: () => false,
  }), []);

  const baseUrl = villageLayersBaseUrl(manifest);

  return (
    <div
      data-testid="village-director-view"
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--skin-hud-lacquer-deep)' }}
    >
      <div
        data-testid="village-stage"
        style={{ position: 'relative', aspectRatio: '3168 / 1344', width: 'min(100%, calc((100vh - 32px) * 2.3571))', overflow: 'hidden', borderRadius: 'var(--skin-hud-row-radius)' }}
      >
        {baseUrl && (
          <img
            src={baseUrl}
            alt={t('gameFrame.village.ariaLabel')}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', userSelect: 'none' }}
          />
        )}
        <VillageBuildingLayers manifest={manifest} visible={shown} />
      </div>
      <DirectorPanel
        actions={actions}
        onReset={() => setShown(new Set())}
      />
    </div>
  );
};

export default VillageDirectorView;
