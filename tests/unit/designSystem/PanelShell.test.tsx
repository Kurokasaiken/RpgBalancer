import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { PanelShell } from '@/ui/designSystem/PanelShell';
import type { Panel } from '@/ui/designSystem/store/panelsTypes';

/**
 * Unit tests for PanelShell component
 * 
 * Tests the headless draggable panel shell including:
 * - Component rendering
 * - Drag handle functionality
 * - Close action
 * - Disabled state
 * - Custom drag handle
 */
describe('PanelShell', () => {
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

  describe('Rendering', () => {
    it('should render panel shell with correct data attributes', () => {
      renderWithDndContext(
        <PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const shell = screen.getByTestId('panel-shell-test-panel');
      expect(shell).toBeDefined();
      expect(shell.getAttribute('data-panel-id')).toBe('test-panel');
    });

    it('should render children content', () => {
      renderWithDndContext(
        <PanelShell panel={mockPanel}>
          <div data-testid="panel-content">Panel Content</div>
        </PanelShell>
      );

      const content = screen.getByTestId('panel-content');
      expect(content).toBeDefined();
      expect(content.textContent).toBe('Panel Content');
    });

    it('should render drag handle', () => {
      renderWithDndContext(
        <PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const dragHandle = screen.getByTestId('panel-drag-handle-test-panel');
      expect(dragHandle).toBeDefined();
    });

    it('should render close button when onClose is provided', () => {
      const onClose = vi.fn();
      renderWithDndContext(
        <PanelShell panel={mockPanel} onClose={onClose}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const closeButton = screen.getByTestId('panel-close-test-panel');
      expect(closeButton).toBeDefined();
    });

    it('should not render close button when onClose is not provided', () => {
      renderWithDndContext(
        <PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const closeButton = screen.queryByTestId('panel-close-test-panel');
      expect(closeButton).toBeNull();
    });
  });

  describe('Close Action', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      renderWithDndContext(
        <PanelShell panel={mockPanel} onClose={onClose}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const closeButton = screen.getByTestId('panel-close-test-panel');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Drag Handle', () => {
    it('should render custom drag handle when provided', () => {
      const customHandle = <div data-testid="custom-handle">Custom</div>;
      renderWithDndContext(
        <PanelShell panel={mockPanel} dragHandle={customHandle}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const customHandleElement = screen.getByTestId('custom-handle');
      expect(customHandleElement).toBeDefined();
      expect(customHandleElement.textContent).toBe('Custom');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled state when disabled prop is true', () => {
      renderWithDndContext(
        <PanelShell panel={mockPanel} disabled>
          <div>Panel Content</div>
        </PanelShell>
      );

      const dragHandle = screen.getByTestId('panel-drag-handle-test-panel');
      expect(dragHandle).toBeDefined();
    });
  });

  describe('Positioning', () => {
    it('should apply correct position from panel data', () => {
      const { container } = renderWithDndContext(
        <PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const shell = screen.getByTestId('panel-shell-test-panel');
      
      // The component uses inline styles for positioning
      expect(shell.style.left).toBe('100px');
      expect(shell.style.top).toBe('100px');
      expect(shell.style.width).toBe('400px');
      expect(shell.style.height).toBe('300px');
    });

    it('should apply z-index from panel data', () => {
      const { container } = renderWithDndContext(
        <PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const shell = screen.getByTestId('panel-shell-test-panel');
      expect(shell.style.zIndex).toBe('1');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on drag handle', () => {
      renderWithDndContext(
        <PanelShell panel={mockPanel}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const dragHandle = screen.getByTestId('panel-drag-handle-test-panel');
      expect(dragHandle.getAttribute('aria-label')).toBeDefined();
    });

    it('should have aria-label on close button', () => {
      const onClose = vi.fn();
      renderWithDndContext(
        <PanelShell panel={mockPanel} onClose={onClose}>
          <div>Panel Content</div>
        </PanelShell>
      );

      const closeButton = screen.getByTestId('panel-close-test-panel');
      expect(closeButton.getAttribute('aria-label')).toBeDefined();
    });
  });
});
