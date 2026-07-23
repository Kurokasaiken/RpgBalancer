# Guardian AutoPush Mandate

> **DEPRECATED / ARCHIVED — OPS-SHUTDOWN-001 (2026-07-23)**
>
> The legacy auto-commit / auto-push / shutdown watcher mechanisms described in this document have been audited, disabled, and archived under `archive/legacy_shutdown/`.
> `shutdownSystem()` has been removed from `scripts/autoCommit/commitFailureMonitor.js` and `scripts/guardian/vercelDeploymentGuard.ts`.
> Per `50-shutdown-governance.md`, only the **Global Session Shutdown Manager** (`scripts/shutdownManager/`) is authorized to request macOS shutdown.
> This document is kept for historical reference; do not reactivate the old mechanisms without explicit governance review.

## 1. Missione e responsabilità

Il Guardian coordina tutti i fallback legati agli script automatici di consegna:

- Garantire che **auto_commit_push.sh** e **shutdown_when_done.sh** vengano eseguiti secondo programma.
- Monitorare i log di guardia salvati in `test-results/auto-commit-guardian/` e intervenire appena viene registrato un fallimento.
- Documentare ogni intervento (log aggiornati + note nel prompt corrente) e comunicare anomalie operative.
- Confermare che le pagine operative (Moodboard, Idle Village Map, Punch Club, STS Simulator, STS CLI) risultino attive prima di ogni deploy Vercel.

## 2. Sequenza operativa standard

1. **Esegui/riavvia gli script obbligatori**
   - `bash auto_commit_push.sh` (watcher con commit/push programmati)
   - `bash shutdown_when_done.sh` (spegnimento automatico dopo il periodo di inattività)
2. Verifica che entrambi stiano girando (PID attivo o log in streaming).
3. Archivia i log prodotti dagli script in `test-results/` usando timestamp ISO (`YYYY-MM-DDTHH-MM-SS`).

## 3. Verifica pagine operative (AGGIORNATO 2026-01-21)

**OBIETTIVO**: Garantire che le pagine critiche siano funzionanti prima del deploy, ma non bloccare per test obsoleti.

### Strategia di Verifica

Per ogni pagina critica (Moodboard, Idle Village Map, Punch Club, STS Simulator, STS CLI):

#### Step 1: Esegui Test Playwright (se disponibile)

```bash
# Moodboard
npx playwright test tests/moodboard-landing.spec.ts

# Map
npx playwright test tests/map-page.spec.ts

# Punch Club
npx playwright test tests/punch-club-loop.spec.ts
```

#### Step 2: Interpreta Risultati

##### Se il test passa

- Pagina verificata, procedi

##### Se il test fallisce

- **Non bloccare immediatamente**
- Procedi allo Step 3 (verifica manuale)

#### Step 3: Verifica Manuale (se test fallisce)

1. **Apri browser** su `http://localhost:5173`
2. **Naviga alla pagina** usando `window.__appNavControls.setActiveTab('<tab>')`
3. **Verifica funzionalità core**:
   - Moodboard: immagini visibili, nessun crash
   - Map: HUD visibile, resident cards presenti, nessun errore console
   - Punch Club: preset caricato, controlli visibili
   - STS: componenti renderizzati, nessun crash

#### Step 4: Decisione Deploy

##### Quando bloccare il deploy

- Pagina mostra errore "Something went wrong"
- Console ha errori critici (crash, undefined is not a function)
- UI completamente rotta (elementi mancanti, layout distrutto)
- Funzionalità core non funziona (click non risponde, dati non caricano)

##### Quando procedere

- Il test Playwright fallisce ma la pagina funziona manualmente
- Il test usa selettori obsoleti (es. `roster-feedback` non esiste più)
- Il test verifica un'implementazione vecchia (es. `MapPage` vs `VillageSandbox`)
- La pagina è funzionante ma il test non è stato aggiornato

#### Step 5: Documentazione

Salva evidenze in `test-results/verifica-pagine-operative-<data>.md`:

```markdown
# Verifica Pagine Operative - <data>

## Moodboard
- Test Playwright:  PASSED
- Verifica Manuale: N/A
- Deploy:  OK

## Idle Village Map
- Test Playwright:  FAILED (selettori obsoleti)
- Verifica Manuale:  Pagina funziona (HUD visibile, cards presenti)
- Deploy:  OK (test da aggiornare in futuro)

## Punch Club
- Test Playwright:  FAILED (roster-feedback non esiste)
- Verifica Manuale:  Pagina funziona (preset caricato, UI corretta)
- Deploy:  OK (test da aggiornare in futuro)
- Note: Creare prompt "Tech Debt - Aggiorna test Punch Club"

## STS Simulator
- Test Playwright: N/A (temporaneamente disabilitato)
- Verifica Manuale:  Messaggio "temporarily disabled" corretto
- Deploy:  OK

## STS CLI
- Test Playwright: N/A
- Verifica Manuale:  Pagina funziona (fix resetSimulation applicato)
- Deploy:  OK
```

### Principio guida verifiche operative

> "Ship working code, not perfect tests"

- Se la pagina funziona → deploy OK
- Se il test fallisce → verifica manuale
- Se test obsoleto → documenta, crea Tech Debt prompt
- Blocca SOLO se pagina effettivamente rotta

## 4. Gestione dei fallimenti AutoPush (AGGIORNATO 2026-01-21)

### Quando Commit/Push Fallisce

Se **git commit** o **git push** falliscono (es. `PRE-COMMIT SAFEGUARD FAILED`):

#### Step 1: Analisi Errore

1. **Identifica la causa**:
   - Errori TypeScript preesistenti?
   - Errori introdotti da ultimo prompt?
   - Test obsoleti?
   - Lint warnings?

2. **Distingui errori**:
   - **Errori NUOVI** (introdotti da ultimo commit) → DEVI fixare
   - **Errori PREESISTENTI** (già presenti) → documenta, considera bypass

#### Step 2: Strategia di Fix

##### Se gli errori sono nuovi

```bash
# Run targeted guardian tests first
npm run guardian:test

# Run full health check suite (includes build:deploy + page tests)
npm run guardian:health-check

# Review results
cat test-results/guardian-health-check.json
```

**What gets checked**:

- Targeted guardian suites (`StatStressTelemetry`, `InjurySystem`) via `npm run guardian:test`
- Deploy build success (`npm run build:deploy`)
- Bundle size analysis (warn > 10MB, fail > 20MB)
- Critical page functionality (5 core pages)
- Console error detection
- React hydration validation
- Performance metrics collection
- Asset optimization verification (public assets esclusi in produzione)

###### Profili guardian opzionali

- `GUARDIAN_INCLUDE_PUNCH_TESTS=true npm run guardian:test` riattiva i test Punch Club Injury quando vuoi coprirli; per default il profilo guardian li salta per evitare blocchi quando sono in manutenzione.
- `GUARDIAN_BUILD_STATS=true npm run build:deploy` forza la generazione di `dist/stats.json`, necessario perché il bundle check superi lo stato ⚠️.
- `GUARDIAN_PREVIEW_PORT=<porta>` permette di cambiare la porta usata dal preview server auto-avviato da `guardian:health-check` (default 3000).
- Tutti i flag sopra vengono impostati automaticamente dallo script guardian, ma puoi sovrascriverli quando fai debug manuale.

```bash
# Full deployment guard process (uses npx vercel under the hood)
npm run guardian:deploy-guard
```

Per i file che mostrano errori specifici, rilancia i comandi mirati:

```bash
npm run build:deploy
npm run test -- <test falliti>
```

Quando tutto è verde, riprova il commit/push:

```bash
git add -A
git commit -m "Fix: <descrizione>"
git push
```

#### Step 3: Verifica Deploy

Dopo push successful:

1. **Verifica pagine operative** (sezione 3)
2. **Se tutte OK** → deploy procede automaticamente su Vercel
3. **Se qualcuna rotta** → blocca, fixa, riprova

#### Step 4: Documentazione

Crea log `test-results/auto-commit-guardian/<timestamp>-recovery.log`:

```markdown
# Guardian Recovery - <timestamp>

## Errore Originale
<output errore commit/push>

## Analisi
- Errori nuovi: <lista o "Nessuno">
- Errori preesistenti: <lista o "Nessuno">

## Azione Intrapresa
- [x] Fix errori nuovi
- [x] Documentati errori preesistenti
- [x] Bypass pre-commit hook (se necessario)
- [x] Verifica pagine operative
- [x] Deploy successful

## Tech Debt Creato
- Prompt: "Tech Debt - <area>"
- File: <lista file con errori preesistenti>
```

### Principio Guida

> "Don't let perfect be the enemy of good"

- Fixa errori TUOI
- Documenta errori PREESISTENTI
- Non bloccare deploy per debito tecnico
- Crea prompt Tech Debt per fix futuro

## 5. Gestione dei fallimenti Auto Shutdown

- Se `shutdown_when_done.sh` non spegne il sistema al termine del periodo di inattività:
  1. Analizza il log corrente dello script e annota il punto di blocco (push fallito, AppleScript, permessi, ecc.).
  2. Verifica che `osascript -e 'tell application "System Events" to shut down'` sia consentito (permessi Accessibility / Automation).
  3. Se necessario prova l’alternativa documentata (`sudo shutdown -h now`) previa approvazione.
  4. Documenta la causa e le azioni correttive (es. mancati permessi, timer mai raggiunto, watcher non rileva inattività).

## 6. Aggiornamento log e tracciabilità

- Ogni intervento del Guardian deve produrre un nuovo file log in `test-results/auto-commit-guardian/` con convenzione `<timestamp>-<stage>.log`.
- Riporta nel log:
  - Prompt ID in corso (es. `GUARDIAN-AUTOPUSH-2026-01-14-1`).
  - Branch e commit message coinvolti.
  - Output (lint/test/build/kanban) e stato finale (success/fail + follow-up richiesto).
- Se il problema persiste dopo NP-161 o dopo l’indagine shutdown, apri immediatamente un nuovo prompt di escalation nel Kanban.

## 7. Checklist rapida

- [ ] AutoPush watcher attivo.
- [ ] Auto Shutdown attivo.
- [ ] Log guardia creati/aggiornati.
- [ ] In caso di fallimento commit/push → NP-161 eseguito.
- [ ] In caso di fallimento shutdown → causa investigata e documentata.
- [ ] Evidenza salvata in `test-results/auto-commit-guardian/` e citata nel prompt di consegna.
