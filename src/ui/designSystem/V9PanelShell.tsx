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
 * Wrapper around PanelShell styled exclusively with `--skin-` tokens
 * (skinCssVariables.ts), so it follows the active skin preset like every
 * other skin-aware component. No legacy `--panel-` or `--wl-` vocabulary.
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
    background: 'var(--skin-surface-bg)',
    border: '1px solid var(--skin-surface-border)',
    borderRadius: 'var(--skin-surface-radius)',
    boxShadow: 'var(--skin-drag-lift-shadow)',
    color: 'var(--skin-body-color)',
  };

  const headerStyle = {
    background: 'var(--skin-inset-bg)',
    borderBottom: '1px solid var(--skin-inset-border)',
    padding: '12px 16px',
    borderTopLeftRadius: 'var(--skin-surface-radius)',
    borderTopRightRadius: 'var(--skin-surface-radius)',
  };

  const titleStyle = {
    color: 'var(--skin-title-color)',
    fontFamily: 'var(--skin-font-display)',
    textShadow: 'var(--skin-incision-label)',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: 'var(--skin-label-tracking)',
    textTransform: 'uppercase' as const,
    margin: 0,
  };

  const dragHandleStyle = {
    color: 'var(--skin-drag-handle-color)',
    cursor: disabled ? 'default' : 'move',
    userSelect: 'none' as const,
    padding: '4px 8px',
    borderRadius: 'var(--skin-btn-radius)',
    transition: 'color 180ms ease',
  };

  const activeState = isActive ? {
    borderColor: 'var(--skin-title-color)',
    boxShadow: '0 0 18px var(--skin-glow-primary), var(--skin-drag-lift-shadow)',
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
