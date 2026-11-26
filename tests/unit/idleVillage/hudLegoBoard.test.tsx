/**
 * PLAN-134 T-003/T-004 — DOM contract of the `/hud-lab` LEGO board.
 */
import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@/localization/i18n';
import en from '../../../public/locales/en/idleVillage.json';
import itIT from '../../../public/locales/it-IT/idleVillage.json';
import pseudo from '../../../public/locales/pseudo/idleVillage.json';
import { LegoBoard } from '@/pages/hud-lab/lego/LegoBoard';
import { createInventorySnapshot } from '@/pages/hud-lab/lego/inventory';

const shape = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, shape(item)]));
  return typeof value;
};

describe('LEGO board DOM contract (PLAN-134 §6)', () => {
  it('renders a grouped/filterable inventory with copyable IDs, provenance and persistent in-memory warning', () => {
    const snapshot = createInventorySnapshot();
    const { container } = render(<LegoBoard />);
    expect(container.querySelector('[data-lego-board]')).toBeInTheDocument();
    expect(container.querySelector('[data-inventory-rev]')).toHaveAttribute('data-inventory-rev', expect.stringMatching(/^[0-9a-f]{64}$/) as never);
    expect(container.querySelector('[data-unsaved-warning]')).toBeInTheDocument();
    expect(container.querySelector('[data-filter-kind]')).toBeInTheDocument();
    expect(container.querySelector('[data-filter-canon]')).toBeInTheDocument();
    expect(container.querySelector('[data-filter-review]')).toBeInTheDocument();
    for (const piece of snapshot.pieces) {
      const card = container.querySelector(`[data-lego-piece-card="${piece.id}"]`);
      expect(card, piece.id).toBeInTheDocument();
      expect(card?.querySelector(`[data-copy-piece-id="${piece.id}"]`)).toBeInTheDocument();
      expect(card?.textContent).toContain(piece.provenance.ruling);
    }
    expect(container.querySelector('[data-lego-kind-group="frame"]')).toBeInTheDocument();
    const timeDisc = container.querySelector('[data-lego-piece-card="time-disc-v1"] [data-piece-preview="time-disc-v1"]');
    expect(timeDisc).toBeInTheDocument();
    expect(timeDisc?.querySelector('[data-piece-asset="sun"]')).toBeInTheDocument();
    expect(timeDisc?.querySelector('[data-piece-asset="moon"]')).toBeInTheDocument();
  }, 15000);

  it('unresolved lane has no ruling controls and control patterns are read-only', () => {
    const { container } = render(<LegoBoard />);
    const unresolved = container.querySelector('[data-unresolved-lane]');
    expect(unresolved).toBeInTheDocument();
    expect(unresolved?.querySelector('[data-review-controls]')).not.toBeInTheDocument();
    expect(unresolved?.querySelector('[data-unresolved-entry="piastrina"]')).toBeInTheDocument();
    const controls = container.querySelector('[data-control-patterns-lane]');
    expect(controls).toBeInTheDocument();
    expect(controls?.querySelector('[data-control-pattern="tab-filter-radiogroup"]')).toBeInTheDocument();
    expect(controls?.querySelector('button')).not.toBeInTheDocument();
  });

  it('touching approve/reject/reset updates card state without opening dialogs', () => {
    const snapshot = createInventorySnapshot();
    const candidate = snapshot.pieces.find((piece) => piece.status === 'candidate')!;
    const { container } = render(<LegoBoard />);
    fireEvent.click(container.querySelector(`[data-approve-piece="${candidate.id}"]`)!);
    expect(container.querySelector(`[data-lego-piece-card="${candidate.id}"]`)).toHaveAttribute('data-touched', 'true');
    fireEvent.click(container.querySelector(`[data-reject-piece="${candidate.id}"]`)!);
    expect(container.querySelector(`[data-lego-piece-card="${candidate.id}"]`)).toHaveAttribute('data-review', 'rejected');
    expect(container.querySelector(`[data-reject-form="${candidate.id}"]`)).toBeInTheDocument();
    fireEvent.click(container.querySelector(`[data-reset-piece="${candidate.id}"]`)!);
    expect(container.querySelector(`[data-lego-piece-card="${candidate.id}"]`)).toHaveAttribute('data-touched', 'false');
    expect(container.querySelector('dialog')).not.toBeInTheDocument();
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('reject export is blocked inline until reason exists, then exports schema-shaped JSON', () => {
    const snapshot = createInventorySnapshot();
    const candidate = snapshot.pieces.find((piece) => piece.status === 'candidate')!;
    const { container } = render(<LegoBoard />);
    fireEvent.click(container.querySelector(`[data-reject-piece="${candidate.id}"]`)!);
    expect(container.querySelector('[data-export-toggle]')).toBeDisabled();
    expect(container.querySelector('[data-export-blocked]')?.textContent).toBeTruthy();
    fireEvent.change(container.querySelector(`[data-reject-reason="${candidate.id}"]`)!, { target: { value: 'scale-mismatch' } });
    expect(container.querySelector('[data-export-toggle]')).not.toBeDisabled();
    fireEvent.click(container.querySelector('[data-export-toggle]')!);
    const exported = JSON.parse(container.querySelector('[data-export-json]')!.textContent!);
    expect(exported.schemaVersion).toBe(1);
    expect(exported.inventoryRev).toMatch(/^[0-9a-f]{64}$/);
    expect(exported.decisions).toEqual([expect.objectContaining({ id: candidate.id, decision: 'rejected', reason: 'scale-mismatch' })]);
    expect(container.querySelector('[data-export-markdown]')?.textContent).toContain(candidate.id);
  });

  it('9. remounting the page loses selections while the in-memory warning remains visible', () => {
    const snapshot = createInventorySnapshot();
    const candidate = snapshot.pieces.find((piece) => piece.status === 'candidate')!;
    const first = render(<LegoBoard />);
    fireEvent.click(first.container.querySelector(`[data-approve-piece="${candidate.id}"]`)!);
    expect(first.container.querySelector(`[data-lego-piece-card="${candidate.id}"]`)).toHaveAttribute('data-touched', 'true');
    first.unmount();
    const second = render(<LegoBoard />);
    expect(second.container.querySelector(`[data-lego-piece-card="${candidate.id}"]`)).toHaveAttribute('data-touched', 'false');
    expect(second.container.querySelector('[data-unsaved-warning]')).toBeInTheDocument();
  });

  it('hudLab keys exist with the same shape in en, it-IT and pseudo', () => {
    expect(en.hudLab.lego.title).toBe('LEGO board — HUD art inventory');
    expect(en.hudLab.lego.unsavedWarning).toContain('in-memory');
    expect(shape(itIT.hudLab)).toEqual(shape(en.hudLab));
    expect(shape(pseudo.hudLab)).toEqual(shape(en.hudLab));
  });
});
