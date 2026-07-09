/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DRAGGABLE SKIN-AWARE WRAPPER
 *
 *  Unified wrapper for any modal/card/panel that needs to be:
 *  - Draggable with dnd-kit integration
 *  - Closeable with a skin-styled close button
 *  - Visually distinct on valid/invalid drop zones
 *  - Fully tokenized via --skin-* CSS variables
 *
 *  Reads from `--skin-drag-*`, `--skin-close-*`, `--skin-modal-*` tokens.
 *  Pattern: UI artist AAA 2026 — modular, reusable, state-driven.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { ReactNode } from 'react';
import type { CSSProperties } from 'react';

export type DragState = 'idle' | 'dragging' | 'drag-valid' | 'drag-invalid' | 'returning';

export interface DraggableSkinAwareProps {
  /** Unique ID for dnd-kit integration */
  id: string;
  /** Content to render inside the draggable container */
  children: ReactNode;
  /** Is this element currently being dragged? */
  isDragging?: boolean;
  /** Visual feedback state (idle/valid/invalid) */
  dragState?: DragState;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Show close button? */
  showClose?: boolean;
  /** Show drag handle? */
  showHandle?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
  /** Is this a modal (overlay + centered)? */
  isModal?: boolean;
  /** Modal dismissal callback (for overlay click) */
  onDismiss?: () => void;
  /** Rendered as a portal? */
  portalRoot?: HTMLElement;
}

export const DraggableSkinAware: React.FC<DraggableSkinAwareProps> = ({
  id,
  children,
  isDragging = false,
  dragState = 'idle',
  onClose,
  showClose = true,
  showHandle = true,
  className = '',
  style,
  isModal = false,
  onDismiss,
  portalRoot,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Compute drag-related styles
  const dragOpacity = isDragging ? 'var(--skin-drag-active-opacity, 0.7)' : '1';
  const dragGlow =
    dragState === 'drag-valid'
      ? 'var(--skin-drag-valid-glow, rgba(0,229,255,0.4))'
      : dragState === 'drag-invalid'
        ? 'var(--skin-drag-invalid-glow, rgba(217,138,74,0.5))'
        : 'transparent';

  const wrapperStyle: CSSProperties = {
    position: isModal ? 'fixed' : 'relative',
    ...(isModal && { inset: 0, zIndex: 'var(--skin-modal-z-index, 1000)' }),
    ...style,
  };

  const containerStyle: CSSProperties = {
    position: isModal ? 'fixed' : 'relative',
    background: isModal ? 'var(--skin-modal-container-bg, #060f16)' : 'inherit',
    border: isModal ? '1px solid var(--skin-modal-container-border, rgba(223,184,87,0.35))' : 'none',
    borderRadius: isModal ? 'var(--skin-surface-radius, 14px)' : '0',
    opacity: dragOpacity,
    boxShadow:
      dragState !== 'idle'
        ? `0 0 24px ${dragGlow}`
        : 'none',
    transition: isDragging ? 'none' : 'opacity 0.2s ease, box-shadow 0.3s ease',
    willChange: isDragging ? 'transform, opacity' : 'auto',
  };

  const handleStyle: CSSProperties = {
    width: '100%',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    background: 'linear-gradient(180deg, rgba(223,184,87,0.12) 0%, rgba(223,184,87,0.06) 100%)',
    borderBottom: '1px solid var(--skin-surface-border, rgba(223,184,87,0.50))',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
  };

  const gripStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    opacity: 0.6,
  };

  const gripLineStyle: CSSProperties = {
    width: '16px',
    height: '2px',
    background: 'var(--skin-drag-handle-color, rgba(223,184,87,0.50))',
    borderRadius: '1px',
    transition: 'background 0.2s ease',
  };

  const closeStyle: CSSProperties = {
    width: 'var(--skin-close-size, 28px)',
    height: 'var(--skin-close-size, 28px)',
    background: 'var(--skin-close-bg, rgba(6,15,22,0.8))',
    border: 'var(--skin-close-border, 1px solid rgba(223,184,87,0.40))',
    color: 'var(--skin-close-color, rgba(245,242,232,0.70))',
    borderRadius: 'var(--skin-close-radius, 50%)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'color 0.2s ease, background 0.2s ease',
    padding: 0,
    margin: 0,
  };

  const closeHoverStyle: CSSProperties = {
    ...closeStyle,
    color: 'var(--skin-close-hover-color, #f7dd80)',
    background: 'rgba(223,184,87,0.15)',
  };

  const [isCloseHovered, setIsCloseHovered] = React.useState(false);

  const contentStyle: CSSProperties = {
    padding: isModal ? '24px' : '0',
  };

  const overlayStyle: CSSProperties = isModal
    ? {
        position: 'fixed',
        inset: 0,
        background: 'var(--skin-modal-overlay-bg, rgba(6,15,22,0.85))',
        zIndex: 'calc(var(--skin-modal-z-index, 1000) - 1)',
        backdropFilter: 'blur(2px)',
      }
    : {};

  const renderContainer = () => (
    <div
      ref={containerRef}
      data-draggable-id={id}
      className={`draggable-skin-aware ${dragState} ${isDragging ? 'is-dragging' : ''} ${className}`}
      style={containerStyle}
    >
      {showHandle && (
        <div style={handleStyle} data-handle-id={`${id}-handle`}>
          <div style={gripStyle}>
            <div style={gripLineStyle} />
            <div style={gripLineStyle} />
            <div style={gripLineStyle} />
          </div>
          {showClose && (
            <button
              style={isCloseHovered ? closeHoverStyle : closeStyle}
              onClick={onClose}
              onMouseEnter={() => setIsCloseHovered(true)}
              onMouseLeave={() => setIsCloseHovered(false)}
              aria-label="Chiudi"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div style={contentStyle}>{children}</div>
    </div>
  );

  if (isModal) {
    return (
      <div style={wrapperStyle}>
        <div
          style={overlayStyle}
          onClick={onDismiss}
          role="presentation"
        />
        {renderContainer()}
      </div>
    );
  }

  return <div style={wrapperStyle}>{renderContainer()}</div>;
};

export default DraggableSkinAware;
