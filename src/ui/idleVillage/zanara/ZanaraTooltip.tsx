/**
 * ZanaraTooltip — the HUD tooltip in the Zanara language: same behaviour and
 * API as the production `HudTooltip` (Radix, focus opens it, portaled), drawn
 * on a small K7 lastra with a gold title and an ivory hint.
 */
import type { ReactElement } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ZANARA_COLORS as C, zanaraLastraFrame } from './zanaraKit';

export interface ZanaraTooltipProps {
  label: string;
  hint?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactElement;
}

const CORNER = 12;

export function ZanaraTooltip({ label, hint, side = 'bottom', children }: ZanaraTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={350} skipDelayDuration={250}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side={side} sideOffset={8} collisionPadding={8} data-hud-tooltip="" data-zanara-tooltip=""
            style={{
              zIndex: 2500, maxWidth: 260, boxSizing: 'border-box', ...zanaraLastraFrame(CORNER),
              padding: '2px 4px', display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none', filter: C.plateShadow,
            }}>
            <span style={{ fontFamily: 'var(--font-header, "Cinzel", serif)', fontSize: 13, letterSpacing: 1.2, color: C.title, textShadow: C.textShadow }}>{label}</span>
            {hint && <span style={{ fontFamily: '"EB Garamond", serif', fontSize: 14, lineHeight: 1.35, color: C.body }}>{hint}</span>}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
