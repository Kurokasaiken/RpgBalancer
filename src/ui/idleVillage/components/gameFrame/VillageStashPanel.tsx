import React, { type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { EngravedIcon } from './engravedIcons';
import { useHudPanelDrag } from './useHudPanelDrag';
import { villageStashViewModel } from './villageStashViewModel';
import { VillageStashItemIcon } from './villageStashItemIcons';
import type { VillageStashConfig } from '@/balancing/config/idleVillage/villageStashConfig';

/**
 * VillageStashPanel — the village warehouse's mock stock (PLAN-032 SP-2,
 * artifact r003).
 *
 * A modeless `HudPlaque` opened from the building POI on the map or the Panels
 * menu (`v` / menu toggle). Read-only by contract: rows are a plain
 * `role="list"` — no use/move/discard affordances and nothing focusable inside
 * a row, because there is no inventory system behind this screen. The panel
 * coexists with the quest detail and drags by its title row via
 * `useHudPanelDrag`.
 */
export interface VillageStashPanelProps {
  config: VillageStashConfig;
  /** Anchored position in the free corridor (page-level geometry). */
  left: number;
  top: number;
  widthPx: number;
  zIndex: number;
  onClose: () => void;
}

const titleId = 'village-stash-panel-title';

const controlButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  minHeight: 24,
  padding: 0,
};

export const VillageStashPanel: React.FC<VillageStashPanelProps> = ({ config, left, top, widthPx, zIndex, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const { panelStyle, handleProps } = useHudPanelDrag();
  const vm = villageStashViewModel(config);

  return (
    <div
      data-hud-panel="villageStash"
      tabIndex={-1}
      style={{
        position: 'fixed',
        left,
        top,
        width: widthPx,
        zIndex: panelStyle.zIndex ?? zIndex,
        pointerEvents: 'auto',
        outline: 'none',
        ...panelStyle,
      }}
    >
      <SkinScope data-hud-controls="">
        <HudPlaque
          shape="panel"
          as="section"
          aria-labelledby={titleId}
          style={{ display: 'flex', flexDirection: 'column', padding: 'var(--skin-hud-panel-padding)', gap: 'var(--skin-hud-stack-gap)' }}
        >
          {/* Title row: building name left, X right. Drag handle. */}
          <div {...handleProps} style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', ...handleProps.style }}>
            <span
              id={titleId}
              style={{
                flex: 1,
                minWidth: 0,
                font: 'var(--skin-hud-name-weight) var(--skin-hud-name-size) var(--skin-font-display)',
                letterSpacing: 'var(--skin-hud-name-tracking)',
                color: 'var(--skin-title-color)',
                textShadow: 'var(--skin-hud-engrave)',
              }}
            >
              {t('gameFrame.stash.title')}
            </span>
            <button type="button" data-skin="close" aria-label={t('gameFrame.panels.close')} onClick={onClose} style={controlButton}>
              <EngravedIcon id="cmd-close" size={14} />
            </button>
          </div>

          {/* Stock: a plain list — rows never carry controls. */}
          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--skin-hud-stack-gap)' }}>
            {vm.rows.map((row) => (
              <div key={row.itemId} role="listitem" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--skin-hud-inline-gap)', minWidth: 0 }}>
                <span aria-hidden="true" style={{ color: 'var(--skin-icon-accent)', display: 'inline-flex', alignItems: 'center', paddingTop: 1 }}>
                  <VillageStashItemIcon icon={row.icon} size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ font: '600 12px var(--skin-font-sans)', color: 'var(--skin-text-primary)' }}>
                    {t(row.nameKey)}
                    <span style={{ color: 'var(--skin-icon-accent)', fontVariantNumeric: 'tabular-nums' }} aria-label={t('gameFrame.stash.qty', { qty: row.qty })}>
                      {' '}×{row.qty}
                    </span>
                  </span>
                  <span style={{ font: '12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                    {t(row.descKey)}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Footer: the capacity label is a display-only count, derived from sum(qty). */}
          <div
            style={{
              borderTop: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)',
              paddingTop: 'var(--skin-hud-stack-gap)',
              font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
              letterSpacing: 'var(--skin-hud-caps-tracking)',
              textTransform: 'uppercase',
              color: 'var(--skin-label-primary)',
            }}
          >
            {t('gameFrame.stash.capacity', { count: vm.storedCount, max: vm.capacityMax })}
          </div>
        </HudPlaque>
      </SkinScope>
    </div>
  );
};

export default VillageStashPanel;
