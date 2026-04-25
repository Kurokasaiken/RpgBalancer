/**
 * Seed Visualizer Component Test Suite
 * 
 * Tests for retro terminal-styled LCG seed visualizer UI component.
 * 
 * @module SeedVisualizer.test
 * @since 2026-01-11
 * @author Atlas-RNG
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SeedVisualizer } from '../../../src/ui/balancing/stressTesting/SeedVisualizer';

describe('SeedVisualizer', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<SeedVisualizer />);
      
      expect(screen.getByText(/LCG Seed Visualizer/i)).toBeInTheDocument();
      expect(screen.getByTestId('seed-visualizer')).toBeInTheDocument();
    });

    it('should render with custom initial seed', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      const input = screen.getByTestId('seed-visualizer-input') as HTMLInputElement;
      expect(input.value).toBe('12345');
    });

    it('should render with custom testId', () => {
      render(<SeedVisualizer testId="custom-visualizer" />);
      
      expect(screen.getByTestId('custom-visualizer')).toBeInTheDocument();
    });
  });

  describe('Seed Input', () => {
    it('should update seed on input change', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      const input = screen.getByTestId('seed-visualizer-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '54321' } });
      
      expect(input.value).toBe('54321');
    });

    it('should call onSeedChange callback', () => {
      const handleSeedChange = vi.fn();
      render(<SeedVisualizer initialSeed={12345} onSeedChange={handleSeedChange} />);
      
      const input = screen.getByTestId('seed-visualizer-input');
      fireEvent.change(input, { target: { value: '54321' } });
      
      expect(handleSeedChange).toHaveBeenCalledWith(54321);
    });

    it('should generate random seed on button click', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      const randomBtn = screen.getByTestId('seed-visualizer-random-btn');
      const input = screen.getByTestId('seed-visualizer-input') as HTMLInputElement;
      
      const initialValue = input.value;
      fireEvent.click(randomBtn);
      
      expect(input.value).not.toBe(initialValue);
    });
  });

  describe('Seed Representations', () => {
    it('should display original seed', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('should display normalized seed', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.getByText(/Normalized:/i)).toBeInTheDocument();
    });

    it('should display hexadecimal representation', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.getByText(/Hexadecimal:/i)).toBeInTheDocument();
      expect(screen.getByText(/0x/i)).toBeInTheDocument();
    });

    it('should display binary representation', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.getByText(/Binary:/i)).toBeInTheDocument();
    });
  });

  describe('Quality Score', () => {
    it('should display quality score', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.getByText(/Quality Score/i)).toBeInTheDocument();
      expect(screen.getByText(/%$/)).toBeInTheDocument();
    });

    it('should show quality score as percentage', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      const scoreText = screen.getByText(/%$/);
      const score = parseInt(scoreText.textContent || '0');
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Distribution Histogram', () => {
    it('should display distribution histogram', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.getByText(/Distribution/i)).toBeInTheDocument();
    });

    it('should show 10 buckets', () => {
      const { container } = render(<SeedVisualizer initialSeed={12345} />);
      
      const buckets = container.querySelectorAll('[title*="Bucket"]');
      expect(buckets.length).toBe(10);
    });
  });

  describe('Preview Values', () => {
    it('should display preview section', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.getByText(/Preview/i)).toBeInTheDocument();
      expect(screen.getByText(/first 20 values/i)).toBeInTheDocument();
    });

    it('should show 20 preview values', () => {
      const { container } = render(<SeedVisualizer initialSeed={12345} />);
      
      const previews = container.querySelectorAll('[class*="grid"] > div');
      expect(previews.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Advanced Diagnostics', () => {
    it('should not show diagnostics by default', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.queryByText(/Advanced Diagnostics/i)).not.toBeInTheDocument();
    });

    it('should show diagnostics when enabled', () => {
      render(<SeedVisualizer initialSeed={12345} showDiagnostics={true} />);
      
      expect(screen.getByText(/Advanced Diagnostics/i)).toBeInTheDocument();
    });

    it('should display distribution statistics', () => {
      render(<SeedVisualizer initialSeed={12345} showDiagnostics={true} />);
      
      expect(screen.getByText(/Mean:/i)).toBeInTheDocument();
      expect(screen.getByText(/Std Dev:/i)).toBeInTheDocument();
      expect(screen.getByText(/Min:/i)).toBeInTheDocument();
      expect(screen.getByText(/Max:/i)).toBeInTheDocument();
    });

    it('should display chi-squared test results', () => {
      render(<SeedVisualizer initialSeed={12345} showDiagnostics={true} />);
      
      expect(screen.getByText(/Chi-Squared/i)).toBeInTheDocument();
      expect(screen.getByText(/Statistic:/i)).toBeInTheDocument();
    });

    it('should display reproducibility status', () => {
      render(<SeedVisualizer initialSeed={12345} showDiagnostics={true} />);
      
      expect(screen.getByText(/Reproducibility/i)).toBeInTheDocument();
      expect(screen.getByText(/REPRODUCIBLE/i)).toBeInTheDocument();
    });

    it('should display performance metrics', () => {
      render(<SeedVisualizer initialSeed={12345} showDiagnostics={true} />);
      
      expect(screen.getByText(/Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/Generation Time:/i)).toBeInTheDocument();
      expect(screen.getByText(/Throughput:/i)).toBeInTheDocument();
    });

    it('should allow changing sample count', () => {
      render(<SeedVisualizer initialSeed={12345} showDiagnostics={true} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      
      fireEvent.change(slider, { target: { value: '50000' } });
      expect(screen.getByText(/50,000/)).toBeInTheDocument();
    });
  });

  describe('Seed Comparison', () => {
    it('should not show comparison by default', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      expect(screen.queryByText(/Seed Comparison/i)).not.toBeInTheDocument();
    });

    it('should show comparison when enabled', () => {
      render(<SeedVisualizer initialSeed={12345} enableComparison={true} />);
      
      expect(screen.getByText(/Seed Comparison/i)).toBeInTheDocument();
    });

    it('should have comparison input field', () => {
      render(<SeedVisualizer initialSeed={12345} enableComparison={true} />);
      
      const compareInput = screen.getByTestId('seed-visualizer-compare-input');
      expect(compareInput).toBeInTheDocument();
    });

    it('should show comparison results when compare seed is entered', () => {
      render(<SeedVisualizer initialSeed={12345} enableComparison={true} />);
      
      const compareInput = screen.getByTestId('seed-visualizer-compare-input');
      fireEvent.change(compareInput, { target: { value: '54321' } });
      
      expect(screen.getByText(/Correlation:/i)).toBeInTheDocument();
      expect(screen.getByText(/Divergence Point:/i)).toBeInTheDocument();
    });
  });

  describe('Retro Styling', () => {
    it('should have retro terminal styling classes', () => {
      const { container } = render(<SeedVisualizer initialSeed={12345} />);
      
      const visualizer = container.querySelector('.seed-visualizer');
      expect(visualizer).toHaveClass('font-mono');
      expect(visualizer).toHaveClass('bg-slate-900');
      expect(visualizer).toHaveClass('text-green-400');
    });

    it('should have green border styling', () => {
      const { container } = render(<SeedVisualizer initialSeed={12345} />);
      
      const visualizer = container.querySelector('.seed-visualizer');
      expect(visualizer).toHaveClass('border-green-600');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      const input = screen.getByTestId('seed-visualizer-input');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should have focusable controls', () => {
      render(<SeedVisualizer initialSeed={12345} />);
      
      const input = screen.getByTestId('seed-visualizer-input');
      const randomBtn = screen.getByTestId('seed-visualizer-random-btn');
      
      expect(input).not.toHaveAttribute('disabled');
      expect(randomBtn).not.toHaveAttribute('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative seeds', () => {
      render(<SeedVisualizer initialSeed={-12345} />);
      
      const input = screen.getByTestId('seed-visualizer-input') as HTMLInputElement;
      expect(input.value).toBe('-12345');
    });

    it('should handle zero seed', () => {
      render(<SeedVisualizer initialSeed={0} />);
      
      const input = screen.getByTestId('seed-visualizer-input') as HTMLInputElement;
      expect(input.value).toBe('0');
    });

    it('should handle very large seeds', () => {
      const largeSeed = 4294967295;
      render(<SeedVisualizer initialSeed={largeSeed} />);
      
      const input = screen.getByTestId('seed-visualizer-input') as HTMLInputElement;
      expect(input.value).toBe(largeSeed.toString());
    });
  });
});
