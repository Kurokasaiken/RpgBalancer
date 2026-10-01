import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { HudEventLedger, type HudEvent } from '@/ui/idleVillage/components/gameFrame/HudEventLedger';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

const trackTelemetryEvent = vi.fn();
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: (...args: unknown[]) => trackTelemetryEvent(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => (opts?.count !== undefined ? `${key}:${opts.count}` : key),
  }),
}));

const EVENTS: HudEvent[] = [
  { id: 'caravan', typeId: 'visit', title: 'Caravan', daysLeft: 7 },
  { id: 'invasion', typeId: 'threat', title: 'Invasion', daysLeft: 5 },
  { id: 'granary', typeId: 'construction', title: 'Granary', daysLeft: 1 },
  { id: 'wolves', typeId: 'threat', title: 'Wolves', daysLeft: 2 },
];

// Order tests look at every row, so they lift the collapsed limit.
const ALL_ROWS = { ...DEFAULT_GAME_FRAME_CONFIG.eventLedger, maxVisibleRows: 10 };

const rowTitles = () =>
  screen.getAllByRole('listitem').map((row) => row.querySelector('span[title]')?.textContent);

describe('HudEventLedger', () => {
  beforeEach(() => trackTelemetryEvent.mockClear());

  it('lists events by due date by default', () => {
    render(<HudEventLedger events={EVENTS} config={ALL_ROWS} />);
    expect(rowTitles()).toEqual(['Granary', 'Wolves', 'Invasion', 'Caravan']);
  });

  it('groups by type in priority order when sorted by type', async () => {
    render(<HudEventLedger events={EVENTS} config={ALL_ROWS} />);
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.events.sort.type' }));
    expect(rowTitles()).toEqual(['Wolves', 'Invasion', 'Granary', 'Caravan']);
    expect(screen.getByText('gameFrame.events.types.threat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'gameFrame.events.sort.type' })).toHaveAttribute('aria-pressed', 'true');
    expect(trackTelemetryEvent).toHaveBeenCalledWith(
      'event_ledger_sort',
      expect.objectContaining({ data: { sort: 'type', eventCount: 4 } }),
    );
  });

  it('shows only the most pressing row when collapsed, all rows when expanded', async () => {
    render(<HudEventLedger events={EVENTS} />);
    expect(rowTitles()).toEqual(['Granary']);
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.events.showMore:4' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.events.showLess' }));
    expect(rowTitles()).toEqual(['Granary']);
  });

  it('says "today" for events due now and shows an empty state', () => {
    const { rerender } = render(
      <HudEventLedger events={[{ id: 'x', typeId: 'harvest', title: 'Harvest', daysLeft: 0 }]} />,
    );
    expect(screen.getByText('gameFrame.events.today')).toBeInTheDocument();
    rerender(<HudEventLedger events={[]} />);
    expect(screen.getByText('gameFrame.events.empty')).toBeInTheDocument();
  });
});
