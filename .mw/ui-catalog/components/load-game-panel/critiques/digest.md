# Digest critiche — load-game-panel (round 1, 2/3 image-grounded, claude scope parziale)

Provider: chatgpt, claude, deepseek — run `20261025-critique-load-game-panel`
(+ run `20261025-critique-load-game-panel-r2` per il refill claude: il
binding del run originale era avvelenato su `claude.ai/new`), turn T-001,
prompt verbatim R-282, 5 shot al mattino (title-ctx-a, title-ctx-b,
title-iso-0, in-game-menu-ctx-a, in-game-menu-iso-0); refill con 4 shot
(in-game-menu-ctx-a/iso-0, title-ctx-a/iso-0).

**Provider failure dichiarati:**
- **chatgpt** — `ATTACH_FAILED` ("no upload affordance found", 132s);
  fallimento sistematico account Free. Vedi `chatgpt.md`.
- ~~**claude**~~ — RECUPERATO al refill (12:34 CET, run -r2, collect
  SUCCESS ~14.6k chars). Vedi `claude.md`.

**⚠ Scope misread (claude):** la risposta è image-grounded ma dichiara di
aver preso come componente «il cluster HUD in alto: tempo e velocità,
risorse, dock eventi» — NON il pannello Load Game («Load game, title e
card level-up li ho visti, e se vuoi li critico nel prossimo giro»).
La critica claude sotto è quindi pertinente a hud-top/hud-event-ledger;
per load-game-panel il grounding resta essenzialmente deepseek-only.

## Punti della critica sul componente (deepseek)

1. **Slot vuote indistinguibili** (difetto più grave) — «Le slot vuote
   hanno lo stesso peso visivo di quelle piene. L'utente deve leggere
   "empty" per capire che non può fare nulla.»
2. **Selezione/focus invisibile** — «non c'è un indicatore visivo forte
   (un bordo, un cambio di colore) che mostri quale slot è attualmente
   "attivo" o "selezionato"»; hover/focus/active mancanti ovunque.
3. **Pulsanti azione persi** — «"DELETE" e "LOAD" sono relegati in basso
   a destra, lontani dall'occhio, e il loro stato "disabilitato" è così
   tenue che sembrano parte del testo.»
4. **Main menu senza gerarchia** — «"CONTINUE" è isolato… "NEW GAME",
   "LOAD GAME" e "SETTINGS" hanno lo stesso peso visivo.»
5. **Incoerenza stilistica** — «Il logo è ricco, con bagliore dorato e
   medaglione. I pulsanti sono piatti… Sembrano appartenere a due giochi
   diversi.» (concorda con claude/title-screen: «logo bronzo scolpito vs
   capsule nere glossy "Web 2.0"».)

## Critica claude (scope: cluster HUD — riuso per hud-*)

Sintesi dei punti claude (verbatim completo in `claude.md`):
- P0: gerarchia invertita sul chip Food (autonomia "0 d left" sepolta in
  corpo minuscolo — «il dato da promuovere è l'autonomia, non lo stock»);
  tipografia 11-13px; allerta binaria solo-colore (nessuna escalation
  watch/critical/depleted, niente glifo); dock eventi centrale che
  «spreca lo spazio migliore per non dire nulla» (EVENTS 0, DUE/TYPE
  ambigui, X ambigua).
- P1: icone risorse che falliscono il test silhouette (tutte marrone-oro);
  layout shift dei chip (no tabular-nums); speed ×2/×4 <24px e pausa
  senza stato globale; medaglione-orologio ambiguo.
- P2: cornice del dock incoerente col design system; pulsanti d'angolo
  muti; nessuna UI-scale né modalità alto contrasto.
- Rimedi: `ResourceChip` (severity ok/watch/critical/depleted, runway
  prominente, barra cap, aria-label completa), `EventDock` pillola 36px
  con peek 4s all'arrivo, speed radiogroup con stato PAUSED, guardrail
  Playwright su soglie min font/target nel catalogo.

## Soluzioni proposte (deepseek, sul load-game panel)

- `btn-primary` dorato con glow per CONTINUE + `menu-group` secondarie.
- Slot vuote "morte" (`opacity: 0.4`, `cursor: not-allowed`, thumbnail
  a strisce); selezionata con bordo oro + `box-shadow` + `scale(1.02)`;
  azioni DELETE/LOAD contestuali; `:disabled` `opacity: 0.3` +
  `pointer-events: none`.
- Sistema di stati completo (hover/focus/active/disabled, 0.15–0.2s).
- Verdetto: «Iterare. Il layout è funzionale, ma il design è immaturo.»

## Quick-wins vs Structural

- Quick-wins (pannello): slot vuote desaturate/morte, bordo+glow su
  selezionata, DELETE/LOAD contestuali e disabilitati leggibili.
- Quick-wins (HUD, da claude): runway prominente nel chip Food, badge
  dock solo se >0, label parlanti DUE/TYPE, alert glyph oltre al colore.
- Structural: stati severity a 3 canali nei chip; dock a pillola;
  speed radiogroup con pausa visibile globale; guardrail catalogo su
  font<12px e target<24px.

## Note di grounding

- claude (-r2 T-001): fatti corretti sugli elementi HUD («2 /20»,
  «−6/d», «Nothing on the horizon», EVENTS 0, DUE/TYPE, ×1/×2/×4) —
  ma scope diverso dal componente nominato.
- deepseek (T-001): fatti corretti sul pannello; ha analizzato anche la
  title (contesto).
