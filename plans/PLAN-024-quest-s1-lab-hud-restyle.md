---
title: 'PLAN-024 — Quest S1 Lab: restyle secondo la guida HUD (Lacquer Atlas)'
status: completed
created: 2026-10-08
desiderata: v24/v27 (FROZEN) — stadio S1, quest authored nel lab
request: R-104
parent: PLAN-023 (cockpit — l'architettura resta, cambia solo la pelle)
related: src/docs/docs/design/hud_component_guide.md, primitive_composition_rules.md, quest_ui_component_guide.md
---

# PLAN-024 — Restyle del lab S1 secondo la guida HUD

## Perimetro

Portare `/quest-s1-lab` nel linguaggio visivo di `/game` (lacca teal, bande
di bronzo, `HudPlaque`, token `--skin-*`, tipografia ≥12px) **senza
cambiare** engine, pipeline di presentazione, contenuto authored né il
comportamento del cockpit di PLAN-023.

**Misure di partenza** (lab reale, 1366×768, 2026-10-08): 0 `HudPlaque`,
0 token `--skin-*`, 221 classi colore Tailwind, 16 letterali hex/rgba,
47 `text-[9–11px]` (20 nodi <12px a runtime), 51 contenitori
`rounded+border` ad hoc, 0 `data-hud-controls`.

**Fuori scope:** engine/`questRun.ts`, `presentationTimeline.ts`, astrolabio
(kit frozen, §1.14 della guida), quest cassa/rovine (ereditano la shell ma
nessuna feature nuova), sistema pannelli di `/game` (`useHudPanels`).

## Decisioni ratificate (Director, 2026-10-08)

- **D1:** il dipinto di scena è lo **sfondo dell'intera stage band**
  (mascherato ai lati), non una card centrale. Formazione in primo piano a
  sinistra, orda a destra, astrolabio dockato al centro. Traduce la regola 5
  della guida («la mappa è l'eroe») in «il dipinto è l'eroe».
- **D2:** (delegata al planner) Action Zone = `HudPlaque shape="plinth"` che
  sale dal fondo, come la nav di `/game`; strip alta = `hang`; stage = `panel`.
- **D4:** la formazione mostra i PG col **roster trusted** (`WanderlustRosterCardV2`/`rosterV2`), non slot ad hoc; i dati extra del lab (exposure, chip danno) sono overlay/badge sopra la card, non fork.
- **D3:** la cronaca **resta drawer locale del lab** — nessuna integrazione
  con `useHudPanels`/menù Pannelli. Si restyla il drawer con token e placca.

## Decisioni aperte

- Nessuna bloccante. Da confermare in esecuzione: i due token nuovi
  (`--skin-hud-danger`, `--skin-hud-ok`) vanno anche in
  `SKIN_CSS_VAR_OVERRIDES.lacquer_atlas`? Default: solo `BASE`, override
  solo se il contrasto misurato non regge (guida §4).

## Vincoli (dalla guida)

- Cornice solo `HudPlaque`; dentro la placca il contenitore **non ha bordo,
  raggio, fondo né `overflow:hidden`** (§2.5). Gli slot sono righe, non
  sotto-scatole. Un SVG per placca: placche solo su strip/stage/action/
  verdict card/drawer — mai per slot o token.
- Colori solo da token; nuovi token prima in `BASE_SKIN_CSS_VARS` (§4).
  Metalli e segnali **opachi** (§1.4).
- Testo ≥12px; `--skin-font-display` per etichette, `--skin-font-serif` per
  frasi, `tabular-nums` per i numeri (§3.5). Scala in config Zod.
- Controlli: `data-hud-controls`, pillole 26px, `aria-pressed`, focus
  visibile (§5). Stati = colore **più** forma/testo.
- Nessuna emoji come iconografia: icone lucide (`getStatIconComponent`).
- i18n invariata (nessuna stringa nuova salvo aria-label); numeri in
  `questLabPresentation.ts`.
- Must-not-change: R-097 v2, R-099, invariant `presentedHp==committedHp`,
  `pageCrash.repro`.

## Task

| # | Task | Dipende da | Esito verificabile |
|---|------|-----------|--------------------|
| T-001 | **Spezzare la pagina**: estrarre da `QuestS1LabPage.tsx` (1459 righe) i sottocomponenti in `questS1Lab/hud/` (`Formation`, `Horde`, `ActionZone`, `VerdictCard`, `Belt`, `StashPicker`, `ChronicleDrawer`, `ContextStrip`). Refactor puro, zero cambi visivi. | — | `questS1Lab` 36/36 + `pageCrash.repro` verdi; screenshot prima/dopo identici |
| T-002 | **Scala tipografica** `type` (label/body/number/title ≥12) in `questLabPresentation.ts`. *Emendato in esecuzione*: nessun token nuovo — `--skin-status-met/unmet/wound/death` + `--skin-text-*` coprono già ok/warn/danger (guida: token nuovi solo se manca la semantica) | — | `hudGuards` verde; zero `var(--skin-hud-danger)` ecc. |
| T-003 | **Telaio** `QuestHudFrame`: `hang` (strip) + `panel` (stage) + `plinth` (Action Zone) con `PRES.layout`; padding per spalle curve (§3.3) | T-001, T-002 | zero scroll @1366×768 e @1280×800 (misurato), nessuna sovrapposizione |
| T-004 | **Stage con dipinto-sfondo** (D1): art full-bleed con mask, griglia `1fr auto 1fr`, formazione/orda leggibili, astrolabio dockato al centro | T-003 | screenshot a 1440×900 e 1280×800; formazione a ≥12px |
| T-005 | **Formazione sul roster trusted** (Director: «c'è il roster per mostrare i PG, usiamo quello»): `WanderlustRosterCardV2` (materiale HUD, `compact`, `statusKind` injured/dead → ferita/lapide) + badge exposure overlay (token, icona tier, %, pips); orda come righe; intent `⚔×k` a 12px+ | T-004 | zero nodi di testo <12px nello stage (misurato via DOM); nessun FormationSlot ad hoc residuo |
| T-006 | **Icone e cintura**: `questStash.ts` `icon` → nome lucide (via mappa), cintura = toolbar `data-hud-controls` icone + contatori, spostata sopra le opzioni; picker idem | T-003 | nessuna emoji nel DOM; `aria-pressed` su ogni chip |
| T-007 | **Action Zone/Verdict card** su plinth: serif per le frasi authored, display per etichette; nodo a scelta singola reso come CTA, non come menu | T-003, T-006 | screenshot verdict + stakes tooltip |
| T-008 | **Schermate preset e selezione**: due colonne (preset \| sacca), «Partire» sticky in basso (visibile senza scroll @768); «Copre» a 12px con icona stat e colore+forma | T-002, T-006 | CTA visibile @1366×768 senza scroll (misurato) |
| T-009 | **Context strip e controlli**: pillole unificate `data-hud-controls` (Full/Fast radiogroup, Cronaca, Ritirata, Reset); «Forecast» da banner a pulsante in strip; drawer cronaca restylato (D3: locale) | T-003 | un solo stile di pillola; banner forecast rimosso dal chrome |
| T-010 | **Guardie**: aggiungere i file `questS1Lab/hud/*` a `STRICT_FILES` di `hudGuards.test.ts`; test di scala tipografica; estendere `hud_component_guide.md` §1 con «schermate d'azione a tutta pagina» e cross-link da `quest_ui_component_guide.md`; indicizzare la guida (KNOWLEDGE_INVENTORY, CLASSIFICATION, context/INDEX, `idle-village-task`, `idleVillage/AGENTS.md`) | T-004…T-009 | `hudGuards` verde sui nuovi file |
| T-011 | **Verifica e chiusura**: `lint`, `test` scope, `build:check`, `kanban:lint`; misura DOM (0 classi palette Tailwind, 0 letterali colore, 0 testo <12px) @1366×768 e @1280×800; confronto visivo con `/game`; evidence `test-results/r104-*`; Kanban; RICHIESTE R-104 → completata | tutti | log di evidenza con le misure prima→dopo |

## Rischi

- **Spazio vs 12px**: ~140px/slot ×4 = ~560px; regge solo con D1 (dipinto
  come sfondo). Se a 1280 non entra, ridurre a 3 colonne di stat o scalare
  l'orda — non scendere sotto 12px.
- **Costo `HudPlaque`**: un SVG + ResizeObserver per placca; budget fissato a
  5 placche di regione + verdict card. Più di quello = revisione.
- **Regressione silenziosa**: T-001 è un refactor su una pagina da 1459
  righe — gate di test e screenshot prima/dopo prima di toccare lo stile.
- **Estensione della guida** (T-010): la guida nasce per `/game`; la sua
  estensione a schermate d'azione è una decisione di governance, tracciata
  nel DECISION_LOG.

## Safeguard

`npm run lint -- <scope>` · `npm run test -- <scope>` · `npm run build:check`
· `npm run kanban:lint` · evidence `test-results/r104-*`.

## Avanzamento (2026-10-08 — completato)

Tutti i task chiusi. Misure reali in `test-results/r104-quest-hud-restyle-2026-10-08.log`.

- **T-001 ✅** Pagina 1472 → 511 righe; 13 moduli in `questS1Lab/hud/`. `pageCrash.repro` verde (aggiornato il locator: card = `role="button"`, non `<button>`).
- **T-002 ✅** `type` (labelPx/bodyPx/numberPx/titlePx ≥12) in `questLabPresentation.ts`. Nessun token nuovo — `--skin-status-*`/`--skin-text-*` coprono la semantica.
- **T-003 ✅** Telaio: `hang` (strip) + stage (scrim, nessuna placca propria — il dipinto basta) + `plinth` (Action Zone). 0px scroll @1366×768 misurato.
- **T-004 ✅** Dipinto full-bleed (`object-fit cover` + scrim gradient ai bordi), astrolabio dockato al centro, orda a destra. Verificato a 1366×768 e 1280×800.
- **T-005 ✅** Formazione = `WanderlustRosterCard` compact (da `roster/index.ts`, `statusKind` injured → tag INJURED) + `ExposureBadge` overlay (icona tier + pips + %, scrim chip); tombstone con `Skull` lucide; orda anonima + intent. **Nota**: le barre interne della card compact sono 8-9px — contratto trusted del roster, non toccato (candidato a lavoro separato sulla card).
- **T-006 ✅** `questStash.icon` = nomi lucide (`getStatIconComponent`); emoji rimosse da `item.*`/`logToggle` i18n (en/it-IT/pseudo); cintura = toolbar `data-hud-controls` sopra le opzioni.
- **T-007 ✅** Action Zone/Verdict card nel plinth; serif per le frasi, display per le etichette; scelta singola = CTA piena.
- **T-008 ✅** Preset 2 colonne (roster V2 | The Bag), DEPART visibile sopra la piega @768.
- **T-009 ✅** Un solo stile di pillola; forecast = pill + pannello floating; cronaca = drawer lacquer locale (D3).
- **T-010 ✅** 13 file in `STRICT_FILES` (guardia verde); guida estesa (§6b schermate d'azione, pitfall `svg:only-child` §5+§10); indicizzata in context/INDEX, KNOWLEDGE_INVENTORY, CLASSIFICATION, checklist mandate (condizione 6); cross-link da quest_ui_component_guide.
- **T-011 ✅** 104/104 test scope, build:check, kanban:lint. DOM @1366: 315 `var(--skin-*)`, 0 letterali colore e 0 classi palette nei file di scope, 0px scroll.

### Fix emersi in esecuzione
- **`svg:only-child` pitfall**: i pill icona+testo collassavano a 26px perché `:only-child` ignora i nodi testo → convenzione «etichetta in `<span>`» documentata nella guida.
- **Compressione pill**: `whiteSpace:nowrap` + `flexShrink:0` sui controlli (strip/belt/stash).
