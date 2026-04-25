/**
 * Style Lab Stack Component
 *
 * Flexible layout component that provides consistent spacing and direction
 * for Style Lab compliant layouts. Replaces Tailwind flex utilities with
 * token-driven spacing and responsive behavior.
 */

import type { ReactNode } from 'react';
import type { CSSProperties } from 'react';
import { forwardRef } from 'react';
import clsx from 'clsx';

export interface StyleLabStackProps {
  /** Content to render in the stack */
  children: ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Optional style overrides */
  style?: CSSProperties;
  /** Stack direction */
  direction?: 'vertical' | 'horizontal';
  /** Responsive direction (vertical on mobile, horizontal on desktop) */
  responsive?: boolean;
  /** Alignment of items */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justification of items */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Spacing between items (using token values) */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether items should wrap */
  wrap?: boolean;
  /** Test ID for testing utilities */
  testId?: string;
}

/**
 * Stack component for consistent layouts with Style Lab tokens.
 * Use this instead of raw flex divs with Tailwind utilities.
 */
export const StyleLabStack = forwardRef<HTMLDivElement, StyleLabStackProps>(
  (
    {
      children,
      className,
      style,
      direction = 'vertical',
      responsive = false,
      align = 'start',
      justify = 'start',
      spacing = 'md',
      wrap = false,
      testId,
    },
    ref
  ) => {
    const spacingTokens = {
      xs: 'var(--spacing-xs, 0.25rem)',
      sm: 'var(--spacing-sm, 0.5rem)',
      md: 'var(--spacing-md, 1rem)',
      lg: 'var(--spacing-lg, 1.5rem)',
      xl: 'var(--spacing-xl, 2rem)',
    };

    const directionClasses = {
      vertical: 'flex-col',
      horizontal: 'flex-row',
    };

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    const baseClasses = clsx(
      'flex',
      responsive ? 'flex-col md:flex-row' : directionClasses[direction],
      alignClasses[align],
      justifyClasses[justify],
      wrap && 'flex-wrap',
      className
    );

    const stackStyle: CSSProperties = {
      gap: spacingTokens[spacing],
      ...style,
    };

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={stackStyle}
        data-testid={testId}
        data-direction={direction}
        data-spacing={spacing}
      >
        {children}
      </div>
    );
  }
);

StyleLabStack.displayName = 'StyleLabStack';
