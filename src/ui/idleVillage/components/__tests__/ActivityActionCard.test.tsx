import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityActionCard from '../ActivityActionCard';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';

const baseProps = {
    slotId: 'slot-1',
    label: 'Raccolta Legna',
    progressFraction: 0.4,
    elapsedSeconds: 24,
    totalDurationSeconds: 120,
};

const createDataTransfer = (data: Record<string, string> = {}) =>
    ({
        dropEffect: 'copy',
        effectAllowed: 'all',
        getData: (key: string) => data[key] ?? '',
        setData: () => {},
    }) as unknown as DataTransfer;

describe('ActivityActionCard', () => {
    it('renders base layout with minimal props', () => {
        render(<ActivityActionCard {...baseProps} />);
        expect(screen.getByText('Raccolta Legna')).toBeInTheDocument();
        expect(screen.getByText(/Elapsed/)).toHaveTextContent('Elapsed 00:24');
        expect(screen.getByText(/Remaining/)).toHaveTextContent('Remaining 01:36');
    });

    it('exposes drop state through data attribute', () => {
        render(<ActivityActionCard {...baseProps} dropState="invalid" />);
        const card = screen.getByTestId('activity-risk-stripe').closest('[data-slot-id]');
        expect(card).toHaveAttribute('data-drop-state', 'invalid');
    });

    it('fires click handler when provided', () => {
        const handleClick = vi.fn();
        render(<ActivityActionCard {...baseProps} onClick={handleClick} />);
        fireEvent.click(screen.getByText('Raccolta Legna'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('invokes onWorkerDrop with resident id from drag payload', () => {
        const handleDrop = vi.fn();
        render(<ActivityActionCard {...baseProps} onWorkerDrop={handleDrop} />);
        const card = screen.getByText('Raccolta Legna').closest('[data-slot-id="slot-1"]');
        expect(card).not.toBeNull();
        const transfer = createDataTransfer({ [RESIDENT_DRAG_MIME]: 'resident-9' });
        fireEvent.dragOver(card!, { dataTransfer: transfer, preventDefault: () => {} });
        fireEvent.drop(card!, { dataTransfer: transfer, preventDefault: () => {} });
        expect(handleDrop).toHaveBeenCalledWith('resident-9');
    });

    it('renders separate risk stripe segments proportional to injury/death percentages', () => {
        render(<ActivityActionCard {...baseProps} riskPercentages={{ injury: 60, death: 20 }} />);
        const stripe = screen.getByTestId('activity-risk-stripe');

        // Check data attributes are preserved
        expect(stripe).toHaveAttribute('data-injury-percent', '60');
        expect(stripe).toHaveAttribute('data-death-percent', '20');
        expect(stripe).toHaveAttribute('data-has-risk', 'true');

        // Check death segment (red, 20% height)
        const deathSegment = screen.getByTestId('activity-risk-stripe').querySelector('[data-segment="death"]');
        expect(deathSegment).toBeInTheDocument();
        expect(deathSegment).toHaveClass('bg-red-500/95');
        expect(deathSegment).toHaveStyle('height: 20%');

        // Check injury segment (yellow, 40% height = 60% - 20%)
        const injurySegment = screen.getByTestId('activity-risk-stripe').querySelector('[data-segment="injury"]');
        expect(injurySegment).toBeInTheDocument();
        expect(injurySegment).toHaveClass('bg-yellow-500/95');
        expect(injurySegment).toHaveStyle('height: 40%');

        // Check safe segment (gray, 40% height = 100% - 60%)
        const safeSegment = screen.getByTestId('activity-risk-stripe').querySelector('[data-segment="safe"]');
        expect(safeSegment).toBeInTheDocument();
        expect(safeSegment).toHaveClass('bg-slate-400/18');
        expect(safeSegment).toHaveStyle('height: 40%');
    });

    it('prefers provided riskStripeMetrics over raw percentages when rendering stripes', () => {
        const customMetrics = {
            injuryPercent: 80,
            deathPercent: 25,
            injuryOnlyHeight: 55,
            safeHeight: 20,
            hasRisk: true,
            style: {
                background: 'linear-gradient(to top, red, yellow)',
                boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            },
            segments: {
                deathHeightPercent: 25,
                injuryHeightPercent: 55,
                safeHeightPercent: 20,
            },
        };
        render(
            <ActivityActionCard
                {...baseProps}
                riskPercentages={{ injury: 10, death: 2 }}
                riskStripeMetrics={customMetrics}
            />,
        );

        const stripe = screen.getByTestId('activity-risk-stripe');
        expect(stripe).toHaveAttribute('data-injury-percent', '80');
        expect(stripe).toHaveAttribute('data-death-percent', '25');
        expect(stripe).toHaveAttribute('data-has-risk', 'true');
    });
});
