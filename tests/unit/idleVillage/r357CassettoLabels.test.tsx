/**
 * R-357 / PLAN-125 2h + 2i — cassetto captions never render under the
 * legibility floor, the rack labels are un-scaled, and the risk value is a
 * muted pending state (not a red "danger —") until the forecast exists.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { HudRealCassetto, CASSETTO_MIN_LABEL_PX, CASSETTO_RACK_SCALE } from '@/ui/idleVillage/hudReal/HudRealCassetto';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${Object.values(opts).join('|')}` : key) }),
}));
vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({ ResidentSlotRack: () => <div data-testid="resident-slot-rack-stub" /> }));

const QUEST: CassettoQuest = {
  title: 'Goblin Extermination', subtitle: 's', briefing: 'b',
  legs: [{ label: 'Outbound', days: 2 }, { label: 'At site', days: 2 }, { label: 'Return', days: 2 }],
  totalDays: 4, riskLabel: '—', riskPending: 'incomplete', rewards: [{ icon: 'gold', qty: '60' }],
};
const mount = (q: Partial<CassettoQuest> = {}) => render(<div style={{ width: 420, height: 900 }}><HudRealCassetto quest={{ ...QUEST, ...q }} slots={[]} /></div>);

describe('R-357 cassetto legibility floor', () => {
  // INV:cassetto-captions-min-size — R-357 2i/2h
  it('journey sub-labels and total are floored (risk/reward captions are gone) at the minimum px', () => {
    mount();
    const floor = `max(${CASSETTO_MIN_LABEL_PX}px`;
    for (const text of ['Outbound', 'At site', 'Return']) expect(screen.getByText(text).getAttribute('style')).toContain(floor);
    expect(screen.getByText('gameFrame.cassetto.journeyTotal:4').getAttribute('style')).toContain(floor);
    // R-357 (Director 2026-11-20): «Risk»/«Reward» are no longer written — they stay as accessible names on the two groups.
    expect(screen.queryByText((c) => c.startsWith('gameFrame.cassetto.risk:'))).not.toBeInTheDocument();
    expect(screen.queryByText((c) => c.startsWith('gameFrame.cassetto.reward:'))).not.toBeInTheDocument();
    expect(screen.getByTestId('cassetto-risk-value')).toHaveAttribute('aria-label');
  });

  it('the scaled party rack gets its labels un-scaled back to the floor', () => {
    const { container } = mount();
    const css = container.querySelector('style')!.textContent!;
    const px = (CASSETTO_MIN_LABEL_PX / CASSETTO_RACK_SCALE).toFixed(2);
    expect(css).toContain(`font-size: ${px}px !important`);
    expect(css).toContain('grid-auto-columns: 104px');
  });

  // INV:cassetto-risk-pending-muted — R-357 2h (re-expressed 2026-11-20: the danger is a row of SKULLS, no text)
  it('an unknown risk lights no skull and shows a muted dash; a known risk lights `level` of `max` skulls (accessible name keeps the band)', () => {
    const { unmount } = mount();
    expect(screen.getByTestId('cassetto-risk-value')).toHaveAttribute('data-risk-level', '0');
    expect(document.querySelector('[data-risk-state="incomplete"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-skull="on"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-skull="off"]')).toHaveLength(4);
    unmount();
    mount({ riskLabel: 'High', riskPending: undefined, riskLevel: 3, riskLevelMax: 4 });
    expect(screen.getByTestId('cassetto-risk-value')).toHaveAttribute('data-risk-level', '3');
    expect(screen.getByTestId('cassetto-risk-value').getAttribute('aria-label')).toContain('High');
    expect(document.querySelectorAll('[data-skull="on"]')).toHaveLength(3);
    expect(document.querySelectorAll('[data-skull="off"]')).toHaveLength(1);
  });

  // INV:cassetto-no-block-titles — R-357: PARTY SLOTS / SUPPLIES / JOURNEY / RISK & REWARDS are not written (space goes to the slots)
  it('renders none of the four block titles as text', () => {
    mount();
    for (const k of ['gameFrame.cassetto.party', 'gameFrame.cassetto.supplies', 'gameFrame.cassetto.journey', 'gameFrame.cassetto.riskRewards'])
      expect(screen.queryByText(k)).not.toBeInTheDocument();
  });

  // INV:cassetto-close — Director 2026-11-20: no × button; Esc and a click on the MAP close the planner
  it('has no × button; Escape and a real click on the map canvas close it; a pan, a DOM target or the cassetto itself do not', () => {
    const onClose = vi.fn();
    const { unmount } = render(<div style={{ width: 420, height: 900 }}><HudRealCassetto quest={QUEST} slots={[]} onClose={onClose} /></div>);
    expect(screen.queryByTestId('cassetto-close')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    const canvas = document.createElement('canvas'); document.body.appendChild(canvas);
    const click = (el: Element, up = { x: 100, y: 100 }) => {
      // jsdom has no PointerEvent: MouseEvents carry button/clientX/clientY under the pointer event names
      el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 100, clientY: 100 }));
      el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: up.x, clientY: up.y }));
    };
    click(canvas);
    expect(onClose).toHaveBeenCalledTimes(2);                      // a real click on the map
    click(canvas, { x: 160, y: 100 });
    expect(onClose).toHaveBeenCalledTimes(2);                      // a pan/drag does not
    const btn = document.createElement('button'); document.body.appendChild(btn);
    click(btn);
    expect(onClose).toHaveBeenCalledTimes(2);                      // another HUD/DOM target does not
    click(screen.getByTestId('cassetto-confirm'));
    expect(onClose).toHaveBeenCalledTimes(2);                      // nor the cassetto itself
    unmount();
    click(canvas);
    expect(onClose).toHaveBeenCalledTimes(2);                      // listeners removed on unmount
    const none = vi.fn();
    mount();
    fireEvent.keyDown(window, { key: 'Escape' });
    click(canvas);
    expect(none).not.toHaveBeenCalled();
    canvas.remove(); btn.remove();
  });

  // INV:cassetto-supplies-scroll — R-357: supplies are centered and scroll sideways when they do not fit
  it('supplies sit in a scroller (overflow-x auto) with the niches centered', () => {
    const loadout = { slots: [null, null, null, null, null], onReleaseItem: vi.fn(), onOpenStash: vi.fn() };
    const { container } = render(<div style={{ width: 420, height: 900 }}><HudRealCassetto quest={QUEST} slots={[]} loadout={loadout} /></div>);
    const sc = container.querySelector('[data-cassetto-bag-scroll]') as HTMLElement;
    expect(sc.style.overflowX).toBe('auto');
    expect((container.querySelector('[data-cassetto-bag]') as HTMLElement).style.margin).toContain('auto');
    expect(container.querySelectorAll('[data-cassetto-bag] > span')).toHaveLength(5);
  });

  // INV:cassetto-party-pager — Director 2026-11-20: three seats at a time + a button to reveal the next
  it('shows 3 seats with prev/next arrows when there are more, none when they fit, and the arrow slides one seat', () => {
    const seat = (i: number) => ({ id: `s${i}`, label: `Seat ${i}`, role: 'member' } as never);
    const four = [0, 1, 2, 3].map(seat);
    const { unmount } = render(<div style={{ width: 420, height: 900 }}><HudRealCassetto quest={QUEST} slots={four} /></div>);
    const next = screen.getByTestId('cassetto-party-next');
    expect(screen.getByTestId('cassetto-party-prev')).toBeDisabled();
    expect(document.querySelector('[data-cassetto-party-pager]')).toHaveAttribute('data-first', '0');
    fireEvent.click(next);
    expect(document.querySelector('[data-cassetto-party-pager]')).toHaveAttribute('data-first', '1');
    expect(next).toBeDisabled();
    unmount();
    render(<div style={{ width: 420, height: 900 }}><HudRealCassetto quest={QUEST} slots={[0, 1, 2].map(seat)} /></div>);
    expect(screen.queryByTestId('cassetto-party-next')).not.toBeInTheDocument();
  });
});
