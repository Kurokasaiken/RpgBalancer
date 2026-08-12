import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import QuestChronicle, {
  type QuestChroniclePhase,
} from '@/ui/idleVillage/components/QuestChronicle';
import type { QuestPhase } from '@/balancing/config/idleVillage/types';

vi.mock('@/ui/idleVillage/hooks/useQuestLoreDrop', () => ({
  useQuestLoreDrop: () => ({ loreDrop: null, isDiscovered: false }),
}));

const phase = (id: string): QuestPhase =>
  ({
    id,
    title: id,
    type: 'check',
    durationValue: 1,
    durationUnits: 'hours',
    copy: { summary: '', narrative: '', callToAction: '' },
  }) as QuestPhase;

const phases: QuestChroniclePhase[] = [
  { phase: phase('one'), state: 'success' },
  { phase: phase('two'), state: 'active' },
  { phase: phase('three'), state: 'locked' },
];

const baseProps = {
  title: 'Cull Rats',
  phases,
  currentPhaseIndex: 1,
};

describe('QuestChronicle — rope', () => {
  it('is absent until the caller supplies quest progress', () => {
    const { queryByTestId } = render(<QuestChronicle {...baseProps} />);
    expect(queryByTestId('quest-chronicle-rope')).toBeNull();
  });

  it('exposes progress as an accessible meter', () => {
    const { getByTestId } = render(<QuestChronicle {...baseProps} questProgress={0.42} />);
    const rope = getByTestId('quest-chronicle-rope');
    expect(rope.getAttribute('role')).toBe('progressbar');
    expect(rope.getAttribute('aria-valuenow')).toBe('42');
    expect(rope.getAttribute('aria-valuemin')).toBe('0');
    expect(rope.getAttribute('aria-valuemax')).toBe('100');
  });

  it('fills with light as the quest advances, starting unlit', () => {
    const fillWidth = (progress: number): string => {
      const { getByTestId, unmount } = render(
        <QuestChronicle {...baseProps} questProgress={progress} />,
      );
      const width = (getByTestId('quest-chronicle-rope').firstElementChild as HTMLElement).style
        .width;
      unmount();
      return width;
    };

    expect(fillWidth(0)).toBe('0%');
    expect(fillWidth(0.5)).toBe('50%');
    expect(fillWidth(1)).toBe('100%');
  });

  it('clamps progress outside 0–1', () => {
    const { getByTestId } = render(<QuestChronicle {...baseProps} questProgress={3} />);
    expect(getByTestId('quest-chronicle-rope').getAttribute('aria-valuenow')).toBe('100');
  });

  it('shows the travelling head only while the rope is partly lit', () => {
    const heads = (progress: number): number => {
      const { getByTestId, unmount } = render(
        <QuestChronicle {...baseProps} questProgress={progress} />,
      );
      const count = getByTestId('quest-chronicle-rope').children.length;
      unmount();
      return count;
    };

    expect(heads(0)).toBe(1);
    expect(heads(0.5)).toBe(2);
    expect(heads(1)).toBe(1);
  });
});

describe('QuestChronicle — collect gate', () => {
  const outcome = { result: 'victory' as const, label: 'Successo', icon: '✓' };

  it('offers no collect button while the quest is still running', () => {
    const { queryByTestId } = render(
      <QuestChronicle {...baseProps} questProgress={0.5} onCollect={vi.fn()} />,
    );
    expect(queryByTestId('quest-chronicle-collect')).toBeNull();
  });

  it('shows the collect button once an outcome exists', () => {
    const { getByTestId } = render(
      <QuestChronicle {...baseProps} questProgress={1} outcome={outcome} onCollect={vi.fn()} />,
    );
    expect(getByTestId('quest-chronicle-collect')).toBeTruthy();
  });

  it('stays uncollectable when the caller supplies no handler', () => {
    const { queryByTestId } = render(
      <QuestChronicle {...baseProps} questProgress={1} outcome={outcome} />,
    );
    expect(queryByTestId('quest-chronicle-collect')).toBeNull();
  });

  it('collects only when the player asks — the card never dismisses itself', () => {
    const onCollect = vi.fn();
    const { getByTestId } = render(
      <QuestChronicle {...baseProps} questProgress={1} outcome={outcome} onCollect={onCollect} />,
    );
    expect(onCollect).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('quest-chronicle-collect'));
    expect(onCollect).toHaveBeenCalledTimes(1);
  });
});

describe('QuestChronicle — one square per phase', () => {
  it('renders a card for every authored phase', () => {
    const { getByText } = render(<QuestChronicle {...baseProps} questProgress={0.5} />);
    expect(getByText('one')).toBeTruthy();
    expect(getByText('two')).toBeTruthy();
    expect(getByText('three')).toBeTruthy();
  });

  it('marks a passed phase with a checkmark and leaves a locked one unmarked', () => {
    const { container } = render(
      <QuestChronicle
        {...baseProps}
        phases={[
          { phase: phase('done'), state: 'success' },
          { phase: phase('todo'), state: 'locked' },
        ]}
        questProgress={0.5}
      />,
    );
    const checks = [...container.querySelectorAll('text')].filter((t) => t.textContent === '✓');
    expect(checks).toHaveLength(1);
  });
});
