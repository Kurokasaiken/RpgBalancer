import { describe, it, afterEach, vi, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PgCard } from './PgCard';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

vi.mock('@/ui/idleVillage/components/DragContext', () => ({
  useDragContext: () => ({
    activeId: null,
    setActiveId: vi.fn(),
  }),
}));

vi.mock('@/engine/game/idleVillage/residentVisualResolver', () => ({
  resolveResidentPortrait: () => ({
    profile: {
      id: 'mock',
      label: 'Mock Profile',
      portrait: {
        id: 'mock-p',
        src: 'mock-portrait.png',
        defaultCrop: { focusX: 50, focusY: 50, zoom: 1 },
      },
    },
    portraitUrl: 'mock-portrait.png',
    fullFigureUrl: undefined,
    crop: { focusX: 50, focusY: 50, zoom: 1 },
    source: 'profile' as const,
  }),
}));

const BASE_RESIDENT: ResidentState = {
  id: 'resident-test',
  displayName: 'Test Hero',
  status: 'available',
  fatigue: 10,
  currentHp: 90,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  statSnapshot: {},
  statTags: ['hero'],
  survivalCount: 0,
  survivalScore: 0,
};

describe('PgCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders resident display name', () => {
    render(<PgCard resident={BASE_RESIDENT} />);

    const card = screen.getByTestId('pg-card');
    expect(card).toHaveTextContent('Test Hero');
  });
});
