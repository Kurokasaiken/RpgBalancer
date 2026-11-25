import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HudRealTime } from '@/ui/idleVillage/hudReal/HudRealTime';
import { TIME_SLIM_BAR } from '@/ui/idleVillage/hudReal/timeSlimGeometry';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

describe('R-380 — il sole resta nella posizione scelta dal Director', () => {
  // INV:game-top-chrome.INV-7
  it('mantiene la sede del Director (28.5, 26.9) col disco centrato nella cornice', () => {
    const dial = DEFAULT_GAME_FRAME_CONFIG.timeOfDay.dialSlim;
    /* cx,cy = centro sede dipinta: il pick Director posò il canvas del frame a
     *  (28.5, 26.9); nell'arte gen3 la sede è quasi centrata (+0.1, −0.2)
     *  → seat = 28.6, 26.7. */
    expect(dial.cx).toBe(28.6);
    expect(dial.cy).toBe(26.7);
    expect(dial.frame?.size).toBe(85);
    /* il canvas del frame deve atterrare sul pick Director (28.5, 26.9). */
    expect(dial.cx + (dial.frame!.offset?.x ?? 0)).toBeCloseTo(28.5);
    expect(dial.cy + (dial.frame!.offset?.y ?? 0)).toBeCloseTo(26.9);
    /* disc 29.5 = sole ~80% della sede dipinta (Director 2026-11-25: a 68%
     *  il sole a grandezza reale leggeva «piccolo»; ~80% = bordo smeraldo
     *  ~5px come il riferimento battezzato). */
    expect(dial.disc).toBe(29.5);
    expect(dial.r).toBe(35.6);
    expect(dial.r - dial.tick.insetMajor).toBeGreaterThan(dial.disc + dial.tick.gap);
    /* Il pozzo scuro si ferma dentro la corona dei tick: `r - 0.5` laverebbe
     *  l'anello dorato dipinto e l'arco spento leggerebbe "pezzo mancante". */
    expect(dial.wellR).toBeDefined();
    expect(dial.wellR!).toBeLessThanOrEqual(dial.disc + dial.tick.gap);

    const { container } = render(
      <HudRealTime
        dayLabel="Day 1"
        isDayPhase
        cycleProgress={0.5}
        isPaused={false}
        locked={false}
        speed={{ multiplier: 1, available: [1, 2, 4], onChange: () => {}, onTogglePause: () => {} }}
        labels={{ pause: 'Pause', resume: 'Resume', speedGroup: 'Speed', speed: (s) => `x${s}`, spaceKey: 'Space', paused: 'Paused' }}
        dial={dial}
        bar={TIME_SLIM_BAR}
      />,
    );
    const frame = container.querySelector('img[src*="dial-frame.webp"]') as HTMLImageElement;
    const phase = container.querySelector('[data-hr-time="phase"]') as HTMLElement;
    const sun = phase.querySelector('img[src*="sun.webp"]') as HTMLImageElement;
    expect(frame).toBeInTheDocument();
    expect(sun).toBeInTheDocument();
    /* La sede dipinta nel canvas del frame è decentrata: il frame si disegna
     *  con `offset` così la sede cade su (cx, cy) — dove sta il disco. */
    expect(Number.parseFloat(frame.style.left) + dial.frame!.size / 2).toBe(dial.cx + (dial.frame!.offset?.x ?? 0));
    expect(Number.parseFloat(frame.style.top) + dial.frame!.size / 2).toBe(dial.cy + (dial.frame!.offset?.y ?? 0));
    expect(Number.parseFloat(phase.style.left) + Number.parseFloat(phase.style.width) / 2).toBe(dial.cx);
    expect(Number.parseFloat(phase.style.top) + Number.parseFloat(phase.style.height) / 2).toBe(dial.cy);
    expect(sun.style.width).toBe('100%');
    const well = container.querySelector('svg circle');
    expect(Number(well?.getAttribute('r'))).toBe(dial.wellR);
    /* Luna (variante B): il wash navy sulla gemma c'è, nascosto di giorno. */
    const nightWash = container.querySelectorAll('svg circle')[1] as SVGCircleElement;
    expect(Number(nightWash?.getAttribute('r'))).toBe(dial.nightWash?.r);
    expect(nightWash?.style.opacity).toBe('0');
  });
});
