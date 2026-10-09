---
title: 'PLAN-026 — Quest Generation System: contratti → delta motore v2 → catalogo v0 → testo → integrazione → archi'
status: active
created: 2026-10-10
revised: 2026-10-10 (ratificato dal Director con deroga registrata a v24 §S5 — vedi «Ratifica»)
desiderata: v24 + deroga esplicita Director 2026-10-10 (generazione in parallelo a S3/S4, non dopo)
request: R-115, R-091, R-108, R-111, R-112, R-113, R-114, R-116
parent: PLAN-019 (stadio S5 «oltre lo scritto a mano»)
depends: PLAN-019-S2 (completed); S3/S4 corrono in parallelo — i gate di
  integrazione (P6) restano subordinati a PLAN-019
---

# PLAN-026 — Quest Generation System (v2 ratificata)

Progetto: RpgBalancer
Stato: **active** — ratificato dal Director 2026-10-10 (scelta «Ratifica
ora + engine v2»). Basato su `plan-v2.md` (`.mw/runs/20261009-quest-generation-plan-v2-critique/`),
che incorpora rilievi C1–C9 del cold read r1 e i rilievi tecnici del cold
read r2 assorbiti in `QUEST_GENERATION_CONTRACTS.md` §14.
Tipo: Macro-plan figlio di PLAN-019 (S5), con fasi incrementali e gate.
Obiettivo: generazione di quest meccanicamente significative,
narrativamente coerenti, variabili, capaci di alimentare archi narrativi
persistenti.

## Ratifica e deroga (2026-10-10)

- Cold read r2 (claude/chatgpt/grok/deepseek): **MAJOR REVISION ×4** — il
  nodo strutturale era «v24 dice S5 dopo S4». Il Director ha deciso di
  **ratificare comunque**, con deroga registrata: la generazione procede
  in parallelo a S3/S4; i campi fun-judgment restano `experimental` e si
  rivalidano al gate S4 (§0.1); l'integrazione nel motore canonico (P6)
  resta subordinata ai gate PLAN-019, ma il **delta motore v2**
  (verdictTable + vars + traits + arm misto) è autorizzato subito come
  estensione additiva — switch legacy goblin/rovine intatto.
- La deroga è registrata in `context/DECISION_LOG.md` (2026-10-10) e
  `RICHIESTE.md` R-115.

## 0. Vincoli canonici ereditati — criteri di accettazione di ogni artefatto

I vincoli di `context/QUEST_GENERATION_SPEC.md` §0 sono **criteri di
accettazione bloccanti** in ogni gate: mortalità DD/XCOM (R-105), 3–4
decisioni cruciali (R-108), skill = gestione del rischio con sorprese eque
retrospettivamente, numeri esatti in preview, allarme a stati nominati
(QUEST_RULES §9), TAKEN≠SECURED (v24), coerenza della minaccia (QUEST_RULES
§7b), conseguenze universali (R-092), obiettivo emotivo
(`FINAL-RESOCONTO` §5). Un artefatto che li viola è bocciato a prescindere.

### 0.1 Campi «fun-judgment» marcati experimental

Ogni campo contrattuale che codifica un giudizio di divertimento
(`minSceneHooks`, `weight`, `impactMetric`, soglie di varietà) è
`experimental` e rivalidato al gate S4. La regola 75% è posticipata
(Director 2026-10-10): si osserva sul prototipo prima di fissare soglie.

## 1. Obiettivo e risultato atteso

Sistema che produce quest da componenti strutturati combinabili, con
responsabilità separate: design meccanico, composizione narrativa,
istanziazione del mondo, realizzazione testuale, validazione/valutazione.
Fuori dal primo rilascio: generazione autonoma completa, regole inventate
dal modello, sostituzione del motore, main quest completamente dinamiche.

### 1.1 Posizione e sequenza

Figlio di PLAN-019 (S5), non una roadmap concorrente. Attivazione delle
fasi: **P0–P2, T2 (delta motore) attivati dalla ratifica**; P3–P5 seguono
T2; P6 subordinato ai gate PLAN-019; P7 gated (OPEN-016 + ratifica archi).

## 2. Stato di partenza (2026-10-10)

| Risorsa esistente | Ruolo | Limite |
|---|---|---|
| PLAN-019 macro-plan | Sequenza S1–S5, gate | Non sostituirlo |
| `QUEST_GENERATION_CONTRACTS.md` | **Contratti v0 autoritativi** (CoreGimmick/SceneArchetype/TwistDef/DomainKit/TraitDef/NarrativeBrief + OutcomeSpec §12 + gap verificati §10) | Questo piano li cita, non li duplica |
| `QUEST_GENERATION_SPEC.md` | Specchietto living doc (fonte d'intento) | — |
| `questScenario.schema.ts` | Schema canonico (S2.1): ogni emissione passa `parseQuestScenario` | Si estende additivamente (verdictTable), legacy preservato |
| `questRun.ts`/`useQuestRun`/`QuestRunWindow` | Runtime canonico (`applyNodeOutcome` switch legacy = P0-a) | Delta v2 additivo |
| `questSimulation`/`exploreScenario`/coverage | Validazione esistente | Riutilizzo obbligatorio |
| `questPois`/`DANGER_BANDS`/`resolveQuestOffer`/`ScenarioInstance` | Offerta + istanza congelata (S2.3) | Posto naturale del twist deck |
| `useQuestExpeditionSession`/`QuestExpeditionDetail` | Planning surface (S2.4) | Il generatore alimenta, non duplica |
| `ResidentState` | DECISO: `traits: string[]` qui | Da implementare (P5) |
| `PersistenceService` | Unico canale (journal per-effetto S2.5) | — |

## 3. Architettura logica

Pipeline a 7 fasi (contratti §1): input → CoreGimmick → skeleton
SceneArchetype → bind DomainKit+TraitDeck+TwistDeck → emit
`QuestScenario` conforme allo schema → NarrativeBrief→testo→validazione →
validazione strutturale+MC+failure-mode → `ScenarioInstance` → offerta.

Regole di autorità: regole nei dati/codice autorizzato; testo descrive,
non modifica; condizioni e conseguenze verificabili senza LLM; runtime
mai dipendente da provider (generazione offline/autore); v0 = **catalogo
pre-generato** offline, non generazione-on-offer.

## 4. Contratti — rinvio

Contratti di dati: `QUEST_GENERATION_CONTRACTS.md` (CoreGimmick §2,
SceneArchetype §3 con `verdictTable`, TwistDef §4 con `arm` misto,
DomainKit §5 con `threatProfile`, TraitDef §6, NarrativeBrief §7,
OutcomeSpec/GotoSpec §12). Modifiche ai contratti → si registrano lì.

### 4.6 Testo generato — provenance e traducibilità

Contenuto authored nei campi presentazione (`PRESENTATION_KEYS` — fuori
dall'hash contenuto). **Formato traducibile obbligatorio** (decisione
Director): chiavi `scenario.<id>.nodes.<n>.{title,body,transit,verdict.<v>}`,
niente grammatica dipendente dall'ordine italiano, niente interpolazione
manuale. Generazione LLM offline/autore su artefatti versionati.

## 5. Fasi

- **P0 — Audit/baseline**: residuo §2.1 dei contratti (mappa
  riusare/adattare/isolare completata nei contratti §10; baseline authored
  goblin/rovine; comandi reali verificati).
- **P1 — Contratti → Zod eseguibile + generatore strutturale**: vincolo
  `parseQuestScenario` su ogni emissione; coverage `exploreScenario`.
  **T2 = delta motore v2** (autorizzato dalla ratifica): `verdictTable`
  dichiarativa + `vars` numerici + `traits` su `ResidentState` + arm
  misto (`rollFlag` copre runstart/inrun). Unico blocco coerente, additivo.
- **P2 — Domain kit**: schema kit + regola 7b wiring + fallback `adjacent`.
- **P3 — Generazione narrativa controllata**: strategia provider esplicita
  (Mind Weaver; groq rifiuta payload ~40KB+ → brief compatti per nodo;
  fallback multi-provider, gate ≥1 provider reale); budget dichiarato;
  formato traducibile §4.6.
- **P4 — Validazione semantica/repair/benchmark**: controlli deterministici
  + rubrica + repair a livello scenario (rigenera dal seed) + held-out.
- **P5 — Twist del party**: `traits` su ResidentState (prerequisito
  deciso), propagazione snapshot, badge `visibleInPlanning`, cap negativi.
- **P6 — Integrazione**: subordinata ai gate PLAN-019 (D-2 inclusa).
- **P7 — Archi narrativi**: gated su OPEN-016 + ratifica Director + P1–P6
  stabili. Persistenza conseguenze via settlement standard (S2.5).

## 6. Prototipo v0 (perimetro vincolante)

1 CoreGimmick (`gara-di-avanzamento`), 5 SceneArchetype su 5 famiglie, 2
DomainKit (`passo-montano`, `palude`), 3 TraitDef (avido/scavezzacollo/
prudente), 3 TwistDef (interferenza/deviazione/conseguenza-ritardata), 4
politiche MC. Accettazione: nessuna politica dominante, ≥1 ramo-twist con
witness, `crucial∈[3,4]`, banda misurata=dichiarata, 0 errori schema/
coverage. Prototipo = prova di fattibilità, non generalità.

## 7–9. Test, benchmark, versioning

Strumenti esistenti (contratti §8): Zod parse, superRefine, exploreScenario
coverage, check 4 proprietà, failure-mode catalog, MC 4 politiche × ≥2
party, `deriveOfferBand`, validatore+critica testo, equità indizi.
Metriche fun-judgment `experimental` fino a S4.

## 10. Governance

Figlio di PLAN-019 (questo file, `active` in `plans/INDEX.md`).
`Documentation Impact: REQUIRED` per fase. OPEN/REJECTED aggiornati per
questioni reali. Fonte intento = `QUEST_GENERATION_SPEC.md`; fonte
contratti = `QUEST_GENERATION_CONTRACTS.md`; questo piano = livello
operativo. Nessuna quarta fonte.

## 11. Rischi

R1–R9 da v1, più: R10 prematurezza vs v24 (**accettato con deroga
registrata**, mitigato da experimental fino a S4 + P6 gated); R11 provider
indisponibili/payload (strategia P3); R12 delta motore contaminato (unico
blocco coerente, legacy intatto); R13 generazione on-offer scartata (v0 =
catalogo offline).

## 12. Definition of Done

Artefatti conformi a `QuestScenarioSchema`; conformità §0 dimostrata su
corpus held-out; provenance/traducibilità verificata; provider fallback
dimostrato; delta motore v2 con test e legacy signature invariate.

## 13. Prossimi task

- T0 — completamento audit residuo + baseline authored. *(Gap motore già
  verificati: contratti §10.)*
- T1 — **fatto** (contratti v0) → consolidamento a Zod eseguibile.
- **T2 — delta motore v2** (verdictTable + vars + traits + arm misto,
  unico blocco additivo) + generatore strutturale.
- T3 — primo dominio + primo imprint su catalogo v0.
- T4 — generazione narrativa offline (provider strategy P3) + benchmark.
- T5 — twist del party (prerequisito: `traits` su ResidentState).
- T6 — integrazione dopo gate PLAN-019 pertinenti.
- T7 — archi narrativi: gated (OPEN-016 + ratifica).
