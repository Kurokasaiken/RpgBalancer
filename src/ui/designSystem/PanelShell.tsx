import React from 'react';
import type { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import type { Panel, PanelSize } from './store/panelsTypes';

/**
 * PanelShell Props
 * 
 * Headless component props for draggable panel shell
 */
export interface PanelShellProps {
  /** Panel data from store */
  panel: Panel;
  /** Panel content to render */
  children: ReactNode;
  /** Callback when panel is resized */
  onResize?: (size: PanelSize) => void;
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Optional custom drag handle component */
  dragHandle?: ReactNode;
  /** Optional additional CSS classes */
  className?: string;
  /** Whether drag is disabled */
  disabled?: boolean;
}

/**
 * PanelShell Component
 * 
 * Headless draggable panel shell component using @dnd-kit.
 * Provides drag functionality, drag handle, and close action.
 * No hardcoded styles - uses CSS variables for positioning.
 * 
 * @param panel - Panel data from store
 * @param children - Panel content to render
 * @param onResize - Callback when panel is resized
 * @param onClose - Callback when panel is closed
 * @param dragHandle - Optional custom drag handle component
 * @param className - Optional additional CSS classes
 * @param disabled - Whether drag is disabled
 */
export function PanelShell({
  panel,
  children,
  onResize: _onResize,
  onClose,
  dragHandle,
  className = '',
  disabled = false,
}: PanelShellProps) {
  const { t } = useTranslation('common');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: panel.id,
    disabled,
  });

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        position: 'absolute' as const,
        left: panel.position.x,
        top: panel.position.y,
        width: panel.size.width,
        height: panel.size.height,
        opacity: isDragging ? 0.5 : 1,
        zIndex: panel.zIndex,
      }
    : {
        position: 'absolute' as const,
        left: panel.position.x,
        top: panel.position.y,
        width: panel.size.width,
        height: panel.size.height,
        zIndex: panel.zIndex,
      };

  const defaultDragHandle = (
    <div
      {...attributes}
      {...listeners}
      style={{
        cursor: disabled ? 'default' : 'move',
        userSelect: 'none',
      }}
      aria-label={t('designSystem.panel.dragToMove', 'Drag to move')}
      role="button"
      tabIndex={0}
    >
      {t('designSystem.panel.dragHandle', '⋮⋮')}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`panel-shell ${className}`}
      data-panel-id={panel.id}
      data-testid={`panel-shell-${panel.id}`}
    >
      {/* Drag Handle */}
      <div
        className="panel-shell__drag-handle"
        data-testid={`panel-drag-handle-${panel.id}`}
      >
        {dragHandle || defaultDragHandle}
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={handleClose}
          className="panel-shell__close-button"
          aria-label={t('designSystem.panel.close', 'Close panel')}
          data-testid={`panel-close-${panel.id}`}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            fontSize: '16px',
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      )}

      {/* Panel Content */}
      <div
        className="panel-shell__content"
        data-testid={`panel-content-${panel.id}`}
        style={{
          padding: '16px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
