/**
 * Style Lab Demo Smoke Tests
 *
 * Basic smoke tests for StyleLabDemo component and subcomponents.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StyleLabDemo } from '@/ui/styleLab/StyleLabDemo';
import { DragDropDemo } from '@/ui/styleLab/components/DragDropDemo';
import { ButtonDemo } from '@/ui/styleLab/components/ButtonDemo';
import { defaultDemoConfig } from '@/ui/styleLab/config/demoConfig';

const persistenceMocks = vi.hoisted(() => {
  const saveDataMock = vi.fn();
  const loadDataMock = vi.fn((key: string, fallback: unknown) => {
    switch (key) {
      case 'style-lab-demo-state':
        return Promise.resolve(null);
      case 'style-lab-demo-config':
        return Promise.resolve(null);
      case 'stylelab_active_preset':
        return Promise.resolve('minimalFrontier');
      case 'stylelab_custom_presets':
        return Promise.resolve([]);
      default:
        return Promise.resolve(fallback ?? null);
    }
  });

  return { saveDataMock, loadDataMock };
});
const { saveDataMock, loadDataMock } = persistenceMocks;

const openControlsPanel = async () => {
  const toggleButton = await screen.findByTestId('style-lab-controls-toggle');
  if (toggleButton.getAttribute('aria-label') !== 'Collapse controls panel') {
    await userEvent.click(toggleButton);
    await waitFor(() => expect(toggleButton).toHaveAttribute('aria-label', 'Collapse controls panel'));
  }

  const controlsPanel = await screen.findByTestId('style-lab-controls-panel');
  await waitFor(() => expect(controlsPanel).toHaveAttribute('data-visible', 'true'));
  return controlsPanel;
};

// Mock Style Lab tokens
vi.mock('@/ui/styleLab/hooks/useStyleLabTokens', () => ({
  useStyleLabTokens: () => ({
    preset: {
      name: 'Test Preset',
      surfaces: {
        panel: {
          background: '#1a1a1a',
          color: '#ffffff',
          borderColor: '#333333',
        },
        card: {
          background: '#2a2a2a',
          color: '#ffffff',
          borderColor: '#444444',
        },
      },
    },
    modifierScopes: {
      GLOBAL: {
        background: '#3b82f6',
        border: '#60a5fa',
        foreground: '#ffffff',
        glow: '#93c5fd',
      },
      QUEST: {
        background: '#10b981',
        border: '#34d399',
        foreground: '#ffffff',
        glow: '#6ee7b7',
      },
    },
    modifierStatus: {
      active: {
        background: '#22c55e',
        border: '#4ade80',
        foreground: '#ffffff',
      },
    },
  }),
}));

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: persistenceMocks.saveDataMock,
  loadData: persistenceMocks.loadDataMock,
}));

describe('StyleLabDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveDataMock.mockClear();
    loadDataMock.mockClear();
  });

  it('renders without crashing', async () => {
    render(<StyleLabDemo />);

    expect(await screen.findByTestId('style-lab-demo-root')).toBeInTheDocument();
    expect(await screen.findByText('Slider Demo')).toBeInTheDocument();
  });

  it('renders component selector', async () => {
    render(<StyleLabDemo />);

    expect(await screen.findByRole('button', { name: 'Slider' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Toggle Switch' })).toBeInTheDocument();
  });

  it('renders style preset controls', async () => {
    render(<StyleLabDemo />);

    await openControlsPanel();
    expect(await screen.findByText('Style Preset')).toBeInTheDocument();
    expect(await screen.findByTestId('style-lab-preset-button-minimalFrontier')).toBeInTheDocument();
  });

  it('renders game feel controls', async () => {
    render(<StyleLabDemo />);

    await openControlsPanel();
    expect(await screen.findByText('Game Feel')).toBeInTheDocument();
    expect(screen.getByText(/Spring Stiffness/i)).toBeInTheDocument();
  });

  it('renders action buttons', async () => {
    render(<StyleLabDemo />);

    await openControlsPanel();
    expect(await screen.findByTestId('style-lab-reset-button')).toBeInTheDocument();
    expect(await screen.findByTestId('style-lab-export-button')).toBeInTheDocument();
  });

  it('hydrates and persists unified bridge snapshot', async () => {
    render(<StyleLabDemo />);

    await waitFor(() => {
      expect(loadDataMock).toHaveBeenCalledWith('style-lab-demo-state', null);
      expect(saveDataMock).toHaveBeenCalledWith(
        'style-lab-demo-state',
        expect.objectContaining({
          presetKind: 'builtin',
          presetId: 'minimalFrontier',
          basePresetId: 'minimalFrontier',
          demoConfig: expect.objectContaining({
            meta: expect.objectContaining({ presetId: 'minimalFrontier', isCustom: false }),
          }),
          physicsConfig: expect.objectContaining({}),
          styleOverride: null,
          updatedAt: expect.any(Number),
        }),
      );
    });
  });
});

describe('DragDropDemo', () => {
  it('renders without crashing', () => {
    render(
      <DragDropDemo
        config={defaultDemoConfig.dragDrop}
        isActive={true}
      />,
    );

    expect(screen.getByText('Drag & Drop Demo')).toBeInTheDocument();
    expect(screen.getByText('Drag Me')).toBeInTheDocument();
    expect(screen.getByText('Drop Zone')).toBeInTheDocument();
  });

  it('shows correct status messages', () => {
    render(
      <DragDropDemo
        config={defaultDemoConfig.dragDrop}
        isActive={true}
      />,
    );

    expect(screen.getByText('Ready to demonstrate drag & drop')).toBeInTheDocument();
  });

  it('renders accessibility instructions when inactive', () => {
    render(
      <DragDropDemo
        config={defaultDemoConfig.dragDrop}
        isActive={false}
      />,
    );

    expect(
      screen.getByText(/To pick up a draggable item, press the space bar/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/While dragging, use the arrow keys to move the item/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Press space again to drop the item/i),
    ).toBeInTheDocument();
  });
});

describe('ButtonDemo', () => {
  it('renders without crashing', () => {
    render(
      <ButtonDemo
        config={defaultDemoConfig.button}
        isActive={true}
      />,
    );

    expect(screen.getByText('Button Demo')).toBeInTheDocument();
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('shows correct status messages', () => {
    render(
      <ButtonDemo
        config={defaultDemoConfig.button}
        isActive={true}
      />,
    );

    expect(screen.getByText('Ready to demonstrate button interactions')).toBeInTheDocument();
  });

  it('renders configuration info', () => {
    render(
      <ButtonDemo
        config={defaultDemoConfig.button}
        isActive={false}
      />,
    );

    // Should show config info when not active
    expect(screen.getByText(/Squash Factor:/)).toBeInTheDocument();
    expect(screen.getByText(/Hold Duration:/)).toBeInTheDocument();
    expect(screen.getByText(/Auto Loop:/)).toBeInTheDocument();
  });
});
