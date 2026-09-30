import React from 'react';
import { MatericField, MatericFieldGroup } from '@/ui/designSystem/primitives';

export interface ResourceReadoutItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export interface ResourceReadoutProps {
  items: ResourceReadoutItem[];
}

/**
 * Resource readout — content for the top-right ribbon.
 *
 * It carries no surface of its own: `HudRibbon` is the surface. A box inside
 * a box was the v2 mistake. Only our real resources appear here — the
 * reference mockup's crystal/stone do not exist in this game.
 *
 * `icon` is expected to already be a self-labelling node (e.g. `HudGlyph`,
 * which carries its own `aria-label`) — R-075 review flagged the previous
 * emoji + wrapping `role="img"` span as a double announcement and as the
 * project's last emoji-icon holdout.
 */
export const ResourceReadout: React.FC<ResourceReadoutProps> = ({ items }) => (
  <MatericFieldGroup layout="columns" density="compact" separators>
    {items.map((item) => (
      <MatericField
        key={item.id}
        tier="tertiary"
        orientation="horizontal"
        label={item.icon}
        value={item.value}
        style={{ gap: 7, minWidth: 0 }}
      />
    ))}
  </MatericFieldGroup>
);

export default ResourceReadout;
