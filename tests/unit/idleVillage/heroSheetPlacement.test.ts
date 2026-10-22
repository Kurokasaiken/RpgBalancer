import { describe, it, expect } from 'vitest';
import { chooseSheetPlacement, type PlacementRect } from '@/ui/idleVillage/components/gameFrame/heroSheetPlacement';

const viewport = { width: 1920, height: 1080 };
const sheet = { width: 380, height: 460 };
const gap = 14;
const inset = 8;
const card: PlacementRect = { left: 24, top: 300, right: 424, bottom: 372 };
const area = (a: PlacementRect, b: PlacementRect) => {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
};
const boxOf = (p: { left: number; top: number }): PlacementRect => ({ left: p.left, top: p.top, right: p.left + sheet.width, bottom: p.top + sheet.height });

describe('heroSheetPlacement (PLAN-043)', () => {
  // INV:CTR-game-006.INV-2
  it('senza ostacoli: il posto naturale di prima — a destra della carta, all\'altezza della carta', () => {
    const p = chooseSheetPlacement({ card, sheet, viewport, obstacles: [], gap, inset });
    expect(p).toEqual({ left: card.right + gap, top: card.top, overlapArea: 0 });
  });

  // INV:CTR-game-006.INV-2
  it('il planner davanti al posto naturale: la scheda si sposta e non lo copre', () => {
    const planner: PlacementRect = { left: 440, top: 100, right: 1000, bottom: 900 }; // proprio a destra del roster
    const p = chooseSheetPlacement({ card, sheet, viewport, obstacles: [planner], gap, inset });
    expect(p.overlapArea).toBe(0);
    expect(area(boxOf(p), planner)).toBe(0);
  });

  // INV:CTR-game-006.INV-2
  it('non copre mai la carta che descrive', () => {
    const wall: PlacementRect = { left: 440, top: 0, right: 1920, bottom: 1080 }; // tutto il resto occupato
    const p = chooseSheetPlacement({ card, sheet, viewport, obstacles: [wall], gap, inset });
    expect(area(boxOf(p), { left: card.left - 2, top: card.top - 2, right: card.right + 2, bottom: card.bottom + 2 })).toBe(0);
  });

  // INV:CTR-game-006.INV-2
  it('tra più ostacoli sceglie la tasca libera, anche se è lontana', () => {
    const column: PlacementRect = { left: 24, top: 100, right: 424, bottom: 900 }; // la colonna delle carte del roster
    const left: PlacementRect = { left: 440, top: 0, right: 1100, bottom: 1080 };
    const right: PlacementRect = { left: 1100, top: 0, right: 1500, bottom: 1080 };
    const p = chooseSheetPlacement({ card, sheet, viewport, obstacles: [column, left, right], gap, inset });
    expect(p.overlapArea).toBe(0);
    expect(p.left).toBeGreaterThanOrEqual(1500);
  });

  // INV:CTR-game-006.INV-2
  it('se non esiste nessun posto libero, copre il meno possibile', () => {
    const wallA: PlacementRect = { left: 440, top: 0, right: 1920, bottom: 540 };
    const wallB: PlacementRect = { left: 440, top: 540, right: 1700, bottom: 1080 }; // lascia libera una striscia a destra
    const p = chooseSheetPlacement({ card, sheet, viewport, obstacles: [wallA, wallB], gap, inset });
    const covered = area(boxOf(p), wallA) + area(boxOf(p), wallB);
    expect(covered).toBe(p.overlapArea);
    expect(covered).toBeLessThan(sheet.width * sheet.height * 0.5);
  });

  // INV:CTR-game-006.INV-2
  it('resta dentro lo schermo con il margine', () => {
    const p = chooseSheetPlacement({ card: { left: 1500, top: 900, right: 1900, bottom: 970 }, sheet, viewport, obstacles: [], gap, inset });
    expect(p.left).toBeGreaterThanOrEqual(inset);
    expect(p.left + sheet.width).toBeLessThanOrEqual(viewport.width - inset);
    expect(p.top + sheet.height).toBeLessThanOrEqual(viewport.height - inset);
  });

  // INV:CTR-game-006.INV-2
  it('quando non c\'è spazio libero, copre prima il roster che il planner (peso maggiore alla quest)', () => {
    const roster: PlacementRect = { left: 24, top: 120, right: 424, bottom: 700, weight: 1 };
    const planner: PlacementRect = { left: 430, top: 0, right: 1920, bottom: 1080, weight: 4 }; // tutto il resto
    const p = chooseSheetPlacement({ card: { left: 40, top: 600, right: 410, bottom: 640 }, sheet, viewport, obstacles: [roster, planner], gap, inset });
    expect(area(boxOf(p), planner)).toBe(0);
  });

  // INV:CTR-game-006.INV-2
  it('i margini del HUD fisso (barra in alto, navigazione) non vengono invasi', () => {
    const p = chooseSheetPlacement({ card, sheet, viewport, obstacles: [], gap, inset, chrome: { top: 92, bottom: 100 } });
    expect(p.top).toBeGreaterThanOrEqual(92);
    expect(p.top + sheet.height).toBeLessThanOrEqual(viewport.height - 100);
  });
});
