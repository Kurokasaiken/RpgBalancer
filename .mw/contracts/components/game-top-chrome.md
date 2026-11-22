---
id: game-top-chrome
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/GameTopChrome.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/GameTopChrome.tsx
fast_checks:
  - tests/unit/idleVillage/r339TopChrome.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: game-top-chrome.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il cluster è docked nella fascia superiore della mappa libera (mai overlay né flottante) e pubblica
      la propria occupazione reale in `useGameLayoutInsets.insets.top`: `topChrome.marginPx` più l'altezza
      di riga scalata (× fit × frame.scale), 0 quando nascosto o smontato — la matematica della mappa
      libera lo sottrae sempre.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      Due elementi snelli disaccoppiati (day banner + resource bar, arte `bar-slim.webp` firmata):
      la resource bar è centrata sul centro orizzontale assoluto del frame (`frame.W / 2`, R-350) e
      il day banner siede al proprio dock sinistro `bannerDock = max(topChrome.bannerMarginPx,
      insets.left/scale + topChrome.marginPx)` (R-352 iter.6, ruling Director: «distanza tempo↔bordo
      sinistro», pick live 40px) — il banner respira al bordo sinistro, con almeno `gapPx` prima del
      bordo sinistro della barra; il bordo destro della barra non entra nella zona top-right
      riservata alla futura Chronicle docked (D10, niente tab pendente) finché il fit resta ≥
      `topChrome.minFitScale`.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-3
    source: plan
    source_ref: PLAN-119
    statement: >-
      L'ornamento sole del day banner è il dial di fase seduto nell'emerald della slim bar: disco
      sole/luna (`sun.webp`/`moon.webp`) + corona di tick letta da `timeOfDay.dialSlim` in config
      (geometria misurata sull'arte schiacciata, colori e URL da config — mai hardcoded nel componente).
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-4
    source: plan
    source_ref: PLAN-119
    statement: >-
      Le due barre non scalano mai oltre 1 e si restringono solo per stare nei loro bound (bordo
      destro banner + `gapPx` a sinistra del bordo sinistro della barra; bordo destro della barra
      dentro la riserva Chronicle): sotto `topChrome.minFitScale` la riserva cede e i bound duri
      restano il bound sinistro e il bordo finestra (`frame.W - topChrome.marginPx`) — il chrome
      non esce mai dallo schermo e banner e barra non si sovrappongono mai finché il fit regge.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-5
    source: plan
    source_ref: PLAN-119
    statement: >-
      Le due superfici restano i slot firmati `data-hudslot="time"` e `data-hudslot="resources"` (il
      contratto selettori della suite e2e); la resource bar monta chip compatti per i suoi slot più
      stretti, un chip per item del readout.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-6
    source: director-spec
    source_ref: R-376
    statement: >-
      La resource bar è speculare da capo a capo PER ARTE NATIVA e scalata in proporzione
      al banner (R-376, rulings Director 2026-11-21 — mockup stadium: capi a punta
      foglia-oro con smeraldi su entrambe le estremità, niente medaglione/pendente;
      R-376-bis «troppo piccolo in proporzione al componente tempo» → «ingradiscilo in
      proporzione»): la slim art rigenerata `bar-slim.webp` ha sedi capo simmetriche per
      costruzione e la barra renderizza scalata di `(capsulePx.time /
      capsulePx.resources) × topChrome.resourcesBoost` — la capsula pareggia quella del
      banner (orpelli esclusi dalla misura) e il boost la ingrandisce fino a ~larghezza
      banner; il testo dei chip scala col boost e non scende mai sotto il px firmato.
      L'hack R-352 `resCapMirror` (fetta di coda flippata + clip interno + config
      `topChrome.resCapMirror`) è RITIRATO: nessun overlay, nessun clip, nessun shift
      dell'arte.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
---
# game-top-chrome

Top chrome docked di /game (R-339/PLAN-119 T6, artifact-r004 D3 + ruling
Director D10; R-350: resource bar centrata sul centro assoluto del frame,
con il day banner seduto a filo alla sua sinistra — una coppia adiacente):
slim day banner + resource bar, zona top-right riservata alla futura
Chronicle, occupancy pubblicata nel ledger `useGameLayoutInsets`. Solo
blueprint mode — phone/landscape mantengono il chrome firmato full-size.
Riutilizza `HudRealTime`/`HudRealResources` con geometrie e arte slim
generate (PLAN-112 F4) — nessuna superficie duplicata.
