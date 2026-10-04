/**
 * Repro: intermittent RangeError "Maximum call stack size exceeded" thrown
 * inside <DestinyAstrolabeV62> while playing /quest-s1-lab (observed in dev
 * browser, flood of mount+error pairs, boundary retry loop, reload).
 *
 * Mounts the REAL page (StrictMode, same as main.tsx) and drives the rovine
 * quest until the first check cinematic mounts — repeated across many fresh
 * mounts to shake out the race. jsdom has no canvas/AudioContext: stub both
 * so the engine boots (its RAF loop self-catches draw errors anyway).
 */
import React, { StrictMode } from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {} as AudioNode;
  resume() { return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
  createGain() {
    return { gain: { value: 1 }, connect: () => ({ connect: () => ({}) }) } as unknown as GainNode;
  }
  createBufferSource() {
    return { buffer: null, connect: () => ({ connect: () => ({}) }), start: () => {} } as unknown as AudioBufferSourceNode;
  }
  decodeAudioData() { return Promise.resolve({} as AudioBuffer); }
}

beforeAll(() => {
  (globalThis as any).AudioContext = FakeAudioContext;
  // jsdom canvas has no 2d context: give it a minimal stub so engine init is
  // a faithful no-op instead of a null-deref unrelated to the bug.
  const fakeImageData = (w: number, h: number) => ({
    data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
    width: w,
    height: h,
  });
  (HTMLCanvasElement.prototype as any).getContext = function getContext(kind: string) {
    if (kind === '2d') {
      return new Proxy(
        {
          createImageData: fakeImageData,
          getImageData: (_x: number, _y: number, w: number, h: number) => fakeImageData(w, h),
          measureText: () => ({ width: 0 }),
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
          createPattern: () => ({}),
        },
        {
          get: (t, prop) => {
            if (prop in t) return (t as any)[prop];
            if (prop === 'canvas') return null;
            if (typeof prop === 'string') return () => {};
            return undefined;
          },
          set: () => true,
        },
      );
    }
    return null;
  };
});

async function driveToFirstCheck(): Promise<boolean> {
  const QuestS1LabPage = (await import('../../../../src/ui/idleVillage/pages/QuestS1LabPage')).default;
  const view = render(
    <StrictMode>
      <QuestS1LabPage />
    </StrictMode>,
  );
  const byText = (re: RegExp) =>
    Array.from(view.container.querySelectorAll('button')).find((b) => re.test(b.textContent ?? ''));

  // quest picker → rovine card
  const rovine = byText(/Rovine|rovine|Ruins/i);
  if (!rovine) { cleanup(); return false; }
  fireEvent.click(rovine);

  // preset → first Depart button
  const depart = byText(/Depart|Parti|Partenza/i);
  if (!depart) { cleanup(); return false; }
  fireEvent.click(depart);

  // first choice node: pick the first enabled option, then commit it.
  const optBtn = Array.from(view.container.querySelectorAll('button'))
    .find((b) => !b.disabled && /Osserv|Incalza|Osserva/i.test(b.textContent ?? ''));
  if (optBtn) fireEvent.click(optBtn);
  const face = byText(/check|affronta|Face/i);
  if (face) fireEvent.click(face);

  const mounted = !!view.container.querySelector('[data-testid="destiny-astrolabe-v62"]');
  cleanup();
  return mounted;
}

describe('questS1Lab page crash repro', () => {
  it('mounts the check cinematic across many fresh page mounts without RangeError', async () => {
    let mountedCount = 0;
    for (let i = 0; i < 150; i++) {
      if (await driveToFirstCheck()) mountedCount += 1;
    }
    expect(mountedCount).toBeGreaterThan(0);
  }, 120000);
});
