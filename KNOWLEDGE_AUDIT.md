# Knowledge Base Audit — RPG Balancer

**Data:** 2026-10-05 · **Desiderata:** `.mw/desiderata.md` v25 (FROZEN) · **Fase:** 1 — audit read-only
**Metodo:** inventario filesystem + lettura artefatti di autorità + confronto divergenze. Build on PLAN-011 (`KNOWLEDGE_INVENTORY.md`, `KNOWLEDGE_CONFLICTS.md`, `docs/SOURCE_PRIORITY.md`).

**Scope:** `.claude/` (2690 file, IDE-internal) escluso. `.mw/runs/` escluso (ephemeral, gitignored).

---

## A. Struttura attuale e problemi

| Zona | File .md | Ruolo osservato | Stato |
|---|---|---|---|
| Root | ~46 | governance + stato + design + guide + report one-off | misto, senza marker uniformi |
| `context/` | 10 | DECISION_LOG (attivo), INDEX curato (~50 voci), reference VS | buono |
| `plans/` | 21 | PLAN-*.md con status in frontmatter | **nessun INDEX/registry** |
| `ROADMAP.md` | 1 | tabella plan→status (Oct 3) | registry de-facto, parziale |
| `src/docs/docs/` | ~495 | massa documentale: plans (139), idle_village+trusted, art-direction, analytics, balancer, QA, archive | nessun indice per tipo |
| `src/docs/plans/` | 1 | orfano | — |
| `prompts/` | 104 | task prompts (ADR001-T*, CDA-*, ART-DIR-*) | ops artifacts, alcuni marker ADR |
| `coordinator/` | 109 | manual-dispatch queue (74 pending + 20 completed) + 4 doc | ops + 1 doc di autorità nascosta |
| `test-results/` | 92 | evidence logs referenziati dai trusted docs | ok come evidence |
| `.mw/` | 79 | INDEX (5 link), desiderata v24, specs/ (11), plans/, archive | **specs/, plans/, runs/ gitignored** |
| `.windsurf/rules/` | 12 | invarianti, governance, philosophy | ok ma vedi C5 |
| `.windsurf/skills` = `.devin/skills` | ~12 ×2 | **alberi identici duplicati** | drift risk |
| `~/progetti_personali/.windsurf/` | rules + 8 skill | **scope condiviso con contenuto RPG-specifico** | leak cross-project |
| `_OLD_DEPRECATED/` | 73 | esplicitamente deprecato | ok |
| `archive/` | 5+ | handoff/inventory storici | ok |

**Meccanismi di autorità esistenti (funzionanti):**
- `CANON.md` — mappa delle autorità per ~10 domini + tassonomia FACT/DECISION/PROPOSAL/OBSOLETE.
- `context/DECISION_LOG.md` — storia decisioni, attivo (696 righe, Oct 3).
- `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` + `trusted/*_trusted.md` — registry componenti con stati draft/candidate/trusted/frozen/deprecated. **Unico meccanismo di autorità completo, limitato ai componenti.**
- `context/INDEX.md` — catalogo "hot docs" curato (~50 voci).
- `.mw/desiderata.md` — intent ledger versionato (v24 + revisioni).
- `40-documentation-governance.md` — vocabolario stati canonici + change policy trusted.

**Fallimenti strutturali:**
- `KNOWLEDGE_INVENTORY.md` (Aug 30, generato): 48 canonical / 648 "candidate — pending canonical review". **La review non è mai avvenuta**: 648 file in limbo di classificazione. L'inventario stesso è ora stale.
- `KNOWLEDGE_CONFLICTS.md` = "Nessun conflitto rilevato" — il rilevatore (D4: solo conflitti diretti con provenance) ha prodotto falso negativo; i conflitti reali esistono (sezione C).

## B. Knowledge gap

1. **Registry dei piani assente.** 21 `plans/PLAN-*.md` senza INDEX; `ROADMAP.md` copre parzialmente (tabella plan→status ma non regole di registry, non baptism/immutability).
2. **Nessuna autorità per l'architettura tecnica.** 4 documenti concorrenti (C2), CANON non ne nomina nessuno.
3. **Regole gameplay/quest senza fonte canonica unica.** Le regole correnti sono disperse in `.mw/desiderata.md` v23/v24+revisioni (file 1400 righe), `quest-design.md`, DECISION_LOG, PLAN-018/019. `GAMEPLAY_DESIGN.md` (autorità canon per "regole") è fermo a giugno.
4. **Nessun registro di questioni aperte** (equivalente OPEN.md): gli "Still unresolved" vivono dentro le desiderata e il DECISION_LOG, non sono interrogabili.
5. **`.mw/specs/` e `.mw/plans/` gitignored** → conoscenza non versionata, fuori da git-first.
6. **Nessun indice dei ~495 doc in `src/docs/docs/`** per dominio/tipo (IMPLEMENTATION_PLANS_INDEX copre solo i piani, COMPONENT_MASTER_INDEX solo i componenti).

## C. Contraddizioni rilevate

| # | Affermazione A | Affermazione B | Dominio | Note |
|---|---|---|---|---|
| C1 | `MASTER_PLAN.md` body: "Current Phase: Phase 10, Last Updated 2025-12-02"; frontmatter `last_reviewed 2026-07-13` | Lavoro reale Oct 2026: Quest S1, Astrolabe V6.3, World Surface (ROADMAP, DECISION_LOG, SESSION_HANDOFF) | fase corrente | MASTER_PLAN si dichiara SSOT roadmap+phase |
| C2 | `ARCHITECTURE_REFERENCE.md`: "Single Source of Truth — MANDATORY" | `ARCHITECTURE_BIBLE.md` `status: active`; `architecture_state.md`: "Context Router — ogni sessione AI parte da qui"; `ARCHITECTURE.md` plain | architettura | 4 claimant, nessuno in CANON |
| C3 | `DEVELOPMENT_GUIDELINES.md` root (309 righe, Dec 2025) — citato da CANON | `src/docs/docs/DEVELOPMENT_GUIDELINES.md` (246 righe, May 2026) — divergente | regole tecniche | duplicato divergente |
| C4 | CANON: "Piano operativo = `VERTICAL_SLICE_ROADMAP.md`" (v3, June) | `ROADMAP.md` (Oct 3): active = PLAN-008/010/012/… | piano operativo | due registri operativi |
| C5 | `RPG/.windsurf/rules/philosophy.md` | `~/progetti_personali/.windsurf/rules/philosophy.md` — **divergente** e in scope condiviso (leak in tutti i progetti fratelli, incluso mind-weaver) | invarianti | due copie divergenti; quella condivisa inquina contesti non-RPG |
| C6 | ~~`.windsurf/skills/*` vs `.devin/skills/*`~~ | **CORRETTO 2026-10-05** — entrambi sono già symlink a `coordinator/skills/` (fonte unica). Falso positivo dell'audit. | skill | nessuna azione |
| C7 | desiderata v24 rev.2: regola vittoria = prova-obiettivo + leader vivo | PLAN-018 D-8 implementa calcolo a soglia "non modificato automaticamente" | quest rules | design vs implementazione divergenti, già dichiarato ma non risolto |
| C8 | `idle-village-context.md` (4373 righe) vs `idle-village-context-optimized.md` (370) — entrambi June, nessun marker | — | contesto | quale dei due? Nessuno: stale snapshots |
| C9 | `CURRENT_STATE.md` dice "Ultimo aggiornamento: 2026-08-31" | file modificato Oct 4; contenuto di un mese fa come "stato attuale" | stato | auto-dichiarazione stale |
| C10 | `ACTIVITY_CAPSULE_TESTING_PLAN.md` root (605 righe) vs `src/docs/docs/` omonimo (499 righe) — divergenti | — | test plan | duplicato divergente |

## D. Problemi di autorità

- **CANON copre ~10 domini su ~1100 file.** La mappa è corretta ma il perimetro è una frazione della KB: per qualsiasi domanda fuori dalla lista, l'agente non ha risposta autoritativa.
- **`coordinator/canonical-systems.md`** dichiara obblighi ("Every UI task must verify compatibility…") ma è fuori dalla mappa CANON — autorità nascosta in una directory ops.
- **Tre claim sovrapposti sul "piano/roadmap":** MASTER_PLAN (SSOT autodichiarata), ROADMAP.md (registry vivo), CANON→VERTICAL_SLICE_ROADMAP (piano operativo, stale).
- **Vocabolario stati applicato a macchia di leopardo:** ~120 file con marker su 1118; la policy (40-doc-governance) vale formalmente solo per trusted/frozen components.
- **648 file "pending canonical review"** — l'inventario esiste ma non è mai stato chiuso: de facto nessuna classificazione.
- **`.mw/specs/` non versionato:** spec che dovrebbero essere riferimento non hanno provenance git.

## E. Problemi di retrieval

- **Domanda tipo "regole attuali per la risoluzione quest"** richiede di assemblare: desiderata v23/v24+rev (file 1400 righe, più revisioni embricate), `quest-design.md`, PLAN-018, PLAN-019, DECISION_LOG, GAMEPLAY_DESIGN. Costo di ricostruzione alto; nessun punto d'ingresso canonico.
- **"Qual è lo stato del piano X?"** → nessun registry; ROADMAP parziale.
- **Root flat (~46 file ALL_CAPS)** mescola doc vivi, report one-off (BUG_EXPLANATION_*, DISPATCH-OPS-*, APPROACH_CRITIQUE_V2, DragTestContainer_audit), dump stale (idle-village-context*), senza marker che li distingua.
- **Doc di stato multipli in competizione:** CURRENT_STATE (autodichiarato stale), SESSION_HANDOFF (Oct 3), HANDOFF (Jul, altro progetto), CHANGELOG (Jul, stale), VERTICAL_SLICE_PROGRESS (Jun, stale).
- **Duplicati omonimi root↔src/docs/docs** (C3, C10) — un agente che trova il file sbagliato non ha segnali di quale sia canonico.
- **Skill/rules in tre scope** (`~/.agents`, `~/progetti_personali/.windsurf`, `RPG/.windsurf`+`.devin`) con copie divergenti — l'agente riceve regole RPG anche quando lavora su altri progetti (C5).

## F. Struttura proposta (vincolo: architettura esistente = baseline; solo proposte punto per punto)

F1. **Estendere CANON.md** (proposta, non modifica): aggiungere domini autorità per architettura tecnica, registry piani, regole quest/gameplay, ops dirs (`prompts/`, `coordinator/`, `test-results/` dichiarati artifacts, non knowledge docs).
F2. **Registry piani unico:** scegliere `plans/INDEX.md` (convenzione MW) oppure formalizzare `ROADMAP.md` come registry con regole esplicite. Una proposta, un winner.
F3. **Dedup dei duplicati divergenti:** DEVELOPMENT_GUIDELINES (C3), ACTIVITY_CAPSULE (C10), philosophy.md (C5 — risolvere lo scope leak: la copia condivisa va rimossa o ridotta a pointer), `.windsurf`↔`.devin` skills (C6 — una fonte + symlink/pointer).
F4. **Un solo doc architettura** tra i 4 claimant (C2); gli altri → `superseded` con rimando.
F5. **Marking stale massivo minimo:** HANDOFF, PRODUCT_ROADMAP, VERTICAL_SLICE_PROGRESS, CHANGELOG, idle-village-context*, KNOWLEDGE_INVENTORY (stale) → frontmatter `status: historical`/`deprecated` o `archive/`.
F6. **Doc canonico regole quest:** estrarre in un file canonico lo stato corrente delle regole (da desiderata v24 + quest-design + DECISION_LOG) come *riferimenti*, non spostamenti — le desiderata restano la storia.
F7. **Decidere `.mw/specs/`:** tracked o dichiarato ephemeral (proposta; attualmente gitignored = conoscenza senza provenance).
F8. **Indice per dominio di `src/docs/docs/`** (estendere IMPLEMENTATION_PLANS_INDEX o nuovo docs INDEX), a completamento di COMPONENT_MASTER_INDEX.
F9. **Chiudere o ritirare KNOWLEDGE_INVENTORY/CONFLICTS:** o si completa la review dei 648 candidate, o si marca lo strumento come one-shot storico — non lasciarlo come pseudo-autorità.

## G. Piano di migrazione (solo dopo approvazione; ogni punto reversibile)

1. **F5 prima** — marking stale: basso rischio, alto valore retrieval immediato (frontmatter, nessun move).
2. **F3 dedup** — diff completo prima di ogni merge; il perdente va in `archive/` con rimando, mai delete.
3. **F2 registry** — creare il registry scelto dal censimento dei 21 plan (status da frontmatter + ROADMAP).
4. **F1+F4 patch CANON** — presentate come proposte numerate punto per punto; ogni punto applicato solo dopo avallo.
5. **F7 specs** — decisione Director; se tracked, `git add` senza move.
6. **F6+F8** — task da piano dedicato (estrazione regole quest, indice docs) — non in questa migrazione se si vuole restare minimali.

## H. Risk assessment

- **Merge di duplicati divergenti** può perdere contenuto → mitigazione: diff report prima del merge + archive del perdente (mai delete).
- **Trattare KNOWLEDGE_INVENTORY come verità** → è stale e classificato per euristica: usato solo come mappa di massa, mai come classificazione finale.
- **Big-bang restructure** violerebbe MW-P-005/010 → tutte le mosse sono incrementali e reversibili.
- **Estrarre regole dalle desiderata** rischia edit de-facto di contenuto FROZEN → F6 è solo compilazione di riferimenti; le desiderata non si toccano.
- **Tracciare `.mw/specs/`** può aggiungere churn git ma è una decisione binaria esplicita, non default.
- **Questo report stesso** rischia di diventare un altro root doc stale → registrato in `context/INDEX.md`; la sua utilità è nel produrre le proposte F1–F9, non come riferimento permanente.

---

## Proposte per gli artefatti di architettura (punto per punto)

1. **CANON.md** — aggiungere righe autorità: architettura tecnica → `src/docs/docs/architecture_state.md` (router canonico, creato); registry piani → `plans/INDEX.md` (creato); regole quest → `quest-design.md` + desiderata come fonte intento; `coordinator/`, `prompts/`, `test-results/` → ops artifacts; `ROADMAP.md` → marcato superseded da `plans/INDEX.md` o ridotto a direzione/priorità.
2. **`~/progetti_personali/.windsurf/skills/`** — le skill RPG-only in scope condiviso (auditor-sentinel, fixer-task, guardian-mandate + copie dei mandate già in `coordinator/skills`) continuano a leak-are sui progetti fratelli; rimozione/spostamento da decidere. `work-ticket` è SIXSTER/work-solver, non RPG — resta.
3. **AGENTS.md / rules** — regola "sync stato": quando `SESSION_HANDOFF.md` registra un milestone completato, `CURRENT_STATE.md` va aggiornato (meccanismo proposto dal Director come domanda — Q6).
4. **Regole quest canoniche (F6)** — il Director vuole un doc canonico aggiornato quando cambia idea, con domande dell'AI in caso di divergenza (Q7): è un task di piano separato, non di questa migrazione.

---

## Decisioni Director + azioni eseguite — 2026-10-05

Risposte del Director alle domande estese Q1–Q10 e azioni applicate.

**Eseguito:**
- **Q4/C5:** `~/progetti_personali/.windsurf/rules/philosophy.md` rimossa (leak cross-project). La sezione Guardian deploy (unica, assente altrove) è preservata in `.windsurf/rules/60-guardian-deploy.md`.
- **Q8:** `.mw/specs/`, `.mw/plans/`, `.mw/bugs/`, `.mw/templates/` + i `plans/*.md` non tracciati (18 file) + `context/MIND_WEAVER_MULTI_AI_PROTOCOLS.md` ora tracciati — commit `547238c9`. Restano ignored (voluto): `.mw/runs`, `providers`, `catalog`, config deliberazione, `venv`, `bin`, `manual-dispatch`, `telegram-state`, `observation.jsonl`.
- **F5 stale-marking:** banner `HISTORICAL`/`STALE`/`SUPERSEDED`/`DIRECTION` su: HANDOFF, CHANGELOG, VERTICAL_SLICE_PROGRESS, VERTICAL_SLICE_ROADMAP (stale-da-verificare), PRODUCT_ROADMAP (direzione da riallineare), idle-village-context (+optimized), KNOWLEDGE_INVENTORY, KNOWLEDGE_CONFLICTS, src/docs/docs/DEVELOPMENT_GUIDELINES (dup), root ACTIVITY_CAPSULE_TESTING_PLAN (dup), ARCHITECTURE_REFERENCE, ARCHITECTURE_BIBLE, ARCHITECTURE (→ reference).
- **Q1/F4 architettura:** nessuno dei 4 claimant era corrente → promosso `architecture_state.md` a **router canonico** dominio→fonte (forma giusta, contenuto riscritto).
- **Q2/F2 registry:** creato `plans/INDEX.md` (convenzione MW alleggerita: vocabolario stati, INDEX vince sui frontmatter). Censimento completo 21+2 file, merge frontmatter+ROADMAP.

**Decisioni delegate applicate:**
- **Q6 stato:** `SESSION_HANDOFF.md` = journal vivo (de facto); `CURRENT_STATE.md` = snapshot curato. Regola di sync → proposta #3.
- **Q9 inventory:** INVENTORY/CONFLICTS marcati one-shot storici; nessuna rigenerazione ora.
- **Q10 PRODUCT_ROADMAP:** mantenuto come direzione, marcato "da riallineare".

**Resta gated (serve avallo punto per punto):**
- Proposte #1 (righe CANON.md), #2 (skill shared-scope), #3 (regola sync stato), #4 (doc canonico regole quest come piano).

**Avallo Director 2026-10-05 — eseguito:**
- **#1 approvata:** righe autorità aggiunte in `CANON.md` (architettura → `architecture_state.md` router; piani → `plans/INDEX.md`; quest → PLAN-020; ops artifacts dichiarati; `ROADMAP.md` marcato `SUPERSEDED`, contenuto assorbito nell'INDEX).
- **#2 eseguita:** skill RPG-only spostate da scope condiviso a `RPG/coordinator/skills/` (`guardian-mandate`, `auditor-sentinel`, `fixer-task`); le 4 copie mandate divergenti e più vecchie (Mar–Apr) rimosse — le versioni RPG (Jul–Aug) restano uniche in `coordinator/skills`. `work-ticket` (SIXSTER) lasciata in scope condiviso.
- **#3 deciso dall'AI (delega «dimmi tu»):** regola in `.windsurf/rules/70-state-docs-sync.md` — SESSION_HANDOFF journal, CURRENT_STATE snapshot aggiornato nella stessa sessione.
- **#4 avviata:** `plans/PLAN-020-quest-rules-canonical-doc.md` creato (`proposed`) — produce `QUEST_RULES.md` canonico + regola "aggiorna su nuove affermazioni del Director + domanda su divergenza"; registrato in `plans/INDEX.md`.
