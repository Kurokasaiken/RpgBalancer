import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EquippableItemCard } from '@/ui/idleVillage/components/EquippableItemCard';

const ITEM = {
  id: 'iron-sword',
  name: 'Iron Sword',
  slot: 'weapon',
  rarity: 'Common',
  effect: '+2 damage',
};

const LABELS = { rarity: 'Rarity', effect: 'Effect', slot: 'Slot' };

describe('EquippableItemCard', () => {
  it('renders the item name and fields', () => {
    render(<EquippableItemCard item={ITEM} labels={LABELS} />);

    expect(screen.getByText('Iron Sword')).toBeInTheDocument();
    expect(screen.getByText('+2 damage')).toBeInTheDocument();
    expect(screen.getByText('weapon')).toBeInTheDocument();
    expect(screen.getByText('Common')).toBeInTheDocument();
  });
});
