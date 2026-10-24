/**
 * Sentinel `geometry:small-target` (run sentinel-2026-10-23T0829, S0/S1,
 * R-270) — the event card CTA must keep ≥32px after the surface-fit scale.
 * `MatericEventCard` must let the caller style the action button so the
 * scaled rect can be compensated (`WorldSurfaceEventCard` passes
 * `minHeight: ceil(32/cardScale)`).
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MatericEventCard } from '@/ui/designSystem/primitives/MatericEventCard';

describe('MatericEventCard — action button styling', () => {
  // INV:materic-event-card.INV-1 — the actionStyle prop reaches the CTA button.
  it('applies actionStyle to the action button', () => {
    render(
      <MatericEventCard
        variant="modal"
        badge="Invasion"
        actionLabel="PREPARE THE DEFENSES"
        actionStyle={{ minHeight: 37 }}
      />,
    );
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.includes('PREPARE THE DEFENSES'),
    );
    expect(button).toBeTruthy();
    expect(button!.style.minHeight).toBe('37px');
  });
});
