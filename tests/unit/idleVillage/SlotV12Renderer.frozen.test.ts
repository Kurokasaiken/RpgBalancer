/**
 * PLAN-043 WS-0+WS-1 · BV-01 — frozen choreography bytes.
 *
 * The slam/open choreography of the castone is certified: the literal values
 * below are contractual bytes. This test fails if anyone edits the frozen
 * keyframes, the bezel transition, the extraction phase split or the tooth
 * timing — intentionally or via a "cleanup". Update the CONTRACT
 * (artifact-r009) first, never these literals.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = fs.readFileSync(
  path.resolve(__dirname, '../../../src/ui/idleVillage/components/SlotV12Renderer.tsx'),
  'utf8',
);

describe('SlotV12Renderer — frozen bytes (BV-01)', () => {
  it('bezelSlam keyframes: 440ms, approach→contact(48%)→kick(58%)→rebounds→dead-stop(76%)', () => {
    expect(SRC).toContain('@keyframes bezelSlam');
    expect(SRC).toContain('bezelSlam 440ms both');
    // contact-compression at 48%
    expect(SRC).toContain('48%');
    expect(SRC).toContain('scale(0.99) rotate(0deg)');
    // −2.4° kick at 58%
    expect(SRC).toContain('58%');
    expect(SRC).toContain('rotate(-2.4deg)');
    // damped rebounds 66%/72% and the linear dead-stop at 76%
    expect(SRC).toContain('66%');
    expect(SRC).toContain('72%');
    expect(SRC).toContain('76%');
    expect(SRC).toContain('animation-timing-function: linear');
  });

  it('bezel transition: 560ms cubic-bezier(0.42, 0, 0.2, 1)', () => {
    expect(SRC).toContain('transition: transform 560ms cubic-bezier(0.42, 0, 0.2, 1)');
  });

  it('extraction math: TEETH_PHASE = 0.35', () => {
    expect(SRC).toMatch(/TEETH_PHASE\s*=\s*0\.35\b/);
  });

  it('tooth timing: 70ms cubic-bezier(0.2, 0, 0, 1) with 200ms delay — single frozen spec', () => {
    expect(SRC).toContain("duration: 70");
    expect(SRC).toContain("delay: 200");
    expect(SRC).toContain("easing: 'cubic-bezier(0.2, 0, 0, 1)'");
    // CSS transition composed from the same frozen spec — no second copy.
    expect(SRC).toContain('transform ${TOOTH_REBITE.duration}ms ${TOOTH_REBITE.easing} ${TOOTH_REBITE.delay}ms');
  });

  it('frozen timing spec is shared: WAAPI re-bite reads the same constants as the CSS transition', () => {
    // The SeatCycle WAAPI drive must not carry its own timing literals —
    // it reads TOOTH_REBITE (frozen contract), fill 'backwards', cancel-on-finish.
    expect(SRC).toContain('TOOTH_REBITE.duration');
    expect(SRC).toContain('TOOTH_REBITE.delay');
    expect(SRC).toContain('TOOTH_REBITE.easing');
    expect(SRC).toContain("fill: 'backwards'");
    expect(SRC).toContain('anim.onfinish = () => anim.cancel()');
  });

  it('hud64 geometry contract: viewBox -79 -79 158 158, domSize 64, portrait 44', () => {
    expect(SRC).toContain("viewBox: '-79 -79 158 158'");
    expect(SRC).toContain('domSizePx: 64');
    expect(SRC).toContain('portraitSizePx: 44');
  });

  it('seatNonce flip bound: rAF ∪ 48ms timeout fallback', () => {
    expect(SRC).toContain('SEAT_FLIP_FALLBACK_MS = 48');
    expect(SRC).toContain('requestAnimationFrame(flip)');
    expect(SRC).toContain('setTimeout(flip, SEAT_FLIP_FALLBACK_MS)');
  });
});
