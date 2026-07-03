# V8 Skin Sandbox - Complete Guide

## Overview

The V8 Skin Sandbox (`/skin-sandbox`) is a comprehensive testing environment for the **V8 Skin Architecture** and **Material Layer Engine (MLE)**. It allows developers to:

- Test Style Lab presets (Wanderlust V8, Wanderlust, Minimal Frontier)
- Switch between background modes (marble, parchment, void, custom bg)
- Toggle global states (hovered, active, paused)<>
- Configure material layer properties (physical depth, heavy feel, dynamic rim light)
- Visualize artifacts with different variants (circular, roomy, wide, quiet, hairline)

---

## Architecture

### File Structure

```
src/
├── pages/
│   └── v8-skin-sandbox.tsx          # Main sandbox page
├── ui/
│   ├── styleLab/
│   │   ├── StyleLabSurface.tsx      # Material Layer Engine component
│   │   └── tokens/
│   │       └── v8-wanderlust-artifact.css  # CSS for MLE classes
│   └── idleVillage/
│       └── TestHub.tsx              # Navigation hub with link to sandbox
└── App.tsx                          # Route configuration
```

### Route Configuration

```typescript
// src/App.tsx
const isV8SkinSandboxPath =
  typeof window !== 'undefined' &&
  (window.location.pathname === '/test-hub/v8-skin-sandbox' ||
   window.location.pathname === '/skin-sandbox');  // Short alias
```

The page is accessible via both `/test-hub/v8-skin-sandbox` and `/skin-sandbox`.

---

## State Management

### SandboxState Interface

```typescript
interface SandboxState {
  backgroundMode: BackgroundMode;      // 'marble' | 'parchment' | 'void' | 'bg'
  forceHovered: boolean;               // Force .is-hovered class
  forceActive: boolean;               // Force .is-active class
  forcePaused: boolean;               // Force .is-paused class
  presetId: PresetId;                  // 'wanderlust-v8' | 'wanderlust' | 'default'
  physicalDepth: boolean;             // Enable wa-physical-depth class
  heavyFeel: boolean;                 // Enable wa--heavy-feel class
  dynamicRimLight: boolean;           // Enable ml-rim-light-dynamic class
}
```

### Initial State

```typescript
const [state, setState] = useState<SandboxState>({
  backgroundMode: 'void',
  forceHovered: false,
  forceActive: false,
  forcePaused: false,
  presetId: 'wanderlust-v8',
  physicalDepth: true,    // Default enabled
  heavyFeel: true,        // Default enabled
  dynamicRimLight: true,  // Default enabled
});
```

---

## Material Layer Engine (MLE)

### Purpose

The MLE is a procedural composition system that eliminates manual layer management. It allows components to be styled through configuration rather than hardcoded CSS classes.

### MaterialLayerConfig Interface

```typescript
export interface MaterialLayerConfig {
  /** Base texture material */
  baseTexture?: 'obsidian' | 'marble' | 'parchment' | 'wood' | 'gold';
  /** Edge treatment for borders */
  edgeTreatment?: 'eroded-bronze' | 'sharp-gold' | 'rough-wood' | 'none';
  /** Emissive halo/glow effect */
  emissiveHalo?: 'emerald' | 'gold' | 'none';
  /** Enable micro-interactions (hover scale, glow transitions) */
  microInteraction?: boolean;
  /** Enable rim light effect (1px soft highlight on top-left edge) */
  rimLight?: boolean;
  /** Enable physical depth (multi-layer shadows for contact + elevation) */
  physicalDepth?: boolean;
  /** Enable heavy feel (weighted easing for physical presence) */
  heavyFeel?: boolean;
  /** Background mode for dynamic rim light calculation */
  backgroundMode?: 'marble' | 'parchment' | 'void' | 'bg';
}
```

### Dynamic Class Construction

```typescript
const materialLayerClasses = hasMaterialLayer ? [
  materialLayer.baseTexture && `ml-base-${materialLayer.baseTexture}`,
  materialLayer.edgeTreatment && `ml-edge-${materialLayer.edgeTreatment}`,
  materialLayer.emissiveHalo && `ml-halo-${materialLayer.emissiveHalo}`,
  materialLayer.microInteraction && 'wa--haptic-ready',
  materialLayer.rimLight && (materialLayer.backgroundMode ? 'ml-rim-light-dynamic' : 'ml-rim-light'),
  materialLayer.physicalDepth && 'wa-physical-depth',
  materialLayer.heavyFeel && 'wa--heavy-feel',
].filter(Boolean) : [];
```

### CSS Variable Injection

```typescript
const materialLayerStyle: CSSProperties & Record<string, string> = hasMaterialLayer ? {
  '--stylelab-grain-filter': cssVars['--stylelab-material-grain'] || 'none',
  '--stylelab-edge-filter': cssVars['--stylelab-material-edge-treatment'] || 'none',
  ...(materialLayer.backgroundMode && {
    '--stylelab-rim-light-color': (() => {
      switch (materialLayer.backgroundMode) {
        case 'marble':
          return 'rgba(255, 248, 180, 0.15)'; // Gold for marble
        case 'parchment':
          return 'rgba(205, 127, 50, 0.12)'; // Bronze for parchment
        case 'void':
          return 'rgba(100, 200, 255, 0.10)'; // Cyan for void
        case 'bg':
          return 'rgba(255, 255, 255, 0.08)'; // White for custom bg
        default:
          return 'rgba(255, 248, 180, 0.12)';
      }
    })(),
  }),
} : {};
```

---

## Material Layer Properties

### 1. Physical Depth

**Purpose:** Creates multi-layer shadows to simulate physical contact with the canvas surface.

**CSS Class:** `.wa-physical-depth`

```css
.wa-physical-depth {
  /* Contact shadow: small/sharp for surface contact */
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.4),
    /* Elevation shadow: large/soft for depth */
    0 15px 30px rgba(0, 0, 0, 0.5),
    /* Inner bevel: catches light on edge */
    inset 1px 1px 0 rgba(255, 255, 255, 0.05);
}
```

**Behavior:**
- **OFF:** Component appears flat on the background
- **ON:** Component appears physically resting on the canvas with:
  - Contact shadow (4px offset, sharp)
  - Elevation shadow (15px offset, soft)
  - Inner bevel (1px inset highlight)

**UI Toggle:**
```typescript
const togglePhysicalDepth = useCallback(() => {
  setState((prev) => ({ ...prev, physicalDepth: !prev.physicalDepth }));
}, []);
```

---

### 2. Heavy Feel

**Purpose:** Provides weighted easing functions for physical presence during interactions.

**CSS Class:** `.wa--heavy-feel`

```css
.wa--heavy-feel {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0),
              box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0),
              filter 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0);
}

.wa--heavy-feel:hover {
  transform: scale(1.015) translateY(-2px);
  box-shadow:
    0 2px 3px rgba(0, 0, 0, 0.25),
    0 10px 20px rgba(0, 0, 0, 0.35),
    inset 1px 1px 0 rgba(255, 255, 255, 0.1);
  filter: brightness(1.08) saturate(1.1);
}

.wa--heavy-feel:active {
  transform: scale(0.985) translateY(1px);
}
```

**Behavior:**
- **OFF:** Standard transitions (faster, lighter)
- **ON:** Weighted transitions with:
  - Easing `cubic-bezier(0.2, 0.8, 0.2, 1.0)` for slow, deliberate movement
  - Hover: slight lift (translateY -2px), reduced shadow (simulates picking up)
  - Active: slight compression (translateY +1px, scale 0.985)
  - Increased brightness and saturation on hover

**UI Toggle:**
```typescript
const toggleHeavyFeel = useCallback(() => {
  setState((prev) => ({ ...prev, heavyFeel: !prev.heavyFeel }));
}, []);
```

---

### 3. Dynamic Rim Light

**Purpose:** Creates a 1px soft highlight on the edge that color-matches the background illumination.

**CSS Class:** `.ml-rim-light-dynamic`

```css
.ml-rim-light-dynamic::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 1px 1px 0 var(--stylelab-rim-light-color, rgba(255, 248, 180, 0.12));
  z-index: 1;
}
```

**Color Mapping:**
```typescript
'--stylelab-rim-light-color': (() => {
  switch (materialLayer.backgroundMode) {
    case 'marble':
      return 'rgba(255, 248, 180, 0.15)'; // Gold for marble
    case 'parchment':
      return 'rgba(205, 127, 50, 0.12)'; // Bronze for parchment
    case 'void':
      return 'rgba(100, 200, 255, 0.10)'; // Cyan for void
    case 'bg':
      return 'rgba(255, 255, 255, 0.08)'; // White for custom bg
    default:
      return 'rgba(255, 248, 180, 0.12)';
  }
})(),
```

**Behavior:**
- **OFF:** No rim light, component edge is plain
- **ON:** 1px inset highlight on edge with color matching background:
  - Marble: Gold highlight (warm)
  - Parchment: Bronze highlight (oxidized)
  - Void: Cyan highlight (cool)
  - Custom BG: White highlight (neutral)

**UI Toggle:**
```typescript
const toggleDynamicRimLight = useCallback(() => {
  setState((prev) => ({ ...prev, dynamicRimLight: !prev.dynamicRimLight }));
}, []);
```

---

## UI Controls

### Background Mode Selection

```typescript
const setBackgroundMode = useCallback((mode: BackgroundMode) => {
  setState((prev) => ({ ...prev, backgroundMode: mode }));
}, []);
```

**Background Styles:**
```typescript
const backgroundStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: -1,
  ...(state.backgroundMode === 'marble' && {
    backgroundImage: 'url(/assets/alt-visuals/v8/columns/Marble01/marble01_diff_2k.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }),
  ...(state.backgroundMode === 'parchment' && {
    backgroundImage: 'url(/assets/alt-visuals/v8/columns/Parchment01/parchment01_diff_2k.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }),
  ...(state.backgroundMode === 'void' && {
    background: '#0a0a0f',
  }),
  ...(state.backgroundMode === 'bg' && {
    backgroundImage: 'url(/assets/alt-visuals/v8/columns/bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }),
};
```

### Global State Toggles

```typescript
const toggleForceHovered = useCallback(() => {
  setState((prev) => ({ ...prev, forceHovered: !prev.forceHovered }));
}, []);

const toggleForceActive = useCallback(() => {
  setState((prev) => ({ ...prev, forceActive: !prev.forceActive }));
}, []);

const toggleForcePaused = useCallback(() => {
  setState((prev) => ({ ...prev, forcePaused: !prev.forcePaused }));
}, []);
```

**Global State Classes:**
```typescript
const globalStateClasses = clsx(
  state.forceHovered && 'is-hovered',
  state.forceActive && 'is-active',
  state.forcePaused && 'is-paused',
);
```

---

## Artifact Grid

### Component Structure

The sandbox displays 6 artifact types with different variants:

1. **POI Medallion** - Circular frame with bronze halo
2. **Quest Card** - Standard vertical grid layout
3. **HUD Header** - Wide horizontal strip
4. **Roster Sidebar** - Tall panel
5. **Micro Badge** - Hairline tooltip
6. **MLE Test** - Material Layer Engine demonstration

### Applying Material Layer Properties

Each artifact receives material layer classes conditionally:

```typescript
<div
  className={`wanderlust-artifact wa--circular wa--halo-bronze ${
    state.physicalDepth ? 'wa-physical-depth' : ''
  } ${state.heavyFeel ? 'wa--heavy-feel' : ''}`}
  style={{ width: 80, height: 80 }}
>
  <div className="wa-content flex items-center justify-center">
    <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">
      POI
    </span>
  </div>
</div>
```

### Material Layer Engine Test Component

```typescript
<StyleLabSurface
  presetId="wanderlust-v8"
  materialLayer={{
    baseTexture: 'obsidian',
    edgeTreatment: 'eroded-bronze',
    emissiveHalo: 'emerald',
    microInteraction: true,
    rimLight: state.dynamicRimLight,
    physicalDepth: state.physicalDepth,
    heavyFeel: state.heavyFeel,
    backgroundMode: state.backgroundMode,
  }}
  style={{ width: 140, height: 200 }}
>
  <div className="p-2">
    <h3 className="mb-2 text-[10px] uppercase tracking-[0.2em] text-amber-200">
      Physical
    </h3>
    <p className="text-[9px] text-white/70">
      Material Layer Engine
    </p>
  </div>
</StyleLabSurface>
```

---

## Complete Code Example

### Full Component Code

```typescript
import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { useStyleLabTokens } from '../ui/styleLab/hooks/useStyleLabTokens';
import { StyleLabSurface } from '../ui/styleLab/StyleLabSurface';

type BackgroundMode = 'marble' | 'parchment' | 'void' | 'bg';
type PresetId = 'wanderlust-v8' | 'wanderlust' | 'default';

interface SandboxState {
  backgroundMode: BackgroundMode;
  forceHovered: boolean;
  forceActive: boolean;
  forcePaused: boolean;
  presetId: PresetId;
  physicalDepth: boolean;
  heavyFeel: boolean;
  dynamicRimLight: boolean;
}

const PRESETS: { id: PresetId; label: string; description: string }[] = [
  { id: 'wanderlust-v8', label: 'Wanderlust V8', description: 'V8 Skin Architecture with eroded bronze borders' },
  { id: 'wanderlust', label: 'Wanderlust', description: 'Classic Wanderlust Style Lab preset' },
  { id: 'default', label: 'Minimal Frontier', description: 'Default Minimal Gameplay preset' },
];

export const V8SkinSandbox: React.FC = () => {
  const [state, setState] = useState<SandboxState>({
    backgroundMode: 'void',
    forceHovered: false,
    forceActive: false,
    forcePaused: false,
    presetId: 'wanderlust-v8',
    physicalDepth: true,
    heavyFeel: true,
    dynamicRimLight: true,
  });

  const { cssVars } = useStyleLabTokens({ presetId: state.presetId });

  const setBackgroundMode = useCallback((mode: BackgroundMode) => {
    setState((prev) => ({ ...prev, backgroundMode: mode }));
  }, []);

  const toggleForceHovered = useCallback(() => {
    setState((prev) => ({ ...prev, forceHovered: !prev.forceHovered }));
  }, []);

  const toggleForceActive = useCallback(() => {
    setState((prev) => ({ ...prev, forceActive: !prev.forceActive }));
  }, []);

  const toggleForcePaused = useCallback(() => {
    setState((prev) => ({ ...prev, forcePaused: !prev.forcePaused }));
  }, []);

  const setPresetId = useCallback((presetId: PresetId) => {
    setState((prev) => ({ ...prev, presetId }));
  }, []);

  const togglePhysicalDepth = useCallback(() => {
    setState((prev) => ({ ...prev, physicalDepth: !prev.physicalDepth }));
  }, []);

  const toggleHeavyFeel = useCallback(() => {
    setState((prev) => ({ ...prev, heavyFeel: !prev.heavyFeel }));
  }, []);

  const toggleDynamicRimLight = useCallback(() => {
    setState((prev) => ({ ...prev, dynamicRimLight: !prev.dynamicRimLight }));
  }, []);

  // Background styles
  const backgroundStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    ...(state.backgroundMode === 'marble' && {
      backgroundImage: 'url(/assets/alt-visuals/v8/columns/Marble01/marble01_diff_2k.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    ...(state.backgroundMode === 'parchment' && {
      backgroundImage: 'url(/assets/alt-visuals/v8/columns/Parchment01/parchment01_diff_2k.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    ...(state.backgroundMode === 'void' && {
      background: '#0a0a0f',
    }),
    ...(state.backgroundMode === 'bg' && {
      backgroundImage: 'url(/assets/alt-visuals/v8/columns/bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
  };

  const globalStateClasses = clsx(
    state.forceHovered && 'is-hovered',
    state.forceActive && 'is-active',
    state.forcePaused && 'is-paused',
  );

  return (
    <div style={backgroundStyle}>
      {/* Control Panel */}
      <div className="fixed top-4 left-4 z-50 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
        {/* Preset Selection */}
        <div className="mb-4 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Preset
          </span>
          <div className="flex gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPresetId(preset.id)}
                className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                  state.presetId === preset.id
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background Mode */}
        <div className="mb-4 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Background
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setBackgroundMode('marble')}
              className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                state.backgroundMode === 'marble'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
              }`}
            >
              Marble
            </button>
            <button
              onClick={() => setBackgroundMode('parchment')}
              className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                state.backgroundMode === 'parchment'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
              }`}
            >
              Parchment
            </button>
            <button
              onClick={() => setBackgroundMode('void')}
              className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                state.backgroundMode === 'void'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
              }`}
            >
              Vuoto Assoluto
            </button>
            <button
              onClick={() => setBackgroundMode('bg')}
              className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                state.backgroundMode === 'bg'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-black/30 text-white/60 border border-white/10 hover:border-white/30'
              }`}
            >
              BG
            </button>
          </div>
        </div>

        {/* Global State Toggles */}
        <div className="mb-4 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Global State
          </span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.forceHovered}
                onChange={toggleForceHovered}
                className="accent-amber-500"
              />
              <span className="text-xs uppercase tracking-[0.15em] text-white/60">
                .is-hovered
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.forceActive}
                onChange={toggleForceActive}
                className="accent-amber-500"
              />
              <span className="text-xs uppercase tracking-[0.15em] text-white/60">
                .is-active
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.forcePaused}
                onChange={toggleForcePaused}
                className="accent-amber-500"
              />
              <span className="text-xs uppercase tracking-[0.15em] text-white/60">
                .is-paused
              </span>
            </label>
          </div>
        </div>

        {/* Material Layer Toggles */}
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Material Layer
          </span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.physicalDepth}
                onChange={togglePhysicalDepth}
                className="accent-amber-500"
              />
              <span className="text-xs uppercase tracking-[0.15em] text-white/60">
                Physical Depth
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.heavyFeel}
                onChange={toggleHeavyFeel}
                className="accent-amber-500"
              />
              <span className="text-xs uppercase tracking-[0.15em] text-white/60">
                Heavy Feel
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.dynamicRimLight}
                onChange={toggleDynamicRimLight}
                className="accent-amber-500"
              />
              <span className="text-xs uppercase tracking-[0.15em] text-white/60">
                Dynamic Rim Light
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Artifact Grid */}
      <div className={`grid grid-cols-6 gap-4 ${globalStateClasses}`} style={cssVars}>
        {/* POI Medallion */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">
            POI
          </span>
          <div
            className={`wanderlust-artifact wa--circular wa--halo-bronze ${
              state.physicalDepth ? 'wa-physical-depth' : ''
            } ${state.heavyFeel ? 'wa--heavy-feel' : ''}`}
            style={{ width: 80, height: 80 }}
          >
            <div className="wa-content flex items-center justify-center">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                POI
              </span>
            </div>
          </div>
        </div>

        {/* Quest Card */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">
            Quest
          </span>
          <div
            className={`wanderlust-artifact wa--roomy ${
              state.physicalDepth ? 'wa-physical-depth' : ''
            } ${state.heavyFeel ? 'wa--heavy-feel' : ''}`}
            style={{ width: 140, height: 200 }}
          >
            <div className="wa-content">
              <h2 className="mb-1 text-xs tracking-[0.2em] uppercase text-amber-200">
                The Silent Watch
              </h2>
              <p className="mb-2 text-[10px] leading-tight text-white/70">
                Guard the ancient observatory through the long night.
              </p>
              <div className="flex gap-2 text-[9px] uppercase tracking-[0.15em] text-white/50">
                <span>Hard</span>
                <span>Rare</span>
              </div>
            </div>
          </div>
        </div>

        {/* HUD Header */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">
            HUD
          </span>
          <div
            className={`wanderlust-artifact wa--wide wa--snug ${
              state.physicalDepth ? 'wa-physical-depth' : ''
            } ${state.heavyFeel ? 'wa--heavy-feel' : ''}`}
            style={{ height: 50 }}
          >
            <div className="wa-content flex items-center justify-between px-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200">
                Village Status
              </span>
              <span className="text-[9px] uppercase tracking-[0.15em] text-white/60">
                Day 47
              </span>
            </div>
          </div>
        </div>

        {/* Roster Sidebar */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">
            Roster
          </span>
          <div
            className={`wanderlust-artifact wa--quiet ${
              state.physicalDepth ? 'wa-physical-depth' : ''
            } ${state.heavyFeel ? 'wa--heavy-feel' : ''}`}
            style={{ width: 140, height: 200 }}
          >
            <div className="wa-content p-2">
              <h3 className="mb-2 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                Residents
              </h3>
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded border border-white/5 bg-black/20 p-1"
                  >
                    <div className="h-4 w-4 rounded-full bg-amber-500/20" />
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-widest text-white/80">
                        R{i}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Micro Badge */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">
            Badge
          </span>
          <div
            className={`wanderlust-artifact wa--hairline wa--snug ${
              state.physicalDepth ? 'wa-physical-depth' : ''
            } ${state.heavyFeel ? 'wa--heavy-feel' : ''}`}
            style={{ width: 80, height: 30 }}
          >
            <div className="wa-content flex items-center justify-center">
              <span className="text-[8px] uppercase tracking-[0.15em] text-white/60">
                New Quest
              </span>
            </div>
          </div>
        </div>

        {/* Material Layer Engine Test */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">
            MLE
          </span>
          <StyleLabSurface
            presetId="wanderlust-v8'
            materialLayer={{
              baseTexture: 'obsidian',
              edgeTreatment: 'eroded-bronze',
              emissiveHalo: 'emerald',
              microInteraction: true,
              rimLight: state.dynamicRimLight,
              physicalDepth: state.physicalDepth,
              heavyFeel: state.heavyFeel,
              backgroundMode: state.backgroundMode,
            }}
            style={{ width: 140, height: 200 }}
          >
            <div className="p-2">
              <h3 className="mb-2 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                Physical
              </h3>
              <p className="text-[9px] text-white/70">
                Material Layer Engine
              </p>
            </div>
          </StyleLabSurface>
        </div>
      </div>
    </div>
  );
};
```

---

## CSS Reference

### Complete MLE CSS

```css
/* =====================================================================
   MATERIAL LAYER ENGINE — Procedural AAA-style composition
   ===================================================================== */

/* Physical Depth: Multi-layer shadows for contact + elevation + bevel */
.wa-physical-depth {
  /* Contact shadow: small/sharp for surface contact */
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.4),
    /* Elevation shadow: large/soft for depth */
    0 15px 30px rgba(0, 0, 0, 0.5),
    /* Inner bevel: catches light on edge */
    inset 1px 1px 0 rgba(255, 255, 255, 0.05);
}

/* Rim Light: 1px soft highlight on top-left edge for depth */
.ml-rim-light::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.08);
  z-index: 1;
}

/* Dynamic Rim Light: Color-matched to background */
.ml-rim-light-dynamic::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 1px 1px 0 var(--stylelab-rim-light-color, rgba(255, 248, 180, 0.12));
  z-index: 1;
}

/* Haptic Ready: Enable micro-interactions (hover scale, glow transitions) */
.wa--haptic-ready {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              filter 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.wa--haptic-ready:hover {
  transform: scale(1.01);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.4),
    inset 1px 1px 0 rgba(255, 255, 255, 0.08);
  filter: brightness(1.05);
}

.wa--haptic-ready:active {
  transform: scale(0.99);
}

/* Heavy Feel: Weighted easing for physical presence */
.wa--heavy-feel {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0),
              box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0),
              filter 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0);
}

.wa--heavy-feel:hover {
  transform: scale(1.015) translateY(-2px);
  box-shadow:
    0 2px 3px rgba(0, 0, 0, 0.25),
    0 10px 20px rgba(0, 0, 0, 0.35),
    inset 1px 1px 0 rgba(255, 255, 255, 0.1);
  filter: brightness(1.08) saturate(1.1);
}

.wa--heavy-feel:active {
  transform: scale(0.985) translateY(1px);
}
```

---

## Usage Patterns

### Applying Material Layer to Custom Components

```typescript
import { StyleLabSurface } from './ui/styleLab/StyleLabSurface';

function MyCustomComponent() {
  return (
    <StyleLabSurface
      presetId="wanderlust-v8"
      materialLayer={{
        baseTexture: 'obsidian',
        edgeTreatment: 'eroded-bronze',
        emissiveHalo: 'emerald',
        microInteraction: true,
        rimLight: true,
        physicalDepth: true,
        heavyFeel: true,
        backgroundMode: 'marble',
      }}
      style={{ width: 200, height: 300 }}
    >
      <div className="p-4">
        <h2>My Content</h2>
        <p>Component with material layer styling</p>
      </div>
    </StyleLabSurface>
  );
}
```

### Applying Classes Directly (Without MLE)

```typescript
function MyArtifact() {
  return (
    <div
      className="wanderlust-artifact wa-physical-depth wa--heavy-feel"
      style={{ width: 200, height: 300 }}
    >
      <div className="wa-content">
        <h2>My Content</h2>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Test all background modes (marble, parchment, void, bg)
- [ ] Verify physical depth shadows appear correctly
- [ ] Test heavy feel hover/active transitions
- [ ] Verify dynamic rim light color changes with background
- [ ] Test global state toggles (hovered, active, paused)
- [ ] Verify preset switching (wanderlust-v8, wanderlust, default)
- [ ] Test all artifact variants (circular, roomy, wide, quiet, hairline)
- [ ] Verify MLE component receives correct props from UI state
- [ ] Test TypeScript compilation
- [ ] Verify accessibility (keyboard navigation, screen readers)

---

## Future Enhancements

- Add more base texture options (wood, gold, stone)
- Add more edge treatments (sharp-silver, rough-copper)
- Add more emissive halo colors (crystal, void-fire)
- Add background image upload for custom rim light calculation
- Add preset saving/loading functionality
- Add component variant previewer
- Add CSS variable inspector
- Add performance metrics display
