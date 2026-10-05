# Destiny Astrolabe — Authority Resolution

**Component ID:** `destiny-astrolabe`
**Target route:** `/minimal-destiny-astrolabe` → `src/pages/minimal-destiny-astrolabe.tsx`
**Canonical component:** `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx`
**Kit re-export:** `src/ui/idleVillage/frozen/kits/destinyAstrolabeKit.tsx`
**Desiderata FROZEN:** `.mw/desiderata.md` v5 (mockup → React protocol), v6 (paintover consentito), v3/v4 (POI Quest skill check)

---

## What is authoritative for visual intent?

The current live component and the `/minimal-destiny-astrolabe` route. The mockup to be produced will override this intent once selected.

## What is authoritative for art direction?

`src/docs/docs/plans/art_direction_plan.md` — DNA Prismatic Wanderlust v0.10. Key rules for the astrolabe:
- **Pillars:** Wilderness (rude beauty, timber, golden thatch, azure) and Empire (Solar Triumph, basalt, Baroque Sun-Bronze, indigo).
- **Palette:** no grey/brown shadows; deep cool teal; gold highlights (#c9a227, #e4b048, #fce890); ivory text (#f0efe4); obsidian backgrounds.
- **Materials:** Baroque Sun-Bronze for the frame, obsidian for the field, crystal/glass for overlays.
- **Kill list:** no grim, no mud, no sci-fi, no flat design, no symmetry.

`src/docs/docs/visual_design_philosophy.md` — 8-12 overlapping layers, `feTurbulence` organic imperfections, 6-8 stop gradients, subtle breathing/flicker/pulse animations.

## What is authoritative for code?

- Project invariants (`00-project-invariants.md`): config-first, i18n, component reuse, no standalone `.css` files for new themes.
- Skin system: new presets must live in `skinConfigRegistry`; reuse primitives in `src/ui/idleVillage/skins/primitives/`.
- Persistence: `PersistenceService` for any save/load.
- Frozen kit contract: `destinyAstrolabeKit.md` (`candidate` status).

## Candidate components for reuse

- `SlottedMedal` / `WanderlustMedalOverlay` for the bronze/crystal material language.
- `ActionHalo` / `PoiSkinAware` for glow and pulse patterns.
- `DayNightPOI` for the day/night color shift.
- `QuestChronicle` / `FloatingPanel` for the quest-card integration surface.

## What may not be invented?

- New gameplay values (thresholds, timings, risk percentages) must come from existing or new config modules, not the mockup.
- New text strings must go through i18n; the mockup may contain baked text, but the final component cannot ship it.
- New creatures, IP, or lore must go through the Creature IP lifecycle (`art-direction/creatures/`).
- Paintover and generated raster are permitted per desiderata v6, but only for elements that cannot be reproduced in CSS/SVG.

## Non-invention statement

The mockup may suggest frame shape, material treatment, lighting, and layering. The final component will preserve the existing physics engine, verdict logic, and skill-check contract. Any element not in the selected mockup will be added only if it is (a) reproducible in CSS/SVG, (b) supported by the art direction docs, or (c) a generated/painted asset strictly necessary for the visual intent.
