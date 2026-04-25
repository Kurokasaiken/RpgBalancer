import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResourcePanel } from './ResourcePanel';

describe('ResourcePanel', () => {
    const defaultItems = [
        { label: 'Cibo', value: 10, accentClass: 'text-amber-200', borderClass: 'border-amber-300/40' },
        { label: 'Oro', value: 100, accentClass: 'text-yellow-200', borderClass: 'border-yellow-200/40' },
        { label: 'Giorno', value: 0, accentClass: 'text-cyan-200', borderClass: 'border-cyan-300/40' },
    ];

    it('should render correctly with items', () => {
        render(<ResourcePanel items={defaultItems} />);

        expect(screen.getByText('Resources')).toBeInTheDocument();
        expect(screen.getByText('Cibo')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('Oro')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Giorno')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle empty items', () => {
        render(<ResourcePanel items={[]} />);
        expect(screen.getByText('Resources')).toBeInTheDocument();
        expect(screen.queryByText('Cibo')).not.toBeInTheDocument();
    });

    it('should handle string values', () => {
        const itemsWithString = [
            { label: 'Test', value: 'String Value', accentClass: 'text-red-200', borderClass: 'border-red-300/40' },
        ];
        render(<ResourcePanel items={itemsWithString} />);
        expect(screen.getByText('String Value')).toBeInTheDocument();
    });

    it('should apply accent and border classes', () => {
        render(<ResourcePanel items={defaultItems} />);
        const ciboDiv = screen.getByText('10').closest('div');
        expect(ciboDiv).toHaveClass('border-amber-300/40');
        const ciboValue = screen.getByText('10');
        expect(ciboValue).toHaveClass('text-amber-200');
    });
});
