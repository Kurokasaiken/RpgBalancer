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
      Il cluster è docked nella fascia superiore della mappa libera (mai overlay né flottante) e pubblica la propria
      occupazione reale in `useGameLayoutInsets.insets.top`: `topChrome.marginPx` più l'altezza di riga scalata (× fit ×
      frame.scale), 0 quando nascosto o smontato — la matematica della mappa libera lo sottrae sempre.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      Due elementi snelli disaccoppiati (day banner + resource bar, arte `bar-slim.webp` firmata): la resource bar è
      centrata sul centro orizzontale assoluto del frame (`frame.W / 2`, R-350) e il day banner siede al proprio dock
      sinistro `bannerDock = max(topChrome.bannerMarginPx, insets.left/scale + topChrome.marginPx)` (R-352 iter.6,
      ruling Director: «distanza tempo↔bordo sinistro», pick live 40px) — il banner respira al bordo sinistro, con
      almeno `gapPx` prima del bordo sinistro della barra; il bordo destro della barra non entra nella zona top-right
      riservata alla futura Chronicle docked (D10, niente tab pendente) finché il fit resta ≥ `topChrome.minFitScale`.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-3
    source: plan
    source_ref: PLAN-119
    statement: >-
      L'ornamento sole del day banner è il dial di fase seduto nell'emerald della slim bar: disco sole/luna
      (`sun.webp`/`moon.webp`) + corona di tick letta da `timeOfDay.dialSlim` in config (geometria misurata sull'arte
      schiacciata, colori e URL da config — mai hardcoded nel componente).
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-4
    source: plan
    source_ref: PLAN-119
    statement: >-
      Le due barre non scalano mai oltre 1 e si restringono solo per stare nei loro bound (bordo destro banner + `gapPx`
      a sinistra del bordo sinistro della barra; bordo destro della barra dentro la riserva Chronicle): sotto
      `topChrome.minFitScale` la riserva cede e i bound duri restano il bound sinistro e il bordo finestra (`frame.W -
      topChrome.marginPx`) — il chrome non esce mai dallo schermo e banner e barra non si sovrappongono mai finché il
      fit regge.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-5
    source: plan
    source_ref: PLAN-119
    statement: >-
      Le due superfici restano i slot firmati `data-hudslot="time"` e `data-hudslot="resources"` (il contratto selettori
      della suite e2e); la resource bar monta chip compatti per i suoi slot più stretti, un chip per item del readout.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-6
    source: director-spec
    source_ref: R-376
    statement: >-
      La resource bar è speculare da capo a capo PER ARTE NATIVA e scalata in proporzione al banner; dopo la correzione
      R-379 i capi riusano il terminale sobrio della barra Tempo (punta piccola oro/smeraldo, simmetrica a destra e
      sinistra) mentre il componente Tempo e il suo quadrante restano intatti. La slim art `bar-slim.webp` ha sedi capo
      simmetriche per costruzione e la barra renderizza scalata di `(capsulePx.time / capsulePx.resources) ×
      topChrome.resourcesBoost` — la capsula pareggia quella del banner (orpelli esclusi dalla misura) e il boost la
      ingrandisce fino a ~larghezza banner; il testo dei chip scala col boost e non scende mai sotto il px firmato.
      L'hack R-352 `resCapMirror` (fetta di coda flippata + clip interno + config `topChrome.resCapMirror`) è RITIRATO:
      nessun overlay, nessun clip, nessun shift dell'arte.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-7
    source: director-bug
    source_ref: R-380
    statement: >-
      Medaglione Tempo slim — GOLDEN REFERENCE battezzato dal Director 2026-11-25 («battezzo questo componente così
      com'è, questo è il golden reference per la UI»): assets gen3 rigenerati da Gemini vincolati ai battezzati
      (frame-v1 sha256 bb79a818, sun-v1 simmetrizzato sha256 e31f485e, moon battezzato 68569354; golden preservati in
      .mw/specs/hud-real/time/golden/). Iterazione gen4 (Director 2026-11-26, pick lacq-1 su contact sheet di 3):
      la gemma del frame è ripaint SMALTO LACCATO smeraldo (highlight speculari + ombre profonde, vincolata al
      ref crop dello smalto della barra) perché il teal sfaccettato gen3 non era in famiglia col verde laccato;
      pick finale lacq-2 (Director 2026-11-26, dopo confronto live: lacq-1 concentrava gli highlight sul bordo
      esterno e la corona visibile restava troppo scura rispetto allo smalto), sorgente gen4/lacq-2-0.png, keyed
      gen4/lacq-2-keyed.webp, asset produzione sha256 2909cea2 (golden gen3 invariato in golden/, prompt in
      time/prompt-frame-v4.txt); geometria invariata (edit ancorato sulla gen3) → nessun nuovo pick positioner
      necessario. Wash incasso a velo neutro minimo (well rgba(2,16,20,0.2), era 0.62 — alpha maggiori affogano
      la lacca nella corona visibile; mai tinte colorate: la finitura vive nel dipinto, l'alpha blending
      appiattisce il contrasto). (cx,cy) = centro della SEDE dipinta (28.6, 26.7) — il
      canvas del frame atterra sul pick Director (28.5, 26.9) via frame.offset (−0.1, +0.2); il disco riempie la
      sede a ~80% (disc 29.5), la corona sta sulle tacche incise dipinte (r 35.6, gap 1.2), il wash incasso resta
      dentro la fascia tacche (wellR 30.5). Sotto la luna la gemma si scurisce a navy (nightWash r 32, fadeMs).
      Cambiare questi numeri o gli asset richiede un nuovo pick Director nel positioner.
    test_refs:
      - tests/unit/idleVillage/r380TimeSun.test.tsx
  - id: game-top-chrome.INV-8
    source: director-spec
    source_ref: R-386
    statement: >-
      La riserva top-right ospita la barra Eventi speculare al Tempo (Director 2026-11-25: «speculare al componente
      tempo»; integralmente 2026-11-26: «fai quella parte integralmente», «devono puntare allo stesso oggetto proprio»):
      non esiste più un guscio Events forked/copiato. `HudRealEventsBar` consuma gli stessi layer riusabili
      `HudRealTimeShellLayers` e la stessa geometria `TIME_SLIM_BAR` del Tempo, mirrored geometricamente
      (`scaleX(-1)` solo sui layer dipinti; il contenuto live resta leggibile). Il Tempo usa l'asset slim pieno;
      Events usa `time/bar-slim-empty.webp`, variante baked dello stesso master in cui smalto/socket dipinti del
      Tempo sono fisicamente assenti e la fascia riceve l'interno donato dal vecchio Events — non una maschera
      runtime. A larghezze in cui la
      riserva vincola ancora il chrome il bordo destro della barra siede al margine simmetrico rispetto al medaglione
      Time e la scala è la stessa del banner, salvo narrowing della riserva; quando la riserva cede sotto
      `topChrome.minFitScale` la barra si nasconde invece di sovrapporsi alla resource bar centrata.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-9
    source: director-spec
    source_ref: R-386
    statement: >-
      La barra Eventi chiusa rappresenta l'evento più urgente, con i tipi pinned di
      `eventLedger.pinTypesWhenCollapsed` (threat) prioritari rispetto agli altri; le righe `arriving` restano nascoste
      finché la carta non completa il passaggio. Il contenuto live sta su una sola riga e il countdown compatto (`5d`)
      chiude la riga all'estremità prima della gemma; il tipo resta in aria/medaglione, non come seconda riga visiva.
      Il click sulla barra toggla il pannello Eventi esistente — nessuna seconda lista/modale.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-10
    source: director-spec
    source_ref: R-386
    statement: >-
      Semantica gemma (Director 2026-11-25: «la gemma rossa è x i pericoli, altri colori saranno x altro»): la sede
      circolare del medaglione condiviso contiene il gem-content Events (`events/gem-neutral.webp`, derivato dal
      medaglione Time e mai una copia del guscio); neutral/good restano nella famiglia verde, warning/danger ricolorano
      lo stesso contenuto verso ambra/rosso tramite filtri in config finché il Director non battezza asset dedicati.
      Il glifo del tipo vive dentro lo stesso medaglione semantico a destra, quindi il significato non è mai
      colour-only. I controlli dipinti del Tempo nella fascia centrale sono fisicamente assenti nell'asset baked
      (`build-time-shell-empty.py`), sostituiti dall'interno del vecchio Events prima di montare la lettura Events;
      non esiste un overlay/maschera runtime.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-11
    source: director-spec
    source_ref: R-386
    statement: >-
      Pannello aperto (Director 2026-11-26: «questo è il componente aperto», «deve essere montato in produzione.
      Quando clicco eventi chiuso voglio una animazione in cui la parte d sotto si allunga e diventa questo. E poi
      può anche diventare + lungo e mostrare ancora + righe»): il pannello aperto è l'arte registrata a slice
      (`panel-bodytop` + `panel-row` tiling + `panel-bottom`) montata in produzione su /game direttamente sotto la
      barra collapsed, che resta l'header visivo. Dopo l'adozione del guscio Time condiviso la slice art legacy 488px
      è scalata a `TIME_SLIM_BAR.w / EVENTS_PANEL_CONFIG.art.w` e doka a `dockTopPx` sotto il rail della shell, senza
      forkare la larghezza del collapsed bar. L'apertura è un reveal verticale ancorato in cima; l'altezza è
      funzione del numero di righe (più eventi = pannello più lungo), oltre `maxRows` le righe scrollano dentro.
      Le righe `arriving` restano nascoste; vuoto = una riga quieta con la lettura empty.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-12
    source: director-spec
    source_ref: R-386
    statement: >-
      I quattro slot circolari della fascia sotto l'header sono i filtri tipo: il primo è "all", gli altri tre i
      tipi del ledger a priorità più alta; lo slot attivo porta il glow verde e filtra le righe. Ogni riga mostra
      glifo del tipo nel medaglione (mai colour-only), titolo in ellipsis e countdown compatto prima del chevron;
      il click sulla riga inoltra l'evento al contratto di selezione dell'host (focus camera + chiusura).
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-13
    source: director-spec
    source_ref: R-391
    statement: >-
      Round-socket default (PLAN-136, Director 2026-11-26): i controlli rotondi del Tempo (pausa e velocità)
      montano il socket canonico Events `round-socket-events-v1` via `data-ctl="round"` sopra una barra
      control-neutral baked (`bar-controlless.webp` / `bar-slim-controlless.webp`). I vecchi socket rettangolari
      oro non restano visibili sotto il controllo; gli stati engaged/selected/paused restano effetti DOM
      (ring/glow/colore) e non una nuova famiglia raster.
    test_refs:
      - tests/unit/idleVillage/hudRealLegibility.test.tsx
---
# game-top-chrome

Top chrome docked di /game (R-339/PLAN-119 T6, artifact-r004 D3 + ruling
Director D10; R-350: resource bar centrata sul centro assoluto del frame,
con il day banner seduto a filo alla sua sinistra — una coppia adiacente):
slim day banner + resource bar + barra Eventi docked nella zona top-right
(R-386), occupancy pubblicata nel ledger `useGameLayoutInsets`. Solo
blueprint mode — phone/landscape mantengono il chrome firmato full-size.
Riutilizza `HudRealTime`/`HudRealResources` con geometrie e arte slim
generate; la barra Eventi vive in `HudRealEventsBar` come consumer mirrored
dello stesso guscio riusabile del Tempo (`HudRealTimeShellLayers`) — nessuna
superficie o shell duplicata; la variante empty è una derivazione baked dello
stesso master, non un componente o frame disegnato a parte.

## Emendamento R-391/PLAN-136 — round socket condiviso

Il tempo non è più un audit passivo: i socket rettangolari dipinti sono rimossi in varianti baked control-neutral e pausa/velocità montano `round-socket-normal.webp`. Questo allinea Tempo al controllo Events canonico senza cambiare meccanica, tasti o azioni store. Witness: `test-results/plan136-stash-round-sockets/witness-time-sole-after.png`.
