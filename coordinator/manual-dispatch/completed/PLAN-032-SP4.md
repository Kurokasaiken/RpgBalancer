# Manual Task: PLAN-032-SP4

## Title
BagStrip — consumabili visibili durante viaggio/beat — PLAN-032 SP-4

## Description
Implementare SP-4 di PLAN-032 secondo la spec vincolante
`plans/PLAN-032-SP-4-bag-strip.md` (artifact r004, sha256
`770bc22471ec887570bca0509c5828aa467ca945206039af144aa71e27ba3c82`).

Strip read-only dei consumabili packati durante gli stati non-decisione
(transit/pending, beat playback incl. replay finale). Il `ConsumableBelt`
interattivo resta l'unica bag UI ai nodi decisione (mutua esclusione
strutturale). Helper condivisi in `questBag.ts`: `questBagItems` (derivazione
unica strip+popover), `bagItemShortLabel` (equivalenza col inline del belt),
`bagEverPacked` (slot retention via `consumablesUsed`, mai mostrato),
`bagStripVisible` (predicato puro). Slot wrapper persistente in
`QuestRunWindow` con min-height = 1 riga chip da token skin.

## Constraints
- BagStrip presentational: role=list, chip role=listitem non focusabili,
  zero handler `on*`, ≥12px, solo token `--skin-*`, flex-nowrap+ellipsis.
- Nome accessibile composto via UN template i18n `bagStrip.chipName` con
  parentesi (mai em-dash — non deve collidere col `split('—')` del label).
  Qualifier: armed per kind=check && armed (stance bag-level, MAI per-item),
  held per kind=action, nessuno per passive.
- Wrapper `slotVisible = bagEverPacked(run) && !(run.ended && !presenting)`;
  empty-slot mantiene min-height, dead space senza chrome.
- Popover title-row invariato in comportamento, refactor solo su
  `questBagItems`.
- Belt MAI toccato. i18n `gameFrame.questWindow.bagStrip.*` en+it —
  **sintassi ICU `{var}`** (la spec indica `{{var}}`: sotto i18next-icu
  renderizza letterale — trap T-11, divergenza da documentare).
- STRICT_FILES guard + evidence log `test-results/PLAN-032-SP4-2026-10-14.log`.

## Acceptance
- Truth table predicato esaustiva (ended×presenting×waiting×bagEmpty);
  strip e belt mai co-render nello stesso render.
- Slot retention: empty-slot tiene la riga riservata, BeatStage top-y
  invariato decision↔presenting e a spend-to-empty.
- Derivazione identica a canonical filter; shorten equivalence su ogni
  label QUEST_STASH; spend lifecycle (choose/drinkPotion) rimuove da
  strip E popover; committed-state durante presenting (l'item consumato
  NON compare).
- a11y: nomi composti full-label+qualifier, container named, marker
  aria-hidden, zero em-dash.
- Headed T-04: BeatStage top-y stabile, no clip/overflow, min viewport,
  en+it; boundary import BagStrip ⊆ {questBag, QUEST_STASH, statIconUtils,
  i18n}.

## Timestamp
Dispatched 2026-10-14T16:30:00Z

## Executor
manual (Devin session)
