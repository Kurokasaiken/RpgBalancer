---
title: 'PLAN-032 SP-1 — Scheda personaggio (hover → HudPlaque)'
status: completed
created: 2026-10-14
completed: 2026-10-14 — Devin; bundle `.mw/runs/plan032-sp1-2026-10-14/bundle.json`
  (4/4 PASS), evidence `test-results/PLAN-032-SP1-2026-10-14.log` +
  `hero-sheet-smoke-2026-10-14/` (headed Chromium, eye-check T-04)
parent: PLAN-032
debate: mw-web-debate `20261012-plan-032-sp1-hero-sheet` — artifact r003
  converged 3/3 eligible (claude, deepseek, gemini ACCEPT; chatgpt provider_dead)
artifact_sha256: d1f26a136baa88fcef740800a63bc9b72151ac36bb49d783acd9c709ee762ccf
depends_on: none
dispatch: 2026-10-14 — T-011 PLAN-034; executor manual (Devin session)
---

## Esito implementazione (2026-10-14)

Implementato come da spec: `heroSheetMachine.ts` (reducer puro
closed/intending/open), `useHeroSheet.tsx` (single transition owner, delega
rail rosterV2, reconcile post-commit senza arming da closed, Esc capture con
priorità DnD, anchor+clamp WCAG 2.4.11), `heroSheetViewModel.ts` (puro,
derivazione PgDetailCard), `HeroSheetPanel.tsx` (dumb renderer HudPlaque).
File in `src/ui/idleVillage/components/gameFrame/` — non in una dir dedicata
`heroSheet/` (la spec indicava quel path come suggerimento; la famiglia
gameFrame è il collocamento coerente col resto HUD). Config `heroSheet` Zod,
registry id `heroSheet` shortcut `p`, icone `cmd-chevron-left/right`+`cmd-pin`,
i18n `gameFrame.heroSheet.*` en+it-IT, menu Pannelli funzionante.

Safeguards: 17/17 unit nuovi, 26/26 adiacenti, build:check PASS, kanban:lint
PASS (lint quarantena idleVillage nota). Smoke headed: hover→open,
Esc→dismissedFor, retarget, grace close, pin/chevron, 0 console errors.

# SP-1 Artifact r003 — HeroSheetPanel spec (finale, assorbe R2)

## Component
`HeroSheetPanel` — `HudPlaque shape="panel"` singleton, draggable via
`useHudPanelDrag` sulla testata, `SkinScope` + `data-hud-controls` sul root,
X + pin toggle (`aria-pressed`, ≥24px) + chevron prev/next (`aria-label`,
≥24px) + voce menù Pannelli + shortcut (`useHudPanels`, id `heroSheet`).
**Read-only**: renderer dumb — unico data path `heroSheetViewModel` pura
(NIENTE hook dominio nel pannello → zero churn al retarget).

## State machine — reducer puro `heroSheetMachine.ts`
Stati: `closed | intending | open`. `open` porta
`{targetId, source:'hover'|'focus'|'sticky', pinned, dismissedFor}`.
Grace = **timer dentro open**, non stato. Un solo `clearTimers()` chiamato a
ogni transizione + cleanup unmount. Test vitest + fake timers su OGNI evento.

**Single transition owner**: `useHeroSheet` è l'unico path di transizione —
il registry `useHudPanels` invoca i suoi metodi (`open(target,source)`,
`close(reason)`, `toggle()`); il flag visibilità registry riflette lo stato,
mai lo guida. Niente sync bidirezionale via effect.

## Eventi in ingresso (delegati, file-level)
- rosterV2 rail container: `onPointerOver/Out` con **relatedTarget
  containment filter** (`if (card.contains(e.relatedTarget)) return`) +
  `onFocusIn/Out` → `onResidentPointer({id, via})` verso il reducer.
- `rosterReconciled{id}`: al cambio roster (sort/unmount dopo click-assign)
  → `elementFromPoint(lastPointerRef)` eseguito **dopo commit**
  (useLayoutEffect + 1 rAF). La riconciliazione aggiorna hoverCandidate o
  retargetta (dwell-gated) SOLO se open; **mai arma intent da
  closed/intending** — solo un pointermove reale arma.
- Registry/menù/shortcut → metodi del controller (source:'sticky').
- `lastPointerRef` su pointermove page-level (fonte rect-reconcile).

## Regole della macchina
- CLOSED: enter card → intent `hoverIntentMs` ~350ms → open `source:hover`.
  Focus-open SOLO se `target.matches(':focus-visible')` (keyboard/gamepad);
  `pointerdown` cancella intent pending (click-assign non apre).
- OPEN: enter altra card → retarget gated `retargetDwellMs` ~120ms; pointer
  sul pannello cancella retarget pendente.
- Grace timer `graceMs` ~400ms a leave di (card∪panel): re-enter stessa
  regione cancella; enter altra card → retarget; expiry → close.
- Drag residente: no aperture; se open → timer sospesi (NO pointer-events
  toggle); a dragEnd UNA reconcile rect-based decide arm/grace.
- Drag pannello: muove, NON pinna. Unpinned → posizione non persistita
  (re-anchor a ogni open); pinned → posizione sessione.
- PIN: toggle esplicito in testata. Pinned → hover aggiorna solo
  `lastViewedId`; chevron `[aria-disabled]`; Esc/X chiudono.
- **dismissedFor**: Esc setta `dismissedFor=targetId` — auto hover/focus sul
  QUEL target soppressi finché clearing edge: `pointerleave` della card,
  `focusout` della card, o rimozione target. Shortcut/menù (sticky) **bypassa
  sempre** il latch. Esc binding capture-phase su document;
  `dragActiveRef` letto al momento (cleared 1 microtask/rAF dopo dragEnd) o
  skip se `event.defaultPrevented`; priorità dnd > sheet > altri pannelli.
- `returnFocusRef` catturato all'apertura (null per sticky/empty → nessun
  focus move); fallback DOM se la card unmounted.
- Navigazione: chevron + `ArrowLeft/ArrowRight` (o PageUp/Down) quando focus
  in pannello o su card rail — layout-independent (`[`/`]` rotti su IT);
  keybindings in config. L'ordine nav = **ordine DOM renderizzato** del rail
  (rispetta filtri/sort), mai lo store grezzo. Su pinned: disabled.
- Validità target = presente nel roster: rimosso → close; morto ma listato →
  open con badge stato. Route change → close.

## Anchor & z-order
Anchor Y dalla card ALL'APERTURA; re-anchor se la rect dell'ancora esce da
una banda di tolleranza (scroll roster) o viola clamp. Clamp: rail-adjacent,
viewport, bounds che escludono rail + quest rail (niente cover della card
focused — WCAG 2.4.11). `DragOverlay` SEMPRE sopra la sheet (z-order in
config — dnd collision è geometrico, serve la gerarchia visiva).

## Config `heroSheet` (Zod, gameFrameConfig.ts)
`widthPx`, `railOffsetXPx`, `hoverIntentMs` ~350, `graceMs` ~400,
`retargetDwellMs` ~120, `anchorTolerancePx`, nav keys, z-order policy.

## A11y (WCAG 2.2 AA)
`role="region"` + aria-label (nome residente, aggiornato a ogni retarget);
`aria-describedby` card→sheet; live region polite: annuncia nome residente al
retarget (one-shot), badge debounced solo se targetId invariato; barre con
testo numerico; badge icona+testo; controlli ≥24px; reduced-motion → opacity.

## Telemetry
`hero_sheet_open{source,pinned}` solo closed→open; `hero_sheet_retarget`;
`hero_sheet_close{reason:esc|x|grace|target_removed|route|toggle}`.

## Verifica
Unit: reducer + timer su ogni evento (incl. rosterReconciled no-arm, Esc
capture, dismissedFor edges); RTL eventi delegati + relatedTarget filter;
E2E opzionale; occhio Director (T-04).

## Esito implementazione (2026-10-14, completato)
Implementato e verificato. Divergenze migliorative rispetto alla spec
(semantica invariata, superficie di modifica ridotta):
- **Delegazione eventi**: nessuna prop `onResidentPointer` dentro rosterV2 —
  `useHeroSheet` espone `railRef`/`railProps` applicati a un wrapper di
  pagina attorno allo slot roster (`game-frame-pixi.tsx`). rosterV2 e i kit
  congelati restano letteralmente zero-touch.
- **Reconcile**: `MutationObserver` sul rail wrapper + 1 rAF +
  `elementFromPoint(lastPointer)` (invece di un callback `onRosterReconcile`
  propagato nella chain). Mai arma da closed/intending.
- **Registry**: `useHudPanels` espone `interceptToggle(id)` — la voce menù/
  shortcut `p` instrada nella macchina; il flag di visibilità solo riflette.
- File in `components/gameFrame/` (non `components/heroSheet/`): coerenza con
  l'idioma HUD esistente. Shortcut scelta: `p`.
- Bundle: `.mw/runs/plan032-sp1-2026-10-14/bundle.json` (4/4 PASS);
  evidence `test-results/PLAN-032-SP1-2026-10-14.log`; eyeshot
  `test-results/plan-032-sp1-eyeshot.png`.
