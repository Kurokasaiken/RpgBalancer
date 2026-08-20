import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsumablePile } from '@/ui/idleVillage/components/ConsumablePile';

const ITEMS = [
  { id: 'potion', name: 'Potion', count: 3 },
  { id: 'bandage', name: 'Bandage', count: 1 },
];

describe('ConsumablePile', () => {
  it('renders consumables with counts', () => {
    render(<ConsumablePile items={ITEMS} useLabel="Use" onUse={vi.fn()} />);

    expect(screen.getByText('Potion x3')).toBeInTheDocument();
    expect(screen.getByText('Bandage x1')).toBeInTheDocument();
  });

  it('calls onUse with the item id when the use button is clicked', () => {
    const onUse = vi.fn();
    render(<ConsumablePile items={ITEMS} useLabel="Use" onUse={onUse} />);

    const buttons = screen.getAllByText('Use');
    fireEvent.click(buttons[0]);

    expect(onUse).toHaveBeenCalledWith('potion');
  });
});
