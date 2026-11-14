/**
 * placeRadial — contratto del menu radiale inclinato (PLAN-117 F2,
 * artifact r003 + ruling Director 2026-11-12).
 *
 * Verificabile in jsdom: geometria slot (NE=index0, ordine orario, seam),
 * assegnazione stabile, dead zone, socket vuoti non interattivi, Esc,
 * locked≠vuoto. NON verificabile qui: hitbox post-trasformazione CSS3D e
 * resa visiva — serve il testimone browser (gate prototipo).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  RADIAL_SLOTS,
  slotCenterDeg,
  slotIndexFromVector,
  assignRadialSlots,
  nextSlot,
  BANDS,
} from '@/ui/idleVillage/components/gameFrame/placeRadialGeometry';
import { PlaceRadial } from '@/ui/idleVillage/components/gameFrame/PlaceRadial';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? k }),
}));

const ACTS = [
  { id: 'a1', type: 'quest' as const },
  { id: 'a2', type: 'job' as const },
  { id: 'a3', type: 'event' as const },
  { id: 'a4', type: 'job' as const },
];

describe('placeRadialGeometry', () => {
  it('8 slot da 45°, index0 centrato a NE (-45°), ordine orario', () => {
    expect(RADIAL_SLOTS).toBe(8);
    expect(slotCenterDeg(0)).toBe(-45); // NE
    expect(slotCenterDeg(1)).toBe(0);   // E
    expect(slotCenterDeg(2)).toBe(45);  // SE
    expect(slotCenterDeg(3)).toBe(90);  // S
    expect(slotCenterDeg(4)).toBe(135); // SW
    expect(slotCenterDeg(5)).toBe(180); // W
    expect(slotCenterDeg(6)).toBe(225); // NW
    expect(slotCenterDeg(7)).toBe(270); // N
  });

  it('hit-test polare: dead zone interna, slot angolare corretto, seam NE/N', () => {
    const R = 230;
    // dentro il collare = dead zone
    expect(slotIndexFromVector(10, -10, R)).toBe(-1);
    // vettore verso NE (alto-destra) → slot 0
    expect(slotIndexFromVector(120, -120, R)).toBe(0);
    // vettore verso E → slot 1 ; verso S → slot 3 ; verso W → slot 5
    expect(slotIndexFromVector(200, 2, R)).toBe(1);
    expect(slotIndexFromVector(2, 200, R)).toBe(3);
    expect(slotIndexFromVector(-200, 0, R)).toBe(5);
    // seam: vettore a N (in alto) → slot 7, non wrap errato
    expect(slotIndexFromVector(0, -200, R)).toBe(7);
    // oltre il bordo: stesso settore angolare (Fitts)
    expect(slotIndexFromVector(500, -500, R)).toBe(0);
  });

  it('assegnazione stabile: attività[i]→slot[i], overflow oltre 8', () => {
    const nine = Array.from({ length: 9 }, (_, i) => ({ id: `x${i}` }));
    const { slotted, overflow } = assignRadialSlots(nine);
    expect(slotted).toHaveLength(8);
    expect(slotted[0].id).toBe('x0');
    expect(overflow).toHaveLength(1);
    expect(overflow[0].id).toBe('x8');
  });

  it('wrap tastiera attraversa la seam N→NE', () => {
    expect(nextSlot(7, 1)).toBe(0);
    expect(nextSlot(0, -1)).toBe(7);
    expect(BANDS.hubOuter).toBeLessThan(BANDS.collarOuter);
  });
});

describe('PlaceRadial (componente)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renderizza 8 slot; quelli oltre le attività sono vetro non interattivo', () => {
    render(<PlaceRadial activities={ACTS} views={{}} />);
    for (let i = 0; i < 8; i++) expect(screen.getByTestId(`place-radial-slot-${i}`)).toBeTruthy();
    // socket vuoto (slot 4-7) = pointer-events none
    expect(screen.getByTestId('place-radial-slot-5').getAttribute('style')).toContain('pointer-events: none');
    // slot attivo = interattivo + menuitem
    const s0 = screen.getByTestId('place-radial-slot-0');
    expect(s0.getAttribute('role')).toBe('menuitem');
    expect(s0.getAttribute('style')).toContain('pointer-events: visiblepainted'.replace('painted', 'Painted'));
    expect(screen.getByTestId('place-radial').querySelector('image[href$="/hub.webp"]')).toBeNull();
    expect(screen.getByTestId('place-radial').querySelectorAll('image[href$="/disc-base.webp"]')).toHaveLength(1);
    expect(screen.getByTestId('place-radial').querySelectorAll('image[href$="/disc-glass.webp"]')).toHaveLength(4);
  });

  it('limita il disco nel viewport stretto, senza cambiare gli otto slot', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    try {
      render(<PlaceRadial activities={ACTS} views={{}} />);
      const disc = screen.getByTestId('place-radial-disc');
      expect(parseFloat(disc.style.width)).toBeLessThanOrEqual(500 * 0.54);
      expect(screen.getAllByRole('menuitem')).toHaveLength(4);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
    }
  });

  it('locked (expired) != socket vuoto: fill diverso + aria-disabled, non selezionabile', () => {
    const onSelect = vi.fn();
    render(<PlaceRadial activities={ACTS} views={{ a1: { state: 'expired', progress: 1, direction: 'counterclockwise', done: false, deadlineWarn: false } } as never} onSelect={onSelect} />);
    const locked = screen.getByTestId('place-radial-slot-0');
    expect(locked.getAttribute('aria-disabled')).toBe('true');
    // lo spento-tratteggio sta sull'overlay sopra la lastra dipinta
    expect(screen.getByTestId('place-radial-locked-0').getAttribute('fill')).toContain('pr-hatch');
    fireEvent.click(locked);
    expect(onSelect).not.toHaveBeenCalled();
    // uno slot vuoto non ha neppure role=menuitem
    expect(screen.getByTestId('place-radial-slot-4').getAttribute('role')).toBeNull();
  });

  it('Esc e clic-fuori <4px chiudono; drag >=4px non chiude', () => {
    const close = vi.fn();
    render(<><PlaceRadial activities={ACTS} views={{}} onRequestClose={close} /><div data-testid="outside" /></>);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(close).toHaveBeenCalledTimes(1);
    // jsdom: PointerEvent non sempre porta clientX — dispatch MouseEvent col
    // type pointer* (i listener matchano il type, le coordinate ci sono).
    const pd = (el: Element, x: number, y: number) =>
      el.dispatchEvent(new MouseEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
    const pu = (el: Element, x: number, y: number) =>
      el.dispatchEvent(new MouseEvent('pointerup', { clientX: x, clientY: y, bubbles: true }));
    // drag lungo sul fuori = pan → non chiude
    pd(screen.getByTestId('outside'), 10, 10);
    pu(screen.getByTestId('outside'), 30, 10);
    expect(close).toHaveBeenCalledTimes(1);
    // clic netto sul fuori (<4px) → chiude
    pd(screen.getByTestId('outside'), 10, 10);
    pu(screen.getByTestId('outside'), 12, 11);
    expect(close).toHaveBeenCalledTimes(2);
  });

  it('Enter su slot attivo seleziona; frecce muovono il focus con wrap', () => {
    const onSelect = vi.fn();
    render(<PlaceRadial activities={ACTS} views={{}} onSelect={onSelect} />);
    const s0 = screen.getByTestId('place-radial-slot-0');
    fireEvent.keyDown(s0, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('a1');
    // ArrowRight da slot0 → focus su slot1 (ordine riempimento)
    fireEvent.keyDown(s0, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByTestId('place-radial-slot-1'));
  });

  it('dwell card: appare dopo 350ms sulla prima permanenza, swap istantaneo dopo', () => {
    vi.useFakeTimers();
    render(<PlaceRadial activities={ACTS} views={{}} />);
    const s0 = screen.getByTestId('place-radial-slot-0');
    fireEvent.mouseEnter(s0);
    expect(screen.queryByTestId('place-radial-card')).toBeNull();
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByTestId('place-radial-card')).toBeTruthy();
    // card aperta → spostarsi su altra slice scambia contenuto SUBITO
    fireEvent.mouseEnter(screen.getByTestId('place-radial-slot-2'));
    expect(screen.getByTestId('place-radial-card').textContent).toContain('a3');
    vi.useRealTimers();
  });
});
