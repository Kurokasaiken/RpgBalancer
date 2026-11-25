---
id: hud-real-cassetto-v2
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/hudReal/HudRealCassettoV2.tsx
scope_files:
  - src/ui/idleVillage/hudReal/HudRealCassettoV2.tsx
  - src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx
  - src/ui/idleVillage/hudReal/HudRealCassettoHost.tsx
fast_checks:
  - tests/unit/idleVillage/r374CassettoV2.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: cassetto-v2-mounted
    source: director-spec
    source_ref: R-374 (Director 2026-11-21)
    statement: >-
      La superficie montata è `HudRealCassettoV2` (via `ExpeditionDrawer`); `HudRealCassetto.tsx` V1 è una baseline
      FROZEN (hud_real_cassetto_trusted.md) — non si modifica in place, resta importabile per spec/test.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-cta-panel-centre
    source: director-spec
    source_ref: R-374 F2 (audit 2026-11-21); amended OB-7 app-2 (Director 2026-11-21)
    statement: >-
      Il CTA CONFIRM è centrato sull'asse della card smaltata PERCEPITA (`CTA_CENTER_U = 560` — il campo visibile inizia
      ~u120 dove finisce il fade-in) — lo stesso asse su cui è centrata la colonna contenuto (padL u148 / padR u52),
      così pozzi e CTA non derivano. Amend OB-7 app-2: «componenti troppo vicini al frame a sinistra, spazio vuoto a
      destra» — l'asse u530 (card geometrica u36..1024) leggeva spostato a sx.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-well-clearance
    source: director-spec
    source_ref: R-374 F1; pads amended OB-7 app-2 (Director 2026-11-21)
    statement: >-
      I contenuti dei pozzi (party, supplies, journey, risk/reward) hanno clearance reale dalla fascia della cornice
      dipinta (padding top/bottom ≥ ~u28–44), mai appoggiati alla filettatura; e le cornici interne non toccano la
      cornice esterna della colonna (padL u148 oltre il bordo rotaia ~u101, padR u52; journey pill inset u56).
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-frame-grammar
    source: director-spec
    source_ref: R-374 F3
    statement: >-
      Tutti i pozzi usano la stessa grammatica di cornice dipinta (`paintedBoxFrame`) — nessun bordo manuale arrotondato
      che legga come un altro componente.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-cqw-geometry
    source: director-spec
    source_ref: R-374 F5
    statement: >-
      La geometria interna della colonna scala in `cqw` (seat columns/gap, icone journey) — niente px fissi o `zoom`
      (non supportato su Firefox) dentro una superficie `containerType: inline-size`.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-overflow-fade
    source: director-spec
    source_ref: R-374 F6
    statement: >-
      Lo scroller party mostra un lembo del quarto seat e sfuma ai bordi (fade-mask + peek): l'overflow è leggibile
      senza pulsanti freccia.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-object-glyphs
    source: director-spec
    source_ref: R-374 rev2 (Director 2026-11-21 «gli slot x i consumables dovevano essere dei +»)
    statement: >-
      La nicchia supplies vuota mostra il segno «+» (affordance `cassetto-supplies-band`); il glifo pouch proposto in
      audit è stato revertito per ruling Director.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-no-dead-api
    source: plan
    source_ref: R-374
    statement: '`CassettoQuest.subtitle` è rimosso: era popolato dai producer ma mai renderizzato (il mockup non lo prevede).'
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-reward-visible
    source: director-spec
    source_ref: OB-7 app-5 + ruling rivisto (Director 2026-11-21, charter cassetto R-375); amended R-378 (Director 2026-11-24)
    statement: >-
      I pozzi risk/reward NON portano le label testuali RISK/REWARD; la % sta SOPRA la scala di emblemi lit/dimmed e
      allineata tra i due pozzi; il reward concreto (icone+qty) è VISIBILE sotto la % di vittoria — in vista prima
      dell'impegno (Pillar 4), il tooltip porta il dettaglio. Amend R-378 (Director 2026-11-24 «elimina i 5 forzieri
      speculari ai 5 teschi (i teschi rimangono)»): la scala di forzieri è rimossa — solo il risk conserva i teschi
      lit/dimmed; `rewardLevel` resta nel modello come dato di tier ma non è più dipinto.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-cta-jewels
    source: director-spec
    source_ref: R-378 (Director 2026-11-24 «quando è completo si illuminano i gioielli»)
    statement: >-
      Quando `canSend` è vero i tre smeraldi dipinti della placca CTA si accendono con un pulse animato
      (`data-testid="cassetto-cta-jewels"`, glow in screen blend sui centri misurati della placca) — l'affordance «ora
      cliccabile»; a `canSend` falso non si monta nulla. Rispetta prefers-reduced-motion.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-journey-glyphs
    source: director-spec
    source_ref: >-
      R-378 rev3 (Director 2026-11-24 «le icone del viaggio sono brutte, guarda il mockup» —
      mockup-cassetto-goblin-v3.webp)
    statement: >-
      Le tre gambe del viaggio portano i glifi incisi del mockup v3 come ASSET DIPINTI, non SVG piatti:
      `journey-ico-outbound.webp` (marcia — rosa dei venti), `journey-ico-atsite.webp` (campo — spade
      incrociate), `journey-ico-return.webp` (ritorno — frecce circolari), emessi dalla spec slice
      `cassetto.json` dalla sheet Gemini `.mw/specs/expedition-ui/refs/icon-journey-glyphs.png`, regradati
      `goldHue` sullo champagne delle label (stesso colore delle scritte, rev4). Icona sopra la label,
      più grande della scritta, senza toccare il bordo della pillola.
      Niente glifi flat `ico-*`/`EngravedIcon` sulle gambe.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-seats-autofit
    source: director-bug
    source_ref: R-378
    statement: >-
      slot PG ancora troppo grandi (64px fissi): toccano il frame del well, troppo vicini tra loro, spazio morto ai lati
      — geometria auto-proporzionata al well (window=interno, seat derivata, gap reale, visual scalato alla colonna)
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-disabled-cursor
    source: director-ruling
    source_ref: R-378 rev4 (Director 2026-11-25 «il divieto d'accesso grigio»)
    statement: >-
      la placca CONFIRM disabilitata porta `cursor: not-allowed` all'hover — il passaggio del mouse
      stesso dice che non è cliccabile. Il trattamento −40% saturazione lacca è confermato a occhio
      dal Director nella stessa sessione («mi sembra accettabile»).
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-well-velluto
    source: director-ruling
    source_ref: R-378 rev6 (Director 2026-11-25, fork zoom board-zoom-pozzi.png — scelta «C»)
    statement: >-
      i pozzi interni usano la ricetta «velluto + vignettatura»: glow radiale orizzontale in alto
      e vignettatura profonda in basso, nessuna arte nuova. Varianti scartate sul fork: flat nero-teal
      (superata), marmo riusato dal campo esterno («troppo nero» anche a velo 45%, B2/B3).
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
  - id: cassetto-v2-captions-floor-12
    source: director-ruling
    source_ref: R-378 rev5 (Director 2026-11-25 «oro + saliente e anche + grande … solo leader»)
    statement: >-
      il floor tipografico del cassetto è 12px (CASSETTO_MIN_LABEL_PX=12, era 11 — a 1280×800 metà
      dei caption stava esattamente al floor, misura witness 2026-11-25); i caption minori lasciano
      lo champagne muted per oro pieno a peso 600 (days/total viaggio, label seat). La copy del seat
      leader è «Leader» in tutte le lingue (non «Expedition leader»/«Capospedizione»).
      AMENDA il floor di INV:cassetto-captions-min-size per la superficie V2; V1 frozen resta a 11.
    test_refs:
      - tests/unit/idleVillage/r374CassettoV2.test.ts
      - tests/unit/idleVillage/questContentLocale.test.ts
---
