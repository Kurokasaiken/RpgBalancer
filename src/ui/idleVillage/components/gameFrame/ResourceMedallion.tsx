import React from 'react';
import type { ResourceReadoutItem } from './ResourceReadout';

export interface ResourceMedallionRowProps {
  items: ResourceReadoutItem[];
}

/**
 * ResourceMedallion — the "Cartographer's Desk" answer to `ResourceReadout`.
 *
 * Built for the R-075 A/B comparison (2026-09-22): the review's "candidato
 * più forte" is Living Atlas structure carrying Cartographer's Desk
 * materiality — "oggetti appoggiati sopra" an atlas, not flat UI rows. Each
 * resource here is a small sigil disc (bevelled rim, sunken face) rather than
 * an inline icon+label pair, so it reads as a coin or seal set on the desk
 * next to the map instead of a stat readout.
 *
 * Same data shape as `ResourceReadout` on purpose — this is a rendering of
 * the same `ResourceReadoutItem[]`, not a second data model, so an A/B swap
 * never touches the page wiring the review flagged as the thing not to
 * duplicate per-variant.
 */
export const ResourceMedallionRow: React.FC<ResourceMedallionRowProps> = ({ items }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    {items.map((item) => (
      <div
        key={item.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          minWidth: 40,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'radial-gradient(circle at 34% 30%, color-mix(in srgb, var(--skin-title-color, #f0cf6a) 22%, var(--skin-surface-base, #060f16)) 0%, var(--skin-surface-base, #060f16) 72%)',
            border: '1px solid var(--skin-surface-border, rgba(223,184,87,0.5))',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 3px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          {item.icon}
        </div>
        <span
          style={{
            fontFamily: 'var(--skin-font-serif)',
            fontSize: 12,
            color: 'var(--skin-title-color, #f0cf6a)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {item.value}
        </span>
      </div>
    ))}
  </div>
);

export default ResourceMedallionRow;
