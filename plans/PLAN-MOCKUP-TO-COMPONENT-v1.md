# PLAN-MOCKUP-TO-COMPONENT v1 — Da richiesta a mockup a componente React ottimizzato

**Status:** Draft (da criticare)
**Date:** 2026-08-14
**Desiderata FROZEN:** `.mw/desiderata.md` v5 — Mockup AI → componente React + asset ad hoc: protocollo generale
**Progetto:** RPG (idle village / world surface), React + TypeScript + Vite, target Tauri desktop su WebView

---

## 0. Contesto di progetto rilevante (vincoli reali, non negoziabili)

Estratto dagli invarianti in `.windsurf/rules/00-project-invariants.md` e dalla filosofia in `.windsurf/rules/philosophy.md`:

- **Config-first**: nessun valore gameplay/UI hardcoded nei componenti. Stat, token, timing e copy vengono da moduli config (`src/balancing/config/**`) validati con Zod.
- **Skin system**: i CSS ad-hoc per pagina/componente sono LEGACY e deprecati. Ogni nuovo tema visivo deve essere un preset in `src/ui/idleVillage/skins/skinConfigRegistry.ts`, mai un file `.css` standalone.
- **Component reuse**: prima di scrivere un nuovo componente UI bisogna verificare se esiste un primitivo equivalente in `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/`. Duplicare markup/stile di un primitivo è una violazione.
- **Localization**: nessuna stringa user-facing hardcoded; tutto via `react-i18next` (`useTranslation`), namespace `common` e `idleVillage`.
- **Persistence**: solo via `@/shared/persistence/PersistenceService`.
- **State**: Zustand per stato di dominio condiviso, React Context per stato di presentazione locale.
- **Frozen kits**: esistono 24 kit certificati in `src/ui/idleVillage/frozen/kits/` (`poiKit`, `questCardKit`, `questDetailKit`, `slotRackKit`, `pgcardKit`, `outcomeKit`, `clockKit`, `destinyAstrolabeKit`, ...). Sono importabili "con una riga" e hanno test di contratto.
- **Documentation governance** (`.windsurf/rules/40-documentation-governance.md`): ogni componente `trusted`/`frozen` ha esattamente un `*_trusted.md` e una riga in `COMPONENT_MASTER_INDEX.md`. Nessuna chiusura senza verifica runtime.
- **Safeguard obbligatori prima di "done"**: `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`, `npm run kanban:lint`. Timeout massimi definiti (lint 120s, build 180s, test 300s).
- **Art direction**: la bibbia è `src/docs/docs/plans/art_direction_plan.md` ("DNA Prismatic Wanderlust v0.10"): due pilastri (Wilderness / Empire), split-rendering (volti Ruan Jia puliti vs materia Jaime Jones impasto), ombre deep teal mai grigie/marroni, luce "Solar Triumph", kill list (no grim, no mud, no symmetry, no flat design, no sci-fi), specificità materica ("Baroque Sun-Bronze" non "bronze").
- **Budget rendering**: target Tauri desktop su WebView. Vietati senza profilazione: mesh deformation continua, rifrazione fisica, volumetric fog, shader custom. Pipeline asset esistente: script `sharp` (`scripts/build-terrain-masks.mjs`, `build-foam-mask.mjs`) che emettono WebP + maschere alpha + `points.json` derivati, deterministici, non authored a mano.
- **Evidenza empirica già pagata**: un tentativo passato di animare 21 layer PNG full-canvas baked con transform CSS ha prodotto "una foresta intera a blocco che si sposta e lascia spazi neri". Lezione: **un asset baked full-canvas non è separabile**; se serve movimento, servono asset atmosferici dedicati o displacement dentro la texture.

## 1. Stato attuale (cosa esiste già, fatto in questa sessione)

- Venv locale `/Users/faustoboni/.venvs/rpg-assetgen` (Python 3.12, PyTorch 2.13 con MPS, diffusers 0.39).
- SDXL base 1.0 scaricato in cache HF (~13 GB).
- `scripts/rpg-gen-mockup.py`: CLI che genera N candidate con seed incrementale, salva in `public/mockups/<component>/`.
- `public/mockups/` aggiunto a `.gitignore`.
- Skill `.devin/skills/mockup-generator/SKILL.md`.
- Doc operativo `src/docs/docs/plans/ai_mockup_workflow.md`.
- `context/INDEX.md` e `RICHIESTE.md` (R-023) aggiornati.
- Misurato: **~5 min/immagine a 1024x1024, ~10 min/immagine a 1024x1536** su questo Mac (25 GB RAM, Apple Silicon), 30 step, SDXL fp16 su MPS.
- Osservato: **CLIP tronca il prompt a 77 token**. I prompt lunghi presi dalla bibbia vengono tagliati silenziosamente e la coda del prompt (spesso i vincoli negativi e il formato) viene ignorata.
- Prime candidate generate: forme ovali/rettangolari con cornice dorata, palette teal/oro coerente con la bibbia, ma **nessuna leggibile come card che deve contenere testo e dati**.

## 2. Workflow proposto (v1, quello da criticare)

### Fase A — Richiesta
1. Il Director esprime la richiesta.
2. Si registra in `RICHIESTE.md` e si verifica la desiderata FROZEN pertinente.
3. Si identifica il preset skin (`base` / `minimal_frontier` / `wanderlust`) e il pilastro (Wilderness / Empire).

### Fase B — Prompt
4. Si costruisce il prompt dalla bibbia: pilastro, split-rendering, palette, specificità materica, kill list.
5. Negative prompt di default fisso.

### Fase C — Generazione
6. `python scripts/rpg-gen-mockup.py --component X --count 4 --width W --height H --prompt ... --negative ...`
7. Output in `public/mockups/<component>/`, gitignored.

### Fase D — Valutazione
8. L'agente applica un filtro tecnico (palette, kill list, assenza testo, decomponibilità, dimensioni Tauri-friendly).
9. Il Director sceglie esteticamente.

### Fase E — Scomposizione
10. Si scrive una tabella `elemento visivo → primitivo/token → asset da esportare → note`.
11. Ciò che è coperto dai primitivi non diventa asset. Ciò che resta diventa SVG (iconografia/vettori) o WebP (texture).

### Fase F — Implementazione
12. Componente React che usa `useStyleLabTokens`, `useTranslation`, `useIdleVillageConfig().config`, primitivi e frozen kit esistenti.
13. Nessun colore hardcoded, nessun `.css` ad-hoc.

### Fase G — Asset pipeline
14. Export produzione in WebP via `sharp` / script `build-*.mjs`.

### Fase H — Safeguard
15. `npm run lint -- <scope>`, `npm run build:check`.

### Fase I — Evidenza e learning
16. Evidence log in `test-results/<component>-mockup-YYYY-MM-DD.md`.
17. Se emerge un pattern, invocare `learn` e aggiornare il doc.

## 3. Obiettivo dichiarato

"Passare da richiesta a mockup a componente vero, ottimizzato, con asset creati ad hoc, e ottenere un risultato comparabile" — dove **comparabile** significa: il componente implementato deve essere riconoscibilmente lo stesso oggetto del mockup scelto, con la stessa qualità percepita, senza violare gli invarianti del progetto.

## 4. Punti che il piano v1 NON risolve (dichiarati apertamente)

- Non definisce cosa significa operativamente "comparabile", né come si misura.
- Non dice come si gestisce il fatto che un modello di diffusione non produce layer separati, mentre il progetto ha bisogno di asset separabili (lezione dei 21 layer baked).
- Non affronta il limite dei 77 token CLIP: la bibbia è più lunga del budget del prompt.
- Non dice come si ottiene un asset con **alpha reale** (SDXL non genera trasparenza; "isolated on transparent background" produce uno sfondo dipinto, non un canale alpha).
- Non dice come si ottengono **stati coerenti** (idle/hover/pressed/disabled) né varianti dello stesso oggetto.
- Non dice come si garantisce coerenza di stile **tra componenti diversi** generati in sessioni diverse.
- Non affronta il costo: 5-10 min per immagine significa che 4 candidate costano 20-40 minuti di wall-clock.
- Non dice quando **non** usare questo workflow (quando un primitivo esistente basta).
- Non definisce chi/come decide se il mockup scelto è implementabile prima di iniziare a implementare.
- Non definisce il formato della "mockup spec" che passa dalla fase di valutazione a quella di implementazione.
- Non affronta la governance: il mockup e il componente risultante devono entrare in `COMPONENT_MASTER_INDEX.md`? Servono trusted doc? Test di contratto?
