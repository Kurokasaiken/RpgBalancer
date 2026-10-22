/**
 * PLAN-071 T-A6 (R-239) — quest-cluster drag release must not flicker.
 *
 * Video audit (Director, 2026-10-21): releasing the quest window after a
 * drag produced a visible snap — "trascinare il componente è strano e
 * scattoso". Root cause in `QuestStageCluster.onPointerDown`'s `end`
 * handler: it cleared the gesture translate (`el.style.transform = ''`)
 * BEFORE calling `onCommitIntent`. React then re-rendered the committed
 * rect asynchronously, so at least one paint showed the stale pre-drag
 * position — the window jumped back and then forward.
 *
 * Contract: on pointerup the intent is committed while the translate is
 * still applied; the translate is dropped only once the committed geometry
 * is in the DOM (pre-paint); `data-dragging` spans the whole gesture and
 * rect transitions are 0ms while it is set.
 */
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { QuestStageCluster } from '@/ui/idleVillage/components/gameFrame/QuestStageCluster';
import type { QuestClusterIntent } from '@/ui/idleVillage/components/gameFrame/questShellLayout';

/** jsdom lacks PointerEvent — a plain bubbling Event with assigned fields
 *  reaches React's delegated pointer handlers and the window listeners. */
const dispatchPointer = (target: EventTarget, type: string, init: Record<string, unknown>) => {
  const ev = new window.Event(type, { bubbles: true, cancelable: true });
  Object.assign(ev, init);
  target.dispatchEvent(ev);
};

const Harness = ({ onCommit }: { onCommit: (cx: number | null, ty: number | null) => void }) => {
  const [intent, setIntent] = useState<QuestClusterIntent>({ userCenterX: null, userTopY: null });
  return (
    <QuestStageCluster
      viewport={{ w: 1440, h: 900 }}
      envelope={{ x: 0, y: 60, w: 1440, h: 700 }}
      intent={intent}
      onCommitIntent={(cx, ty) => {
        onCommit(cx, ty);
        setIntent({ userCenterX: cx, userTopY: ty });
      }}
      wings={{ leftOpen: false, rightOpen: false, expanded: false }}
      renderWindow={() => (
        <div>
          <div data-testid="drag-handle" data-hud-drag-handle>
            title
          </div>
        </div>
      )}
    />
  );
};

const groupEl = () => document.querySelector('[data-quest-cluster]') as HTMLElement;
const windowSlotEl = () => document.querySelector('[data-testid="quest-cluster-window"]') as HTMLElement;

const dragOnce = async (dx: number, dy: number) => {
  const handle = screen.getByTestId('drag-handle');
  await act(async () => {
    dispatchPointer(handle, 'pointerdown', { pointerId: 7, clientX: 400, clientY: 120, button: 0 });
  });
  await act(async () => {
    dispatchPointer(window, 'pointermove', { pointerId: 7, clientX: 400 + dx, clientY: 120 + dy });
    await new Promise((r) => requestAnimationFrame(r));
  });
};

describe('quest cluster drag release (R-239)', () => {
  // INV:R-239-drag-release — the commit fires while the gesture translate is
  // still applied, and the translate is dropped only with the committed
  // rect already in the DOM: no stale-position frame can paint.
  it('commits before dropping the translate; translate clears with the committed rect', async () => {
    let transformAtCommit: string | null = null;
    const onCommit = vi.fn(() => {
      transformAtCommit = groupEl().style.transform;
    });
    render(<Harness onCommit={onCommit} />);
    const group = groupEl();
    await dragOnce(100, 60);

    expect(group.style.transform).toContain('translate(');
    expect(group.dataset.dragging).toBeDefined();
    /* While dragging, the slots' left/top transitions must be off — an eased
     *  rect under a live translate paints double-offset frames. */
    expect(windowSlotEl().style.transition).toContain('0ms');

    await act(async () => {
      dispatchPointer(window, 'pointerup', { pointerId: 7, clientX: 500, clientY: 180 });
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    /* The translate was still on when the intent was committed — with the
     *  old order (clear → commit) this reads ''. */
    expect(transformAtCommit).toContain('translate(');
    /* Committed rect is already in the DOM; translate dropped pre-paint. */
    expect(group.style.transform).toBe('');
    /* `data-dragging` (and the 0ms transitions it gates) must survive one
     *  painted frame past the commit, or the browser animates left/top from
     *  the pre-drag rect — the release "scatto". It clears via double rAF. */
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    expect(group.dataset.dragging).toBeUndefined();
  });

  // INV:R-239-drag-release — a free-space drag lands where the player
  // dropped it: committed rect = pre-drag rect + pointer delta (chrome px).
  it('lands at the dropped position — committed rect equals pre-drag rect + delta', async () => {
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} />);
    const beforeLeft = parseFloat(windowSlotEl().style.left);
    const beforeTop = parseFloat(windowSlotEl().style.top);
    expect(Number.isFinite(beforeLeft)).toBe(true);
    expect(Number.isFinite(beforeTop)).toBe(true);

    await dragOnce(120, 80);
    await act(async () => {
      dispatchPointer(window, 'pointerup', { pointerId: 7, clientX: 520, clientY: 200 });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });

    const afterLeft = parseFloat(windowSlotEl().style.left);
    const afterTop = parseFloat(windowSlotEl().style.top);
    /* zoom factor is 1 in jsdom → delta arrives 1:1 in chrome px. */
    expect(afterLeft).toBeCloseTo(beforeLeft + 120, 0);
    expect(afterTop).toBeCloseTo(beforeTop + 80, 0);
    expect(groupEl().style.transform).toBe('');
  });
});
