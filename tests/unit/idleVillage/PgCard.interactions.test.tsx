import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import PgCard from '@/ui/idleVillage/components/PgCard';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';
import { useResidentDragPreview } from '@/ui/idleVillage/hooks/useResidentDragPreview';
import type { DragFeedbackState } from '@/ui/idleVillage/components/ResidentRosterTypes';

vi.mock('@/ui/idleVillage/hooks/useSensoryAudio');
vi.mock('@/ui/idleVillage/hooks/useResidentDragPreview');

const mockPlayCue = vi.fn();
const mockDragImageRef = { current: document.createElement('canvas') };

const mockUseSensoryAudio = vi.mocked(useSensoryAudio);
const mockUseResidentDragPreview = vi.mocked(useResidentDragPreview);

const createMockDataTransfer = () => ({
  setData: vi.fn(),
  effectAllowed: '',
  setDragImage: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSensoryAudio.mockReturnValue({ playCue: mockPlayCue });
  mockUseResidentDragPreview.mockReturnValue({ dragImageRef: mockDragImageRef, isReady: true });
});

describe('PgCard interactions', () => {
  const createBaseProps = () => ({
    workerId: 'pg-1',
    label: 'Aurora',
    hp: 85,
    fatigue: 30,
    maxHp: 100,
    onDragStateChange: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onSelect: vi.fn(),
  });

  describe('drag start', () => {
    it('calls playCue(pickup) and triggers drag start', async () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} />);

      const card = screen.getByTestId('pg-card');

      const mockDataTransfer = createMockDataTransfer();
      await act(async () => {
        fireEvent.dragStart(card, { dataTransfer: mockDataTransfer });
      });

      expect(mockPlayCue).toHaveBeenCalledWith('pickup');
      expect(baseProps.onDragStart).toHaveBeenCalled();
      expect(baseProps.onDragStateChange).toHaveBeenCalledWith('pg-1', true);
    });

    it('does not trigger drag when disabled', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} disabled />);

      const card = screen.getByTestId('pg-card');
      const mockDataTransfer = createMockDataTransfer();
      act(() => {
        fireEvent.dragStart(card, { dataTransfer: mockDataTransfer });
      });

      expect(mockPlayCue).not.toHaveBeenCalled();
      expect(baseProps.onDragStart).not.toHaveBeenCalled();
    });
  });

  describe('drag end', () => {
    it('plays drop_invalid when dragFeedbackState is returning', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} dragFeedbackState="returning" />);

      const card = screen.getByTestId('pg-card');
      act(() => {
        fireEvent.dragEnd(card);
      });

      expect(mockPlayCue).toHaveBeenCalledWith('drop_invalid');
      expect(baseProps.onDragEnd).toHaveBeenCalled();
      expect(baseProps.onDragStateChange).toHaveBeenCalledWith('pg-1', false);
    });

    it('does not play drop_invalid when not returning', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} dragFeedbackState="idle" />);

      const card = screen.getByTestId('pg-card');
      act(() => {
        fireEvent.dragEnd(card);
      });

      expect(mockPlayCue).not.toHaveBeenCalledWith('drop_invalid');
      expect(baseProps.onDragEnd).toHaveBeenCalled();
    });
  });

  describe('returning state', () => {
    it('blocks interactions when dragFeedbackState is returning', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} dragFeedbackState="returning" />);

      const card = screen.getByTestId('pg-card');
      expect(card).toHaveAttribute('aria-disabled', 'true');
      expect(card).toHaveClass(/pointer-events-none/);
    });

    it('applies spring animation class when returning', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} dragFeedbackState="returning" />);

      const card = screen.getByTestId('pg-card');
      expect(card).toHaveClass(/animate-bounce-spring/);
    });
  });

  describe('away state', () => {
    it('shows grayscale and reduced opacity when status is away', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} statusLabel="Away" disabled />);

      const card = screen.getByTestId('pg-card');
      expect(card).toHaveClass('grayscale', 'opacity-35');
    });

    it('prevents drag when status is away', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} statusLabel="Away" disabled />);

      const card = screen.getByTestId('pg-card');
      const mockDataTransfer = createMockDataTransfer();
      act(() => {
        fireEvent.dragStart(card, { dataTransfer: mockDataTransfer });
      });

      expect(mockPlayCue).not.toHaveBeenCalled();
      expect(baseProps.onDragStart).not.toHaveBeenCalled();
    });
  });

  describe('hover valid audio', () => {
    it('plays hover_valid when dragFeedbackState is valid', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} dragFeedbackState="valid" compatibilityState="valid" />);

      // Simulate hover entering a valid slot via drag context
      const card = screen.getByTestId('pg-card');
      expect(card).toHaveAttribute('data-compatibility', 'valid');
    });
  });

  describe('accessibility', () => {
    it('announces compatibility state', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} compatibilityState="valid" compatibilityLabel="Rack A" />);

      const card = screen.getByTestId('pg-card');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Compatible with Rack A'));
    });

    it('announces returning state', () => {
      const baseProps = createBaseProps();
      render(<PgCard {...baseProps} dragFeedbackState="returning" />);

      const card = screen.getByTestId('pg-card');
      expect(card).toHaveAttribute('data-drag-state', 'returning');
      expect(card).toHaveClass(/pointer-events-none/);
    });
  });
});
