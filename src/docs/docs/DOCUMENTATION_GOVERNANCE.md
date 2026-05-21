# Idle Village Documentation Governance Pack

**Aligned with Project Philosophy:** See [PROJECT_PHILOSOPHY.md](PROJECT_PHILOSOPHY.md) for weight-based creator pattern and design system
**Aligned with Master Plan:** See [MASTER_PLAN.md](MASTER_PLAN.md) for separation of concerns (plans vs tasks)
**Aligned with Development Guidelines:** See [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) for config-first rules
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for freezing semantics

---

## 1. Policy ufficiale — Single Source of Truth + Freeze Governance

### Scopo
Evitare divergenze tra:
- documentazione generale
- documentazione per componente
- runtime reale
- implementazioni parziali o regressioni

### Principio base
Per ogni componente o contratto esiste **una sola documentazione autoritativa**.

La documentazione generale:
- orienta
- indicizza
- collega
- non ridefinisce il contratto

La documentazione trusted:
- definisce il contratto
- è la source of truth
- va aggiornata quando il componente cambia davvero

### Regole obbligatorie

#### Regola 1 — Una sola fonte di verità
Ogni componente o integration contract deve avere un solo documento trusted/autoritativo.

#### Regola 2 — La documentazione generale non duplica
I documenti generali non devono copiare:
- component contract
- runtime contract
- props contract
- source-of-truth rules
- acceptance criteria dettagliati

Devono invece riportare:
- nome
- stato
- link al trusted doc
- test page / integration page
- ultima certificazione

#### Regola 3 — Se cambia il componente freezeato, cambia anche la doc trusted
Un task su un componente `trusted` o `frozen` **non è completato** finché non sono stati aggiornati:
1. codice
2. test / verification
3. trusted doc corrispondente
4. status / metadata del componente

#### Regola 4 — Nessun freeze senza evidenza
Un componente non può diventare `trusted` o `frozen` senza:
- verifica runtime
- acceptance criteria passati
- evidence log
- doc trusted aggiornata
- riferimento alla pagina di test/integration

#### Regola 5 — Nessuna modifica implicita di contratto
Se un task cambia:
- comportamento
- visual grammar
- overlay/interaction contract
- source-of-truth usage
- binding runtime

allora deve dichiarare esplicitamente che sta cambiando il contratto.

#### Regola 6 — Il runtime batte la narrazione
Se:
- il doc dice A
- il runtime mostra B

allora il componente NON è considerato freezeato correttamente.

#### Regola 7 — `/test` non è source of truth architetturale
Le pagine di test possono essere:
- reference comportamentale
- harness utili
- prova di interazione

Ma non definiscono da sole il contratto canonico.

#### Regola 8 — Trusted Component Registry (MASTER_PLAN.md §96)
Prima di creare qualunque nuova superficie roster/list PG o modificare componenti esistenti, verifica se il componente richiesto è già presente/approvato nella registry.
- Source: `src/docs/docs/idle_village/roster_trusted_components.md`
- Imports obbligatori: Tutti i consumer devono importare attraverso `src/ui/idleVillage/roster/index.ts`
- Componenti legacy rimangono in `_OLD_DEPRECATED/` e non possono essere referenziati nelle nuove implementazioni

### Stati consigliati del componente/contratto
- `draft`
- `candidate`
- `trusted`
- `frozen`
- `deprecated`

### Procedura di freeze
Un componente passa a `frozen` solo se:
1. il componente è corretto nel runtime previsto
2. il contratto è stato definito chiaramente
3. esiste una pagina/harness di verifica o una pagina runtime affidabile
4. i test minimi utili sono presenti
5. il trusted doc è aggiornato
6. esiste evidenza
7. è stato creato un checkpoint git / tag / branch di riferimento

### Clausola obbligatoria da inserire nei task
> If the task changes the behavior, visual contract, runtime contract, or source-of-truth usage of a trusted/frozen component, the corresponding trusted documentation must be updated before the task can be considered complete.

---

## 2. Template — Master Index

```md
# Idle Village Component Index

## Scopo
Indice unico dei componenti e integration contracts rilevanti per la vertical slice.

## Regole
- Questo file NON definisce i contratti.
- Questo file linka i documenti trusted.
- Ogni riga deve puntare a una sola source of truth.

## Tabella componenti

| Component / Contract | Area | Status | Source of Truth | Runtime/Test Page | Last Certified | Owner / Notes |
|---|---|---|---|---|---|---|
| Time Engine Contract | time | draft | `src/docs/docs/idle_village/time_engine_trusted.md` | `/minimal-gameplay` | YYYY-MM-DD | Single tick source |
| Roster Drag Contract | roster/drag | trusted | `src/docs/docs/idle_village/roster_trusted_components.md` | `/test` / `/minimal-gameplay` | YYYY-MM-DD | Overlay canonico |
| POI Standard Contract | poi | draft | `src/docs/docs/idle_village/poi_standard_trusted.md` | dedicated page | YYYY-MM-DD | ActivityCapsule family |
| POI Detail Contract | poi-detail | draft | `src/docs/docs/idle_village/poi_detail_trusted.md` | dedicated page | YYYY-MM-DD | PoiDetailSkinWrapper |
| Day/Night Contract | day-night | draft | `src/docs/docs/idle_village/daynight_trusted.md` | dedicated page | YYYY-MM-DD | Same POI family grammar |
| Roster ↔ Slot Integration Contract | integration | draft | `src/docs/docs/idle_village/roster_slot_integration_trusted.md` | integration page | YYYY-MM-DD | Drag/drop/assign |
| POI ↔ Activity Integration Contract | integration | draft | `src/docs/docs/idle_village/poi_activity_integration_trusted.md` | integration page | YYYY-MM-DD | start/progress/collect |

## Regole di aggiornamento
- Se cambia il contratto di un componente, aggiornare il suo trusted doc.
- Aggiornare qui solo:
  - status
  - link
  - runtime/test page
  - data ultima certificazione
- Non copiare qui i dettagli del contratto.
```

---

## 3. Template — Trusted Component Doc

```md
# <Component Name> — Trusted Contract

## Metadata
- Status: `draft | candidate | trusted | frozen | deprecated`
- Area: `<time | roster | drag | poi | poi-detail | integration | resources>`
- Canonical Name: `<official component/contract name>`
- Primary Files:
  - `path/to/fileA`
  - `path/to/fileB`
- Runtime/Test Pages:
  - `/route-a`
  - `/route-b`
- Last Certified: `YYYY-MM-DD`
- Last Updated By: `<agent/user>`
- Related Contracts:
  - `[Other trusted doc](relative-link.md)`

## 1. Purpose
Breve descrizione di cosa fa il componente/contratto e perché esiste.

## 2. Source of Truth
Indicare chiaramente:
- dove vive lo stato canonico
- da quali file/store/hook deve leggere
- quali fonti NON sono autoritative

## 3. Canonical Runtime Contract
Descrivere il comportamento runtime vero.

### Deve
- ...
- ...
- ...

### Non deve
- ...
- ...
- ...

## 4. Visual Contract
Descrivere:
- come deve leggere visivamente
- quali cue devono essere presenti
- quali cue sono obbligatorie
- cosa conta come fallback/mock/regressione

## 5. Interaction Contract
Descrivere:
- click
- drag
- hover
- drop
- open detail
- assign/remove
- collect/start/cancel

## 6. Data / Props Contract
Elencare solo gli input che contano davvero.

## 7. Integration Rules
Con cosa deve integrarsi e come.

## 8. Acceptance Criteria
- [ ] runtime corretto
- [ ] usa la source of truth giusta
- [ ] visual contract rispettato
- [ ] interaction contract rispettato
- [ ] nessun fallback/mock nel runtime target
- [ ] test/verifica completati

## 9. Verification
### Runtime verification
1. ...
2. ...
3. ...

### Test files
- `tests/...`
- `tests/...`

### Evidence
- `test-results/...`

## 10. Anti-Patterns / Forbidden Outcomes
- non introdurre timer locali
- non usare placeholder JSX come soluzione finale
- non reintrodurre componenti legacy/wrong-branch
- non duplicare source of truth
- non usare `/test` come proof architetturale

## 11. Change Policy
Se questo componente è `trusted` o `frozen`, ogni modifica a:
- behavior
- visual grammar
- runtime contract
- source-of-truth usage

richiede:
1. update del codice
2. verifica runtime
3. update del trusted doc
4. update dei test/evidence se necessario

## 12. Change Log
### YYYY-MM-DD
- cosa è stato cambiato
- perché
- riferimento a task / evidence / checkpoint
```

---

## 4. Procedura operativa consigliata
### Fase A — inventario
- identificare componenti/contratti
- segnare stato iniziale nel master index

### Fase B — fix + verify di un singolo componente
- pagina vuota o runtime target
- test minimo
- acceptance checklist

### Fase C — trusted doc
- compilare/aggiornare il doc trusted
- segnare status `candidate` o `trusted`

### Fase D — freeze
- evidence
- checkpoint git/tag/branch
- status `frozen`

### Fase E — integration pages
- usare solo componenti già trusted/frozen
- documentare il contratto di integrazione separatamente

## 5. Regola finale
La documentazione generale orienta.
La documentazione trusted definisce.
Solo una definisce la verità.
