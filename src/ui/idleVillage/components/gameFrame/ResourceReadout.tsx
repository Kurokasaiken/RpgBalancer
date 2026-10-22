import React from 'react';
import { useTranslation } from 'react-i18next';
import { HUD_TONE_COLOR, type HudTone } from './hudTones';
import { useCompactTop } from './useCompactTop';
import { HudTooltip } from './HudTooltip';
import { useCountUp } from './useCountUp';
import { prefersReducedMotion } from '@/ui/idleVillage/skins/primitives';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

export interface ResourceReadoutItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  /** Capacity, drawn small after the value ("8/20"). */
  max?: number;
  /** One short trend line beside the value, e.g. "−3/d · 2 d" or "+5 incoming". */
  detail?: string;
  /** Colour of the trend line; `danger` also turns the whole tile vermilion. */
  tone?: HudTone;
  /** Full sentence for hover and screen readers. Falls back to `label: value`. */
  description?: string;
}

/**
 * R-260: transient feedback for a settlement-committed grant — published on
 * `useMinimalGameplayStore.resourceDelta` by the report's dismissal, cleared
 * after `hud.resourceDelta.durationMs`. Derived from the frozen plan, never
 * recomputed here.
 */
export interface ResourceReadoutDelta {
  /** Chip rendered inside the tile of the matching item id (e.g. `gold`). */
  chips?: Record<string, number>;
  /** One chip row anchored under the readout — for grants with no tile (XP). */
  tray?: { id: string; label: string; amount: number };
  /** Commit stamp (wall-clock ms) — re-arms the count-up animation. */
  at: number;
}

export interface ResourceReadoutProps {
  items: ResourceReadoutItem[];
  /** The committed-grant stamp — chips + tray animate in, then clear. */
  delta?: ResourceReadoutDelta | null;
}

/** Icon box = twice the control icon token (28 px at the base skin), no new measure. */
const ICON_BOX = 'calc(var(--skin-hud-control-icon-size) * 2)';
/** Value size = name size + inline gap (19 px at the base skin): the number leads the tile. */
const VALUE_SIZE = 'calc(var(--skin-hud-name-size) + var(--skin-hud-inline-gap))';

/**
 * The «+N» grant chip — counts up over `hud.resourceDelta.countUpMs`
 * (instant under reduced-motion). `role="status"` announces the FINAL
 * amount once; the animated digits stay out of the accessibility tree.
 */
const DeltaChip: React.FC<{ id: string; label: string; amount: number; at: number }> = ({ id, label, amount, at }) => {
  const { t } = useTranslation('idleVillage');
  const shown = useCountUp(amount, DEFAULT_GAME_FRAME_CONFIG.hud.resourceDelta.countUpMs, at);
  return (
    <span
      role="status"
      aria-label={t('gameFrame.resources.delta', { label, amount })}
      data-testid={`resource-delta-${id}`}
      style={{
        fontFamily: 'var(--skin-font-display)',
        fontSize: 'var(--skin-hud-caps-size)',
        fontWeight: 'var(--skin-hud-caps-weight)',
        letterSpacing: 'var(--skin-hud-caps-tracking)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        color: HUD_TONE_COLOR.good,
        animation: prefersReducedMotion() ? undefined : 'resourceDeltaIn 260ms ease-out both',
      }}
    >
      <span aria-hidden="true">+{shown}</span>
    </span>
  );
};

/**
 * Resource readout — content for the top-right plaque.
 *
 * Each resource is one tile cut like a Roster row: icon attached to the number, trend
 * beside it, caps label underneath. A critical stock lights an ember border and glow on the dark
 * tile and tints its label: it reads at a glance without turning the tile into a solid block. The plaque is `HudPlaque`; this carries no surface of its own beyond the tiles.
 *
 * `icon` is expected to already be a self-labelling node (e.g. `HudGlyph`); it is sized to
 * fill `ICON_BOX`.
 */
export const ResourceReadout: React.FC<ResourceReadoutProps> = ({ items, delta }) => {
  const compact = useCompactTop();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--skin-hud-bar-gap)' }}>
      <style>{`@keyframes resourceDeltaIn { from { transform: translateY(4px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--skin-hud-control-gap)' }}>
      {items.map((item) => {
        const description = item.description ?? `${item.label}: ${item.value}`;
        const critical = item.tone === 'danger';
        return (
          <HudTooltip key={item.id} label={item.label} hint={description !== item.label ? description : undefined}>
            <div
              role="group"
              aria-label={description}
              data-tone={item.tone}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--skin-hud-bar-gap)',
                minWidth: 0,
                padding: 'var(--skin-hud-row-padding)',
                borderRadius: 'var(--skin-hud-row-radius)',
                /* HUD-1 = A (R-234): a critical stock is an EMBER on the dark tile — danger on the
                 *  border and a glow, ink untouched — not a solid vermilion block. */
                border: `${critical ? 1.5 : 1}px solid ${critical ? HUD_TONE_COLOR.danger : 'var(--skin-hud-row-filet)'}`,
                background: 'var(--skin-surface-bg)',
                color: 'var(--skin-text-primary)',
                boxShadow: critical ? `inset 0 0 0 1px ${HUD_TONE_COLOR.danger}, 0 0 10px ${HUD_TONE_COLOR.danger}` : undefined,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)' }}>
                <span
                  style={{ display: 'flex', flexShrink: 0, width: ICON_BOX, height: ICON_BOX }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: VALUE_SIZE,
                    fontWeight: 'var(--skin-hud-name-weight)',
                    letterSpacing: 'var(--skin-hud-name-tracking)',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    textShadow: 'var(--skin-hud-engrave)',
                  }}
                >
                  {item.value}
                  {item.max !== undefined && (
                    <span
                      style={{
                        fontSize: 'var(--skin-hud-caps-size)',
                        fontWeight: 'var(--skin-hud-caps-weight)',
                        marginLeft: 'var(--skin-hud-control-gap)',
                      }}
                    >
                      /{item.max}
                    </span>
                  )}
                </span>
                {item.detail && !compact && (
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: 'var(--skin-font-body, inherit)',
                      fontSize: 'var(--skin-hud-caps-size)',
                      fontWeight: 'var(--skin-hud-caps-weight)',
                      letterSpacing: 'var(--skin-hud-caps-tracking)',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                      color: item.tone ? HUD_TONE_COLOR[item.tone] : 'var(--skin-label-tertiary)',
                    }}
                  >
                    {item.detail}
                  </span>
                )}
                {/* R-260: the committed grant on this tile — counts up while
                    the store's stamp lives. */}
                {delta?.chips?.[item.id] != null && delta.chips[item.id]! > 0 && (
                  <DeltaChip id={item.id} label={item.label} amount={delta.chips[item.id]!} at={delta.at} />
                )}
              </span>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--skin-font-display)',
                  fontSize: 'var(--skin-hud-caps-size)',
                  fontWeight: 'var(--skin-hud-caps-weight)',
                  letterSpacing: 'var(--skin-hud-caps-tracking)',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  color: critical ? HUD_TONE_COLOR.danger : 'var(--skin-label-primary)',
                }}
              >
                {item.label}
              </span>
            </div>
          </HudTooltip>
        );
      })}
      </div>
      {/* R-260: grants with no tile (village XP) anchor as one chip row
          under the readout — inside the plaque's flow so nothing clips. */}
      {delta?.tray && delta.tray.amount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <DeltaChip id={delta.tray.id} label={delta.tray.label} amount={delta.tray.amount} at={delta.at} />
        </div>
      )}
    </div>
  );
};

export default ResourceReadout;
