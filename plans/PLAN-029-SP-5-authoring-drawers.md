---
title: 'PLAN-029 SP-5 — Authoring drawers'
status: candidate
created: 2026-10-12
parent: PLAN-029
debate: mw-web-debate `20261012-quest-gen-lab-sp5-authoring-drawers` — artifact r003
  converged 3/3 eligible (deepseek ACCEPT + nota non-bloccante assorbita;
  chatgpt ACCEPT; gemini ACCEPT; grok provider_dead — terzo run consecutivo,
  2 prompt consegnati, zero generazioni)
artifact_sha256: 7d2b42d408285b9fcf0f7c4ebcdcadeac97a095a044c3b090e2930a36126d57f
depends_on: PLAN-029 SP-1 (kitSchemas/tuning schemas/canonicalize), SP-2
  (LabCandidate, provenance.effectiveKit/effectiveTuning, page useReducer,
  STALE input-set, tuningFormDescriptors), SP-3/SP-4 (consumers)
---

# SP-5 — Authoring drawers — artifact r003

3 revisioni. r003 assorbe: deepseek REVISE r001 (B-1 kitId guard come invariant
non filtro; B-2 proprietà dell'input-set a SP-2; B-3 lifetime del picker
what-if) + caveat C-1..C-6; chatgpt OBJECT (R-1 kitHash risolta citando SP-2
riga 37 verbatim — verificata dall'orchestrator; optional-field deletion;
prod fallback silenzioso); gemini ACCEPT entrambi i round.

## 0. Scope

W5 di PLAN-029: drawer a tab per editare gli input di generazione
(copy/parametri dei kit **authored**, override di tuning) + corsia party
what-if, con semantica STALE-draft onesta. NON possiede: creazione/detach di
nuovi kit (v1.1), persistenza (SP-6), gate di validazione output (SP-3/SP-4),
editing del gimmick (input del picker), la definizione dell'input-set STALE e
la semantica di kitHash (entrambe di SP-2).

Decisioni vincolanti A1–A7 (grounding ledger): le tre superfici esistono tutte
in v1; draft = stato di override nel reducer di pagina, session-scoped; DRAFT
non è uno stato nuovo — è SP-2 STALE(inputs-diverged); validazione a due tier;
kit narrated read-only; what-if = corsia di sola esecuzione; solo edit-in-place.

## 1. Override model — `AuthoringSlice` nel page reducer SP-2

```ts
type KitOverrideDraft = {
  kitId: KitId;                          // INVARIANT, non filtro
  scalars?: Partial<Pick<RaceDomainKit,'prefix'|'title'|'flavour'|'objective'|'intelId'>>;
  names?: Partial<RaceDomainKit['names']>;
  copy?: { perScene: Partial<Record<SceneId, SceneCopyOverride>> };
};
type SceneCopyOverride = { title?; body?; failHint?; option?:{label?;detail?};
                           verdictFlavor?: Partial<VerdictFlavorMap>; outcomeLog?; };
type TuningOverrideDraft = { baseTuningHash: string; patch: DeepPartial<Tuning> };
type AuthoringSlice = { kitOverride: KitOverrideDraft|null;
                        tuningOverride: TuningOverrideDraft|null;
                        whatIf: WhatIfSlice };
```

- Single-slot, session-scoped; `SELECT_KIT`/`SELECT_TUNING` droppano
  l'override corrispondente (unico meccanismo di discard — niente buffer
  per-entry).
- **`kitId` mismatch = errore bloccante in OGNI ambiente**: throw in dev, e
  `IncompatibleOverride` tipato in prod → badge + **Regenerate disabilitato**;
  mai un candidato generato da un kit di fallback. Con SELECT_KIT che droppa
  la slice il branch è defensive-unreachable; se raggiunto non può produrre
  un candidato col kit sbagliato.
- **Semantica campi opzionali**: una chiave di override può SETTARE un valore
  o essere ASSENTE (= eredita). Cancellare un campo opzionale ereditato NON è
  esprimibile in v1 — l'editor offre "set" e "revert field", mai
  "clear to absent". Scene set fisso (solo scene toccate compaiono; no
  add/remove/reorder).
- `baseTuningHash`: se ≠ hash canonico della base picker al momento della
  materializzazione → badge non bloccante "base tuning changed — patch
  reapplied"; la patch si applica comunque.
- Actions: `kitOverride/setField`, `kitOverride/setSceneField`,
  `kitOverride/revert`, simmetriche per tuning, `whatIf/*`.

## 2. Materialization contract — UN solo path puro

`materializeEffectiveKit(registryKit, kitOverride|null)` /
`materializeEffectiveTuning(pickerBaseTuning, tuningOverride|null)`.

- Chiamata UNA volta a Regenerate: lo stesso oggetto → `kitHash`,
  `generate()`, snapshot `provenance.effectiveKit`. Niente lazy getter verso
  la provenance.
- Base tuning = selezione canonica del PICKER, mai snapshot di un candidato.
- Chiude con `stripUndefinedDeep`+canonicalize di SP-1. Registry mai mutato
  (freeze test).

## 3. STALE-draft wiring — SP-2 possiede l'input set

- L'input set `{gimmickId, kitId, effectiveKit, effectiveTuning}` e il
  confronto canonicalizzato sono **contratto di SP-2**; i cambi del picker su
  gimmick/kit/tuning flippano STALE indipendentemente dai drawer. SP-5
  sostituisce solo i valori materializzati in quel confronto — non può
  spostare i paletti di STALE.
- Conseguenze intenzionali: edit campo→STALE; revert manuale a
  identico→NON STALE; regenerate→NON STALE.
- **Invariante di isolamento** (test nominato `whatIf-never-affects-staleness`):
  lo stato whatIf è strutturalmente incapace di entrare in
  `currentGenerationInputs` — il tipo dell'input del confronto non lo include;
  test di regressione su staleness/provenance/scenarioHash.
- STALE e INVALID coesistono e sono mostrati ENTRAMBI.
- `kitHash` = sha256(canonical(effectiveKit)) per contratto SP-2 (verificato,
  PLAN-029-SP-2 riga 37) — gli override cambiano kitHash per costruzione,
  nessuna nuova semantica di hash.

## 4. Editor surfaces — un drawer, tre tab

`[ Kit ] [ Tuning ] [ What-if ]`, collassabile, adiacente a picker/detail
column; stato open/tab = solo presentation. Footer: Revert + Regenerate +
lista issue schema.

- **Tab Kit** (authored): header kit id + badge provenance; scalars, names,
  accordion per-scena (title, body[textarea], failHint,
  option{label,detail}, verdictFlavor.*, outcomeLog); marker "modified"
  per campo + revert per campo.
- **I campi copy editano prosa authored** — dato di config, non UI chrome:
  l'invariante i18n governa le *stringhe dell'interfaccia*; il copy dei kit è
  contenuto di gioco in `src/balancing/config/**`, per convenzione esistente
  fuori da i18n. Tutte le stringhe del drawer restano chiavi i18n.
- **Tab Tuning**: form descriptor-driven (SP-2 `tuningFormDescriptors`) →
  `patch`; marker/revert; badge di base-drift.
- Drawer subscribe per-campo (granularità da selector), non whole-slice.

## 5. What-if lane — solo esecuzione, lifetime ratificato

- Selezione preset party **lifted** a page state, condivisa tra lane e
  GenRunPlayer (una sola sorgente). **Lifetime: lab-session-scoped — muore
  con la navigazione come gli override; mai persistito** (test asserisce che
  nessuna chiamata di persistenza lo trasporta).
- Stima opzionale via `estimateForPartyAsync`-style — in scope solo con
  zero cambi di firma e lo stesso instance path del gate mc; altrimenti
  solo picker (cut line).
- La stima/run di GenRunPlayer opera sulla STESSA selezione condivisa — una
  sola stima a schermo.
- Isolamento per §3; stima etichettata what-if; il gate mc resta legato a
  `referenceParty` (SP-4).

## 6. Narrated kits — read-only

- Rilevati via marker di artefatto generato; tab kit = summary read-only +
  "Detach & edit" disabilitato con reason i18n ("v1.1"). Disabled-and-reason,
  mai editable-then-rejected.
- Override di tuning su kit narrated: CONSENTITI. **Conseguenza di
  provenance** (testata in T-3, consumata da SP-3/SP-4 senza casi nuovi):
  candidato con `provenance.kitId` → artefatto narrated, `effectiveKit`
  byte-identical, `kitHash` = hash registry-derived, `effectiveTuning`
  diverso — prima forma di candidato in cui kitHash == registry ma gli input
  di generazione differiscono dai default.
- What-if sempre disponibile.

## 7. Validation UX — due tier

- **Tier-1 inline** (per keystroke, amber, mai blocca la digitazione; label
  "shape checks, not schema").
- **Tier-2 hard gate a Regenerate**: `kitSchema.safeParse` + `tuningSchema`;
  fallimento → niente generazione + lista issue strutturata {path, messaggio
  i18n, jump-to-field}; draft invalidi restano editabili.
- T-4 include il parity test: ogni check Tier-1 derivato da vincoli
  kitSchema ha una fixture che asserisce identico accept/reject sugli input
  di boundary; check hand-written elencati e parity-testati.

## 8. Tasks

| T | Task | Test |
|---|------|------|
| T-1 | tipi override + materializers + canonicalization | round-trip unchanged; nested edits preservano sibling; registry frozen; kitId mismatch → dev throw / prod IncompatibleOverride → Regenerate disabled, NO fallback; baseTuningHash drift → badge |
| T-2 | reducer slice + actions | edit/revert roundtrips; SELECT_KIT/TUNING droppa override |
| T-3 | STALE wiring (alimenta solo il confronto SP-2) | edit→STALE; revert-identical→not STALE; regenerate→not STALE; `whatIf-never-affects-staleness`; kitHash cambia con gli edit; **fixture narrated+tuning** (kitId→narrated, effectiveKit byte-identical, kitHash registry-derived, tuning diverso) |
| T-4 | validazione due tier + parity fixture | inline mai blocca; schema fail → niente candidato + path/jump issue; ogni check Tier-1 parity-testato vs kitSchema |
| T-5 | drawer kit+tuning | tutti i campi raggiungibili; marker/revert; tuning descriptor-driven; badge base-drift |
| T-6 | what-if lane (selezione condivisa lifted) | single source lane+GenRunPlayer; nessuna persistenza; stima = zero-signature-change o cut |
| T-7 | narrated read-only | nessun campo editabile; detach disabled+reason; tuning funziona su narrated |
| T-8 | e2e regression | loop completo edit→stale→regenerate→revert; garanzie SP-2/3/4 non indebolite |

## 9. Non-goals (v1)

Nuovi kit id/namespaces; duplicate-and-edit; narrated detach/fork; draft
buffer per-entry; override multi-slot; scene add/remove/reorder; gimmick
editing; rich text; persistenza (SP-6); mutazione registry; ri-validazione
output (SP-3); MC retarget (SP-4); ridefinizione di kitHash/input-set STALE
(SP-2).

## 10. Flag rulings

- F-1: campi copy editano PROSA — config data, non UI chrome.
- F-2: selezione party condivisa lifted a page state, lifetime
  lab-session-scoped.
- F-3: tuning su narrated = consentito (conseguenza provenance in §6).
- F-4: stima what-if in scope solo con reuse a zero cambi di firma; altrimenti
  solo picker.
