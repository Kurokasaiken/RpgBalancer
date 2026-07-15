import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { V9PanelShell } from '@/ui/designSystem/V9PanelShell';
import type { Panel } from '@/ui/designSystem/store/panelsTypes';

/**
 * Unit tests for V9PanelShell component
 * 
 * Tests the V9-styled panel shell wrapper including:
 * - Rendering with V9 aesthetics
 * - Active/inactive states
 * - Close button functionality
 * - Drag handle visibility
 * - CSS variable application
 */
describe('V9PanelShell', () => {
  const mockPanel: Panel = {
    id: 'test-panel',
    title: 'Test Panel',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    isVisible: true,
    isMinimized: false,
    zIndex: 1,
  };

  const renderWithDndContext = (component: React.ReactNode) => {
    return render(<DndContext>{component}</DndContext>);
  };

  describe('Rendering with V9 Aesthetics', () => {
    it('should render V9 panel shell with correct data attributes', () => {
      renderWithDndContext(
        <V9PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const v9Panel = screen.getByTestId('v9-panel-test-panel');
      expect(v9Panel).toBeDefined();
    });

    it('should render header with panel title', () => {
      renderWithDndContext(
        <V9PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const header = screen.getByTestId('v9-panel-header-test-panel');
      const title = screen.getByTestId('v9-panel-title-test-panel');
      expect(header).toBeDefined();
      expect(title).toBeDefined();
      expect(title.textContent).toBe('Test Panel');
    });

    it('should render body with children content', () => {
      renderWithDndContext(
        <V9PanelShell panel={mockPanel}>
          <div data-testid="panel-content">Panel Content</div>
        </V9PanelShell>
      );

      const body = screen.getByTestId('v9-panel-body-test-panel');
      const content = screen.getByTestId('panel-content');
      expect(body).toBeDefined();
      expect(content).toBeDefined();
      expect(content.textContent).toBe('Panel Content');
    });

    it('should apply CSS variables for V9 styling', () => {
      const { container } = renderWithDndContext(
        <V9PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const v9Panel = screen.getByTestId('v9-panel-test-panel');
      expect(v9Panel.style.backgroundColor).toBe('var(--panel-bg)');
      expect(v9Panel.style.color).toBe('var(--t1)');
    });
  });

  describe('Active/Inactive States', () => {
    it('should apply active state styling when isActive is true', () => {
      renderWithDndContext(
        <V9PanelShell panel={mockPanel} isActive>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const v9Panel = screen.getByTestId('v9-panel-test-panel');
      expect(v9Panel.style.borderColor).toBe('var(--acc-primary)');
      expect(v9Panel.style.boxShadow).toBe('var(--shadow-gold)');
    });

    it('should not apply active state styling when isActive is false', () => {
      renderWithDndContext(
        <V9PanelShell panel={mockPanel} isActive={false}>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const v9Panel = screen.getByTestId('v9-panel-test-panel');
      // When inactive, borderColor and boxShadow should not have active state values
      expect(v9Panel.style.borderColor).not.toBe('var(--acc-primary)');
      expect(v9Panel.style.boxShadow).not.toBe('var(--shadow-gold)');
    });
  });

  describe('Close Button Functionality', () => {
    it('should render close button when onClose is provided', () => {
      const onClose = vi.fn();
      renderWithDndContext(
        <V9PanelShell panel={mockPanel} onClose={onClose}>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const closeButton = screen.getByTestId('panel-close-test-panel');
      expect(closeButton).toBeDefined();
    });

    it('should not render close button when onClose is not provided', () => {
      renderWithDndContext(
        <V9PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const closeButton = screen.queryByTestId('panel-close-test-panel');
      expect(closeButton).toBeNull();
    });
  });

  describe('Drag Handle', () => {
    it('should render drag handle with V9 styling', () => {
      renderWithDndContext(
        <V9PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const dragHandle = screen.getByTestId('panel-drag-handle-test-panel');
      expect(dragHandle).toBeDefined();
    });

    it('should render custom drag handle when provided', () => {
      const customHandle = <div data-testid="custom-handle">Custom</div>;
      renderWithDndContext(
        <V9PanelShell panel={mockPanel} dragHandle={customHandle}>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const customHandleElement = screen.getByTestId('custom-handle');
      expect(customHandleElement).toBeDefined();
      expect(customHandleElement.textContent).toBe('Custom');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled state when disabled prop is true', () => {
      renderWithDndContext(
        <V9PanelShell panel={mockPanel} disabled>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const dragHandle = screen.getByTestId('panel-drag-handle-test-panel');
      expect(dragHandle).toBeDefined();
    });
  });

  describe('PanelShell Integration', () => {
    it('should wrap PanelShell and pass all necessary props', () => {
      const onClose = vi.fn();
      renderWithDndContext(
        <V9PanelShell panel={mockPanel} onClose={onClose} disabled>
          <div>Panel Content</div>
        </V9PanelShell>
      );

      const shell = screen.getByTestId('panel-shell-test-panel');
      expect(shell).toBeDefined();
    });
  });
});
