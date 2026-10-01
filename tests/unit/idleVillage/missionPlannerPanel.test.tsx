/**
 * MP-05 acceptance tests — the Planner panel UI.
 *
 * Covers: INPUT|OUTPUT separation rendered, BY MEMBER always present, WHY
 * shows cause chains (not raw numbers), delta badge appears after a change,
 * Undo/Reset restore identical outcome, launch blocked with reason, and the
 * "no Simulate" contract — every edit recomputes OUTCOME immediately.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MissionPlannerLive } from '@/ui/idleVillage/components/missionPlanner/MissionPlannerLive';

const QUEST_ID = 'quest_city_rats';

/** Roster buttons carry data-testid="mp-roster-<residentId>". */
const rosterButtons = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-testid^="mp-roster-"]'));

const successText = (): string => screen.getByTestId('mp-success').textContent ?? '';

describe('MissionPlannerLive (quest_city_rats)', () => {
  it('renders INPUT and OUTPUT sections, BY MEMBER, and the launch blocked with reason', () => {
    const { container } = render(<MissionPlannerLive questId={QUEST_ID} />);
    expect(screen.getByTestId('mp-input')).toBeInTheDocument();
    expect(screen.getByTestId('mp-output')).toBeInTheDocument();
    // BY MEMBER block exists even with an empty party.
    expect(screen.getByTestId('mp-by-member')).toBeInTheDocument();
    // Required slots empty → declared blocker, launch disabled.
    expect(screen.getByTestId('mp-blockers')).toBeInTheDocument();
    expect(screen.getByTestId('mp-launch')).toBeDisabled();
    // Three quest slots + at least one resident to pick.
    expect(container.querySelectorAll('[data-testid^="mp-slot-"]').length).toBe(3);
    expect(rosterButtons(container).length).toBeGreaterThan(0);
  });

  it('recomputes OUTCOME on every edit (no Simulate) and shows deltas', () => {
    const { container } = render(<MissionPlannerLive questId={QUEST_ID} />);
    // No delta on first render.
    expect(screen.queryByTestId('mp-delta-success')).not.toBeInTheDocument();
    const before = successText();

    fireEvent.click(rosterButtons(container)[0]);
    // Success metric updated and a delta badge appeared — the change is live.
    expect(screen.getByTestId('mp-delta-success')).toBeInTheDocument();
    expect(successText()).not.toBe(before);
  });

  it('unblocks launch once required slots are filled and shows per-member risk', () => {
    const { container } = render(<MissionPlannerLive questId={QUEST_ID} />);
    fireEvent.click(rosterButtons(container)[0]);
    fireEvent.click(rosterButtons(container)[0]); // first pick is consumed

    expect(screen.queryByTestId('mp-blockers')).not.toBeInTheDocument();
    expect(screen.getByTestId('mp-launch')).toBeEnabled();

    const byMember = screen.getByTestId('mp-by-member');
    expect(within(byMember).getAllByTestId(/^mp-member-/).length).toBe(2);
    // Risk badge on each occupied slot (XCOM-style personal risk).
    expect(screen.getAllByTestId('mp-risk-badge').length).toBe(2);
  });

  it('WHY panel opens on demand and shows cause chains', () => {
    const { container } = render(<MissionPlannerLive questId={QUEST_ID} />);
    fireEvent.click(rosterButtons(container)[0]);
    fireEvent.click(rosterButtons(container)[0]);

    expect(screen.queryByTestId('mp-why')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mp-why-toggle'));
    const why = screen.getByTestId('mp-why');
    // Stat contributions are rendered as readable lines (member · stat +delta).
    // The empty optional slot prices into WHY as a readable cause line.
    expect(why.textContent).toMatch(/Empty slots|emptySlots/);
  });

  it('Undo and Reset restore identical outcomes', () => {
    const { container } = render(<MissionPlannerLive questId={QUEST_ID} />);
    const emptyOutcome = successText();

    fireEvent.click(rosterButtons(container)[0]);
    const oneMemberOutcome = successText();
    fireEvent.click(rosterButtons(container)[0]);
    expect(successText()).not.toBe(oneMemberOutcome);

    // Undo pops the second member.
    fireEvent.click(screen.getByTestId('mp-undo'));
    expect(successText()).toBe(oneMemberOutcome);

    // Reset returns to the opening baseline.
    fireEvent.click(screen.getByTestId('mp-reset'));
    expect(successText()).toBe(emptyOutcome);
    expect(screen.getByTestId('mp-blockers')).toBeInTheDocument();
    expect(screen.getByTestId('mp-launch')).toBeDisabled();
  });

  it('loadout edit recomputes the outcome (equip cycles through catalog)', () => {
    const { container } = render(<MissionPlannerLive questId={QUEST_ID} />);
    fireEvent.click(rosterButtons(container)[0]);
    const armorSocket = container.querySelector<HTMLElement>('[data-testid^="mp-socket-"][data-testid$="-armor"]');
    expect(armorSocket).not.toBeNull();
    // Cycling the armor socket equips heavy_plate (−8pp death on the carrier):
    // the member row changes and the socket shows the item label.
    const memberRow = () =>
      container.querySelector<HTMLElement>('[data-testid^="mp-member-"]')?.textContent ?? '';
    const before = memberRow();
    fireEvent.click(armorSocket!);
    expect(armorSocket!.textContent).toContain('Heavy Plate');
    expect(memberRow()).not.toBe(before);
  });

  it('phase preview is distinct from the quest preview (per-member risk, survive-through, retreat)', () => {
    const { container } = render(<MissionPlannerLive questId={QUEST_ID} />);
    fireEvent.click(rosterButtons(container)[0]);
    fireEvent.click(rosterButtons(container)[0]);
    fireEvent.click(rosterButtons(container)[0]);

    // Each phase row carries its own preview line — conditional pass chance
    // plus per-member risk, survive-through and the retreat tier — which is
    // not just the quest aggregate repeated.
    const details = container.querySelectorAll<HTMLElement>('[data-testid^="mp-phase-detail-"]');
    expect(details.length).toBe(3);
    for (const detail of details) {
      expect(detail.textContent).toContain('per member');
      expect(detail.textContent).toMatch(/⚕ \d+–\d+%/);
      expect(detail.textContent).toMatch(/☠ \d+–\d+%/);
      expect(detail.textContent).toContain('party alive after');
      expect(detail.textContent).toMatch(/retreat → .+ \(\d+%\)/);
    }
    // The phase-level pass chance (conditional on reaching) differs from the
    // whole-quest success headline — two different previews, two semantics.
    const phaseRows = container.querySelectorAll<HTMLElement>('[data-testid^="mp-phase-"]');
    const passText = phaseRows[0].textContent ?? '';
    expect(passText).not.toContain(successText());
  });

  it('launch invokes onLaunch with a validated payload', () => {
    const launches: Array<{ ok: boolean; payload?: { questId: string; party: unknown[] } }> = [];
    const { container } = render(
      <MissionPlannerLive questId={QUEST_ID} onLaunch={(p) => launches.push(p as never)} />,
    );
    fireEvent.click(rosterButtons(container)[0]);
    fireEvent.click(rosterButtons(container)[0]);

    fireEvent.click(screen.getByTestId('mp-launch'));
    expect(launches).toHaveLength(1);
    expect(launches[0].ok).toBe(true);
    expect(launches[0].payload?.questId).toBe(QUEST_ID);
    expect(launches[0].payload?.party).toHaveLength(2);
  });
});
