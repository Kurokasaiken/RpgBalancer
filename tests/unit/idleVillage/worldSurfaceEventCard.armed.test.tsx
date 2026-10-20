/**
 * PLAN-067 T-A12 (R-234) — the invasion card's action is armed only once the
 * card has finished appearing. It used to be clickable from the first frame of
 * its 0.5 s fade-in (and while the curtain was still closing), so a fast
 * player — or a stray Enter — confirmed «Prepare the defenses» without having
 * seen the announcement (audit F5 §6).
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WorldSurfaceEventCard } from '@/ui/idleVillage/components/WorldSurfaceEventCard';

/* jsdom has no matchMedia (the goblin window reads prefers-reduced-motion). */
window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const baseProps = {
  zIndex: 1,
  screenAnchor: { left: '50%', top: '50%' },
  screenScale: 1,
  worldCenter: { x: 100, y: 100 },
  canvasSize: { width: 200, height: 200 },
  camera: { panX: 0, panY: 0, zoom: 1 },
  fallTarget: { x: 10, y: 10 },
  marchTarget: { x: 20, y: 20 },
  daysRemaining: 5,
  showReminder: false,
  cardSize: 1,
} as const;

describe('WorldSurfaceEventCard — action armed after the reveal (R-234)', () => {
  // INV:R-234-invasion-action-armed — the card's action is disabled while the card fades in and
  // does not fire; it arms once the card is fully shown.
  it('does not confirm during the fade-in, then arms', async () => {
    const onComplete = vi.fn();
    render(<WorldSurfaceEventCard {...baseProps} visible onComplete={onComplete} />);
    const action = screen.getByTestId('world-event-card-body').querySelector('button')!;
    expect(action).toBeDisabled();
    fireEvent.click(action);
    expect(onComplete).not.toHaveBeenCalled();
    await waitFor(() => expect(action).not.toBeDisabled(), { timeout: 3000 });
  }, 15000);
});
