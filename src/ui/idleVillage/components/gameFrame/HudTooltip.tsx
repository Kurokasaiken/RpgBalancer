/**
 * HudTooltip — the HUD's own tooltip: name, shortcut key, optional one-line hint
 * (PLAN-067 T-A14, R-234).
 *
 * The HUD buttons used the browser's native `title`: it appears after the OS delay, in the OS
 * style, never shows in a capture, and says nothing about the shortcut beyond «[Space]» in plain
 * text (audit F3 HUD §5). This is the same surface the planner and the map already use (Radix,
 * lacquer plate, brass thread), built on tokens, reachable from the keyboard (focus opens it).
 *
 *   <HudTooltip label="Pause" shortcut="Space"><button …/></HudTooltip>
 *
 * A disabled control emits no pointer events, so `wrap` puts the trigger on a span around it.
 * The control keeps its own `aria-label`: the tooltip is for sighted hover/focus, not the name.
 */
import React, { type ReactElement } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

export interface HudTooltipProps {
  /** The control's name. */
  label: string;
  /** Shortcut key, shown as an engraved key cap (e.g. `Space`, `H`, `2`). */
  shortcut?: string;
  /** One line of what it does or why it is unavailable. */
  hint?: string;
  /** Where the tooltip opens (default: below, the HUD hangs from the screen edges). */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Put the trigger on a span around the child (disabled controls swallow pointer events). */
  wrap?: boolean;
  /** False renders the child alone — for controls whose visible label already says everything. */
  when?: boolean;
  children: ReactElement;
}

const PLATE: React.CSSProperties = {
  zIndex: 2500,
  maxWidth: 260,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid color-mix(in srgb, var(--skin-surface-border) 80%, transparent)',
  background: 'linear-gradient(180deg, var(--skin-hud-lacquer-base), var(--skin-hud-lacquer-deep))',
  boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent), inset 0 1px 0 color-mix(in srgb, var(--skin-title-color) 14%, transparent)',
  pointerEvents: 'none',
};

const KEY_CAP: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 20,
  height: 20,
  padding: '0 6px',
  borderRadius: 4,
  border: '1px solid color-mix(in srgb, var(--skin-surface-border) 80%, transparent)',
  background: 'color-mix(in srgb, var(--skin-surface-base) 78%, black)',
  color: 'var(--skin-label-primary)',
  font: '600 12px var(--skin-font-display)',
  letterSpacing: '0.06em',
};

export const HudTooltip: React.FC<HudTooltipProps> = ({ label, shortcut, hint, side = 'bottom', wrap = false, when = true, children }) => when ? (
  <Tooltip.Provider delayDuration={350} skipDelayDuration={250}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        {wrap ? <span style={{ display: 'inline-flex' }}>{children}</span> : children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side={side} sideOffset={8} collisionPadding={8} style={PLATE} data-hud-tooltip="">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: '600 13px var(--skin-font-display)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>{label}</span>
            {shortcut && <kbd style={KEY_CAP}>{shortcut}</kbd>}
          </span>
          {hint && <span style={{ font: '13px/1.35 var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>{hint}</span>}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
) : (
  children
);
