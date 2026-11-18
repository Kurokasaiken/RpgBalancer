// INV:hud-real-cassetto.INV-6
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';
import { HudRealCassetto, type CassettoQuest, type HudRealCassettoProps } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

const rackProps = vi.hoisted(() => ({ current: undefined as ResidentSlotRackProps | undefined }));

vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  /** Records the cassetto's rack binding without mounting the independent drag/slot implementation. */
  ResidentSlotRack: function ResidentSlotRack(props: ResidentSlotRackProps) {
    rackProps.current = props;
    return <div data-testid="resident-slot-rack-stub" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

const QUEST: CassettoQuest = {
  title: 'Goblin Extermination',
  briefing: 'Prepare the expedition',
  legs: [{ label: 'Outbound', days: 1 }],
  riskLabel: 'Low',
  rewards: [{ icon: 'gold', qty: '60' }],
};
const SLOTS: ResidentSlotViewModel[] = [{
  id: 'goblin-slot-leader',
  index: 0,
  label: 'Leader',
  assignedResidentId: 'giggiolillo',
  isPlaceholder: false,
  dropState: 'idle',
  bloomState: 'idle',
  status: 'assigned',
  telemetryTags: [],
}];

beforeEach(() => {
  rackProps.current = undefined;
});

afterEach(() => {
  cleanup();
});

describe('R-359 — assigned cassetto residents can swap and report extraction phases', () => {
  it('enables slot-token swapping and forwards the session phase callback to the rack', () => {
    const onSlotPhaseChange = vi.fn<NonNullable<HudRealCassettoProps['onSlotPhaseChange']>>();
    render(<HudRealCassetto quest={QUEST} slots={SLOTS} onSlotPhaseChange={onSlotPhaseChange} />);

    expect(screen.getByTestId('resident-slot-rack-stub')).toBeInTheDocument();
    expect(rackProps.current?.slots).toBe(SLOTS);
    expect(rackProps.current?.enableSlotSwap).toBe(true);
    expect(rackProps.current?.onSlotPhaseChange).toBe(onSlotPhaseChange);
  });
});
