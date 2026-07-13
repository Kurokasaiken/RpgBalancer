import { useContext, useCallback } from 'react';
import { V9TooltipContext } from './V9TooltipContext';

/**
 * Hook that binds an element to the V9Tooltip system.
 * Falls back to the native `title` attribute when no provider is mounted.
 */
export const useV9Tooltip = (content: string): React.HTMLAttributes<HTMLElement> & { 'data-tooltip'?: string } => {
  const ctx = useContext(V9TooltipContext);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      ctx?.showTooltip(content, e.currentTarget);
    },
    [content, ctx],
  );

  const handleMouseLeave = useCallback(() => {
    ctx?.hideTooltip();
  }, [ctx]);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      ctx?.showTooltip(content, e.currentTarget);
    },
    [content, ctx],
  );

  const handleBlur = useCallback(() => {
    ctx?.hideTooltip();
  }, [ctx]);

  if (!content) {
    return {};
  }

  if (!ctx) {
    return { title: content };
  }

  return {
    'data-tooltip': content,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
};
