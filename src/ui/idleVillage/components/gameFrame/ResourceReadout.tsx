import React from 'react';
import { MatericField, MatericFieldGroup } from '@/ui/designSystem/primitives';
import { HUD_TONE_COLOR, type HudTone } from './hudTones';

export interface ResourceReadoutItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  /** Capacity, drawn small after the value ("8/20"). */
  max?: number;
  /** One short trend line under the value, e.g. "−3/d · 2 d" or "+5 incoming". */
  detail?: string;
  /** Colour of the trend line; only set it when the trend needs attention. */
  tone?: HudTone;
  /** Full sentence for hover and screen readers. Falls back to `label: value`. */
  description?: string;
}

export interface ResourceReadoutProps {
  items: ResourceReadoutItem[];
}

/**
 * Resource readout — content for the top-right ribbon.
 *
 * It carries no surface of its own: `HudRibbon` is the surface. Each resource shows
 * its amount and, under it, where it is heading (consumption, autonomy, income in
 * progress): a management HUD that only shows totals tells the player nothing about
 * the next decision.
 *
 * `icon` is expected to already be a self-labelling node (e.g. `HudGlyph`).
 */
export const ResourceReadout: React.FC<ResourceReadoutProps> = ({ items }) => (
  <MatericFieldGroup layout="columns" density="compact" separators>
    {items.map((item) => {
      const description = item.description ?? `${item.label}: ${item.value}`;
      return (
        <div key={item.id} role="group" aria-label={description} title={description} style={{ minWidth: 0 }}>
          <MatericField
            tier="tertiary"
            orientation="horizontal"
            label={item.icon}
            value={
              <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.05 }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {item.value}
                  {item.max !== undefined && (
                    <span style={{ fontSize: '0.62em', opacity: 0.55, marginLeft: 2 }}>/{item.max}</span>
                  )}
                </span>
                {item.detail && (
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: 'var(--skin-font-body, inherit)',
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                      textShadow: 'none',
                      color: item.tone ? HUD_TONE_COLOR[item.tone] : 'var(--skin-label-tertiary, #9a8246)',
                    }}
                  >
                    {item.detail}
                  </span>
                )}
              </span>
            }
            style={{ gap: 7, minWidth: 0 }}
          />
        </div>
      );
    })}
  </MatericFieldGroup>
);

export default ResourceReadout;
