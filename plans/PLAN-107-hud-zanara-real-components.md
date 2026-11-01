# PLAN-107 — HUD Zanara: dai mockup ai componenti reali su /game

**Status:** draft — attende battesimo Director
**Parent:** R-290 (critica HUD + ruling «base = Mockup 1, migliorala»), R-303 (hud-lab)
**Desiderata di riferimento:** v6 FROZEN (CSS/React-first → asset ad hoc solo per il non-riproducibile, paintover consentito), v8 (Golden UI Foundation)
**Superficie fork:** `/hud-lab` — ogni ruling per-slot su questa pagina È il visual-fork gate della fase corrispondente.

## Scopo

Trasformare la direzione visiva dei mockup (smalto smeraldo + oro antico + alabastro, famiglia «Zanara» scelta col ruling R-290) nella **HUD e UI reale di `/game`**: token, skin preset, primitive, componenti. Non un'altra iterazione di immagini — la critica 2026-11-01 ha fissato il problema giusto: serve gerarchia e qualità per-componente, non un'altra schermata.

## Divergenza dichiarata da tenere aperta

La skin di riferimento corrente è `base` (lacca petrolio `#0f2a35→#060f16` + ottone NMM; ruling 2026-10-16). I mockup sono **smalto verde smeraldo** — più chiaro e più verde. Il ruling R-290 secondo giro ha preferito il look del mockup: il piano assume un **nuovo preset** (`zanara`, nome provvisorio) nel `skinConfigRegistry` invece di mutare `base` in place — decisione D-4 sotto.

## Gerarchia dei componenti

Livello 0 = asset/token; L1 = primitive/placche; L2 = cluster/pannelli; L3 = composizione schermata.

| Mockup slot (/hud-lab) | Componente reale target | L1 usata | Note di gerarchia |
|---|---|---|---|
| `brand` (logo+tempo) | `hud-top-tabs` tab sinistra + (decisione D-1) | `HudPlaque` + asset emblema | Mockup fonde logo+orologio in un'unica placca |
| `resources` | `hud-top-tabs` tab risorse | `HudPlaque` + icone gemma per risorsa | Critica: «quasi definitivo» — solo superfici e leggibilità |
| `roster` | `materic-roster-component-v2` (`ResidentRosterPanelV2`) | medaglione ritratto + placca nome + barra + gemma stato | Richiede stati: ready/traveling/wounded come gemme |
| `panel` | **famiglia pannelli contestuali**: `quest-expedition-detail` (capofila), poi `village-registry`, `merchant-panel`, `village-stash-panel`, `hero-sheet-panel`, `hud-event-ledger`, `memorial-panel`, `legacy-reliquary-panel`, `settings-panel`, `load-game-panel` | frame alabastro + illustrazione verticale + gerarchia editoriale (titolo/tag/testo/ricompense/requisiti/CTA) | Una sola ricetta frame → propagata per famiglia |
| `nav` | `nav-bar` | plinth + tab incisi + ornamento centrale | Critica: astrolabio ridotto, icone più distintive |
| `cornerBR` | `hud-corner` | bottoni roundel incisi | Solo funzionali: niente forziere decorativo (critica) |
| `cornerBL` | — nessun equivalente | — | Decisione D-2: ornamentale, probabilmente escluso |
| `seal` | — non esiste oggi | — | Decisione D-3: parcheggiato finché non c'è un consumatore |

Fuori scope v1 (inherited automaticamente dai token, non task dedicati): `hud-tooltip`, `quest-outcome-toast`, `quest-reward-popup`, companions di `quest-run-window`, `objective-cartouche`, `stage-edge-strips` — passano alla Fase 3 solo come verifica di coerenza, poi eventuali task di rifinitura separati.

## Fasi e task

### Fase 0 — Freeze delle referenze (gate visivo, nessun codice)

- **T-001 Ruling per slot su `/hud-lab`.** Per ognuno degli 8 slot il Director sceglie l'iterazione baseline (stepper/galleria già operativi). Registro: `plans/PLAN-107-hud-zanara-real-components.md` §Ruling + sha256 del crop scelto in `public/mockups/hud-lab/crops/<slot>/<iter>.webp`. *Questo sostituisce la visual-fork card: la pagina è la superficie di ruling, il crop è la baseline (`baseline_kind: png`).*
- **T-002 Asset manifest per componente.** Per ogni slot con ruling: lista di ciò che è riproducibile in CSS/token vs ciò che diventa asset (texture smalto, filigrana, medaglione, icone, ornamenti) → `.mw/specs/hud-zanara/asset-manifest.md` + `design-intent.md` + `asset-identity.md` (gate canonico mockup-generator).

### Fase 1 — Token + prova implementativa (chiude il gap «implementabile 5.5/10»)

- **T-101 Preset `zanara` in `skinConfigRegistry`.** Nuovo preset: smalto smeraldo, oro antico opaco, alabastro, gemme (violaceo ammesso come accento per ruling 2026-10-28). Scala `--skin-hud-*` esistente + eventuali token nuovi (Zod). Test snapshot del preset.
- **T-102 Spike implementabilità sul medaglione roster.** Un solo componente ricostruito davvero (`hud-lab` come iterazione `react-v1` oppure sandbox): gradienti CSS vs texture raster per metallo/smalto/bevel. **Gate: se il medaglione non è riproducibile fedelmente, le tavole vanno riviste prima di proseguire** — non si scala un look non costruibile.
- **T-103 Estensioni `HudPlaque` minime.** Solo le varianti necessarie dai risultati dello spike (bordo inciso, inserto gemma, bevel). Nessun refactor.

### Fase 2 — Componenti in ordine di dipendenza

Ogni task porta: iterazione `react-vN` registrata in `/hud-lab` (stessa superficie di confronto), regression test permanente (`INV` dove il componente è contrattato — Mode B-amend sui cambi di comportamento), obbligazione `human-eye` con side-by-side baseline vs implementazione a viewport registrato.

- **T-201 `nav-bar`** — plinth + tab incisi + ornamento centrale ridotto. (Più semplice, sblocca il pattern per le tab.)
- **T-202 `hud-top-tabs`** — barra risorse plated + eventuale placca brand (subordinata a D-1).
- **T-203 `hud-corner`** — bottoni d'angolo roundel incisi.
- **T-204 Roster v2 → colonna medaglioni** — stati come gemme, selezione, differenziazione medaglioni.
- **T-205 `quest-expedition-detail`** — primo pannello con la ricetta «pannello contestuale» (illustrazione verticale + gerarchia editoriale).
- **T-206 Propagazione famiglia pannelli** — registry, merchant, stash, hero sheet, event ledger, memorial, reliquary, settings, load game. Batch per-file, stessa ricetta.
- **T-207 Tooltip + toast + popup** — skin pass di coerenza (solo se emergono dissonanze all'eye-check).

### Fase 3 — Composizione, baselines, chiusura

- **T-301 Composizione finale su `/game`.** Layout a schermo intero con tutti i componenti migrati; verifica 18% HUD a riposo; D-1/D-2/D-3 applicate.
- **T-302 Baseline deterministiche** — screenshot baseline per componente migrato (stessa infrastruttura delle regression esistenti).
- **T-303 Perf + a11y sweep** — `gamePerfBudgets` non degradato, nessun testo <12px, i18n completo (chiavi nuove nei JSON, mai inline).

## Decisioni aperte (NON decise dal planner — ruling Director)

- **D-1 Logo in HUD di gioco**: i mockup mostrano la placca WANDERLUST nella HUD; produzione non ce l'ha. Tenere o solo title/boot?
- **D-2 `cornerBL`** (bussola+coordinate): ornamentale — la critica dice via i decorativi. Escludere o dargli una funzione (es. readout coordinate reali)?
- **D-3 `seal` vittoria**: nessun consumatore attuale. Parcheggiare (nessuno slot in produzione) o anticiparlo?
- **D-4 Preset**: `zanara` come nuovo preset selezionabile accanto a `base`, o `zanara` diventa il default? (Ruling 2026-10-16 fissava `base` come default.)
- **D-5 Mix per-componente**: il ruling T-001 può produrre una famiglia mista (es. roster da v2, pannello da v3) — inteso.
- **D-6 Iterazioni React in `/hud-lab`**: registrare `react-vN` come iterazioni dello stesso manifest (consigliato: stessa superficie di confronto) o confronto solo su `/game`?

## Contratto di chiusura (plan-level)

- **OB-1** `npm run lint -- src/pages src/ui src/skins src/balancing` verde.
- **OB-2** `npm run build:check` verde.
- **OB-3** regression test per ogni componente toccato: `npm run test -- tests/unit/idleVillage` + spec e2e di superficie verdi (o emendate via `sync:bug` Mode B dove il comportamento cambia di proposito).
- **OB-4** `human-eye` Director: side-by-side baseline `/hud-lab` vs implementazione su `/game` per ogni slot migrato (stesso viewport 1600×900, artefatto in `test-results/plan-107/`).
- **OB-5** `npm run closure:lint` verde.
- Eccezione dichiarata: per le iterazioni React Fase 1-2 il regression-test permanente è lo skin/component spec esistente; dove non esiste, obbligazione `human-eye` compensativa.

## Trappole applicate

- **T-04**: nessun claim percettivo senza side-by-side; l'eye-check Director chiude ogni fase.
- **T-05**: nessuna riscrittura di componenti trusted/frozen senza aggiornare contratto + `*_trusted.md` + master index (40-documentation-governance).
- **T-13**: worktree condiviso — nessun commit scoped che catturi lavoro altrui; probe in retry.
- **Invarianti**: preset in `skinConfigRegistry` (mai `.css` standalone), niente valori hardcoded, i18n per ogni stringa nuova, riuso primitive (`src/ui/atoms`, `idleVillage/skins/primitives`, `frozen/kits`) prima di componenti nuovi.
- **Mockup**: niente generazione senza `design-intent`/`asset-identity`/`prompt` (`--enforce-canon`); raw mockups mai committati (`public/mockups/` è gitignored).

## Cosa questo piano NON è

- Non è un piano di generazione immagini: le tavole esistono già (`/hud-lab`), il lavoro è a valle.
- Non tocca la mappa (`mappa2` resta nel suo binario PLAN-089 figli).
- Non ridisegna il layout di produzione: la composizione resta quella di `/game` salvo ruling D-1..D-3.

## Ruling registrati (si compila a T-001)

| Slot | Iterazione scelta | sha256 crop | Note |
|---|---|---|---|
| brand | — | — | |
| resources | — | — | |
| roster | — | — | |
| panel | — | — | |
| nav | — | — | |
| cornerBL | — | — | |
| cornerBR | — | — | |
| seal | — | — | |
