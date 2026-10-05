# Reconstruction Spec — Frame Upgrade

## Target dimensions
- Component: 520×420 px.
- Frame rim: 26 px.
- Aperture: 468×368 px, border-radius 16 px.

## Frame material: Baroque Sun-Bronze
- 6-stop bronze gradient: `#fce890` → `#e4b048` → `#a05c18` → `#602c08` → `#341604` → `#0e0602`.
- Noise: `feTurbulence` `baseFrequency="0.52"`, `numOctaves="4"`, `seed="3"`, overlay.
- Oxidation: deep teal/brown streaks along lower edge and right edge.

## Imperfections
- 4–6 nicks (small dark triangles) along outer edges.
- 2–3 thin scratches on the right/bottom rim.
- Corner bosses with raised highlight.
- Slight edge warping via `d` paths instead of perfect `rect`.

## Lighting
- Top-left rim light: `rgba(255,245,200,.45)`.
- Inner shadow: `inset 0 4px 10px rgba(0,0,0,.55)`.
- Outer shadow: `0 24px 55px rgba(0,0,0,.65)`.
- Subtle breathing on rim light opacity `0.85 ↔ 0.65`.

## Reveal
- `clip-path` reveal replaced by a soft, curved sweep from left to right with a subtle lifted-shadow.
