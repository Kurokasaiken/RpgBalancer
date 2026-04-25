import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DayNightActionCard from './DayNightActionCard';

describe('DayNightActionCard', () => {
    const defaultProps = {
        phaseIcon: <span aria-hidden>☀️</span>,
        isPlaying: true,
        progressFraction: 0.5,
        totalSeconds: 120,
        variant: 'solar' as const,
        onToggle: vi.fn(),
    };

    it('renders phase icon and countdown', () => {
        render(<DayNightActionCard {...defaultProps} />);

        expect(screen.getByText('☀️')).toBeInTheDocument();
        expect(screen.getByText('01:00')).toBeInTheDocument();
    });

    it('shows pause icon when paused', () => {
        render(<DayNightActionCard {...defaultProps} isPlaying={false} />);

        expect(screen.getByTestId('day-night-pause-icon')).toBeInTheDocument();
    });

    it('calls onToggle when pressed', () => {
        const handleToggle = vi.fn();
        render(<DayNightActionCard {...defaultProps} onToggle={handleToggle} />);

        fireEvent.click(screen.getByRole('button'));
        expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('formats countdown with three digits when minutes exceed 99', () => {
        render(<DayNightActionCard {...defaultProps} progressFraction={0} totalSeconds={60000} />);

        expect(screen.getByText('1000:00')).toBeInTheDocument();
    });
});

