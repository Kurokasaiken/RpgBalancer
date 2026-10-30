import React, { useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import {
  VILLAGE_DIRECTOR_ASSETS,
  VILLAGE_PLOTS,
  VILLAGE_PLOT_TYPES,
  type VillagePlotType,
} from '@/ui/idleVillage/config/villageDirectorConfig';
import { DirectorPanel, type DirectorAction } from './DirectorPanel';
import type { VillageScreenViewHandle, VillageScreenViewProps } from './VillageScreenView';

/**
 * `VillageDirectorView` — town-center staging tool (Director ruling 2026-10-30,
 * modello B): the empty base plate + FREE PLOTS. Every plot is a dashed
 * footprint ellipse; click it, then pick a building type in the DirectorPanel —
 * any type fits any plot. Click again on an occupied plot to clear it.
 * Sprites come from `VILLAGE_DIRECTOR_ASSETS` (cottage stand-in until the
 * per-type battery lands). No pins, no tooltips — only plate + HUD + panel.
 */
export const VillageDirectorView: React.FC<VillageScreenViewProps> = ({ ref }) => {
  const { t } = useTranslation('idleVillage');
  const [assignments, setAssignments] = useState<Partial<Record<string, VillagePlotType>>>({});
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

  const onPlotClick = (id: string) => {
    if (assignments[id]) {
      setAssignments((cur) => { const next = { ...cur }; delete next[id]; return next; });
    } else {
      setSelectedPlot(id);
    }
  };

  const actions: DirectorAction[] = selectedPlot
    ? [
        ...VILLAGE_PLOT_TYPES.map((type) => ({
          id: `${selectedPlot}:${type}`,
          label: type,
          active: assignments[selectedPlot] === type,
          onTrigger: () => setAssignments((cur) => ({ ...cur, [selectedPlot]: type })),
        })),
        {
          id: `${selectedPlot}:deselect`,
          label: t('gameFrame.director.deselect', '— deseleziona'),
          onTrigger: () => setSelectedPlot(null),
        },
      ]
    : VILLAGE_PLOTS.map((p) => ({
        id: p.id,
        label: `${p.id} · ${t('gameFrame.director.selectPlot', 'seleziona sul dipinto')}`,
        onTrigger: () => setSelectedPlot(p.id),
      }));

  React.useImperativeHandle(ref as Ref<VillageScreenViewHandle> | undefined, () => ({
    escape: () => { if (selectedPlot) { setSelectedPlot(null); return true; } return false; },
  }), [selectedPlot]);

  return (
    <div
      data-testid="village-director-view"
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--skin-hud-lacquer-deep)' }}
    >
      <div
        data-testid="village-stage"
        style={{ position: 'relative', aspectRatio: '3168 / 1344', width: 'min(100%, calc((100vh - 32px) * 2.3571))', overflow: 'hidden', borderRadius: 'var(--skin-hud-row-radius)' }}
      >
        <img
          src={VILLAGE_DIRECTOR_ASSETS.basePlate}
          alt={t('gameFrame.village.ariaLabel')}
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', userSelect: 'none' }}
        />
        {/* building sprites occupanti */}
        {VILLAGE_PLOTS.map((p) =>
          assignments[p.id] ? (
            <img
              key={`b-${p.id}`}
              src={VILLAGE_DIRECTOR_ASSETS.sprites[assignments[p.id]!] ?? VILLAGE_DIRECTOR_ASSETS.defaultSprite}
              alt="" aria-hidden="true" draggable={false}
              style={{
                position: 'absolute',
                left: `${(p.x - p.rx) * 100}%`, top: `${(p.y - p.ry * 2.4) * 100}%`,
                width: `${p.rx * 2 * 100}%`, height: `${p.ry * 2.4 * 100}%`,
                objectFit: 'contain', objectPosition: 'bottom',
                userSelect: 'none', pointerEvents: 'none',
              }}
            />
          ) : null,
        )}
        {/* piazzole cliccabili */}
        {VILLAGE_PLOTS.map((p) => (
          <button
            key={p.id}
            type="button"
            data-plot={p.id}
            aria-label={`plot ${p.id}`}
            onClick={() => onPlotClick(p.id)}
            style={{
              position: 'absolute',
              left: `${(p.x - p.rx) * 100}%`, top: `${(p.y - p.ry) * 100}%`,
              width: `${p.rx * 2 * 100}%`, height: `${p.ry * 2 * 100}%`,
              borderRadius: '50%',
              border: `2px dashed ${selectedPlot === p.id ? 'var(--skin-hud-brass-hi)' : 'rgba(255,235,190,0.55)'}`,
              background: assignments[p.id]
                ? 'transparent'
                : selectedPlot === p.id ? 'rgba(224,169,78,0.18)' : 'rgba(224,169,78,0.07)',
              cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,235,190,0.75)', fontSize: 11, fontWeight: 600,
            }}
          >
            {assignments[p.id] ? '' : p.id}
          </button>
        ))}
      </div>
      <DirectorPanel
        actions={actions}
        onReset={() => { setAssignments({}); setSelectedPlot(null); }}
      />
    </div>
  );
};

export default VillageDirectorView;
