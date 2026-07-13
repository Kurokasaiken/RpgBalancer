import React, { useState, useCallback, useRef, useEffect } from 'react';
import { V9TooltipContext } from './V9TooltipContext';

/**
 * V9Tooltip provides a global, glassmorphic tooltip layer for the V9 skin sandbox.
 * It replaces the native browser `title` attribute with a chamfered, smoky,
 * alchemic tooltip that delays 150ms and fades in/out with a soft easing.
 */

const TOOLTIP_OPEN_DELAY_MS = 150;
const TOOLTIP_TRANSITION_MS = 220;

const V9_TOOLTIP_BASE_STYLE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  padding: '6px 12px',
  fontSize: '11px',
  lineHeight: 1.4,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: '#f0efe4',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  backgroundColor: 'rgba(6, 15, 22, 0.82)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '0.5px solid rgba(223, 184, 87, 0.65)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45), inset 0 0 12px rgba(0, 229, 255, 0.06)',
  borderRadius: 0,
  clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
  opacity: 0,
  transform: 'translateX(-50%) translateY(-6px)',
  transition: `opacity ${TOOLTIP_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${TOOLTIP_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
};

const V9_TOOLTIP_VISIBLE_STYLE: React.CSSProperties = {
  opacity: 1,
  transform: 'translateX(-50%) translateY(0)',
};

function clampTooltipPosition(tooltipEl: HTMLElement, targetRect: DOMRect): { x: number; y: number } {
  const margin = 8;
  const tooltipRect = tooltipEl.getBoundingClientRect();
  let x = targetRect.left + targetRect.width / 2;
  let y = targetRect.top - tooltipRect.height - margin;
  if (x + tooltipRect.width / 2 > window.innerWidth - margin) {
    x = window.innerWidth - tooltipRect.width / 2 - margin;
  }
  if (x - tooltipRect.width / 2 < margin) {
    x = tooltipRect.width / 2 + margin;
  }
  if (y < margin) {
    y = targetRect.bottom + tooltipRect.height + margin;
  }
  return { x, y };
}

export const V9TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const updatePosition = useCallback(() => {
    if (!target || !tooltipRef.current) return;
    const { x, y } = clampTooltipPosition(tooltipRef.current, target.getBoundingClientRect());
    tooltipRef.current.style.left = `${x}px`;
    tooltipRef.current.style.top = `${y}px`;
  }, [target]);

  const showTooltip = useCallback((text: string, newTarget: HTMLElement) => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setContent(text);
    setTarget(newTarget);
    setVisible(false);
    if (delayTimerRef.current) window.clearTimeout(delayTimerRef.current);
    delayTimerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, TOOLTIP_OPEN_DELAY_MS);
  }, []);

  const hideTooltip = useCallback(() => {
    if (delayTimerRef.current) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    setVisible(false);
    hideTimerRef.current = window.setTimeout(() => {
      setTarget(null);
      setContent('');
    }, TOOLTIP_TRANSITION_MS);
  }, []);

  useEffect(() => {
    updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePosition]);

  useEffect(() => {
    return () => {
      if (delayTimerRef.current) window.clearTimeout(delayTimerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const style: React.CSSProperties = {
    ...V9_TOOLTIP_BASE_STYLE,
    ...(visible ? V9_TOOLTIP_VISIBLE_STYLE : {}),
  };

  return (
    <V9TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      <div
        ref={tooltipRef}
        style={style}
        role="tooltip"
        aria-hidden={!visible}
      >
        {content}
      </div>
    </V9TooltipContext.Provider>
  );
};

