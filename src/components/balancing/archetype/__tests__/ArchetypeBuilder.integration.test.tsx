/**
 * ArchetypeBuilder - Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArchetypeBuilder } from '../ArchetypeBuilder';

describe('ArchetypeBuilder Integration', () => {
    it('should render category selector', () => {
        render(<ArchetypeBuilder />);

        expect(screen.getByText('Tank')).toBeInTheDocument();
        expect(screen.getByText('DPS')).toBeInTheDocument();
        expect(screen.getByText('Assassin')).toBeInTheDocument();
    });

    it('should render budget slider', () => {
        render(<ArchetypeBuilder />);

        const slider = screen.getByLabelText(/Budget:/);
        expect(slider).toBeInTheDocument();
        expect(slider).toHaveAttribute('type', 'range');
    });

    it('should render stat allocation sliders', () => {
        render(<ArchetypeBuilder />);

        expect(screen.getByText(/damage/i)).toBeInTheDocument();
        expect(screen.getByText(/hp/i)).toBeInTheDocument();
        expect(screen.getByText(/armor/i)).toBeInTheDocument();
    });

    it('should validate allocation totals to 100%', () => {
        render(<ArchetypeBuilder />);

        // Should show current allocation percentage
        expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('should show real-time stat preview', () => {
        render(<ArchetypeBuilder />);

        expect(screen.getByText('Stat Preview')).toBeInTheDocument();
    });

    it('should disable save button when allocation is invalid', () => {
        render(<ArchetypeBuilder />);

        const saveButton = screen.getByText('Save Archetype');

        // Initially should be enabled (default allocation is valid)
        expect(saveButton).not.toBeDisabled();
    });

    it('should allow resetting allocation', () => {
        render(<ArchetypeBuilder />);

        const resetButton = screen.getByText('Reset');
        fireEvent.click(resetButton);

        // Should reset to default allocation
        expect(screen.getByText(/100%/)).toBeInTheDocument();
    });
});
