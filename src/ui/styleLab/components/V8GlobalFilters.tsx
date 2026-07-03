/**
 * V8GlobalFilters
 *
 * Global SVG filter host for the V8 "Default Skin System" (Wanderlust).
 * Mount this ONCE near the application root (see main.tsx). It injects an
 * off-screen <svg> holding the two core material filters referenced by the
 * `.wanderlust-artifact` master class:
 *
 *   - #v8-obsidian-grain : fractal noise overlay that gives flat obsidian
 *     surfaces a porous, physical texture.
 *   - #v8-bronze-grit    : turbulence + displacement map that organically
 *     erodes/chisels borders so they look hand-forged and imperfect,
 *     matching the character medallion (WanderlustMedalOverlay).
 *
 * The host is visually hidden but kept in the layout/render tree so the
 * filter ids resolve for any consumer on the page.
 */
import React from 'react';

export const V8GlobalFilters: React.FC = () => (
  <svg
    aria-hidden
    focusable={false}
    width={0}
    height={0}
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
    data-v8-global-filters
  >
    <defs>
      {/*
        #v8-obsidian-grain
        Fractal noise tinted to a near-black warm obsidian, blended over the
        source so a flat fill reads as porous stone rather than flat color.
      */}
      <filter id="v8-obsidian-grain" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={4}
          seed={11}
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="matrix"
          values="0 0 0 0 0.045
                  0 0 0 0 0.045
                  0 0 0 0 0.070
                  0 0 0 0.22 0"
          result="grain"
        />
        <feBlend in="SourceGraphic" in2="grain" mode="overlay" />
      </filter>

      {/*
        #v8-bronze-grit
        Low-frequency turbulence drives a displacement map that pushes the
        source pixels around, eroding and chiseling hard border edges into an
        organic, forged-bronze imperfection.
      */}
      <filter id="v8-bronze-grit" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence
          type="turbulence"
          baseFrequency="0.045"
          numOctaves={3}
          seed={7}
          result="turb"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="turb"
          scale="4"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* Clip path to constrain v8-bronze-grit filter to circular shapes */}
      <clipPath id="v8-circular-clip">
        <circle cx="50%" cy="50%" r="50%" />
      </clipPath>
    </defs>
  </svg>
);

export default V8GlobalFilters;
