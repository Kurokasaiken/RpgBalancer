import type { SVGProps } from 'react';
import clsx from 'clsx';

/**
 * Props for {@link HungerGlyph}, a stylized stomach outline representing hunger/emptiness.
 */
export interface HungerGlyphProps extends SVGProps<SVGSVGElement> {
  /** Optional CSS class string merged with the default styling. */
  className?: string;
}

/**
 * Minimal stomach-shaped glyph used for hunger indicators (distinct from food icons).
 * Path sourced from Material Design Icons (MIT License) — https://github.com/Templarian/MaterialDesign.
 */
export function HungerGlyph({ className, ...props }: HungerGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-hidden
      className={clsx('text-amber-100 drop-shadow-[0_0_8px_rgba(201,162,39,0.45)]', className)}
      {...props}
    >
      <path d="M4 18C4.67 19.85 6.07 22 12 22C14.36 22 17.07 21.93 19 20C20 19 22 17 22 11S20 4 18 4C16.62 4 15 4 14 6V6.03A1.82 1.82 0 0 1 12.13 6.95C11 6.81 11 6.37 11 6V2H9V6A2.92 2.92 0 0 0 12 9C13 9 13 10.78 13 12C13 13.89 12.5 15.26 11 16C8.69 17.15 6.39 17 5.61 15.47A1.5 1.5 0 0 0 3.14 14.87A3.67 3.67 0 0 0 2 18V22H4Z" />
    </svg>
  );
}
