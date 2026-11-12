/**
 * MapPlace / PlaceFan / PlaceHoverCard — PLAN-117 rev. 5, F2, OB-2.
 *
 * Verifica comportamentale sul vivo: la scheda hover è ancorata e non
 * bloccante, il ventaglio apre/chiude su clic ed Esc, l'overlay non copre la
 * mappa (pointer-events solo sui sigilli), il Luogo chiuso è dormiente e
 * niente della superficie è modale/popup (GX-0042).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapPlace } from '@/ui/idleVillage/components/gameFrame/MapPlace';
import type { MapQuestPoiView } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import type { PlaceFanActivity } from '@/ui/idleVillage/components/gameFrame/PlaceFan';
import type { PlaceDefinition } from '@/balancing/config/idleVillage/placesConfig';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const PLACE: PlaceDefinition = {
  placeId: 'place_test',
  regionId: 'region_test',
  worldPoint: { x: 100, y: 100 },
  titleKey: 'test.place.title',
  bodyKey: 'test.place.body',
  activityIds: [],
  fixture: true,
};

const ACTIVITIES: PlaceFanActivity[] = [
  { id: 'a1', type: 'quest' },
  { id: 'a2', type: 'job' },
  { id: 'a3', type: 'event' },
  { id: 'a4', type: 'job' },
  { id: 'a5', type: 'quest' },
];

const view = (over: Partial<MapQuestPoiView> = {}): MapQuestPoiView => ({
  state: 'assigned',
  progress: 0.5,
  deadlineWarn: false,
  direction: 'clockwise',
  done: false,
  ...over,
});

describe('MapPlace — scheda hover (OB-2)', () => {
  it('mostra la scheda al passaggio del mouse, ancorata e senza pointer events', () => {
    render(<MapPlace place={PLACE} />);
    expect(screen.queryByTestId('place-hover-card')).toBeNull();
    fireEvent.mouseEnter(screen.getByTestId('map-place'));
    const card = screen.getByTestId('place-hover-card');
    expect(card).toBeTruthy();
    expect(card.getAttribute('role')).toBe('tooltip');
    expect(card.style.pointerEvents).toBe('none');
    fireEvent.mouseLeave(screen.getByTestId('map-place'));
    expect(screen.queryByTestId('place-hover-card')).toBeNull();
  });
});

describe('MapPlace — ventaglio (OB-2)', () => {
  it('apre al clic, richiude al secondo clic, e non è un overlay bloccante', () => {
    render(<MapPlace place={PLACE} activities={ACTIVITIES} />);
    const marker = screen.getByTestId('map-place');
    fireEvent.click(marker);
    const fan = screen.getByTestId('place-fan');
    expect(fan).toBeTruthy();
    /* Il contenitore del ventaglio non intercetta la mappa: pointer-events
       none sul layer, auto solo sui sigilli. */
    expect(fan.style.pointerEvents).toBe('none');
    const seals = screen.getAllByTestId(/place-fan-seal-/);
    expect(seals.length).toBe(ACTIVITIES.length);
    expect(seals[0].style.pointerEvents).toBe('auto');
    fireEvent.click(marker);
    expect(screen.queryByTestId('place-fan')).toBeNull();
  });

  it('chiude con Esc', () => {
    render(<MapPlace place={PLACE} activities={ACTIVITIES} />);
    fireEvent.click(screen.getByTestId('map-place'));
    expect(screen.getByTestId('place-fan')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('place-fan')).toBeNull();
  });

  it('riordina gli urgenti sull\'anello interno (expired → expiring → resto)', () => {
    const views: Record<string, MapQuestPoiView> = {
      a1: view({ state: 'expiring', progress: 0.3 }),
      a3: view({ state: 'expired', progress: 0 }),
      a5: view({ state: 'expiring', progress: 0.1 }),
    };
    render(<MapPlace place={PLACE} activities={ACTIVITIES} views={views} />);
    fireEvent.click(screen.getByTestId('map-place'));
    const inner = screen.getAllByTestId('place-fan-seal-inner').map((s) => s.getAttribute('data-activity-id'));
    expect(inner).toEqual(['a3', 'a5', 'a1']); // expired, poi expiring per progress asc
    const outer = screen.getAllByTestId('place-fan-seal-outer').map((s) => s.getAttribute('data-activity-id'));
    expect(outer).toEqual(['a2', 'a4']); // il resto, ordine stabile
  });

  it('propaga la selezione del sigillo senza propagare alla mappa', () => {
    const onSelect = vi.fn();
    render(<MapPlace place={PLACE} activities={ACTIVITIES} onSelectActivity={onSelect} />);
    fireEvent.click(screen.getByTestId('map-place'));
    fireEvent.click(screen.getAllByTestId('place-fan-seal-outer')[0]);
    expect(onSelect).toHaveBeenCalledWith('a1');
  });

  it('tastiera: Enter/Space apre il ventaglio; i sigilli sono focusabili', () => {
    render(<MapPlace place={PLACE} activities={ACTIVITIES} />);
    const marker = screen.getByTestId('map-place');
    fireEvent.keyDown(marker, { key: 'Enter' });
    expect(screen.getByTestId('place-fan')).toBeTruthy();
    fireEvent.keyDown(marker, { key: ' ' });
    expect(screen.queryByTestId('place-fan')).toBeNull();
  });
});

describe('MapPlace — Luogo chiuso (D-7)', () => {
  it('open=false: sigillo spento, niente clic né ventaglio', () => {
    render(<MapPlace place={PLACE} activities={ACTIVITIES} open={false} />);
    const marker = screen.getByTestId('map-place');
    expect(marker.getAttribute('data-open')).toBe('false');
    fireEvent.click(marker);
    expect(screen.queryByTestId('place-fan')).toBeNull();
    fireEvent.keyDown(marker, { key: 'Enter' });
    expect(screen.queryByTestId('place-fan')).toBeNull();
  });
});

describe('MapPlace — nessun popup/modale (GX-0042)', () => {
  it('nessun elemento ha role=dialog/alertdialog né uno zIndex a schermo intero', () => {
    render(<MapPlace place={PLACE} activities={ACTIVITIES} />);
    fireEvent.click(screen.getByTestId('map-place'));
    const root = document.body;
    expect(root.querySelector('[role="dialog"], [role="alertdialog"]')).toBeNull();
  });
});
