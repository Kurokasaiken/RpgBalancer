# Amanuense Page — design spec r003 (post WITNESS-01 amendment)

Transient side component: the long, illuminated version of a quest node's text
+ lore-drop surface. LEFT of the quest window; astrolabe stays RIGHT (Director
ruling). Baroque fairy-tale book page — Earle/Sleeping Beauty register:
late-Gothic/early-Renaissance humanist, round, warm, painted. NOT gothic
revival, NOT german incunabula.

## 1. Layout contract — left-wing-slot swap, no solver surgery

- `LeftWingSlot` occupant `'amanuense'` beside `'companion'` — peer of
  CompanionLeft, not a third band. Same solved-rect semantics.
- **Page open = a mode**: the companion's edge tab stays visible but is
  INERT while the page is open (tooltip "chiudi la pagina per vedere i
  compagni"). A reading act is never interrupted by a nav affordance.
- `wasOpen` flag stashed at open: on manual close, CompanionLeft returns
  to its prior scroll/selection state (transient must not destroy
  companion context). On node-change auto-fold NO restore fires — the
  slot stays empty until the player acts.
- Window floor stays **760 — untouched**. Coexistence (page + window +
  astrolabe) starts at **vw ≥ 1480** (claude's amendment, sustained by
  3/4 over gemini's floor-drop): below, the overlay sheet applies.
  Widths: 320 @1480 · 360 @1520 · 400 @1600 · 460 cap @≥1920.
- Degrade: overlay sheet `min(92vw, 480px)` over the window's left;
  astrolabe reachable via existing exclusive-wing toggle.
- Height: fills cluster height; frame fixed, text scrolls inside.

## 2. Typography — humanist register (deepseek W1, adopted)

| Role | Face (OFL, bundled, IT+EN) | Size |
|---|---|---|
| body prose | EB Garamond | 17px/1.55, floor 16, `hyphens:auto` |
| incipit (1 line) | humanist display small-caps — **Almendra SC or Cormorant SC** rubricated (verify OFL + IT coverage in plan; MedievalSharp fallback) | 24px |
| paragraph initials | painted Lombardic SVG (round, vermilion/ultramarine alternating) | 2 lines |
| inline gloss notes | EB Garamond Italic, vermilion, full opacity | 14px |
| lore variant body | IM Fell English — VERIFY IT glyph coverage; fallback EB Garamond Italic | 16.5px |
| colophon / folio marker | EB Garamond small caps | 13 |

**Blackletter (UnifrakturMaguntia) and Insular uncial are BANNED from
scene pages** — wrong century/register (gothic revival ≠ fairy-tale).
Blackletter survives only as optional lore variant "older hand".

Palette: parchment `#F1E3C0` · ink `#2A1D12` · vermilion `#9E1B14`
(~7:1) · ultramarine `#1F3A7A`. **Gold is never text** — ornament only.

Rubrication markup: `{r|…}` vermilion span · `{m|…}` gloss pointer
(manicule ☞) · `{g|…}` renders ink text with **gilt underline rule**
(gold as ornament — fixes claude's contradiction catch). 20-line
tokenizer, Zod refinement rejects unbalanced braces (render raw +
telemetry on violation; tokens ride inside i18n strings like `<Trans>`
markup, translator-visible). No nesting.

Conventions: pilcrow ¶ red for paragraph breaks; folio marker
top-right (`fol. iiij r`, decorative, run-counted).

## 3. Border / ornament — composed frame, density by invariant

- 4 corner pieces (SVG ~6KB) overlapping strip ends; vertical vine tile
  (240px, tile-Y) + top/bottom edge strips; headpiece 72px / tailpiece
  56px; inner hairline gold rule inset 8px (historical written-area
  boundary). Never 9-slice.
- **Density lever = reading-rect invariant, NOT a % cap** (deepseek D,
  adopted): prose rect ≥48ch @≥1920 / ≥40ch @1480–1700, flat parchment
  ΔL≤3%. The gutter absorbs ALL surplus → tier-3 on wide viewports can
  be far richer than 45% ("molto carico" honored where there's room).
- Layers: L1 frame+corners · L2 headpiece+initial · L3 gutter vine +
  1–3 drolleries (snail/hare/goblin — Earle-fairy-tale, NOT Gothic
  grotesque; kept — the right authenticity signal) · L4 tailpiece.
- Tiers 1–3: tier drops automatically when the invariant is violated.
- Perf: no filter/backdrop-filter on panel; ≤24 ornament nodes; frame
  ≤350KB; will-change during reveal only; two-wave lazy load; total
  tier-3 ≤700KB.

## 4. Historiated initials — bespoke is the DEFAULT (round-2 flip)

- **Default for authored scene nodes: bespoke per-scene painted
  initial** (AI pipeline, content cost already accepted). The
  illustration IS the letter — content-bearing, per Director verbatim.
  Production: painted vignette composited inside a letterform
  clip-path of a base alphabet SVG (deepseek's mask — letter reads
  even if art is busy), 256² native → 3-line height.
- **12-motif plate library (claude's panel-initial) = fallback +
  tier-1 + lore pages**, NOT the flagship: vector Lombardic letter over
  painted plate; cheap breakers — 3 crop windows per motif, mirroring,
  vine/foliage breaking out of the plate edge over the frame, letter
  stem overlapping the border.
- Missing motif → PD acanthus cutout; missing asset → vine-only
  initial. Never blocks a page. First authored quest = bespoke so the
  Director's first impression isn't stock.

## 5. Reveal — one-shot ceremony then frictionless

- First open per page per session: ≤1.8s choreography (frame strokes
  ~600ms, initial outline→fill ~300ms overlap, prose stagger 60ms/¶
  cap 4, gloss last). Any input snaps to final state.
- Repeat opens: 200ms opacity fade (session Set — transient).
- Reduced-motion: instant ≤150ms.
- Ink-drawing masks ONLY on frame/initial/head flourish; body uses
  clip-path wipe or fade — no stroke-dasharray over prose (gemini's
  WebView GPU constraint).

## 6. Form — single scrolling folio; catchword REMOVED

Single folio, internal overflow-y, thin brass scrollbar, parchment
pinned to container. **Catchword dropped** (deepseek W2: a catchword
is next-page-of-same-work codicology — incoherent with single-scroll
and fake as a teaser). Replaced by:
- rubricated **explicit** («Explicit capitulum…») at text end;
- true **colophon** — scribe's statement: name/place/date (+optional
  complaint), authored per node: `{scribeKey, placeKey?, dateKey?}`.
Next-node hooks belong to the short-text surface, not the manuscript.

## 7. Marginalia as apparatus (deepseek W3, adopted)

Three real scribal functions, not sprinkled decoration:
- `gloss` — anchors to `{afterParagraph, lemma?}`: lemma = substring
  ref into that paragraph's text → rendered as an inline note block
  after the paragraph (manicule ☞ + italic vermilion, FULL opacity —
  claude's fix; the 34px gutter can't hold a gloss) with a fine
  leader-line to the lemma.
- `nota` — red manicule / "NB" marker flagging a passage.
- `drollery` — pure ornament, gutter SVG only (snail/hare/goblin).

## 8. Lore variant

Same component, `variant:'lore'`: lighter foxed parchment, torn top
edge, IM Fell "another hand" (or Lombardic-blackletter if an older
register is wanted — deepseek's reservation), wax seal with category
emblem, Lombardic initial sans plate, tier→rarity. Lore MAY auto-open
(no other surface); scene pages never auto-open — quill-pulse once
when the node has unread long-form.

## 9. Schema sketch

```ts
longForm: z.object({
  variant: z.enum(['scene','lore']).default('scene'),
  tier: z.union([z.literal(1),z.literal(2),z.literal(3)]).default(2),
  motif: MotifId.optional(),               // plate-library fallback
  bespokeInitialId: z.string().optional(), // authored per-scene art
  incipitKey: i18nKey.optional(),
  paragraphKeys: z.array(i18nKey).min(1).max(8),
  marginalia: z.array(z.object({
    afterParagraph: z.number().int(),
    kind: z.enum(['gloss','nota','drollery']),
    lemma: z.string().optional(),          // substring into that ¶
    textKey: i18nKey.optional(), drolleryId: z.string().optional()
  })).max(6).default([]),
  colophon: z.object({
    scribeKey: i18nKey, placeKey: i18nKey.optional(),
    dateKey: i18nKey.optional(), complaintKey: i18nKey.optional()
  }).optional(),
  explicitKey: i18nKey.optional(),
}).strict()
```
Validator caps prose ~220 words/page; letter derived from localized
first char.

## 10. Interaction & a11y (claude's catch-list, adopted)

- `<aside role="complementary" aria-labelledby>`; scroll region
  `tabindex="0" role="region" aria-label`. NO aria-live dump of 150+
  words.
- Focus moves to incipit ONLY on player-initiated open. Lore
  auto-open: polite status announce ("Frammento scoperto: <title>"),
  no focus move.
- Esc closes only when focus is inside the page or it is the topmost
  transient layer — reuse the existing overlayStack convention
  (verify in plan).
- Node change: longForm present → cross-fade 240ms, focus pinned to
  heading, scroll reset to top. Absent → fold 200ms (no companion
  restore — §1).
- **Close control always visible**: wax-seal button inside the frame's
  top-right corner — 44px hit area / 24px visual, i18n aria-label, in
  EVERY mode (wing and sheet — the sheet otherwise covers the quill
  opener and traps non-keyboard players, WITNESS-01). Esc and the
  quill-button toggle remain secondary routes; close returns focus to
  the opener.
- Skill check never closes nor dims the page.

## 11. Skin preset

`skinConfigRegistry.amanuense` TS module → `--skin-amanuense-*`:
widths{min,slack,max,gutter} · palette · fonts{body,incipit,lombardic,
lore} · type · frame{corners,edgeTile,head/tailpiece per tier} ·
initial{plate sizes, motif registry, bespoke registry} ·
motion{ceremonyMs,repeatMs,reducedMs} · tiers{1,2,3} ·
invariants{measureCh, textureDeltaL}. No standalone .css.

## Resolved residuals (round-2 dispositions)
- A: hold 760, coexistence ≥1480, sheet below — 3/4 sustained.
- B: bespoke-per-scene is default; plate library = fallback/tier-1/
  lore — adopted with claude's breakers.
- C: inert-tab swap + wasOpen restore + no auto-fold restore — adopted.
- D: reading-rect invariant replaces % cap — adopted.
- E: chatgpt removed (temporary-chat URL bug, documented).
- Gemini W1: IM Fell → verify/fallback; Unifraktur → banned (W1
  deepseek converged). Markup → tokens + Zod guard.
- Deepseek W1/W2/W3: adopted (typography register, explicit+colophon,
  gloss apparatus).
- Claude catch-list: {g|} underline, inline gloss blocks, a11y —
  adopted.
- WITNESS-01 (claude, T-004): wax-seal close control added in all
  modes — sustained, amended in r003.
