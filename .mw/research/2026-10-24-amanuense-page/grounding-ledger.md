# Grounding ledger — Amanuense Page debate (2026-10-24)

## Director rulings (fixed, not debatable)
- Page opens on the LEFT; skill-check astrolabe stays RIGHT wing. Both visible simultaneously (on capable viewports).
- Transient component: "read the long version" panel, not a persistent journal. Persistent info presented elsewhere.
- Aesthetic verbatim: "very beautiful, very loaded — like fairy-tale books in cartoons; complex letters with illustrations, illustrated borders, flourishes underneath, very baroque."
- Content cost accepted: long texts will be authored anyway ("a noi nn costa niente, tanto dobbiamo comunque scrivere quelle cose").

## Canonical project facts (repo-verified)
- QuestStageCluster (PLAN-043 WS-4, gameFrameConfig.questWindow.cluster): window `clamp(760px, 50vw, 1040px)`; CompanionLeft 280px (320 ≥1920), SkillCheckColumn 340px (420 ≥1920); gapPx 14, marginPx 16; `bothWingsBelowPx: 1440` — below 1440px the two existing wings are already mutually exclusive; companions default CLOSED. Window nominal shell ~820px.
- Short text today: `node.body` (authored Italian content, Zod `QuestNodeSchema`), `offer.dispatch` in planner, `phase.copy.narrative` in QuestChronicle.
- Lore infra exists: `LoreDrop` config (i18n `titleKey`/`bodyKey`, category, tags, assignable to quest/location/building/character/item) + `useQuestLoreDrop` + epilogue `lore` grants. Same page surface should render them.
- Scenario schema is strict Zod — a long-form block is a NEW schema field (fresh proposal, extends `questScenario.schema.ts`).
- Skin rule: visuals = preset in `skinConfigRegistry` (TS config modules returning token maps/palettes, consumed as `--skin-*` custom properties / inline styles). NO standalone .css file.
- Strings: authored content (Italian) for node text; i18n keys for LoreDrop/UI chrome. Locales: IT + EN.
- Rendering boundary: HUD/quest UI is DOM/CSS/SVG — NO Pixi inside the panel. Pixi is for the map/theatre layers.
- Established ink technique: SVG stroke-dasharray reveals exist in the project (MagicCircleHalo). Trap T-02: never `strokeLinecap="round"` on arcs that can be 0-length.
- Asset pipeline exists: `mockup-generator` skill, AI image import scripts (e.g. import-clouds.mjs), painted china+acquerello map tradition. Raster assets (PNG/WebP) are normal; lazy-load on first open acceptable.
- Public-domain asset sources identified in research: British Library illuminated manuscripts / medieval-cutouts collections; `adrian729/medieval-ornaments` npm package (PD cutouts + authored acanthus/ivy ornaments, gold rules, fleurons).
- Accessibility: prefers-reduced-motion must collapse reveal to instant (opacity fade ≤150ms acceptable). Semantic markup + aria-live on open; Esc to close.
- Foreground rule: any preview is headless or Devin Preview tab, never a foreground window.

## Orchestrator answers to T-001 clarifying questions
1. **Layout**: the page enters the LEFT envelope as a new peer element; below fit it may budget-share or swap with CompanionLeft (which defaults closed). Specify intrinsic min/preferred/max width + collapse rule; solver internals are the implementation plan's problem.
2. **Text shape**: fresh schema proposal — e.g. `longForm: { dropCap?, paragraphs[], rubric?, marginalia?, colophon? }`. Single folio that scrolls internally; not a paginated book.
3. **Historiated initials**: open question FOR the debate — constraints: reusable alphabet ×N motifs is heavy; per-scene AI generation fits existing pipeline; PD cutout set is cheapest. Debate decides.
4. **Assets**: raster AND svg both acceptable; lazy-load on first open.
5. **Fonts**: custom bundled fonts allowed (IT+EN only — ligature/hyphenation concerns are limited).
6. **Inline markup**: desirable — a minimal authored markup for rubrication (names/items/keywords in red or gold). Interactive spans/tooltips are nice-to-have, NOT required v1.
7. **Lore drops**: same page surface; a visual distinction (seal/category marker, variant border tint) is welcome — debatable.
8. **Skill check coexistence**: simultaneous (ruled). Page survives node change: cross-fade to the new node's long text if authored, else auto-close.
9. **Animation**: DOM/CSS/SVG only. Ink-writing reveal IS the signature moment (Pentiment-style), must be fast/skippable; reduced-motion → instant.
10. **Narrow viewport degrade**: overlay sheet acceptable below fit — coexistence is required at normal desktop widths.
11. **Readability floor**: agreed principle — prose column keeps readability floor; ALL density goes into borders, marginalia, initials, footer flourishes.
12. **Audio**: out of scope for v1.
13. **Schema**: fresh proposal, extends strict Zod schema.
14. **Styling mechanism**: skinConfigRegistry preset = TS module → `--skin-*` tokens + inline styles; ornaments as data-driven component slots.

## Open questions the debate must resolve
Q1 composition — how much "loaded" before readability collapses? Where exactly does density live?
Q2 historiated initials — asset path (PD set vs AI-generated vs hybrid).
Q3 reveal choreography — ink-writing: wow vs friction on repeat opens.
Q4 form — single scrolling folio vs page-turn vs accumulating column.
Q5 anchoring — separate left band vs CompanionLeft tab/swap (impacts cluster solver contract).
