import React from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelShell } from './PanelShell';
import type { Panel, PanelSize } from './store/panelsTypes';

/**
 * V9PanelShell Props
 * 
 * Wrapper component props for V9-styled panel shell
 */
export interface V9PanelShellProps {
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
  /** Whether panel is active (for visual state) */
  isActive?: boolean;
}

/**
 * V9PanelShell Component
 * 
 * Wrapper around PanelShell that applies V9 aesthetics using wanderlustTokens.css.
 * Uses CSS variables for colors, borders, shadows, and typography.
 * Wraps PanelShell and passes all necessary props.
 * 
 * @param panel - Panel data from store
 * @param children - Panel content to render
 * @param onResize - Callback when panel is resized
 * @param onClose - Callback when panel is closed
 * @param dragHandle - Optional custom drag handle component
 * @param className - Optional additional CSS classes
 * @param disabled - Whether drag is disabled
 * @param isActive - Whether panel is active (for visual state)
 */
export function V9PanelShell({
  panel,
  children,
  onResize,
  onClose,
  dragHandle,
  className = '',
  disabled = false,
  isActive = false,
}: V9PanelShellProps) {
  const { t } = useTranslation('common');

  const panelStyle = {
    backgroundColor: 'var(--panel-bg)',
    border: '1px solid var(--panel-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-medium)',
    color: 'var(--t1)',
  };

  const headerStyle = {
    backgroundColor: 'var(--raised)',
    borderBottom: '1px solid var(--panel-border)',
    padding: '12px 16px',
    borderTopLeftRadius: 'var(--radius-md)',
    borderTopRightRadius: 'var(--radius-md)',
  };

  const titleStyle = {
    color: 'var(--t1)',
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
  };

  const dragHandleStyle = {
    color: 'var(--t2)',
    cursor: disabled ? 'default' : 'move',
    userSelect: 'none' as const,
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    transition: 'background-color 180ms ease',
  };

  const activeState = isActive ? {
    borderColor: 'var(--acc-primary)',
    boxShadow: 'var(--shadow-gold)',
  } : {};

  const customDragHandle = dragHandle || (
    <div style={dragHandleStyle} className="v9-panel-drag-handle">
      {t('designSystem.panel.dragHandle', '⋮⋮')}
    </div>
  );

  return (
    <PanelShell
      panel={panel}
      onResize={onResize}
      onClose={onClose}
      dragHandle={customDragHandle}
      className={`v9-panel-shell ${className}`}
      disabled={disabled}
    >
      <div
        className="v9-panel-content"
        style={{
          ...panelStyle,
          ...activeState,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        data-testid={`v9-panel-${panel.id}`}
      >
        {/* Header */}
        <div
          className="v9-panel-header"
          style={headerStyle}
          data-testid={`v9-panel-header-${panel.id}`}
        >
          <h3 style={titleStyle} data-testid={`v9-panel-title-${panel.id}`}>
            {panel.title}
          </h3>
        </div>

        {/* Content */}
        <div
          className="v9-panel-body"
          style={{
            flex: 1,
            padding: '16px',
            overflow: 'auto',
          }}
          data-testid={`v9-panel-body-${panel.id}`}
        >
          {children}
        </div>
      </div>
    </PanelShell>
  );
}
