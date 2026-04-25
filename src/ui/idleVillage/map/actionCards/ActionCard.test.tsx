import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActionCard } from './ActionCard';

describe('ActionCard', () => {
    afterEach(() => {
        cleanup();
    });
    const defaultProps = {
        label: 'Test Action',
        icon: <span>Test Icon</span>,
        subtitle: 'Test Subtitle',
        helperText: 'Test helper',
        progressFraction: 0.5,
        elapsedSeconds: 30,
        totalDurationSeconds: 60,
        isPlaying: true,
        variant: 'solar' as const,
        metrics: [
            { label: 'Metric 1', value: 'Value 1' },
            { label: 'Metric 2', value: 'Value 2' },
        ],
        onToggle: vi.fn(),
        dataTestId: 'action-card-test',
    };

    const renderCard = (overrideProps = {}) => render(<ActionCard {...defaultProps} {...overrideProps} />);

    const getCard = () => screen.getByTestId('action-card-test');

    const getStatCard = (label: string): HTMLDivElement => {
        const labelElements = within(getCard()).getAllByText(label);
        const targetLabel = labelElements.find((element) => element.tagName.toLowerCase() === 'dt') ?? labelElements[0];
        const container = targetLabel?.closest('div');
        if (!container) {
            throw new Error(`Unable to find stat card for label "${label}"`);
        }
        return container as HTMLDivElement;
    };

    const expectStatValue = (label: string, matcher: string | RegExp) => {
        const statCard = getStatCard(label);
        expect(within(statCard).getByText(matcher)).toBeInTheDocument();
    };

    const getMedallion = (): HTMLElement => within(getCard()).getByRole('button');

    it('should render correctly with all props', () => {
        renderCard({ hideHeader: false });

        expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
        expect(screen.getByText('Test Action')).toBeInTheDocument();
        expect(screen.getByText('Test helper')).toBeInTheDocument();
        expectStatValue('Progress', /50\s*%/);
        expectStatValue('Elapsed', '30s');
        expectStatValue('Durata', '01:00');
        expect(screen.getByText('Live')).toBeInTheDocument();
        expect(screen.getByText('Value 1')).toBeInTheDocument();
        expect(screen.getByText('Metric 2')).toBeInTheDocument();
        expect(screen.getByText('Value 2')).toBeInTheDocument();
        expect(getMedallion()).toBeInTheDocument();
    });

    it('should expose Live/Idle status based on playing flag', () => {
        const { rerender } = renderCard({ isPlaying: true });
        expect(screen.getByText('Live')).toBeInTheDocument();

        rerender(<ActionCard {...defaultProps} isPlaying={false} />);
        expect(screen.getByText('Idle')).toBeInTheDocument();
    });

    it('should call onToggle when button is clicked', () => {
        const mockToggle = vi.fn();
        renderCard({ onToggle: mockToggle });

        const button = getMedallion();
        fireEvent.click(button);

        expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('prefers medallion click handler and respects preventDefault', () => {
        const onToggle = vi.fn();
        const onMedallionClick = vi.fn((event: MouseEvent) => {
            event.preventDefault();
        });

        renderCard({ onToggle, onMedallionClick });

        fireEvent.click(getMedallion());

        expect(onMedallionClick).toHaveBeenCalledTimes(1);
        expect(onToggle).not.toHaveBeenCalled();
    });

    it('falls back to onToggle when medallion click allows default', () => {
        const onToggle = vi.fn();
        const onMedallionClick = vi.fn();

        renderCard({ onToggle, onMedallionClick });

        fireEvent.click(getMedallion());

        expect(onMedallionClick).toHaveBeenCalledTimes(1);
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard activation for medallion', () => {
        const onToggle = vi.fn();
        renderCard({ onToggle });

        const medallion = getMedallion();
        fireEvent.keyDown(medallion, { key: 'Enter' });
        fireEvent.keyDown(medallion, { key: ' ' });

        expect(onToggle).toHaveBeenCalledTimes(2);
    });

    it('should handle zero progress', () => {
        renderCard({ progressFraction: 0, elapsedSeconds: 0 });
        expectStatValue('Progress', /0\s*%/);
        expectStatValue('Elapsed', '0s');
    });

    it('should handle full progress', () => {
        renderCard({ progressFraction: 1, elapsedSeconds: 60 });
        expectStatValue('Progress', /100\s*%/);
        expectStatValue('Elapsed', '01:00');
        expectStatValue('Durata', '01:00');
    });

    it('should format large seconds correctly', () => {
        renderCard({ elapsedSeconds: 3661, totalDurationSeconds: 7200 });

        expectStatValue('Elapsed', /1:01:01/);
        expectStatValue('Durata', /2:00:00/);
    });

    it('should handle empty metrics', () => {
        renderCard({ metrics: [] });
        expect(screen.queryByText('Metric 1')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const { container } = renderCard({ className: 'custom-class' });
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('formats countdown with shared mini-card helper', () => {
        renderCard({ elapsedSeconds: 0, totalDurationSeconds: 6000 });
        expect(screen.getByText('100:00')).toBeInTheDocument();
    });

    it('uses custom countdown formatter when provided', () => {
        const formatter = vi.fn(() => 'CUSTOM');
        renderCard({
            elapsedSeconds: 20,
            totalDurationSeconds: 80,
            countdownFormatter: formatter,
        });

        expect(formatter).toHaveBeenCalledWith(60);
        expect(screen.getByText('CUSTOM')).toBeInTheDocument();
    });

    it('renders chromeless medallion wrapper when requested', () => {
        renderCard({ chromeless: true });

        const wrapper = screen.getByTestId('action-card-test');
        // Chromeless mode renders the medallion directly without article wrapper
        expect(wrapper.tagName.toLowerCase()).toBe('div');
        expect(wrapper.querySelector('article')).toBeNull();
    });

    it('renders drop-state halo for valid/invalid states', () => {
        const { rerender } = renderCard({ dropState: 'valid' });
        expect(getMedallion()).toHaveClass('ring-emerald-400/70');

        rerender(<ActionCard {...defaultProps} dropState="invalid" />);
        expect(getMedallion()).toHaveClass('ring-white/20');
    });

    it('shows proportional risk stripes when percentages provided', () => {
        renderCard({ injuryPercentage: 40, deathPercentage: 20 });
        const stripe = screen.getByTestId('action-card-test-risk');
        const injurySegment = within(stripe).getByTestId('action-card-test-risk-injury');
        const deathSegment = within(stripe).getByTestId('action-card-test-risk-death');
        expect(injurySegment).toHaveStyle({ height: '40%' });
        expect(deathSegment).toHaveStyle({ height: '20%' });
    });
});
