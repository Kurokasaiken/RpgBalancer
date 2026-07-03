import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export type WanderlustTextVariant = 'title' | 'subtitle' | 'body' | 'label' | 'caption';

interface WanderlustContentProps {
  children: ReactNode;
  /** Text variant for automatic typography styling */
  variant?: WanderlustTextVariant;
  /** Additional CSS classes */
  className?: string;
}

/**
 * WanderlustContent
 * 
 * Content wrapper for WanderlustSurface with automatic typography and spacing.
 * Ensures text "weighs" visually as much as the frame.
 * 
 * Typography colors:
 * - Primary: #e4d5b7 (cream/gold for important text)
 * - Secondary: #8a7050 (desaturated bronze for labels, captions)
 * 
 * @component
 */
export default function WanderlustContent({
  children,
  variant,
  className,
}: WanderlustContentProps) {
  return (
    <div className={clsx('ws-content', variant && `ws-text--${variant}`, className)}>
      {children}
    </div>
  );
}
