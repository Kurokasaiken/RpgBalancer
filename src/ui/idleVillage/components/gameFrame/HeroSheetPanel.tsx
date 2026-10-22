import React, { type CSSProperties, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import StatIcon from '@/ui/idleVillage/icons/statIcons';
import { EngravedIcon } from './engravedIcons';
import { useHudPanelDrag } from './useHudPanelDrag';
import type { HeroSheetViewModel } from './heroSheetViewModel';

/**
 * HeroSheetPanel — the read-only hero sheet of PLAN-032 SP-1 (artifact r003).
 *
 * A `HudPlaque` singleton the controller (`useHeroSheet`) anchors rail-adjacent
 * to the roster card under the pointer. Dumb by contract: every value on screen
 * arrives pre-derived through `vm` (`heroSheetViewModel`), so a retarget swaps a
 * prop and never re-runs domain logic. Draggable by the title row via
 * `useHudPanelDrag`; the machine, not this component, decides open/close/pin.
 */
export interface HeroSheetPanelProps {
  vm: HeroSheetViewModel;
  /** Anchored position (base anchor + any session offset the controller restored). */
  left: number;
  top: number;
  widthPx: number;
  zIndex: number;
  pinned: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePin: () => void;
  onClose: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  panelRef: Ref<HTMLDivElement>;
}

/** FAM-1 = A (R-234): the family has no cyan/green/red as MEANING — a category reads from its glyph
 *  and its label, all in brass. (It used to paint offense red, defense cyan, utility green.) */
const CATEGORY_TONE: Record<string, string> = {
  offense: 'var(--skin-label-primary)',
  defense: 'var(--skin-label-primary)',
  utility: 'var(--skin-label-primary)',
};

const STATUS_TONE: Record<HeroSheetViewModel['status'], string> = {
  alive: 'var(--skin-title-color)',
  injured: 'var(--skin-event-danger)',
  dead: 'var(--skin-state-fallen)',
};

const controlButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  minHeight: 24,
  padding: 0,
};

export const HeroSheetPanel: React.FC<HeroSheetPanelProps> = ({
  vm,
  left,
  top,
  widthPx,
  zIndex,
  pinned,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onTogglePin,
  onClose,
  onPointerEnter,
  onPointerLeave,
  panelRef,
}) => {
  const { t } = useTranslation('idleVillage');
  const { panelStyle, handleProps } = useHudPanelDrag();

  return (
    <div
      ref={panelRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{ position: 'fixed', left, top, width: widthPx, zIndex: panelStyle.zIndex ?? zIndex, pointerEvents: 'auto', ...panelStyle }}
    >
      <SkinScope data-hud-controls="">
        <HudPlaque shape="panel" as="section" role="region" aria-label={vm.name} id="hero-sheet" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--skin-hud-panel-padding)', gap: 'var(--skin-hud-stack-gap)' }}>
          {/* One-shot polite announcement on retarget: the name is the whole cue. */}
          <span key={vm.residentId} aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
            {vm.name}
          </span>

          {/* ── Title row: name + status left, controls right. Drag handle. ── */}
          <div {...handleProps} style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', ...handleProps.style }}>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                font: 'var(--skin-hud-name-weight) var(--skin-hud-name-size) var(--skin-font-display)',
                letterSpacing: 'var(--skin-hud-name-tracking)',
                color: 'var(--skin-title-color)',
                textShadow: 'var(--skin-hud-engrave)',
              }}
            >
              {vm.name}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
                letterSpacing: 'var(--skin-hud-caps-tracking)',
                textTransform: 'uppercase',
                color: STATUS_TONE[vm.status],
                whiteSpace: 'nowrap',
              }}
            >
              {vm.status !== 'alive' && <EngravedIcon id={vm.status === 'dead' ? 'status-fallen' : 'status-wound'} size={12} />}
              {vm.statusLabel}
            </span>
            <button type="button" aria-label={t('gameFrame.heroSheet.prev')} aria-disabled={!canPrev || pinned} disabled={!canPrev || pinned} onClick={onPrev} style={controlButton}>
              <EngravedIcon id="cmd-chevron-left" size={14} />
            </button>
            <button type="button" aria-label={pinned ? t('gameFrame.heroSheet.unpin') : t('gameFrame.heroSheet.pin')} aria-pressed={pinned} onClick={onTogglePin} style={controlButton}>
              <EngravedIcon id="cmd-pin" size={14} />
            </button>
            <button type="button" aria-label={t('gameFrame.heroSheet.next')} aria-disabled={!canNext || pinned} disabled={!canNext || pinned} onClick={onNext} style={controlButton}>
              <EngravedIcon id="cmd-chevron-right" size={14} />
            </button>
            <button type="button" data-skin="close" aria-label={t('gameFrame.panels.close')} onClick={onClose} style={controlButton}>
              <EngravedIcon id="cmd-close" size={14} />
            </button>
          </div>

          {/* ── Identity: portrait, archetype, vitals with numbers. ── */}
          <div style={{ display: 'flex', gap: 'var(--skin-hud-inline-gap)', alignItems: 'flex-start' }}>
            <div
              aria-hidden="true"
              style={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: 'var(--skin-hud-row-radius)',
                border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)',
                background: 'var(--skin-hud-lacquer-deep)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                font: 'var(--skin-hud-name-weight) 20px var(--skin-font-display)',
                color: 'var(--skin-title-color)',
              }}
            >
              {vm.portraitUrl ? <img src={vm.portraitUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : vm.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--skin-hud-row-gap)' }}>
              {vm.archetypeLabel && (
                <span style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
                  {vm.archetypeLabel}
                  {vm.archetypeCategory ? ` · ${vm.archetypeCategory}` : ''}
                </span>
              )}
              {vm.vitals.map((vital) => (
                <div key={vital.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-bar-gap)' }}>
                  <span style={{ width: 34, font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', textTransform: 'uppercase', color: 'var(--skin-label-primary)' }}>
                    {vital.label}
                  </span>
                  <span
                    role="progressbar"
                    aria-label={vital.label}
                    aria-valuemin={0}
                    aria-valuemax={vital.max}
                    aria-valuenow={vital.value}
                    style={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 85%, transparent)', border: '1px solid color-mix(in srgb, var(--skin-surface-border) 45%, transparent)' }}
                  >
                    <span
                      style={{
                        display: 'block',
                        height: '100%',
                        width: `${Math.round(vital.ratio * 100)}%`,
                        background: vital.key === 'hp' ? STATUS_TONE[vm.status] : 'var(--skin-label-primary)',
                        transition: 'width 240ms ease-out',
                      }}
                    />
                  </span>
                  <span style={{ minWidth: 44, textAlign: 'right', font: '600 12px var(--skin-font-serif)', color: 'var(--skin-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(vital.value)}/{vital.max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Statistics: same descriptor-gated set as the fullscreen sheet. ── */}
          {vm.stats.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--skin-hud-stack-gap)' }}>
              {vm.stats.map(({ category, label, entries }) => (
                <div key={category}>
                  <div
                    style={{
                      font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
                      letterSpacing: 'var(--skin-hud-caps-tracking)',
                      textTransform: 'uppercase',
                      color: CATEGORY_TONE[category] ?? 'var(--skin-label-primary)',
                      paddingBottom: 3,
                      marginBottom: 'var(--skin-hud-row-gap)',
                      borderBottom: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)',
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--skin-hud-row-gap) var(--skin-hud-row-column-gap)' }}>
                    {entries.map((entry) => (
                      <div key={entry.label} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                        {entry.iconType && <StatIcon type={entry.iconType} size={12} filled style={{ color: CATEGORY_TONE[category] ?? 'var(--skin-label-primary)', flexShrink: 0 }} />}
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: '12px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>
                          {entry.label}
                        </span>
                        <span style={{ font: '600 12px var(--skin-font-serif)', color: CATEGORY_TONE[category] ?? 'var(--skin-text-primary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {entry.display}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Loadout + inventory: compact, populated entries only for loadout. ── */}
          {(vm.equipment.some((slot) => slot.value) || vm.inventory.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--skin-hud-row-column-gap)', borderTop: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)', paddingTop: 'var(--skin-hud-stack-gap)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', textTransform: 'uppercase', color: 'var(--skin-label-primary)' }}>
                  {t('gameFrame.heroSheet.loadout')}
                </span>
                {vm.equipment.filter((slot) => slot.value).map((slot) => (
                  <div key={slot.id} style={{ display: 'flex', gap: 6, font: '12px var(--skin-font-serif)', minWidth: 0 }}>
                    <span style={{ color: 'var(--skin-text-muted)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{slot.label}</span>
                    <span style={{ color: 'var(--skin-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)', letterSpacing: 'var(--skin-hud-caps-tracking)', textTransform: 'uppercase', color: 'var(--skin-label-primary)' }}>
                  {t('gameFrame.heroSheet.inventory')}
                </span>
                {vm.inventory.length > 0 ? (
                  vm.inventory.map((token) => (
                    <span key={token} style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-body-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {token}
                    </span>
                  ))
                ) : (
                  <span style={{ font: '12px var(--skin-font-serif)', color: 'var(--skin-text-muted)' }}>{t('gameFrame.heroSheet.inventoryEmpty')}</span>
                )}
              </div>
            </div>
          )}
        </HudPlaque>
      </SkinScope>
    </div>
  );
};

export default HeroSheetPanel;
