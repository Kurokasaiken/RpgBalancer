# The Forgotten Observatory — Complete Package

This package contains the source files needed to recreate `<ForgottenObservatory />`.

## Setup notes

- React + TypeScript project.
- External deps used: `clsx`, `framer-motion` (only in `useHeavyDrag.ts`), `zod` (only in `matericSkinConfig.ts`). Remove those exports if you do not need them.
- Replace `@/ui/...` path aliases with relative paths, or configure `@/` to point at `src/`.
- Import the Google Fonts **Cinzel** and **EB Garamond**.
- Apply the `:root` skin-token CSS block once in your app so `var(--skin-*)` / `var(--wl-*)` render.
- Render `<WanderlustSurfaceDefs />` once at the root of your app.

## `skin-tokens.css` — base V9 Obsidian skin variables (`:root`)

```css
  --skin-surface-base: #060f16;
  --skin-surface-border: rgba(223,184,87,0.50);
  --skin-surface-radius: 14px;
  --skin-glow-accent: rgba(0,229,255,0.25);
  --skin-glow-primary: rgba(223,184,87,0.20);
  --skin-font-display: "Cinzel", "Trajan Pro", serif;
  --skin-font-serif: "EB Garamond", Georgia, serif;
  --skin-font-sans: system-ui, sans-serif;
  --skin-title-size: 30px;
  --skin-title-color: #f0cf6a;
  --skin-subtitle-size: 12px;
  --skin-subtitle-color: #f0cf6a;
  --skin-subtitle-tracking: 0.4em;
  --skin-body-size: 15.5px;
  --skin-body-color: rgba(237,224,196,0.92);
  --skin-text-primary: #F5F2E8;
  --skin-text-secondary: rgba(245,242,232,0.70);
  --skin-text-muted: rgba(245,242,232,0.50);
  --skin-label-primary: #c9a84e;
  --skin-label-tertiary: #9a8246;
  --skin-label-tracking: 0.22em;
  --skin-separator: rgba(216,177,62,0.2);
  --skin-status-met: #7bc96f;
  --skin-status-unmet: #d98a4a;
  --skin-status-wound: #a11d33;
  --skin-status-death: #6d3fb0;
  --skin-astro-enemy: #26314a;
  --skin-astro-nucleus: #ffe9b0;
  --skin-astro-stripe-wound: #c22a3d;
  --skin-astro-stripe-death: #05060a;
  --skin-inset-bg: #060f16;
  --skin-inset-border: rgba(223,184,87,0.50);
  --skin-inset-radius: 10px;
  --skin-footer-bg: rgba(0,0,0,0.25);
  --skin-footer-border: 1px solid rgba(216,177,62,0.2);
  --skin-footer-padding: 14px 18px;
  --skin-btn-border: 1px solid rgba(247,221,128,0.85);
  --skin-btn-color: #1a1208;
  --skin-btn-font: "Cinzel", "Trajan Pro", serif;
  --skin-btn-size: 12px;
  --skin-btn-tracking: 0.14em;
  --skin-btn-radius: 7px;
  --skin-btn-padding: 11px 22px;
  --skin-btn-text-shadow: 0 1px 0 rgba(255,255,255,0.35);
  --skin-btn-hover-lift: translateY(-2px);
  --skin-btn-active-filter: brightness(1.15) saturate(1.2);
  --skin-btn-disabled-opacity: 0.4;
  --skin-btn2-border: 1px solid rgba(223,184,87,0.35);
  --skin-btn2-color: #dfb857;
  --skin-icon-size: 18px;
  --skin-icon-color: #dfb857;
  --skin-icon-accent: #00e5ff;
  --skin-icon-opacity: 0.9;
  --skin-close-size: 34px;
  --skin-close-border: 1.5px solid rgba(201,162,39,0.80);
  --skin-close-color: #f7dd80;
  --skin-close-hover-color: #fff4d6;
  --skin-close-radius: 50%;
  --skin-close-offset: 12px;
  --skin-badge-bg: rgba(0,229,255,0.10);
  --skin-badge-border: 1px solid rgba(0,229,255,0.35);
  --skin-badge-color: #00e5ff;
  --skin-plaque-bg: rgba(6,29,37,0.5);
  --skin-plaque-border: 1.5px solid rgba(223,184,87,0.7);
  --skin-plaque-radius: 4px;
  --skin-plaque-padding: 4px 13px 5px;
  --skin-plaque-color: #f7dd80;
  --skin-plaque-tracking: 0.28em;
  --skin-titlesep-line: linear-gradient(90deg, transparent, rgba(223,184,87,0.45), transparent);
  --skin-titlesep-diamond-color: rgba(223,184,87,0.85);
  --skin-titlesep-diamond-glow: 0 0 8px rgba(223,184,87,0.5);
  --skin-cta-border: 2px solid #dfb857;
  --skin-cta-color: #f7dd80;
  --skin-cta-text-shadow: 0 2px 4px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,245,200,0.25);
  --skin-cta-hover-filter: brightness(1.18) saturate(1.08);
  --skin-cta-ornament-color: rgba(223,184,87,0.75);
  --skin-incision-label: 0 1px 0 rgba(0,0,0,0.85), 0 -1px 0 rgba(212,175,119,0.35);
  --skin-statbar-hp-start: #0a8a4a;
  --skin-statbar-hp-end: #6ee7b7;
  --skin-statbar-hp-glow: rgba(110,231,183,0.45);
  --skin-statbar-stamina-start: #d4af37;
  --skin-statbar-stamina-end: #f59e0b;
  --skin-statbar-stamina-glow: rgba(245,158,11,0.45);
  --skin-statbar-fatigue-start: #9e5a4a;
  --skin-statbar-fatigue-end: #d98a4a;
  --skin-statbar-fatigue-glow: rgba(217,138,74,0.6);
  --skin-statbar-track: linear-gradient(180deg, #0c0b0a, #050505);
  --skin-statbar-track-border: rgba(216,177,62,0.08);
  --skin-drag-handle-color: rgba(223,184,87,0.50);
  --skin-drag-handle-hover: #dfb857;
  --skin-drag-active-opacity: 0.7;
  --skin-drag-valid-glow: rgba(0,229,255,0.4);
  --skin-drag-invalid-glow: rgba(217,138,74,0.5);
  --skin-drag-lift-scale: 1.1;
  --skin-drag-lift-shadow: 0 12px 28px rgba(0,0,0,0.55);
  --skin-snap-ease: cubic-bezier(0.34, 1.56, 0.64, 1);
  --skin-snap-duration: 0.42s;
  --skin-snap-flash: brightness(1.28) saturate(1.12);
  --skin-snap-flash-duration: 70ms;
  --skin-medallion-size: 80px;
  --skin-medallion-ring-border: rgba(212,175,119,0.9);
  --skin-medallion-inner-inset: 4px;
  --skin-modal-overlay-bg: rgba(6,15,22,0.85);
  --skin-modal-container-bg: #060f16;
  --skin-modal-container-border: rgba(223,184,87,0.35);
  --skin-modal-z-index: 1000;
  --wl-font-display: "Cinzel", "Trajan Pro", serif;
  --wl-font-serif: "EB Garamond", Georgia, serif;
  --wl-font-sans: system-ui, sans-serif;
  --wl-title-size: 30px;
  --wl-body-size: 15.5px;
  --wl-text-title: #e4d5b7;
  --wl-text-body: rgba(237,224,196,0.92);
  --wl-label-primary: #c9a84e;
  --wl-label-tertiary: #9a8246;
  --wl-text-accent: #f0cf6a;
  --wl-separator: rgba(216,177,62,0.2);
  --wl-status-met: #7bc96f;
  --wl-status-unmet: #d98a4a;
```

## `src/ui/visualFidelityLab/ForgottenObservatory.tsx`

```tsx
import React from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import {
  WanderlustField,
  WanderlustFieldGroup,
  WanderlustRequirementList,
  WanderlustRecordList,
  WanderlustDivider,
  WanderlustSectionHeader,
  WanderlustAmbientField,
} from '@/ui/wanderlust-surface/layout';
import { SURFACE_MATERIAL, SURFACE_MATERIAL_LAYER, FIELD_BACKGROUND, FIELD_VIGNETTE, GOLD_FILET_SHADOW } from './foundationRecipe';
import { WellBronzeBezel } from './plateVariants';

/**
 * REBUILD — "The Forgotten Observatory".
 *
 * Designed from scratch, NOT by relabelling the reference. The reference was
 * header → fields → requirements → records. This is a different hierarchy:
 * status → three stacked InsetPanel wells (progress / reward / crew) → chronicle
 * → warnings. Inset-heavy and progress-driven.
 *
 * Built ONLY from the existing grammar:
 *   - WanderlustSurface (frame), WanderlustAmbientField (atmosphere)
 *   - InsetPanel (content wells)
 *   - layout primitives (Field/StatBar/RecordList/RequirementList/Section/Divider)
 *   - existing --skin-* tokens
 *
 * The "Required Crew" slot well is DELIBERATELY composed "poor" — plain divs
 * inside an InsetPanel, no ResidentSlotRack, no new SlotWell component. This is
 * the measurand: can the current grammar birth a rich repeated content well, or
 * does it read as a flat web-app list? (see fidelity-notes.md, Finding #1 slot).
 */
export const ForgottenObservatory: React.FC = () => (
  <WanderlustSurface
    shape="panel"
    material={SURFACE_MATERIAL}
    interactive={false}
    materialLayer={SURFACE_MATERIAL_LAYER}
    style={{ width: '100%', borderRadius: 14 }}
  >
    <WanderlustAmbientField
      fireflyCount={9}
      style={{
        // V9 "anima", LIFTED (see foundationRecipe.FIELD_BACKGROUND): azure
        // light raining from above onto a deep-night field that breathes —
        // no longer near-black. The wells keep darker floors, so they now
        // read recessed by rank ordering ("lighten the surroundings, not
        // the hole").
        background: FIELD_BACKGROUND,
        boxShadow: FIELD_VIGNETTE,
        borderRadius: 'inherit',
      }}
    >
      <div style={{ padding: 26 }}>
        {/* ── Header (plaque + incised title + subtitle + close coin) ── */}
        <div className="skin-title-row">
          <span className="skin-plaque" style={{ userSelect: 'none' }}>Expedition</span>
          <div style={{ flex: '1 1 auto' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--skin-font-display)',
                fontSize: 'var(--skin-title-size)',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--skin-title-color)',
                textShadow: '0 2px 4px rgba(0,0,0,0.85)',
              }}
            >
              The Forgotten Observatory
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                fontFamily: 'var(--skin-font-display)',
                fontSize: 'var(--skin-subtitle-size)',
                letterSpacing: 'var(--skin-subtitle-tracking)',
                textTransform: 'uppercase',
                color: 'var(--skin-subtitle-color)',
              }}
            >
              Distant Reach · Sealed Ruins
            </p>
          </div>
          <button type="button" className="skin-close-corner" aria-label="Close" tabIndex={-1}>×</button>
        </div>

        <div className="skin-titlesep">
          <span className="skin-titlesep__line" />
          <span className="skin-titlesep__diamond">✦</span>
          <span className="skin-titlesep__line" />
        </div>

        <p style={{ margin: '0 0 6px', fontFamily: 'var(--skin-font-serif)', fontSize: 'var(--skin-body-size)', color: 'var(--skin-body-color)' }}>
          A cold light bleeds from the sealed dome beyond the ridge. What the last crew charted, none returned to confirm.
        </p>

        <WanderlustDivider />

        {/* ── Expedition status: quick facts ── */}
        <WanderlustSectionHeader tier="primary">Expedition Status</WanderlustSectionHeader>
        <WanderlustFieldGroup layout="columns" columns={3}>
          <WanderlustField label="Duration" value="14 days" />
          <WanderlustField label="Distance" value="Far Reach" />
          <WanderlustField label="Crew" value="3 / 5" />
        </WanderlustFieldGroup>

        <WanderlustDivider />

        {/* ── Well 1: progress ── */}
        {/* REFINEMENT (measurand): the shipped WanderlustStatBar renders a rounded
            "pill" (its materic carved-channel variant is gated behind a context
            provider not in the grammar). Composed here "poor" as a channel CARVED
            into slate: sharp 2px corners + deep inset shadow, green sap flowing
            inside. Spec for a future materic StatBar primitive. */}
        <div style={{ position: 'relative', marginBottom: 14, padding: '15px 17px', background: 'linear-gradient(180deg, #040a11, #020509)', borderRadius: 8, boxShadow: 'inset 0 1px 0 rgba(224,178,66,0.10), inset 0 2px 8px rgba(0,0,0,0.7)' }}>
          <WellBronzeBezel />
          <WanderlustSectionHeader tier="tertiary" hint="charting the dome" marginBottom="sm">
            Observatory Progress
          </WanderlustSectionHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--skin-font-display)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--skin-label-primary, #c9a84e)', whiteSpace: 'nowrap' }}>
              Survey Completion
            </span>
            <div
              style={{
                flex: 1,
                height: 13,
                position: 'relative',
                borderRadius: 2,
                background: 'linear-gradient(180deg, #0a0908, #040404)',
                border: '1px solid rgba(216,177,62,0.16)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9), inset 0 1px 0 rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.03)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '63%',
                  borderRadius: 1,
                  background: 'linear-gradient(180deg, #86d8a1 0%, #3a9c62 55%, #206e42 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(205,255,222,0.55), inset 0 -2px 3px rgba(0,0,0,0.45), 0 0 8px rgba(80,200,120,0.35)',
                }}
              />
            </div>
            <span style={{ fontFamily: 'var(--skin-font-sans, system-ui)', fontSize: 11, color: 'var(--skin-body-color)', whiteSpace: 'nowrap' }}>63/100</span>
          </div>
        </div>

        {/* ── Well 2: reward reveal — DIFFERENTIATED as a special reward plaque ── */}
        {/* Not a status well: a reward is PRESENTED on the surface, framed in gold.
            The muddy-brown bg is GONE — obsidian floor (blue-black, on-palette),
            lifted a hair at the top (photons up). Notched 45° top corners + the
            thin GOLD_FILET frame (isolated in foundationRecipe — first consumer)
            + ONE bright-gold focal (the reward name) read it as precious, not a
            box. It sits RAISED above the field (drop-shadow follows the notched
            silhouette) — the one element that comes toward you = the prize. */}
        <div
          style={{
            position: 'relative',
            marginBottom: 14,
            padding: '15px 17px',
            background: [
              // whisper warm reward-glow raining from the top notch (focal, restrained)
              'radial-gradient(130% 90% at 50% 0%, rgba(224,178,66,0.09) 0%, transparent 55%)',
              // obsidian floor — cool blue-black, lifted a hair at the top
              'linear-gradient(180deg, #0b1620 0%, #060f16 100%)',
            ].join(', '),
            clipPath: 'polygon(13px 0, calc(100% - 13px) 0, 100% 13px, 100% 100%, 0 100%, 0 13px)',
            boxShadow: GOLD_FILET_SHADOW,
            // raised off the field — drop-shadow (not box-shadow) so it follows the notched silhouette
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
          }}
        >
          <WanderlustSectionHeader tier="tertiary" marginBottom="sm">Reward Recovered</WanderlustSectionHeader>
          <WanderlustField
            orientation="horizontal"
            label="Reward"
            tier="tertiary"
            value={
              <span style={{ color: '#f0cf6a', textShadow: '0 0 14px rgba(240,207,106,0.28), 0 1px 0 rgba(0,0,0,0.6)' }}>
                Ancient Compass
              </span>
            }
          />
          <p style={{ margin: '6px 0 0', fontFamily: 'var(--skin-font-serif)', fontSize: '12px', color: 'var(--skin-body-color)', opacity: 0.85 }}>
            A brass astrolabe that points not north, but toward the nearest undiscovered ruin.
          </p>
        </div>

        {/* ── Well 3: repeated slot well — COMPOSED "poor" from primitives ── */}
        <div style={{ position: 'relative', marginBottom: 4, padding: '15px 17px', background: 'linear-gradient(180deg, #040a11, #020509)', borderRadius: 8, boxShadow: 'inset 0 1px 0 rgba(224,178,66,0.10), inset 0 2px 8px rgba(0,0,0,0.7)' }}>
          <WellBronzeBezel />
          <WanderlustSectionHeader tier="tertiary" hint="assigned" marginBottom="sm">Required Crew</WanderlustSectionHeader>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {[
              { role: 'Astronomer', initial: 'A', filled: true },
              { role: 'Scout', initial: 'S', filled: true },
              { role: 'Cartographer', initial: '—', filled: false },
            ].map((slot) => (
              <div
                key={slot.role}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 6px',
                  borderRadius: 8,
                  border: slot.filled ? 'var(--skin-plaque-border)' : '1px dashed rgba(180,130,30,0.35)',
                  background: slot.filled ? 'rgba(6,29,37,0.5)' : 'rgba(0,0,0,0.28)',
                  boxShadow: slot.filled ? 'inset 0 1px 0 rgba(220,175,60,0.15), inset 0 -1px 0 rgba(0,0,0,0.35)' : 'none',
                }}
              >
                {/* REFINEMENT: embossed bronze coin, not flat glyph-in-circle.
                    Radial metal gradient + top-light/bottom-dark inset bevel +
                    contact shadow give physical weight; the letter reads as
                    incised into the coin. Spec for a future materic token/medal. */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: 17,
                    fontWeight: 800,
                    color: slot.filled ? '#3a2a0f' : 'rgba(150,125,70,0.45)',
                    border: slot.filled ? '1px solid rgba(120,84,26,0.9)' : '1px solid rgba(120,100,60,0.3)',
                    background: slot.filled
                      ? 'radial-gradient(circle at 37% 27%, #f4d27e 0%, #cf9a3a 42%, #8a5e1e 78%, #5c3d12 100%)'
                      : 'radial-gradient(circle at 40% 30%, rgba(50,42,24,0.55), rgba(0,0,0,0.5))',
                    boxShadow: slot.filled
                      ? 'inset 0 2px 2px rgba(255,231,158,0.5), inset 0 -3px 4px rgba(60,38,10,0.8), 0 2px 3px rgba(0,0,0,0.55)'
                      : 'inset 0 2px 4px rgba(0,0,0,0.6)',
                    textShadow: slot.filled ? '0 1px 0 rgba(255,236,178,0.55)' : 'none',
                  }}
                >
                  {slot.initial}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: slot.filled ? 'var(--skin-subtitle-color)' : 'rgba(160,140,90,0.5)',
                  }}
                >
                  {slot.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <WanderlustDivider />

        {/* ── Event chronicle ── */}
        <WanderlustSectionHeader tier="tertiary">Event Chronicle</WanderlustSectionHeader>
        <WanderlustRecordList
          columns={[
            { width: '64px', variant: 'caption' },
            { width: '1fr', variant: 'body' },
          ]}
          records={[
            ['Day 1', 'Scout entered the ruins'],
            ['Day 6', 'Signal detected beneath the dome'],
            ['Day 9', 'The sealed lens began to resonate'],
          ]}
          rail
        />

        <WanderlustDivider />

        {/* ── Warnings (unmet requirements) ── */}
        <WanderlustSectionHeader tier="tertiary" hint="crew readiness">Warnings</WanderlustSectionHeader>
        <WanderlustRequirementList
          requirements={[
            { label: 'Astronomy', current: 5, required: 3 },
            { label: 'Wisdom', current: 8, required: 10 },
          ]}
        />
      </div>
    </WanderlustAmbientField>
  </WanderlustSurface>
);

export default ForgottenObservatory;

```

## `src/ui/visualFidelityLab/foundationRecipe.ts`

```ts
import type { MaterialLayerConfig } from '@/ui/wanderlust-surface/WanderlustSurface';
import type { MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';

/**
 * Visual Fidelity Lab — shared foundation (the GRAMMAR, not the content).
 *
 * Identical material language to the frozen reference (v9-skin-sandbox,
 * "Layout Primitives"). The rebuild MAY change hierarchy/spacing/rhythm but
 * MUST NOT introduce a new palette, frame, or material language. These three
 * constants encode exactly that boundary.
 */
export const OBSIDIAN_BG = 'var(--skin-surface-bg)';

/**
 * The panel FIELD background — CANDIDATE A, APPROVED & PROMOTED (2026-07-18):
 * azure light leak (barely touched) raining from above onto a BLU-NOTTE base
 * (#08121f) — a minimal step up from the near-black #060f16 that read too dark
 * at medium screen brightness. The green-teal cast the user liked is the cyan
 * leak over the dark base, NOT a base hue (lifting the base kills it). Now the
 * shared field for BOTH observatories + the plate quad. "Più luminoso, non più
 * chiaro."
 */
export const FIELD_BACKGROUND = [
  'radial-gradient(circle at 50% -10%, rgba(0,229,255,0.13) 0%, rgba(0,150,255,0.03) 50%, transparent 80%)',
  '#08121f',
].join(', ');

/** Gentle blu-notte edge vignette (no crushing to black). */
export const FIELD_VIGNETTE = 'inset 0 0 60px rgba(6,12,22,0.7)';

/**
 * GOLD_FILET — the thin gold hairline frame, ISOLATED as a recipe (NOT a
 * primitive yet: governance = extract a component only after a 2nd–3rd real
 * consumer confirms the pattern). Today it has ONE consumer: the Ancient Compass
 * reward plaque. Kept here so the next small component (badge / chip / token)
 * inherits the exact same filet — same hue, same weight — instead of being
 * hand-reinvented and drifting off-palette.
 *
 * Polarity follows the "raised element" law (mirror of a carved well): warm-lit
 * lip on the TOP edge, dark shade on the BOTTOM. Compose into `boxShadow` via
 * GOLD_FILET_SHADOW, or cherry-pick the three parts.
 */
export const GOLD_FILET = {
  /** 1px gold perimeter — the exact line preserved from the reward plaque. */
  hairline: 'inset 0 0 0 1px rgba(196,146,42,0.55)',
  /** warm-lit inner lip along the top edge. */
  topSheen: 'inset 0 1px 0 rgba(224,178,66,0.22)',
  /** dark inner shade along the bottom edge. */
  bottomShade: 'inset 0 -1px 0 rgba(0,0,0,0.4)',
} as const;

/** Ready-to-spread boxShadow value for the gold filet frame. */
export const GOLD_FILET_SHADOW = [
  GOLD_FILET.hairline,
  GOLD_FILET.topSheen,
  GOLD_FILET.bottomShade,
].join(', ');

/**
 * GOLD_FILET_SOFT — a MORE DELICATE, thinner sibling of GOLD_FILET (2026-07-18).
 * GOLD_FILET above is UNTOUCHED — this is a NEW version, not an edit. Reason:
 * frame weight = hierarchy. The reward plaque SHOUTS (GOLD_FILET, gold at 0.55);
 * the recessed content WELLS must WHISPER — same warm gold hue, roughly half the
 * intensity, so a well reads as luminous-edged (it was invisible on the blu-notte
 * field) without competing with the reward. Used as a real CSS `border` (crisp on
 * the wells' rounded corners) plus warm-lit top / dark base / recess-depth insets.
 */
export const GOLD_FILET_SOFT = {
  /** thin luminous gold edge — the delicate border the wells were missing. */
  border: '1px solid rgba(198,150,54,0.32)',
  /** warm-lit inner lip along the top edge (softer than the reward's). */
  topSheen: 'inset 0 1px 0 rgba(224,178,66,0.14)',
  /** dark inner shade along the bottom edge. */
  bottomShade: 'inset 0 -1px 0 rgba(0,0,0,0.4)',
  /** the recess itself — keeps the carved depth under the gold edge. */
  depth: 'inset 0 2px 8px rgba(0,0,0,0.7)',
} as const;

/** Ready-to-spread boxShadow value for the soft gold filet (pair with .border). */
export const GOLD_FILET_SOFT_SHADOW = [
  GOLD_FILET_SOFT.topSheen,
  GOLD_FILET_SOFT.bottomShade,
  GOLD_FILET_SOFT.depth,
].join(', ');

/** Same frame material as the reference. Not negotiable for the spike. */
export const SURFACE_MATERIAL: MaterialPreset = 'bronze';

/** Same depth/rim treatment as the reference panel. */
export const SURFACE_MATERIAL_LAYER: MaterialLayerConfig = {
  physicalDepth: true,
  rimLight: true,
  backgroundMode: 'bg',
  microInteraction: false,
  heavyFeel: false,
};

```

## `src/ui/visualFidelityLab/plateVariants.tsx`

```tsx
import React, { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './matericPlate.css';

/**
 * plateVariants — LAB-ONLY. Four candidate implementations of the recessed
 * content well, each a DIFFERENT physical hypothesis (object-identity law):
 *
 *   A · Bezel Molding   — a raised bronze picture-frame molding with real
 *                         thickness; the interior reads recessed because the
 *                         molding visibly stands proud (one metal band, lit
 *                         from above, painted as a single vertical gradient).
 *   B · Sloped Walls    — a true carved cut: four 45°-mitred trapezoid walls
 *                         (ONE geometry, shared vertices — no corner
 *                         artifacts), dark walls where light can't reach
 *                         (top/left), warm-lit walls where it can (bottom/
 *                         right), floor in contact shadow under the top wall.
 *   C · Obsidian Inlay  — a material change: a polished obsidian tile set
 *                         into the panel; depth is minimal, material presence
 *                         is maximal (diagonal sheen + pooled-glass corners).
 *   D · Engraved Filet  — luxury double-line gilded engraving (two gold
 *                         hairlines separated by a dark groove) + corner
 *                         diamonds echoing WanderlustSurface's DNA.
 *
 * Shared floor (all four): obsidian #060f16 + azure light-leak (world anima)
 * + contact AO. No grey, no silver, no muddy brown, no blurred dark-on-dark
 * shadows. Hard edges declare the depth; the floor stays opulent.
 * STATIC — no motion (Life Layer comes later).
 */

const RX = 9;

/* ── shared plumbing ─────────────────────────────────────────────── */

function usePlateSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 300, h: 120 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...size };
}

export interface PlateVariantProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Obsidian floor + azure leak + contact AO — identical in all variants. */
const Floor: React.FC<{ w: number; h: number; uid: string }> = ({ w, h, uid }) => (
  <>
    <defs>
      <radialGradient id={`azure-${uid}`} cx="50%" cy="0%" r="88%">
        <stop offset="0%" stopColor="rgba(0,229,255,0.10)" />
        <stop offset="45%" stopColor="rgba(0,150,255,0.03)" />
        <stop offset="80%" stopColor="rgba(0,150,255,0)" />
      </radialGradient>
      <radialGradient id={`ao-${uid}`} cx="50%" cy="46%" r="72%">
        <stop offset="55%" stopColor="rgba(2,8,12,0)" />
        <stop offset="90%" stopColor="rgba(1,5,9,0.42)" />
        <stop offset="100%" stopColor="rgba(0,3,6,0.66)" />
      </radialGradient>
    </defs>
    <rect x="0" y="0" width={w} height={h} fill="#060f16" />
    <rect x="0" y="0" width={w} height={h} fill={`url(#azure-${uid})`} />
    <rect x="0" y="0" width={w} height={h} fill={`url(#ao-${uid})`} />
  </>
);

/* ── A · Bezel Molding ───────────────────────────────────────────── */

export const BezelMolding: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  const BAND = 5; // molding thickness
  const inset = BAND / 2 + 1;
  const innerX = BAND + 1;
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg className="mp-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x={innerX} y={innerX} width={w - innerX * 2} height={h - innerX * 2} rx={RX - 4} />
          </clipPath>
          {/* the molding band as an artist paints raised metal (NMM ladder):
              ivory specular crest → gold → body → bronze turn → warm-umber core
              at ~80% → a reflected-light uptick at the very bottom. Raised = lit
              crest at top. Warm throughout, no grey. */}
          <linearGradient id={`band-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3c9" />
            <stop offset="11%" stopColor="#f0cf6a" />
            <stop offset="33%" stopColor="#dfb857" />
            <stop offset="55%" stopColor="#b0803a" />
            <stop offset="80%" stopColor="#5f3f16" />
            <stop offset="100%" stopColor="#7a5220" />
          </linearGradient>
          <linearGradient id={`drop-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,3,8,0.7)" />
            <stop offset="100%" stopColor="rgba(0,3,8,0)" />
          </linearGradient>
        </defs>

        {/* dark seat line so the molding separates from the field */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={RX} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
        {/* THE molding: one band, one vertical light */}
        <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} rx={RX - 2} fill="none" stroke={`url(#band-${uid})`} strokeWidth={BAND} />
        {/* inner step edge (hard) */}
        <rect x={innerX} y={innerX} width={w - innerX * 2} height={h - innerX * 2} rx={RX - 4} fill="none" stroke="rgba(1,3,6,0.8)" strokeWidth="1" />

        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          {/* LIFT the interior 4-8 RGB (azure family) so the wall shadow has
              luminance to remove — the research's "lift funds the wall" */}
          <rect x={innerX} y={innerX} width={w - innerX * 2} height={h - innerX * 2} fill="rgba(26,52,72,0.16)" />
          {/* contact shadow the raised molding casts down into the well (top wall) */}
          <rect x={innerX} y={innerX} width={w - innerX * 2} height="11" fill={`url(#drop-${uid})`} />
          {/* load-bearing cue: warm-gold lit lip on the bottom-inside edge */}
          <rect x={innerX + 1} y={h - innerX - 2} width={w - (innerX + 1) * 2} height="1.25" fill="rgba(240,207,106,0.34)" />
        </g>
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── Well bronze bezel (frame-only overlay, reused NMM ladder) ────── */

/**
 * WellBronzeBezel — a FRAME-ONLY bronze bezel overlay (the medallion's NMM metal
 * ladder: ivory crest → gold → bronze → warm-umber). Unlike BezelMolding it draws
 * NO interior — it sits ON TOP of a well that already owns its dark floor, adding
 * only the sculpted metal edge. `band` = molding thickness in px (default 1.75 =
 * "half of medio"). Absolutely positioned, pointer-transparent; drop it as the
 * first child of a position:relative well. Content stays inset by the well's
 * padding, so it never collides with the thin perimeter band.
 */
export const WellBronzeBezel: React.FC<{ band?: number; rx?: number }> = ({ band = 1.75, rx = RX - 1 }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  const inset = band / 2 + 1;
  const innerX = band + 1;
  return (
    <div ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          {/* NMM ladder — WARM-GOLD crest (no white specular: the #fff3c9 crest
              read too clean/perfect/luminous). Dim warm gold on top → bronze →
              warm-umber base. */}
          <linearGradient id={`wbb-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8bd78" />
            <stop offset="12%" stopColor="#cfaf63" />
            <stop offset="34%" stopColor="#c2a355" />
            <stop offset="55%" stopColor="#a0762f" />
            <stop offset="80%" stopColor="#5f3f16" />
            <stop offset="100%" stopColor="#71501f" />
          </linearGradient>
          {/* micro-wear: displaces the band edge so the metal reads WORN, not
              machine-perfect (anti-perfection law). Subtle at this band width. */}
          <filter id={`wear-${uid}`} x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75 0.4" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {/* dark seat: separates the metal from the field */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={rx + 1} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {/* the bronze band — one vertical light (NMM ladder), half of medio */}
        <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} rx={rx} fill="none" stroke={`url(#wbb-${uid})`} strokeWidth={band} vectorEffect="non-scaling-stroke" />
        {/* inner hard step where the metal meets the recess */}
        <rect x={innerX} y={innerX} width={w - innerX * 2} height={h - innerX * 2} rx={Math.max(2, rx - 1)} fill="none" stroke="rgba(1,3,6,0.8)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
};

/* ── B · Sloped Walls (mitred trapezoids — one geometry) ─────────── */

export const SlopedWalls: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  // Foreshortened wall depths under a top-light: the top wall shows tallest,
  // sides medium, bottom shortest (research: uniform depths read as a flat
  // vignette; foreshortening is what reads as a real cut).
  const T = 8, L = 5, R = 5, B = 3;
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg
        className="mp-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x={L} y={T} width={w - L - R} height={h - T - B} rx={4} />
          </clipPath>
          {/* userSpace gradients: each wall shades rim→floor. Darks are
              azure-black (hue≈210), lights are warm gold — never grey. */}
          <linearGradient id={`wt-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={T}>
            <stop offset="0%" stopColor="rgba(1,4,8,0.92)" />
            <stop offset="100%" stopColor="rgba(1,4,8,0.2)" />
          </linearGradient>
          <linearGradient id={`wl-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={L} y2="0">
            <stop offset="0%" stopColor="rgba(1,4,8,0.85)" />
            <stop offset="100%" stopColor="rgba(1,4,8,0.18)" />
          </linearGradient>
          <linearGradient id={`wb-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={h} x2="0" y2={h - B}>
            <stop offset="0%" stopColor="rgba(224,178,66,0.38)" />
            <stop offset="100%" stopColor="rgba(224,178,66,0.06)" />
          </linearGradient>
          <linearGradient id={`wr-${uid}`} gradientUnits="userSpaceOnUse" x1={w} y1="0" x2={w - R} y2="0">
            <stop offset="0%" stopColor="rgba(224,178,66,0.24)" />
            <stop offset="100%" stopColor="rgba(224,178,66,0.04)" />
          </linearGradient>
          <linearGradient id={`drop-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={T} x2="0" y2={T + 7}>
            <stop offset="0%" stopColor="rgba(0,3,7,0.55)" />
            <stop offset="100%" stopColor="rgba(0,3,7,0)" />
          </linearGradient>
        </defs>

        {/* interior: floor + azure LIFT (the lift is what funds the walls'
            darkness — without it dark walls have no luminance to remove) */}
        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          <rect x={L} y={T} width={w - L - R} height={h - T - B} fill="rgba(30,58,80,0.13)" />
          {/* static micro-grain so the interior isn't machine-perfect */}
          <rect x="0" y="0" width={w} height={h} fill="#0b1620" filter="url(#bronze-ws-f-fs)" opacity="0.28" />
          {/* contact shadow the rim casts onto the lifted floor */}
          <rect x={L} y={T} width={w - L - R} height="7" fill={`url(#drop-${uid})`} />
        </g>

        {/* THE walls: four mitred trapezoids sharing vertices — one geometry,
            asymmetric depths, 45° miters meet perfectly (no doubled lines) */}
        <polygon points={`0,0 ${w},0 ${w - R},${T} ${L},${T}`} fill={`url(#wt-${uid})`} />
        <polygon points={`0,0 ${L},${T} ${L},${h - B} 0,${h}`} fill={`url(#wl-${uid})`} />
        <polygon points={`0,${h} ${L},${h - B} ${w - R},${h - B} ${w},${h}`} fill={`url(#wb-${uid})`} />
        <polygon points={`${w},0 ${w},${h} ${w - R},${h - B} ${w - R},${T}`} fill={`url(#wr-${uid})`} />

        {/* miter seams: faint 45° facet hairlines at the corners — the chisel
            cuts, echoing the notched-plaque language */}
        <path d={`M 0,0 L ${L},${T} M ${w},0 L ${w - R},${T} M 0,${h} L ${L},${h - B} M ${w},${h} L ${w - R},${h - B}`} stroke="rgba(2,6,10,0.45)" strokeWidth="0.75" fill="none" />

        {/* rim break lines: hard dark crease where the surface tears (top/left),
            a solid gold kiss where the cut edge catches light (bottom/right) */}
        <path d={`M 0.5,${h - 1} L 0.5,0.5 L ${w - 1},0.5`} fill="none" stroke="rgba(2,5,9,0.7)" strokeWidth="1" />
        <path d={`M ${w - 0.5},1 L ${w - 0.5},${h - 0.5} L 1,${h - 0.5}`} fill="none" stroke="rgba(240,207,106,0.32)" strokeWidth="1" />
        {/* inner lip catching light at the bottom of the well */}
        <rect x={L + 1} y={h - B - 1.5} width={w - L - R - 2} height="1" fill="rgba(240,207,106,0.3)" />

        {/* the floor's cut edge just below the opening — research: the single
            strongest surviving recess cue on near-black */}
        <line x1={3} y1={h + 1} x2={w - 3} y2={h + 1} stroke="rgba(223,184,87,0.17)" strokeWidth="1" />
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── C · Obsidian Inlay (polished material change) ───────────────── */

const ObsidianInlay: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg className="mp-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx={RX - 1} />
          </clipPath>
          {/* polished-stone sheen: one cool diagonal band, upper third */}
          <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0.9">
            <stop offset="0%" stopColor="rgba(140,220,255,0)" />
            <stop offset="22%" stopColor="rgba(140,220,255,0.055)" />
            <stop offset="34%" stopColor="rgba(140,220,255,0)" />
            <stop offset="70%" stopColor="rgba(240,207,106,0)" />
            <stop offset="86%" stopColor="rgba(240,207,106,0.028)" />
            <stop offset="100%" stopColor="rgba(240,207,106,0)" />
          </linearGradient>
          <radialGradient id={`pool-${uid}`} cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(0,4,8,0)" />
            <stop offset="100%" stopColor="rgba(0,4,8,0.8)" />
          </radialGradient>
        </defs>

        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          <rect x="0" y="0" width={w} height={h} fill={`url(#sheen-${uid})`} />
          {/* pooled-glass corners: the polish darkens where it curves away */}
          <rect x="0" y="0" width={w} height={h} fill={`url(#pool-${uid})`} />
        </g>

        {/* incised seat: dark cut + bronze edge — the inlay's setting */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={RX} fill="none" stroke="rgba(120,84,26,0.55)" strokeWidth="1" />
        <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx={RX - 1} fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="1" />
        {/* light kissing the bottom edge of the polished tile */}
        <path d={`M ${w - 3},${h - 1.5} L ${RX},${h - 1.5}`} fill="none" stroke="rgba(240,207,106,0.2)" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── D · Engraved Filet (double gilded line + corner diamonds) ───── */

const EngravedFilet: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  const G = 4.5; // inner line inset
  const diamonds = [
    [G + 4, G + 4],
    [w - G - 4, G + 4],
    [G + 4, h - G - 4],
    [w - G - 4, h - G - 4],
  ] as const;
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg className="mp-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x="1" y="1" width={w - 2} height={h - 2} rx={RX} />
          </clipPath>
          <linearGradient id={`drop-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,3,8,0.5)" />
            <stop offset="100%" stopColor="rgba(0,3,8,0)" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          <rect x="1" y="1" width={w - 2} height="7" fill={`url(#drop-${uid})`} />
        </g>

        {/* the double filet: outer hairline · dark groove · brighter inner hairline */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={RX} fill="none" stroke="rgba(223,184,87,0.3)" strokeWidth="1" />
        <rect x="2.5" y="2.5" width={w - 5} height={h - 5} rx={RX - 2} fill="none" stroke="rgba(0,0,0,0.62)" strokeWidth="2" />
        <rect x={G} y={G} width={w - G * 2} height={h - G * 2} rx={RX - 3.5} fill="none" stroke="rgba(240,207,106,0.48)" strokeWidth="1" />

        {/* corner diamonds — the Surface's DNA at well scale */}
        {diamonds.map(([cx, cy], i) => (
          <g key={i}>
            <polygon
              points={`${cx},${cy - 3.2} ${cx + 3.2},${cy} ${cx},${cy + 3.2} ${cx - 3.2},${cy}`}
              fill="rgba(20,12,4,0.9)"
              stroke="rgba(223,184,87,0.55)"
              strokeWidth="0.8"
            />
            <polygon points={`${cx},${cy - 3.2} ${cx + 3.2},${cy} ${cx},${cy}`} fill="rgba(240,207,106,0.3)" />
          </g>
        ))}
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── registry ────────────────────────────────────────────────────── */

export const PLATE_VARIANTS: {
  key: string;
  label: string;
  Component: React.FC<PlateVariantProps>;
}[] = [
  { key: 'bezel', label: 'A · Bezel Molding', Component: BezelMolding },
  { key: 'walls', label: 'B · Sloped Walls', Component: SlopedWalls },
  { key: 'inlay', label: 'C · Obsidian Inlay', Component: ObsidianInlay },
  { key: 'filet', label: 'D · Engraved Filet', Component: EngravedFilet },
];

```

## `src/ui/wanderlust-surface/index.ts`

```ts
export { WanderlustSurface } from './WanderlustSurface';
export type { WanderlustSurfaceProps, WanderlustShape } from './WanderlustSurface';
export { WanderlustSurfaceDefs } from './WanderlustSurfaceDefs';
export { InsetPanel, INSET_PANEL_PRESETS } from './InsetPanel';
export type { InsetPanelProps } from './InsetPanel';
export { InsetPanelDelicate, INSET_PANEL_DELICATE_PRESETS } from './InsetPanelDelicate';
export type { InsetPanelDelicateProps } from './InsetPanelDelicate';
export { WanderlustMaterialContext } from './WanderlustMaterialContext';
export { useHeavyDrag } from './useHeavyDrag';
export type { HeavyDragHandlers } from './useHeavyDrag';

```

## `src/ui/wanderlust-surface/WanderlustSurface.tsx`

```tsx
import React, { useRef, useEffect, useState, useMemo } from 'react';
import clsx from 'clsx';
import './wanderlust-surface.css';
import { MATERIAL_PRESETS, type MaterialPreset, type MaterialTheme } from './materialPresets';
import WanderlustInnerSurface from './WanderlustInnerSurface';
import { WanderlustMaterialContext } from './WanderlustMaterialContext';

/* ═══════════════════════════════════════════════════════════════════
   WanderlustSurface
   ───────────────────────────────────────────────────────────────────
   A wrapper component that renders the V7 bronze border around any
   children. The SVG border scales dynamically to the container size.

   V8 MLE Integration: Optional Material Layer Engine props enable
   procedural AAA-style composition without changing the base aesthetics.

   Usage:
     <WanderlustSurface shape="panel">
       <YourContent />
     </WanderlustSurface>

   Prerequisites:
     - Render <WanderlustSurfaceDefs /> once at app root
     - Import wanderlust-surface.css
   ═══════════════════════════════════════════════════════════════════ */

export type WanderlustShape = 'panel' | 'card' | 'badge' | 'medallion' | 'tablet';

/**
 * Configuration for procedural material layering (V8 MLE).
 * Enables AAA-style material composition without manual layer management.
 */
export interface MaterialLayerConfig {
  /** Base texture material - maps to existing material presets */
  baseTexture?: 'obsidian' | 'marble' | 'parchment' | 'wood' | 'gold';
  /** Edge treatment for borders - WanderlustSurface has eroded-bronze built-in */
  edgeTreatment?: 'eroded-bronze' | 'sharp-gold' | 'rough-wood' | 'none';
  /** Emissive halo/glow effect - adds drop-shadow overlay */
  emissiveHalo?: 'emerald' | 'gold' | 'none';
  /** Enable micro-interactions (hover scale, glow transitions) - maps to interactive */
  microInteraction?: boolean;
  /** Enable rim light effect (1px soft highlight on top-left edge) - WanderlustSurface has rim arcs */
  rimLight?: boolean;
  /** Enable physical depth (multi-layer shadows for contact + elevation) - WanderlustSurface has layered shadows */
  physicalDepth?: boolean;
  /** Enable heavy feel (weighted easing for physical presence) - adds CSS transitions */
  heavyFeel?: boolean;
  /** Background mode for dynamic rim light calculation */
  backgroundMode?: 'marble' | 'parchment' | 'void' | 'bg';
}

export interface WanderlustSurfaceProps {
  /** Shape determines border-radius and content padding. */
  shape?: WanderlustShape;
  /** Material preset (bronze, silver, obsidian, jade). */
  material?: MaterialPreset;
  /** Enable hover/active transitions. */
  interactive?: boolean;
  /** Disable heavy SVG filters (for drag perf). */
  isDragging?: boolean;
  /** Pause rim breathing animation. */
  isPaused?: boolean;
  /** Extra className on the root wrapper. */
  className?: string;
  /** Inline style on the root wrapper. */
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /** V8 MLE: Material layer configuration for procedural AAA-style composition */
  materialLayer?: MaterialLayerConfig;
}

/** Border thickness in viewBox units — same for all shapes. */
const BORDER = 18;
/** Inner ring inset from border outer edge. */
const RING = 16;
/** Content field inset from outer edge. */
const FIELD = BORDER + 2;
/** Corner radius for outer shape (except badge/medallion). */
const RX_OUTER = 18;
/** Corner radius for inner ring. */
const RX_RING = 10;
/** Corner radius for content field. */
const RX_FIELD = 9;

export const WanderlustSurface: React.FC<WanderlustSurfaceProps> = ({
  shape = 'panel',
  material = 'bronze',
  interactive = false,
  isDragging = false,
  isPaused = false,
  className,
  style,
  children,
  materialLayer,
}) => {
  const theme = MATERIAL_PRESETS[material] ?? MATERIAL_PRESETS['bronze'];
  const prefix = material;
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 200 });

  // V8 MLE: Map materialLayer props to existing functionality
  const enableMLE = materialLayer !== undefined;
  const mleInteractive = materialLayer?.microInteraction ?? interactive;
  const mleHeavyFeel = materialLayer?.heavyFeel ?? false;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setSize({ w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rootCls = clsx(
    'ws-root',
    `ws-root--${shape}`,
    mleInteractive && 'ws-root--interactive',
    isDragging && 'ws-root--dragging',
    isPaused && 'ws-root--paused',
    // V8 MLE classes
    enableMLE && mleHeavyFeel && 'ws-root--heavy-feel',
    className,
  );

  /** Skip heavy filters during drag for performance. */
  const f = isDragging ? undefined : true;

  const { w, h } = size;

  // Derived layout values
  const outerX = 4;
  const outerY = 4;
  const outerW = w - 8;
  const outerH = h - 8;
  const ringX = RING + 4;
  const ringY = RING + 4;
  const ringW = w - (RING + 4) * 2;
  const ringH = h - (RING + 4) * 2;
  const fieldX = FIELD + 4;
  const fieldY = FIELD + 4;
  const fieldW = w - (FIELD + 4) * 2;
  const fieldH = h - (FIELD + 4) * 2;

  // Patina positions are proportional to size
  const patina = useMemo(() => generatePatina(w, h, theme), [w, h, theme]);
  const scratches = useMemo(() => generateScratches(w, h, theme), [w, h, theme]);
  const diamonds = useMemo(() => generateDiamonds(w, h, outerX, outerY, outerW, outerH), [w, h, outerX, outerY, outerW, outerH]);

  return (
    <WanderlustMaterialContext.Provider value={material}>
    <div ref={rootRef} className={rootCls} style={style}>
      {/* SVG Border Overlay */}
      <svg
        className="ws-border-svg"
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={`ws-co-${w}-${h}`}>
            <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER} />
          </clipPath>
          <clipPath id={`ws-ci-${w}-${h}`}>
            <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} rx={RX_FIELD} />
          </clipPath>
        </defs>

        {/* ════ BORDER FRAME ════ */}
        <g clipPath={`url(#ws-co-${w}-${h})`}>
          {/* L1: Bronze body layers */}
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER} fill={theme.baseFill} />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-nm)` : undefined} opacity=".94" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-nm2)` : undefined} opacity=".28" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-worn)` : undefined} opacity=".32" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-spec)` : undefined} opacity=".14" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gbv)`} opacity=".50" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-grime)` : undefined} opacity=".16" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-g-ambient)`} style={{ mixBlendMode: 'overlay' }} />

          {/* L2: Rim arcs — copper, differentiated top/bottom */}
          <rect className="ws-rim-arc" x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill="none" stroke={`rgba(${theme.rimTopRGB},.30)`} strokeWidth="4"
            strokeDasharray={`${outerW * 0.64} 0 0 ${outerW * 1.36}`} strokeDashoffset="0"
            strokeLinecap="round" filter={f ? `url(#${prefix}-ws-f-gl)` : undefined} />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill="none" stroke={`rgba(${theme.rimBrightRGB},.58)`} strokeWidth="1"
            strokeDasharray={`${outerW * 0.53} 0 0 ${outerW * 1.47}`} strokeDashoffset="30"
            strokeLinecap="round" />
          <rect className="ws-rim-arc" x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill="none" stroke={`rgba(${theme.rimDimRGB},.10)`} strokeWidth="2"
            strokeDasharray={`0 0 ${outerW * 0.53} ${outerW * 1.47}`} strokeDashoffset="0"
            strokeLinecap="round" />

          {/* L3: Inner ring separator */}
          <rect x={ringX} y={ringY} width={ringW} height={ringH} rx={RX_RING}
            fill={theme.ringFill} filter={f ? `url(#${prefix}-ws-f-erode)` : undefined} />
          <rect x={ringX} y={ringY} width={ringW} height={ringH} rx={RX_RING}
            fill={`url(#${prefix}-ws-gri)`} filter={f ? `url(#${prefix}-ws-f-nm)` : undefined} opacity=".70" />
          <rect x={ringX + 0.5} y={ringY + 0.6} width={ringW} height={ringH} rx={RX_RING}
            fill="none" stroke={`rgba(${theme.ringBorderRGB},.72)`} strokeWidth="2.4" />
          {/* Top-left lit lip */}
          <rect x={ringX} y={ringY} width={ringW} height={ringH} rx={RX_RING}
            fill="none" stroke={`rgba(${theme.ringLitRGB},.26)`} strokeWidth="1"
            strokeDasharray={`${ringW * 0.6} 0 0 ${ringW * 1.4}`} strokeDashoffset="0"
            strokeLinecap="round" />
          {/* Bottom shadow lip */}
          <rect x={ringX} y={ringY} width={ringW} height={ringH} rx={RX_RING}
            fill="none" stroke={`rgba(${theme.ringShadowRGB},.50)`} strokeWidth="1.4"
            strokeDasharray={`0 0 ${ringW * 0.64} ${ringW * 1.36}`} strokeDashoffset="0"
            strokeLinecap="round" />

          {/* L4: Patina blobs (warped) */}
          {f && (
            <g filter={`url(#${prefix}-ws-f-warp)`}>
              {patina.map((p, i) => (
                p.ry
                  ? <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} />
                  : <circle key={i} cx={p.cx} cy={p.cy} r={p.rx} fill={p.fill} />
              ))}
            </g>
          )}

          {/* L5: Scratches + bright exposed bronze */}
          {f && (
            <g>
              {scratches.map((s, i) => (
                <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                  stroke={s.stroke} strokeWidth={s.width} strokeLinecap="round" />
              ))}
            </g>
          )}

          {/* L6: Corner diamonds */}
          {shape !== 'badge' && shape !== 'medallion' && f && (
            <g>
              {diamonds.map((d, i) => (
                <React.Fragment key={i}>
                  {/* Contact shadow */}
                  <polygon points={d.points} fill={`rgba(${theme.diamondContactRGB},.32)`} transform="translate(2,2.5)" />
                  {/* Diamond body */}
                  <polygon points={d.points} fill={`url(#${prefix}-ws-gdm)`} stroke={`rgba(${theme.diamondStrokeRGB},.55)`} strokeWidth=".8" />
                  {/* Top-left lit facet */}
                  <polygon points={d.litFacet} fill={`rgba(${theme.diamondLitRGB},.38)`} />
                  {/* Bottom-right shadow facet */}
                  <polygon points={d.shadowFacet} fill={`rgba(${theme.diamondShadowRGB},.38)`} />
                </React.Fragment>
              ))}
            </g>
          )}
        </g>

        {/* ════ CARVED CONTENT WELL ════ */}
        <g clipPath={`url(#ws-ci-${w}-${h})`}>
          {/* Layered inner surface with subtle depth background */}
          <foreignObject x={fieldX} y={fieldY} width={fieldW} height={fieldH}>
            <WanderlustInnerSurface
              width={fieldW}
              height={fieldH}
              enableFilters={f}
            />
          </foreignObject>

          {/* Micro-bevel edges */}
          <rect x={fieldX} y={fieldY} width={fieldW} height={3} rx={0} fill={`url(#${prefix}-ws-bevel-t)`} />
          <rect x={fieldX} y={fieldY} width={3} height={fieldH} rx={0} fill={`url(#${prefix}-ws-bevel-l)`} />
          <rect x={fieldX} y={fieldY + fieldH - 3} width={fieldW} height={3} rx={0} fill={`url(#${prefix}-ws-bevel-b)`} />
          <rect x={fieldX + fieldW - 3} y={fieldY} width={3} height={fieldH} rx={0} fill={`url(#${prefix}-ws-bevel-r)`} />

          {/* Lip highlights */}
          <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} rx={RX_FIELD}
            fill={`url(#${prefix}-ws-rim-top)`} opacity=".60" />
          <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} rx={RX_FIELD}
            fill={`url(#${prefix}-ws-rim-left)`} opacity=".30" />

          {/* Perimetral AO */}
          <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} rx={RX_FIELD}
            fill={`rgba(${theme.aoRGB},.24)`} filter={f ? `url(#${prefix}-ws-f-ao)` : undefined} />

          {/* Corner AO densification */}
          <circle cx={fieldX + 4} cy={fieldY + 4} r={16} fill={`rgba(${theme.aoCornerRGB},.32)`} />
          <circle cx={fieldX + fieldW - 4} cy={fieldY + 4} r={16} fill={`rgba(${theme.aoCornerRGB},.28)`} />
          <circle cx={fieldX + 4} cy={fieldY + fieldH - 4} r={16} fill={`rgba(${theme.aoCornerRGB},.36)`} />
          <circle cx={fieldX + fieldW - 4} cy={fieldY + fieldH - 4} r={16} fill={`rgba(${theme.aoCornerRGB},.40)`} />

          {/* Rim specular 0.5px */}
          <rect x={fieldX + 0.5} y={fieldY + 0.5} width={fieldW - 1} height={fieldH - 1} rx={RX_FIELD - 0.5}
            fill="none" stroke={`rgba(${theme.specularRGB},.18)`} strokeWidth=".5" />
          <rect x={fieldX + 0.5} y={fieldY + 0.5} width={fieldW - 1} height={fieldH - 1} rx={RX_FIELD - 0.5}
            fill="none" stroke={`rgba(${theme.specularBrightRGB},.30)`} strokeWidth=".5"
            strokeDasharray={`${fieldW * 0.76} 0 0 ${fieldW * 1.24}`} strokeDashoffset="0"
            strokeLinecap="round" />
        </g>
      </svg>

      {/* Content slot */}
      <div className="ws-content">
        {children}
      </div>
    </div>
    </WanderlustMaterialContext.Provider>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PROCEDURAL GENERATION HELPERS
   ═══════════════════════════════════════════════════════════════════ */

interface PatinaBlob {
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  fill: string;
}

/** Generates patina blobs positioned relative to the border edges. */
function generatePatina(w: number, h: number, theme: MaterialTheme): PatinaBlob[] {
  const dark = (opacity: number) => `rgba(${theme.patinaDark},${opacity})`;
  const bright = (opacity: number) => `rgba(${theme.patinaBright},${opacity})`;
  const green = (opacity: number) => `rgba(${theme.patinaGreen},${opacity})`;

  return [
    // Dark tarnish — corners and edges
    { cx: 18, cy: 22, rx: 14, fill: dark(0.45) },
    { cx: 8, cy: 40, rx: 9, fill: dark(0.40) },
    { cx: 30, cy: 50, rx: 7, fill: dark(0.35) },
    { cx: 22, cy: 68, rx: 10, ry: 6, fill: dark(0.30) },
    { cx: w - 20, cy: 18, rx: 13, fill: dark(0.42) },
    { cx: w - 12, cy: 42, rx: 8, fill: dark(0.38) },
    { cx: w - 30, cy: 58, rx: 11, ry: 5, fill: dark(0.32) },
    { cx: 22, cy: h - 25, rx: 11, fill: dark(0.40) },
    { cx: 40, cy: h - 14, rx: 7, fill: dark(0.36) },
    { cx: w - 22, cy: h - 22, rx: 15, fill: dark(0.46) },
    { cx: w - 35, cy: h - 12, rx: 9, fill: dark(0.40) },
    { cx: w - 16, cy: h - 40, rx: 8, ry: 12, fill: dark(0.36) },
    { cx: 6, cy: h * 0.5, rx: 8, fill: dark(0.34) },
    { cx: w - 6, cy: h * 0.45, rx: 7, fill: dark(0.30) },
    { cx: w * 0.5, cy: 6, rx: 9, fill: dark(0.28) },
    { cx: w * 0.33, cy: h - 10, rx: 10, fill: dark(0.32) },
    { cx: w * 0.74, cy: h - 12, rx: 8, fill: dark(0.30) },

    // Bright worn spots — polished/rubbed areas on flat surfaces
    { cx: w * 0.48, cy: h * 0.48, rx: 18, fill: bright(0.22) },
    { cx: w * 0.26, cy: h * 0.30, rx: 12, ry: 8, fill: bright(0.18) },
    { cx: w * 0.78, cy: h * 0.22, rx: 14, ry: 7, fill: bright(0.16) },
    { cx: w * 0.65, cy: h * 0.78, rx: 10, fill: bright(0.15) },
    { cx: w * 0.18, cy: h * 0.74, rx: 11, ry: 9, fill: bright(0.14) },

    // Green oxidation — moisture accumulation zones
    { cx: 14, cy: 62, rx: 9, ry: 5, fill: green(0.28) },
    { cx: w - 15, cy: h * 0.76, rx: 11, ry: 6, fill: green(0.24) },
    { cx: w - 28, cy: h - 18, rx: 13, ry: 7, fill: green(0.26) },
    { cx: 32, cy: h - 28, rx: 6, fill: green(0.22) },
    { cx: w * 0.25, cy: h - 10, rx: 8, ry: 4, fill: green(0.20) },
  ];
}

interface ScratchLine {
  x1: number; y1: number;
  x2: number; y2: number;
  stroke: string;
  width: number;
}

/** Generates scratches (dark grooves + bright exposed metal) relative to edges. */
function generateScratches(w: number, h: number, theme: MaterialTheme): ScratchLine[] {
  const groove = (opacity: number) => `rgba(${theme.scratchGroove},${opacity})`;
  const exposed = (opacity: number) => `rgba(${theme.scratchExposed},${opacity})`;

  return [
    // Dark grooves
    { x1: 6, y1: h * 0.26, x2: 18, y2: h * 0.40, stroke: groove(0.52), width: 1.8 },
    { x1: 10, y1: h * 0.34, x2: 22, y2: h * 0.44, stroke: groove(0.42), width: 1.2 },
    { x1: w - 18, y1: h * 0.52, x2: w - 8, y2: h * 0.64, stroke: groove(0.46), width: 1.5 },
    { x1: w * 0.10, y1: h - 12, x2: w * 0.15, y2: h - 6, stroke: groove(0.38), width: 1.3 },
    { x1: w * 0.80, y1: 5, x2: w * 0.86, y2: 10, stroke: groove(0.36), width: 1.1 },
    // Corner cross-hatches
    { x1: 15, y1: 15, x2: 38, y2: 8, stroke: groove(0.42), width: 1.0 },
    { x1: w - 35, y1: h - 18, x2: w - 12, y2: h - 10, stroke: groove(0.44), width: 1.2 },

    // Bright exposed metal (offset 1px from dark)
    { x1: 8, y1: h * 0.28, x2: 19, y2: h * 0.41, stroke: exposed(0.30), width: 0.8 },
    { x1: w - 16, y1: h * 0.53, x2: w - 7, y2: h * 0.64, stroke: exposed(0.26), width: 0.7 },
    { x1: 12, y1: h * 0.35, x2: 23, y2: h * 0.44, stroke: exposed(0.22), width: 0.6 },
    { x1: 16, y1: 16, x2: 39, y2: 9, stroke: exposed(0.22), width: 0.5 },
    { x1: w - 34, y1: h - 17, x2: w - 11, y2: h - 9, stroke: exposed(0.20), width: 0.5 },
  ];
}

interface Diamond {
  points: string;
  litFacet: string;
  shadowFacet: string;
}

/** Generates corner diamond ornaments. */
function generateDiamonds(
  _w: number,
  _h: number,
  ox: number,
  oy: number,
  ow: number,
  oh: number,
): Diamond[] {
  const SIZE = 12; // half-diagonal
  const INSET = 24; // from corner of outer rect

  const corners = [
    { cx: ox + INSET, cy: oy + INSET },
    { cx: ox + ow - INSET, cy: oy + INSET },
    { cx: ox + INSET, cy: oy + oh - INSET },
    { cx: ox + ow - INSET, cy: oy + oh - INSET },
  ];

  return corners.map(({ cx, cy }) => ({
    points: `${cx},${cy - SIZE} ${cx - SIZE},${cy} ${cx},${cy + SIZE} ${cx + SIZE},${cy}`,
    litFacet: `${cx},${cy - SIZE} ${cx - SIZE},${cy} ${cx},${cy}`,
    shadowFacet: `${cx},${cy + SIZE} ${cx + SIZE},${cy} ${cx},${cy}`,
  }));
}

export default WanderlustSurface;

```

## `src/ui/wanderlust-surface/WanderlustSurfaceDefs.tsx`

```tsx
import React from 'react';
import { MATERIAL_PRESETS, type MaterialTheme } from './materialPresets';

/**
 * Shared SVG `<defs>` for the Wanderlust surface system.
 *
 * Render this component **once** at the root of your app (e.g. inside `<App>`).
 * Every `<WanderlustSurface>` instance references these defs by id.
 *
 * The SVG is zero-sized and invisible — it only holds reusable definitions.
 * All gradients and filters are duplicated per material with a prefix.
 */

function cmValues(t: { r: number; g: number; b: number; a: number }) {
  return `0 0 0 0 ${t.r}  0 0 0 0 ${t.g}  0 0 0 0 ${t.b}  0 0 0 ${t.a} 0`;
}

function GradientStops({ stops }: { stops: { offset: string; color: string }[] }) {
  return (
    <>
      {stops.map((s, i) => (
        <stop key={i} offset={s.offset} stopColor={s.color} />
      ))}
    </>
  );
}

function MaterialDefs({ theme }: { theme: MaterialTheme }) {
  const p = theme.id;
  return (
    <>
      {/* ── Gradients ── */}
      <linearGradient id={`${p}-ws-gb`} x1="8%" y1="2%" x2="92%" y2="98%">
        <GradientStops stops={theme.body} />
      </linearGradient>

      <linearGradient id={`${p}-ws-gbv`} x1="0%" y1="0%" x2="100%" y2="100%">
        <GradientStops stops={theme.bevel} />
      </linearGradient>

      <linearGradient id={`${p}-ws-gri`} x1="10%" y1="5%" x2="90%" y2="95%">
        <GradientStops stops={theme.ring} />
      </linearGradient>

      <radialGradient id={`${p}-ws-gf`} cx="38%" cy="30%" r="72%">
        <GradientStops stops={theme.field} />
      </radialGradient>

      <radialGradient id={`${p}-ws-gsp`} cx="22%" cy="16%" r="50%">
        <GradientStops stops={theme.specular} />
      </radialGradient>

      <radialGradient id={`${p}-ws-gdm`} cx="38%" cy="28%" r="65%">
        <GradientStops stops={theme.diamond} />
      </radialGradient>

      <linearGradient id={`${p}-ws-bevel-t`} x1="0" y1="0" x2="0" y2="1">
        <GradientStops stops={theme.bevelEdge.top} />
      </linearGradient>
      <linearGradient id={`${p}-ws-bevel-l`} x1="0" y1="0" x2="1" y2="0">
        <GradientStops stops={theme.bevelEdge.left} />
      </linearGradient>
      <linearGradient id={`${p}-ws-bevel-b`} x1="0" y1="1" x2="0" y2="0">
        <GradientStops stops={theme.bevelEdge.bottom} />
      </linearGradient>
      <linearGradient id={`${p}-ws-bevel-r`} x1="1" y1="0" x2="0" y2="0">
        <GradientStops stops={theme.bevelEdge.right} />
      </linearGradient>

      <linearGradient id={`${p}-ws-rim-top`} x1="0%" y1="0%" x2="0%" y2="100%">
        <GradientStops stops={theme.rim.top} />
      </linearGradient>
      <linearGradient id={`${p}-ws-rim-left`} x1="0%" y1="0%" x2="100%" y2="0%">
        <GradientStops stops={theme.rim.left} />
      </linearGradient>

      <radialGradient id={`${p}-ws-g-ambient`} cx="55%" cy="60%" r="70%">
        <GradientStops stops={theme.ambient} />
      </radialGradient>

      {/* ── Filters ── */}
      <filter id={`${p}-ws-f-nm`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={5} seed="3" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.noise)} result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>

      <filter id={`${p}-ws-f-nm2`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={3} seed="55" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.noise2)} result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>

      <filter id={`${p}-ws-f-worn`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.28" numOctaves={3} seed="77" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.worn)} result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="screen" />
      </filter>

      <filter id={`${p}-ws-f-spec`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={4} seed="3" stitchTiles="stitch" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .6 0" result="mask" />
        <feComposite in="SourceGraphic" in2="mask" operator="in" />
      </filter>

      <filter id={`${p}-ws-f-grime`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={4} seed="88" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.grime)} result="dark" />
        <feBlend in="SourceGraphic" in2="dark" mode="multiply" />
      </filter>

      <filter id={`${p}-ws-f-fs`} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={5} seed="11" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values={cmValues(theme.fieldNoise)} result="c" />
        <feBlend in="SourceGraphic" in2="c" mode="overlay" />
      </filter>

      <filter id={`${p}-ws-f-gl`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id={`${p}-ws-f-warp`} x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves={4} seed="42" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="11" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      <filter id={`${p}-ws-f-erode`} x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="turbulence" baseFrequency="0.035 0.02" numOctaves={4} seed="19" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="2.8" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      <filter id={`${p}-ws-f-inset`} x="-5%" y="-5%" width="110%" height="110%">
        <feFlood floodColor={theme.insetFill} floodOpacity=".55" result="d" />
        <feComposite in="d" in2="SourceAlpha" operator="out" result="si" />
        <feOffset in="si" dx="3" dy="4" result="o1" />
        <feGaussianBlur in="o1" stdDeviation="5" result="b1" />
        <feComposite in="b1" in2="SourceAlpha" operator="in" result="i1" />
        <feFlood floodColor={theme.insetFill} floodOpacity=".30" result="d2" />
        <feComposite in="d2" in2="SourceAlpha" operator="out" result="si2" />
        <feOffset in="si2" dx="-1.5" dy="-2" result="o2" />
        <feGaussianBlur in="o2" stdDeviation="3" result="b2" />
        <feComposite in="b2" in2="SourceAlpha" operator="in" result="i2" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="i1" />
          <feMergeNode in="i2" />
        </feMerge>
      </filter>

      <filter id={`${p}-ws-f-ao`} x="-5%" y="-5%" width="110%" height="110%">
        <feFlood floodColor={theme.fieldFill} floodOpacity=".42" result="d" />
        <feComposite in="d" in2="SourceAlpha" operator="out" result="si" />
        <feOffset in="si" dx="0" dy="0" />
        <feGaussianBlur stdDeviation="6" result="b" />
        <feComposite in="b" in2="SourceAlpha" operator="in" result="ao" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="ao" />
        </feMerge>
      </filter>
    </>
  );
}

export const WanderlustSurfaceDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    style={{ position: 'absolute', overflow: 'hidden' }}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {Object.values(MATERIAL_PRESETS).map((theme) => (
        <MaterialDefs key={theme.id} theme={theme} />
      ))}
    </defs>
  </svg>
);

export default WanderlustSurfaceDefs;

```

## `src/ui/wanderlust-surface/WanderlustInnerSurface.tsx`

```tsx
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

```

## `src/ui/wanderlust-surface/WanderlustMaterialContext.tsx`

```ts
import { createContext } from 'react';
import type { MaterialPreset } from './materialPresets';

/**
 * Provides the active material from the nearest WanderlustSurface ancestor.
 * InsetPanel reads this to inherit the material automatically.
 * Override per-instance with the explicit `material` prop on InsetPanel.
 */
export const WanderlustMaterialContext = createContext<MaterialPreset>('bronze');

```

## `src/ui/wanderlust-surface/materialPresets.ts`

```ts
/* ═══════════════════════════════════════════════════════════════════
   Material Presets for WanderlustSurface
   ═══════════════════════════════════════════════════════════════════

   Each preset is a "colour bundle" — never change individual hexes in
   isolation.  Update the entire bundle so that highlight → shadow
   relationships, saturation, and noise-tint coherence are preserved.

   Usage:
     import { BRONZE_THEME, SILVER_THEME } from './materialPresets';
     <WanderlustSurfaceDefs material="silver" />
     <WanderlustSurface material="silver" … />
   ═══════════════════════════════════════════════════════════════════ */

export type MaterialPreset = 'bronze' | 'silver' | 'obsidian' | 'jade' | 'parchment';

/** A single stop inside a linear or radial gradient. */
interface GradientStop {
  offset: string;
  color: string;
}

/** Complete colour bundle for one material. */
export interface MaterialTheme {
  id: MaterialPreset;
  label: string;

  /* ── Gradients ── */
  body: GradientStop[];        // ws-gb  (main frame)
  bevel: GradientStop[];       // ws-gbv
  ring: GradientStop[];        // ws-gri
  field: GradientStop[];        // ws-gf
  specular: GradientStop[];     // ws-gsp
  diamond: GradientStop[];     // ws-gdm
  bevelEdge: {
    top: GradientStop[];
    left: GradientStop[];
    bottom: GradientStop[];
    right: GradientStop[];
  };
  rim: {
    top: GradientStop[];
    left: GradientStop[];
  };
  ambient: GradientStop[];

  /* ── Noise / filter tints (feColorMatrix RGB multipliers) ── */
  noise: { r: number; g: number; b: number; a: number };
  noise2: { r: number; g: number; b: number; a: number };
  worn: { r: number; g: number; b: number; a: number };
  grime: { r: number; g: number; b: number; a: number };
  fieldNoise: { r: number; g: number; b: number; a: number };

  /* ── Base fills ── */
  baseFill: string;
  ringFill: string;
  fieldFill: string;
  insetFill: string;

  /* ── Rim & ring strokes (RGB only; opacity applied inline) ── */
  rimTopRGB: string;
  rimBrightRGB: string;
  rimDimRGB: string;
  ringLitRGB: string;
  ringShadowRGB: string;
  ringBorderRGB: string;

  /* ── Diamonds ── */
  diamondContactRGB: string;
  diamondStrokeRGB: string;
  diamondLitRGB: string;
  diamondShadowRGB: string;

  /* ── AO / ambient occlusion ── */
  aoRGB: string;
  aoCornerRGB: string;

  /* ── Rim specular ── */
  specularRGB: string;
  specularBrightRGB: string;

  /* ── Patina / scratches ── */
  patinaDark: string;    // '72,44,20'  → rgba(72,44,20,…)
  patinaBright: string;  // '200,155,80'
  patinaGreen: string;    // '80,98,54'
  scratchGroove: string; // '52,30,12'
  scratchExposed: string;// '210,165,80'
}

/* ───────────────────────────────────────────────────────────────────
   BRONZE  (default)
   Warm copper highlight → rich brown shadow.  Darkest allowed: #22140c
   ─────────────────────────────────────────────────────────────────── */
export const BRONZE_THEME: MaterialTheme = {
  id: 'bronze',
  label: 'Bronze',

  body: [
    { offset: '0%', color: '#e8c078' },
    { offset: '8%', color: '#d4a458' },
    { offset: '22%', color: '#b8823c' },
    { offset: '40%', color: '#966428' },
    { offset: '58%', color: '#7c4e20' },
    { offset: '76%', color: '#664018' },
    { offset: '100%', color: '#523414' },
  ],
  bevel: [
    { offset: '0%', color: 'rgba(232,195,130,.38)' },
    { offset: '14%', color: 'rgba(210,170,90,.14)' },
    { offset: '42%', color: 'rgba(180,130,60,.02)' },
    { offset: '74%', color: 'rgba(62,38,16,.30)' },
    { offset: '100%', color: 'rgba(52,30,12,.48)' },
  ],
  ring: [
    { offset: '0%', color: '#dbb060' },
    { offset: '16%', color: '#b88038' },
    { offset: '44%', color: '#8a5824' },
    { offset: '76%', color: '#68401a' },
    { offset: '100%', color: '#523414' },
  ],
  field: [
    { offset: '0%', color: '#42281a' },
    { offset: '35%', color: '#341e10' },
    { offset: '70%', color: '#2a180e' },
    { offset: '100%', color: '#22140c' },
  ],
  specular: [
    { offset: '0%', color: 'rgba(232,195,130,.12)' },
    { offset: '50%', color: 'rgba(210,170,90,.03)' },
    { offset: '100%', color: 'rgba(180,130,60,0)' },
  ],
  diamond: [
    { offset: '0%', color: '#e8c078' },
    { offset: '45%', color: '#b88038' },
    { offset: '100%', color: '#7c4e20' },
  ],
  bevelEdge: {
    top: [
      { offset: '0%', color: 'rgba(220,185,120,.35)' },
      { offset: '100%', color: 'rgba(220,185,120,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(220,185,120,.25)' },
      { offset: '100%', color: 'rgba(220,185,120,0)' },
    ],
    bottom: [
      { offset: '0%', color: 'rgba(42,26,12,.50)' },
      { offset: '100%', color: 'rgba(42,26,12,0)' },
    ],
    right: [
      { offset: '0%', color: 'rgba(42,26,12,.40)' },
      { offset: '100%', color: 'rgba(42,26,12,0)' },
    ],
  },
  rim: {
    top: [
      { offset: '0%', color: 'rgba(232,200,140,.48)' },
      { offset: '10%', color: 'rgba(210,175,100,.12)' },
      { offset: '22%', color: 'rgba(180,140,70,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(232,200,140,.32)' },
      { offset: '10%', color: 'rgba(210,175,100,.08)' },
      { offset: '22%', color: 'rgba(180,140,70,0)' },
    ],
  },
  ambient: [
    { offset: '0%', color: 'rgba(60,75,45,0)' },
    { offset: '70%', color: 'rgba(55,68,40,.015)' },
    { offset: '100%', color: 'rgba(50,62,38,.025)' },
  ],

  noise: { r: 0.16, g: 0.10, b: 0.05, a: 0.48 },
  noise2: { r: 0.12, g: 0.08, b: 0.04, a: 0.28 },
  worn: { r: 0.32, g: 0.22, b: 0.10, a: 0.35 },
  grime: { r: 0.08, g: 0.05, b: 0.02, a: 0.42 },
  fieldNoise: { r: 0.08, g: 0.05, b: 0.03, a: 0.26 },

  baseFill: '#5c3818',
  ringFill: '#4e3016',
  fieldFill: '#22140c',
  insetFill: '#2a180e',

  rimTopRGB: '232,200,130',
  rimBrightRGB: '240,215,160',
  rimDimRGB: '180,130,60',
  ringLitRGB: '232,200,130',
  ringShadowRGB: '62,38,16',
  ringBorderRGB: '42,26,12',

  diamondContactRGB: '52,30,14',
  diamondStrokeRGB: '58,34,14',
  diamondLitRGB: '240,210,150',
  diamondShadowRGB: '68,40,18',

  aoRGB: '34,20,12',
  aoCornerRGB: '28,16,8',

  specularRGB: '232,200,140',
  specularBrightRGB: '240,215,160',

  patinaDark: '72,44,20',
  patinaBright: '200,155,80',
  patinaGreen: '80,98,54',
  scratchGroove: '52,30,12',
  scratchExposed: '210,165,80',
};

/* ───────────────────────────────────────────────────────────────────
   SILVER
   Cool white highlight → blue-grey shadow.  Low saturation, high
   reflectivity.  Darkest allowed: #1a1a22
   ─────────────────────────────────────────────────────────────────── */
export const SILVER_THEME: MaterialTheme = {
  id: 'silver',
  label: 'Silver',

  body: [
    { offset: '0%', color: '#e0e0e8' },
    { offset: '8%', color: '#c0c0cc' },
    { offset: '22%', color: '#9898a8' },
    { offset: '40%', color: '#787888' },
    { offset: '58%', color: '#606072' },
    { offset: '76%', color: '#4a4a58' },
    { offset: '100%', color: '#383844' },
  ],
  bevel: [
    { offset: '0%', color: 'rgba(200,200,210,.38)' },
    { offset: '14%', color: 'rgba(170,170,185,.14)' },
    { offset: '42%', color: 'rgba(140,140,160,.02)' },
    { offset: '74%', color: 'rgba(40,40,55,.30)' },
    { offset: '100%', color: 'rgba(30,30,42,.48)' },
  ],
  ring: [
    { offset: '0%', color: '#c8c8d8' },
    { offset: '16%', color: '#9898a8' },
    { offset: '44%', color: '#707080' },
    { offset: '76%', color: '#545460' },
    { offset: '100%', color: '#383844' },
  ],
  field: [
    { offset: '0%', color: '#2a2a34' },
    { offset: '35%', color: '#22222c' },
    { offset: '70%', color: '#1a1a22' },
    { offset: '100%', color: '#14141c' },
  ],
  specular: [
    { offset: '0%', color: 'rgba(210,210,220,.12)' },
    { offset: '50%', color: 'rgba(180,180,195,.03)' },
    { offset: '100%', color: 'rgba(150,150,170,0)' },
  ],
  diamond: [
    { offset: '0%', color: '#d8d8e4' },
    { offset: '45%', color: '#9898a8' },
    { offset: '100%', color: '#606072' },
  ],
  bevelEdge: {
    top: [
      { offset: '0%', color: 'rgba(200,200,215,.35)' },
      { offset: '100%', color: 'rgba(200,200,215,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(200,200,215,.25)' },
      { offset: '100%', color: 'rgba(200,200,215,0)' },
    ],
    bottom: [
      { offset: '0%', color: 'rgba(30,30,42,.50)' },
      { offset: '100%', color: 'rgba(30,30,42,0)' },
    ],
    right: [
      { offset: '0%', color: 'rgba(30,30,42,.40)' },
      { offset: '100%', color: 'rgba(30,30,42,0)' },
    ],
  },
  rim: {
    top: [
      { offset: '0%', color: 'rgba(210,210,225,.48)' },
      { offset: '10%', color: 'rgba(180,180,200,.12)' },
      { offset: '22%', color: 'rgba(150,150,175,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(210,210,225,.32)' },
      { offset: '10%', color: 'rgba(180,180,200,.08)' },
      { offset: '22%', color: 'rgba(150,150,175,0)' },
    ],
  },
  ambient: [
    { offset: '0%', color: 'rgba(45,55,70,0)' },
    { offset: '70%', color: 'rgba(40,50,65,.015)' },
    { offset: '100%', color: 'rgba(38,48,62,.025)' },
  ],

  noise: { r: 0.10, g: 0.10, b: 0.12, a: 0.48 },
  noise2: { r: 0.08, g: 0.08, b: 0.10, a: 0.28 },
  worn: { r: 0.25, g: 0.25, b: 0.28, a: 0.35 },
  grime: { r: 0.05, g: 0.05, b: 0.06, a: 0.42 },
  fieldNoise: { r: 0.06, g: 0.06, b: 0.08, a: 0.26 },

  baseFill: '#484858',
  ringFill: '#3e3e4e',
  fieldFill: '#1a1a22',
  insetFill: '#22222c',

  rimTopRGB: '210,210,225',
  rimBrightRGB: '220,220,235',
  rimDimRGB: '130,130,150',
  ringLitRGB: '210,210,225',
  ringShadowRGB: '50,50,65',
  ringBorderRGB: '35,35,48',

  diamondContactRGB: '40,40,52',
  diamondStrokeRGB: '45,45,58',
  diamondLitRGB: '210,210,225',
  diamondShadowRGB: '55,55,70',

  aoRGB: '25,25,34',
  aoCornerRGB: '20,20,28',

  specularRGB: '210,210,225',
  specularBrightRGB: '220,220,235',

  patinaDark: '60,60,72',
  patinaBright: '170,170,190',
  patinaGreen: '65,80,95',
  scratchGroove: '38,38,48',
  scratchExposed: '190,190,210',
};

/* ───────────────────────────────────────────────────────────────────
   OBSIDIAN
   Dark, mostly reflection.  Very low diffuse, high specular.  Cold.
   ─────────────────────────────────────────────────────────────────── */
export const OBSIDIAN_THEME: MaterialTheme = {
  id: 'obsidian',
  label: 'Obsidian',

  body: [
    { offset: '0%', color: '#8090a0' },
    { offset: '8%', color: '#607080' },
    { offset: '22%', color: '#485868' },
    { offset: '40%', color: '#384858' },
    { offset: '58%', color: '#2c3c4c' },
    { offset: '76%', color: '#202c38' },
    { offset: '100%', color: '#182028' },
  ],
  bevel: [
    { offset: '0%', color: 'rgba(120,140,160,.38)' },
    { offset: '14%', color: 'rgba(90,110,130,.14)' },
    { offset: '42%', color: 'rgba(60,80,100,.02)' },
    { offset: '74%', color: 'rgba(20,30,40,.30)' },
    { offset: '100%', color: 'rgba(12,18,24,.48)' },
  ],
  ring: [
    { offset: '0%', color: '#708898' },
    { offset: '16%', color: '#506878' },
    { offset: '44%', color: '#385060' },
    { offset: '76%', color: '#283c4c' },
    { offset: '100%', color: '#182028' },
  ],
  field: [
    { offset: '0%', color: '#1c2832' },
    { offset: '35%', color: '#182028' },
    { offset: '70%', color: '#141c24' },
    { offset: '100%', color: '#0e1418' },
  ],
  specular: [
    { offset: '0%', color: 'rgba(130,155,180,.12)' },
    { offset: '50%', color: 'rgba(100,125,150,.03)' },
    { offset: '100%', color: 'rgba(70,95,120,0)' },
  ],
  diamond: [
    { offset: '0%', color: '#8090a0' },
    { offset: '45%', color: '#506878' },
    { offset: '100%', color: '#2c3c4c' },
  ],
  bevelEdge: {
    top: [
      { offset: '0%', color: 'rgba(130,150,170,.35)' },
      { offset: '100%', color: 'rgba(130,150,170,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(130,150,170,.25)' },
      { offset: '100%', color: 'rgba(130,150,170,0)' },
    ],
    bottom: [
      { offset: '0%', color: 'rgba(15,22,30,.50)' },
      { offset: '100%', color: 'rgba(15,22,30,0)' },
    ],
    right: [
      { offset: '0%', color: 'rgba(15,22,30,.40)' },
      { offset: '100%', color: 'rgba(15,22,30,0)' },
    ],
  },
  rim: {
    top: [
      { offset: '0%', color: 'rgba(140,165,190,.48)' },
      { offset: '10%', color: 'rgba(110,135,160,.12)' },
      { offset: '22%', color: 'rgba(80,105,130,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(140,165,190,.32)' },
      { offset: '10%', color: 'rgba(110,135,160,.08)' },
      { offset: '22%', color: 'rgba(80,105,130,0)' },
    ],
  },
  ambient: [
    { offset: '0%', color: 'rgba(30,40,55,0)' },
    { offset: '70%', color: 'rgba(25,35,50,.015)' },
    { offset: '100%', color: 'rgba(22,32,45,.025)' },
  ],

  noise: { r: 0.10, g: 0.12, b: 0.14, a: 0.48 },
  noise2: { r: 0.08, g: 0.10, b: 0.12, a: 0.28 },
  worn: { r: 0.18, g: 0.22, b: 0.26, a: 0.35 },
  grime: { r: 0.04, g: 0.05, b: 0.06, a: 0.42 },
  fieldNoise: { r: 0.05, g: 0.06, b: 0.07, a: 0.26 },

  baseFill: '#1c2832',
  ringFill: '#182028',
  fieldFill: '#0e1418',
  insetFill: '#182028',

  rimTopRGB: '140,165,190',
  rimBrightRGB: '150,175,200',
  rimDimRGB: '80,105,130',
  ringLitRGB: '140,165,190',
  ringShadowRGB: '30,40,50',
  ringBorderRGB: '20,28,36',

  diamondContactRGB: '25,35,45',
  diamondStrokeRGB: '28,38,48',
  diamondLitRGB: '150,175,200',
  diamondShadowRGB: '35,48,60',

  aoRGB: '15,22,30',
  aoCornerRGB: '12,18,25',

  specularRGB: '140,165,190',
  specularBrightRGB: '150,175,200',

  patinaDark: '35,45,55',
  patinaBright: '120,145,170',
  patinaGreen: '50,70,85',
  scratchGroove: '20,28,36',
  scratchExposed: '140,165,190',
};

/* ───────────────────────────────────────────────────────────────────
   JADE / VERDIGRIS
   Green oxidation aesthetic.  Warm earthy base with verdigris patina.
   ─────────────────────────────────────────────────────────────────── */
export const JADE_THEME: MaterialTheme = {
  id: 'jade',
  label: 'Jade',

  body: [
    { offset: '0%', color: '#a8d8b8' },
    { offset: '8%', color: '#80b898' },
    { offset: '22%', color: '#58987c' },
    { offset: '40%', color: '#3c7860' },
    { offset: '58%', color: '#2c6050' },
    { offset: '76%', color: '#1e4838' },
    { offset: '100%', color: '#163428' },
  ],
  bevel: [
    { offset: '0%', color: 'rgba(150,210,170,.38)' },
    { offset: '14%', color: 'rgba(110,180,140,.14)' },
    { offset: '42%', color: 'rgba(80,150,110,.02)' },
    { offset: '74%', color: 'rgba(20,50,40,.30)' },
    { offset: '100%', color: 'rgba(12,38,28,.48)' },
  ],
  ring: [
    { offset: '0%', color: '#90c8a8' },
    { offset: '16%', color: '#60a080' },
    { offset: '44%', color: '#407860' },
    { offset: '76%', color: '#285848' },
    { offset: '100%', color: '#163428' },
  ],
  field: [
    { offset: '0%', color: '#1e4038' },
    { offset: '35%', color: '#183830' },
    { offset: '70%', color: '#142c24' },
    { offset: '100%', color: '#0e201a' },
  ],
  specular: [
    { offset: '0%', color: 'rgba(150,215,180,.12)' },
    { offset: '50%', color: 'rgba(110,185,150,.03)' },
    { offset: '100%', color: 'rgba(80,155,120,0)' },
  ],
  diamond: [
    { offset: '0%', color: '#a0d4b8' },
    { offset: '45%', color: '#60a080' },
    { offset: '100%', color: '#2c6050' },
  ],
  bevelEdge: {
    top: [
      { offset: '0%', color: 'rgba(160,220,180,.35)' },
      { offset: '100%', color: 'rgba(160,220,180,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(160,220,180,.25)' },
      { offset: '100%', color: 'rgba(160,220,180,0)' },
    ],
    bottom: [
      { offset: '0%', color: 'rgba(18,45,35,.50)' },
      { offset: '100%', color: 'rgba(18,45,35,0)' },
    ],
    right: [
      { offset: '0%', color: 'rgba(18,45,35,.40)' },
      { offset: '100%', color: 'rgba(18,45,35,0)' },
    ],
  },
  rim: {
    top: [
      { offset: '0%', color: 'rgba(165,225,190,.48)' },
      { offset: '10%', color: 'rgba(130,195,160,.12)' },
      { offset: '22%', color: 'rgba(95,165,130,0)' },
    ],
    left: [
      { offset: '0%', color: 'rgba(165,225,190,.32)' },
      { offset: '10%', color: 'rgba(130,195,160,.08)' },
      { offset: '22%', color: 'rgba(95,165,130,0)' },
    ],
  },
  ambient: [
    { offset: '0%', color: 'rgba(35,60,45,0)' },
    { offset: '70%', color: 'rgba(30,55,40,.015)' },
    { offset: '100%', color: 'rgba(28,50,38,.025)' },
  ],

  noise: { r: 0.06, g: 0.12, b: 0.08, a: 0.48 },
  noise2: { r: 0.04, g: 0.10, b: 0.06, a: 0.28 },
  worn: { r: 0.14, g: 0.26, b: 0.18, a: 0.35 },
  grime: { r: 0.03, g: 0.06, b: 0.04, a: 0.42 },
  fieldNoise: { r: 0.04, g: 0.08, b: 0.05, a: 0.26 },

  baseFill: '#1e4038',
  ringFill: '#183830',
  fieldFill: '#0e201a',
  insetFill: '#183830',

  rimTopRGB: '165,225,190',
  rimBrightRGB: '175,230,200',
  rimDimRGB: '95,165,130',
  ringLitRGB: '165,225,190',
  ringShadowRGB: '30,55,42',
  ringBorderRGB: '20,45,35',

  diamondContactRGB: '28,55,42',
  diamondStrokeRGB: '32,58,45',
  diamondLitRGB: '175,230,200',
  diamondShadowRGB: '40,70,55',

  aoRGB: '25,48,38',
  aoCornerRGB: '20,42,32',

  specularRGB: '165,225,190',
  specularBrightRGB: '175,230,200',

  patinaDark: '30,55,42',
  patinaBright: '130,195,155',
  patinaGreen: '65,115,80',
  scratchGroove: '20,42,32',
  scratchExposed: '150,210,175',
};

/** Lookup map for all presets. */
export const MATERIAL_PRESETS: Record<MaterialPreset, MaterialTheme> = {
  bronze: BRONZE_THEME,
  silver: SILVER_THEME,
  obsidian: OBSIDIAN_THEME,
  jade: JADE_THEME,
};

/** Default fallback. */
export const DEFAULT_MATERIAL: MaterialPreset = 'bronze';

```

## `src/ui/wanderlust-surface/InsetPanel.tsx`

```tsx
import React, { useContext } from 'react';
import type { CSSProperties } from 'react';
import type { MaterialPreset } from './materialPresets';
import { WanderlustMaterialContext } from './WanderlustMaterialContext';

/** Visual preset per ogni materiale — CSS-only, nessun SVG. */
interface InsetPanelPreset {
  background: string;
  border: string;
  borderRadius: string;
  padding: string;
  boxShadow: string;
}

export const INSET_PANEL_PRESETS: Record<MaterialPreset, InsetPanelPreset> = {
  bronze: {
    background: 'rgba(8, 5, 2, 0.85)',
    border: '1px solid rgba(180, 130, 30, 0.45)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(220, 175, 60, 0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
  },
  silver: {
    background: 'rgba(10, 12, 16, 0.85)',
    border: '1px solid rgba(160, 160, 180, 0.40)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(200, 200, 220, 0.12)',
  },
  obsidian: {
    background: 'rgba(4, 3, 2, 0.92)',
    border: '1px solid rgba(80, 50, 20, 0.50)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(150, 100, 30, 0.10)',
  },
  jade: {
    background: 'rgba(4, 10, 8, 0.88)',
    border: '1px solid rgba(80, 160, 100, 0.40)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(100, 200, 130, 0.12)',
  },
  parchment: {
    background: 'rgba(218, 194, 148, 0.93)',
    border: '1px solid rgba(140, 100, 45, 0.35)',
    borderRadius: '6px',
    padding: '12px 14px',
    boxShadow: 'inset 0 1px 0 rgba(255, 245, 215, 0.55), inset 0 -1px 3px rgba(90, 60, 15, 0.10)',
  },
};

export interface InsetPanelProps {
  /** Sovrascrive il materiale del contesto WanderlustSurface. */
  material?: MaterialPreset;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

/**
 * InsetPanel — primitivo leggero per sotto-sezioni dentro WanderlustSurface.
 *
 * Eredita il materiale dal WanderlustMaterialContext (impostato da WanderlustSurface);
 * basta cambiare il materiale del pannello padre perché tutti gli InsetPanel figli
 * si aggiornino automaticamente.
 *
 * Usare `material` prop per fare override ad-hoc su istanze specifiche.
 */
export const InsetPanel: React.FC<InsetPanelProps> = ({
  material,
  children,
  className,
  style,
  'data-testid': testId,
}) => {
  const contextMaterial = useContext(WanderlustMaterialContext);
  const resolved = material ?? contextMaterial;
  const preset = INSET_PANEL_PRESETS[resolved] ?? INSET_PANEL_PRESETS.bronze;

  return (
    <div
      className={className}
      data-testid={testId}
      data-inset-panel-material={resolved}
      style={{
        background: preset.background,
        border: preset.border,
        borderRadius: preset.borderRadius,
        padding: preset.padding,
        boxShadow: preset.boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default InsetPanel;

```

## `src/ui/wanderlust-surface/InsetPanelDelicate.tsx`

```tsx
import React, { useContext } from 'react';
import type { CSSProperties } from 'react';
import type { MaterialPreset } from './materialPresets';
import { WanderlustMaterialContext } from './WanderlustMaterialContext';

/** Visual preset per ogni materiale — bordo sottile e delicato, metà spessore dell'originale. */
interface InsetPanelDelicatePreset {
  background: string;
  border: string;
  borderRadius: string;
  padding: string;
  boxShadow: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const INSET_PANEL_DELICATE_PRESETS: Record<MaterialPreset, InsetPanelDelicatePreset> = {
  bronze: {
    background: 'rgba(8, 5, 2, 0.85)',
    border: '0.5px solid rgba(180, 130, 30, 0.35)', // Metà spessore, leggèrement più trasparente
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(220, 175, 60, 0.10), inset 0 -1px 0 rgba(0,0,0,0.2)',
  },
  silver: {
    background: 'rgba(10, 12, 16, 0.85)',
    border: '0.5px solid rgba(160, 160, 180, 0.30)', // Metà spessore, più delicato
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(200, 200, 220, 0.08)',
  },
  obsidian: {
    background: 'rgba(4, 3, 2, 0.92)',
    border: '0.5px solid rgba(80, 50, 20, 0.40)', // Metà spessore, più sobrio
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(150, 100, 30, 0.08)',
  },
  jade: {
    background: 'rgba(4, 10, 8, 0.88)',
    border: '0.5px solid rgba(80, 160, 100, 0.30)', // Metà spessore, più sfumato
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'inset 0 1px 0 rgba(100, 200, 130, 0.08)',
  },
  parchment: {
    background: 'rgba(218, 194, 148, 0.93)',
    border: '0.5px solid rgba(140, 100, 45, 0.25)', // Metà spessore, più delicato
    borderRadius: '6px',
    padding: '12px 14px',
    boxShadow: 'inset 0 1px 0 rgba(255, 245, 215, 0.40), inset 0 -1px 3px rgba(90, 60, 15, 0.08)',
  },
};

export interface InsetPanelDelicateProps {
  /** Sovrascrive il materiale del contesto WanderlustSurface. */
  material?: MaterialPreset;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

/**
 * InsetPanelDelicate — primitivo con bordo sottile e delicato per sotto-sezioni dentro WanderlustSurface.
 *
 * Eredita il materiale dal WanderlustMaterialContext (impostato da WanderlustSurface);
 * usa un bordo di 0.5px invece di 1px per un aspetto più raffinato e delicato.
 *
 * Usare `material` prop per fare override ad-hoc su istanze specifiche.
 */
export const InsetPanelDelicate: React.FC<InsetPanelDelicateProps> = ({
  material,
  children,
  className,
  style,
  'data-testid': testId,
}) => {
  const contextMaterial = useContext(WanderlustMaterialContext);
  const resolved = material ?? contextMaterial;
  const preset = INSET_PANEL_DELICATE_PRESETS[resolved] ?? INSET_PANEL_DELICATE_PRESETS.bronze;

  return (
    <div
      className={className}
      data-testid={testId}
      data-inset-panel-delicate-material={resolved}
      style={{
        background: preset.background,
        border: preset.border,
        borderRadius: preset.borderRadius,
        padding: preset.padding,
        boxShadow: preset.boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default InsetPanelDelicate;

```

## `src/ui/wanderlust-surface/useHeavyDrag.ts`

```ts
/**
 * useHeavyDrag — hook per WanderlustSurface v8
 *
 * Simula la fisica di un oggetto pesante:
 * - "Sollevo con fatica": il visual insegue il cursore con ritardo (useSpring lag)
 * - "Appoggio pesante": al rilascio il target salta di 28px verso il basso e
 *   la spring oscilla attorno alla nuova posizione (rimbalzo smorzato)
 */
import { useState } from 'react';
import { useMotionValue, useSpring, animate } from 'framer-motion';
import type { DragHandlers } from 'framer-motion';

export interface HeavyDragHandlers {
  /** Motion values for the invisible drag tracker div */
  rawX: ReturnType<typeof useMotionValue<number>>;
  rawY: ReturnType<typeof useMotionValue<number>>;
  /** Spring-lagged motion values for the visible element (the "heavy" lag) */
  x: ReturnType<typeof useSpring>;
  y: ReturnType<typeof useSpring>;
  isDragging: boolean;
  onDragStart: DragHandlers['onDragStart'];
  onDragEnd: DragHandlers['onDragEnd'];
}

/**
 * Heavy drag physics for WanderlustSurface components.
 *
 * Usage:
 *   const drag = useHeavyDrag();
 *
 *   // Ghost tracker (invisible, handles actual drag input)
 *   <motion.div drag dragControls={controls} dragListener={false}
 *     style={{ x: drag.rawX, y: drag.rawY, position:'absolute', inset:0, opacity:0 }}
 *     onDragStart={drag.onDragStart}
 *     onDragEnd={drag.onDragEnd}
 *   />
 *
 *   // Visual element (laggy spring)
 *   <motion.div style={{ x: drag.x, y: drag.y }}>
 *     <WanderlustSurface ...>...</WanderlustSurface>
 *   </motion.div>
 */
export function useHeavyDrag(): HeavyDragHandlers {
  const [isDragging, setIsDragging] = useState(false);

  // Raw position — Framer Motion writes these directly during drag
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-lagged visual position — gives the "lifting with effort" feel
  const x = useSpring(rawX, { stiffness: 90, damping: 22, mass: 4 });
  const y = useSpring(rawY, { stiffness: 90, damping: 22, mass: 4 });

  const onDragStart: DragHandlers['onDragStart'] = () => {
    setIsDragging(true);
  };

  const onDragEnd: DragHandlers['onDragEnd'] = (_event, info) => {
    setIsDragging(false);

    // Gravity: jump the spring target downward so the spring bounces to settle.
    // The visual spring (y) will oscillate around the new rawY target — looks like
    // a heavy object being set down on a surface.
    rawY.set(rawY.get() + 30);

    // Horizontal: carry a fraction of throw velocity, then settle
    const throwX = (info?.velocity?.x ?? 0) * 0.04;
    if (Math.abs(throwX) > 0.5) {
      rawX.set(rawX.get() + throwX);
    }
  };

  return { rawX, rawY, x, y, isDragging, onDragStart, onDragEnd };
}

```

## `src/ui/wanderlust-surface/layout/index.ts`

```ts
/* Wanderlust Layout System — barrel export */
export {
  WanderlustHeading,
  WanderlustField,
  WanderlustFieldGroup,
  WanderlustRequirementList,
  WanderlustRecordList,
  WanderlustDivider,
  WanderlustSectionHeader,
  WanderlustStatBar,
  WanderlustLayout,
  SPACE,
  type SpaceKey,
  type Density,
  type Tier,
  type FieldOrientation,
  type GroupLayout,
  type RecordColumn,
  type WanderlustRequirement,
} from './WanderlustLayout';

export {
  WanderlustAmbientField,
} from './WanderlustAmbientField';

export { QuestChronicle } from './QuestChronicle';

```

## `src/ui/wanderlust-surface/layout/WanderlustAmbientField.tsx`

```tsx
import type { CSSProperties, ReactNode } from 'react';
import React from 'react';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST AMBIENT FIELD
 *
 *  Atmospheric background layer for WanderlustSurface content areas.
 *  Renders BEHIND the content (z:0..1), content sits at z:2.
 *
 *  Four layers:
 *  1. Nebula — organic warm-gold light pools that drift slowly
 *  2. Vignette — radial darkening toward edges
 *  3. Light leak — breathing warm spot (top-left), ambient torch sim
 *  4. Fireflies — 5-6 luminous motes rising with S-curve + pulse
 *
 *  Performance rules:
 *  - ALL animations use only transform + opacity (compositor / GPU)
 *  - Zero feTurbulence animated at runtime
 *  - will-change on animated elements
 *  - prefers-reduced-motion kills all motion
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustAmbientFieldProps {
  /** Disable all animations (isDragging, isOpening etc.) */
  paused?: boolean;
  /** Number of fireflies (default 5, max 8) */
  fireflyCount?: number;
  /** Children rendered above the atmosphere at z-index:2 */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Firefly configs: left%, duration, delay, drift variant
const FIREFLY_PRESETS = [
  { left: 16, dur: 19, delay: 0,   variant: 1, size: 4 },
  { left: 40, dur: 24, delay: -5,  variant: 2, size: 3 },
  { left: 63, dur: 22, delay: -11, variant: 1, size: 5 },
  { left: 82, dur: 26, delay: -3,  variant: 2, size: 3 },
  { left: 30, dur: 21, delay: -15, variant: 1, size: 4 },
  { left: 70, dur: 23, delay: -8,  variant: 2, size: 3 },
  { left: 50, dur: 20, delay: -18, variant: 1, size: 3 },
  { left: 12, dur: 25, delay: -7,  variant: 2, size: 4 },
];

const GLOW_DURATIONS = [3.2, 4.1, 2.8, 3.6, 3.9, 3.3, 3.0, 4.4];

export const WanderlustAmbientField: React.FC<WanderlustAmbientFieldProps> = ({
  paused = false,
  fireflyCount = 5,
  children,
  className,
  style,
}) => {
  const count = Math.min(fireflyCount, FIREFLY_PRESETS.length);
  const playState = paused ? 'paused' : 'running';

  return (
    <div className={className} style={{
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      {/* Layer 0: Nebula */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        mixBlendMode: 'screen', opacity: 0.5,
        background: [
          'radial-gradient(ellipse 180px 140px at 22% 30%, rgba(216,177,62,0.10), transparent 70%)',
          'radial-gradient(ellipse 220px 160px at 78% 55%, rgba(240,207,106,0.08), transparent 70%)',
          'radial-gradient(ellipse 160px 130px at 55% 80%, rgba(200,150,70,0.07), transparent 70%)',
        ].join(', '),
        animation: 'wl-nebula-drift 24s ease-in-out infinite alternate',
        animationPlayState: playState,
      } as CSSProperties} />

      {/* Layer 1: Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at 50% 40%, transparent 38%, rgba(0,0,0,0.4) 82%, rgba(0,0,0,0.65) 100%)',
      }} />

      {/* Layer 1b: Light leak */}
      <div style={{
        position: 'absolute', top: -40, left: -40, width: 240, height: 200,
        pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at 30% 30%, rgba(240,207,106,0.1), rgba(216,177,62,0.04) 40%, transparent 70%)',
        animation: 'wl-leak-breathe 7s ease-in-out infinite',
        animationPlayState: playState,
      } as CSSProperties} />

      {/* Layer 1c: Fireflies */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        {FIREFLY_PRESETS.slice(0, count).map((ff, i) => (
          <span key={i} style={{
            position: 'absolute',
            width: `${ff.size}px`, height: `${ff.size}px`,
            left: `${ff.left}%`, bottom: '-12px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,236,170,0.9), rgba(240,207,106,0.4) 45%, transparent 75%)',
            filter: 'blur(0.5px)',
            willChange: 'transform, opacity',
            animation: `wl-fly-rise${ff.variant} ${ff.dur}s ease-in-out infinite, wl-fly-glow ${GLOW_DURATIONS[i]}s ease-in-out infinite`,
            animationDelay: `${ff.delay}s, ${-(i * 0.7)}s`,
            animationPlayState: playState,
          } as CSSProperties} />
        ))}
      </div>

      {/* Layer 2: Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
};

export default WanderlustAmbientField;

```

## `src/ui/wanderlust-surface/layout/WanderlustLayout.tsx`

```tsx
import type { CSSProperties, ReactNode } from 'react';
import React from 'react';
import { WanderlustStatBar, type StatBarVariant, type StatBarSize, type WanderlustStatBarProps } from './WanderlustStatBar';
import { WanderlustPortrait, type WanderlustPortraitProps } from './WanderlustPortrait';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST LAYOUT PRIMITIVES v2
 *
 *  Built on two golden rules:
 *  1. INVISIBLE GRID — 6-step spacing scale, no hand-written px values.
 *  2. ENGRAVED TEXT — every glyph carved into the #030202 field.
 *
 *  And one structural rule:
 *  3. THREE-TIER HIERARCHY — primary (hero), secondary (focal), tertiary.
 *
 *  Text/data only. Living elements (slots, racks, seals) composed separately.
 * ════════════════════════════════════════════════════════════════════════ */

// ─── Spacing Scale ───────────────────────────────────────────────────

export const SPACE = {
  xs:  'var(--wl-space-xs,  4px)',
  sm:  'var(--wl-space-sm,  8px)',
  md:  'var(--wl-space-md, 12px)',
  lg:  'var(--wl-space-lg, 16px)',
  xl:  'var(--wl-space-xl, 24px)',
  xxl: 'var(--wl-space-xxl, 32px)',
} as const;

export type SpaceKey = keyof typeof SPACE;
const sp = (k: SpaceKey) => SPACE[k];

// ─── Engraving Profiles ─────────────────────────────────────────────

const ENGRAVE = {
  deep:   '0 1px 0 rgba(0,0,0,0.72), 0 2px 3px rgba(0,0,0,0.45), 0 -1px 0 rgba(228,213,183,0.12)',
  medium: '0 1px 0 rgba(0,0,0,0.6), 0 -1px 0 rgba(228,213,183,0.08)',
  thin:   '0 1px 2px rgba(0,0,0,0.7)',
  faint:  '0 1px 1px rgba(0,0,0,0.5)',
} as const;

// ─── Typography Tokens ──────────────────────────────────────────────

const FONT = {
  display: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)',
  serif:   'var(--wl-font-serif, "EB Garamond", Georgia, serif)',
  sans:    'var(--wl-font-sans, system-ui, sans-serif)',
} as const;

const COLOR = {
  title:       'var(--wl-text-title, #e4d5b7)',
  body:        'var(--wl-text-body, rgba(237,224,196,0.92))',
  labelPrimary:'var(--wl-label-primary, #c9a84e)',
  labelTertiary:'var(--wl-label-tertiary, #9a8246)',
  accent:      'var(--wl-text-accent, #f0cf6a)',
  separator:   'var(--wl-separator, rgba(216,177,62,0.2))',
  met:         'var(--wl-status-met, #7bc96f)',
  unmet:       'var(--wl-status-unmet, #d98a4a)',
} as const;

// ─── Density ────────────────────────────────────────────────────────

export type Density = 'comfortable' | 'compact';
const DENSITY_GAP: Record<Density, SpaceKey> = { comfortable: 'lg', compact: 'sm' };

// ─── Tier ───────────────────────────────────────────────────────────

export type Tier = 'primary' | 'secondary' | 'tertiary';

/* ════════════════════════════════════════════════════════════════════════
 *  1. WanderlustHeading
 *  Title + optional subtitle + description. Fixed internal rhythm.
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustHeadingProps {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  style?: CSSProperties;
}

export const WanderlustHeading: React.FC<WanderlustHeadingProps> = ({
  title, subtitle, description, as = 'h2', className, style,
}) => {
  const Tag = as;
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {React.createElement(Tag, {
        style: {
          fontFamily: FONT.display, fontSize: 'var(--wl-title-size, 30px)',
          fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
          lineHeight: 1.05, margin: 0,
          background: 'linear-gradient(180deg, #fff4d6 0%, #f0cf6a 38%, #d8b13e 70%, #a87f24 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7)) drop-shadow(0 0 16px rgba(240,207,106,0.3))',
        } as CSSProperties,
      }, title)}
      {subtitle && (
        <p style={{
          fontFamily: FONT.display, fontSize: '12px', fontWeight: 400,
          letterSpacing: '0.4em', textTransform: 'uppercase',
          color: COLOR.accent, margin: 0, marginTop: sp('sm'),
          opacity: 0.95, textShadow: `${ENGRAVE.thin}, 0 0 10px rgba(240,207,106,0.2)`,
        }}>{subtitle}</p>
      )}
      {description && (
        <p style={{
          fontFamily: FONT.serif, fontSize: 'var(--wl-body-size, 15.5px)',
          fontWeight: 400, lineHeight: 1.6, letterSpacing: '0.01em',
          color: COLOR.body, margin: 0, marginTop: sp('md'),
          textShadow: ENGRAVE.faint,
        }}>{description}</p>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  2. WanderlustField
 *  Label→value pair. vertical (default) or horizontal orientation.
 * ════════════════════════════════════════════════════════════════════════ */

export type FieldOrientation = 'vertical' | 'horizontal';

export interface WanderlustFieldProps {
  label: ReactNode;
  value: ReactNode;
  orientation?: FieldOrientation;
  tier?: Tier;
  className?: string;
  style?: CSSProperties;
}

const labelBase = (tier: Tier): CSSProperties => ({
  fontFamily: FONT.sans,
  fontSize: tier === 'tertiary' ? '11px' : '11px',
  fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase',
  color: tier === 'tertiary' ? COLOR.labelTertiary : COLOR.labelPrimary,
  margin: 0, textShadow: ENGRAVE.thin,
});

const valueBase = (tier: Tier): CSSProperties => ({
  fontFamily: FONT.display,
  fontSize: tier === 'tertiary' ? '19px' : '23px',
  fontWeight: 700, letterSpacing: '0.03em',
  color: tier === 'tertiary' ? 'rgba(237,224,196,0.85)' : COLOR.title,
  margin: 0, textShadow: tier === 'tertiary' ? ENGRAVE.medium : `${ENGRAVE.medium}, 0 0 18px rgba(240,207,106,0.08)`,
});

export const WanderlustField: React.FC<WanderlustFieldProps> = ({
  label, value, orientation = 'vertical', tier = 'secondary', className, style,
}) => {
  if (orientation === 'horizontal') {
    return (
      <div className={className} style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: sp('lg'), ...style,
      }}>
        <span style={labelBase(tier)}>{label}</span>
        <span style={{ ...valueBase(tier), textAlign: 'right' }}>{value}</span>
      </div>
    );
  }
  return (
    <div className={className} style={{
      display: 'flex', flexDirection: 'column', gap: sp('md'), ...style,
    }}>
      <span style={labelBase(tier)}>{label}</span>
      <span style={valueBase(tier)}>{value}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  3. WanderlustFieldGroup
 *  columns | rows | grid. Auto-separators. Density controls gap.
 * ════════════════════════════════════════════════════════════════════════ */

export type GroupLayout = 'columns' | 'rows' | 'grid';

export interface WanderlustFieldGroupProps {
  children: ReactNode;
  layout?: GroupLayout;
  columns?: number;
  density?: Density;
  separators?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const WanderlustFieldGroup: React.FC<WanderlustFieldGroupProps> = ({
  children, layout = 'columns', columns, density = 'comfortable',
  separators = true, className, style,
}) => {
  const items = React.Children.toArray(children);
  const gap = sp(DENSITY_GAP[density]);

  if (layout === 'rows') {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', ...style }}>
        {items.map((child, idx) => (
          <div key={idx} style={{
            paddingTop: idx === 0 ? 0 : gap, paddingBottom: idx === items.length - 1 ? 0 : gap,
            borderBottom: separators && idx !== items.length - 1
              ? `1px solid ${COLOR.separator}` : 'none',
          }}>{child}</div>
        ))}
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className={className} style={{
        display: 'grid', gridTemplateColumns: `repeat(${columns ?? 2}, minmax(0, 1fr))`,
        gap, ...style,
      }}>{items}</div>
    );
  }

  // columns
  const cols = columns ?? items.length;
  return (
    <div className={className} style={{
      display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, ...style,
    }}>
      {items.map((child, idx) => (
        <div key={idx} style={{
          position: 'relative', padding: `6px ${idx === 0 ? '4px' : '4px'}`,
          ...(idx !== 0 ? { paddingLeft: '18px' } : {}),
        }}>
          {separators && idx !== 0 && (
            <span style={{
              position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '1px',
              background: `linear-gradient(180deg, transparent, ${COLOR.separator}, transparent)`,
            }} aria-hidden="true" />
          )}
          {child}
        </div>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  4. WanderlustRequirementList
 *  Gameplay-aware: shows current/required + met/unmet check.
 *  Replaces the old generic stat rows.
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustRequirement {
  label: string;
  current: number;
  required: number;
}

export interface WanderlustRequirementListProps {
  requirements: WanderlustRequirement[];
  hintLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const CheckIcon: React.FC<{ met: boolean }> = ({ met }) => (
  <svg viewBox="0 0 20 20" width={met ? 16 : 14} height={met ? 16 : 14}
    fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
    style={{ color: met ? COLOR.met : COLOR.unmet }}>
    {met
      ? <path d="M4 10l4 4 8-9" />
      : <><path d="M10 4v8" /><path d="M10 15v1" /></>
    }
  </svg>
);

export const WanderlustRequirementList: React.FC<WanderlustRequirementListProps> = ({
  requirements, hintLabel: _hintLabel = 'squadra attuale', className, style,
}) => (
  <div className={className} style={{ position: 'relative', borderRadius: '6px', ...style }}>
    {requirements.map((req, idx) => {
      const met = req.current >= req.required;
      return (
        <div key={idx} style={{
          display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'baseline',
          gap: '14px', padding: '9px 16px', position: 'relative',
        }}>
          {idx > 0 && (
            <span style={{
              position: 'absolute', top: 0, left: '6%', right: '6%', height: '1px',
              background: `linear-gradient(90deg, transparent, rgba(216,177,62,0.08), transparent)`,
            }} aria-hidden="true" />
          )}
          <span style={labelBase('tertiary')}>{req.label}</span>
          <span style={{
            fontFamily: FONT.sans, fontSize: '13px', letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{
              fontFamily: FONT.display, fontSize: '18px', fontWeight: 700,
              color: met ? COLOR.met : COLOR.unmet,
              textShadow: `0 0 12px ${met ? 'rgba(123,201,111,0.25)' : 'rgba(217,138,74,0.25)'}`,
            }}>{req.current}</span>
            <span style={{ color: 'rgba(154,130,70,0.5)', margin: '0 3px' }}>/</span>
            <span style={{ color: 'rgba(154,130,70,0.7)' }}>{req.required}</span>
          </span>
          <span style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon met={met} />
          </span>
        </div>
      );
    })}
  </div>
);

/* ════════════════════════════════════════════════════════════════════════
 *  5. WanderlustRecordList
 *  Fixed-column rows with optional left rail + diamond markers.
 * ════════════════════════════════════════════════════════════════════════ */

export interface RecordColumn {
  width: string;
  variant?: 'caption' | 'body' | 'value' | 'label';
  align?: 'left' | 'right' | 'center';
}

export interface WanderlustRecordListProps {
  columns: RecordColumn[];
  records: ReactNode[][];
  density?: Density;
  rail?: boolean;
  className?: string;
  style?: CSSProperties;
}

const CELL_STYLE: Record<NonNullable<RecordColumn['variant']>, CSSProperties> = {
  caption: {
    fontFamily: FONT.sans, fontSize: '12px', letterSpacing: '0.06em',
    color: 'rgba(216,177,62,0.7)', textShadow: ENGRAVE.thin,
    fontVariantNumeric: 'tabular-nums',
  },
  body: {
    fontFamily: FONT.serif, fontSize: '14.5px', lineHeight: '1.5',
    letterSpacing: '0.01em', color: 'rgba(237,224,196,0.78)',
    textShadow: ENGRAVE.faint,
  },
  value: {
    fontFamily: FONT.display, fontSize: '18px', fontWeight: 600,
    color: COLOR.title, textShadow: ENGRAVE.medium,
  },
  label: {
    fontFamily: FONT.sans, fontSize: '11px', fontWeight: 500,
    letterSpacing: '0.3em', textTransform: 'uppercase',
    color: COLOR.labelTertiary, textShadow: ENGRAVE.thin,
  },
};

export const WanderlustRecordList: React.FC<WanderlustRecordListProps> = ({
  columns, records, density = 'comfortable', rail = true, className, style,
}) => {
  const gap = sp(DENSITY_GAP[density]);
  const template = columns.map(c => c.width).join(' ');

  return (
    <div className={className} role="list" style={{
      display: 'flex', flexDirection: 'column', gap,
      ...(rail ? {
        borderLeft: `2px solid ${COLOR.separator}`,
        paddingLeft: sp('lg'), position: 'relative',
      } : {}),
      ...style,
    }}>
      {records.map((cells, rowIdx) => (
        <div key={rowIdx} role="listitem" style={{
          display: 'grid', gridTemplateColumns: template,
          gap: sp('lg'), alignItems: 'baseline',
          padding: '9px 14px', borderRadius: '4px', position: 'relative',
        }}>
          {rail && (
            <span style={{
              position: 'absolute', left: '-21px', top: '50%', width: '6px', height: '6px',
              transform: 'translateY(-50%) rotate(45deg)',
              background: 'rgba(216,177,62,0.12)', border: '1px solid rgba(216,177,62,0.28)',
            }} aria-hidden="true" />
          )}
          {cells.map((cell, colIdx) => {
            const col = columns[colIdx];
            return (
              <span key={colIdx} style={{
                ...CELL_STYLE[col?.variant ?? 'body'],
                textAlign: col?.align ?? 'left', minWidth: 0,
              }}>{cell}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  6. WanderlustDivider
 *  Ornamental SVG divider with center diamond + satellite dots.
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustDividerProps {
  marginY?: SpaceKey;
  className?: string;
  style?: CSSProperties;
}

export const WanderlustDivider: React.FC<WanderlustDividerProps> = ({
  marginY = 'xl', className, style,
}) => (
  <div className={className} role="separator" aria-hidden="true" style={{
    position: 'relative', height: '20px', margin: `${sp(marginY)} 0`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
  }}>
    <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent 5%, rgba(216,177,62,0.4))' }} />
    <svg viewBox="0 0 44 20" width={44} height={20} style={{ flexShrink: 0, margin: '0 4px' }}>
      <line x1="0" y1="10" x2="14" y2="10" stroke="rgba(216,177,62,0.3)" strokeWidth="0.5" />
      <line x1="30" y1="10" x2="44" y2="10" stroke="rgba(216,177,62,0.3)" strokeWidth="0.5" />
      <polygon points="22,2 28.5,10 22,18 15.5,10" fill="none" stroke="rgba(240,207,106,0.55)" strokeWidth="0.8" />
      <polygon points="22,5 25.5,10 22,15 18.5,10" fill="rgba(240,207,106,0.3)" />
      <circle cx="11" cy="10" r="1.2" fill="rgba(240,207,106,0.4)" />
      <circle cx="33" cy="10" r="1.2" fill="rgba(240,207,106,0.4)" />
    </svg>
    <span style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, transparent 5%, rgba(216,177,62,0.4))' }} />
  </div>
);

/* ════════════════════════════════════════════════════════════════════════
 *  7. WanderlustSectionHeader
 *  Tiered: primary (bright, focal) vs tertiary (quiet, supporting).
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustSectionHeaderProps {
  children: ReactNode;
  tier?: Tier;
  hint?: ReactNode;
  marginBottom?: SpaceKey;
  className?: string;
  style?: CSSProperties;
}

export const WanderlustSectionHeader: React.FC<WanderlustSectionHeaderProps> = ({
  children, tier = 'tertiary', hint, marginBottom = 'lg', className, style,
}) => {
  const isPrimary = tier === 'primary';
  return (
    <div className={className} style={{
      display: 'flex', alignItems: 'center', gap: sp('md'),
      marginBottom: sp(marginBottom), ...style,
    }}>
      <h3 style={{
        ...labelBase(tier),
        whiteSpace: 'nowrap',
        fontSize: isPrimary ? '12px' : '10px',
        letterSpacing: isPrimary ? '0.34em' : '0.3em',
        color: isPrimary ? COLOR.accent : COLOR.labelTertiary,
        textShadow: isPrimary
          ? `${ENGRAVE.thin}, 0 0 12px rgba(240,207,106,0.25)`
          : ENGRAVE.thin,
        position: 'relative',
      }}>
        {children}
        <span style={{
          position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '1px',
          background: isPrimary
            ? 'linear-gradient(90deg, rgba(240,207,106,0.5), transparent 90%)'
            : 'linear-gradient(90deg, rgba(154,130,70,0.3), transparent 90%)',
        }} aria-hidden="true" />
      </h3>
      {hint && (
        <span style={{
          fontFamily: FONT.serif, fontSize: '12px', fontStyle: 'italic',
          color: 'rgba(154,130,70,0.7)', letterSpacing: '0.02em',
        }}>{hint}</span>
      )}
      <span style={{
        flex: 1, height: '1px',
        background: isPrimary
          ? 'linear-gradient(90deg, rgba(240,207,106,0.4), transparent 60%)'
          : 'linear-gradient(90deg, rgba(154,130,70,0.22), transparent 60%)',
      }} aria-hidden="true" />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────
 *  Namespace export
 * ────────────────────────────────────────────────────────────────────── */

export const WanderlustLayout = {
  Heading: WanderlustHeading,
  Field: WanderlustField,
  FieldGroup: WanderlustFieldGroup,
  RequirementList: WanderlustRequirementList,
  RecordList: WanderlustRecordList,
  Divider: WanderlustDivider,
  SectionHeader: WanderlustSectionHeader,
  StatBar: WanderlustStatBar,
  Portrait: WanderlustPortrait,
  SPACE,
};

export { WanderlustStatBar, WanderlustPortrait };
export type { StatBarVariant, StatBarSize, WanderlustStatBarProps, WanderlustPortraitProps };

export default WanderlustLayout;

```

## `src/ui/wanderlust-surface/layout/WanderlustStatBar.tsx`

```tsx
import type { CSSProperties } from 'react';
import React from 'react';
import { useMatericSkin } from '../MatericSkinContext';
import { MATERIC_SKIN_CONFIG } from '../matericSkinConfig';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST STAT BAR
 *
 *  Material-style stat bar for HP, stamina, fatigue.
 *  - Carved track with inset shadow (physical depth)
 *  - Gradient fill with specular highlight (not flat)
 *  - Label + value on sides (horizontal WanderlustField style)
 *  - GPU-only animations (transform + opacity)
 * ════════════════════════════════════════════════════════════════════════ */

export type StatBarVariant = 'hp' | 'stamina' | 'fatigue';
export type StatBarSize = 'sm' | 'md' | 'lg';

export interface WanderlustStatBarProps {
  label: string;
  value: number;
  maxValue: number;
  variant?: StatBarVariant;
  size?: StatBarSize;
  showValue?: boolean;
  className?: string;
  style?: CSSProperties;
}

// Color variants — now read from skin tokens with fallback to hardcoded defaults
const VARIANT_COLORS: Record<StatBarVariant, { start: string; end: string; shadow: string }> = {
  hp: {
    start: 'var(--skin-statbar-hp-start, #0a8a4a)',
    end: 'var(--skin-statbar-hp-end, #6ee7b7)',
    shadow: 'var(--skin-statbar-hp-glow, rgba(110,231,183,0.45))',
  },
  stamina: {
    start: 'var(--skin-statbar-stamina-start, #d4af37)',
    end: 'var(--skin-statbar-stamina-end, #f59e0b)',
    shadow: 'var(--skin-statbar-stamina-glow, rgba(245,158,11,0.45))',
  },
  fatigue: {
    start: 'var(--skin-statbar-fatigue-start, #9e5a4a)',
    end: 'var(--skin-statbar-fatigue-end, #d98a4a)',
    shadow: 'var(--skin-statbar-fatigue-glow, rgba(217,138,74,0.6))',
  },
};

// Size configurations
const SIZE_CONFIG: Record<StatBarSize, { height: string; labelSize: string; valueSize: string }> = {
  sm: { height: '6px', labelSize: '9px', valueSize: '9px' },
  md: { height: '8px', labelSize: '10px', valueSize: '10px' },
  lg: { height: '12px', labelSize: '11px', valueSize: '11px' },
};

// Wanderlust typography tokens
const FONT = {
  display: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)',
  serif: 'var(--wl-font-serif, "EB Garamond", Georgia, serif)',
  sans: 'var(--wl-font-sans, system-ui, sans-serif)',
} as const;

const COLOR = {
  labelPrimary: 'var(--skin-label-primary, #c9a84e)',
  labelTertiary: 'var(--skin-label-tertiary, #9a8246)',
  body: 'var(--skin-body-color, rgba(237,224,196,0.92))',
} as const;

// Engraving shadows for text
const ENGRAVE = {
  thin: '0 1px 2px rgba(0,0,0,0.7)',
  faint: '0 1px 1px rgba(0,0,0,0.5)',
} as const;

export const WanderlustStatBar: React.FC<WanderlustStatBarProps> = ({
  label,
  value,
  maxValue,
  variant = 'hp',
  size = 'md',
  showValue = true,
  className,
  style,
}) => {
  const percent = maxValue > 0 ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : 0;
  const colors = VARIANT_COLORS[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const isMateric = useMatericSkin();

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    ...style,
  };

  const labelStyle: CSSProperties = {
    fontFamily: FONT.sans,
    fontSize: sizeConfig.labelSize,
    fontWeight: 600,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: COLOR.labelPrimary,
    whiteSpace: 'nowrap',
    textShadow: ENGRAVE.thin,
    minWidth: '24px',
  };

  const trackStyle: CSSProperties = isMateric
    ? {
        flex: 1,
        height: sizeConfig.height,
        position: 'relative',
        backgroundColor: MATERIC_SKIN_CONFIG.track.backgroundColor,
        backgroundImage: MATERIC_SKIN_CONFIG.track.backgroundImage,
        backgroundBlendMode: MATERIC_SKIN_CONFIG.track.backgroundBlendMode,
        backgroundRepeat: MATERIC_SKIN_CONFIG.track.backgroundRepeat,
        backgroundSize: MATERIC_SKIN_CONFIG.track.backgroundSize,
        border: MATERIC_SKIN_CONFIG.track.border,
        borderRadius: MATERIC_SKIN_CONFIG.track.borderRadius,
        boxShadow: MATERIC_SKIN_CONFIG.track.boxShadow,
        overflow: 'hidden',
      }
    : {
        flex: 1,
        height: sizeConfig.height,
        position: 'relative',
        background: 'var(--skin-statbar-track, linear-gradient(180deg, #0c0b0a, #050505))',
        border: '1px solid var(--skin-statbar-track-border, rgba(216,177,62,0.08))',
        borderRadius: '6px',
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.85), inset 0 1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03)',
        overflow: 'hidden',
      };

  const fillConfig = MATERIC_SKIN_CONFIG[variant === 'hp' ? 'hpFill' : variant === 'stamina' ? 'staminaFill' : 'fatigueFill'];

  const fillStyle: CSSProperties = isMateric
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${percent}%`,
        backgroundImage: fillConfig.backgroundImage,
        backgroundSize: fillConfig.backgroundSize,
        backgroundBlendMode: fillConfig.backgroundBlendMode,
        borderRadius: fillConfig.borderRadius,
        boxShadow: fillConfig.boxShadow,
        transition: 'width 280ms cubic-bezier(0.34,1.56,0.64,1)',
        willChange: 'width',
      }
    : {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${percent}%`,
        background: `linear-gradient(90deg, ${colors.start}, ${colors.end})`,
        borderRadius: '5px',
        boxShadow: `inset 0 0 0 0.5px color-mix(in srgb, var(--skin-icon-color, #dfb857) 85%, transparent), 0 0 8px rgba(0,0,0,0.35), 0 0 6px ${colors.shadow}`,
        transition: 'width 280ms cubic-bezier(0.34,1.56,0.64,1)',
        willChange: 'width',
      };

  const valueStyle: CSSProperties = {
    fontFamily: FONT.sans,
    fontSize: sizeConfig.valueSize,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: COLOR.body,
    textShadow: ENGRAVE.faint,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
    minWidth: '40px',
    textAlign: 'right',
  };

  // Add specular highlight (liquid-gem / resin glossy top sheen)
  const fillHighlightStyle: CSSProperties = isMateric
    ? {
        position: 'absolute',
        inset: '0 0 50% 0',
        borderRadius: MATERIC_SKIN_CONFIG.fillHighlight.borderRadius,
        backgroundImage: MATERIC_SKIN_CONFIG.fillHighlight.backgroundImage,
        pointerEvents: 'none',
      }
    : {
        position: 'absolute',
        inset: '0 0 50% 0',
        borderRadius: '5px 5px 0 0',
        background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.22), transparent)',
        pointerEvents: 'none',
      };

  return (
    <div className={className} style={containerStyle}>
      <span style={labelStyle}>{label}</span>
      <div style={trackStyle}>
        <div style={fillStyle}>
          <div style={fillHighlightStyle} />
        </div>
      </div>
      {showValue && (
        <span style={valueStyle}>
          {value}/{maxValue}
        </span>
      )}
    </div>
  );
};

export default WanderlustStatBar;

```

## `src/ui/wanderlust-surface/layout/WanderlustPortrait.tsx`

```tsx
import type { CSSProperties } from 'react';
import React from 'react';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST PORTRAIT
 *
 *  Circular portrait frame with gold border and atmospheric glow.
 *  - Circular frame with gold border (matching roster_wanderlust_reskin.html)
 *  - Radial gradient background (dark bronze)
 *  - Optional image or initials fallback
 *  - Inset shadow for depth
 *  - Outer glow for hero/emissive states
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustPortraitProps {
  portraitUrl?: string;
  initials?: string;
  size?: number;
  isHero?: boolean;
  className?: string;
  style?: CSSProperties;
}

// Wanderlust color tokens (V9 skin-aware; fallbacks mirror base layout primitives)
const COLOR = {
  gold: 'var(--skin-icon-color, #d8b13e)',
  goldBright: 'var(--skin-title-color, #f0cf6a)',
  label: 'var(--skin-label-primary, #c9a84e)',
  labelDim: 'var(--skin-label-tertiary, #9a8246)',
  parchment: 'var(--skin-text-primary, #F5F2E8)',
} as const;

const FONT = {
  display: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)',
} as const;

export const WanderlustPortrait: React.FC<WanderlustPortraitProps> = ({
  portraitUrl,
  initials,
  size = 56,
  isHero = false,
  className,
  style,
}) => {
  const containerStyle: CSSProperties = {
    position: 'relative',
    width: `${size}px`,
    height: `${size}px`,
    flexShrink: 0,
    ...style,
  };

  const frameStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    border: `1.5px solid ${COLOR.gold}`,
    boxShadow: `
      inset 0 1px 4px rgba(0,0,0,0.5),
      0 0 12px rgba(223,184,87,0.2)
    `,
    background: 'radial-gradient(circle at 38% 32%, var(--skin-surface-base, #060f16), var(--skin-surface-base, #060f16))',
  };

  const heroGlowStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    pointerEvents: 'none',
    boxShadow: isHero
      ? `0 0 16px rgba(223,184,87,0.12), inset 0 0 0 1px rgba(223,184,87,0.25)`
      : 'none',
  };

  const imageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const initialsStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT.display,
    fontSize: `${size * 0.32}px`,
    fontWeight: 700,
    color: COLOR.goldBright,
    letterSpacing: '0.03em',
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={frameStyle}>
        {portraitUrl ? (
          <img src={portraitUrl} alt="" style={imageStyle} draggable={false} />
        ) : (
          <div style={initialsStyle}>{initials}</div>
        )}
      </div>
      {isHero && <div style={heroGlowStyle} />}
    </div>
  );
};

export default WanderlustPortrait;

```

## `src/ui/wanderlust-surface/layout/QuestChronicle.tsx`

```tsx
import type { CSSProperties } from 'react';
import React, { useEffect, useState } from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import { WanderlustAmbientField } from './WanderlustAmbientField';
import {
  WanderlustHeading,
  WanderlustField,
  WanderlustFieldGroup,
  WanderlustRequirementList,
  WanderlustRecordList,
  WanderlustDivider,
  WanderlustSectionHeader,
  SPACE,
  type WanderlustRequirement,
} from './WanderlustLayout';

/* ════════════════════════════════════════════════════════════════════════
 *  QuestChronicle — Example composition
 *
 *  Shows how to assemble the full quest detail panel from:
 *  - WanderlustSurface (border / material — already exists)
 *  - WanderlustAmbientField (atmosphere)
 *  - WanderlustLayout primitives (text, data, requirements, log)
 *  - Your own slot/rack components (plugged in via children/slots)
 *
 *  This file is an EXAMPLE, not a library component. Copy and adapt.
 * ════════════════════════════════════════════════════════════════════════ */

export interface QuestChronicleSlot {
  id: string;
  filled: boolean;
  portraitUrl?: string;
  initials?: string;
}

export interface QuestChronicleEvent {
  timestamp: string;
  message: string;
}

export interface QuestChronicleProps {
  title: string;
  category?: string;
  description?: string;
  duration?: string;
  reward?: string;
  eta?: string;
  slots?: QuestChronicleSlot[];
  requirements?: WanderlustRequirement[];
  events?: QuestChronicleEvent[];
  onClose?: () => void;
  style?: CSSProperties;
}

export const QuestChronicle: React.FC<QuestChronicleProps> = ({
  title,
  category,
  description,
  duration,
  reward,
  eta,
  slots = [],
  requirements = [],
  events = [],
  onClose,
  style,
}) => {
  // Performance: disable heavy SVG filters during open animation
  const [isOpening, setIsOpening] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsOpening(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <WanderlustSurface
      shape="panel"
      isDragging={isOpening}
      style={{ width: '100%', maxWidth: 720, ...style }}
    >
      <WanderlustAmbientField paused={isOpening}>

        {/* ── Close button ── */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 0, right: 0, zIndex: 3,
              width: 32, height: 32, borderRadius: '50%',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'rgba(201,168,78,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none"
              stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}

        {/* ── Header row: quest dot + heading ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingRight: 36 }}>
          {/* Quest indicator dot — ruota lentamente */}
          <div style={{ flexShrink: 0, marginTop: 8 }}>
            <svg viewBox="0 0 28 28" width={28} height={28}
              style={{ animation: 'wl-dot-spin 40s linear infinite' }}>
              <circle cx="14" cy="14" r="12" fill="none"
                stroke="rgba(216,177,62,0.5)" strokeWidth="1" strokeDasharray="3 4" />
              <circle cx="14" cy="14" r="6" fill="none"
                stroke="rgba(240,207,106,0.4)" strokeWidth="0.8" />
              <circle cx="14" cy="14" r="2" fill="rgba(240,207,106,0.6)" />
            </svg>
          </div>

          <WanderlustHeading
            title={title}
            subtitle={category}
            description={description}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>

        <WanderlustDivider />

        {/* ── Primary data row ── */}
        {(duration || reward || eta) && (
          <WanderlustFieldGroup layout="columns" columns={3}>
            {duration && <WanderlustField label="Durata" value={duration} />}
            {reward && <WanderlustField label="Ricompensa" value={reward} />}
            {eta && <WanderlustField label="ETA" value={eta} />}
          </WanderlustFieldGroup>
        )}

        <WanderlustDivider />

        {/* ── Assigned characters (FOCAL — primary tier) ── */}
        {slots.length > 0 && (
          <>
            <WanderlustSectionHeader tier="primary">
              Personaggi Assegnati
            </WanderlustSectionHeader>

            <div style={{ display: 'flex', gap: 20 }}>
              {slots.map((slot) => (
                <div key={slot.id} style={{
                  width: 66, height: 66, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--wl-font-display)', fontWeight: 700, fontSize: 22,
                  background: 'radial-gradient(circle at 38% 32%, #2a1810 0%, #140b06 70%, #0a0503 100%)',
                  cursor: 'pointer',
                  ...(slot.filled ? {
                    border: '1.5px solid var(--wl-gold, #d8b13e)',
                    color: 'var(--wl-gold-bright, #f0cf6a)',
                    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.6), 0 0 16px rgba(216,177,62,0.3), 0 3px 10px rgba(120,30,10,0.35)',
                  } : {
                    border: '1px dashed rgba(201,168,78,0.3)',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7), 0 2px 6px rgba(80,20,8,0.2)',
                  }),
                }}>
                  {slot.filled ? (
                    slot.portraitUrl
                      ? <img src={slot.portraitUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : <span>{slot.initials}</span>
                  ) : (
                    <svg viewBox="0 0 40 40" width={40} height={40} style={{ opacity: 0.32 }}>
                      <path d="M20 9 C16 9 13 12 13 16 C13 20 16 22 20 22 C24 22 27 20 27 16 C27 12 24 9 20 9 Z M11 33 C11 26 15 24 20 24 C25 24 29 26 29 33 Z"
                        fill="rgba(201,168,78,0.9)" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <div style={{ height: SPACE.xxl }} />
          </>
        )}

        {/* ── Requirements (tertiary tier — supporting) ── */}
        {requirements.length > 0 && (
          <>
            <WanderlustSectionHeader tier="tertiary" hint="squadra attuale">
              Requisiti
            </WanderlustSectionHeader>
            <WanderlustRequirementList requirements={requirements} />
            <div style={{ height: SPACE.xl }} />
          </>
        )}

        {/* ── Event log (tertiary tier) ── */}
        {events.length > 0 && (
          <>
            <WanderlustSectionHeader tier="tertiary">
              Registro Eventi
            </WanderlustSectionHeader>
            <WanderlustRecordList
              columns={[
                { width: '60px', variant: 'caption' },
                { width: '1fr', variant: 'body' },
              ]}
              records={events.map(e => [e.timestamp, e.message])}
              rail
            />
          </>
        )}

        {/* ── Footer scroll indicator ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: SPACE.xxl }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, rgba(216,177,62,0.18), rgba(0,0,0,0.3))',
            border: '1px solid rgba(216,177,62,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(216,177,62,0.12), inset 0 1px 0 rgba(216,177,62,0.15)',
            cursor: 'pointer',
          }}>
            <svg viewBox="0 0 24 24" width={17} height={17} fill="none"
              stroke="var(--wl-gold-bright, #f0cf6a)" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </WanderlustAmbientField>
    </WanderlustSurface>
  );
};

/* ── Usage example ─────────────────────────────────────────────────────

import { QuestChronicle } from './QuestChronicle';

<QuestChronicle
  title="Dangerous Hunt"
  category="quest"
  description="High-risk quest with substantial rewards but low success probability."
  duration="8000s"
  reward="Gold +15"
  eta="2800s"
  slots={[
    { id: '1', filled: true, initials: 'E' },
    { id: '2', filled: false },
    { id: '3', filled: false },
  ]}
  requirements={[
    { label: 'Forza',        current: 14, required: 12 },
    { label: 'Destrezza',    current: 9,  required: 11 },
    { label: 'Costituzione', current: 12, required: 10 },
  ]}
  events={[
    { timestamp: '17:33', message: 'Activity started' },
    { timestamp: '18:03', message: 'Worker assigned to slot 3' },
    { timestamp: '18:23', message: 'Progress update: 65%' },
  ]}
  onClose={() => console.log('close')}
/>

──────────────────────────────────────────────────────────────────────── */

export default QuestChronicle;

```

## `src/ui/wanderlust-surface/MatericSkinContext.tsx`

```ts
import { createContext, useContext } from 'react';

/**
 * Context that toggles the "Materic" (Pulsazione Materica) skin variant.
 *
 * When a component tree is wrapped in {@link MatericSkinProvider}, the roster
 * and stat bars render a rough, engraved, stone/bronze aesthetic: sharp
 * non-rounded bars, sap-like HP fill, golden sand stamina, and a grain overlay.
 *
 * @example
 * ```tsx
 * import { MatericSkinProvider } from './MatericSkinProvider';
 * import { useMatericSkin } from './MatericSkinContext';
 *
 * <MatericSkinProvider>
 *   <RosterDraggable useWanderlustSkin componentId="materic-roster" />
 * </MatericSkinProvider>
 * ```
 */
export interface MatericSkinContextValue {
  /** Whether the Materic skin variant is active for this subtree. */
  isMateric: boolean;
}

/**
 * React context that stores whether the Materic skin variant is active.
 */
export const MatericSkinContext = createContext<MatericSkinContextValue>({ isMateric: false });

/**
 * Returns `true` if the current React tree is wrapped in a {@link MatericSkinProvider}.
 */
export function useMatericSkin(): boolean {
  return useContext(MatericSkinContext).isMateric;
}

```

## `src/ui/wanderlust-surface/matericSkinConfig.ts`

```ts
import { z } from 'zod';

/**
 * @fileoverview Config tokens for the "Materic" (Pulsazione Materica) skin variant.
 *
 * These values are consumed by {@link WanderlustStatBar} and {@link DragTestContainer}
 * when they are rendered inside a {@link MatericSkinProvider}. They are intentionally
 * kept in a single config module so the visual recipe can be tuned without touching
 * component code.
 */

const statBarFillConfigSchema = z.object({
  /** CSS background-image value (may include layered gradients). */
  backgroundImage: z.string(),
  /** Background-size for each image layer. */
  backgroundSize: z.string(),
  /** Blend mode for each image layer. */
  backgroundBlendMode: z.string(),
  /** Box shadow applied to the fill. */
  boxShadow: z.string(),
  /** Border radius for the fill (Materic uses sharp corners). */
  borderRadius: z.string(),
});

const statBarTrackConfigSchema = z.object({
  /** Base background color behind the texture. */
  backgroundColor: z.string(),
  /** CSS background-image for the track texture. */
  backgroundImage: z.string(),
  /** Blend mode for the track texture. */
  backgroundBlendMode: z.string(),
  /** Repeat value for the track texture. */
  backgroundRepeat: z.string(),
  /** Background size for the track texture. */
  backgroundSize: z.string(),
  /** Border shorthand for the track. */
  border: z.string(),
  /** Border radius for the track (Materic uses sharp corners). */
  borderRadius: z.string(),
  /** Box shadow applied to the track. */
  boxShadow: z.string(),
});

const statBarHighlightConfigSchema = z.object({
  /** CSS background-image for the top sheen. */
  backgroundImage: z.string(),
  /** Border radius for the highlight (Materic uses sharp corners). */
  borderRadius: z.string(),
});

const grainConfigSchema = z.object({
  /** Texture URL used for the grain overlay. */
  textureUrl: z.string(),
  /** Opacity of the grain overlay. */
  opacity: z.number(),
  /** CSS mix-blend-mode for the grain overlay. */
  mixBlendMode: z.string(),
  /** Background size for the grain texture. */
  size: z.string(),
  /** Background repeat for the grain texture. */
  repeat: z.string(),
});

/**
 * Zod schema for the full Materic skin config.
 */
export const matericSkinConfigSchema = z.object({
  track: statBarTrackConfigSchema,
  hpFill: statBarFillConfigSchema,
  staminaFill: statBarFillConfigSchema,
  fatigueFill: statBarFillConfigSchema,
  fillHighlight: statBarHighlightConfigSchema,
  grain: grainConfigSchema,
});

/**
 * TypeScript type inferred from {@link matericSkinConfigSchema}.
 */
export type MatericSkinConfig = z.infer<typeof matericSkinConfigSchema>;

/**
 * Default Materic skin tokens.
 */
export const MATERIC_SKIN_CONFIG: MatericSkinConfig = matericSkinConfigSchema.parse({
  track: {
    backgroundColor: '#0a0908',
    backgroundImage: 'url("/assets/ui/bg.png")',
    backgroundBlendMode: 'soft-light',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    border: '1px solid rgba(216,177,62,0.12)',
    borderRadius: '0px',
    boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.95), inset 0 1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03)',
  },
  hpFill: {
    backgroundImage: 'radial-gradient(ellipse 80% 80% at 20% 50%, rgba(255,255,255,0.12), transparent 50%), linear-gradient(90deg, #0d4a2a, #2d6a4f, #4a9c6a, #7bc96f)',
    backgroundSize: '100% 100%, 100% 100%',
    backgroundBlendMode: 'overlay, normal',
    boxShadow: 'inset 0 0 0 0.5px rgba(123,201,111,0.4), 0 0 8px rgba(0,0,0,0.35), 0 0 6px rgba(123,201,111,0.25)',
    borderRadius: '0px',
  },
  staminaFill: {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, #7a5c00, #d4af37, #f0cf6a)',
    backgroundSize: '3px 3px, 100% 100%',
    backgroundBlendMode: 'overlay, normal',
    boxShadow: 'inset 0 0 0 0.5px rgba(245,158,11,0.4), 0 0 8px rgba(0,0,0,0.35), 0 0 6px rgba(245,158,11,0.2)',
    borderRadius: '0px',
  },
  fatigueFill: {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, #7a3c2a, #9e5a4a, #d98a4a)',
    backgroundSize: '3px 3px, 100% 100%',
    backgroundBlendMode: 'overlay, normal',
    boxShadow: 'inset 0 0 0 0.5px rgba(217,138,74,0.4), 0 0 8px rgba(0,0,0,0.35), 0 0 6px rgba(217,138,74,0.2)',
    borderRadius: '0px',
  },
  fillHighlight: {
    backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.22), transparent)',
    borderRadius: '0px',
  },
  grain: {
    textureUrl: '/assets/ui/bg.png',
    opacity: 0.1,
    mixBlendMode: 'normal',
    size: 'auto',
    repeat: 'repeat',
  },
});

```

## `src/ui/wanderlust-surface/wanderlust-surface.css`

```css
/* ═══════════════════════════════════════════════════════════════════
   wanderlust-surface.css
   Bronze surface system — animations, layout, and state classes.
   Import once in your app entry point.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Rim breathing animation ───────────────────────────────────── */
@keyframes ws-rim-breath {
  0%,
  100% {
    opacity: 0.9;
  }
  45% {
    opacity: 0.65;
  }
  75% {
    opacity: 0.82;
  }
}

.ws-rim-arc {
  animation: ws-rim-breath 9.4s ease-in-out infinite;
}

/* ── Layout wrapper ────────────────────────────────────────────── */
.ws-root {
  position: relative;
  overflow: hidden;
}

/* The SVG border overlay sits on top of everything */
.ws-border-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* Content slot — lives below the border overlay */
.ws-content {
  position: relative;
  z-index: 0;
}

/* ── Shape variants ────────────────────────────────────────────── */

/* Panel: wide, cinematic (21:9ish or freeform) */
.ws-root--panel {
  border-radius: 18px;
}
.ws-root--panel .ws-content {
  /* Inset matches the border thickness */
  padding: 22px;
}

/* Card: portrait 3:4 */
.ws-root--card {
  border-radius: 18px;
}
.ws-root--card .ws-content {
  padding: 22px;
}

/* Badge: pill shape */
.ws-root--badge {
  border-radius: 9999px;
}
.ws-root--badge .ws-content {
  padding: 12px 20px;
}

/* Medallion: circular */
.ws-root--medallion {
  border-radius: 50%;
}
.ws-root--medallion .ws-content {
  padding: 22px;
}

/* Tablet: 4:3 with cut corners */
.ws-root--tablet {
  border-radius: 18px;
}
.ws-root--tablet .ws-content {
  padding: 22px;
}

/* ── Interactive states ────────────────────────────────────────── */

/* Hover: slight lift + brighten */
.ws-root--interactive {
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.ws-root--interactive:hover {
  transform: scale(1.012) translateY(-1px);
  filter: brightness(1.06) saturate(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* Circular shadow for medallion shape */
.ws-root--medallion.ws-root--interactive:hover {
  border-radius: 50%;
}

/* Increase top-left reflection opacity on hover */
.ws-root--interactive:hover .ws-rim-arc {
  opacity: 1;
}

.ws-root--interactive:active {
  transform: scale(0.988) translateY(0.5px);
  filter: brightness(0.97);
}

/* ── Dragging optimisation ─────────────────────────────────────── */
.ws-root--dragging .ws-border-svg {
  /* Kill heavy filters during drag for performance */
  will-change: transform;
}

/* ── Paused state — freeze rim breathing ───────────────────────── */
.ws-root--paused .ws-rim-arc {
  animation-play-state: paused;
}

/* ── V8 MLE: Heavy Feel (weighted easing for physical presence) ─── */
.ws-root--heavy-feel {
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0),
    box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0),
    filter 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0);
}

.ws-root--heavy-feel:hover {
  transform: scale(1.015) translateY(-2px);
  box-shadow:
    0 2px 3px rgba(0, 0, 0, 0.25),
    0 10px 20px rgba(0, 0, 0, 0.35),
    inset 1px 1px 0 rgba(255, 255, 255, 0.1);
  filter: brightness(1.08) saturate(1.1);
}

.ws-root--heavy-feel:active {
  transform: scale(0.985) translateY(1px);
}

/* ── V8 MLE: Emissive Halo disabled - causes visible border artifacts ── */

/* ── Typography styles ──────────────────────────────────────────── */

/* Primary text: cream/gold for important text */
.ws-text--title {
  color: #e4d5b7;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.02em;
}

.ws-text--subtitle {
  color: #e4d5b7;
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.ws-text--body {
  color: #e4d5b7;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
}

/* Secondary text: desaturated bronze for labels, captions */
.ws-text--label {
  color: #8a7050;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.ws-text--caption {
  color: #8a7050;
  font-size: 0.6875rem;
  font-weight: 400;
  line-height: 1.4;
}

/* ── Reduced motion ────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ws-rim-arc {
    animation: none;
  }
  .ws-root--interactive {
    transition: none;
  }
}

```

## `src/ui/wanderlust-surface/layout/wanderlust-layout.css`

```css
/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST LAYOUT SYSTEM — CSS Tokens + Ambient Animations
 *  Import ONCE in your app root (e.g. App.tsx or main.css).
 *
 *  Override any --wl-* variable to re-theme globally.
 * ════════════════════════════════════════════════════════════════════════ */

:root {
  /* ── CANVAS ── */
  --wl-canvas:          #030202;
  --wl-canvas-warm:     #100a06;

  /* ── TEXT ── */
  --wl-text-title:      #e4d5b7;
  --wl-text-body:       rgba(237, 224, 196, 0.92);
  --wl-text-accent:     #f0cf6a;
  --wl-label-primary:   #c9a84e;
  --wl-label-tertiary:  #9a8246;

  /* ── GOLD RAMP ── */
  --wl-gold:            #d8b13e;
  --wl-gold-bright:     #f0cf6a;
  --wl-gold-dim:        rgba(216, 177, 62, 0.4);

  /* ── STATUS ── */
  --wl-status-met:      #7bc96f;
  --wl-status-unmet:    #d98a4a;

  /* ── SEPARATORS ── */
  --wl-separator:       rgba(216, 177, 62, 0.2);

  /* ── SPACING SCALE: the invisible grid ── */
  --wl-space-xs:    4px;
  --wl-space-sm:    8px;
  --wl-space-md:   12px;
  --wl-space-lg:   16px;
  --wl-space-xl:   24px;
  --wl-space-xxl:  32px;
  --wl-gap-medium: 24px;

  /* ── FONTS ── */
  --wl-font-display: "Cinzel", "Trajan Pro", serif;
  --wl-font-serif:   "EB Garamond", Georgia, serif;
  --wl-font-sans:    system-ui, -apple-system, sans-serif;

  /* ── TYPE SCALE ── */
  --wl-title-size:    30px;
  --wl-subtitle-size: 12px;
  --wl-body-size:     15.5px;
  --wl-label-size:    11px;
  --wl-value-size:    23px;
  --wl-caption-size:  12px;
}

/* ════════════════════════════════════════════════════════════════════════
 *  AMBIENT ANIMATIONS — GPU-only (transform + opacity)
 * ════════════════════════════════════════════════════════════════════════ */

@keyframes wl-nebula-drift {
  0%   { transform: translate(0, 0) scale(1);           }
  100% { transform: translate(-12px, -8px) scale(1.06); }
}

@keyframes wl-leak-breathe {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1;   }
}

@keyframes wl-fly-rise1 {
  0%   { transform: translate(0, 0);              }
  25%  { transform: translate(18px, -150px);      }
  50%  { transform: translate(-10px, -300px);     }
  75%  { transform: translate(14px, -440px);      }
  100% { transform: translate(-6px, -580px);      }
}

@keyframes wl-fly-rise2 {
  0%   { transform: translate(0, 0);              }
  25%  { transform: translate(-16px, -150px);     }
  50%  { transform: translate(12px, -300px);      }
  75%  { transform: translate(-18px, -440px);     }
  100% { transform: translate(8px, -580px);       }
}

@keyframes wl-fly-glow {
  0%, 100% { opacity: 0.15; }
  50%      { opacity: 0.85; }
}

@keyframes wl-dot-spin {
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  @keyframes wl-nebula-drift  { 0%, 100% { transform: none; } }
  @keyframes wl-leak-breathe  { 0%, 100% { opacity: 0.8; }   }
  @keyframes wl-fly-rise1     { 0%, 100% { transform: none; } }
  @keyframes wl-fly-rise2     { 0%, 100% { transform: none; } }
  @keyframes wl-fly-glow      { 0%, 100% { opacity: 0.4; }   }
  @keyframes wl-dot-spin      { 0%, 100% { transform: none; } }
}

```

## `src/ui/visualFidelityLab/fidelity-header.css`

```css
/*
 * FINDING #2 (documented, not fixed here):
 * The header "language" (plaque / title-row / titlesep / close-corner) is NOT a
 * shared primitive. In the reference it lives as a LOCAL <style> block inside
 * v9-skin-sandbox.tsx (~line 1093). Only the `--skin-*` TOKENS are global; the
 * class RULES are not. This file replicates those rules VERBATIM (consuming only
 * existing tokens) so the fidelity test compares like-with-like. It creates no
 * new component and no new token — it makes an existing, un-extracted "language"
 * usable outside the sandbox. Extraction (if any) happens only after the gate.
 */

.vfl-scope .skin-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.vfl-scope .skin-plaque {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--skin-plaque-padding);
  border: var(--skin-plaque-border);
  border-radius: var(--skin-plaque-radius);
  background-color: var(--skin-plaque-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: var(--skin-plaque-shadow);
  font-family: 'Cinzel', 'Georgia', serif;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--skin-plaque-tracking);
  color: var(--skin-plaque-color);
  text-shadow: 0 0 8px rgba(201, 162, 39, 0.6), 0 1px 2px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
}

.vfl-scope .skin-titlesep {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 4px;
}
.vfl-scope .skin-titlesep__line {
  flex: 1;
  height: 1px;
  background: var(--skin-titlesep-line);
}
.vfl-scope .skin-titlesep__diamond {
  font-size: 12px;
  line-height: 1;
  color: var(--skin-titlesep-diamond-color);
  text-shadow: var(--skin-titlesep-diamond-glow);
}

.vfl-scope .skin-close-corner {
  width: var(--skin-close-size);
  height: var(--skin-close-size);
  border-radius: var(--skin-close-radius);
  border: var(--skin-close-border);
  background: var(--skin-close-bg);
  color: var(--skin-close-color);
  box-shadow: var(--skin-close-shadow);
  font-size: 1.15rem;
  font-weight: 300;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

/*
 * FINDING #1 (documented, not fixed here):
 * WanderlustSurface renders `.ws-content` (z-index 0) BEHIND its own frame SVG
 * (`.ws-border-svg`, z-index 1). The reference only shows content because the
 * sandbox overrides it locally. Same page-scoped override here. In the extracted
 * system this belongs in the component default.
 */
.vfl-scope .ws-content {
  z-index: 2;
}

```

## `src/ui/visualFidelityLab/matericPlate.css`

```css
/* ═══════════════════════════════════════════════════════════════════
   MatericPlate — layout ONLY.

   Tool law: CSS does layout & positioning; the MATERIAL (floor, texture,
   bevel, occlusion, rim) is rendered in SVG inside MatericPlate.tsx, reusing
   WanderlustSurfaceDefs. The earlier pure-CSS material version was retired —
   box-shadow on near-black is invisible. See fidelity-notes.md (Tool law).
   ═══════════════════════════════════════════════════════════════════ */

.mp-root {
  position: relative;
  border-radius: 9px;
  padding: 14px 16px;
  isolation: isolate;
}

/* The SVG material layer fills the box behind the content. */
.mp-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

/* Content rides on top of the material. */
.mp-content {
  position: relative;
  z-index: 1;
}

```

---

*Package generated from the RPG Balancer repository.*
