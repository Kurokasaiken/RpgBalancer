import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { EquipSlotRack } from '@/ui/idleVillage/components/EquipSlotRack';

const SLOTS = [
  { id: 'weapon', label: 'Weapon' },
  { id: 'armor', label: 'Armor' },
];

const renderRack = (props: Partial<React.ComponentProps<typeof EquipSlotRack>> = {}) =>
  render(
    <DndContext>
      <EquipSlotRack
        slots={SLOTS}
        equipment={{ weapon: 'Sword' }}
        onDrop={vi.fn()}
        onUnequip={vi.fn()}
        {...props}
      />
    </DndContext>,
  );

describe('EquipSlotRack', () => {
  it('renders one slot per slot definition', () => {
    renderRack();

    expect(screen.getByText('Weapon')).toBeInTheDocument();
    expect(screen.getByText('Armor')).toBeInTheDocument();
  });

  it('displays the first letter of the equipped item', () => {
    renderRack();

    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('calls onUnequip when a filled slot is clicked', () => {
    const onUnequip = vi.fn();
    renderRack({ onUnequip });

    const weaponSlot = screen.getByText('S').closest('[title]') ?? screen.getByText('S').parentElement;
    expect(weaponSlot).toBeTruthy();
    fireEvent.click(weaponSlot!);

    expect(onUnequip).toHaveBeenCalledWith('weapon');
  });
});
