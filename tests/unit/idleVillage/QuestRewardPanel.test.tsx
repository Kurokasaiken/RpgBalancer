import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestRewardPanel } from '@/ui/idleVillage/components/QuestRewardPanel';

const baseProps = {
  questTitle: 'Cull Rats in Sewers',
  isVictory: true,
  outcomeLabel: 'Successo',
  phasesPassed: 2,
  phasesTotal: 3,
  phases: [
    { id: 'a', title: 'Ispeziona i Tunnel', icon: '🕯️', passed: false, verdictLabel: 'fail' },
    { id: 'b', title: 'Spezza il Nido', icon: '⚔️', passed: true, verdictLabel: 'win', wounded: true },
    { id: 'c', title: 'Sigilla le Bocche', icon: '🧪', passed: true, verdictLabel: 'almost' },
  ],
  rewards: [{ id: 'xp', label: 'xp', amount: '+6' }],
  rewardMultiplier: 1.25,
  party: [
    { residentId: 'r1', name: 'Salvatrice', state: 'none' as const },
    { residentId: 'r2', name: 'Sir Spaccaculi', state: 'injured' as const },
    { residentId: 'r3', name: 'Giggiolillo', state: 'dead' as const },
  ],
  onCollect: vi.fn(),
};

describe('QuestRewardPanel — built on design-system roles', () => {
  it('declares roles instead of hardcoding a palette', () => {
    const { container } = render(<QuestRewardPanel {...baseProps} />);
    expect(container.querySelector('.skin-scope')).toBeTruthy();
    expect(container.querySelector('[data-skin="panel"]')).toBeTruthy();
    expect(container.querySelector('[data-skin="section"]')).toBeTruthy();
    expect(container.querySelector('[data-skin="title"]')).toBeTruthy();
    expect(container.querySelector('[data-skin="cta"]')).toBeTruthy();
  });

  it('sets no literal colour on any element', () => {
    const { container } = render(<QuestRewardPanel {...baseProps} />);
    const literalColours = [...container.querySelectorAll<HTMLElement>('*')].filter((el) => {
      const value = `${el.style.color}${el.style.background}${el.style.backgroundColor}`;
      return /#|rgb|hsl/.test(value);
    });
    expect(literalColours).toHaveLength(0);
  });
});

describe('QuestRewardPanel — what it reports', () => {
  it('leads with the outcome and the trial tally', () => {
    render(<QuestRewardPanel {...baseProps} />);
    expect(screen.getByText('Successo')).toBeTruthy();
    expect(screen.getByTestId('quest-reward-summary').textContent).toContain('2');
    expect(screen.getByTestId('quest-reward-summary').textContent).toContain('3');
  });

  it('lists every trial with its result', () => {
    render(<QuestRewardPanel {...baseProps} />);
    const rows = screen.getByTestId('quest-reward-phases').children;
    expect(rows).toHaveLength(3);
    expect(rows[0].getAttribute('data-passed')).toBe('false');
    expect(rows[1].getAttribute('data-passed')).toBe('true');
  });

  it('shows the rewards with the outcome multiplier', () => {
    render(<QuestRewardPanel {...baseProps} />);
    expect(screen.getByTestId('quest-reward-rewards').textContent).toContain('+6');
    expect(screen.getByText('×1.25')).toBeTruthy();
  });

  it('says plainly when nothing was earned', () => {
    render(<QuestRewardPanel {...baseProps} rewards={[]} />);
    expect(screen.queryByTestId('quest-reward-rewards')).toBeNull();
  });

  it('reports the fate of every party member', () => {
    render(<QuestRewardPanel {...baseProps} />);
    const party = screen.getByTestId('quest-reward-party');
    expect(party.children).toHaveLength(3);
    expect(party.textContent).toContain('Giggiolillo');
  });

  it('omits the party section when there is nobody to report', () => {
    render(<QuestRewardPanel {...baseProps} party={[]} />);
    expect(screen.queryByTestId('quest-reward-party')).toBeNull();
  });

  it('changes its framing on defeat', () => {
    const { container } = render(
      <QuestRewardPanel {...baseProps} isVictory={false} outcomeLabel="Disastro" />,
    );
    expect(screen.getByText('Disastro')).toBeTruthy();
    expect(container.textContent).not.toContain('Expedition returned');
  });
});

describe('QuestRewardPanel — the collect gate', () => {
  it('collects only when the player asks', () => {
    const onCollect = vi.fn();
    render(<QuestRewardPanel {...baseProps} onCollect={onCollect} />);
    expect(onCollect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('quest-reward-collect'));
    expect(onCollect).toHaveBeenCalledTimes(1);
  });
});
