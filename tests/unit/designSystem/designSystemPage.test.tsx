import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DesignSystemPage from '@/pages/design-system';

/**
 * Smoke test per DesignSystemPage (UI Review Room)
 * Verifica le due superfici (Review Room / Advanced Lab), il preset switcher
 * skin-aware e i token live letti dal sistema skin.
 */
describe('DesignSystemPage', () => {
  it('renders inside a SkinScope (role-based skin inheritance)', () => {
    const { container } = render(<DesignSystemPage />);
    const scope = container.querySelector('.skin-scope');
    expect(scope).not.toBeNull();
  });

  it('renders Review Room sections', () => {
    render(<DesignSystemPage />);

    expect(screen.getByTestId('section-hero')).toBeDefined();
    expect(screen.getByTestId('section-matrix')).toBeDefined();
    expect(screen.getByTestId('section-production')).toBeDefined();
    expect(screen.getByTestId('section-patterns')).toBeDefined();
    expect(screen.getByTestId('section-visual-rules')).toBeDefined();
    expect(screen.getByTestId('section-interaction-patterns')).toBeDefined();
    expect(screen.getByTestId('section-components')).toBeDefined();
  });

  it('renders Advanced Lab sections (hidden until the Lab surface is active)', () => {
    render(<DesignSystemPage />);

    expect(screen.getByTestId('section-tokens')).toBeDefined();
    expect(screen.getByTestId('section-panels')).toBeDefined();
    expect(screen.getByTestId('section-store')).toBeDefined();
    expect(screen.getByTestId('section-shell')).toBeDefined();
    expect(screen.getByTestId('section-integration')).toBeDefined();

    const lab = screen.getByTestId('surface-lab-content');
    expect(lab.hidden).toBe(true);

    fireEvent.click(screen.getByTestId('surface-lab'));
    expect(screen.getByTestId('surface-lab-content').hidden).toBe(false);
    expect(screen.getByTestId('surface-review-content').hidden).toBe(true);
  });

  it('renders skin preset switcher with the base preset', () => {
    render(<DesignSystemPage />);

    expect(screen.getByTestId('preset-base')).toBeDefined();
  });

  it('renders live --skin-* token swatches (no hardcoded hex arrays)', () => {
    render(<DesignSystemPage />);

    const swatchGrids = screen.getAllByTestId('token-swatch-grid');
    expect(swatchGrids.length).toBeGreaterThan(0);
    // Token letti dal registry skinCssVariables, non da array locali
    expect(screen.getByTestId('token-swatch-skin-surface-base')).toBeDefined();
    expect(screen.getByTestId('token-swatch-skin-title-color')).toBeDefined();
    expect(screen.getByTestId('token-swatch-skin-btn-bg')).toBeDefined();
  });

  it('renders page header with title and manifesto', () => {
    render(<DesignSystemPage />);

    expect(screen.getByText(/design system reference/i)).toBeDefined();
    expect(screen.getByTestId('manifesto')).toBeDefined();
  });

  it('renders skin primitives in the Components section', () => {
    render(<DesignSystemPage />);

    expect(screen.getByTestId('components-buttons')).toBeDefined();
    expect(screen.getByTestId('components-signals')).toBeDefined();
    expect(screen.getByTestId('components-typography')).toBeDefined();
  });
});
