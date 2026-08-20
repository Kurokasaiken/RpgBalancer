import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillDeck } from '@/ui/idleVillage/components/SkillDeck';

const SKILLS = [
  { id: 'slash', name: 'Slash', initial: 'S', effect: 'Deal weapon damage' },
  { id: 'parry', name: 'Parry', initial: 'P', effect: 'Reduce next attack' },
  { id: 'aim', name: 'Aim', initial: 'A', effect: 'Increase next hit chance' },
];

const LABELS = { available: 'Available', equipped: 'Equipped', empty: 'Empty' };

describe('SkillDeck', () => {
  it('renders available and equipped skills', () => {
    render(<SkillDeck skills={SKILLS} loadout={['slash']} labels={LABELS} onToggle={vi.fn()} />);

    expect(screen.getByText('Slash')).toBeInTheDocument();
    expect(screen.getByText('Parry')).toBeInTheDocument();
    expect(screen.getByText('Aim')).toBeInTheDocument();
  });

  it('calls onToggle when a skill is clicked', () => {
    const onToggle = vi.fn();
    render(<SkillDeck skills={SKILLS} loadout={[]} labels={LABELS} onToggle={onToggle} />);

    fireEvent.click(screen.getByText('Parry'));
    expect(onToggle).toHaveBeenCalledWith('parry');
  });
});
