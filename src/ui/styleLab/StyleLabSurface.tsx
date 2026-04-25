/**
 * Style Lab Surface Component
 *
 * Base surface wrapper that applies Style Lab tokens and provides consistent
 * spacing, borders, and backgrounds for Minimal Gameplay and other surfaces.
 * Replaces legacy Tailwind utilities and inline styles with token-driven design.
 */

import type { ReactNode } from 'react';
import type { CSSProperties } from 'react';
import { forwardRef } from 'react';
import clsx from 'clsx';

export interface StyleLabSurfaceProps {
  /** Content to render inside the surface */
  children: ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Optional style overrides (merged with token styles) */
  style?: CSSProperties;
  /** Surface variant for different visual treatments */
  variant?: 'panel' | 'card' | 'toolbar' | 'ticker';
  /** Whether to apply backdrop blur effect */
  backdropBlur?: boolean;
  /** Test ID for testing utilities */
  testId?: string;
}

/**
 * Base surface component that applies Style Lab tokens consistently.
 * Use this instead of raw divs with Tailwind utilities for Style Lab compliance.
 */
export const StyleLabSurface = forwardRef<HTMLDivElement, StyleLabSurfaceProps>(
  (
    {
      children,
      className,
      style,
      variant = 'panel',
      backdropBlur = true,
      testId,
    },
    ref
  ) => {
    const variantClasses = {
      panel: 'rounded-2xl border p-6 shadow-xl',
      card: 'rounded-xl border p-4 shadow-lg',
      toolbar: 'rounded-2xl border p-4 shadow-xl',
      ticker: 'rounded-lg border p-3 shadow-md',
    };

    const baseClasses = clsx(
      variantClasses[variant],
      backdropBlur && 'backdrop-blur-sm',
      className
    );

    const variantStyles: Record<typeof variant, CSSProperties> = {
      panel: {
        borderColor: 'var(--minimal-panel-border)',
        background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--minimal-panel-surface)`,
        boxShadow: `0 30px 60px var(--minimal-card-shadow-color)`,
        borderRadius: 'var(--minimal-card-radius)',
      },
      card: {
        borderColor: 'var(--minimal-panel-border)',
        background: 'var(--minimal-card-surface)',
        boxShadow: `0 15px 35px var(--minimal-card-shadow-color)`,
        borderRadius: 'var(--minimal-card-radius)',
      },
      toolbar: {
        borderColor: 'var(--minimal-panel-border)',
        background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--minimal-panel-surface)`,
        boxShadow: `0 30px 60px var(--minimal-card-shadow-color)`,
        borderRadius: 'var(--minimal-card-radius)',
      },
      ticker: {
        borderColor: 'var(--minimal-panel-border)',
        background: 'var(--minimal-card-surface)',
        boxShadow: `0 8px 20px var(--minimal-card-shadow-color)`,
        borderRadius: 'var(--minimal-card-radius)',
      },
    };

    const mergedStyle: CSSProperties = {
      ...variantStyles[variant],
      ...style,
    };

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={mergedStyle}
        data-testid={testId}
        data-variant={variant}
      >
        {children}
      </div>
    );
  }
);

StyleLabSurface.displayName = 'StyleLabSurface';
