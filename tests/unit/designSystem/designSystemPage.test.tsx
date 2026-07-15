import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DesignSystemPage from '@/pages/design-system';

/**
 * Smoke test per DesignSystemPage
 * Verifica che la pagina renderizzi correttamente con tutte le 5 sezioni
 */
describe('DesignSystemPage', () => {
  it('renders all 5 section titles', () => {
    render(<DesignSystemPage />);

    // Verifica che tutti i titoli delle sezioni siano presenti
    expect(screen.getByTestId('section-tokens')).toBeDefined();
    expect(screen.getByTestId('section-panels')).toBeDefined();
    expect(screen.getByTestId('section-store')).toBeDefined();
    expect(screen.getByTestId('section-shell')).toBeDefined();
    expect(screen.getByTestId('section-integration')).toBeDefined();
  });

  it('renders placeholder content for each section', () => {
    render(<DesignSystemPage />);

    // Verifica che il contenuto placeholder sia presente per le sezioni non implementate
    expect(screen.getByTestId('section-panels-content').textContent).toMatch(/work in progress/i);
    expect(screen.getByTestId('section-store-content').textContent).toMatch(/work in progress/i);
    expect(screen.getByTestId('section-shell-content').textContent).toMatch(/work in progress/i);
    expect(screen.getByTestId('section-integration-content').textContent).toMatch(/work in progress/i);
  });

  it('renders token swatches in Tokens section', () => {
    render(<DesignSystemPage />);

    // Verifica che i token swatch siano presenti
    const swatchGrids = screen.getAllByTestId('token-swatch-grid');
    expect(swatchGrids.length).toBeGreaterThan(0);
    expect(screen.getByTestId('token-swatch-void')).toBeDefined();
    expect(screen.getByTestId('token-swatch-abyss')).toBeDefined();
    expect(screen.getByTestId('token-swatch-acc-primary')).toBeDefined();
  });

  it('renders page header with title', () => {
    render(<DesignSystemPage />);

    // Verifica che l'header sia presente
    expect(screen.getByText(/design system reference/i)).toBeDefined();
  });

  it('uses observatory-page class for Gilded Observatory theme', () => {
    const { container } = render(<DesignSystemPage />);

    // Verifica che la classe observatory-page sia applicata
    const page = container.querySelector('.observatory-page');
    expect(page).toBeDefined();
  });
});
