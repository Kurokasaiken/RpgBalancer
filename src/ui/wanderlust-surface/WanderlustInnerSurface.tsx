import type { JSX } from 'react';
import { useId } from 'react';

interface WanderlustInnerSurfaceProps {
  /** Width of the surface */
  width: number;
  /** Height of the surface */
  height: number;
  /** Whether to enable filters (disable for performance) */
  enableFilters?: boolean;
}

/**
 * WanderlustInnerSurface
 * 
 * Procedural inner background component for Wanderlust UI System.
 * Renders a subtle depth background for content wells.
 * 
 * Design:
 * - Base fill: #0c0a07 (deep dark, no warmth)
 * - Radial gradient: #12100d (center) → #0c0a07 (edges) for subtle volume
 * - Inner shadow groove: 1px feComposite in for physical separation from border
 * 
 * Optimized for beige/gold text contrast.
 * 
 * @component
 */
export default function WanderlustInnerSurface({
  width,
  height,
  enableFilters = true,
}: WanderlustInnerSurfaceProps): JSX.Element {
  const uniqueId = useId().replace(/:/g, '');

  const gradientId = `wis-grad-${uniqueId}`;
  const grooveFilterId = `wis-groove-${uniqueId}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0"
      style={{ overflow: 'hidden' }}
    >
      <defs>
        {/* Subtle radial gradient for volume: center slightly lighter than edges */}
        <radialGradient id={gradientId} cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#12100d" stopOpacity={1} />
          <stop offset="100%" stopColor="#0c0a07" stopOpacity={1} />
        </radialGradient>

        {/* Inner shadow groove filter: creates 1px separation from border */}
        {enableFilters && (
          <filter id={grooveFilterId} x="-5%" y="-5%" width="110%" height="110%">
            <feFlood floodColor="#000000" floodOpacity="0.6" result="shadow" />
            <feComposite in="shadow" in2="SourceAlpha" operator="in" result="innerShadow" />
            <feOffset in="innerShadow" dx="0" dy="0" result="offsetShadow" />
          </filter>
        )}
      </defs>

      {/* Base fill with subtle gradient */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={`url(#${gradientId})`}
      />

      {/* Inner shadow groove at edges */}
      {enableFilters && (
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          filter={`url(#${grooveFilterId})`}
          opacity="0.8"
        />
      )}
    </svg>
  );
}
