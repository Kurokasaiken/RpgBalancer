# Amanuense Page — design spec r001 (orchestrator synthesis)

Transient side component: the long, illuminated version of a quest node's text
+ the surface for lore drops. LEFT of the quest window; skill-check astrolabe
stays RIGHT (Director ruling). Baroque fairy-tale book page (Earle/Disney
storybook register), readable prose at the center.

## 1. Layout contract (Q5 resolved: swap, not third band)

The page occupies the **left envelope as a peer occupant of the left wing
slot** — it does NOT add a third band:

- `LeftWingSlot` gains occupant `'amanuense'` beside `'companion'` — same
  solved-rect semantics as CompanionLeft (claude's formulation, the
  contract-cleanest of the four).
- Last-opener-wins swap: opening the page stashes CompanionLeft to its
  folded icon tab; closing restores it. A 24px edge tab lets the player
  flip occupants without closing.
- Width: **min 320 / preferred = slack / max 460**,
  `slack = vw − (2·margin + 2·gap + window + skillCheckColumn)`.
  ≈320 @1440 · ≈400 @1600 · 460 @≥1920.
- **Contested residual A** — at 1440 the arithmetic gives exactly 280px
  (margins 32 + window 760 + gaps 28 + right 340). Resolution taken in
  r001: while the page is open the window floor may drop 760→720 so the
  page keeps its 320 floor. Flagged for the plan as a solver ask
  (claude), alternative = 1440–1519 band degrades to sheet early.
- Below ~1440 / whenever coexistence is impossible: **overlay sheet**
  (`min(92vw, 480px)`) over the left of the window; astrolabe stays
  reachable via the existing exclusive-wing toggle.
- Height: fills the cluster height; frame fixed, text scrolls inside
  (never a stretching 9-slice on the frame — ornaments would deform).

## 2. Typography

| Role | Face (OFL, bundled, IT+EN) | Size |
|---|---|---|
| body prose | EB Garamond | 17px/1.55, floor 16, `hyphens:auto` per lang |
| incipit (1 line only) | UnifrakturMaguntia | 24px — never in body |
| paragraph initials (Lombardic, alternating vermilion/ultramarine) | Uncial Antiqua | 2 lines |
| marginalia / gloss | EB Garamond Italic | 13.5–14px, rubric colour, 0.8 alpha + 2px parchment halo |
| lore variant body ("another hand") | IM Fell English | 16.5px — check Italian quotes/coverage before lock |
| colophon/catchword/folio marker | EB Garamond small caps | 13 |

Palette: parchment `#F1E3C0`, ink `#2A1D12` (iron-gall), vermilion
`#9E1B14` (~7:1 on parchment), ultramarine `#1F3A7A`. **Gold is never
text** (fails contrast) — gold lives only in ornament.

Rubrication markup — two authored tokens only: `{r|…}` vermilion,
`{g|…}` gold span; optional `{m|…}` → gloss pointer with manicule ☞ in
the margin. 20-line tokenizer + Zod refinement rejecting unbalanced
braces. No nesting. i18n keys carry tokens intact.

Near-free authentic conventions (adopted): pilcrow ¶ in red instead of
first-line indent; folio marker top-right in roman numerals (`fol. iiij
r`, decorative, counted within the run); catchword at scroll end =
first words of the next node's long-form, else centered colophon.

## 3. Border / ornament system

**Composed frame — never 9-slice** (9-slice stretches vine rhythm;
claude+deepseek vs grok, sustained):
- 4 corner pieces (SVG, ~6KB each), overlapping strip ends;
- vertical vine tile (SVG, 240px tile on Y) + top/bottom edge strips;
- headpiece 72px / tailpiece 56px; inner hairline gold rule inset 8px
  (the historical "written area" boundary).

**Density budget (Q1 resolved):** ornament share ≤45% of the panel;
the prose rect is flat parchment (texture ΔL≤3%) with measure 42–56ch.
Layers: L1 frame+corners · L2 headpiece+initial · L3 gutter vine +
1–3 drolleries (snail/hare/goblin peeking — Earle-fairy-tale, NOT
Gothic grotesque) · L4 tailpiece+colophon.
**Richness tiers 1–3** drive how many of L2–L4 exist; tier drops
automatically when ornament>45% or measure<40ch.

Perf guards: no `filter`/`backdrop-filter` on the panel, ≤24 ornament
nodes, frame assets ≤350KB, `will-change` only during reveal, lazy
load in two waves (critical frame+letter → plates/drolleries).
Total tier-3 target ≤700KB.

## 4. Historiated initials (Q2 resolved: panel-initial hybrid)

claude's formulation, adopted: **vector letter over painted plate** —
- Letter: outlined Uncial SVG glyph, gold-gradient + dark outline
  (26 letters, IT/EN-safe, one-time cost).
- Plate: painted raster vignette behind the letter (Romanesque
  "panel initial"), 88px² @1440+, 112px² @≥1920, 2×WebP ~30KB, from a
  **12-motif reusable library** (goblin, forest, sea, road, castle,
  tavern, night, grave, crown, dragon, ship, bridge) — one batch
  through the existing AI scene pipeline; letter×motif is NOT a
  cartesian product.
- Vine growth SVG springing from the letter stem, shared, animated.
- Fallbacks: missing motif → PD acanthus cutout initial; missing asset
  → vine-only initial (tier 1). Never blocks a page.
- Tier-3 hero scenes may get a bespoke per-scene vignette later
  (deepseek's per-scene path reserved for heroes).

## 5. Reveal (Q3 resolved: one-shot ceremony, then frictionless)

- First open of a given page per session: full choreography ≤1.8s —
  frame strokes draw (stroke-dashoffset ~600ms gold), initial outline →
  fill (~300ms overlap), prose stagger (~60ms/paragraph, cap 4),
  marginalia last. Any input snaps to final state.
- Subsequent opens of the same page: 200ms opacity fade (tracked in a
  session Set — transient semantics).
- Reduced-motion: always instant (opacity ≤150ms).
- Gemini's perf constraint adopted: ink-drawing masks only on
  frame/initial/head flourish; body text uses clip-path wipe or fade —
  no stroke-dasharray over long prose (GPU paint spikes on WebView).

## 6. Form (Q4 resolved: single scrolling folio)

Unanimous: single vertical folio (rotulus), internal overflow-y with
thin brass scrollbar; parchment texture pinned to container. No
page-turn (interaction cost + fragments the metaphor), no accumulating
column (violates transience). Catchword/colophon terminates the scroll
diegetically.

## 7. Lore variant

Same component, `variant:'lore'`: lighter foxed parchment, torn top
edge (clip-path), IM Fell body ("another hand"), wax seal at tail with
category emblem, Lombardic initial without plate, tier maps to rarity.
Lore drops MAY auto-open (they have no other surface); scene pages
never auto-open — button shows a quill-pulse once when the current
node has unread long-form.

## 8. Schema sketch (new strict-Zod field on quest node)

```ts
longForm: z.object({
  variant: z.enum(['scene','lore']).default('scene'),
  tier: z.union([z.literal(1),z.literal(2),z.literal(3)]).default(2),
  motif: MotifId.optional(),              // omit => vine-only initial
  incipitKey: i18nKey.optional(),         // blackletter single line
  paragraphKeys: z.array(i18nKey).min(1).max(8),
  marginalia: z.array(z.object({
    afterParagraph: z.number().int(),
    kind: z.enum(['gloss','manicule','drollery']),
    textKey: i18nKey.optional(), drolleryId: z.string().optional()
  })).max(4).default([]),
  colophonKey: i18nKey.optional(),
  catchwordKey: i18nKey.optional(),
}).strict()
```
Validator caps total prose ~220 words/page. Letter derived from the
localized first character (gemini's i18n-safe note).

## 9. Interaction & a11y

- Open: quill button near `node.body`/short text; enabled only when
  `longForm` exists. Esc or button closes (focus returns to button).
- `<aside role="complementary" aria-labelledby>` — NOT aria-live
  announcing 150+ words (claude's correction, adopted); focus moves to
  incipit. No focus trap — the astrolabe must stay operable.
- Node change: longForm present → cross-fade 240ms (short reveal);
  absent → fold closed 200ms. Skill check never closes nor dims it.

## 10. Skin preset shape

`skinConfigRegistry.amanuense` TS module → `--skin-amanuense-*` tokens:
widths{min,slack,max,gutter} · palette · fonts{body,incipit,uncial,lore}
· type sizes · frame{corners,edgeTile,head/tailpiece per tier} ·
initial{plate sizes, motif registry} · motion{inkMsMax, ceremonyMs,
reducedMs} · tiers{1,2,3 layer lists}. Reduced-motion overrides
reveal tokens. No standalone .css.

## Contested residuals for round 2
- A: window floor 760→720 while page open — solver ask vs earlier sheet degrade at 1440–1519.
- B: is the panel-initial "historiated enough" vs Director's "lettere complesse con illustrazioni" — or must hero scenes default to bespoke art?
- C: swap-with-tab (r001) vs deepseek's priority-collapse rule — does CompanionLeft deserve a restore guarantee?
- D: 45% ornament cap vs "molto carico" — is the cap right, or should tier 3 exceed it on wide viewports?
- E: `local-chatgpt:` provider removed (temporary-chat URLs); electorate = claude, gemini, grok, deepseek.
