/**
 * PLAN-043 WS-0+WS-1 · BV-02 / BV-03 / T1.2 — the `hud64` slot variant:
 * two-plane SVG/DOM/SVG architecture, 64px box, 44px portrait seat, ~2.56px
 * tooth bite, engraved role glyph in the empty cavity, seatNonce re-bite.
 */
import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import React from 'react';
import { SlotV12Renderer } from '@/ui/idleVillage/components/SlotV12Renderer';

type AnimateArgs = { delay?: number; duration?: number; fill?: string };
const animateCalls: { el: Element; args: AnimateArgs }[] = [];

beforeAll(() => {
  /* jsdom has no WAAPI — record calls on a stub (the tooth re-bite is
   * asserted through its frozen timing arguments, not a real animation). */
  (SVGElement.prototype as unknown as { animate: unknown }).animate = function (
    this: Element,
    _frames: unknown,
    options?: AnimateArgs,
  ) {
    animateCalls.push({ el: this, args: options ?? {} });
    const anim = {
      cancel: () => undefined,
      onfinish: null as null | (() => void),
      finish: () => anim.onfinish?.(),
    };
    return anim;
  };
});

const bezelOf = (root: HTMLElement) => root.querySelector<SVGGElement>('.slot-v12__bezel');

describe('SlotV12Renderer — hud64 variant (BV-02/BV-03)', () => {
  it('geometry: 64×64 DOM box, viewBox -79 -79 158 158, data-bite ≈ 2.56 (2.5 ± 0.25)', () => {
    const { container } = render(<SlotV12Renderer variant="hud64" state="empty" role="member" />);
    const root = container.querySelector<HTMLElement>('.slot-v12')!;
    expect(root).toHaveAttribute('data-variant', 'hud64');
    expect(root.style.width).toBe('64px');
    expect(root.style.height).toBe('64px');
    const bite = Number(root.getAttribute('data-bite'));
    expect(bite).toBeGreaterThanOrEqual(2.25);
    expect(bite).toBeLessThanOrEqual(2.75);
    // Two planes at the root — the engraved glyph adds a nested <svg> of its own.
    const planes = container.querySelectorAll<SVGElement>('.slot-v12__under, .slot-v12__over');
    expect(planes.length).toBe(2);
    planes.forEach((svg) => expect(svg).toHaveAttribute('viewBox', '-79 -79 158 158'));
  });

  it('two planes: under-SVG (defs + cavity) / over-SVG (bezel+teeth), pointer-events:none + overflow:visible', () => {
    const { container } = render(<SlotV12Renderer variant="hud64" state="empty" role="member" />);
    const under = container.querySelector<SVGElement>('.slot-v12__under')!;
    const over = container.querySelector<SVGElement>('.slot-v12__over')!;
    expect(under.querySelector('defs')).toBeTruthy();
    expect(under.querySelector('[clip-path]')).toBeTruthy();
    expect(under.querySelector('.slot-v12__bezel')).toBeNull();
    expect(over.querySelector('.slot-v12__bezel')).toBeTruthy();
    expect(over.style.pointerEvents).toBe('none');
    expect(over.style.overflow).toBe('visible');
    // hud64 uses prefixed paint ids so lab + hud64 can coexist on a page
    expect(under.querySelector('#hud64-slot-v12-cavity')).toBeTruthy();
    expect(under.querySelector('#slot-v12-cavity')).toBeNull();
  });

  it('engraved role glyph in the empty cavity; gone once occupied', () => {
    const { container, rerender } = render(<SlotV12Renderer variant="hud64" state="empty" role="leader" />);
    const glyph = container.querySelector('[data-engraved="role-leader"]');
    expect(glyph).toBeTruthy();
    rerender(<SlotV12Renderer variant="hud64" state="occupied" role="leader" />);
    expect(container.querySelector('[data-engraved="role-leader"]')).toBeNull();
  });

  it('no SVG medal layer on hud64 (the DOM portrait seats instead), bezel still present when occupied', () => {
    const { container } = render(<SlotV12Renderer variant="hud64" state="occupied" role="member" />);
    expect(container.querySelector('[data-layer="medal"]')).toBeNull();
    // BV-03: the lock stays visible over the portrait — bezel+teeth in the over plane
    const over = container.querySelector<SVGElement>('.slot-v12__over')!;
    expect(over.querySelector('.slot-v12__bezel')).toBeTruthy();
    expect(over.querySelectorAll('[data-layer="bezel"]')).toHaveLength(1);
  });

  it('lab default: single SVG, unprefixed ids, no data-variant', () => {
    const { container } = render(<SlotV12Renderer state="empty" />);
    expect(container.querySelectorAll('svg').length).toBe(1);
    expect(container.querySelector('.slot-v12')).not.toHaveAttribute('data-variant');
    expect(container.querySelector('#slot-v12-cavity')).toBeTruthy();
    expect(container.querySelector('.slot-v12__bezel')!.hasAttribute('data-seat-nonce')).toBe(false);
  });
});

describe('SlotV12Renderer — seatNonce re-bite (T1.2)', () => {
  it('nonce bump remounts the keyed SeatCycle: new bezel node, data-seat-nonce emitted only when defined', () => {
    const { container, rerender } = render(
      <SlotV12Renderer variant="hud64" state="occupied" role="member" seatNonce={1} />,
    );
    const first = bezelOf(container)!;
    expect(first).toHaveAttribute('data-seat-nonce', '1');

    rerender(<SlotV12Renderer variant="hud64" state="occupied" role="member" seatNonce={2} />);
    const second = bezelOf(container)!;
    expect(second).toHaveAttribute('data-seat-nonce', '2');
    expect(second).not.toBe(first); // keyed subtree remounts — the re-bite replays on fresh nodes

    rerender(<SlotV12Renderer variant="hud64" state="occupied" role="member" seatNonce={2} />);
    const third = bezelOf(container)!;
    expect(third).toBe(second); // unchanged nonce → no remount → no replay
  });

  it('pre-state: fresh key mounts open (scale 1.18 / -30°, no animation), flip lands the slam', async () => {
    animateCalls.length = 0;
    const { container } = render(
      <SlotV12Renderer variant="hud64" state="occupied" role="member" seatNonce={5} />,
    );
    const bezel = bezelOf(container)!;
    // First committed frame of the keyed subtree: exact EMPTY presentation —
    // slam property absent, teeth retracted via the retracted transform.
    expect(bezel.style.transform).toContain('scale(1.18)');
    expect(bezel.style.transform).toContain('rotate(-30deg)');
    expect(bezel.style.animation).toBe('');

    // The rAF∪48ms flip lands the real props: bezelSlam applies on the live node.
    await waitFor(() => expect(bezel.style.animation).toContain('bezelSlam 440ms'), { timeout: 500 });
    expect(bezel.style.transform).toContain('scale(1)');

    // Tooth WAAPI re-bite: explicit from/to with the frozen 70ms/200ms timing
    // and fill 'backwards' (holds the retracted frame through the delay).
    const toothAnims = animateCalls.filter((c) => c.args.duration === 70 && c.args.delay === 200);
    expect(toothAnims.length).toBeGreaterThanOrEqual(3); // one per tooth
    toothAnims.forEach((c) => expect(c.args.fill).toBe('backwards'));
  });

  it('no nonce → no replay: a plain occupied render carries no data-seat-nonce and no pre-state', () => {
    const { container } = render(<SlotV12Renderer variant="hud64" state="occupied" role="member" />);
    const bezel = bezelOf(container)!;
    expect(bezel.hasAttribute('data-seat-nonce')).toBe(false);
    // occupied → slam plays on mount like a normal drop
    expect(bezel.style.animation).toContain('bezelSlam 440ms');
  });
});
