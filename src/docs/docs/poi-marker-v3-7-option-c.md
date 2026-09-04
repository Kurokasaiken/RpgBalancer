# POI Marker V3.7 — Option C Implementation

**Date:** 2026-09-04
**Status:** Complete
**Commit:** 0c5c4dd7

## Overview

Option C delivers an integrated visual fix for PoiMatericV3_7 with depth cues and animation, bringing it visually inline with V4 while maintaining the V3 architecture.

## Four Core Enhancements

### 1. Type-Aware Icon Metal Colors

**What:** Heraldic icons (quest/job/event) now render with material-appropriate metallic colors instead of hardcoded gold.

**How:**
- Quest: Cyan/Turquoise metals (bright light, muted mid, deep dark)
- Job: Warm Amber metals (golden light, copper mid, burnt dark)
- Event: Gold metals (identical to previous default)

**Implementation:**
- Config: `POI_MATERIC_V3_7_TOKENS.iconMetals` per-type palettes
- SVG: Icon gradient `#icon-metal` defined in defs with type-specific stops
- Effect: Each POI type reads as a distinct material, not just color

### 2. V4-Style Halo (Depth Cue)

**What:** Subtle radial glow behind the marker creates separation from the map.

**How:**
- Positioned absolutely, 135% of marker size
- Radial gradient: bright at center, fading to transparent
- Gaussian blur applied (scales with marker size)
- Renders behind medallion (z-index: 1)

**Visual Effect:** Marker appears "lifted" from the map, not painted on it.

**Why:** The D&D principle of "silhouette before detail" — the halo telegraphs importance at a glance.

### 3. Pulse Animation on New POIs

**What:** For POIs in `state="new"`, a subtle 1-second pulse animation draws attention.

**Animation:**
- Scale: 1.0 → 1.03 → 1.0 (3% growth, barely visible, not cartoonish)
- Opacity: 0.7 → 0.85 → 0.7 (halo brightens in sync)
- Duration: 1000ms, easing: ease-in-out, infinite loop
- Only applies to: `[data-state="new"]`

**Why:** "New!" is readable at a glance without a tooltip.

### 4. Cast Shadow (V4-Style Ground Plane)

**What:** V4 shadow config already applied to V3_7 tokens as CSS box-shadow.

**Parameters:**
- Ellipse dimensions: rx=33, ry=25 (soft, wide)
- Offset: dx=4px horizontal, 2.5px gap above shadow
- Blur: 7px (double the stored value for softness)
- Color: `rgba(34, 50, 47, 0.56)` with multiply blend
- Effect: Marker casts a soft shadow on the ground plane

## Technical Details

### File Changes

**PoiMatericV3_7.tsx:**
- Line 176-187: Extract type-aware metal colors, compute accent RGB
- Line 436-451: Add halo div with dynamic gradient and blur
- Line 524-529: Add icon-metal gradient in SVG defs
- Line 908-951: Halo + pulse CSS rules
- Line 424: Add `data-state={state}` attribute for CSS targeting

**PoiMatericV3_7Tokens.ts:**
- Already includes: `iconMetals`, `fieldBackgrounds`, `shadow`
- No changes needed — config-first design is complete

### CSS Selectors

```css
/* Halo renders always, but animates only when new */
.poiv3_7__halo { transition: opacity 250ms ease; }
.poiv3_7[data-state="new"] .poiv3_7__halo {
  animation: poiv3_7-pulse 1s ease-in-out infinite;
}
```

### Gradient Usage

Icon metal gradient pulls from three-value tuples:

```typescript
iconMetals: {
  quest: ['#dcf4e6', '#4e8f78', '#0b201a'],    // light, mid, dark
  job: ['#ffdcb4', '#a8542a', '#1d0a04'],
  event: ['#fce890', '#c09030', '#200e02'],
  // ...
}
```

Defined as a linear gradient in SVG defs:
```tsx
<linearGradient id={gid('icon-metal')} x1="14%" y1="4%" x2="86%" y2="96%">
  <stop offset="0%" stopColor={metalDark} />
  <stop offset="15%" stopColor={metalMid} />
  <stop offset="40%" stopColor={metalLight} />
  <stop offset="70%" stopColor={metalMid} />
  <stop offset="100%" stopColor={metalDark} />
</linearGradient>
```

## Visual Comparison

### V3.6
- Fixed gold icons (all types identical)
- No halo
- No pulse animation
- Weakly grounded to map

### V3.7 Option C (Now)
- **Type-aware icon metals** (quest cyan, job amber, event gold)
- **Halo** creates depth (marker appears lifted)
- **Pulse on new POIs** (visible without tooltip)
- **Cast shadow** defines ground plane

### V4
- Same material approach
- Halo + pulse + shadow (identical visual language)
- Simpler seal mechanism (no rim glyphs)
- V3_7_C achieves visual parity for the marker layer

## Testing Instructions

### On `/poi-marker-lab`:
1. **Switch variant:** Select `matericV3_7` from controls
2. **Type distinction:** Quest (cyan), Job (amber), Event (gold) icons immediately readable
3. **Halo:** Toggle between V3.6 and V3.7_C → halo appears in V3.7_C
4. **Pulse:** Set a marker to `state="new"` → halo pulses (1s cycle)
5. **Side-by-side:** Compare with V3.6 and V4 in matrix view

### In-Context (Map Overlay):
1. **Depth:** V3.7_C markers read as "on top of" the map, not "painted on"
2. **Type reading:** Type is obvious from icon color alone
3. **New marker attention:** Pulsing halo draws eye without distraction

## Deliverables

- ✅ Commit: `0c5c4dd7`
- ✅ Component: `PoiMatericV3_7.tsx` with all enhancements
- ✅ Tokens: `POI_MATERIC_V3_7_TOKENS` with per-type configs
- ✅ Lab page: `/poi-marker-lab` shows all three versions (V3.6, V3.7_C, V4)
- ✅ Animation: Pulse on `state="new"` via CSS keyframes
- ✅ Halo: Renders at all scales with blur proportional to marker size

## Verification

```bash
npm run build:check
✅ Build check passed

npm run lint -- src/ui/idleVillage/components/poi/PoiMatericV3_7.tsx
⚠ Pre-existing unused variable warnings (CROSS_ARM, stoneLight, etc.)
✅ No new lint errors

# Live test at /poi-marker-lab
✅ All variants load
✅ Type icons render with correct metals
✅ Halo visible
✅ New state pulses
✅ No console errors
```

## Notes for Future Work

### Option C vs V4 Alignment
- V3.7_C now matches V4 visually for the marker layer
- Main difference: V4 has simpler seal (no rim glyphs); V3.7 keeps complex seal
- Both read as "same family" on the map

### Configuration Extension
If new POI types are added:
1. Add entry to `POI_MATERIC_V3_7_TOKENS.iconMetals`
2. Add entry to `POI_MATERIC_V3_7_TOKENS.icons` with arm path
3. No code changes needed (config-first design)

### Animation Extensibility
Pulse animation is tied to `[data-state="new"]`:
- Can add more states: `data-state="expiring"` → different animation
- Animation rules live in `poiMatericV3_7Styles` CSS
- Easy to adjust: duration, scale, opacity curve

---

**Status:** Ready for production. V3.7_C is visually indistinguishable from V4 at a glance, with superior configurability.
