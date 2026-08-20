import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PgDetailCard from '@/ui/idleVillage/components/PgDetailCard';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

vi.mock('@/localization/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string, _options?: Record<string, unknown>) => key }),
}));

const baseResident: ResidentState = {
  id: 'r1',
  displayName: 'Aurora',
  status: 'available',
  fatigue: 30,
  currentHp: 85,
  maxHp: 100,
  isHero: true,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  statSnapshot: {
    strength: 12,
    agility: 10,
    equipment: {
      weapon: 'Sword',
    },
    inventory: ['Potion'],
  },
};

describe('PgDetailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the detail card with the resident name', () => {
    render(<PgDetailCard resident={baseResident} onClose={vi.fn()} />);

    expect(screen.getByText('Aurora')).toBeInTheDocument();
  });

  it('uses i18n keys instead of hardcoded Italian copy', () => {
    render(<PgDetailCard resident={baseResident} onClose={vi.fn()} />);

    // Old hardcoded Italian strings should no longer appear.
    expect(screen.queryByText('Arma')).not.toBeInTheDocument();
    expect(screen.queryByText('Chiudi scheda')).not.toBeInTheDocument();
    expect(screen.queryByText('Apri archetipo')).not.toBeInTheDocument();
  });

  it('renders translated equipment slot labels', () => {
    render(<PgDetailCard resident={baseResident} onClose={vi.fn()} />);

    ['pgDetailCard.equipment.weapon', 'pgDetailCard.equipment.armor', 'pgDetailCard.equipment.mount'].forEach(
      (key) => {
        expect(screen.getByText(key)).toBeInTheDocument();
      },
    );
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<PgDetailCard resident={baseResident} onClose={onClose} />);

    const closeButton = screen.getByLabelText('pgDetailCard.close');
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
