/**
 * Tooltip Provider
 *
 * Global tooltip provider using Radix UI with config-driven behavior.
 * Provides consistent tooltip timing, accessibility, and SSR support.
 */

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { MinimalUITooltipPolicy } from '@/balancing/config/idleVillage/minimalConfig';

/**
 * Props for TooltipProvider component
 */
export interface TooltipProviderProps {
  /** Children to wrap with tooltip context */
  children: React.ReactNode;
  /** Tooltip behavior configuration */
  policy?: Partial<MinimalUITooltipPolicy>;
  /** Whether to disable tooltips entirely */
  disabled?: boolean;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Global tooltip provider using Radix UI with config-driven behavior.
 * Wraps the application to provide consistent tooltip timing,
 * accessibility, and SSR support across all tooltips.
 */
export const TooltipProvider: React.FC<TooltipProviderProps> = ({
  children,
  policy = {},
  disabled = false,
  testId = 'tooltip-provider',
}) => {
  // Default policy values
  const defaultPolicy: MinimalUITooltipPolicy = {
    showDelayMs: 500,
    hideDelayMs: 200,
    showOnHover: true,
    showOnFocus: true,
    autoHideDurationMs: 0,
    disableHoverableContent: false,
    skipDelayDuration: false,
  };

  // Merge with provided policy
  const mergedPolicy = { ...defaultPolicy, ...policy };

  // Early return if disabled
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Provider
      delayDuration={mergedPolicy.showDelayMs}
      skipDelayDuration={mergedPolicy.skipDelayDuration ? 0 : undefined}
      disableHoverableContent={mergedPolicy.disableHoverableContent}
    >
      <div data-testid={testId}>
        {children}
      </div>
    </TooltipPrimitive.Provider>
  );
};

/**
 * Individual tooltip component for manual usage
 */
export const Tooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
}> = ({ children, content, side = 'top', align = 'center', delayDuration }) => {
  return (
    <TooltipPrimitive.Tooltip delayDuration={delayDuration}>
      <TooltipPrimitive.TooltipTrigger asChild>
        {children}
      </TooltipPrimitive.TooltipTrigger>
      <TooltipPrimitive.TooltipContent side={side} align={align}>
        {content}
        <TooltipPrimitive.TooltipArrow />
      </TooltipPrimitive.TooltipContent>
    </TooltipPrimitive.Tooltip>
  );
};

export default TooltipProvider;
