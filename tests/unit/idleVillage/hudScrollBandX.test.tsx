/**
 * R-378 — the cassetto's horizontal scroll band accepts a `heightPx` override
 * (Director 2026-11-24 «la barra x spostare negli slot pg occupa troppo spazio,
 * falla + piccola»); the shared default stays `HUD_SCROLL_BAND.widthPx`.
 */
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HudScrollBandX } from '@/ui/idleVillage/skins/primitives/HudScrollBandX';
import { HUD_SCROLL_BAND } from '@/balancing/config/idleVillage/hudScrollBandConfig';

describe('HudScrollBandX heightPx', () => {
  // INV:hud-scroll-band-x-heightpx — heightPx overrides the band thickness; the default stays
  // HUD_SCROLL_BAND.widthPx for every other list surface.
  it('renders the configured thickness by default and the override when heightPx is passed', () => {
    const scrollRef = createRef<HTMLDivElement>();
    const { container: def } = render(
      <div style={{ position: 'relative' }}>
        <div ref={scrollRef} />
        <HudScrollBandX scrollRef={scrollRef} />
      </div>,
    );
    expect(def.querySelector('[data-hud-band-x]')).toHaveStyle({ height: `${HUD_SCROLL_BAND.widthPx}px` });

    const slim = createRef<HTMLDivElement>();
    const { container: own } = render(
      <div style={{ position: 'relative' }}>
        <div ref={slim} />
        <HudScrollBandX scrollRef={slim} heightPx={8} />
      </div>,
    );
    expect(own.querySelector('[data-hud-band-x]')).toHaveStyle({ height: '8px' });
  });
});
