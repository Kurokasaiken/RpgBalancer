import React from 'react';
import { HUD_TONE_COLOR, type HudTone } from './hudTones';
import { useCompactTop } from './useCompactTop';

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

export interface ResourceReadoutProps {
  items: ResourceReadoutItem[];
}

/** Icon box = twice the control icon token (28 px at the base skin), no new measure. */
const ICON_BOX = 'calc(var(--skin-hud-control-icon-size) * 2)';
/** Value size = name size + inline gap (19 px at the base skin): the number leads the tile. */
const VALUE_SIZE = 'calc(var(--skin-hud-name-size) + var(--skin-hud-inline-gap))';

/**
 * Resource readout — content for the top-right plaque.
 *
 * Each resource is one tile cut like a Roster row: icon attached to the number, trend
 * beside it, caps label underneath. A critical stock turns the whole tile vermilion with
 * dark ink, not just its text: it has to read at a glance and without relying on colour of
 * text alone. The plaque is `HudPlaque`; this carries no surface of its own beyond the tiles.
 *
 * `icon` is expected to already be a self-labelling node (e.g. `HudGlyph`); it is sized to
 * fill `ICON_BOX`.
 */
export const ResourceReadout: React.FC<ResourceReadoutProps> = ({ items }) => {
  const compact = useCompactTop();
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--skin-hud-control-gap)' }}>
      {items.map((item) => {
        const description = item.description ?? `${item.label}: ${item.value}`;
        const critical = item.tone === 'danger';
        return (
          <div
            key={item.id}
            role="group"
            aria-label={description}
            title={description}
            data-tone={item.tone}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--skin-hud-bar-gap)',
              minWidth: 0,
              padding: 'var(--skin-hud-row-padding)',
              borderRadius: 'var(--skin-hud-row-radius)',
              border: `1px solid ${critical ? HUD_TONE_COLOR.danger : 'var(--skin-hud-row-filet)'}`,
              background: critical ? HUD_TONE_COLOR.danger : 'var(--skin-surface-bg)',
              color: critical ? 'var(--skin-hud-seat)' : 'var(--skin-text-primary)',
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
                  textShadow: critical ? 'none' : 'var(--skin-hud-engrave)',
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
                    color: critical ? 'inherit' : item.tone ? HUD_TONE_COLOR[item.tone] : 'var(--skin-label-tertiary)',
                  }}
                >
                  {item.detail}
                </span>
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
                color: critical ? 'inherit' : 'var(--skin-label-primary)',
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ResourceReadout;
