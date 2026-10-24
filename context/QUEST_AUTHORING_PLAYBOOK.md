---
title: Quest Authoring Playbook — creare una quest da zero con la pipeline esistente
type: process-guide
status: draft — sintesi dell'audit 2026-10-23; nessuna ratifica Director
created: 2026-10-23
related: QUEST_RULES.md, GOOD_QUEST_DEFINITION.md, QUEST_GENERATION_SPEC.md,
         QUEST_GENERATION_CONTRACTS.md, QUEST_IMPRINTS.md,
         src/docs/docs/idle_village/quest_sterminio_goblin_spec.md,
         plans/PLAN-019-quest-macro-plan.md, plans/PLAN-026-quest-generation.md,
         plans/PLAN-029-quest-gen-lab-operativa.md, context/QUEST_OPPORTUNITY_LAYER.md
---

# QUEST AUTHORING PLAYBOOK

Come si crea una quest da zero oggi, con ciò che esiste davvero nel repo.
Non è un piano e non è una visione: è la procedura osservata dalle quest
reali (goblin, rovine, IMPR-002 ×3) più le regole vigenti. Dove il
processo ha buchi è detto esplicitamente — se un passo richiede un
artefatto che non esiste, questo documento lo dice, non lo aggira.

## 0. Le tre strade di ingresso

| Strada | Quando | Costo | Esito |
|---|---|---|---|
| **A — Authored a mano** | la quest ha un design proprio (struttura, gimmick, fiction non coperti dai template) | alto: manoscritto + scenario TS | unica via usata in produzione finora (goblin, rovine) |
| **B — Skeleton × DomainKit** | la quest è istanza di una core gimmick esistente (`race` gara di avanzamento, `flood` volta che allaga) | basso: scrivere solo il kit (vocabolario + copy per scena) | funziona offline/lab; **non arriva ai POI** (gen-poi-wiring aperto, PLAN-026 T6 gated) |
| **C — Compilazione imprint** | la quest è un pattern drammatico noto con function spec per beat (modello IMPR-002) | medio: function spec + foglio parametri di dominio | ~70% template fisso + parametri; 3 istanze compilate (palude, mare, miniera) |

Regola di scelta: se la gimmick esiste e il dilemma è quello → B. Se esiste
un imprint che copre il pattern drammatico → C. Altrimenti → A. `meld`
(bonus a scadenza non dichiarata) è `proposal` e non ha generatore;
`mimic`/hazard node è contratto senza runtime.

## 1. Intento — prima della struttura

Tre scelte, in quest'ordine. Scriverle nel doc di design del punto 2.

1. **Emozione target** — la libreria canonica (`QUEST_GENERATION_SPEC.md`
   §0 + `FINAL-RESOCONTO.md` §5): attaccamento/sacrificio, avidità/
   rimpianto, suspense, sorpresa equa, sollievo, pressione. Una quest
   meccanicamente valida ma emotivamente piatta è bocciata per contratto.
2. **Minaccia → vittima → luogo** — coerenza obbligatoria
   (`QUEST_RULES.md` §7b, vigente): la vittima/indizio del briefing deve
   essere qualcuno che quella minaccia colpirebbe davvero; la vittima
   scelta vincola dove la quest accade.
3. **La prova-obiettivo** — cosa paga esattamente. La reward nomina
   l'obiettivo (`GOOD_QUEST_DEFINITION.md` §1): una missione «recupera»
   non può pagare sull'uccisione; «Sterminio» paga solo a violenza quasi
   totale (misurato 99.3% vs ~6%).

## 2. Design doc — l'artefatto di creazione vero

Il codice viene dopo. Due forme provate:

- **Manoscritto narrativo** — modello
  `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md`: fasi
  F0–F7 con transit/action names/verdictFlavor, regole di scrittura,
  budget di rischio per fase.
- **Function spec per beat** — modello `context/QUEST_IMPRINTS.md`:
  ogni beat dichiara `function` / `must` / `must_not` / `effetto`.

Contenuto obbligatorio del doc (qualunque forma):

- la scelta d'approccio che cambia la stat rilevante della fase seguente;
- **3–4 decisioni cruciali** dichiarate (budget R-108 — le scene minori
  esistono ma non pretendono lo stesso peso);
- nodi `hidden` / `immediate` dove l'informazione è una risorsa authored;
- twist con trigger leggibili o indiziati e via di reazione;
- le conseguenze di **ogni** fallimento sulla prosecuzione — finché non
  sono definite, nessuna chance compound è significativa (PLAN-019 S1);
- il muro authored del push-your-luck, se presente: l'avarizia deve
  poter uccidere deterministicamente (GOOD_QUEST §5).

## 3. Traduzione in `QuestScenario`

File `src/balancing/config/idleVillage/quests/scenarios/<id>.ts` conforme
a `questScenario.schema.ts` (strict, fail-loud a import):

- **Offer header**: `objective`, `dispatch` opzionale, `slots` required/
  optional con `statFocus` (vocabolario LabStat), `dangerBandRef`,
  `referenceParty` di calibrazione completo (tutte e 6 le stat).
- **Nodi**: `kind` ∈ choice/check/info/harm/combat/end; `stats`; `risk`
  per-slot; `options` con gate (`requiresInfo`/`requiresFlag`/
  `requiresTrait`, `hiddenIf*`); `verdictTable` dichiarativa per gli
  esiti post-verdetto (mai switch nel motore); `vars` per i cursori di
  gimmick; `armRolls`/`rollFlag` per i twist; `previewHint`/`revealHint`;
  `stageDirection` per la regia; `fase` andata/svolgimento/ritorno;
  `epilogue` grants (seam authored, non sistemi inventati).
- **Regole vincolanti del modello**: reward su prova-obiettivo + leader
  vivo; TAKEN≠SECURED fino all'estrazione; fuga = fallimento, bottino si
  tiene ma l'obiettivo resta sul campo; wipe = si perde tutto; harms
  posizionali a cascata; bodyguard intercetta solo danni da check;
  check nascosti rivelati sempre all'effetto; epicfail solo dentro la
  banda di rischio dichiarata.
- **Overlay i18n** `<id>.it-IT.ts` (o EN): i `PRESENTATION_KEYS` sono
  fuori dall'hash contenuto — il testo si ritocca senza invalidare i
  save. Chiavi strutturate, niente interpolazione dipendente dalla
  grammatica italiana.

## 4. Wiring dell'offerta

Entry in `questPois.ts`: estendere l'enum `questId`, posizione mappa,
`sizePx`, finestre `[availableFromDay, availableUntilDay)`,
`ticksPerNode` ∈ [3,30], `expectedPathNodes`, partizione slot,
`repeatable` se serve (default one-shot: il POI si consuma alla chiusura
del rapporto). La banda di pericolo è derivata da `deriveOfferBand` sul
`referenceParty` — non si dichiara, si misura.

## 5. Validazione meccanica — la batteria obbligatoria

- **Zod strict + superRefine** — integrità grafo, target esistenti,
  coverage verdictTable, flag con produttore dichiarato, trait nel
  registry chiuso (`questTraits.ts`), stat coverage offerta.
- **`exploreScenario` coverage MC** — ogni nodo e ogni opzione
  attraversati dinamicamente.
- **Monte Carlo multi-politica** — modello `generatedCatalog.bench.test`:
  ≥4 politiche (es. sempre-prudente / sempre-rapido / interferenza /
  adattiva) × ≥2 party × N run seeded. Accettazione: nessuna politica
  dominante ovunque, nessuna chiaramente inferiore, banda misurata =
  dichiarata, ≥1 witness per ogni ramo-twist.
- **Failure-mode check** — catalogo `QUEST_GENERATION_SPEC.md` §7:
  scelta che cambia solo una %, meter senza effetto sulle opzioni,
  near-miss inerte, ritirata tutto-o-niente, sacrificio auto-assegnato,
  conseguenza non attribuibile.
- **I 6 filtri di `GOOD_QUEST_DEFINITION.md`** — il gate di accettazione
  scritto per S5: (1) reward=obiettivo; (2) ≥1 trade-off reale
  party→esito; (3) ≥1 modo authored di pagare troppo; (4) conseguenze
  nel ledger e nel journal; (5) ogni canale offerto è reale nel motore;
  (6) novità narrative sui seam esistenti.

## 6. Playtest (Gate A)

La validazione meccanica non dimostra che sia divertente. Criteri
osservabili da PLAN-019: (a) la scelta preferita cambia al variare di
party o informazione raccolta — nessuna scelta dominante in tutte le
run; (b) un'informazione raccolta cambia la scelta successiva; (c) una
conseguenza modifica il problema successivo. Evidenza minima proposta:
≥3 run con party diversi e ≥2 approcci diversi. Diagnosi nota: una
quest **strutturalmente imperdibile** (es. «La cassa delle sementi»
prima del redesign, audit in `.mw/runs/20261003-quest-v6-science/`) è un
problema di design, non di numeri — il criterio è losabilità e
attribuibilità del fallimento, non una percentuale target.

## 7. Copy narrativa assistita (opzionale)

Per generare/rivedere testo senza scrivere tutto a mano: pipeline
`generation/narrative/` — `sceneBrief` (fatti meccanici per nodo, la
copy authored non entra mai nel prompt) → `narrationPrompt` → provider →
`validateCopy` (gate deterministico: Zod strict, vietati del vocabolario
di dominio, cifre, internal-id). Driver `scripts/questNarrate.mts` con
fallback multi-provider e dump parziale. Regola di provenance: i fatti
revocati dal Director vanno tolti dal contratto/`lockedFacts` e messi
nei `vietati` del DomainVocab, o la pipeline li rigenera (lezione
manoscritto goblin v3 — guado/strada mercanti, DECISION_LOG 2026-10-18).

## 8. Checklist di chiusura

- [ ] intento scritto: emozione, minaccia→vittima→luogo, prova-obiettivo
- [ ] design doc con decisioni cruciali dichiarate e conseguenze per
      ogni fallimento
- [ ] scenario parse-clean + coverage totale + bench multi-politica
      senza dominatore
- [ ] 6 filtri GOOD_QUEST passati
- [ ] offer cablata (o registrato perché resta nel lab)
- [ ] playtest con i 3 criteri annotati per run
- [ ] `QUEST_RULES.md` aggiornato se la quest introduce regole nuove
      (rule 80-quest-rules-maintenance — obbligatorio, stessa sessione)

## 9. Buchi noti del processo (stato 2026-10-23)

- **Nessun loop UI**: pick → generate → validate → play → iterate →
  export esiste solo come design converged (PLAN-029, `candidate`). Oggi
  l'authoring è TypeScript + test.
- **Il catalogo generato non arriva ai POI** (`gen-poi-wiring` open,
  PLAN-026 T6 gated).
- **Soglie MC di accettazione non ratificate**: «banda = dichiarata» è
  verificato, «cosa è uno spread buono» no.
- **Trait provenance**: come un PG acquisisce trait non è deciso.
- **Canali di approccio alternativi**: modello `vigente` (R-134) ma
  nessun runtime (PLAN-028 draft).
- **Conseguenze fuori dal party**: fazioni/mondo/archi `missing`/`gated`;
  offerte ignorate senza costo.
