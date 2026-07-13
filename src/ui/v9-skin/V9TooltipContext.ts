import { createContext } from 'react';

/**
 * Shared context for the V9 global tooltip system.
 */
export interface V9TooltipContextValue {
  /** Show a tooltip anchored to the given target element. */
  showTooltip: (content: string, target: HTMLElement) => void;
  /** Hide the currently visible tooltip. */
  hideTooltip: () => void;
}

export const V9TooltipContext = createContext<V9TooltipContextValue | null>(null);
