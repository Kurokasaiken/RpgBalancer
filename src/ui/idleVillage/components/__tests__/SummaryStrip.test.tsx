import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryStrip from '../SummaryStrip';

describe('SummaryStrip', () => {
  it('renders resource pills with correct values', () => {
    render(
      <SummaryStrip
        gold={150}
        food={75}
        population={12}
      />
    );

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('🪙')).toBeInTheDocument();
    expect(screen.getByText('🍖')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <SummaryStrip
        gold={0}
        food={0}
        population={0}
        className="custom-class"
      />
    );

    const container = screen.getByText('🪙').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });
});
