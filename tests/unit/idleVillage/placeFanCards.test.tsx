/**
 * placeFanCards — contratto del ventaglio di carte-smalto del Luogo
 * (PLAN-117 F2-T3, baseline approvata `mockup-hub-fan-village.jpg`).
 *
 * Verificabile in jsdom: slot map misurata (14 posizioni, socket permanenti
 * fuori fillOrder, slot vuoti renderizzati come piastra ▲), assegnazione
 * stabile in fillOrder, hit solo sulle carte con attività, Esc/click-fuori,
 * dwell card, roving tabindex. NON verificabile qui: resa visiva — il
 * confronto col mockup è il testimone browser (OB-F3).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  FAN_RING,
  assignFanCards,
  fanActivityCapacity,
  ringFillOrder,
} from '@/ui/idleVillage/components/gameFrame/placeFanGeometry';
import { PlaceFanCards } from '@/ui/idleVillage/components/gameFrame/PlaceFanCards';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? k }),
}));

const ACTS = [
  { id: 'a1', type: 'quest' as const },
  { id: 'a2', type: 'job' as const },
  { id: 'a3', type: 'event' as const },
  { id: 'a4', type: 'job' as const },
  { id: 'a5', type: 'quest' as const },
];

describe('placeFanGeometry (anello ellittico v65)', () => {
  const spec = FAN_RING;
  const order = ringFillOrder(spec);

  it('capienza = slotsTotal, fill order = indice slot (NE → CW)', () => {
    expect(order).toEqual(Array.from({ length: spec.slotsTotal }, (_, i) => i));
    expect(fanActivityCapacity(spec)).toBe(spec.slotsTotal);
  });

  it('assegnazione stabile: attività[i] → fillOrder[i], overflow oltre capienza', () => {
    const cap = spec.slotsTotal;
    const acts = Array.from({ length: cap + 2 }, (_, i) => ({ id: `x${i}` }));
    const { slots, overflow } = assignFanCards(acts, spec);
    for (let i = 0; i < cap; i++) expect(slots[order[i]]?.id).toBe(`x${i}`);
    expect(overflow.map((a) => a.id)).toEqual([`x${cap}`, `x${cap + 1}`]);
  });
});

describe('PlaceFanCards (componente)', () => {
  beforeEach(() => vi.restoreAllMocks());

  const mount = (activities = ACTS, views = {}) =>
    render(
      <PlaceFanCards activities={activities} views={views} onSelect={vi.fn()} onRequestClose={vi.fn()} />,
    );

  it('renderizza la scena e hit-path solo sulle carte con attività', () => {
    mount();
    for (let i = 0; i < ACTS.length; i++) {
      expect(screen.getByTestId(`place-fancards-slot-${i}`)).toBeTruthy();
    }
    expect(screen.queryByTestId(`place-fancards-slot-${ACTS.length}`)).toBeNull();
    expect(screen.getByTestId('place-fancards')).toBeTruthy();
  });

  it('overflow oltre capienza → affordance gem', () => {
    const many = Array.from({ length: FAN_RING.slotsTotal + 2 }, (_, i) => ({
      id: `o${i}`,
      type: 'job' as const,
    }));
    mount(many);
    expect(screen.getByTestId('place-fancards-overflow')).toBeTruthy();
  });

  it('click su carta attiva → onSelect; Esc chiude', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<PlaceFanCards activities={ACTS} views={{}} onSelect={onSelect} onRequestClose={onClose} />);
    fireEvent.click(screen.getByTestId('place-fancards-slot-0'));
    expect(onSelect).toHaveBeenCalledWith('a1');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('click-fuori <4px chiude, drag >=4px non chiude', () => {
    const onClose = vi.fn();
    render(<PlaceFanCards activities={ACTS} views={{}} onSelect={vi.fn()} onRequestClose={onClose} />);
    fireEvent.pointerDown(window, { clientX: 5, clientY: 5 });
    fireEvent.pointerUp(window, { clientX: 30, clientY: 5 });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body, { clientX: 5, clientY: 5 });
    fireEvent.pointerUp(document.body, { clientX: 6, clientY: 6 });
    expect(onClose).toHaveBeenCalled();
  });

  it('locked (expired) → aria-disabled e non selezionabile', () => {
    const onSelect = vi.fn();
    render(
      <PlaceFanCards activities={ACTS} views={{ a1: { state: 'expired', progress: 0, direction: 'clockwise', done: false, deadlineWarn: false } }} onSelect={onSelect} />,
    );
    const el = screen.getByTestId('place-fancards-slot-0');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(el);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('dwell card: appare dopo 350ms, swap istantaneo fra carte', () => {
    vi.useFakeTimers();
    mount();
    const s0 = screen.getByTestId('place-fancards-slot-0');
    fireEvent.mouseEnter(s0);
    expect(screen.queryByTestId('place-fancards-card')).toBeNull();
    act(() => vi.advanceTimersByTime(360));
    expect(screen.getByTestId('place-fancards-card')).toBeTruthy();
    fireEvent.mouseEnter(screen.getByTestId('place-fancards-slot-1'));
    // card già aperta → swap immediato, niente nuovo dwell
    expect(screen.getByTestId('place-fancards-card')).toBeTruthy();
    vi.useRealTimers();
  });

  it('frecce muovono il focus con wrap sull\'ordine di riempimento', () => {
    mount();
    const last = screen.getByTestId(`place-fancards-slot-${ACTS.length - 1}`);
    fireEvent.keyDown(last, { key: 'ArrowRight' });
    // dal rank finale → wrap a rank 0: il focus è sull'elemento rank0
    const first = screen.getByTestId('place-fancards-slot-0');
    expect(first.getAttribute('tabindex')).toBe('0');
  });
});
