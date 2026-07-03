/**
 * WanderlustStatBar Test Suite
 * 
 * Tests for the material-style stat bar component including:
 * - Variant rendering (hp, stamina, fatigue)
 * - Size variations (sm, md, lg)
 * - Percentage calculation
 * - Value display toggle
 * - Color variants
 * 
 * @since 2026-01-29
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WanderlustStatBar } from '../../../src/ui/wanderlust-surface/layout/WanderlustStatBar';

describe('WanderlustStatBar', () => {
  describe('Basic Rendering', () => {
    it('renders label and track', () => {
      render(<WanderlustStatBar label="HP" value={30} maxValue={50} />);
      expect(screen.getByText('HP')).toBeInTheDocument();
    });

    it('renders value when showValue is true', () => {
      render(<WanderlustStatBar label="HP" value={30} maxValue={50} showValue />);
      expect(screen.getByText('30/50')).toBeInTheDocument();
    });

    it('hides value when showValue is false', () => {
      render(<WanderlustStatBar label="HP" value={30} maxValue={50} showValue={false} />);
      expect(screen.queryByText('30/50')).not.toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('calculates 100% when value equals maxValue', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={50} maxValue={50} />
      );
      const fill = container.querySelector('[style*="width: 100%"]');
      expect(fill).toBeInTheDocument();
    });

    it('calculates 50% when value is half of maxValue', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={25} maxValue={50} />
      );
      const fill = container.querySelector('[style*="width: 50%"]');
      expect(fill).toBeInTheDocument();
    });

    it('clamps to 0% when value is negative', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={-10} maxValue={50} />
      );
      const fill = container.querySelector('[style*="width: 0%"]');
      expect(fill).toBeInTheDocument();
    });

    it('clamps to 100% when value exceeds maxValue', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={75} maxValue={50} />
      );
      const fill = container.querySelector('[style*="width: 100%"]');
      expect(fill).toBeInTheDocument();
    });

    it('handles zero maxValue gracefully', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={0} />
      );
      const fill = container.querySelector('[style*="width: 0%"]');
      expect(fill).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders hp variant with emerald colors', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} variant="hp" />
      );
      const fill = container.querySelector('[style*="rgba(44,116,66"]');
      expect(fill).toBeInTheDocument();
    });

    it('renders stamina variant with amber colors', () => {
      const { container } = render(
        <WanderlustStatBar label="STA" value={25} maxValue={50} variant="stamina" />
      );
      const fill = container.querySelector('[style*="rgba(192,112,40"]');
      expect(fill).toBeInTheDocument();
    });

    it('renders fatigue variant with rose colors', () => {
      const { container } = render(
        <WanderlustStatBar label="FAT" value={40} maxValue={50} variant="fatigue" />
      );
      const fill = container.querySelector('[style*="rgba(138,56,56"]');
      expect(fill).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders sm size with small height', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} size="sm" />
      );
      const track = container.querySelector('[style*="height: 6px"]');
      expect(track).toBeInTheDocument();
    });

    it('renders md size with medium height', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} size="md" />
      );
      const track = container.querySelector('[style*="height: 8px"]');
      expect(track).toBeInTheDocument();
    });

    it('renders lg size with large height', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} size="lg" />
      );
      const track = container.querySelector('[style*="height: 12px"]');
      expect(track).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom style', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} style={{ gap: '16px' }} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.gap).toBe('16px');
    });

    it('uses Wanderlust typography tokens', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} />
      );
      const label = container.querySelector('[style*="font-family"]');
      expect(label).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders tabular-nums for value display', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} showValue />
      );
      const value = container.querySelector('[style*="tabular-nums"]');
      expect(value).toBeInTheDocument();
    });

    it('uses white-space: nowrap for label', () => {
      const { container } = render(
        <WanderlustStatBar label="HP" value={30} maxValue={50} />
      );
      const label = container.querySelector('[style*="white-space: nowrap"]');
      expect(label).toBeInTheDocument();
    });
  });
});
