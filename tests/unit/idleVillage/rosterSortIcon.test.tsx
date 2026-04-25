import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RosterSortIcon } from '@/ui/idleVillage/components/RosterSortIcon';
import type { RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';

describe('RosterSortIcon', () => {
  it('should render with correct tooltip for ascending order', () => {
    const mockOnChange = vi.fn();
    render(
      <RosterSortIcon 
        currentMode="name-asc" 
        onSortModeChange={mockOnChange}
      />
    );

    const button = screen.getByTestId('roster-sort-icon');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Sort: Name A → Z (click to reverse)');
    expect(button).toHaveAttribute('aria-label', 'Sort: Name A → Z (click to reverse)');
  });

  it('should render with correct tooltip for descending order', () => {
    const mockOnChange = vi.fn();
    render(
      <RosterSortIcon 
        currentMode="name-desc" 
        onSortModeChange={mockOnChange}
      />
    );

    const button = screen.getByTestId('roster-sort-icon');
    expect(button).toHaveAttribute('title', 'Sort: Name Z → A (click to reverse)');
    expect(button).toHaveAttribute('aria-label', 'Sort: Name Z → A (click to reverse)');
  });

  it('should toggle from ascending to descending when clicked', () => {
    const mockOnChange = vi.fn();
    render(
      <RosterSortIcon 
        currentMode="name-asc" 
        onSortModeChange={mockOnChange}
      />
    );

    const button = screen.getByTestId('roster-sort-icon');
    fireEvent.click(button);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('name-desc');
  });

  it('should toggle from descending to ascending when clicked', () => {
    const mockOnChange = vi.fn();
    render(
      <RosterSortIcon 
        currentMode="name-desc" 
        onSortModeChange={mockOnChange}
      />
    );

    const button = screen.getByTestId('roster-sort-icon');
    fireEvent.click(button);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('name-asc');
  });

  it('should apply custom className', () => {
    const mockOnChange = vi.fn();
    render(
      <RosterSortIcon 
        currentMode="name-asc" 
        onSortModeChange={mockOnChange}
        className="custom-class"
      />
    );

    const button = screen.getByTestId('roster-sort-icon');
    expect(button).toHaveClass('custom-class');
  });

  it('should render SVG icon with correct rotation for ascending', () => {
    const mockOnChange = vi.fn();
    render(
      <RosterSortIcon 
        currentMode="name-asc" 
        onSortModeChange={mockOnChange}
      />
    );

    const svg = screen.getByTestId('roster-sort-icon').querySelector('svg');
    expect(svg).toBeInTheDocument();
    // For ascending, no rotation class should be applied
    expect(svg).not.toHaveClass('rotate-180');
  });

  it('should render SVG icon with rotation for descending', () => {
    const mockOnChange = vi.fn();
    render(
      <RosterSortIcon 
        currentMode="name-desc" 
        onSortModeChange={mockOnChange}
      />
    );

    const svg = screen.getByTestId('roster-sort-icon').querySelector('svg');
    expect(svg).toBeInTheDocument();
    // For descending, rotation class should be applied
    expect(svg).toHaveClass('rotate-180');
  });
});
