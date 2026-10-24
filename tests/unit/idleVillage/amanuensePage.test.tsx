/**
 * PLAN-085 — AmanuensePage render contract (T-002, Mode B-add).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AmanuensePage } from '@/ui/idleVillage/components/gameFrame/AmanuensePage';
import type { LongFormSchemaType } from '@/balancing/config/idleVillage/quests/questScenario.schema';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb ?? k }),
}));

const longForm: LongFormSchemaType = {
  variant: 'scene',
  tier: 2,
  incipitKey: 'Del Passo dei Rovi',
  paragraphKeys: [
    'Quando il {r|Capitano Orso} giunse al margine del bosco.',
    'La pista serpeggiava fra le radici.',
  ],
  marginalia: [
    { afterParagraph: 0, kind: 'gloss', lemma: 'bosco', textKey: 'glossa una' },
  ],
  colophon: { scribeKey: 'Scriptum per manus fratris Alderici' },
  explicitKey: 'Explicit capitulum primum.',
};

describe('AmanuensePage', () => {
  // INV:amanuense-page.INV-8 — the folio renders incipit, paragraphs,
  // gloss, colophon and the wax-seal close control.
  it('renders incipit, prose, gloss note, colophon and close control', () => {
    render(<AmanuensePage longForm={longForm} onClose={() => {}} />);
    expect(screen.getByText('Del Passo dei Rovi')).toBeTruthy();
    expect(screen.getByText(/giunse al margine del/)).toBeTruthy();
    expect(screen.getByText('Capitano Orso')).toBeTruthy(); // rubric segment
    expect(screen.getByText(/glossa una/)).toBeTruthy();
    expect(screen.getByText('Explicit capitulum primum.')).toBeTruthy();
    expect(screen.getByText(/fratris Alderici/)).toBeTruthy();
    expect(screen.getByTestId('amanuense-close')).toBeTruthy();
    expect(screen.getByRole('region')).toBeTruthy();
  });

  // INV:amanuense-page.INV-9 — the close control calls onClose.
  it('close control fires onClose', () => {
    const onClose = vi.fn();
    render(<AmanuensePage longForm={longForm} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('amanuense-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // INV:amanuense-page.INV-10 — drop-cap derived from the first paragraph:
  // the first letter is consumed by the painted initial, not repeated.
  it('renders the painted initial letter without duplicating it', () => {
    render(<AmanuensePage longForm={longForm} onClose={() => {}} />);
    // 'Q' lives only inside the initial plate; the paragraph starts 'uando…'
    expect(screen.getByText(/uando il/)).toBeTruthy();
    const caps = screen.getAllByText('Q');
    expect(caps.length).toBe(1);
  });
});
