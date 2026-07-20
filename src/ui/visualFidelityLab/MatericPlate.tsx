import React from 'react';
import type { CSSProperties } from 'react';
import type { MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';
import { SlopedWalls, type PlateVariantProps } from './plateVariants';

/**
 * MatericPlate — LAB-LOCAL, FIRST material-primitive extraction (Phase 1).
 *
 * Canonical implementation: SLOPED WALLS (perfected) — a true carved cut in
 * the V9 dialect: thin, sharp, matte. Chosen over the isolated-winner Bezel
 * Molding after the IN-CONTEXT test: the molding's thick glossy tube broke
 * the design system (Hearthstone dialect vs the Ancient Compass plaque's
 * thin-notched V9 language) and read as a raised tray, not a well.
 * Lesson kept: isolated-winner ≠ system-winner.
 *
 * Depth per the perception research: foreshortened mitred walls (one
 * geometry), azure-lifted interior funding the wall shadow, letterpress
 * polarity (dark crease top-left, gold lip bottom-right), gold floor-arris
 * line below the opening, static micro-grain against machine-perfection.
 *
 * Thin adapter so the canonical name is stable while the implementation
 * stays swappable. STATIC — no motion (Life Layer later).
 */
export interface MatericPlateProps {
  /** Reserved for future per-material bezels; the lab winner is bronze. */
  material?: MaterialPreset;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

export const MatericPlate: React.FC<MatericPlateProps> = ({ children, className, style }) => {
  const props: PlateVariantProps = { children, className, style };
  return <SlopedWalls {...props} />;
};

export default MatericPlate;
