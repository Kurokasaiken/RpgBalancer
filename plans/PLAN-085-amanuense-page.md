---
plan: PLAN-085
title: Amanuense Page — pagina folio dello scriba sulla shell quest /game
status: in corso
request: R-279
artifact: .mw/research/2026-10-24-amanuense-page/artifact-r003.md (sha a3cc80e5…239c, converged 4/4)
visual-fork: A — baseline .mw/runs/2026-10-24-amanuense-fork/baseline-A.png (sha 226ea1e7…, ruling VF-AMAN-001)
created: 2026-10-24
---

# PLAN-085 — Amanuense Page

Componente transiente della quest run shell (`/game`): un pulsante accanto al
testo breve di scena (`node.body`) apre a SINISTRA una pagina-foglio stile
amanuense con la versione lunga della scena e i lore drop. Ruling Director:
opzione **A folio sospeso**; pulsante con icona **tomo aperto**. Skill check
inalterato sull'ala destra — coesistenza simultanea.

## Contratto di design (da artifact-r003, converged)

- **Layout**: `LeftWingSlot` occupante `amanuense` (peer di `companion`, swap):
  pagina aperta = modo, tab compagno inerte (tooltip), `wasOpen` restore solo
  su chiusura manuale, nessun restore su auto-fold. Finestra 760 intoccata;
  coesistenza da vw ≥1480 (320@1480→460@≥1920); sotto → overlay sheet
  `min(92vw,480px)`.
- **Registro tipografico umanista** (NO blackletter): EB Garamond corpo ≥16px;
  incipit Almendra SC/Cormorant SC (verificare OFL+IT); Lombardici dipinti;
  lore = IM Fell (verificare copertura IT, fallback EB Garamond Italic).
- **Densità = invariante reading-rect** (prosa ≥48ch @≥1920 / ≥40ch @1480–1700,
  pergamena ΔL≤3%): il gutter assorbe il surplus, niente cap % globale.
- **Capolettera**: bespoke per scena (clip-path su lettera SVG base) default;
  libreria 12 motivi plate = fallback/tier-1/lore; PD cutout; vine-only.
- **Reveal**: cerimonia ≤1.8s solo al primo open (session Set), poi fade 200ms;
  reduced-motion istantaneo; dash solo su frame/iniziale, mai sulla prosa.
- **Forma**: singolo folio scroll; `explicit` rubricato + vero colophon
  (scribe/place/date/complaint); NO catchword.
- **Marginalia-apparato**: gloss (lemma+leader-line, blocco inline), nota
  (manicule rossa), drollery (gutter SVG).
- **a11y**: `role=complementary`, focus→incipit solo su open volontario,
  lore auto-open = annuncio corto, Esc scopato a overlayStack, scroll region
  `tabindex=0 role=region`, wax-seal close control in OGNI modo.
- **Skin**: preset `skinConfigRegistry.amanuense` → token `--skin-amanuense-*`,
  niente .css standalone; i18n per chrome, authored content per testi.

## Task

- **T-001 ✅ (2026-10-24)** Schema `longForm` strict-Zod su nodo quest (paragraphKeys, incipit,
  marginalia gloss/nota/drollery+lemma, colophon, bespokeInitialId, tier,
  variant scene|lore) + tokenizer `{r|}`,`{m|}`,`{g|}` (underline dorato) con
  refinement bilanciamento + modulo skin preset `amanuense`. Test: schema
  valid/invalid, tokenizer, fallback lettera da primo carattere localizzato.
- **T-002 ✅ (2026-10-24)** `AmanuensePage` componente (`src/ui/idleVillage/components/gameFrame/`):
  folio sospeso (baseline-A), frame composto angoli+fasce+head/tailpiece, prosa,
  gloss inline, colophon/explicit, wax-seal close, scroll region a11y. Render
  per `variant`. Test RTL su contenuto + reduced-motion.
- **T-003 ⏳ (impl. v1 2026-10-24, da verificare in-cluster)** Integrazione `QuestStageCluster`/`QuestRunWindow`: occupante
  `amanuense` in LeftWingSlot con regole swap/wasOpen/auto-fold, coesistenza
  ≥1480, sheet <1480, pulsante **tomo aperto** accanto a `node.body`
  (visibile solo se `longForm` presente, quill-pulse una volta se non letto).
  Test: solver rect non-overlap, swap/restore, auto-fold, sheet breakpoint.
- **T-004 ✅ (2026-10-24)** Reveal one-shot + reduced-motion + cross-fade node-change
  (focus pinned heading, scroll top). Test timing/stati.
- **T-005 ✅ (2026-10-24)** Lore variant — wiring `LoreDrop` → pagina: auto-open su scoperta
  (`useQuestLoreDrop` su `run.questId`, `completed=run.ended`), announce
  `role=status` polite senza focus steal; sigillo con iniziale categoria.
- **T-006** Evidenza: review page side-by-side baseline-A vs implementazione
  stessa viewport (980×720) per eye-check Director; evidence log test-results/.

## Contratto di chiusura (obbligazioni verificabili)

- `npm run lint -- <scope>` · `npm run test -- <scope>` · `npm run build:check` · `npm run closure:lint`.
- **Regressione permanente (R-247)**: `npm run test -- tests/unit/idleVillage/amanuense*` — spec scritta per fallire senza la feature (schema, tokenizer, solver occupancy, swap/restore, sheet breakpoint, reveal states).
- **Same-viewport pre-registrata**: region `amanuense-page` a 980×720 vs `baseline-A.png`, esito PASS/FAIL/NOT_COMPARABLE + obbligazione `human-eye` con artefatto side-by-side.
- **Living contracts**: scope `/game` (gameFrame) → classificazione per-componente nel contract; le INV nuove del componente entrano come `// INV:` nei test (Mode B-add). Nessuna mutazione di comportamenti contrattati esistenti (Mode C dove la copertura è piena).
- **Traps ereditate**: T-02 (niente `strokeLinecap="round"` su archi dash progressivi), T-04 (claim visivi solo con testimone), T-03/T-21 (controlli in `data-hud-controls`), T-19 (preview su ROOT dev server), T-13 (failure = sospetta collisione sessioni).
- **Skin/i18n invariants**: preset registry, niente .css standalone, niente stringhe hardcoded, `PersistenceService` se serve stato (session Set = in-memory, ok).

## Decisioni aperte (dichiarate, non decise)

- Font incipit finale: Almendra SC vs Cormorant SC — scelta a implementazione
  dopo verifica licenza OFL + copertura IT (entrambe nel preset come token).
- Copertura glyph IM Fell su testi IT → fallback EB Garamond Italic se mancano.
- Drolleries asset: SVG authored vs emoji-proto → decide la prima pagina prodotta.

## Fuori scope

- Pagina persistente/diario (ruling: transiente).
- Audio, tooltips interattivi sui lemma, paginazione multi-folio.
- Cambi al solver oltre l'occupante (finestra 760 intoccata — residual A chiuso).

## Progress log

- T-001 implementato: `LongFormSchema`+marginalia+colophon in `questScenario.schema.ts`
  (campo `longForm` su `QuestNodeSchema`); tokenizer `amanuenseMarkup.ts`
  ({r|}/{g|}/{m|}, balance check, initial letter); skin config
  `skins/amanuenseSkinConfig.ts`; test `tests/unit/idleVillage/
  amanuenseSchema.test.ts` 7/7 verdi (INV amanuense-page.INV-1..7); lint 0 err.

- T-002 implementato: `AmanuensePage.tsx` — folio sospeso, frame composto
  (corners+vine edges+gold rules), incipit rubricata, drop-cap derivata,
  markup {r|}/{g|}/{m|}, gloss/nota inline, explicit+colophon, wax-seal
  close in ogni modo, scroll region a11y, lore variant (seal). Test
  `amanuensePage.test.tsx` 3/3 verdi (INV-8..10).

- T-003 v1: `QuestNode.longForm` (type + schema); `QuestRunWindow` — pulsante
  tomo 📖 accanto a `node.body` (solo se `longForm`), occupante `amanuense`
  nella colonna left (pill stashed `wasPillRef`, restore solo su close
  manuale, auto-fold su nodo senza longForm), sheet overlay `min(92%,480px)`
  sotto 1480px. 10/10 test suite esistente ancora verdi.
  Residui da verificare a T-006: coerenza col solver (larghezza colonna
  amanuense vs rect del solver), zIndex sheet vs overlayStack, pill-header
  resa "inerte" (attualmente il click stashed ma la pagina resta — segnalare
  come incidental_deviation o allineare).

- T-004 implementato: `seenPages` session Set (chiave = pageKey ?? prima
  paragraphKey), ceremony ≤1.9s solo al primo open — frame-draw
  clip-path 600ms, initcap fade 300ms, prosa stagger 600+60ms/¶, gloss a
  ~1.5s; `useReducedMotion` → istantaneo; `data-ceremony` per test. 10/10
  test verdi.

- T-005 implementato: `useQuestLoreDrop` in `QuestRunWindow` (entityId =
  run.questId); drop scoperto → `pageIsLore` + sintetizza `longForm`
  `{variant:'lore', incipitKey:titleKey, paragraphKeys:[bodyKey]}` →
  auto-open con pill-stash, announce polite `role=status`, niente focus
  move. Auto-fold per nodo vale solo per pagine scena (le pagine lore
  restano aperte su node change). tsc: 0 errori sui file toccati; 10/10
  test verdi.

- Contenuto authored: `longForm` sul nodo `viaggio` (prima scena della
  quest dei Rovi) — incipit rubricata, 3 paragrafi con {r|}/{m|} markup,
  gloss su «Passo del Corvo» + nota NB sulle monete, explicit+colophon
  (fratris Alderici, «manus dolet et atramentum friget»). 10/10 test verdi.

- Estensione fasi (Director: «le quest devono avere anche tra le
  informazioni questa per ogni fase»): `longForm` su `QuestPhaseSchema` +
  `QuestPhase` type; tomo 📖 nella sidebar Journal di `QuestChronicle`
  (per la fase corrente), overlay sheet fixed-position; contenuto authored
  su fase `scout_tunnels` (city_rats). 10/10 test verdi, tsc pulito.
