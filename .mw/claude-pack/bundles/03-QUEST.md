# 03-QUEST — bundle tematico (snapshot 2026-11-21)

File uniti per provider con cap documenti. Fonti:
- repo-snapshot/QUEST_AUTHORING_PLAYBOOK.md
- repo-snapshot/QUEST_CAMPAIGN_MACRO.md
- repo-snapshot/QUEST_ECONOMY_NOTES.md
- repo-snapshot/QUEST_GAMEPLAY_SCIENCE.md
- repo-snapshot/QUEST_GENERATION_ARCHITECTURE.md
- repo-snapshot/QUEST_GENERATION_CONTRACTS.md
- repo-snapshot/QUEST_GENERATION_SPEC.md
- repo-snapshot/QUEST_GIMMICK_CHANNELS_RESEARCH.md
- repo-snapshot/QUEST_GOBLIN_REWORK_PROPOSAL.md
- repo-snapshot/QUEST_IMPRINTS.md
- repo-snapshot/QUEST_OPPORTUNITY_LAYER.md
- repo-snapshot/QUEST_RULES.md
- repo-snapshot/QUEST_S1_DESIGN.md
- repo-snapshot/QUEST_V6_REDESIGN.md
- repo-snapshot/GOOD_QUEST_DEFINITION.md
- repo-snapshot/quest_sterminio_goblin_spec.md
- repo-snapshot/GAME_INVASION_SEQUENCE.md

---

<!-- ===== repo-snapshot/QUEST_AUTHORING_PLAYBOOK.md ===== -->

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

<!-- ===== repo-snapshot/QUEST_CAMPAIGN_MACRO.md ===== -->

---
title: Quest Campaign Macro — ciclo di campagna, ricompense e progressione dei requisiti
type: design-knowledge
status: PROPOSAL — direzioni di design chiarite in conversazione (2026-10-16);
  nessuna regola vigente, nessun numero di bilanciamento, nessuna
  implementazione eseguita o verificata
updated: 2026-10-16
provenance: sintesi scritta dal Director di una discussione di design sul
  sistema macro di quest, ricompense e progressione della campagna, con
  l'invasione dei goblin come esempio di riferimento
related: QUEST_OPPORTUNITY_LAYER.md, QUEST_RULES.md, GAME_INVASION_SEQUENCE.md,
         PROGRESSION.md, VILLAGE_ECONOMY.md, GAMEPLAY_DESIGN.md,
         OPEN-010, OPEN-012, OPEN-019, OPEN-020, OPEN-021, OPEN-022,
         .mw/desiderata.md v2 (invasione = evento run-threatening)
---

> **Status:** PROPOSAL. Tutto il contenuto è un candidato di design —
> direzioni chiarite in conversazione, **non** ratificate in desiderata né
> registrate come regole vigenti. Nessun numero di bilanciamento è stato
> definito; nessuna meccanica qui descritta è implementata o verificata
> nel repository.

# QUEST_CAMPAIGN_MACRO — sistema macro di quest, ricompense e progressione

Questo documento copre il livello **macro della campagna**: non «come si
risolve una quest» (`QUEST_RULES.md`), non «quali quest esistono e cosa
aprono» (`QUEST_OPPORTUNITY_LAYER.md`), ma **come la campagna si struttura
nel tempo** — crisi, obiettivi, famiglie di ricompense, scalabilità dei
requisiti — perché quest, ricompense e requisiti producano scelte
strategiche reali e progressione duratura, non semplicemente numeri sempre
più alti.

L'**invasione dei goblin** è l'esempio di riferimento usato nella
discussione, non l'unico scenario coperto dal sistema.

## 1. Il ciclo macro della campagna

- L'invasione dei goblin è una **crisi che cresce nel tempo**, con
  un'**ondata ogni pochi mesi**.
- Il giocatore persegue **contemporaneamente due obiettivi**:
  1. **Resistere alle ondate** — proteggere villaggio, abitanti ed eroi.
  2. **Sconfiggere i goblin** — obiettivo principale; è ciò che risolve lo
     scenario.
- Le **difese passive** (palizzate, torri di guardia, strutture analoghe)
  devono essere **molto efficaci** nel proteggere il villaggio e ridurre
  le perdite — ma **non risolvono il problema principale**: non eliminano
  i goblin.
- Il **potenziamento del party e degli abitanti** contribuisce sia al
  combattimento contro i goblin sia alla difesa del villaggio. Senza
  infrastrutture difensive adeguate, affrontare le ondate comporta rischi
  **significativamente maggiori** di ferimenti e morti.
- Le **quest e le main quest** sono i percorsi per sviluppare queste
  capacità. Le main quest hanno **requisiti più impegnativi e ricompense
  importanti** e **non devono essere necessariamente tutte completabili**:
  il giocatore sceglie a quali obiettivi puntare.

## 2. Il valore delle ricompense dipende dal momento

Principio centrale chiarito nella discussione: **il valore di una
ricompensa dipende anche da quando riesci a ottenerla.**

- Una ricompensa utile **all'inizio** può dare un vantaggio determinante
  per le ondate successive.
- Una ricompensa utile **più avanti** può essere poco interessante se la
  ottieni troppo presto.
- Una quest può essere **valida ma non prioritaria** rispetto a un
  problema immediato.
- Il giocatore deve poter scegliere fra **vantaggi immediati** e
  **preparazione futura**.

Conseguenza di design: **non** vogliamo un sistema in cui la ricompensa
con il valore nominale più alto sia sempre la scelta migliore. Il momento,
il rischio e le opportunità alternative devono influenzare la decisione.

## 3. Le quattro famiglie di ricompense

Quattro grandi categorie delineate nella discussione. La tassonomia **non
è completa**: mancano i sottotipi, i criteri di valore e il confronto fra
le famiglie.

### 3.1 Meccaniche e capacità che aiutano nelle quest successive

Skill, consumabili, conoscenze contestuali e titoli che **modificano
concretamente le possibilità** di affrontare le prove.

**Problema approfondito:** una skill permanente che permette di usare
Intelligenza al posto di Destrezza in una prova stealth rischia di rendere
superflue le future ricompense che offrono lo stesso vantaggio.

**Direzione individuata — livelli di applicazione:** una skill può avere
livelli di applicazione. Esempio: *Invisibilità* di livello 1 permette la
conversione nella prova stealth; il livello 2 estende la stessa meccanica
a una situazione di combattimento. Il giocatore ottiene **nuove
applicazioni della capacità che già conosce**, senza dover memorizzare
un'altra skill indipendente.

*(Direzione emersa nella conversazione, non una meccanica verificata come
implementata.)*

### 3.2 Ricompense economiche e risorse

Ricompense immediate: reclute, persone, oro, legname e altre risorse.
Possono **risolvere problemi attuali** oppure **finanziare la
preparazione** per le ondate future. Catalogo completo, criteri di valore
e confronto con le altre famiglie ancora da definire.

### 3.3 Potenziamenti combattivi del party

Armi, equipaggiamento, incantesimi e altre capacità che migliorano il
potenziale combattivo degli eroi e degli abitanti che possono partecipare
alla difesa. Devono contribuire alla capacità di **sconfiggere i goblin**,
distinguendosi dai miglioramenti puramente difensivi del villaggio.

### 3.4 Difese e infrastrutture del villaggio

Palizzate, torri di guardia, fortificazioni e strutture analoghe. Servono
a **contenere le perdite e guadagnare tempo** durante le ondate, senza
sostituire la necessità di sconfiggere il nemico.

## 4. Il problema della scalabilità dei requisiti

- La progressione prevede **quest di livelli differenti**: il livello 1 è
  affrontabile con capacità iniziali; i livelli successivi richiedono
  capacità e preparazione maggiori e offrono ricompense più importanti.
- **Problema specifico:** non basta richiedere una skill come
  prerequisito. Se una skill risolve permanentemente una determinata
  situazione, dopo averla ottenuta il giocatore potrebbe non avere più
  alcun motivo di cercare quest che offrano vantaggi analoghi.
- L'idea dei **livelli di applicazione** (§3.1) è un primo tentativo di
  risolvere il problema **senza ricorrere soltanto all'aumento dei
  numeri**.
- Resta da definire come si combinano livelli delle quest, requisiti,
  capacità, consumabili e altre ricompense per mantenere scelte
  interessanti anche nelle fasi avanzate.

## 5. Stato del design (deciso / aperto)

| Tema | Stato attuale |
|---|---|
| Obiettivo dell'invasione | Chiaro: sopravvivere alle ondate e sconfiggere i goblin |
| Ruolo delle difese | Proteggere il villaggio e ridurre le perdite, non sconfiggere da sole i goblin |
| Valore temporale delle ricompense | Principio chiarito: conta quando ottieni la ricompensa |
| Quattro famiglie di ricompense | Delineate, ma tassonomia da completare |
| Skill con livelli di applicazione | Direzione individuata, da formalizzare |
| Progressione dei requisiti | Problema identificato, soluzione ancora da definire |
| Numeri di bilanciamento | Non definiti in questa conversazione |
| Implementazione nel repository | Non modificata né verificata in questa conversazione |

«Chiaro» nella tabella = chiarito come **direzione** nella conversazione;
resta PROPOSAL finché non ratificato in desiderata o `QUEST_RULES.md`.

## 6. Da dove ripartire

Il prossimo passo coerente è continuare a definire **il sistema generale
delle ricompense e dei requisiti**, non entrare subito nel dettaglio delle
singole quest dell'invasione. Da chiarire:

1. Quali **sottotipi** esistono all'interno delle quattro famiglie di
   ricompense.
2. Come **rappresentare i requisiti** delle quest, comprese le skill con
   più livelli di applicazione.
3. Come far **crescere requisiti e valore delle ricompense** fra i livelli
   delle quest senza rendere obsolete le scelte precedenti.
4. Come **assegnare un valore** alle ricompense che tenga conto di tempo,
   rischio, disponibilità e stato della campagna.

Obiettivo: un sistema macro che produca **scelte strategiche reali e
progressione duratura**, non semplicemente numeri sempre più alti.

Questioni tracciate: **OPEN-022**.

## 7. Relazioni con il materiale esistente

| Concetto qui | Dove vive già | Relazione |
|---|---|---|
| Invasione come crisi crescente a ondate | Desiderata v2 FROZEN (invasione goblin = evento che può chiudere il run, trattamento cinematico); `GAME_INVASION_SEQUENCE.md` (oggi: marcia scripted di 30 gg su `/game`, esito al giorno 30 non implementato); OPEN-012 (difesa a ondate già proposta 2026-10-05) | Coerente: l'evento scripted attuale è il prototipo della singola ondata; il ciclo a crisi crescente è la struttura macro che lo inquadra — da ratificare |
| Difese passive contenitive, non risolutive | OPEN-012 (categorie di potere Defence, eroi come moltiplicatori che non sostituiscono i villager) | Stessa direzione proposta; qui resa esplicita come regola del ciclo macro |
| Quattro famiglie di ricompense (per dominio) | `QUEST_OPPORTUNITY_LAYER.md` §4 — otto categorie di ricompense-porta (per effetto: accesso, informazione, mitigazione, eccezione, conversione, sinergia, investimento, consumabile) | **Due assi diversi, non in conflitto:** qui classificazione per dominio (capacità quest / economia / combattimento party / infrastrutture), là per effetto sul grafo delle opportunità. La composizione delle due tassonomie va definita (OPEN-022) |
| Skill a livelli di applicazione | `QUEST_RULES.md` §7 canali alternativi `vigente` (es. invisibilità→INT sui check core della gimmick); §5 OPPORTUNITY (capacità che cambiano le regole) | Compatibile: i livelli estendono un canale/capacità nota a nuove superfici di applicazione — un asse di crescita sul meccanismo esistente, non un meccanismo nuovo |
| Valore temporale delle ricompense | OPPORTUNITY §7 (durata / scadenza / **finestra** — ratificato il doppio timer acceptance/completion); «decision rate < event rate» (ratificato R-154); lifecycle offerte `QUEST_RULES.md` §8b | Il principio «conta quando la ottieni» dà il *perché* strategico a finestre e scadenze già ratificate |
| Main quest non tutte completabili | Offerte concorrenti e leader-capacity (OPEN-010/021; capacità parallela = solo leader **ratificato** 2026-10-12) | Coerente: più obiettivi di quanti se ne possano perseguire è già la pressione strutturale ratificata |
| Livelli delle quest | Difficoltà esistenti `story/skirmish/dangerous/heroic` (`questSkillCheckConfig`); tassonomia requisiti 4 tipi (OPEN-020, proposal) | Relazione livello↔difficoltà↔tipo di requisito da definire |
| Ciclo macro di campagna | `GAMEPLAY_DESIGN.md` (visione) — **nessun contenuto sul macro-ciclo di campagna** oggi | Questo doc è il seme di quel layer; in ratifica va conciliato con la visione |

## 8. Note di copertura della fonte

La sorgente è la sintesi in 6 sezioni incollata dal Director in sessione
(2026-10-16). Copertura per sezione: §1 → §1 qui; §2 → §2; §3 (quattro
famiglie, inclusi i dettagli su skill a livelli, economia, combattimento,
difese) → §3.1–§3.4; §4 (scalabilità) → §4; §5 (tabella deciso/aperto) →
§5; §6 (da dove ripartire, 4 punti) → §6 + OPEN-022.

<!-- ===== repo-snapshot/QUEST_ECONOMY_NOTES.md ===== -->

---
title: Quest Economy & Village Strategy — design notes
type: design-knowledge
status: PROPOSAL — candidati non ratificati (tracking in `context/OPEN.md` OPEN-010)
updated: 2026-10-05
provenance: copia tracciata di `.mw/runs/20261004-rovine-preview-chatgpt/economy-notes.md` (gitignored) — conversazione ChatGPT «Progettare quest strategiche» 2026-10-04; ledger di estrazione in `context/ingestions/2026-10-05-progettare-quest-strategiche.md`
---

> **Status:** PROPOSAL. I concetti qui sotto (human-days, quest come
> opportunità, regola leader-capacity, juice) sono **candidati di design** —
> non regole vigenti. Ratifica pendente in OPEN-010. I risultati della
> simulazione MC 200k sono evidence di esplorazione, non parametri canonici.


> Da conversazione ChatGPT 2026-10-04. Status: PROPOSAL (simulazione di
> design, non numeri canonici del Balancer). Regole derivate da direttive del
> Director = candidate, non decisioni.

## Modello di check usato nella simulazione

- d20: successo se `d20 + bonus ≥ DC`.
- Il fallimento **non** è «morte automatica»: apre un **tiro di conseguenza**.
- Il delta fra skill del party e requisito riduce sia la probabilità di
  fallire sia la gravità della conseguenza.
- Party simulato: 1 Eroe (+25% stat principale → +5 sul d20) + 3 Villagers
  (+1 ciascuno) → stat principale +8, secondaria +3.

| Check | Bonus | DC | Successo |
|---|---|---|---|
| Mercante high-risk | +8 | 14 | 75% |
| Fiume | +8 | 13 | 80% |
| Stealth | +3 | 12 | 60% |
| Combattimento | +8 | 14 | 75% |
| Percezione tesoro | +3 | 12 | 60% |
| Trappola (Dex+Con) | +3 | 14 | 50% |

Il party è forte sulla caratteristica principale ma debole sulle secondarie →
non è una spedizione «facile».

## Risultato di 200.000 simulazioni (regole provvisorie)

- Quest completata ~83% · fallita ~17%
- Morti medie ~0,49/quest · almeno un morto ~36%
- Feriti medi ~1,5/quest · almeno un ferito ~67%
- Durata media ~6,7 giorni

**Lettura di bilanciamento:** col party +25% si sta a ~mezzo morto per quest.
Senza specialista sulla stat principale si sale verso ~1 morto + ~2 feriti,
ma la probabilità di fallimento della spedizione diventa molto alta.
**Avviso:** se il target è ~1 morto medio, attenzione a non trasformare ogni
quest in una roulette russa.

## Economia degli umani (human-days)

La quest non costa «6 giorni»: costa `4 persone × ~7 giorni = ~28
human-days`. Un ferito non è «−10 HP» ma *«quest'uomo non è disponibile per
X giorni»*.

Costo reale di una quest:

- ~28 human-days
- rischio di morte
- giorni di indisponibilità dei feriti
- tempo della quest
- consumabili
- rischio di arrivare più deboli alla prossima occasione

contro: oro / loot / informazioni / progressione.

## Quest come opportunità, non obbligo

Un party da solo può teoricamente fare ~4–5 spedizioni/mese, ma il gioco non
deve dire «ogni 7 giorni devi fare una quest». In 30 giorni:

- 8–10 quest possono comparire
- il giocatore ne affronta realisticamente 4–5
- alcune rifiutate perché il party non è pronto
- alcune scadono
- alcune diventano interessanti solo dopo aver sviluppato certe persone/equip
- una quest lunga può occupare gran parte del mese ma produrre molto valore

Le domande strategiche che emergono: *«questa quest vale davvero 25–30
human-days?»* e soprattutto *«li impegno adesso o tengo liberi questi uomini
perché potrebbe comparire qualcosa di molto migliore?»*

## Regola del leader (direttiva Director, verbatim)

*«fino a quando il leader nn è stanco o ferito (o morto) puoi continuare a
fare quest fino a quando hai altri umani»* — la capacità di fare quest non è
«1 quest per X giorni» ma è limitata dalla disponibilità degli umani e dallo
stato del leader. Leader stanco/ferito/morto → capacità interrotta.

**Esempio mese (8 quest offerte, 5 affrontate):** 1 ignorata (party debole),
1 scaduta mentre il leader era stanco, 1 richiedeva uomini impegnati. Output:
+650 oro, 2 feriti, 1 ferito grave, 1 morte, 9–12 giorni cumulativi di
indisponibilità, ~100 human-days impegnati.

La domanda diventa *«qual è il prossimo miglior uso dei miei umani?»* — non
«qual è il prossimo bottone da premere».

## Le 5 fonti di juice

1. **Near miss** — `9 + 3 = 12` vs `12`: successo per un pelo. (→ P32)
2. **Deterioramento visibile** — sani → feriti → manca qualcuno.
3. **Loot già acquisito** — più vai avanti, più hai qualcosa da perdere.
   (→ P4 endowment, P18)
4. **Push-your-luck reale** — dopo il checkpoint non scegli «+30 oro» ma se
   mettere a rischio ciò che hai già ottenuto. (→ P4, P19)
5. **Storia emergente** — basta che il gioco ricordi «Tomas è rimasto ferito
   nella spedizione alle rovine» e tre quest dopo «Tomas è ancora in
   infermeria». Una percentuale diventa una piccola storia del villaggio.
   (→ P15/P45 attachment)

## Cosa testare (proposta)

Non altre meccaniche: un test `30 giorni → X quest generate → 1–2 party →
4 villagers + eroi → 4–5 spedizioni possibili → human-days → feriti → morti
→ nuove opportunità`. Per vedere se emerge il gioco cercato:

> «Voglio fare questa quest, ma se mando loro perdo 7 giorni di lavoro. Se
> aspetto, magari arriva una quest migliore. Però se arriva mentre loro sono
> feriti, non posso farla. E quella che ho davanti adesso potrebbe non
> ricomparire.»

<!-- ===== repo-snapshot/QUEST_GAMEPLAY_SCIENCE.md ===== -->

---
title: Quest Gameplay Science — what research says makes a quest worth playing
type: reference
updated: 2026-10-06 (batch 4: emergent narrative / memory / authoring economics, R-090)
tags: quest design psychology suspense failure choices research emergent-narrative
---

# Quest Gameplay Science

Living bibliography: real studies and design theory on what makes a
quest/expedition segment a *game* rather than a procedure. Update as new
findings land; each entry = citation → finding → design implication.
Driver question (Director, 2026-10-03): *"a quest that can never fail,
with no suspense and no stakes, is useless — choices are not choices if
I cannot fail."*

Batch-2 headline (ChatGPT Deep Research, verified): **the quest does not
have a probability problem — it has a game-state problem.** Current loop:
`choice → check → pass/fail → nearly same state`. Required loop:
`information → choice → risk → consequence → new problem → new choice`,
and in the second half: `OBJECTIVE TAKEN → NOT YET SECURED → EXTRACTION
DECISION → SECURE / LOSE`.

## Core principles (derived — front-loaded)

- **P1 — Losability is the game.** Success without possible failure is
  tasteless; players prefer games where failure is their fault
  (Juul 2013). A quest must be *losable through misjudgment*, not only
  through self-sabotage.
- **P2 — Suspense = real outcome variance × emotional stakes × waiting.**
  Suspense tracks the *variance of future beliefs* (Ely/Frankel/Kamenica
  2015; Li/Bramley/Gureckis 2021). If the outcome is decided, no
  presentation layer creates suspense.
- **P3 — A choice needs a real failure mode to be a choice.** Easy or
  consequence-free selections are reflexes, not decisions (Sylvester;
  Meier). Trade-offs must be situational, not EV-resolvable once.
- **P4 — The stake must be visible and already owned.** Push-your-luck
  works because accumulated value sits "on the table" (Incan Gold;
  endowment effect, Kahneman/Knetsch/Thaler 1990).
- **P5 — Failure must do something.** Worst failure outcome = "nothing
  happens" (fail-forward doctrine, PbtA/Pathfinder GM Core). But not
  every failure should be mitigated — loss aversion needs real losses.
- **P6 — Failure must be attributable.** Outcomes traced to player acts
  motivate retry; outcomes traced to dice/events breed frustration
  without the motivating counterpart (Juul; DM doctrine).
- **P7 — Anticipation carries more affect than outcome.** Dopamine codes
  prediction error, not reward (Schultz/Dayan/Montague 1997); uncertainty
  prolongs positive affect (Wilson et al. 2005); anticipation has its own
  utility (Loewenstein 1987; Iigaya et al. 2020). The window between
  commit and reveal is where the game lives — but only if P2 holds.
- **P8 — Uncertainty itself is a motivator.** Uncertain rewards drive
  more investment than certain ones (Shen/Fishbach/Hsee 2015).
- **P9 — Choice must diverge, not just feel big.** Meaningful choice =
  later state actually differs (Mawhorter/Mateas/Wardrip-Fruin/Jhala
  2014). Promising divergence and delivering convergence is worse than
  no choice.
- **P10 — Juice is a multiplier, not a substance.** Redundant feedback
  amplifies already-conveyed information; 0 × juice = 0 (Hicks et al.
  2018/2019; Swink 2009).
- **P11 — Peaks and endings dominate memory.** The remembered experience
  ≈ peak + end (peak-end rule, Fredrickson & Kahneman 1993): budget the
  emotional peak at the climax and the exit, not at setup.
- **P12 — Challenge calibrates to the player.** Flow needs
  challenge≈skill (Csikszentmihalyi); moderate challenge maximizes
  enjoyment (Abuhamdeh & Csikszentmihalyi 2012; Klarkowski et al. 2016,
  n=45 challenge-skill manipulation). An unfailable quest is
  structurally in the boredom zone — no juice fixes that.

## Principles added/refined by Deep Research batch (P13–P35)

- **P13 — Attribution is the unit of failure.** Self-attributed failure
  increases retention; team/system-attributed failure decreases it
  (Zheng et al. 2014, 3M+ observations). "I lost because I chose X" ≠
  "the game decided I lose."
- **P14 — Failure taxonomy, not one knob.** Minor (resource/opportunity)
  / strategic (route or reward closed) / quest (objective lost → retreat)
  / character (wound/death, persistent) / catastrophic (wipe). Each check
  must be able to trigger *at least one* state change, not only damage.
- **P15 — Attachment ≠ naming.** A name doesn't create attachment;
  personal selection, use in risky decisions, contribution to gains do
  (Lewis/Weber/Bowman 2008; Burgess & Jones 2020).
- **P16 — Permadeath amplifies, doesn't create.** Wilson's Roguelife
  A/B pilot: permadeath version rated more engaging, shorter sessions —
  small n, direction only. Death must change the quest, not just log.
- **P17 — Reference state, not house money.** Prior outcomes move the
  decision's reference point (Thaler & Johnson 1990) but the direction
  isn't reliably "gains → greed" (Rüdisser et al. 2017 found the
  *opposite* in 917 real casino clients). Design for "could take it
  home", not for automatic risk appetite.
- **P18 — Push-your-luck requires accumulated progress.** Without
  something already on the table, continue/stop isn't the mechanic.
  Can't Stop lab work (El Rifai et al. 2026): stopping behaviour is
  shaped by prior near-losses and opponent framing.
- **P19 — Goal proximity amplifies risk appetite.** Becker & van der
  Pligt 2016: investment rises near the goal even when action can't
  raise success odds. The extraction phase is where greed lives.
- **P20 — Resume-tendency, not Zeigarnik.** Meta-analysis (Ghibellini &
  Meier 2025): no robust memory advantage for unfinished tasks, but a
  real tendency to *resume* interrupted ones. Frame the pull as
  "goal almost reached", not "open loop".
- **P22 — Counterfactual consequence.** Regret needs visible "what the
  unchosen option would have done" (Giorgetta et al. 2013 MEG; Marcatto
  et al. 2015: experienced regret transfers to later choices). Preview
  should answer "if this fails, what changes?", not just F%/M%.
- **P24 — Decision-relevant uncertainty only.** Hidden info works when
  the player can still adapt with what they know (Howard-Jones &
  Demetriou 2009). Hidden info with no adaptation = helplessness.
- **P26 — Arousal budget.** Identical repeated stimuli habituate
  physiologically and subjectively (Grizzard et al. 2015). Five
  identical Astrolabe moments exhaust the suspense budget; vary the
  *stake*, not the animation.
- **P28 — Threat readability.** Stealth pressure works when the player
  understands *why* it rises (Thief postmortem; Splinter Cell: Blacklist
  GDC 2014; AC stealth docs). A meter that transforms the situation
  (patrol reroutes, access tightens) ≠ a decorative bar.
- **P30 — Retreat crystallizes value.** "Fold" is a decision when it's
  "gave up X to secure Y" — not when it keeps everything (too generous)
  nor loses everything (arbitrary tax). SECURED vs TAKEN distinction.
- **P32 — Near-miss is a tool, not a feature.** Clark et al. 2009:
  near-misses recruit win circuitry and raise motivation; Larche 2017:
  also raises frustration; Finserås et al. 2021 video game: mixed/boredom
  possible. "ALMOST" must *change something* or it's a numeric skin.
- **P34 — Agency boundary for RNG.** The more meaningful the choice
  appears, the more its random outcome must read as *consequence of*
  that choice (Langer 1975; Aitken & Clark 2016). Input/output
  randomness placement measurably changes satisfaction (Zhang et al.
  2021, IEEE CoG). Player controls party/route/consumable/retreat/push;
  RNG only resolves the check.

## Principles added/refined by DeepSeek batch (P36–P47)

- **P36 — Attribution has 3 axes.** Weiner 1985: post-outcome emotion
  depends on locus (internal/external), controllability, stability.
  A loss reads as "mine" only if internally caused + controllable +
  unstable (fixable next run). Dice-only outcomes → external locus →
  anger, not suspense.
- **P37 — Effectance requires risk.** Klimmt/Hartmann/Frey 2007:
  enjoyment is mediated by felt effectance; where failure is impossible
  no effectance is experienced. Direct experimental support for P1.
- **P38 — Rare events are underweighted.** Hertwig et al. 2004:
  decisions-from-experience underweight rare outcomes — an M2% death is
  psychologically invisible even when shown. Render rare lethality as
  frequency ("1 su 50") or icon, not only %.
- **P39 — Perfect information kills suspense.** Keren & Wagenaar 1985:
  even with complete info players use heuristics; but exact-EV
  presentation turns the choice into arithmetic. Qualitative bands +
  consequence statement > raw %.
- **P40 — Sunk cost drives non-retreat.** Arkes & Blumer 1985; Staw
  1976; Brockner 1992: escalating commitment to a failing course.
  Retreat needs an explicit attainable target ("hai la cassa → puoi
  fuggire") or it will never be chosen — which corrupts the fold
  decision (P30).
- **P41 — Goal gradient accelerates near the end.** Hull 1932; Kivetz
  et al. 2006; Nunes & Drèze 2006 (endowed progress: *artificial*
  advancement increases effort). The extraction phase is the natural
  climax; a visible "distance to exit" makes it self-tensioning.
- **P42 — Choice overload is real.** Iyengar & Lepper 2000; Schwartz
  2002: more options paralyze and reduce satisfaction. Cap decisions at
  ~3 strong options.
- **P43 — Affective forecasting mispredicts.** Gilbert et al. 2004:
  players overestimate how bad losses will feel — a visible stake is
  scarier in anticipation than in experience; don't over-punish to
  compensate.
- **P44 — Segmentation structures memory.** Ariely & Zauberman 2003:
  distinct beats are remembered better than uniform stretches.
  3 differentiated astrolabe moments > 5 identical ones (compounds P26).
- **P45 — Character death lands only with investment.** Bopp/Mekler/
  Opwis 2016 (CHI): deaths are among the most moving moments — when the
  character was built; Cohen 2001: identification needs distinctive
  traits + time. Death must remove a *function*, not a number.
- **P46 — Regret is anticipated, not only felt.** Zeelenberg 1999;
  Loomes & Sugden 1982: anticipated regret shapes choice *before* the
  outcome when feedback is expected. The commit surface is where the
  game is won or lost.
- **P47 — Uncertainty ≠ risk, neurally.** Volz et al. 2003 (fMRI):
  ambiguous and risky prospects activate different circuitry —
  "unknown odds" and "known odds" are different experiences; choose
  per-check which one you're selling.

## Principles added by emergent-narrative batch (P48–P63, 2026-10-06)

Batch: own web research + broadcast to 4 web providers (chatgpt, grok,
deepseek usable; claude failed; gemini soft-refused). Raw material:
`.mw/runs/20261006-emergent-narrative-research/` (prompt + BROADCAST.md)
— R-090. Driver: toward S5 — emergent narrative from *recombination of
authored pieces + persistent memory*, not generated prose.
Headline: **the quest generator should generate narrative conditions,
not stories** — `events + world state + party state + character history
+ scheduling → next relevant event → new memory → future eligibility`.

- **P48 — Emergence = recombination × memory × scheduling.** Shipped
  emergent-narrative games do not write stories: they create conditions
  from which players extract stories (RimWorld "story generator";
  Dwarf Fortress history; Wildermyth hooks). The generator's job is
  selecting *which* authored piece fits *now*, not inventing prose.
- **P49 — Memory ≠ log; memory = future narrative affordance.** Record
  only events that can alter a future decision, option, or text
  (`hero.wounded_by_X`, `village.knows_ruin`, `party.failed_relic`).
  `quest_17_completed_at_t` with no reader is dead data. Dwarf Fortress
  shows the failure mode of exhaustive memory: the hard problem becomes
  *salience*, not storage. 10 reusable memories > 1000 unread ones.
- **P50 — Anchor memory to named characters, not world flags.**
  "Marta discovered X" is narratively fertile (she can be recalled,
  wounded, promoted, sent back); "the party discovered X" is a flag.
  Wildermyth's entire system hangs on per-hero History → Aspects →
  Hooks. RimWorld keeps the roster ~12 so the player holds a history
  per person; kinship/relationship *labels* do the emotional work with
  children's-book simplicity.
- **P51 — Apophenia does the work; feed it causal readability, not
  complexity.** Players extract more story than mechanics contain
  (Sylvester, RPS 2016). The fuel is *legible* interlocking systems —
  when things explode you can trace the causal chain — not a bigger
  event table. "Systems you can reason about" > "many random events".
- **P52 — Perceived agency ≈ acknowledged, foreseen choice — not
  branch count.** Fendt et al. 2012: a linear story that explicitly
  acknowledges player choices produced agency reports comparable to a
  branching one. Cardona-Rivera & Robertson 2014 (n=88): agency rises
  when options foreseeably lead to *meaningfully different* states.
  Cost asymmetry: acknowledging a choice is cheap; branching it is not.
- **P53 — The illusion dies when the template becomes visible.**
  Recognizable skeletons ("travel → choice → check → loot → return")
  turn narrative into optimization ("get steel → build killbox →
  quit"). Mitigation: vary *causes and consequences* more than
  structure; inter-system dependencies (who, where, what state) over
  event count. The repetition problem is cause-recognition, not
  shape-recognition. (Compounds the E-47 Wildermyth warning.)
- **P54 — Callback payoff = spacing × rarity × relevance.** Wildermyth
  hard-caps hooks (≈1 resolved per hero per campaign, gated on
  relationship level). Telltale is the negative lesson: "X will
  remember that" advertises memory before paying it — a promised
  consequence that never lands destroys trust worse than no memory
  (Koenitz et al. 2018; Monchan 2017). Don't announce; deliver later,
  diegetically.
- **P55 — Scheduling is narrative: eligible ≠ worth firing now.**
  RimWorld storytellers differ mainly in *pacing policy*, not content;
  L4D's Director modulates intensity (build → peak → fade → relax,
  ~30s decay), not plot; CK3 splits pulse events (weighted, timed) from
  triggered events (player-caused). A quest selector needs a pacing
  notion ("is it time to resurface what happened three expeditions
  ago?"), not only eligibility.
- **P56 — Bound combinatorics structurally, not by effort.** Authoring
  Wall (Bruckman 1990; Garbe): branches that never rejoin cost
  exponentially; the Complexity Ceiling is tracked *state*, not
  wordcount. Known structures: Ashwell's CYOA patterns (Branch and
  Bottleneck rejoins; Loop and Grow reuses state; Floating Modules);
  Failbetter storylets = selection over state ("a river, not a tree").
  Warning: many invisible qualities are the *new* branching explosion —
  state parsimony is an authoring discipline, not an optimization.
- **P57 — Tiered variation: make cost explicit.** Param/text variant <
  approach variant < outcome variant < extra phase < new chain. Spend
  the expensive tier only on high-salience moments; most checks change
  *local state* (next check easier, route revealed), not the tree.
- **P58 — Exceptional results are for discovery, not bigger numbers.**
  Crit success should reveal what no normal success could (hidden
  phase, secret info) — "I found something hidden" beats "I rolled a
  20". Degrees of success (PF2e four degrees; PbtA success-at-cost;
  OSR advantage/disadvantage tables) is the established tabletop
  vocabulary for it. Hidden phases must be *authored* content reached
  by reroute, and should rejoin the trunk (P56).
- **P59 — Conditions inclusive at selection, additive in-quest.**
  World state decides *which* quest appears; inside the quest,
  conditions *add* options ("if you carry the lantern, an extra phase
  exists") — never "no X → no content". Narrow conditions = invisible
  authored content (Failbetter's parsimony lesson). Keep selection-time
  and in-quest conditionality as two separate tools.
- **P60 — Choices as actions; consequences must be noticed to exist.**
  Kennedy (Failbetter): "if players don't notice that something was a
  consequence, it wasn't"; let players choose *actions* ("answer
  immediately" vs "think it over"), not emotions or faction algebra —
  players supply the emotion themselves.
- **P61 — Don't over-explain resurfaced memory.** Gap-filling
  interpretation is where "this story is mine" comes from; over-
  signaling why a memory resurfaced kills it (Edith Finch testing
  lesson; O'Brien — don't announce that a choice matters, show
  divergence).
- **P62 — Retreat/failure leave readable state.** Pyre: the story
  continues through defeat without becoming fail-safe — consequences
  touch characters and future. A retreat should deposit memory (site
  still hostile, `retreated_from_X` aspect queryable later), not a dead
  end. Fail-forward ≠ fail-safe: the question is "what did I lose",
  not "how do I avoid feeling bad".
- **P63 — Chains are growing qualities, not bespoke scripts.** A quest
  chain = a progress quality that rises + storylets gated on its tiers
  (Failbetter Chain/Pyramid; CK3 event chains via scope). Much cheaper
  than hand-linked follow-up quests, and it composes with selection.

## Studies & theory (verified citations)

### Failure & stakes

- **Juul, J. (2013). *The Art of Failure: An Essay on the Pain of
  Playing Video Games*. MIT Press.** — Players prefer games where they
  feel responsible for failure; games motivate through the drive to
  escape self-attributed inadequacy. → P1, P6.
  https://mitpress.mit.edu/9780262529952/the-art-of-failure/
- **Kahneman, D. & Tversky, A. (1979). "Prospect Theory: An Analysis
  of Decision under Risk." *Econometrica* 47(2).** — Losses weigh
  ~2× equivalent gains. → retreat/conservation defaults; stakes framed
  as loss.
- **Kahneman, D., Knetsch, J.L. & Thaler, R.H. (1990). "Experimental
  Tests of the Endowment Effect and the Coase Theorem." *JPE* 98(6).**
  — Ownership inflates value. → stakes must be *already-held* before
  they can be risked (P4).
- **Fredrickson, B.L. & Kahneman, D. (1993). "Duration Neglect in
  Retrospective Evaluations of Affective Episodes." *JPSP* 65(1).**
  — Peak-end rule: memory ≈ peak + ending. → P11.
- **Zheng, A., Zhang, C., Pavlou, P. & Luo, X. (2014). "The Bright Side
  of Failure in Online Gaming." *ICIS 2014 Proceedings*.** — 3M+
  observations: self-attributed failure raises retention, team-attributed
  lowers it. → P13. https://aisel.aisnet.org/icis2014/proceedings/ISBreakthrough/20/
- **Huber, S.E. et al. (2025). "Graceful Failure: Investigating
  Frustration, Motivation, and Engagement with Video Games." OSF
  preprint.** — n=172: cheaper failure (checkpoints) → less frustration,
  more competence, more completion — but changes per-opportunity
  investment. Preprint status. → P14.
- **Cuerdo, M.A.M. (2022). "Fail and Retry: How Challenge Design in
  Platformer Games Relates to Player Experience and Traits." UC Santa
  Cruz thesis.** — Empirical failure-design taxonomy across 62 games
  (permadeath/reset/checkpoint/save). → P14.
  https://escholarship.org/uc/item/9s91j0m5
- **Lewis, M.L., Weber, R. & Bowman, N.D. (2008). "'They May Be Pixels,
  But They're MY Pixels': Developing a Metric of Character Attachment
  in Role-Playing Video Games." *CyberPsychology & Behavior* 11(4).**
  — Validated attachment scale; attachment ↔ enjoyment, esp. RPGs.
  → P15. https://doi.org/10.1089/cpb.2007.0137
- **Burgess, J. & Jones, C. (2020). "I Harbour Strong Feelings for Tali
  Despite Her Being a Fictional Character…" *Game Studies* 20(1).**
  — Attachment demonstrably alters mechanical play behaviour (ME2).
  → P15. http://gamestudies.org/2001/articles/burgess_jones
- **Wilson, J.B. (2019). "Roguelife: Digital Death in Videogames and Its
  Design Consequences." MIT S.M. thesis.** — A/B pilot (permadeath vs
  not): permadeath rated more engaging, shorter sessions; small n.
  → P16. https://dspace.mit.edu/handle/1721.1/124290
- **Parker, R. (2017). "The culture of permadeath: Roguelikes and
  Terror Management Theory." *J. Gaming & Virtual Worlds* 9(2).**
  — Theoretical framing of permadeath's appeal. → P16.
  https://doi.org/10.1386/jgvw.9.2.123_1
- **Thaler, R.H. & Johnson, E.J. (1990). "Gambling with the House Money
  and Trying to Break Even." *Management Science* 36(6).** — Prior
  outcomes shift the reference point (house-money + break-even
  effects). → P17. https://doi.org/10.1287/mnsc.36.6.643
- **Rüdisser, M., Flepp, R. & Franck, E. (2017). "Do casinos pay their
  customers to become risk-averse? Revising the house money effect in
  a field experiment." *Experimental Economics* 20.** — 917 real
  casino clients: free play → *less* risk-taking. Corrects naive
  house-money. → P17. https://doi.org/10.1007/s10683-016-9509-9
- **Vermillion, S.D. et al. (2017). "An investigation on using serious
  gaming to study human decision-making in engineering contexts."
  *Design Science* 3:e15.** — Games make sunk-cost observable
  differently than narrative vignettes. → P17.
  https://doi.org/10.1017/dsj.2017.14
- **Becker, D. & van der Pligt, J. (2016). "Forcing your luck:
  Goal-striving behavior in chance situations." *Motivation and
  Emotion* 40.** — Goal gradient holds in pure-chance tasks:
  investment rises near the goal. → P19.
  https://doi.org/10.1007/s11031-015-9527-5
- **El Rifai, A.M., Tellier, C. & Dyson, B.J. (2026). "Using the game
  Can't Stop to inform the novel behavioural state of near-loss."
  *Canadian J. Exp. Psychology*, ahead of print.** — Push-your-luck
  paradigm: near-loss defined via negative counterfactual; stopping
  shaped by prior outcomes + opponent. → P18.
  https://doi.org/10.1037/cep0000406

### Suspense, uncertainty, anticipation

- **Ely, J., Frankel, A. & Kamenica, E. (2015). "Suspense and
  Surprise." *Journal of Political Economy* 123(1), 215–260.**
  — Formal model: suspense = variance of the belief path about an
  outcome. → P2. https://doi.org/10.1086/677350
- **Li, Z., Bramley, N.R. & Gureckis, T.M. (2021). "Expectations about
  future learning influence moment-to-moment feelings of suspense."
  *Cognition & Emotion* 35(6).** — Blackjack experiments validate the
  belief-variance model over heuristic alternatives. → P2.
  https://www.tandfonline.com/doi/abs/10.1080/02699931.2021.1932429
- **Lehne, M. & Koelsch, S. (2015). "Toward a general psychological
  model of tension and suspense." *Frontiers in Psychology* 6:79.**
  — Domain-independent model: tension = conflict/uncertainty triggering
  prediction of emotionally significant events. → P2.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4324075/
- **Klimmt, C., Rizzo, A., Vorderer, P., Koch, J. & Fischer, T. (2009).
  "Experimental Evidence for Suspense as Determinant of Video Game
  Enjoyment." *CyberPsychology & Behavior* 12(1), 29–31.** — FPS
  manipulated high/low suspense (n=63): suspense drives enjoyment.
  → direct experimental proof for games.
  https://doi.org/10.1089/cpb.2008.0060
- **Wilson, T.D., Centerbar, D.B., Kermer, D.A. & Gilbert, D.T. (2005).
  "The Pleasures of Uncertainty." *JPSP* 88(1), 5–21.** — Uncertainty
  prolongs positive moods. → P7.
- **Shen, L., Fishbach, A. & Hsee, C.K. (2015). "The Motivating-
  Uncertainty Effect." *Journal of Consumer Research* 41(5).** —
  Uncertain rewards increase effort more than certain rewards.
  → P8; supports not fully disclosing every outcome.
- **Schultz, W., Dayan, P. & Montague, P.R. (1997). "A Neural
  Substrate of Prediction and Reward." *Science* 275(5306).** —
  Dopamine encodes prediction error → anticipation is the reward
  signal, not the reward. → P7.
- **Iigaya, K. et al. (2020). "The value of what's to come." *Science
  Advances* 6(33):eaba3828.** — vmPFC/midbrain/hippocampus compute
  anticipatory utility. → P7.
  https://www.science.org/doi/10.1126/sciadv.aba3828
- **Loewenstein, G. (1987). "Anticipation and the Valuation of Delayed
  Consumption." *Economic Journal* 97(387).** — Savoring: anticipation
  itself is utility. → commit→reveal delay is a feature when staked.
- **Ghibellini, R. & Meier, B. (2025). "Interruption, recall and
  resumption: a meta-analysis of the Zeigarnik and Ovsiankina effects."
  *Humanities & Social Sciences Communications* 12:962.** — No robust
  memory advantage for unfinished tasks; real resumption tendency.
  Zeigarnik lacks universal validity → downgrade any Zeigarnik-based
  claim; use goal-proximity + resumption. → P20.
  https://www.nature.com/articles/s41599-025-05000-w
- **Wendsche, J., Weigelt, O. & Syrek, C.J. (2026). "Unfinished work
  tasks and work-related thoughts during off-job time." *Anxiety,
  Stress & Coping* 39(4).** — Unfinished tasks ↔ persistent task
  thoughts (meta, 17+14 samples). → P20.
  https://doi.org/10.1080/10615806.2026.2616302
- **Giorgetta, C. et al. (2013). "Waves of regret: A MEG study of
  emotion and decision-making." *Neuropsychologia* 51(1), 38–51.** —
  Regret emerges from feedback on foregone alternatives + agency.
  → P22. https://doi.org/10.1016/j.neuropsychologia.2012.10.015
- **Wright, C. & Ayton, P. (2005). "Focusing on what might happen and
  how it could feel." *IJHCS* 62(6).** — Anticipated regret measurably
  shifts subsequent choices. → P22.
  https://doi.org/10.1016/j.ijhcs.2005.03.001
- **Marcatto, F., Cosulich, A. & Ferrante, D. (2015). "Once bitten,
  twice shy: experienced regret and non-adaptive choice switching."
  *PeerJ* 3:e1035.** — Experienced regret transfers to later choices,
  even across tasks. → P22. https://doi.org/10.7717/peerj.1035
- **Howard-Jones, P.A. & Demetriou, S. (2009). "Uncertainty and
  engagement with learning games." *Instructional Science* 37.** —
  Uncertainty raises engagement *when integrated into the activity*,
  not as decoration. → P24. https://doi.org/10.1007/s11251-008-9073-6
- **Zhang, Y. et al. (2021). "Effect of Input-output Randomness on
  Gameplay Satisfaction in Collectable Card Games." *IEEE CoG 2021*.**
  — *When* randomness enters the decision changes satisfaction, not
  just final EV. → P34. https://doi.org/10.1109/CoG52621.2021.9619020
- **Grizzard, M. et al. (2015). "The Thrill Is Gone, but You Might Not
  Know." *Communication Monographs* 82(1).** — Repeated exposure →
  physiological + self-reported habituation. → P26.
  https://doi.org/10.1080/03637751.2014.971418
- **Klarkowski, M. et al. (2016). "Operationalising and evaluating
  sub-optimal and optimal play experiences through challenge-skill
  manipulation."** — Balanced challenge ↑ positive affect, autonomy,
  presence vs low/high challenge. → P12.
- **Carlin, B.I. & Robinson, D.T. (2009). "Fear and loathing in Las
  Vegas: Evidence from blackjack tables." *Judgment and Decision
  Making* 4(5).** — Real-table data: dominant error = playing *too
  conservatively* (omission bias, anticipated regret). → P30.
  https://doi.org/10.1017/S1930297500001212
- **Clark, L. et al. (2009). "Gambling Near-Misses Enhance Motivation
  to Gamble and Recruit Win-Related Brain Circuitry." *Neuron* 61(3).**
  — Near-misses engage win circuitry + motivation; effect moderated by
  personal control. → P32. https://doi.org/10.1016/j.neuron.2008.12.031
- **Larche, C.J. et al. (2017). "The Candy Crush Sweet Tooth: How
  'Near-misses' in Candy Crush Increase Frustration, and the Urge to
  Continue Gameplay." *Addictive Behaviors Reports*.** — Near-misses:
  ↑ arousal, ↑ frustration, ↑ urge — not more fun. → P32.
- **Finserås, T.R. et al. (2021). "Near Miss in a Video Game: an
  Experimental Study." *Int. J. Mental Health and Addiction* 19(2).**
  — In a video game, near-miss produced mixed results (boredom in some
  contrasts) — gambling analogy ≠ free transfer. → P32.
  https://doi.org/10.1007/s11469-019-00070-9
- **Langer, E.J. (1975). "The Illusion of Control." *JPSP* 32(2).** —
  Classic: choice cues inflate perceived control in chance tasks.
  → P34. https://doi.org/10.1037/0022-3514.32.2.311
- **Aitken, F., Clark, L. et al. (2016). "Let me take the wheel:
  Illusory control and sense of agency." *QJEP* 69.** — Perceived
  agency and illusion of control related but dissociable (n=78).
  → P34. https://doi.org/10.1080/17470218.2016.1206128

### Choices & agency

- **Meier, S. — GDC 2012, "Interesting Decisions".** — Games = series
  of interesting decisions; interesting = trade-off + situational +
  partially predictable + owned. "If the player always picks the first
  of three, it's not an interesting decision."
  https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions
- **Sylvester, T. — *Designing Games* (2013, O'Reilly) + "Decision-
  Based Gameplay Design".** — Decisions must be *difficult and unique*;
  repeated identical choices degrade to reflexes; emotion is engineered
  by mechanics, not fiction. → P3, run variance.
  https://tynansylvester.com/2005/01/4/
- **Mawhorter, P., Mateas, M., Wardrip-Fruin, N. & Jhala, A. (2014).
  "Towards a Theory of Choice Poetics." *FDG 2014* (UC Santa Cruz).**
  — Framework for narrative effect of choice structure; "avoid false
  choices" formalized; agency vs illusion. → P9.
  http://fdg2014.org/papers/fdg2014_paper_19.pdf
- **O'Brien, N. — "When choice becomes a metric, narrative design
  suffers" (GameDeveloper.com).** — Overtly signaling "this choice
  matters" quantifies narrative and subverts agency; show divergence,
  don't announce it. → P9.
  https://www.gamedeveloper.com/design/opinion-when-choice-becomes-a-metric-narrative-design-suffers
- **Ryan, R.M., Rigby, C.S. & Przybylski, A. (2006). "The Motivational
  Pull of Video Games: A Self-Determination Theory Approach."
  *Motivation and Emotion* 30.** — Competence/autonomy/relatedness as
  intrinsic drivers; agency needs *felt* volition.

### Challenge, flow, motivation models

- **Csikszentmihalyi, M. (1990). *Flow*.** — Challenge≈skill channel.
- **Abuhamdeh, S. & Csikszentmihalyi, M. (2012). "The importance of
  challenge for the enjoyment of intrinsically motivated, goal-directed
  activities." *PSPB* 38(3).** — Moderate challenge maximizes
  enjoyment → P12.
- **Malone, T.W. (1981). "Toward a theory of intrinsically motivating
  instruction." *Cognitive Science* 5(4).** — Challenge + fantasy +
  curiosity as intrinsic motivators; optimal challenge = uncertain
  outcome.
- **Sweetser, P. & Wyeth, P. (2005). "GameFlow: a model for evaluating
  player enjoyment in games." *Computers in Entertainment* 3(3).** —
  Evaluation model (concentration, challenge, skills, control, goals,
  feedback, immersion, social) usable as playtest checklist.
- **Lazzaro, N. (2004). "Why We Play Games: Four Keys to More Emotion
  without Story." XEODesign.** — Hard Fun (challenge/mastery), Easy Fun
  (novelty), Serious Fun (meaning), People Fun — quest = Hard+Serious.
- **Yee, N. (2006). "Motivations for Play in Online Games."
  *CyberPsychology & Behavior* 9(6).** — Achievement/social/immersion
  components of motivation.
- **Green, M.C. & Brock, T.C. (2000). "The role of transportation in
  the persuasiveness of public narratives." *JPSP* 79(5).** —
  Narrative transportation: immersion depends on coherent world, not
  mechanics exposure.

### Failure handling doctrine (industry/tabletop)

- **Pathfinder 2e GM Core — "Failing Forward"** (Archives of Nethys).
  — Failure should progress the story differently, never stall it;
  not every failure must be mitigated. → P5.
  https://2e.aonprd.com/Rules.aspx?ID=2485
- **D&D — "Failing Forward: Losing Without Ending the Campaign"
  (DDB).** — Good failure state: caused by player action, costs
  something cared about, isn't death-only. → P5/P6.
  https://www.dndbeyond.com/posts/408-failing-forward-losing-without-ending-the-campaign
- **Gnome Stew — "Failing Forward: How to Make Failure Interesting in
  RPGs".** — PbtA: succeed-with-cost reframes failures as new problems;
  overuse breeds caution-paralysis. → P5.
  https://gnomestew.com/failing-forward-how-to-make-failure-interesting-in-rpgs/
- **"Sources of Tension" taxonomy (BGDF).** — Tension generators:
  press-your-luck, short-vs-long term, all-or-nothing, high-noon.
  → menu of mechanical tension types for quest beats.
  https://www.bgdf.com/game-journal/sources-tension
- **Faidutti & Moon — *Incan Gold/Diamant* (2005).** — Push-your-luck
  reference: one binary choice stays hard for 20 min because the
  accumulated stake is physically visible. → P4/P7.

### Juice / game feel

- **Swink, S. (2009). *Game Feel: A Game Designer's Guide to Virtual
  Sensation*. CRC.** — Feel = response + feedback + metaphor; a
  multiplier on substance.
- **Hicks, K., Gerling, K., Dickinson, P. & Vanden Abeele, V. (2019).
  "Juicy Game Design." *CHI PLAY '19*, 185–197.** — Juice = redundant
  feedback amplifying already-conveyed info; improves appeal, competence
  only under conditions. → P10. https://doi.org/10.1145/3311350.3347171
- **Hicks, K., Dickinson, P., Holopainen, J. & Gerling, K. (2018).
  "Good Game Feel: An Empirically Grounded Framework for Juicy Design."
  *DiGRA 2018*.** — Dev-survey framework for juiciness components.

### Applied frameworks (secondary)

- **"A Theoretical Framework for Managing Suspense" (IEEE COG 2021,
  paper 339).** — Suspense-manager model: player model × game elements
  across story/gameplay/artifact layers; adaptive suspense via gameplay,
  not only presentation.
  https://ieee-cog.org/2021/assets/papers/paper_339.pdf
- **Questas high-stakes structuring guide.** — Applied synthesis:
  calibrate stakes over time, soft-fails over hard walls, stack
  consequences, irreversible decisions late.
  https://blog.questas.co/beyond-interactive-fiction-what-game-design-theories-teach-us-a
- **Roadwarden deep dive (GameDeveloper).** — Consequence budgeting
  across quest phases; trust/progress as camouflaged stakes.
  https://www.gamedeveloper.com/design/deep-dive-roadwarden

### Quest authoring checklist (PROPOSAL — ChatGPT, ingest 2026-10-06)

Rubrica compatta per decomporre una quest prima di scriverla/valutarla.
Proposta AI, non ratificata; candidata come rubrica operativa per l'authoring
(PLAN-019 S5) e per la revisione della quest proposta dal Director.

1. Obiettivo della quest.
2. Ostacolo.
3. Informazioni che il giocatore possiede.
4. Informazioni che il giocatore può scoprire.
5. Scelte possibili.
6. Costo/rischio di ogni scelta.
7. Cosa rende una soluzione migliore di un'altra.
8. Conseguenze di successo, fallimento, ferite e morte.

Corollario: la Preview deve spiegare *perché* una composizione funziona e cosa
si sacrifica per ottenerla — non solo «vinci al 78%». Anti-pattern da evitare:
quest ridotta a un singolo skill check (vedi REJ-007 in `context/REJECTED.md`).

### Source bank — DeepSeek batch (2026-10-03, DeepThink+Search)

Attribution / effectance / character attachment:
- **Weiner, B. (1985). "An Attributional Theory of Achievement
  Motivation and Emotion." *Psychological Review* 92(4).** — Emotion
  from locus × controllability × stability of attribution. → P36.
  https://doi.org/10.1037/0033-295X.92.4.548
- **Klimmt, C., Hartmann, T. & Frey, A. (2007). "Effectance and control
  as determinants of video game enjoyment." *CyberPsychology &
  Behavior* 10(6).** — Felt effectance requires real failure
  possibility. → P37. https://doi.org/10.1089/cpb.2007.9942
- **Bopp, J.A., Mekler, E.D. & Opwis, K. (2016). "Negative Emotion,
  Positive Experience? Emotionally Moving Moments in Digital Games."
  *CHI '16*.** — Character deaths rank among the most moving moments —
  contingent on player investment. → P45.
  https://doi.org/10.1145/2858036.2858227
- **Cohen, J. (2001). "Defining Identification." *Mass Communication &
  Society* 4(3).** — Identification needs distinctive traits + time;
  corrects "endowment alone creates attachment". → P45.
  https://doi.org/10.1207/S15327825MCS0403_01
- **Howard, J. — "Killing Your Babies: XCOM's Lessons in Permadeath"
  (GameDeveloper).** — Design analysis (not peer-reviewed) on why
  named-unit permadeath is felt. → P45.
- **Rain, M. & Mar, R.A. (2021). "Adult attachment and engagement with
  fictional characters." *J. Social and Personal Relationships*.** —
  (via Grok; DOI 10.1177/02654075211018513 claimed — verify) → P45.

Rare events / information / RNG:
- **Hertwig, R., Barron, G., Weber, E.U. & Erev, I. (2004). "Decisions
  from experience and the effect of rare events in risky choice."
  *Psychological Science* 15(8).** — Rare outcomes underweighted:
  M2-5% is psychologically invisible even when displayed. → P38.
  https://doi.org/10.1111/j.0956-7976.2004.00715.x
- **Keren, G. & Wagenaar, W.A. (1985). "On the psychology of playing
  blackjack." *JEP:General* 114(2).** — Full info → heuristic play, not
  EV optimization. → P39. https://doi.org/10.1037/0096-3445.114.2.133
- **Costikyan, G. (2013). *Uncertainty in Games*. MIT Press.** —
  Input/output randomness taxonomy; the agency boundary for dice.
  → P34.
- **Elias, G.S., Garfield, R. & Gutschera, K. (2012). *Characteristics
  of Games*. MIT Press.** — Hidden vs perfect information.
- **Volz, K.G. et al. (2003). "Predicting events of varying
  probability." *NeuroImage* 19(2).** — Ambiguity and risk are neurally
  distinct prospects. → P47.
  https://doi.org/10.1016/S1053-8119(03)00122-8
- **Burns, B.D. & Corpus, J.H. (2004). "Randomness and inductions from
  streaks." *Psychonomic Bulletin & Review* 11(1).** — Streak
  perception → hot-hand vs gambler's fallacy.
  https://doi.org/10.3758/BF03196580
- **Presson, P.K. & Benassi, V.A. (1996). "Illusion of control: A
  meta-analytic review." *J. Social Behavior and Personality* 11(3).**
  — Meta-analysis; familiarity ↑ illusion of control. → P34.

Commitment / regret / overload:
- **Arkes, H.R. & Blumer, C. (1985). "The psychology of sunk cost."
  *OBHDP* 35(1).** — Sunk cost applies to non-monetary resources.
  → P40. https://doi.org/10.1016/0749-5978(85)90049-4
- **Staw, B.M. (1976). "Knee-deep in the big muddy." *OBHP* 16(1).** —
  Escalation of commitment to failing courses. → P40.
  https://doi.org/10.1016/0030-5073(76)90005-2
- **Brockner, J. (1992). "The escalation of commitment to a failing
  course of action." *AMR* 17(1).** — Review. → P40.
  https://doi.org/10.5465/amr.1992.4279568
- **Zeelenberg, M. (1999). "Anticipated regret, expected feedback and
  behavioral decision making." *JBDM* 12(2).** — Anticipated regret
  drives choice when feedback is expected. → P46.
  https://doi.org/10.1002/(SICI)1099-0771(199906)12:2%3C93::AID-BDM311%3E3.0.CO;2-S
- **Loomes, G. & Sugden, R. (1982). "Regret theory." *Economic Journal*
  92(368).** — Formal regret model. → P46.
  https://doi.org/10.2307/2232669
- **Iyengar, S.S. & Lepper, M.R. (2000). "When choice is demotivating."
  *JPSP* 79(6).** — Choice overload (24→6 jam). → P42.
  https://doi.org/10.1037/0022-3514.79.6.995
- **Schwartz, B. et al. (2002). "Maximizing versus satisficing."
  *JPSP* 83(5).** — Maximizers less happy with choices. → P42.
  https://doi.org/10.1037/0022-3514.83.5.1178
- **Gilbert, D.T. et al. (2004). "The peculiar longevity of things not
  so bad." *Psychological Science* 15(1).** — Losses hurt less than
  forecast → don't over-punish. → P43.
  https://doi.org/10.1111/j.0963-7214.2004.01501003.x

Goal proximity / pacing / near-miss additions:
- **Hull, C.L. (1932). "The goal-gradient hypothesis." *Psychological
  Review* 39(1).** — Original goal-gradient claim. → P41.
  https://doi.org/10.1037/h0072640
- **Kivetz, R., Urminsky, O. & Zheng, Y. (2006). "The goal-gradient
  hypothesis resurrected." *JMR* 43(1).** — Perceived proximity
  accelerates effort. → P41. https://doi.org/10.1509/jmkr.43.1.39
- **Nunes, J.C. & Drèze, X. (2006). "The endowed progress effect."
  *JCR* 32(4).** — Even artificial progress increases effort. → P41.
  https://doi.org/10.1086/500480
- **Ariely, D. & Zauberman, G. (2003). "Differential partitioning of
  extended experiences." *OBHDP* 91(2).** — Segmentation shapes
  retrospective evaluation. → P44.
  https://doi.org/10.1016/S0749-5978(03)00006-7
- **Rankin, C.H. et al. (2009). "Habituation revisited."
  *Neurobiology of Learning and Memory* 92(2).** — Habituation
  characteristics (modern, non-game). → P26 support.
  https://doi.org/10.1016/j.nlm.2008.09.012
- **Clark, L. et al. (2012). "The impact of near-miss outcomes on
  gambling behavior." *J. Gambling Studies* 28(4).** — Near-miss > net
  loss for motivation. → P32. https://doi.org/10.1007/s10899-011-9275-6
- **Dixon, M.J. et al. (2010). "The impact of near-miss outcomes on
  gambling behavior." *J. Gambling Studies* 26(3).** — Independent
  replication direction. → P32.
  https://doi.org/10.1007/s10899-009-9162-8
- **Heath, C. & Tversky, A. (1991). "Preference and belief: ambiguity
  and competence." *J. Risk and Uncertainty* 4(1).** — Competence
  feeling modulates ambiguity aversion. → P39.
  https://doi.org/10.1007/BF00057884
- **Post, T. et al. (2008). "Deal or no Deal?" *American Economic
  Review* 98(1).** — Path-dependent walk-away decisions at real stakes.
  → P30. https://doi.org/10.1257/aer.98.1.38
- **Sundali, J. & Croson, R. (2006). "Biases in casino betting."
  *JDM* 1(1).** + **Croson & Sundali (2005), *JRU* 30(3).** — Real
  casino bettors mix hot-hand and gambler's fallacy by context.
  → P17 support.

### Source bank — emergent narrative batch (2026-10-06, R-090)

Shipped-system craft:
- **Wildermyth wiki — Data Format / History / Writer's Guide / Story
  Inputs & Outputs.** — History lines (Origin/Anecdote/Motivation) →
  Hooks → Aspects (queryable workhorse: "missingLeftArm", "lover");
  events cast heroes into story *roles* by trait/hook, targets picked
  in order. → P49/P50/P54.
  https://wildermyth.com/wiki/Data_Format_Overview
- **Austin, N. — GDC "Getting Players Emotionally Invested in
  Procedural Characters in 'Wildermyth'".** — Attachment techniques +
  pitfalls (breach of trust, acting out of character). → P50/P54.
  https://gdcvault.com/play/1027614
- **Wiltshire, A. — "How RimWorld Generates Great Stories" (RPS,
  2016).** — Sylvester on apophenia, ~12-colonist cap for per-person
  history, relationship labels, "if it's hard to do, don't". → P51/P50.
  https://www.rockpapershotgun.com/how-rimworld-generates-great-stories
- **Fåhraeus, H. — GDC 2014 "Designing Crusader Kings II to generate
  strange, emergent stories"** + CK2 wiki event modding (trigger /
  MTTH / on_action / scope chains). — Weighted event pools, pulse vs
  triggered events. → P55/P63.
  https://www.gamedeveloper.com/design/video-designing-i-crusader-kings-ii-i-to-generate-strange-emergent-stories
- **Booth, M. — "The AI Systems of Left 4 Dead" (Valve).** — Director
  = intensity pacing (build/peak/fade/relax, held ~5s, decay ~30s),
  not plot. → P55.
- **Pyre (Supergiant, 2017).** — Story continues through defeat;
  failure changes future without fail-safe. → P62.

Narrative structure / authoring economics:
- **Short, E. — "Beyond Branching: Quality-Based, Salience-Based, and
  Waypoint Narrative Structures" (2016).** — QBN (storylets gated on
  qualities), salience-based selection (most-applicable content wins),
  waypoint structures; QBN strengths/costs (state bookkeeping).
  → P56/P59. https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/
- **Kennedy, A. — "Narrative Architecture" (Stagconf 2011, Failbetter
  wiki)** + Failbetter "New Narrative Structures" (Chain, Staircase,
  Pyramid, Buffet) + Dias "Recurring design patterns in storylet
  systems". — Named reusable patterns for gated content. → P56/P63.
  http://wiki.failbettergames.com/narrative-architecture
- **Ashwell, S.K. — "Standard Patterns in Choice-Based Games"
  (2015).** — Time Cave, Gauntlet, Branch and Bottleneck, Quest, Open
  Map, Sorting Hat, Floating Modules, Loop and Grow: the vocabulary
  for structural cost. → P56.
  https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/
- **Bruckman, A. (1990) "The Combinatorics of Storytelling"** +
  Garbe's Authoring Wall / Complexity Ceiling via **"Experiencing the
  Authorial Burden" (ACM 2025)**. — Exponential branching and
  state-tracking burden formally diagnosed. → P56.
  https://dl.acm.org/doi/fullHtml/10.1145/3648188.3675134
- **Cannon, N. — GDC 2024 "How to build branching narrative without a
  big budget".** — Branching spectrum (consequential / thematic /
  expressive); wasted content is the real cost. → P57.
  https://www.gamedeveloper.com/design/how-to-build-branching-narrative-when-you-don-t-have-a-big-budget-
- **Kreminski, M. et al. — StoryAssembler (FDG/ICIDS)** + storylet
  design-space survey. — Planner-based dynamic choice narrative;
  generative authoring patterns. → P48/P56.
  https://mkremins.github.io/publications/StoryAssembler.pdf
- **FDG 2025 — "Stories from the Bottom Up: Composable Story Sifting
  Patterns".** — Event-log sifting: patterns select *interesting*
  event chains post-hoc/incrementally — a candidate mechanism for
  choosing which memories become callbacks. → P55/P49.
  https://dl.acm.org/doi/10.1145/3723498.3723809

Psychology / perception:
- **Fendt, M. et al. (2012). "Achieving the Illusion of Agency."
  ICIDS/LNCS 7648.** — Acknowledged-choice linear story ≈ branching for
  reported agency. → P52. https://qed.games.utah.edu/wp-content/uploads/2025/07/fendt2012agency.pdf
- **Cardona-Rivera, R.E. & Robertson, J. (2014). "Foreseeing
  Meaningful Choices."** — n=88: foreseen meaningfully-different
  outcomes ↑ agency. → P52.
  https://qed.games.utah.edu/wp-content/uploads/2025/06/cardona-rivera_robertson2014foreseeing.pdf
- **Koenitz, H., Roth, C., Knoller, N. & Dubbelman, T. (DiGRA 2018).
  "'Clementine will remember that'"** + **Monchan (2017) thesis**. —
  Telltale conventions; advertised memory without payoff = broken
  promise. → P54.
- **Nature Communications 2026 — agency × episodic memory study**
  (participants with real choice recalled more idiosyncratic event
  structure even when half the events were identical). → P52 support.
  **Claimed by chatgpt-web via PubMed; citation NOT independently
  verified — treat as provisional until the paper is located.**

## Provider audit notes (batch 3)

- **Grok (free/Auto):** weak output — many [UNVERIFIED] tags, several
  restatements of our existing bibliography. **2 false negatives:**
  claimed "Ely-Frankel-Kamenica 2015" and "Li-Bramley-Gureckis 2021"
  "don't exist"; both are real and verified above. Treat Grok-free as
  unreliable for citation audit; usable only for design opinion.
- **DeepSeek (DeepThink+Search):** strongest batch — DOIs check out;
  correctly flagged its own gaps; independently proposed retreat-tax
  and qualitative-band solutions converging with the ChatGPT-DR batch.
- **Claude:** free-tier message cap hit before substantive output —
  dump contains only the prompt echo and "hai esaurito i messaggi
  gratuiti". No usable content; retry on a paid plan or next quota
  window if a third batch is wanted.
- Convergent independent proposals (ChatGPT-DR + DeepSeek): TAKEN≠SECURED
  extraction state; retreat must sacrifice unsecured value; consequence-
  first preview; habituation-aware astrolabe scheduling.

## Provider audit notes (batch 4 — emergent narrative, 2026-10-06)

- **ChatGPT web:** strongest — dense, sourced (GDC, Failbetter wiki,
  academic), produced a real synthesis (3 kinds of emergence; generator
  of *conditions* not stories). One citation needs verification (Nature
  Comms 2026 agency×memory — flagged in source bank).
- **DeepSeek web:** strong — precise mechanics (Wildermyth hook gates:
  relationship level 3–4, 1 hook/hero/campaign; L4D intensity decay
  numbers), Kennedy quotes. Inline numeric refs, partial link integrity.
- **Grok web:** usable at design-opinion level, consistent with batch-3
  audit — no verifiable citations ("133 sources" claim unverifiable).
- **Gemini web:** soft-fail — status `success` but content was a
  refusal ("hard time fulfilling"); zero usable content.
- **Claude web:** failed — "response did not stabilize". No content.

## Corrections to this document's prior claims (batch 2)

1. **Zeigarnik effect — downgraded.** Earlier framing ("incomplete
   objective stays active because Zeigarnik") is too strong. The 2025
   meta-analysis finds no reliable memory advantage; only resumption
   tendency replicates. Replace with goal-proximity framing (P19/P20).
2. **House money → greed — not a law.** Thaler & Johnson found the
   effect in lab; Rüdisser et al. found the opposite direction in a real
   field setting. Keep only: prior outcomes move the reference point.
   Do not design assuming gains make players greedy.
3. **Fail-forward — doctrine, not science.** Literature does not
   support "every failure must be mitigated into progress". More
   defensible: failure must produce a *readable consequence*, which may
   be recoverable or permanent (Huber et al. 2025 shows cheap failure
   changes investment behaviour — a trade-off, not a free win).
4. **XCOM "95% miss feels unfair" — anecdote, not evidence.** No study
   gives an unfairness threshold for variance. Community discourse only.
5. **Retreat keeps loot — structural defect flagged.** Deep Research
   independently identified our flee-rules as the core stake hole: if
   the haul is never at risk, nothing is ever "on the table". Fix via
   TAKEN→SECURED distinction, not by removing retreat.
6. **Named ≠ attached (batch 3).** Endowment alone does not create
   attachment — identification does (Cohen 2001; Bopp et al. 2016:
   moving deaths required investment). Our per-slot naming is necessary
   but insufficient; each preset needs a distinctive trait/function or
   the sacrifice won't land (P45).
7. **Rare lethality is invisible even when shown (batch 3).** Hertwig
   et al. 2004: rare outcomes underweighted under experience-based
   choice. "M2%" reads as zero; if death must be felt as possible it
   needs frequency/icon framing ("1 su 50", skull marker), not only a
   percentage (P38).

## Literature gaps (what science does NOT answer — playtest territory)

- No controlled study on failure-distribution in a 3–5 min losable RPG
  quest segment (minor/strategic/quest/character/catastrophic mix). S1
  itself is the experiment.
- No study on 3-named-party permadeath at this timescale (attachment ×
  risky decision × bodyguard sacrifice × extraction). M% tuning and
  attachment depth are not derivable from literature.
- No evidence that a numeric suspicion meter beats diegetic signals or
  vice versa (stealth sources are postmortems, not experiments).
- No optimum for number of push-your-luck iterations ("3 rounds" is not
  a finding).
- Emotional pacing in 3–5 min quests is unstudied (batch 3, DeepSeek):
  pacing evidence comes from long media; transfer to a short
  management/quest segment is assumed, not measured.
- RNG tolerance in non-gambling contexts is unstudied (batch 3):
  near-miss and control literature is gambling-heavy; how much dice
  variance a party-quest player attributes to themselves vs "rigged"
  has no empirical bound — playtest question.

## Stealth pressure sources (batch 2 — for future noise-type quests)

- **Thief: The Dark Project postmortem (Game Developer, 1999).** —
  Sensory AI (sound propagation, inter-AI communication, alarm states)
  as core gameplay, not decoration. → P28.
- **Malville, L. — "Super Spy Crash Course: Teaching Players in
  Splinter Cell: Blacklist" (GDC 2014).** — Playtest-driven teaching of
  intended stealth behaviour via multiple channels. → P28.
- **Ubisoft — "The Evolution of Assassin's Creed's Stealth" (2024,
  official).** — Awareness meter as legible guard-suspicion signal;
  low/high profile action split. → P28.

## Diagnosis vs our S1 — audit 2026-10-03 (status: machinery right, game missing)

We built the apparatus of suspense and forgot to put the stake on the
table. Juice is a multiplier around a zero.

### Done right (serves a principle)

| Element | Principle |
|---|---|
| Astrolabe = anticipation window (commit→flight→settle→pause→card) | P7 — suspense lives between choice and outcome |
| Named per-slot risk (F%/M% per character; bodyguard intercepts) | P4/loss aversion — stakes are owned people, not points |
| Death save 5% ("scampata per miracolo") | joy as reverse of fear — only if death is truly possible |
| Push-your-luck after the objective | P4 — correct climax position (Incan Gold) |
| Preview → commit → honest retreat contract | informed commitment; retreat = play, not surrender |
| Tower creature as telegraphed threat ("qualcosa di grosso") | threat with a face, revealed early |
| Merchant 2-of-3 scarcity | real cost-opportunity trade-off |
| 5-level verdict | belief variance in resolution (Ely-Kamenica) |

### Done wrong (violates a principle)

| Element | Principle | Evidence |
|---|---|---|
| Quest is unfailable on the prudent path | P1 | M2-3% until crate; lethality only behind opt-in extremes |
| Nothing accumulates "on the table" | P4 | flee keeps loot by design → true stake (lives+objective) hidden behind low % |
| Fail does nothing (`wound-roll → continue`) | P5 | the doctrine's worst failure mode |
| Landslide event decides without a player act | P6 | 25% auto-wound pre-ownership |
| Decisions are check-selectors | P3 | approach = "which die do I roll"; infiltrate+smoke dominates → EV-solvable |
| Outcome variance ~0 on prudent path | P2 | Astrolabe spins about nothing: performed, not felt |
| Side door = main door clone (−3%) | P9 | textbook illusory choice |
| Death = a log line | P11 | emotional peak wasted; flat outcome card |
| Chained checks auto-resolve ("tiro 2 di 2") | P3 | agency removed at peak tension |
| Fiction ≠ math ("massacro" with 0 damage) | narrative transportation | breaks immersion contract |
| 12-15s Astrolabe × 5 checks | P7 without P2 | anticipation budget burned on low-stakes rolls |
| Deterministic across runs | Sylvester (unique decisions) | run 2 is already solved |
| Secondary stats undeclared | — | player can't plan (cage needs STR, undeclared) |

### Live playtest evidence (2026-10-03, seed 1983, Preset D → VICTORY)

Instrumented run via Puppeteer — full chronicle in
`.mw/runs/20261003-quest-v6-science/playtest-seed1983.md`. Findings the
static audit could not see:

- **Extraction phase does not exist in code.** After the chest roll the
  run self-concludes ("La spedizione è finita"). TAKEN == SECURED today.
- **Death-on-WIN rendered as log lines.** Kran died intercepting for Ivo
  on a WIN 75-vs-74: `[INTERCEPT]`+`[DEATH]` with no beat, no
  attribution line, and his card still shows HP 10/10 while DEAD.
  → P11 violation observed live.
- **"WIN" is a near-false verdict** — the harm band applies even on
  success (Ivo wounded 3×, two on WINs): WIN = "success AND damage
  anyway". Verdict taxonomy does not communicate real cost.
- **Objective check auto-resolved** ("ROLL 1 OF 2") — the single
  decision that mattered was executed without input or commit surface.
- **Noise meter still live but inert** — prints `RUMORE ◉○○`, no
  consequence on the short path. Parked decision ≠ parked code.
- **Failure path unreachable on prudent play** — 6 WIN / 6 rolls; a FAIL
  cannot be observed by playing well. → P1/P2 confirmed live: belief
  variance ≈ 0.
- **Victory card ignores cost** — death, rescued prisoner, accumulated
  noise unaccounted; the end does not narrate the *how* → P11/peak-end.

### Structural fixes implied (not new systems)

1. Make the quest losable: accumulated objective/stake must be at real
   risk on the main path, reachable by misjudgment.
2. Make failure change the situation: failed check closes/alters a
   later option (fail-forward), not just a wound roll.
3. Render the stake visible: lives + objective as "gems on the table",
   especially before the push-your-luck climax.
4. **Batch-2 addition — TAKEN ≠ SECURED.** The objective must pass
   through an unsecured state: grabbed crate → still carryable-away
   during extraction → permanently secured only at quest end. This
   single state change creates the missing accumulated stake (P4/P17/
   P18) without adding a meter.
5. **Batch-2 addition — preview must show consequence, not only
   odds.** "If this fails: the patrol reaches the crate first" is a
   decision input; "F20/M5" alone is a math input (P22).
6. **Batch-2 addition — Astrolabe scales with stake.** Five identical
   long reveals habituate (P26); reserve the full ceremony for the
   climax/extraction beats (P7 under P26).

### Implementation status (2026-10-03, commit b35295c6)

The Director-approved minimal slice landed: TAKEN→SECURED state, the
`estrazione` choice node with three mechanically-gated routes (breach
requires the freed prisoner; calm field requires the camp never woke —
`campoSveglio` flag; hostile field always at declared price F25/M8 with
`failHint` shown in preview), and a composed epilogue naming deaths, the
lost crate, the saved prisoner, and loot brought home. Correlated fixes
from the same evidence: epicfail now confined inside the declared M band
(M0 checks cannot kill — Director rule enforced in `resolveCheckHarms`);
the noise≥3 divert now applies check effects before hijacking the
destination (a successful crate grab at noise 3 was silently discarded);
deaths attribute the causing check in the log. 24/24 unit tests + two
live runs (SURVIVED-with-cost, WIPE-with-named-deaths). Evidence:
`test-results/r-081-quest-s1-taken-secured-2026-10-03.log`. Validation
gate now pending on human playtest: "can you say what you lost and for
which choice?"

## Parked / to research next

- Noise meter: REMOVED by Director order 2026-10-03 (commit `f7a55a73`).
  Replaced by named camp states — quieto → allertato → sveglio (−10pp,
  closes the quiet extraction) → risveglio on a further inside failure.
  Stealth literature remains parked for future stealth-specific quest
  types (Thief postmortem, Splinter Cell GDC 2014, AC stealth evolution);
  the open question is meter-vs-diegetic pressure (unanswered by
  literature).
- Risk band / verdict↔harm coupling: Director rule 2026-10-03 —
  epicfail operates *within* declared band; never creates unannounced
  death. → formalize as check-contract spec.
- Next literature to add: Apter reversal theory (arousal framing),
  Schell lenses (relevant subset), Costikyan "Uncertainty in Games"
  (2013, MIT Press — taxonomy of uncertainty sources, cited but not yet
  digested), Bateman "imaginary victories"/challenge porn angle if
  needed.
- Follow-up batch available on demand: Grok DeepSearch, Claude
  Research, DeepSeek DeepThink — same prompt in
  `.mw/runs/20261003-quest-science-deepresearch/prompt.md`.

<!-- ===== repo-snapshot/QUEST_GENERATION_ARCHITECTURE.md ===== -->

---
title: Quest Generation Architecture — gimmick core, scene base, hook, flavour
type: design-framework
status: PROPOSAL — direzione discussa con il Director, NON canonizzata.
  Specchietto riassuntivo consolidato: context/QUEST_GENERATION_SPEC.md
  (living doc — questo file resta l'analisi dettagliata FACT/PROPOSAL/OPEN)
source: context/ingestions/2026-10-10-quest-generation-flavour-experiment.md,
        context/ingestions/2026-10-10-quest-colpi-di-scena.md,
        context/ingestions/2026-10-10-quest-generation-deepening.md
related: R-091 (struttura/flavor, generatore a vincoli), R-108 (vincoli quest),
         R-111, R-112 (colpi di scena — direttiva Director), R-113 (deepening),
         R-127 (approcci alternativi alla core gimmick — §16),
         R-149 (gimmick «meld» — §17),
         OPEN-014, QUEST_IMPRINTS.md, QUEST_GAMEPLAY_SCIENCE.md,
         PLAN-019-S2.1 (schema scenario canonico)
---

# Quest Generation Architecture (proposta)

Framework per **generare quest varie** senza riscriverle da zero e senza
ridurle a sequenze prefabbricate. Tre domande guida: la gimmick dà un
problema, le scene danno decisioni locali, gli hook le collegano.

> Caveat portato dal materiale sorgente e confermato qui: questo sistema
> aumenta la *probabilità* di ottenere decisioni vere — non le garantisce.
> La verifica resta sul feeling giocato, non sul rispetto formale delle regole.

## 1. I tre livelli (più il climax)

| Livello | Ruolo | Vincolo chiave |
|---|---|---|
| **A. Gimmick core** | Problema centrale: variabili che evolvono, condizioni di risoluzione, dilemma caratteristico | Deve generare un dilemma, non un timer decorato |
| **B. Scene base** | Ostacoli, opportunità, informazioni, costi, alternative | Interessanti *anche localmente* — non eventi generici + modificatore |
| **C. Hook della core** | Modificano la scena via variabili centrali: costi, rischi, opzioni, conseguenze | La scena crea una decisione locale che *acquista significato* grazie alla core |
| **D. Crescendo/climax** | Risoluzione che dipende dalla core E dalla storia del run | — |

La distinzione scena/hook è **concettuale** — non richiede due oggetti
separati in codice. (Nota di mapping: nello schema canonico S2.1 una scena
corrisponde verosimilmente a un nodo/sottografo; gli hook a variabili di
stato — flag, contatori — lette/scritte dalle opzioni. Mapping formale
ancora da fare, vedi §8.)

## 2. Il vincolo del 75% (obiettivo, non garanzia)

≥75% delle scene **non finali** interagisce con la core. Un hook conta come
tale solo se ALMENO una:

1. modifica una variabile centrale;
2. apre o chiude un approccio;
3. cambia il costo/rischio di una decisione successiva;
4. crea un compromesso scena-corrente ↔ risoluzione finale;
5. altera le condizioni del climax in modo comprensibile al giocatore.

- **Anti-esempio**: «infligge danni generici» non è un hook. «Eviti danni
  spendendo la risorsa che serve alla core» lo è.
- **Quota di respiro**: una minoranza di scene scollegate è legittima e
  desiderabile (varietà, ricompense, deviazioni) — non ogni scena deve
  essere un ingranaggio dello stesso meccanismo.

## 3. Le quattro proprietà della scelta vera

Ogni scena si valuta su:

| Proprietà | Verifica | Diagnosi se assente |
|---|---|---|
| **Trade-off** | le alternative hanno vantaggi E costi diversi? | un'opzione sempre migliore → scelta apparente |
| **Conseguenza** | cambia qualcosa di concreto, ora o dopo? | tutte le opzioni → stesso stato → cosmetica |
| **Contesto** | dipende da party + stato della core? | altrimenti è un selettore di percentuali |
| **Attribuzione** | il giocatore può spiegare perché è successo? | altrimenti "tassa RNG" (cf. P6, P36) |

Corrispondenza con `QUEST_GAMEPLAY_SCIENCE`: Trade-off ≈ P3 (scelta con
failure mode reale); Conseguenza ≈ P5/P9; Contesto ≈ P9; Attribuzione ≈
P6/P36. **Suspense senza agency è ammessa ma distinta**: un tiro puro può
tendere, non dà scelta.

## 4. Varietà combinatoria — i due fallimenti opposti

| Fallimento | Sintomo |
|---|---|
| Scene scollegate | eventi belli ma trasferibili a qualsiasi quest — la gimmick è un filtro cosmetico |
| Scene tutte uguali | ogni evento tocca la stessa variabile con «paga o rischia» |

Antidoto proposto: **catalogo di archetipi decisionali** (famiglie, non
gimmick) —

- acquisire X rinunciando a Y;
- scegliere **chi** si espone;
- interpretare informazione ambigua;
- ostacolo con approcci incompatibili;
- ordinare una sequenza di operazioni;
- sfruttare una vulnerabilità creandone un'altra.

**Contratti di compatibilità** (proposta operativa): ogni scena dichiara
variabili che può *leggere*, che può *scrivere*, e decisioni che può
offrire; ogni gimmick dichiara hook accettati e quali conseguenze rendono
significativo il suo climax. → generazione vincolata ma non prefabbricata
(discendente diretto del «generatore a vincoli in 3 passi» di R-091/OPEN-014).

## 5. Esperimento flavour-separation (già eseguito, grezzo)

Metodo: stessa gimmick + stessa sequenza di scene, due flavour diversi.
**Gimmick: Gara di avanzamento** — party e rivale progrediscono verso
obiettivi incompatibili (0→6); scene che accelerano il party, rallentano il
rivale o danno vantaggio a costo di risorse/ferite.

- Tag catalogo (ipotesi, NON canonici): Foresta antica · Monastero infestato
  · Passo montano · Laboratorio proibito · Città assediata.
- Estratti: **Monastero infestato** (A: «Il cuore del monastero») e
  **Passo montano** (B: «La corsa oltre il passo»). 4 scene ciascuna,
  percentuali illustrative (75/65/60/70%).

**Finding dell'esperimento grezzo**: cambiare flavour a struttura fissa è
facile e produce testo leggibile; MA con +2/successo e soglia 6 il climax si
raggiunge in 3 successi — scene uniformi, climax che rischia di essere
irrilevante. *La struttura non basta: serve che le scene interagiscano con
la core in modi diversi.*

## 6. Per renderla matematicamente interessante (direzione concordata)

Separare tre quantità:

1. **P(successo scena)** — probabilità locale del check.
2. **Avanzamento relativo** — quanto l'esito avvicina alla vittoria vs il
   rivale.
3. **P(vittoria quest)** — funzione delle decisioni accumulate.

Modello a tre approcci per scena (numeri ILLUSTRATIVI, non calibrati):

| Approccio | P(succ) | Effetto | Costo del fallimento |
|---|---|---|---|
| Prudente | 90% | party +1 | nessuno |
| Rapido | 65% | party +2 | ferita / risorsa |
| Interferenza | 70% | rivale rallentato | il rivale avanza comunque |

**Criterio di interesse**: strategie con risultati diversi; nessuna
dominante ovunque; scelte passate che spostano P(vittoria); climax incerto
ma attribuibile; party diversi → strategie diverse (stesso criterio del
gate R-109 su F6).

MC da fare SOLO dopo aver fissato le regole (§8) — politiche da simulare:
sempre-prudente, sempre-rapido, sempre-interferenza, adattiva-sullo-stato.
Replica identica sui due flavour → isola l'effetto flavour.

## 7. Allineamento con il corpus emozioni (ingestion 2026-10-09)

- La Gara è una gimmick diversa da push-your-luck: buon secondo banco di
  prova per il framework (PYL = F6 goblin; Gara = quest generata).
- I tre pilastri del resoconto finale (posta accumulata, sacrificio
  attribuito, info a costo) sono *archetipi decisionali* del catalogo —
  la lista §4 li contiene o li estende.
- Il vincolo Director «3-4 decisioni cruciali» (R-108): le scene minori
  possono essere check semplici; le 4 proprietà si applicano con forza
  piena solo ai bivi cruciali — questione aperta se il 75% va contato sulle
  scene o sulle *decisioni*.

## 8. Questioni aperte

1. **Regole della Gara da fissare**: avanzamento rivale per fase (fisso?
   variabile? visibile?); il check fallito consuma una fase?; i danni
   possono impedire di proseguire?; pareggio al climax → chi vince?; gli
   approcci sono sempre tutti disponibili o alcune scene ne offrono due?
2. **Compile-time vs runtime**: il framework genera *scenari authored* che
   compilano in `QuestScenarioSchema` (preferibile — compatibile con S2.1 e
   coverage tests) o un motore a vincoli runtime? Da decidere prima di
   qualsiasi implementazione.
3. **I contratti scena↔core sono dati o convenzione?** (Schema Zod?
   Documentazione? Test?)
4. **Il 75% si misura su scene o su opzioni?** E chi lo verifica — test
   automatico sul grafo (enumerabile, cfr. `declaredReachable` S2.1) o
   review di design?
5. **Flavour ≠ solo testo**: se il flavour deve cambiare anche *quali
   hook* sono disponibili (valanga ≠ spiriti), il contratto scena↔core deve
   dichiarare tag compatibili — altrimenti il reskin è solo lessicale e
   l'esperimento non misura niente.

## 9. Quarto livello: colpi di scena (direttiva Director — R-112)

Requisito del Director: ogni quest può contenere un **colpo di scena** che
cambia significativamente la partita — una % di presenza, anche «a
prescindere», e trigger possibili nei **tratti caratteriali dei PG**
(es. Avido → scena extra post-vittoria; Scavezzacollo → chiude l'opzione
prudente e obbliga la route FORZA+PERCEZIONE).

**Tassonomia proposta (4 tipi):**

| Tipo | Effetto sul grafo | Trigger tipico |
|---|---|---|
| Personalità che interferisce | scena extra che rimette in gioco la vittoria | tratto PG + contesto |
| Deviazione obbligata | chiude un'opzione, forza la route rischiosa | tratto PG / composizione |
| Rivelazione che cambia l'obiettivo | trasforma il climax | info scoperte, stato quest |
| Conseguenza ritardata | il climax legge flag accumulati | scelte/risorse precedenti |

**Decomposizione: trigger → evento → impatto.** Il twist non è
necessariamente un nodo aggiunto: può sostituire una scena, chiudere
un'opzione, aprire un percorso, trasformare il climax. Lo stesso tratto
seleziona fra *eventi compatibili*, non uno fisso.

**Criterio di qualità**: dopo il twist il giocatore deve avere *un problema
sostanzialmente diverso* — testo cambiato o più danno non bastano.

**Regole di casualità controllata**: compatibile col contesto e col party
reale; non sempre negativo; significativo senza annullare le scelte
precedenti; MC misura l'impatto su successo/morte/ricompensa.

**Mapping FACT sull'esistente** (da verificare nei dettagli): il motore già
esprime i tipi 2 e 4 come *rami condizionali authored* — opzioni gated da
flag/stato (cfr. `agguato-scelta`, requisiti slot) e flag persistenti di
run. I tipi 1 e 3 sono anch'essi esprimibili come nodi condizionali *se* il
trigger è un flag noto. I due gap, **verificati 2026-10-10**: (a)
**tratti PG sul roster reale** — `ResidentState` (TimeEngine.ts:222) NON ha
tratti caratteriali: `statTags` sono etichette derivate dalle stat
dominanti (es. `['reason','lantern']`), non personalità → serve un campo
nuovo (es. `traits: string[]`) o un namespace di trait dentro `statTags`;
(b) **la % «a prescindere»** — oggi la probabilità vive solo nei check; un
roll di trigger servirebbe come check dedicato a inizio run, flag di
ingresso settato a `createRun`, o selezione a compile-time (il generatore
sceglie quali rami-twist sono presenti nel grafo authored).

**Tensione aperta (da nominare al Director)**: twist stocastico puro vs
R-108 «sorprese eque, retrospettivamente logiche». Trigger leggibili
(tratto visibile sulla scheda PG, flag accumulato con indizi) rendono il
twist *attribuibile*; un roll invisibile no. Probabile sintesi: la % sceglie
*quale* twist tra quelli compatibili, non *se* — i trigger eleggibili sono
sempre leggibili in preview.

## 10. Readiness — abbastanza per prototipare, non per implementare

Verdetto concordato: le idee bastano per un **prototipo di generatore**;
mancano le specifiche per implementarlo senza decidere al posto del
Director. Stop alla ricerca generale → formalizzazione.

**Componenti stabilite**: meccaniche centrali · gimmick delle scene ·
colpi di scena · flavor/tag (che vincolano la compatibilità, §8.5).

**Da definire prima di implementare:** regole di combinazione senza
incoerenze; contratto dei twist (condizioni verificabili + modifica di
stato + conseguenze osservabili); rappresentazione di percorsi
alternativi/condizioni/nodi obbligatori/climax; metriche e soglie MC;
criterio «valida vs interessante».

**Percorso proposto (5 passi):** modello minimo → generatore limitato →
lotto piccolo di quest → simulazione (incl. frequenza e impatto reale dei
twist, influenza per-nodo) → raffinamento del catalogo dove serve.

**Prossimo passo concreto**: spec del generatore + sistema di test,
separando ciò che è deciso da ciò che il prototipo deve verificare.
Nessuna implementazione autorizzata in questa fase.

## 11. Esempio end-to-end — «La corsa al Passo di Granvello»

Esempio ideale del flusso completo, dall'input del mondo alla settlement.
Tutti i numeri sono ILLUSTRATIVI (da calibrare via MC), la struttura è la
cosa da valutare.

### Fase 0 — Input (contesto mondo)

- POI disponibile: `passo-granvello` (tag flavour: **Passo montano**).
- World scaling (S2.3): `daysPlayed` → danger 1.15×, reward 1.10×.
- Banda obiettivo: `media`→`alta` sul `referenceParty`.
- Party reale scelto dal giocatore: Edda (leader), Milo (**tratto: Avido**),
  Bruna, Kran (**tratto: Scavezzacollo**) — i tratti entrano nel run come
  *trigger eleggibili*.

### Fase 1 — Generazione (compile-time, produce uno `QuestScenario`)

**1a. Scelta gimmick** — `gara-di-avanzamento`. Il core dichiara:
- variabili: `race.you 0..6`, `race.predoni 0..6`, `supplies 0..3`;
- risoluzione: `you ≥ 6` prima di `predoni ≥ 6` al climax;
- dilemma caratteristico: velocità ↔ sicurezza ↔ sabotaggio;
- hook accettati: `+you`, `+predoni`, `−supplies`, `chiudi-opzione`,
  `posticipa-climax`.

**1b. Skeleton scene** — 5 scene non finali + climax. Il generatore pesca
archetipi decisionali *diversi* (anti «tutte uguali», §4):

| # | Archetipo | Scena (flavour passo) | Read | Write |
|---|---|---|---|---|
| S1 | Approcci incompatibili | Barricata dei predoni: sfondare (forza, rumoroso) vs aggirare (agi, lento) | race, supplies | +you / +predoni |
| S2 | Chi si espone | Chi guida sulla cresta esposta? (il membro scelto prende il rischio) | party, race | +you / ferita membro |
| S3 | Acquisizione con rinuncia | Rifugio di montagna: comprare la guida (−supplies, −predoni) vs proseguire | supplies | −supplies → −predoni |
| S4 | Info ambigua | Tracce doppie nella neve: check perc per leggere quelle giuste, altrimenti strada lunga | race | +you o +0+predoni |
| S5 | Respiro/ordine | Bivacco: curare (consuma tempo → +predoni) vs proseguire feriti | party.hp, race | hp / +predoni |
| C | Climax | Il crinale: intercettare il convoglio | race.you, race.predoni | vittoria/fallimento |

**Check 75%** (automatico, §2): S1–S5 tutte toccano variabili core → 100%
> 75%. La scena di respiro (S5) resta hookata via `+predoni` — ma anche se
non lo fosse, la quota minoritaria è consentita.

**1c. Twist deck** — trigger eleggibili dal party reale:

| Twist | Trigger | Compatibilità | Impatto |
|---|---|---|---|
| Deviazione obbligata | Kran Scavezzacollo | S1 (approcci incompatibili) | chiude «aggirare» → solo «sfondare» con malus |
| Interferenza tratto | Milo Avido | post-climax, solo se vittoria | scena extra: Milo trattiene il reliquiario → fermalo/assecondalo/dividi |
| Conseguenza ritardata | flag `guida-comprata` (S3) | climax | la guida era un informatore: predoni +1 al crinale |

Roll di selezione: **la % sceglie QUALE twist è armato, non SE c'è** — i
trigger eleggibili restano leggibili in preview (badge tratto sulla scheda,
"La guida sapeva troppe cose" come indizio in S3). Estratto: **Avido +
conseguenza ritardata** armate; Scavezzacollo dormiente in questo run.

**1d. Binding flavour = domain kit** (corretto dopo verifica, vedi §12):
il tag `passo-montano` non è una skin lessicale — carica il suo **domain
kit** (schema già esistente in `QUEST_IMPRINTS.md`): creature ammissibili
(predoni di montagna), ruoli (guida alpina, magistrato del valico), luoghi
(bivacco, crinale, rifugio), props, fisica (valanga, freddo, cicli di
neve), **regole di coerenza che bloccano**. Le scene si riempiono dal kit:
la variante «tracce doppie» di S4 esiste solo se il kit fornisce tracce
ammissibili; altrimenti il generatore pesca dalla lista dei **tag
adiacenti** (E-08). Variabili e soglie restano identiche tra flavour — il
kit cambia vocabolario, hook disponibili e validazione.

**1e. Output** — `QuestScenario` authored con ~14 nodi: 6 spine + rami
condizionali (`flag: trait-avido`, `flag: guida-comprata`, ecc.) +
nodi-twist dormienti. `scenarioVersion` hash del contenuto.

### Fase 2 — Verifica automatica (prima che la quest esista in gioco)

- **Schema + integrità grafo** (`QuestScenarioSchema`, S2.1).
- **Coverage**: `declaredReachable` ⊆ `exploreScenario` — ogni ramo twist ha
  un witness replay; nessun ramo irraggiungibile.
- **75% + 4 proprietà**: enumerazione statica — ogni scena che legge/scrive
  core conta; le opzioni con stesso stato risultante vengono flaggate come
  cosmetiche.
- **MC policy matrix** (N≥1000, paired seeds): sempre-prudente /
  sempre-rapido / interferenza / adattiva × party {reference, weak,
  three, solo}. Criteri: nessuna politica dominante ovunque; nodi con
  influenza misurata sull'esito (un nodo che non sposta mai nulla →
  segnalato); bust/twist comprensibili-non-prevedibili.
- **Banda di pericolo**: `deriveOfferBand` sul `referenceParty` → dichiara
  `alta`. Gate: se misura `media`, la quest entra come `media` o torna al
  bilanciamento — mai dichiarata diversa dal misurato.

### Fase 3 — Giocata (esperienza target)

1. **Offerta**: POI mostra banda `alta`, durata stimata, reward tier.
2. **Assegnazione** (preview numeri esatti, R-108): i badge tratto sono
   visibili — «Milo: Avido» rende il twist *leggibile in anticipo*. Portare
   Milo è una scelta: più perc/int, più rischio di coda imprevista.
   *(Questo trasforma il trigger in decisione pre-quest — attribuzione.)*
3. **S1–S5**: 3-4 decisioni cruciali marcate (es. S1 approccio, S2 esposi-
   zione, S3 rinuncia); le altre scorrono come check minori.
   L'interfaccia mostra sempre `gara: tu 3 / predoni 4` — distanza al
   traguardo visibile (P41).
4. **S3**: compri la guida (−1 supplies, predoni −1). Indizio authored:
   «la guida guardava troppo il vostro bottino». Flag `guida-comprata` ON.
5. **Climax**: arrivi pari (5-5). La conseguenza ritardata scatta: predoni
   +1 perché la guida li ha avvisati → sei a 5-6, e la scena finale non è
   «intercetta» ma «rinsegui in salita» con check più duri. **Il problema
   è cambiato** — criterio del twist vero, retrospettivamente leggibile
   («avevi l'indizio»).
6. **Post-vittoria** (se vinci): Milo Avido → scena extra. Tre opzioni:
   fermarlo (check carisma, rischio lite = ferita), assecondarlo (+oro,
   flag `avidita-premiata` per il mondo), dividere (costo oro, nessun
   rischio). Trade-off vero, non moraleggiante.
7. **Settlement**: ferite/morti/loot/flag persistono (TAKEN≠SECURED già
   rispettato: il reliquiario conteso era `taken`, diventa `secured` solo
   dopo la scena di Milo). La flag `guida-era-informatore` può riemergere
   in quest future (narrativa emergente, P48–P63).

### Fase 4 — Cosa misura il playtest umano

MC ha già risposto su: influenza nodi, dominanza politiche, letalità per
party. Resta agli umani: il twist si è sentito *equo*? («sapevo di Milo»)
il climax cambiato ha prodotto rabbia o «geniale»? le 3-4 decisioni
cruciali erano percepite tali? Protocollo controfattuale: «cosa hai perso
e per quale scelta?».

## 12. Il sistema dei tag — tre assi distinti (inventario)

Non «i tag»: nel progetto esistono TRE assi, da non confondere.

### 12.1 Tag dominio/flavour — sulla quest (esiste già, DRAFT)

Fonte: proposta Director R-091/E-08 + `QUEST_IMPRINTS.md` (domain kit
compilati: `palude`, `mare`, `miniera`).

- Il tag è un **domain kit**: creature ammissibili, ruoli sociali
  (`autorita_contratto`, `stakeholder_economico`, `testimone_comune`),
  luoghi, props, fisica (cicli/pericoli/tracce ammissibili), regole di
  coerenza bloccanti. «Non un aggettivo» (insight Director).
- Il tag **seleziona varianti di fase**: «città» → indagine sociale, non
  tracce nel bosco. Scena senza variante per il tag → pesca dai **tag
  adiacenti** (grafo di adiacenza, proposta E-08 — adiacenze non ancora
  definite).
- **Distanza tra tag** = metrica su fisica + struttura sociale del dominio
  (non sui nomi): serve per garantire varietà percepita (P53) — due tag
  «vicini» producono la stessa famiglia causale.
- I 5 tag del trascript (Foresta antica, Monastero, Passo, Laboratorio,
  Città) sono **composite** (ambiente+minaccia+posta) e NON canonici: sono
  candidati da compilare come kit, non ancora kit.

### 12.2 Tag tratto — sul PG (NON esiste, gap verificato)

`ResidentState` non ha tratti caratteriali (verificato 2026-10-10).
I tratti (Avido, Scavezzacollo) sono i **trigger dei twist** (§9):
campo nuovo da creare (es. `traits: string[]` o namespace dentro
`statTags`), visibile in scheda = trigger leggibile → attribuzione.

### 12.3 `statTags` — meccanici (esiste, altro scopo)

`ResidentState.statTags`: etichette delle stat dominanti
(`['reason','lantern']`), usate per il matching slot-requisiti. Non sono
flavour né personalità — non confonderle con gli altri due assi.

### Mappa flusso: chi consuma quale asse

| Fase | Tag dominio | Tag tratto | statTags |
|---|---|---|---|
| Generazione: varianti scena | kit → vocabolario+coerenza | — | — |
| Generazione: twist deck | filtra eventi compatibili | trigger eleggibili | — |
| Assegnazione party | — | badge leggibile (preavviso twist) | matching slot |
| Runtime | testo/icone/props | flag `trait-*` armati | bonus check |
| Post-quest | entità scritte nel mondo | flag `avidita-premiata` | — |

### Cosa manca ancora sui tag dominio

- **Tassonomia canonica**: quali tag esistono (i 5 del trascript + palude/
  mare/miniera degli imprint sono candidati, non ratificati).
- **Grafo di adiacenza**: chi confina con chi (E-08 lo presuppone, nessuno
  l'ha mai scritto).
- **Metrica di distanza**: come si quantifica «stessa famiglia causale».
- **Kit compilati**: 3 esistono (negli imprint), 0 nel sistema quest.

## 13. Contratti — cosa manca per la spec del generatore

Verdetto concordato: il quadro è completo a livello di idee, **non** a
livello implementabile. I 4 deliverable da scrivere prima della spec del
generatore minimo:

1. **Contratto meccaniche+scene**: per ogni gimmick — variabili+limiti,
   condizioni avanzamento/vittoria/sconfitta/stallo, decisioni+costi, hook
   accettati, condizioni di climax. Per ogni scena — prerequisiti,
   variabili lette/scritte, opzioni, costi, esiti, interazioni col climax.
2. **Contratto twist + ciclo di vita** (risolve la tensione §8.2/§9):
   - *compile-time*: tutti i rami possibili nel grafo, verificati
     raggiungibili;
   - *inizio run*: selezione del twist tra gli eleggibili (casualità
     controllata, seed-riproducibile);
   - *in-run*: trigger/scelte/flag guidano l'attraversamento — **il grafo
     non muta**, si percorrono rami. È il modello `ScenarioInstance` di
     S2.3 (istanza congelata nel save): un twist = flag settato a
     `createRun` + rami condizionali già authored. Aperto: selezione
     una-tantum vs trigger successivi indipendenti.
3. **Contratto domain kit + tratti**: kit = ammissibilità+coerenza
   (§12.1); tratti = tre casi distinti — *abilita* opzione, *preclude*
   opzione, *innesca* evento (evita che ogni tratto degeneri nello stesso
   inconveniente); fallback, vincoli bloccanti, conseguenze persistenti.
4. **Piano di validazione** con soglie esplicite (alcune = parametri
   sperimentali): per ogni generazione — nodi irraggiungibili, scelte
   cosmetiche (criterio d'influenza), compatibilità kit, frequenze
   vittoria/sconfitta/morte/costi, politiche dominanti, influenza marginale
   per nodo e per twist, banda misurata = banda dichiarata.

**Varietà strutturale** (verifica separata): due quest con tag diversi
possono avere la stessa sequenza decisionale → percepite come template.
Misura sulle **strutture decisionali** (diversa dalla distanza-domain-kit:
quella misura il mondo, questa il gameplay).

**Curva emotiva**: distinguere scene cruciali da minori nella sequenza
(pressione → dilemma → conseguenza → risoluzione); gli esiti sfumati del
motore (critico/quasi/grave) devono poter produrre conseguenze distintive
— problema di authoring, non di engine.

## 14. Gli assi del testo — domain kit non basta

I testi incoerenti del probe hanno dimostrato che kit+gimmick descrivono
*cosa accade*, non *come raccontarlo*. Quattro assi separati:

| Asse | Definisce | Nota |
|---|---|---|
| **Domain kit** | elementi/fenomeni ammissibili (vincoli di mondo) | §12.1 |
| **Story mode** | priorità narrativa/emotiva | esplorazione, horror, intrigo, avventura-epica |
| **Core gimmick** | struttura causale → cosa il testo deve rendere percepibile | gara: avanzamento e costo del tempo |
| **Narrative voice** | forma della prosa | config globale/profilo, non tag di quest |

«Fantasy» non è un tag allo stesso livello: è proprietà del mondo.
**Niente lista piatta** di concetti di livello diverso.

Più il **brief automatico per scena** (derivato dai dati, non scritto a
mano): cosa accade davvero; fatti noti vs ignoti; cosa il giocatore deve
percepire/chiedersi; cosa è inventabile e cosa no; quale info meccanica
deve restare leggibile nel testo.

Anti-esplosione: regole per asse + criteri d'interazione, validatore di
riferimenti/contraddizioni, pass critico qualità, rigenerazione dei dubbi.

**Test controllato prima di ratificare la tassonomia**: una scena fissata,
si varia UN asse alla volta; criteri — coerenza fattuale, chiarezza
situazione/posta, atmosfera, zero dettagli gratuiti. Se horror↔esplorazione
non produce differenze riconoscibili → il tag non lavora; se produce solo
aggettivi cupi → il modello non ha capito.

## 15. Chain quest — archi persistenti sopra lo stesso generatore

La main quest **non è una quest lunga spezzata**: è un **arco persistente
che genera occasioni di gioco e reagisce alle risoluzioni**.

**Tre livelli di generazione:**

| Livello | Quando | Definito |
|---|---|---|
| Arco | alla nascita | premessa, antagonista, obiettivi intermedi, svolte possibili, conclusioni |
| Segmento | quando disponibile | situazione concreta, obiettivo, conseguenze |
| Quest | prima dell'offerta | il pipeline completo §11 |

Mai pre-generare ogni scena: gli esiti devono poter cambiare le quest
future (uccidi un personaggio chiave → l'arco si adatta). L'antagonista ha
un piano coerente, non un copione.

**UI**: fili persistenti (situazione corrente / prossima opportunità /
posta), categorie attivi-disponibili-sospesi-conclusi; il giocatore vede
il problema e le conseguenze delle omissioni, non le svolte. *(mockup
concettuale, non proposta di componente)*.

**Il problema chiave: il tempo.** N archi × opportunità ogni X → saturazione
o calendario. Separare avanzamento-mondo / disponibilità / scadenza (solo se
fiction-giustificata). **Ignorare ≠ perdere reward**: il mondo cambia, un
alleato agisce, il nemico si rafforza, la prossima opportunità è più dura
→ scelta strategica «non puoi fare tutto».

**Integrazione**: stesso generatore + layer arco (stati/transizioni,
condizioni di sblocco, entità persistenti, conseguenze d'esito).
Contatto con l'esistente: `village_event_system_spec`, memoria emergente
P48–P63, registro narrativo (R-093) — ma **nessun contratto di arco
esiste**: questo è il gap.

## 16. Approcci alternativi alla core gimmick (proposta Director — R-127)

Voice-note Director 2026-10-10: una core gimmick risolvibile su una stat
può ammettere **canali di check alternativi** su stat/skill diverse.

- **Esempio canonico del ragionamento:** quest di infiltrazione con
  gimmick «l'allarme sale» — di base si tira Destrezza (passare di
  soppiatto); con il canale magia si tira **Intelligenza** («invisibilità»),
  con il canale sociale **Carisma** («camuffamento»).
- **Vincolo di scope esplicito:** la sostituzione vale **solo per i check
  che muovono la variabile core** («ogni tiro che dovrebbe far aumentare
  l'alarm»). I check non-core della stessa quest restano sulle stat
  native — il «ponte traballante» si tira sempre su Destrezza, le scene
  di forza su Forza. La quest *non* viene ridipinta: «rimarrà una quest
  basata sulla destrezza» nelle parti non-gimmick.
- **Asse diverso dagli approcci di scena:** `approcci-incompatibili`
  (§3.1/§4) è una scelta *dentro* una scena; il modello a tre approcci
  §6 (prudente/rapido/interferenza) è una postura rischio/reward. Qui il
  punto è una proprietà del **gimmick**: *tutti* i check che toccano la
  var centrale possono essere tirati su un canale diverso.
- **Distinzione di tipo che ne consegue:** check **core-gimmick**
  (scrivono/leggono la var centrale) vs check **di scena** (ostacoli
  locali). Nel contratto v0 questa distinzione non è ancora un campo —
  è la marcatura che la proposta richiede.
- **Mapping FACT sul motore attuale:** `QuestNode.stats: LabStat[]` lega
  già le stat per nodo; l'offerta copre le stat via `statFocus` con check
  di coerenza. Due forme implementative candidate, **da decidere**:
  (a) vocabolario stat alternativo sullo stesso nodo core; (b) nodi check
  paralleli gated da flag/approccio (rami authored, stesso pattern dei
  twist §9). La quest goblin — allarme reale `campoAllertato`/
  `campoSveglio` + scelta di approccio in F3 — è il testbed naturale.
- **INFERENCE marcata:** «tirando invisibilità» suggerisce canali gated
  da skill/capacità del party (link desiderata v10/v12: skill equip,
  Int→slot skill) — non dichiarato esplicitamente, da confermare.
- **Tensione da tenere d'occhio (non conflitto):** se il canale è gated
  da skill/party, la preview deve mostrare *quali canali il party scelto
  può usare* — altrimenti la regola «numeri esatti in preview» (R-108)
  non è rispettata sul check core.
- **Aperto:** modello di binding (per-check vs per-run vs gated) →
  **OPEN-017**; status regola in `QUEST_RULES.md` §7 = `proposta`.
  Risposta AI del transcript troncata a metà — la contro-proposta non è
  recuperabile (ingestion E-07).

### 16.1 Risultati della ricerca strutturata (2026-10-10 — R-128)

Ricerca multi-provider + ricerca propria su 6 sotto-argomenti — rapporto
completo in `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md`, evidenza grezza
in `.mw/runs/20261010-gimmick-channels-research/`. Findings chiave:

- **Binding — ADOTTATO 2026-10-11 (delega Director, R-134):** il modello
  raccomandato dalla ricerca è un **ibrido**: lock di approccio a
  run-level (precedente heist/ME2 Suicide Mission), gated dalle
  capability del party (precedente immersive sim / BG3 / Shadow
  Tactics), con eccezioni a consumo per singoli check (exception budget
  stretto). Per-check free choice degrada a shopping di percentuali sotto
  preview a numeri esatti; best-of-party dissolve l'identità party
  (anti-pattern WotR). Regola `vigente` in `QUEST_RULES.md` §7;
  prototipo su quest goblin in `plans/PLAN-028-gimmick-channels-v0.md`;
  OPEN-017 risolta, monitoraggio espressività in OPEN-018.
- **Forma dati — leaning:** varianti di canale sullo stesso nodo check
  (storylet-gating Failbetter), non nodi paralleli con rejoin — crescita
  del grafo = zero, compatibile con no-runtime-mutation. Corrisponde alla
  candidata (a) sopra; la (b) è sconsigliata dalla ricerca.
- **Differenziazione minima:** i canali devono differire su ≥2 assi
  (costo/rischio/conseguenza/fiction) e soprattutto nei **profili di
  fallimento** — warning: il nostro allarme è strutturalmente un
  «failure counter» come le skill challenge 4e fallite; i canali devono
  produrre transizioni di stato diverse, non alimentare lo stesso
  contatore.
- **Preview:** canali bloccati greyed con requisito («Requires: …»),
  risk tag semantico + stakes accanto alle odds; panel di coverage
  party×canali pre-quest (UI nuova, nessun precedente shipped trovato).
- **Narrativa:** Minimal Viable Acknowledgment — un channel-verb nel
  verdict basta come default (tier T1 ~1.1× costo); divergenza testo
  fallimento ≥ successo; il canale diventa asse di validazione
  parallelo al domain-kit (`mustNotImply`/`failureTells`/`channelVerb`).
- **Validazione:** policy MC per channel health (always-X, party-locked,
  adaptive-pick-best con soglia degeneracy >70-80%, adaptive-conserve).
- **Raffinamento scope:** anche tra i check core, menu multi-canale solo
  sui pivot check (~20-30%) — routine check a canale singolo del lock.
- **Divergenza-nota:** research segnala che i numeri esatti in preview
  possono sopprimere la scelta espressiva (EV-shopping). La regola R-108
  è frozen e non si tocca; la mitigazione è differenziare su assi non-EV
  + stakes narrative accanto alle odds. Da sottoporre al Director.

## 17. Gimmick «meld» — bonus a scadenza non dichiarata (proposta Director — R-149)

Director 2026-10-12: terza core gimmick candidata, ispirata al **Meld di
XCOM** — «sai che qualcosa sta per scadere tra X turni non dichiarati;
hai un indicatore che ti dice che potresti avere un bonus extra se sei
veloce».

- **Struttura:** un **tracciato bonus parallelo** all'obiettivo
  principale — non la condizione di vittoria. Il contenitore/meld è
  raggiungibile solo se il party devia dalla rotta sicura e copre la
  distanza `rotta → soglia` prima che la `scadenza` arrivi a zero.
- **Vars:** `rotta` (avanzamento verso il contenitore, mossa dai check
  del tracciato), `soglia` (fissa, tuning), `scadenza` (turni residui,
  decresce a ogni azione).
- **La novità rispetto a race/flood — deadline nascosta, indicatore a
  stati nominati:** il numero di turni residui **non è dichiarato** al
  giocatore. L'indicatore mostra solo stati: «disponibile» → «in
  scadenza» → **«ultima chiamata»** («ultimo turno per raggiungerlo»)
  → «scaduto». Stessa filosofia degli stati d'allarme nominati
  (`campoAllertato`/`campoSveglio` vs meter numerico, QUEST_RULES §9)
  e della soglia nascosta del NarrativeBrief (§13: lo stato corsa è
  visibile, la soglia no). I numeri delle *scelte* restano esatti
  (R-108): è lo *stato del mondo* a essere velato.
- **Opzioni ad alto rischio:** le fasi del tracciato offrono opzioni
  rapide con **rischio ferita/morte esplicito** che avanzano `rotta`
  più in fretta — correre costa sangue, andare piano costa il bonus.
  Stessa famiglia prudente/rapido del §6, proiettata su una deadline.
- **Risoluzione:** `rotta ≥ soglia` in tempo → bottino extra, TAKEN ma
  non SECURED fino all'uscita; `scadenza = 0` → il bonus si perde e la
  quest prosegue sull'obiettivo principale. Perdere il meld non è una
  sconfitta — è l'occasione mancata, e deve essere *attribuibile*
  («sono andato piano io», non «il timer mi ha fregato»).
- **Twist candidati:** `doppio-meld` (secondo contenitore sulla rotta
  opposta — non prendi entrambi), `meld-presidiato` (contenitore
  sorvegliato, la raccolta richiede ingaggio).
- **Status:** `proposta` — registrata nel lab registry
  (`QUEST_LAB_GIMMICKS.meld`, status `proposal`) con vars, dilemma,
  twist e sceneKeys; generator `meldGimmick.ts` non ancora scritto.
  Per il `GimmickRegistry` operativo (PLAN-029) è oltre il cap v1 di 2
  righe — candidata naturale per «gimmick extra» in v1.1.
- **Aperto:** la `scadenza` nascosta rende il meld una gimmick con
  **incertezza di stato** — verificare in playtest che «non so quanti
  turni ho, ma vedo che sta per chiudere» produca pressione e non
  frustrazione da informazione negata (equità retrospettiva R-108).

## 18. Hidden check, nodi hazard e «ricompensa ingannevole» (R-151, 2026-10-11)

Richiesta Director: aggiungere il **mimic** — arrivi al tesoro, check
nascosto di percezione; se fallisci perdi HP e combattimento extra; se
hai successo non perdi HP, il combattimento è breve (sorpresa tua) ma
non c'è reward. Più censimento di ciò che manca a gimmick core e di
fase, con ricerca online (taxonomie Tim Cain, spedizioni Darkest
Dungeon, XCOM, FTL/StS, letteratura D&D sulle trappole).

### 18.1 Categoria strutturale nuova: nodi hazard

Il catalogo `DecisionFamily` (CONTRACTS §3.1) copre solo **scene con
scelta**. Il mimic è un **evento senza scelta nel momento**: un check
nascosto che si auto-innesca su un nodo ricompensa e produce
conseguenze. È la prima categoria di nodo oltre alle scene decisionali:
i **nodi hazard** — trigger automatico, check nascosto, esito che può
includere harms/combat/deviazione. Contratto v0 in
`QUEST_GENERATION_CONTRACTS.md` §15.

**Regola vigente (QUEST_RULES §3):** il check è nascosto *prima* ma mai
*dopo* — quando fallisce e l'effetto scatta, il giocatore deve vedere
che ha fallito un check e su cosa. «Il perché delle cose non si
nasconde mai dopo» (Director 2026-10-11). Questo trasforma la sorpresa
in sorpresa **equa retrospettivamente** (P6/P13/P36).

### 18.2 Il mimic nel dettaglio

- **Tre esiti possibili, non due:** la forma Director è check fallito →
  HP + combat lungo; check riuscito → combat breve a sorpresa, nessun
  bottino (la cassa È il mostro). Terzo esito candidato: riuscito →
  opzione di **disimpegno** (eviti lo scontro, rinunci comunque alla
  «cassa») — trasforma il check in decisione vera, più coerente col
  framework. Da valutare a design di scena.
- **Nessun loot in nessun ramo** — si modella pulito con
  TAKEN≠SECURED: il takeLoot non viene mai emesso.
- **Frequenza controllata:** armabile come twist/kit-gate
  (`fakeRewardChance` o ramo authored nei generatori). Se ogni tesoro
  può essere un mimic a rate alto, i giocatori imparano a
  «punzecchiare tutto» — comportamento degenerato documentato.
- **Kit-gated:** il mimic deve stare in `creature_ammissibili` del kit
  (rovine/dungeon sì, palude aperta no) — regola di coerenza bloccante.
- **Indizi = equità:** il canale esploratore (QUEST_RULES §2) e i
  tratti (`prudente`/`sospettoso`) sono i vettori di leggibilità;
  `NarrativeBrief.hiddenFromPlayer` è il posto dove vive il segreto.

### 18.3 La famiglia «ricompensa ingannevole»

Varianti dello stesso schema (la ricompensa promessa mente):

| Variante | Inganno | Esito |
|---|---|---|
| mimic | la cassa è un mostro | combat invece di loot |
| loot maledetto | il tesoro è reale MA applica malus/cursore | mollare = perdere reward; tenere = portarsi il costo |
| piedistallo trappolato | prendere X scatta conseguenza salvo compensazione | swap/disinnesco come requisito |
| tesoro rivendicato | il bottino è di qualcuno | conseguenza di fazione/mondo (gap: fazioni missing) |
| falso riparo / falsa pista | il «posto sicuro» non lo è; la deviazione è esca | costo tempo/HP |

### 18.4 Decisioni del Director sulla gap map (2026-10-11)

- **Reskin ≠ vera varietà:** gimmick che condividono l'algebra dei
  cursori con race/flood (preda, salmento, doppio fronte) possono
  esistere ma **non contano** nella metrica di varietà strutturale
  (rafforza §13 «varietà strutturale» — la distanza si misura sui
  dilemmi e sulle scene emesse, non sui nomi delle variabili).
- **Curio layer (DD): REJ-008** — `context/REJECTED.md`.
- **Incontri neutrali** (viandanti, mercante errante, prigioniero):
  al massimo scena minore in quest con molte scene — non una famiglia.
- **Famiglie candidate non adottate** — registrate come scoperte, non
  nel catalogo attivo: `male-minore`, `boon-faustiano`, `stanza-?`,
  `luce-vs-furtivita`, `inganno-agente` (quest'ultimo collega IMPR-002:
  l'indizio falso è *piazzato* da un agente che ci guadagna).
- **Combat nodes arricchiti** (props interagibili, boss a stadi):
  interessante — l'implementazione va pensata a parte, non bloccante.

### 18.5 Core gimmick: il censimento resta aperto

Dalla ricerca restano candidate *strutturalmente nuove* (non reskin):
**rituale** (boss che si potenzia col tempo → PYL sul climax),
**scorta** (VIP fragile come secondo cursore), **difesa a ondate**
(direzione invertita: il mondo viene a te), **cargo volatile**
(l'obiettivo stesso è il pericolo), **corruzione** (cursore su un
membro — unico asse interno al party), **indagine a soffio**
(prove/sospetto/scadenza). Nessuna adottata: per il `GimmickRegistry`
operativo il prossimo slot dopo `meld` resta una decisione del
Director (cap v1 di PLAN-029).

## 19. Gimmick candidata «indagine» — deduzioni fallibili e acquisizione trasversale (R-286, 2026-10-25)

Discussione Director↔AI del 2026-10-25. Compendio completo:
`context/ingestions/2026-10-25-gimmick-indagine-e-acquisizione-info.md`.
**Status: PROPOSAL** — sviluppa la candidata «indagine a soffio» di
§18.5; nessuna ratifica, nessuna implementazione autorizzata, cap v1
del roster invariato.

### 19.1 Requisiti espressi dal Director

- **Fallibilità epistemica reale:** una deduzione sbagliata può
  determinare la sconfitta della quest — non solo testo diverso o uno
  svantaggio. Applicazione del principio vigente (QUEST_RULES §9) a una
  forma di sconfitta nuova: non ferita/morte/fuga ma *errore di
  conclusione*.
- **Indizi re-investigabili:** sullo stesso indizio si può tornare più
  volte (più interazioni, più domande); interpretazione e sicurezza
  evolvono nel tempo, non sono una-tantum.
- **Raccolta passiva e trasversale:** le informazioni si raccolgono
  anche in giro, dentro altre situazioni e come conseguenza di scelte
  fatte per altri motivi — il meccanismo deve essere riusabile da
  *tutte* le gimmick future, non vivere solo nelle scene investigative.
- **Ancore della mappa esiti:** successo critico = convinzione
  *corretta* con sicurezza alta; fallimento critico = convinzione
  *sbagliata* con sicurezza alta.

### 19.2 Il modello proposto (AI, non ratificato)

Due variabili separate per ogni interpretazione di un indizio:

- **Direzione** — l'indizio sostiene o contraddice la tesi.
- **Sicurezza** — quanto il personaggio *crede* alla propria lettura:
  tre livelli proposti (basso/medio/alto). La sicurezza è **soggettiva**:
  non la probabilità che l'interpretazione sia vera. È ciò che rende
  possibile «assolutamente convinto del falso» senza che il gioco bari
  sui dadi — il tiro decide la convinzione, la verità resta authored.

Mappa esiti→interpretazione (estremi Director; intermedi proposti):

| Verdetto | Direzione | Sicurezza |
|---|---|---|
| `bigwin` | corretta | alta |
| `win` | corretta | media |
| `almost` | **aperta** (candidato: esito parziale / incertezza tra due letture) | **aperta** |
| `fail` | sbagliata | media |
| `epicfail` | sbagliata | alta — errore *radicato*, non semplice |

**Re-investigazione senza grinding:** ogni interazione è una *nuova*
osservazione/domanda/verifica che può rafforzare, indebolire, ribaltare
la direzione, o **radicare una convinzione falsa** — scavare più a fondo
nell'errore è un esito possibile. Mai un incremento automatico della
stessa barra (altrimenti «ripeti fino a certezza»).

### 19.3 Acquisizione: il sistema in tre atti

La parte realmente mancante individuata dalla discussione: non
l'interpretazione ma la **raccolta**. Proposta: l'indagine non è una
modalità di gioco separata ma un sistema trasversale —

1. **Acquisizione** — come il personaggio entra in possesso
   dell'informazione;
2. **Interpretazione** — quale tesi l'informazione sembra sostenere e
   con che sicurezza (§19.2);
3. **Deduzione** — come le informazioni permettono di formulare e
   verificare una conclusione.

Quattro modalità di acquisizione proposte — **ingressi dello stesso
meccanismo, non quattro sistemi**:

| Modalità | Trigger | Note |
|---|---|---|
| Percezione passiva | ingresso scena, evento, azione, tratto/stat del PG | realizza il requisito Director E-03 |
| Osservazione intenzionale | scelta esplicita del giocatore | qui entrano i check a 5 verdetti |
| Interazione | domande, dialoghi, negoziazioni, reazioni NPC | dipende da situazione e interlocutore |
| Scoperta emergente | conseguenza di *qualsiasi* altra meccanica | il ponte verso le gimmick future |

**Concetto chiave — «evento informativo»:** qualunque scena o meccanica
può emettere un evento che contiene ciò che il personaggio ha
percepito/appreso; il sistema investigativo decide quali interpretazioni
ne derivano. **Informazione acquisita ≠ interpretazione** — è questa
separazione a rendere gli errori deduttivi non arbitrari: il giocatore
può sbagliare *interpretando*, non perché il dado ha mentito.

### 19.4 Aperto: affidabilità dell'acquisizione

Due regimi possibili, **da decidere per-evento** (proposta AI):

- **A — oggettiva:** il gioco comunica ciò che il personaggio ha notato;
  l'errore nasce solo in interpretazione.
- **B — fallibile:** comunica ciò che *crede* di aver notato; l'errore
  può nascere già in acquisizione (personaggi inaffidabili). Più
  potente, meno leggibile.

Terza via proposta: ogni evento informativo dichiara se è oggettivo,
parziale o soggetto a interpretazione fallibile. Tensione da progettare:
il regime B incontra la regola vigente dei check nascosti (QUEST_RULES
§3, R-151 — «il perché delle cose non si nasconde mai dopo»): quando
l'errore si risolve, la rivelazione retroattiva va scritta nel design.

### 19.5 Seam motore esistenti (FACT)

Il layer base esiste già: 5 verdetti con `verdictTable` dichiarativa,
`setInfo`/`requiresInfo` (info-gating usato da `raceGimmick`), `vars`
numerico, `armRolls`/`rollFlag`, `hiddenCheck` (R-151). Quello che
**non** esiste: un layer «interpretazioni» sopra `info[]` (direzione ×
sicurezza × storia delle re-investigazioni) e un punto di
**dichiarazione** nel grafo — il climax investigativo.

### 19.6 Materiale recuperato dal transcript integrale (2026-10-25, update)

Il transcript integrale della conversazione 22→25 ottobre è stato
recuperato (`context/ingestions/2026-10-22-25-quest-generation-gimmick-transcript.md`;
gap analysis `context/ingestions/2026-10-25-transcript-integrale-gap-analysis.md`
S-11..S-14). Recuperati:

- **Riferimenti gialli (era «candidatura Agatha Christie»):** corpus di
  5 racconti valutati col criterio «la scelta del sospettato può
  diventare condizione di vittoria/sconfitta senza meccanica estranea?».
  Finalisti: *Il doppio indizio* (Christie — 4 sospettati, 2 indizi di
  cui uno possibile depistaggio; semplice ma sconfitta da verificare) e
  *I quattro sospettati* (Christie/Marple — 4 candidati, ricostruzione
  articolata). Analizzati e scartati come primo modello: *Il carbonchio
  azzurro*, *Boscombe Valley*, *Il nobile italiano*, *Testimone d'accusa*.
- **Rappresentazione delle convinzioni (era in «grafica delle
  convinzioni»):** tre componenti su un unico modello dati — *registro
  degli indizi* («cosa so», consultabile a ogni turno), *diario
  dell'indagine* («cosa è successo»), *ricostruzione delle conoscenze*
  (confronto fra indizi; collegamenti espliciti in seguito). Principi:
  la memoria del giocatore non è un requisito; niente tabellone in v1;
  niente auto-interpretazione — la deduzione resta al giocatore.
- **Tassonomia meccaniche investigative:** 8 famiglie a livello di
  regole (interrogazione con feedback vincolato, raccolta a costo,
  propagazione dei vincoli, combinazione, verifica di ipotesi, ricerca
  nello spazio delle possibilità, confronto testimonianze, deduzione
  indiretta) con decomposizione input/feedback/aggiornamento/decisione —
  livello *regole* sotto le modalità di acquisizione di §19.3.

**Ancora non recuperato** — la sessione separata del pomeriggio 25/10
(gimmick/race/indagine) non è nel transcript: mancano i dettagli su
**dichiarazione irrevocabile della conclusione** (cosa si dichiara,
quando, con quali conseguenze) e l'**elenco delle soluzioni alla
fallibilità valutate e scartate**. «Albero degli indizi» e «tesi
contrapposte» sono solo sfiorati (registro/ricostruzione sopra) →
da ri-coprire col Director → OPEN-023.

## 20. Core gimmick vs sfumature sul tema vs domain kit — modello corretto (Director 2026-10-25)

**Direttiva Director:** una core gimmick può avere **più sfumature/
varianti sul tema**, e la documentazione attuale è **sbagliata** perché
censisce come gimmick cose che sono la stessa gimmick con variazioni —
«invece di avere 15 gimmick, ne avremo molte di meno». Vanno analizzate
e divise in core gimmick + sfumature sul tema.

### 20.1 Esempio canonico — «avanzamento sul tracciato» (race)

La gimmick è: esiste un **tracciato**, si accumulano **victory point**,
eventi possono far avanzare o retrocedere sul tracciato, agevolare o
ostacolare il raggiungimento del traguardo. Sullo *stesso* macchinario:

| Sfumatura | Come si esprime il limite |
|---|---|
| **a tempo** | X VP entro N round fissi |
| **contro avversario** | stessi X VP; il limite è il cursore dell'antagonista — chi arriva prima vince |
| **resistenza** (tower-defense/DotA-like) | sopportare N round di pressione esterna = accumulare i VP resistendo |

Le miglia corse / miglia nautiche / km a cavallo sono **flavour** —
livello domain kit, separato.

### 20.2 Il modello a tre livelli

1. **Core gimmick** — l'algebra del problema: variabili, operatore di
   avanzamento, *famiglia* delle condizioni-limite.
2. **Sfumatura sul tema** — come il limite si esprime sulla **stessa
   algebra** (tempo fisso / cursore avversario / sopravvivenza). Non è
   una gimmick diversa e non è solo dressing: è una parametrizzazione
   meccanica del pattern di pressione.
3. **Domain kit** — rivestimento (fiction, nomi, props, creature).

**Criterio di bordo (da raffinare):** stesso set di vars + stesso
operatore di avanzamento, con la pressione riparametrizzabile →
sfumatura; algebra o operatore decisionale diversi → gimmick diversa.

### 20.3 Correzione del censimento (ipotesi da verificare per-voce → OPEN-024)

Sotto questo modello gran parte delle «candidate gimmick» di §18.5 e del
roster sono verosimilmente **sfumature di «avanzamento sul tracciato»**:

| Voce attuale | Lettura nel modello corretto |
|---|---|
| `race` (implementata) | sfumatura «contro avversario» del tracciato |
| `flood-vault` | sfumatura a tempo/pressione ambientale (l'acqua sale → esci col bottino) |
| `meld` | sfumatura a scadenza (tracciato bonus) |
| `difesa a ondate` (§18.5) | sfumatura «resistenza» — identica a quella descritta dal Director |
| `scorta`, `cargo volatile`, `rituale`, `corruzione` | da classificare: cursore secondario / oggetto-pericolo / escalation temporale — probabili sfumature o cugini stretti |
| `investigation` (§19) | **gimmick diversa davvero** — algebra epistemica (indizio → direzione×sicurezza → dichiarazione), nessun tracciato di VP |
| push-your-luck (F6 goblin) | da verificare: il suo operatore caratteristico è la decisione stop/continua — potenzialmente un'altra algebra |

### 20.4 Conseguenze (PROPOSAL)

- **`CoreGimmick` contract (CONTRACTS §2):** serve un asse per le
  sfumature — la condizione-limite come *famiglia parametrizzata*
  (deadline / cursore avversario / round di pressione), non hardcoded
  nella singola gimmick.
- **Metrica di varietà strutturale (§18.4):** va applicata alle core
  gimmick *dopo* il collasso delle sfumature — contare `race` e
  `difesa a ondate` come due gimmick sovrastima la varietà reale.
- **Re-analisi del censimento** = task aperto → OPEN-024: produrre la
  lista vera delle core gimmick e, per ciascuna, le sue sfumature.

### 20.5 Re-analisi del censimento (2026-10-25, PROPOSAL — classificazione per-voce da ratificare)

Verifica sui descriptor `QUEST_LAB_GIMMICKS` e sui generatori: **tutte le
gimmick implementate condividono la stessa algebra** — un cursore del
party verso un goal, un cursore-limite che avanza, eventi che spostano
l'uno o l'altro. Cambia solo *come il limite è espresso*:

| Voce | Algebra osservata | Classificazione proposta |
|---|---|---|
| `race` (offline) | `you` vs `rival` → `goal`; il rivale avanza sui tuoi fail/scelte lente | tracciato — sfumatura **contro avversario** |
| `flood-vault` (offline) | `uscita` vs `acqua` (auto-avanzante a OGNI azione) → goal/limite | tracciato — **contro avversario (ambiente auto-escalante)**; vena PYL secondaria: ogni presa di loot = mini-decisione continua/cassa sotto pressione crescente |
| `meld` (proposal) | `rotta` → `soglia`; `scadenza` decresce a ogni azione (nascosta, a stati nominati) | tracciato — sfumatura **a tempo** (deadline velata = scelta di presentazione, non algebra nuova) |
| `difesa a ondate` (§18.5) | sopportare N round di pressione = accumulare i VP resistendo | tracciato — sfumatura **resistenza** (la forma descritta dal Director verbatim) |
| `rituale` (§18.5) | il rituale si potenzia col tempo = cursore avversario auto-escalante; climax PYL | tracciato — contro avversario; il climax PYL è un operatore di scena, non la core (da verificare) |
| `scorta` (§18.5) | avanzamento proprio + HP del VIP = secondo cursore che **non deve** completarsi | tracciato — variante «cursore da proteggere» (il limite è una seconda traccia vulnerabile) |
| `cargo volatile` (§18.5) | l'oggetto portato degrada → deadline internalizzata nel carico | tracciato — sfumatura a tempo con il timer *dentro* l'inventario |
| `corruzione` (§18.5) | cursore su un membro del party — asse interno | tracciato — variante «cursore interno» (borderline: la pressione è dentro il party, non nel mondo) |
| infiltrazione/**allarme** (esempio R-127/128) | l'allarme avanza **solo sui tuoi fallimenti** | tracciato — variante «pressione = errori propri» (cursor fed by failure, cf. warning F12) |
| `investigation` (§19) | indizio → interpretazione (direzione × sicurezza) → dichiarazione | **core gimmick diversa** — algebra epistemica, nessun tracciato di VP |
| **push-your-luck** (F6 goblin) | pot che cresce, rischio di bust in escalation, operatore **continua/cassa** | **caso di bordo** — candidato a core propria: l'operatore caratteristico è *quando fermarsi*, non *come arrivare prima*. Quando il limite è deterministico e dichiarato (il «muro certo» di F6) collassa in tracciato-resistenza; PYL vera = bust stocastico/nascosto |

**Sotto il livello gimmick** (non candidati): `inganno-agente` (indizio
falso piazzato → spazio dell'indagine, regime acquisizione B §19.4);
`boon-faustiano` (benefit ora / costo dopo → archetipo di scena o tipo
di twist); `stanza-?`, `luce-vs-furtivita`, `male-minore` — semi di
meccaniche di scena, non problemi-quest.

**Esito:** il censimento si riduce a **2 core gimmick** («avanzamento
sul tracciato», «indagine») + **1 caso di bordo** (PYL, da sciogliere
col criterio operatore-decisionale) + una famiglia di sfumature del
tracciato. La «varietà» del roster attuale è interamente sfumatura —
coerente con la diagnosi Director.

**Nota su race come modello (collega tensione S-08/S-20):** nel modello
corretto la race implementata non è «la gimmick race» ma la sfumatura
*contro avversario* del tracciato — qualsiasi ranking di gimmick
(rituale prima, race sconsigliata «poco fantasy») valutava **sfumature
dello stesso core**, non core diverse. Il ranking resta valido come
scelta della *sfumatura banco di prova*, non del core.

### 20.6 Criterio di bordo formalizzato — quando una sfumatura diventa gimmick diversa (PROPOSAL)

Una voce è **sfumatura** della stessa core gimmick se cambia solo il
modo in cui il limite/pressione si esprime, a parità di algebra.
Diventa **core gimmick diversa** quando cambia ALMENO una di:

| Asse | Domanda di discrimine | Tracciato | Indagine |
|---|---|---|---|
| **Algebra dello stato** | le vars sono cursori di avanzamento? | sì | no — interpretazioni (direzione × sicurezza), verità nascosta authored |
| **Operatore decisionale** | qual è la domanda caratteristica del giocatore? | «come arrivo prima?» | «cosa dichiaro vero?» |
| **Forma della sconfitta** | si perde quando un cursore-limite si completa? | sì | no — si perde per conclusione errata |

Basta UN asse diverso per uscire dalla sfumatura. Una sfumatura non crea
mai un operatore decisionale nuovo: se il giocatore deve rispondere a
una domanda che non è «come arrivo prima?», non è più solo una variante
del limite.

### 20.7 Verdetto proposto su push-your-luck — terza core candidata (PROPOSAL)

PYL soddisfa il criterio di bordo su **due** assi:

- **Operatore decisionale diverso:** «continuo o casso?» — una decisione
  di *ritiro*, non di avanzamento. Nel tracciato ogni scelta serve ad
  andare più veloci/sicuri; in PYL il bottino è già tuo e la domanda è
  se rischiarlo per altro.
- **Forma della sconfitta diversa:** nel tracciato si perde quando il
  limite *esterno* si completa (tempo, rivale, acqua); in PYL si perde
  quando *hai scelto di continuare una volta di troppo* — il fallimento
  è auto-inflitto dal timing, non da un cursore che ti raggiunge.

**Ma:** la PYL *vera* richiede che il punto di bust sia **stocastico o
nascosto**. Quando il limite è deterministico e dichiarato — il «muro
certo» di F6 goblin (razzia infinita → wipe certo) — il giocatore può
contare i round e la decisione torna «arrivare prima del limite noto»:
**collassa dentro tracciato-resistenza**. Conseguenze:

- **G-C «rischio crescente / cash-out»** — core gimmick candidata:
  algebra = pot che cresce + bust nascosto/stocastico + operatore
  continua/cassa.
- **PYL-deterministica** (F6 goblin, vena loot di `flood`) = sfumatura
  tracciato con sotto-decisioni di ritiro — le due algebre **si
  compongono**: tracciato come core della quest, PYL come operatore di
  scena/vena secondaria. Composizione ammessa: un hook di scena può
  essere una micro-PYL dentro una quest-tracciato.

### 20.8 Abbozzo dell'asse `variants` nel contratto `CoreGimmick` (PROPOSAL)

La condizione-limite diventa una **famiglia parametrizzata**, non un
dettaglio della singola gimmick. Bozza (non contract-ready):

```ts
type LimitPattern =
  | { kind: 'deadline'; rounds: number; visibility: 'declared'|'named-states'|'hidden' }
  | { kind: 'rival-cursor'; advanceOn: 'failures'|'actions'|'timer'; visibility?: ... }
  | { kind: 'endurance'; rounds: number; pressureProfile: ... }
  | { kind: 'vulnerable-cursor'; scope: 'external'|'member'|'carried' }
```

Mappatura sul censimento: `race` = rival-cursor/failures; `flood` =
rival-cursor/actions (+vena PYL); `meld` = deadline/named-states;
`rituale` = rival-cursor/timer; `difesa a ondate` = endurance;
`infiltrazione` = rival-cursor/failures; `scorta` =
vulnerable-cursor/external; `corruzione` = vulnerable-cursor/member;
`cargo volatile` = vulnerable-cursor/carried.

**La visibilità è un asse ortogonale** (regola meld: numero nascosto →
stati nominati; estendibile a qualsiasi pattern) — non una sfumatura.

Cosa NON cambia tra sfumature: vars di avanzamento, operatore «arriva
prima», hook accettati, algebra dei verdetti. Un kit domain veste la
coppia (gimmick, pattern); il contratto scena dichiara quali pattern sa
leggere (una scena che «rallenta il rivale» non vale sotto `endurance`
→ compatibilità pattern↔scena da dichiarare, stesso meccanismo degli
hookTypes).

### 20.9 Esito aggiornato del censimento

| Core gimmick | Algebra | Sfumature / istanze |
|---|---|---|
| **G-A «avanzamento sul tracciato»** | cursori → goal, operatore «arriva prima» | deadline (`meld`, `cargo volatile`) · rival-cursor (`race`, `flood`, `rituale`, `infiltrazione`) · endurance (`difesa a ondate`) · vulnerable-cursor (`scorta`, `corruzione`, `cargo`) · reskin (`preda`, `salmento`, `doppio fronte`) |
| **G-B «indagine»** | indizio → direzione×sicurezza → dichiarazione | §19 + 8 meccaniche investigative (S-11) + regime acquisizione A/B |
| **G-C «rischio crescente / cash-out»** (candidata) | pot + bust nascosto + continua/cassa | PYL stocastica; le istanze deterministiche restano in G-A |

### 20.10 Scope della gimmick: core vs di scena (definizione Director 2026-10-29)

**Definizione Director:** una quest deve avere una **core gimmick** che
**perdura per tutta la storia (o quasi)** e si **interlaccia con le
varie scene**; possono però esistere anche **gimmick specifiche di una
singola scena**.

Mapping sul framework esistente (§1, SPEC §3.2): è la distinzione già
presente tra Livello A (gimmick core) e Livello B (scene gimmick /
archetipi decisionali), qui resa esplicita come **regola di scope**:

- **Core gimmick** — persiste lungo la quest: le scene la leggono e la
  scrivono (regola 75%, §2), il climax la risolve. «Interlacciarsi con
  le scene» = gli hook: la scena ha significato locale E modifica le
  variabili/condizioni core.
- **Gimmick di scena** — algebra locale a una scena: entra, si gioca,
  esce. Non è tenuta a persistere né ad agganciare la core (può farlo:
  allora è *anche* un hook).

**Le algebre (G-A tracciato / G-B indagine / G-C cash-out) sono
ortogonali allo scope** — la stessa algebra può istanziarsi come core
di una quest o come gimmick locale di una scena:

| Esempio | Core | Scena |
|---|---|---|
| tracciato | `race`, `flood`, `meld` come core | una scena «fuga a tempo» dentro una quest-indagine |
| indagine | `investigation` (§19) come core | scena-interrogatorio (meccanica Mastermind S-11) dentro una quest-tracciato |
| cash-out | PYL-stocastica come core | vena loot di `flood`: micro-continua/cassa dentro tracciato |

**Distinzione da tenere:** *gimmick di scena* (un'istanza d'algebra
giocabile) vs *archetipo decisionale* (una forma di scelta — «chi si
espone», «acquisire X rinunciando a Y» — che può non portare algebra:
è un bivio, non un mini-gioco). Gli archetipi restano il catalogo delle
scene; alcuni di essi sono algebre miniaturizzate, altri no.

## 21. Tassonomia corrente delle gimmick (Director 2026-10-29 — versione definitiva proposta)

**Questa sezione è la tassonomia di riferimento.** Sostituisce la
classificazione di §20.3/§20.5/§20.9 dove diverge (quelle restano come
storia del ragionamento). Regola di scope invariata (§20.10): ogni
gimmick può essere core di una quest o gimmick di una singola scena.
Le skin/domain kit sono rinviate («c pensiamo poi», Director).

### 21.1 G-A «Tracciato» — arrivare alla fine del tracciato

Devi arrivare alla fine del tracciato. **Varianti** (limite/condizione
sulla stessa algebra):

| Variante | Definizione |
|---|---|
| **A tempo** | arrivare entro X turni |
| **A tempo reward** | prima arrivi, migliore il reward |
| **Tracciati multipli** | il primo che completa il tracciato vince (gara contro avversario) |
| **Inverso** | gli avversari NON devono completare il tracciato in X tempo (difesa) |
| **Scorta** | arrivare a fine tracciato prima che il compagno muoia / l'oggetto sia distrutto |
| **Avvelenato** | come scorta, ma il cursore sono gli HP di un membro del party |

**Mapping delle istanze esistenti:** `race` → tracciati multipli;
`flood` → tracciati multipli contro ambiente (+vena cash-out);
`meld` → a tempo (deadline velata); `difesa a ondate`/`inverso` →
inverso; `rituale` → tracciati multipli/auto-escalazione; `scorta` →
scorta; `cargo volatile` → scorta-oggetto; `corruzione` → avvelenato;
`preda`/`salmento`/`doppio fronte` → reskin (non contano).

### 21.2 G-D «Livello di allarme»

Un valore che puoi **aumentare o diminuire**: quando arriva a X il
livello di allarme sale di 1 e la quest diventa **più difficile /
pericolosa** (ecc.). La sorgente canonica: l'infiltrazione di R-127/128
(l'allarme che sale). Nota strutturale: a differenza del tracciato, il
cursore che raggiunge la soglia **non termina** la quest — la peggiora;
è un *dial* di pressione a gradini, non una corsa a eliminazione.

### 21.3 G-B «Investigazione»

**Doppio tracciato per pista d'indagine:** ogni punto del tracciato
rappresenta **un indizio** e può muoversi su **pro e contro**, con
**alta o bassa % di convinzione**. Riconciliazione con §19: il cursore
di ogni indizio porta la *direzione* (pro/contro la tesi) e la
*sicurezza* — il tracciato qui è lo strumento di rappresentazione della
convinzione, non una corsa verso un traguardo (nessun «chi arriva
prima vince»: si vince/perde sulla dichiarazione). Restano vigenti i
requisiti Director di §19: deduzione fallibile → sconfitta,
re-investigazione senza grinding, acquisizione passiva trasversale.

### 21.4 G-E «Tiro contrapposto»

Devi fare X tiri e ottenere **mediamente successo**. Puoi fare tutti i
tiri che vuoi, **ma ogni tiro ha un costo crescente**: sempre più danni,
difficoltà che aumenta, ecc. L'operatore caratteristico: accumulare
successi pagando il prezzo di ogni ritentativo — il dilemma è *quanto*
insistere, non *come*.

### 21.5 Candidate non ancora collocate

- **Cash-out / push-your-luck** (G-C candidata di §20.7): «continuo o
  casso?» sotto bust crescente. Overlap parziale col tiro contrapposto
  (economia del ritentativo): differenza = in PYL decidi **di smettere**,
  in tiro contrapposto decidi **quanto insistere per arrivare a X**.
  Da sciogliere: PYL core propria, sfumatura di tiro contrapposto, o
  operatore di scena.
- **Famiglia hazard / ricompensa ingannevole** (§18): nodi senza scelta
  nel momento (mimic & c.) — gimmick di scena per natura, mai core.
- Semi di scena §18.4 (`boon-faustiano`, `stanza-?`, `luce-vs-furtivita`,
  `male-minore`): sotto il livello gimmick.

### 21.6 Dubbi aperti (da sciogliere col Director)

1. **A tempo reward**: cambia la *funzione di reward*, non la condizione
   di sconfitta — è variante o modificatore ortogonale applicabile ad
   altre varianti (es. primo dei tracciati multipli → reward migliore)?
2. **Livello di allarme** è core autonoma o un *modulo di pressione*
   innestabile su altre core (una tracciato con dial d'allarme)? Oggi
   scritta come core per definizione Director; la domanda resta aperta.
3. **Tiro contrapposto vs cash-out**: l'economia «ritenta a costo
   crescente» assorbe parte di PYL — vedi §21.5.
4. **Doppio tracciato indagine**: conferma che ogni indizio = un
   cursore pro/contro con livello di convinzione (≥2 livelli, il «medio»
   di §19.2 resta compatibile come gradino intermedio)?

### 21.7 Ruling Director sui dubbi (2026-10-29)

- **A tempo reward → modificatore ortogonale, non variante.** «È
  ortogonale, hai ragione» — la scala reward-per-velocità si applica a
  qualsiasi variante di tracciato (e potenzialmente ad altre core).
  Riclassificato da «variante» a **asse di reward**, accanto alla
  visibilità del limite (§20.8): due modificatori trasversali, non
  sfumature.
- **Cash-out → meccanica innestabile, non core** (leaning, «è da
  pensare»). Il tiro contrapposto assorbe la forma «ritenta a costo
  crescente»; ciò che resta di PYL — la decisione *continuo/casso* —
  è candidata a **meccanica applicabile su più gimmick** (vena loot di
  flood ne è già un'istanza), non a core autonoma. Da confermare.
- **Innestabilità — proprietà generale.** «Queste gimmik potranno
  essere innestabili tra loro, anche investigare»: qualsiasi gimmick
  può essere innestata dentro un'altra — un segmento d'indagine dentro
  una quest-tracciato, un dial d'allarme dentro una quest-investigativa,
  una micro-cash-out dentro una scena. Estende §20.10 (scope core vs
  scena) in **composizione**: core principale + gimmick/moduli
  innestati + gimmick di scena.

<!-- ===== repo-snapshot/QUEST_GENERATION_CONTRACTS.md ===== -->

---
title: Quest Generation Contracts — modello minimo v0
type: contract-draft
status: PROPOSAL — deliverable pre-spec (R-113, deliverable 1-4).
  I contratti descrivono *dati*, non ancora codice. I gap motore in §10
  sono verificati sul repo e precedono qualsiasi implementazione.
source: QUEST_GENERATION_SPEC.md (specchietto), QUEST_GENERATION_ARCHITECTURE.md §13,
        ingestions 2026-10-10; schema reale verificato su
        questScenario.schema.ts + questRun.ts (2026-10-10)
related: R-091, R-108, R-111, R-112, R-113, R-114, R-116, R-127, R-149,
         OPEN-014, PLAN-019 (S5), QUEST_RULES.md, QUEST_IMPRINTS.md
---

# Quest Generation Contracts v0

Il livello "contratti" tra lo specchietto concettuale
(`QUEST_GENERATION_SPEC.md`) e la spec del generatore. Ogni contratto
definisce **dati** (config, validabili Zod) e **regole** (cosa il
generatore può/non può fare). Convenzione: `CAMPO` = obbligatorio,
`[campo]` = opzionale.

## 1. Pipeline del generatore (ordine vincolato)

```
input (POI, banda desiderata, party candidato, seed)
  → 1. pick CoreGimmick compatibile con banda e kit
  → 2. skeleton: sequenza di SceneArchetype (famiglie decisionali diverse)
  → 3. bind DomainKit + TraitDeck (party) + TwistDeck (eleggibili)
  → 4. emit QuestScenario (grafo authored, tutti i rami)
  → 5. NarrativeBrief per nodo → testo → validazione testo
  → 6. validazione strutturale + Monte Carlo + failure-mode check
  → 7. ScenarioInstance (hash) → offerta POI
```

La fase 5 può iterare: testo bocciato → rigenera solo quel nodo. La fase
6 può respingere l'intera emissione (→ nuovo seed, non patch a mano).

## 2. Contratto `CoreGimmick`

Il problema strategico della quest. Dato config, scelto a fase 1.

```ts
interface CoreGimmick {
  id: string;                       // 'gara-di-avanzamento'
  vars: CoreVar[];                  // variabili di stato del problema
  bounds: Record<string, [number, number]>;
  resolution: {                     // condizioni dichiarate, non testo
    win: string;                    // 'you >= goal && you > rival'
    lose: string;                   // 'rival >= goal'
    stall?: string;                 // 'beatCount > max && neither at goal'
  };
  hookTypes: HookType[];            // quali interazioni accetta (§3.4)
  climax: {                       // contratto del nodo finale
    readsVars: string[];            // quali variabili decide il climax
    forms: string[];               // forme alternative del climax per stato
  };
  dilemma: string;                  // il trade-off caratteristico, 1 riga
  minSceneHooks: number;            // quante scene devono hookarsi (target)
}
```

**Regola:** il gimmick dichiara solo *come si misura il problema*, mai
*come si racconta*. Il flavour è responsabilità del kit (§5).

**Rappresentazione delle variabili** — DECISO (Director 2026-10-10):
**layer numerico** nel run state (`vars: Record<string, number>`), NON
encoding a flag. Motivazione: le var core sono il cuore del gimmick —
leggibilità dello stato in preview («tu 3 / predoni 4»), effetti
incrementali semplici (`inc/dec/set`), nessuna esplosione di flag.
Costa un'estensione motore — si fa insieme a P0-a come unico delta
motore v2. L'encoding a flag resta documentato come alternativa scartata.

## 3. Contratto `SceneArchetype`

Una situazione decisionale riutilizzabile, indipendente dal rivestimento.
Il generatore emette nodi `QuestNode` reali a partire dall'archetipo.

```ts
interface SceneArchetype {
  id: string;                       // 'chi-si-espone', 'tracce-ambigue'
  family: DecisionFamily;           // enum, vedi sotto — anti-ripetizione
  requires?: string[];              // flag/variabili richieste per entrare
  emits: SceneEmit;                 // forma dei nodi emessi (vedi §3.3)
  hooks: SceneHook[];               // quali hook dichiara (§3.4)
  kitNeeds: KitNeed[];              // cosa il kit deve fornire (§5)
  traitSynergies?: string[];        // tratti con cui interagisce
  climaxEffect?: string;            // come altera le condizioni del climax
  weight?: number;                  // bias di selezione nello skeleton
}
```

### 3.1 `DecisionFamily` — le famiglie decisionali (catalogo)

`guadagno-vs-rinuncia` · `chi-si-espone` · `info-ambigua` ·
`approcci-incompatibili` · `ordine-operazioni` ·
`sfrutta-vulnerabilità-creandone-un'altra` · `risorse-vs-sicurezza` ·
`interferenza-sul-rivale` · `respiro-con-costo`

**Regola anti-template:** uno skeleton con 2+ scene della stessa family
è un warning di validazione (non un errore — le ripetizioni possono
essere intenzionali, ma devono esserlo *dichiaratamente*).

### 3.2 Qualità della scelta (check su ogni opzione emessa)

Ogni opzione deve superare 4 proprietà, valutabili sui dati:

| Proprietà | Check automatico |
|---|---|
| Trade-off | ≥2 opzioni con benefit/costi *tipi* diversi (non solo ±gold) |
| Conseguenza | l'opzione scrive flag/var/info/loot/danno — non zero effetti |
| Contesto | il valore dipende da party stat o var core (testato con 2+ party) |
| Attribuzione | esito riconducibile all'opzione (no RNG pura senza scelta) |

Scelte che falliscono 2+ proprietà → flag "cosmetica" in validazione.

### 3.3 `SceneEmit` — come un archetipo diventa nodi

L'archetipo dichiara la **forma** dei nodi, il generatore riempie i valori
dal kit e dallo stato:

- `nodeKinds`: sequenza di kind (`choice → check → choice`…)
- `optionShapes`: per ogni opzione — stat candidate, costi ammessi
  (`costGold`/`costDays`/`risk`/`flag`), target logici (`continue`,
  `detour`, `bail`) risolti dal generatore in id nodo
- `verdictTable`: mappa `Verdict → effects` — **deciso P0-a** (2026-10-10):
  gli effetti diventano dati nei nodi nuovi (goto/flags/info/loot/vars/log)
- `beats`: etichette beat da consumare

### 3.4 `SceneHook` — il contratto hook verificabile

```ts
interface SceneHook {
  reads: string[];            // var core lette
  writes: string[];           // var core modificate
  opensOption?: string;       // approccio che sblocca dopo
  closesOption?: string;      // approccio che preclude
  changesCost?: string;       // quale decisione futura costa di più/meno
  changesClimax?: string;     // quale forma del climax abilita
}
```

Una scena è "hook-bearing" (conta per il target interazione-core) se
dichiara ≥1 hook con ≥1 effetto verificabile. **La metrica 75% è
posticipata** (Director 2026-10-10: «ci pensiamo dopo, vediamo come
viene») — il contratto dichiara gli hook, il conteggio si osserva sul
prototipo prima di fissare la soglia.

## 4. Contratto `TwistDef`

```ts
interface TwistDef {
  id: string;
  family: TwistFamily;        // interferenza | deviazione | rivelazione | conseguenza-ritardata
  trigger: TwistTrigger;      // quando è eleggibile
  arm: 'runstart' | 'inrun';  // DECISO (Director 2026-10-10): misto —
                              // twist da tratto armati a createRun,
                              // twist da evento armati in-run
  clues: ClueSpec[];          // indizi disponibili prima (equità)
  effect: TwistEffect;        // cosa cambia (rami/flag/climax)
  reaction: string;           // cosa può fare il giocatore dopo
  negative: boolean;          // per il cap su twist negativi
  impactMetric: string;       // cosa MC deve misurare per verificarlo
}

interface TwistTrigger {
  requiresTrait?: string[];   // tratti presenti nel party (§6)
  requiresFlag?: string[];    // stato quest/mondo
  probability?: number;       // selezione tra eleggibili, non "se esiste"
  contexts?: string[];        // kit/fasi in cui è valido
}
```

**Ciclo di vita (deciso Director 2026-10-10 — modello misto):**
compile-time il generatore emette tutti i rami-twist dei `TwistDef`
eleggibili → `createRun` arma i twist `arm:'runstart'` (i twist da
tratto, seed-riproducibile) → in-run i flag guidano l'attraversamento E i
trigger `arm:'inrun'` possono armare/attivare twist da evento
(fallimento specifico, flag raggiunto). **Il grafo non muta mai**: anche
i twist in-run percorrono rami authored e verificati. Costo accettato:
la probabilità complessiva va calcolata su due estrazioni (runstart +
in-run) e va resa leggibile al giocatore tramite indizi, non tramite il
numero.

**Criterio di qualità:** dopo il twist il problema è sostanzialmente
diverso (non ±danno, non reskin). Verifica: MC confronta le politiche
ottimali pre/post twist — se la politica migliore non cambia, il twist
non sta lavorando.

## 5. Contratto `DomainKit`

Estende i draft di `QUEST_IMPRINTS.md` a schema verificabile:

```ts
interface DomainKit {
  id: string;                       // 'palude', 'passo-montano'
  entities: string[];               // creature/antagonisti ammessi
  roles: string[];                  // ruoli sociali (autorità, testimoni)
  places: string[];                 // luoghi istanziabili nelle scene
  props: string[];                  // oggetti manipolabili/loot credibili
  physics: string[];                // regole del mondo (maree, valanghe…)
  hazards: string[];                // pericoli ambientali ricorrenti
  traces: string[];                 // indizi ammissibili (per info-ambigua)
  coherence: string[];              // regole BLOCCANTI ('niente maree')
  adjacent: string[];               // tag fallback (grafo di adiacenza)
  threatProfile: {                  // per regola 7b QUEST_RULES
    victimTypes: string[];          // chi la minaccia colpisce davvero
    whereQuests: string[];          // dove la quest può accadere
  };
}
```

**Regole:** una scena che chiede un elemento (`kitNeeds`) non fornito dal
kit → fallback su `adjacent`, altrimenti la scena non è emettibile.
`coherence` si valuta *dopo* l'emissione (validation pass), non solo a
selezione — gli errori possono nascere nella combinazione.

## 6. Contratto `TraitDef`

```ts
interface TraitDef {
  id: string;                       // 'avido', 'scavezzacollo'
  verbs: TraitVerb[];               // quali effetti può avere (multipli!)
  visibleInPlanning: boolean;       // → decisione pre-quest «lo porto?»
}

interface TraitVerb {
  kind: 'enables' | 'precludes' | 'triggers';
  optionPattern?: string;   // per enables/precludes: pattern di scena/opzione
  twistRef?: string;        // per triggers: TwistDef.id candidati
  priority: number;         // risoluzione conflitti tra tratti
}
```

**Gap verificato:** `ResidentState` non ha tratti. DECISO (Director
2026-10-10): campo `traits: string[]` **su `ResidentState`** — il tratto
è identità persistente del personaggio («Milo È avido», non «era avido
quella volta»), propagato nel party snapshot del run. Visibilità in
planning = `visibleInPlanning` (badge tratto → la scelta «porto
l'Avido?» è strategica, alimenta il pilastro attaccamento).

## 7. Contratto `NarrativeBrief` → testo

Per ogni nodo emesso, il generatore produce un brief automatico:

```ts
interface NarrativeBrief {
  nodeId: string;
  facts: string[];              // cosa sta accadendo davvero (dal grafo)
  knownToPlayer: string[];      // fatti che il testo può rivelare
  hiddenFromPlayer: string[];   // fatti che NON deve rivelare
  mustConvey: string[];         // info meccanica leggibile nel testo
  mayInvent: string[];          // dettagli inventabili (dal kit)
  storyMode: string;            // horror | esplorazione | intrigo | …
  function: string;             // ruolo del nodo (dilemma, respiro, climax)
}
```

Pipeline: brief → LLM genera `{title, body, [verdictFlavor], [transit]}`
→ validatore (schema, riferimenti al kit, fatti vietati) → critica
(concretezza/chiarezza/atmosfera) → rigenera solo i difettosi.

**Traduzione (decisione Director 2026-10-10: «dovremo tradurre tutto»):**
il testo generato è contenuto di scenario, ma deve essere progettato
traducibile — niente stringhe con grammatica dipendente dall'ordine
italiano, chiavi strutturate per nodo (`scenario.<id>.nodes.<n>.title`),
testo mai interpolato a mano con variabili in mezzo alla frase. La
localizzazione effettiva resta post-generazione, ma il formato non deve
renderla impossibile. Le chiavi `PRESENTATION_KEYS` dello schema (title,
body, transit, verdictFlavor…) sono già escluse dall'hash contenuto —
edit/traduzioni non invalidano i run salvati (FACT, verificato).

**Meccanismo v0 — overlay facts-locked (R-168, implemented):**
per gli scenari compiled la localizzazione è un `ImprintLocaleOverlay`
(`generation/imprintLocale.ts` + `impr002<Kit>.it.ts`): copre SOLO i
campi presentazione — la spina (id, option id, flag, vars, verdictTable,
routing) è intraducibile. `applyImprintLocale` produce uno scenario IT
stesso-id; `localizedScenarioById(id, locale)` nel catalogo applica
l'overlay con fallback EN. `lockedFacts` per nodo = i fatti che devono
sopravvivere al render, verificati dal test di parità (coverage, no
orphan, spina byte-identica, run identico) — la stessa disciplina del
narrate Pass-5 resa controllabile offline. Peer render, non traduzione
letterale: la regola 7 del contratto di scrittura (Significato in una
frase piana) è ciò che rende il render affidabile. Il formato è
rigenerabile: un futuro Pass-5 su imprint può emettere la stessa shape.

## 8. Piano di validazione (test concreti, strumenti esistenti)

| Livello | Test | Strumento |
|---|---|---|
| Schema | `parseQuestScenario` su ogni emissione | Zod (esiste) |
| Grafo | nodi irraggiungibili, finali mancanti, flag senza produttore | superRefine (esiste) + `exploreScenario` |
| Coverage | ogni ramo-twist ha un witness; coverage dichiarata ⊆ dinamica | coverage test S2.1 |
| Hook | conteggio hook-bearing scene (report, soglia posticipata) | enumerazione grafo |
| Scelte | check 4 proprietà per opzione | analisi statica (da scrivere) |
| Failure-mode | pattern catalogo FINAL-RESOCONTO §6 | analisi statica + MC |
| MC | 4 politiche × ≥2 party; dominanze, influenza nodi, impatto twist | `simulateQuest` |
| Banda | `deriveOfferBand(referenceParty)` = banda desiderata | S2.3 (esiste) |
| Testo | validatore + critica campionata umana | pipeline §7 |
| Equità | trigger twist leggibili: indizi presenti nel grafo | analisi statica |
| Cruciali | scene marcate `crucial` ∈ [3,4] per run — assert del grafo, non conteggio manuale (R-108, cold read r2) | enumerazione grafo |

## 9. Prototipo minimo — catalogo v0

Obiettivo: **1 quest generata e validata** che passi tutta la tabella §8.

- **1 CoreGimmick:** `gara-di-avanzamento` (vars: you, rival, supplies)
- **5 SceneArchetype** (5 family diverse): barricata (approcci-incompatibili),
  cresta (chi-si-espone), guida a pagamento (guadagno-vs-rinuncia),
  tracce doppie (info-ambigua), bivacco (respiro-con-costo)
- **2 DomainKit:** `passo-montano`, `palude` (il secondo esiste negli
  imprint — testa il reskin stesso-grafo)
- **3 TraitDef:** `avido` (triggers → twist scena-extra), `scavezzacollo`
  (precludes → opzione sicura), `prudente` (enables → opzione bonus)
- **3 TwistDef:** scena-di-Milo (interferenza), deviazione-scavezzacollo,
  guida-informatore (conseguenza-ritardata)
- **4 politiche MC:** sempre-prudente, sempre-rapido, interferenza,
  adattiva-sullo-stato
- **Accettazione:** nessuna politica dominante ovunque; ≥1 ramo-twist con
  witness; banda misurata = dichiarata; 0 errori schema/coverage.

**Gimmick oltre il catalogo v0:** `flood` è stata implementata
(`generateFloodVault`, status offline nel lab); `meld` (**proposta
R-149**) è registrata come terza gimmick — bonus a scadenza *non
dichiarata* in stile XCOM: vars `rotta`/`soglia`/`scadenza`, indicatore
a stati nominati («disponibile / ultima chiamata / scaduto»), opzioni
rapide ad alto rischio wound/death. Descriptor completo in
`QUEST_GENERATION_ARCHITECTURE.md` §17 e in `labRegistry.ts`
(`QUEST_LAB_GIMMICKS.meld`, status `proposal`); generator ancora da
scrivere — entra nel `GimmickRegistry` solo oltre il cap v1 di PLAN-029.

## 10. Gap motore verificati — prerequisiti per il prototipo

| # | Gap | Dove | Stato |
|---|---|---|---|
| **P0-a** | **Routing post-verdetto hardcoded**: `applyNodeOutcome` è uno switch su `node.id` — *nessun* nodo generato può diramare su verdetto senza aggiungere un `case` al motore | `questRun.ts:1426` | **DECISO 2026-10-10**: `verdictTable` dichiarativa nei dati per i nodi nuovi; switch legacy intatto per i nodi goblin (estensione additiva, I-3 preservato sui contenuti esistenti) |
| **P0-b** | **Tratti assenti** su `ResidentState` | `TimeEngine.ts` | **DECISO 2026-10-10**: campo `traits: string[]` su `ResidentState` |
| **P1-a** | Variabili core numeriche: motore ha solo `flags[]`/`info[]`/`gold`/`loot`/`alarm`/`objectiveDone` | §2 | **DECISO 2026-10-10**: layer `vars` numerico nel run state — si implementa con P0-a come unico delta motore v2 |
| **P1-b** | Selezione twist a `createRun` + trigger in-run | `questRun.start` | **DECISO 2026-10-10**: arm misto (runstart per tratti, in-run per eventi) |
| **OK** | `ScenarioInstance` congelata, `PRESENTATION_KEYS` fuori hash, offer/slots/referenceParty, MC, coverage | S2.1–S2.4 | già pronti |

Il gap P0-a era la scoperta più importante di questa verifica — ora è la
scommessa centrale del delta motore v2: `verdictTable` + `vars` numerici
+ arm misto formano **un'unica estensione coerente** (la tabella ha
bisogno dei vars per gli effetti incrementali; i trigger in-run leggono
vars e flag). Progettarli insieme, non come tre patch separate.

## 11. Decisioni del Director (2026-10-10) e questioni ancora aperte

**Decise:**

1. **P0-a → verdictTable + legacy.** I dati dei nodi nuovi portano una
   tabella `Verdict → OutcomeSpec` (goto/flags/info/loot/vars/log-key);
   `applyNodeOutcome` la interpreta e mantiene lo switch per i nodi
   goblin. Estensione additiva: I-3 resta intatto sui contenuti
   esistenti, si apre solo per i nodi generati.
2. **Vars → layer numerico** `vars: Record<string, number>` nel run
   state. Effetti nella verdictTable: `set/inc/dec`. (Alternativa flag
   documentata e scartata.)
3. **Tratti → `traits: string[]` su `ResidentState`** — identità
   persistente, visibile in planning.
4. **Twist arm → misto:** `runstart` per twist da tratto, `inrun` per
   twist da evento. Probabilità complessiva su due estrazioni, resa al
   giocatore via indizi.

**Ancora aperte (non bloccanti per il prototipo):**

5. Formato esatto delle chiavi testo traducibili (default proposto:
   `scenario.<id>.nodes.<n>.{title,body,transit,verdict.<v>}` — da
   confermare alla prima emissione).
6. Cap su twist negativi per run e impatto minimo misurabile di un twist.
7. ~~Forma della `verdictTable`~~ → formalizzata in §12.
8. Se i nodi goblin migrano a verdictTable a regime (decisione rinviata —
   v0 li lascia sullo switch).
9. **Canali alternativi sui check core** (R-127 → risolta per delega
   R-134, 2026-10-11): modello **adottato** — lock di approccio a
   run-level, capability-gated dal party, eccezioni a consumo (~1/run).
   Sketch contract candidato (da dettagliare in PLAN-028):
   - `CheckChannel` (sul check node che scrive la var core):
     `{ id, label(i18n), stat, eligibility(capability/item gate),
        cost{type: free|consumable|cooldown}, oddsProfile,
        failureProfile{coreVarOp, memberExposure, sideEffect},
        availabilityCap?, failureTells[] }` — max 3 per check; almeno 2
     assi di differenziazione tra canali dello stesso check.
   - Run state: `approachLock` scelto all'avvio tra i canali/piani
     eleggibili dal party; `exceptionBudget` per gli sblocchi a consumo.
   - `channelOverrides` su `NarrativeBrief` per canale:
     `{ mustConvey[], mustNotImply[], channelVerb, failureTells[] }` +
     validator dedicato (scan mustNotImply, presence failureTells su fail,
     presence channelVerb sui channel-aware beats); tier testo T0–T3.5,
     default T1, fallimento un tier sopra il successo.
   - Preview: `riskTag` semantico + stakes per canale; locked greyed con
     `requiresLabel`; coverage party×canali pre-quest.
   - MC channel-health policies: always-X per canale, party-locked,
     adaptive-pick-best (degeneracy >70-80% → fail), adaptive-conserve;
     dead channel = mai scelto da adaptive su roster realistici.
   Il v0 runtime resta a canale nativo unico finché PLAN-028 non atterra —
   non blocca il prototipo esistente.

## 12. `OutcomeSpec` — la forma concreta della verdictTable (v0)

Stato run esistente che gli effetti possono toccare (verificato):
`gold`, `loot[]`, `info[]`, `flags[]`, `alarm` (boolean — gli stati
nominati `campoAllertato`/`campoSveglio` restano flag), `objectiveDone`.
Più il nuovo `vars` numerico (decisione §2).

```ts
/** Effetti post-verdetto di un nodo check/harm. Dati, non codice. */
interface OutcomeSpec {
  goto: GotoSpec;                 // dove si va dopo (obbligatorio)
  setFlags?: string[];            // state.flags.push
  clearFlags?: string[];
  setInfo?: string[];             // intel sbloccate (avvistamento)
  takeLoot?: string[];            // loot preso (TAKEN ≠ SECURED)
  dropLoot?: string[];            // loot perso (risveglio → dropObjective)
  goldDelta?: number;
  damage?: number;                // toll extra post-verdetto sul bersaglio
  setAlarm?: boolean;             // campoSveglio → alarm=true
  setObjective?: 'done' | 'lost';
  vars?: VarOp[];                 // {var, op:'set'|'inc'|'dec', value}
  rollFlag?: { flag: string; chance: number };  // estrazione → flag
                                              // = twist arm 'inrun'
  logKey?: string;                // chiave i18n della riga di log
}

/** Target dichiarativo: id nodo, o catena condizionale valutata in
 *  ordine — primo `when` vero vince; `else` finale obbligatorio. */
type GotoSpec =
  | string
  | { branches: { when: Cond; then: string }[]; else: string };

interface Cond {
  flag?: string;                  // flag presente
  notFlag?: string;               // flag assente
  varGE?: { var: string; value: number };   // var >= value (vars layer)
  varLT?: { var: string; value: number };   // var < value
}
```

**Regole del contratto:**

- `verdictTable: Partial<Record<Verdict, OutcomeSpec>>` + `fallback:
  OutcomeSpec` opzionale (verdetti non dichiarati → fallback; senza
  fallback e senza entry → errore di schema, il nodo non è emettibile).
- Nodo con `verdictTable` → il motore interpreta; nodo senza → switch
  legacy per `node.id` (goblin intatti, I-3 additivo).
- `rollFlag` è il meccanismo che copre **entrambi** gli arm: runstart =
  roll in `createRun`; inrun = `rollFlag` dentro una verdictTable o un
  option `sets` — lo stesso dato, due momenti.
- `verdictTable` è contenuto → entra nell'hash `scenarioVersion` (non è
  in `PRESENTATION_KEYS`): cambiare un esito = scenario diverso, i run
  salvati non migrano in silenzio.

**Esempio emesso** (scena «guida a pagamento» della Corsa al Passo —
nodo check `sc-passa-crepa`, vars `you`/`rival`):

```json
"sc-passa-crepa": {
  "id": "sc-passa-crepa", "kind": "check",
  "title": "…", "body": "…", "stats": ["str", "perc"],
  "risk": { "wound": 0.25, "death": 0.05 },
  "verdictTable": {
    "bigwin": { "vars": [{"var":"you","op":"inc","value":2}],
                "goto": "sc-valico", "logKey": "…" },
    "win":    { "vars": [{"var":"you","op":"inc","value":1}],
                "goto": "sc-valico" },
    "almost": { "vars": [{"var":"you","op":"inc","value":1},
                         {"var":"rival","op":"inc","value":1}],
                "goto": "sc-valico" },
    "fail":   { "vars": [{"var":"rival","op":"inc","value":2}],
                "goto": { "branches": [{"when":{"varGE":{"var":"rival","value":6}},
                                        "then":"sc-finale-perso"}],
                          "else": "sc-valico" } },
    "epicfail": { "vars": [{"var":"rival","op":"inc","value":2}],
                  "rollFlag": {"flag":"twist_scavezza","chance":0.5},
                  "goto": "sc-valico" }
  }
}
```

Il nodo dichiara tutto ciò che serve al motore: nessun `case` da
scrivere. Il twist `scavezza` si arma su epicfail con il 50% — un flag
che sblocca rami già emessi (`requiresFlag`/`hiddenIfFlag`, meccanica
esistente).

## 13. `NarrativeBrief` in azione — esempio lavorato sul nodo `sc-passa-crepa`

Il brief che il generatore costruirebbe automaticamente dai dati del nodo
+ del kit + dello stato corsa (dimostra §7 sullo stesso nodo di §12):

```ts
const brief: NarrativeBrief = {
  nodeId: 'sc-passa-crepa',
  facts: [
    'il party deve attraversare una crepa/parete esposta sul fianco del monte',
    'check str+perc: quanto terreno guadagna il party (var you)',
    'un fallimento fa guadagnare i predoni di 2 (var rival)',
    'soglia nascosta: rival >= 6 → quest persa (sc-finale-perso)',
    'epicfail 50% arma twist_scavezza (ramo già emesso)',
  ],
  knownToPlayer: [
    'la scelta forza+percezione è stata presa consapevolmente',
    'il costo del fallimento è noto (i predoni guadagnano)',
  ],
  hiddenFromPlayer: [
    'twist_scavezza armato (equità = indizi, non numeri)',
    'la soglia esatta di chiusura (rival>=6) — lo stato corsa è visibile, la soglia no',
  ],
  mustConvey: [
    'prova di corpo (str+perc), non di testa',
    'pressione temporale: i predoni avanzano',
  ],
  mayInvent: [
    'dettagli del terreno dal kit passo-montano (ghiaione, pietraia, esposizione, meteo del passo)',
    'presenza dei predoni percepibile ma non dettagliata',
  ],
  storyMode: 'avventura',   // o 'horror' — stesso nodo, due uscite
  function: 'dilemma/scena di rischio centrale',
};
```

**Stessa meccanica, due story mode** (testi illustrativi, non validati):

*avventura:*
> **La crepa nel fianco** — Il sentiero finisce contro una spaccatura
> nel fianco del monte: trenta metri di parete a gradoni, ghiaia che
> rotola, il canalone che sprofonda. Dalla valle, dietro di voi, il fumo
> dei predoni si è fatto più vicino.

*horror:*
> **Qualcosa sulla parete** — La parete è a portata di mano, ma la ghiaia
> sotto i piedi fa troppo rumore. Dall'alto, una pietra smossa cade — il
> tempo di un respiro. Non siete soli su questa parete. I predoni, dietro,
> non hanno più fretta: sanno dove dovete passare.

*verdictFlavor (estratto):*
- `bigwin`: «Parete scalata in pochi minuti — guadagnate terreno vero.»
- `fail`: «Un piede in fallo, ghiaia che frana: perdete il vantaggio e
  loro ne prendono due.»
- `epicfail`: «La cengia cede del tutto — qualcuno resta appeso. Nel
  panico, lo Scavezzacollo spinge comunque avanti.» *(il hint è il clue:
  il tratto si fa sentire prima che il twist scatti — equità, non spoiler)*

Il testo horror **non cambia la meccanica** — cambia cosa il testo
enfatizza (minaccia percepita, non conquista del terreno) e quali
dettagli `mayInvent` usa. È la dimostrazione dell'asse story mode.

## 14. Assorbito dal cold read r2 (rilievi tecnici, non lo status)

Dal `synthesis-v2.md` di R-115 — rilievi compatibili con questo livello
contratti, assorbiti qui mentre lo status del piano resta al Director:

- **Check strutturale `crucial ∈ [3,4]`**: la validazione conta le scene
  marcate cruciali e verifica il budget R-108 (era un conto manuale, ora
  è un assert del grafo — §8).
- **Repair a livello scenario**: se la validazione fallisce, si rigenera
  l'intera emissione dal seed, non si rattoppa il nodo (già §1, ora
  regola esplicita).
- **Registro `mayInvent`**: i fatti inventabili del brief sono un elenco
  verificabile — il validatore testo controlla che ogni dettaglio non
  canonico stia in quel registro (anti-allucinazione, §7).
- **Regola preview-vs-twist-nascosti**: le *scelte* mostrano numeri
  esatti (R-108); i *twist* restano nascosti ma indiziati — la preview
  non può rivelare un twist armato e il testo non può rivelare la soglia
  nascosta. Regola di presentazione esplicita in §7 `hiddenFromPlayer`.
- **v0 = catalogo pre-generato**, non generazione-on-offer: il prototipo
  produce un pool di scenari offline validati; l'offerta pesca dal
  catalogo (generazione runtime = fase successiva, §1 fase 7).
- **Prototipo = prova di fattibilità**, non generalità: 1 quest validata
  end-to-end basta per decidere se il modello regge (§9 già lo diceva;
  ora è il criterio esplicito di accettazione).

## 15. `HazardNode` e `hiddenCheck` — contratto v0 (R-151)

Categoria di nodo oltre le scene con scelta: **eventi a innesco
automatico** il cui esito dipende da un check nascosto. Il primo esemplare
è il **mimic** (Director 2026-10-11): nodo-tesoro con check di percezione
nascosto — fallito → HP + combat lungo; riuscito → combat breve a
sorpresa, nessun bottino (la cassa È il mostro).

```ts
interface HazardNode {
  id: string;
  /** Cosa il nodo finge di essere (testo d'offerta — può mentire). */
  bait: 'loot' | 'rest' | 'info' | 'exit';
  /** Il check che si auto-innesca all'arrivo. Nessuna scelta qui. */
  hiddenCheck: {
    stats: LabStat[];               // tipicamente ['perc']
    /** Bonus se il party ha copertura: scout/esploratore o trait
     *  compatibile — il vettore di equità (QUEST_RULES §2). */
    coverageBonus?: { requiresTrait?: string[]; scoutSlot?: boolean; pp: number };
  };
  /** Verdict → effetto. Stessa `verdictTable` di §12 — il hazard è un
   *  check che nessuno ha chiesto, non un meccanismo nuovo. */
  verdictTable: Partial<Record<Verdict, OutcomeSpec>>;
  /** Indizi leggibili *prima* nel testo/kit (equità retrospettiva).
   *  Il validatore richiede ≥1 clue quando `clues.required`. */
  clues: { required: boolean; kitNeeds: string[] };
  /** Gate di dominio: la creatura/fenomeno deve stare in
   *  `kit.creature_ammissibili`/`physics` — altrimenti non emettibile. */
  kitGate: string;
  revealOnResolve: true;            // costante — QUEST_RULES §3
}
```

**Regole del contratto:**

1. **Rivelazione obbligatoria.** `revealOnResolve` è fisso a `true`:
   quando il check fallisce e l'effetto scatta, esito e oggetto del check
   sono narrati («hai mancato di notare X») — nascosto prima, mai dopo
   (QUEST_RULES §3, regola vigente). Il `verdictFlavor` del fail deve
   nominare il check, non solo il danno.
2. **Nessuna scelta nel nodo.** Opzioni post-reveal ammesse *solo* nel
   ramo rivelato (es. esito «scoperto» → choice disimpegno-vs-sorpresa).
   La terza via candidata (scoperto → puoi andartene) è da valutare a
   design di scena — vedi ARCHITECTURE §18.2.
3. **Copertura = attribuzione.** `coverageBonus` esiste perché il check
   nascosto senza vettori di lettura è una tassa RNG: scout, tratti e
   indizi authored sono come il giocatore *poteva* saperlo.
4. **Frequenza.** L'armatura è `armRoll`/ramo authored o chance di
   tuning — mai un default globale sui nodi loot (anti «punzecchia
   tutto», ARCHITECTURE §18.2).
5. **Famiglia `ricompensa-ingannevole`:** `bait` copre le varianti
   (loot→mimic/maledetto/piedistallo/rivendicato; rest→falso riparo;
   info→falsa pista). Il loot finto non emette `takeLoot` — TAKEN≠SECURED
   non è violato perché il bottino non è mai esistito.
6. **Testo che mente, con licenza.** L'offerta del nodo (`bait`) può
   descrivere la ricompensa falsa: `NarrativeBrief.hiddenFromPlayer`
   porta il fatto «è una trappola»; `mustConvey` resta onesto sulla
   *meccanica* una volta rivelata.

### 15.1 Registro scoperte di esplorazione (non adottate)

Famiglie decisionali candidate dalla gap map R-151 e **registrate come
scoperte** — non nel catalogo §3.1, non bloccanti, riapribili se una
quest ne mostra il bisogno: `male-minore` (due opzioni entrambe costose:
scegli la valuta), `boon-faustiano` (buff con prezzo differito/nascosto),
`stanza-?` (contenuto ignoto a costo noto — incertezza prezzata),
`luce-vs-furtivita` (risorsa luce: vedi meglio, ti fai vedere),
`inganno-agente` (indizio falso piazzato da un agente — distinta da
`info-ambigua` ambientale; collega IMPR-002).

Altre esclusioni decise (ARCHITECTURE §18.4): **incontri neutrali** =
scena minore opzionale, non famiglia; **combat con props/boss a stadi** =
candidato interessante, design da pensare a parte; **curio layer DD** =
REJ-008.

<!-- ===== repo-snapshot/QUEST_GENERATION_SPEC.md ===== -->

---
title: "RpgBalancer — Quest Generation System (specchietto riassuntivo)"
type: summary-spec
status: PROPOSAL — consolidamento della conversazione di generazione;
  NON ratificato. **Living doc: da aggiornare a ogni decisione futura**
  (richiesta Director 2026-10-10).
source: consolidamento AI della conversazione R-111/R-112/R-113;
  dettagli e classificazione FACT/PROPOSAL/OPEN in
  context/QUEST_GENERATION_ARCHITECTURE.md + ingestions 2026-10-10
related: R-091, R-092, R-105, R-108, R-109, R-111, R-112, R-113, R-127,
         R-149, R-153, OPEN-014, OPEN-015, OPEN-019, PLAN-019 (S5),
         QUEST_RULES.md (vincoli canonici), .mw/desiderata.md,
         ingestions/2026-10-09-emotional-mechanics-quest/FINAL-RESOCONTO.md,
         QUEST_GENERATION_ARCHITECTURE.md, QUEST_IMPRINTS.md,
         QUEST_GAMEPLAY_SCIENCE.md, NARRATIVE.md,
         QUEST_OPPORTUNITY_LAYER.md
---

# RpgBalancer — Quest Generation System

Architettura concettuale, interfacce e piano di prototipazione
Stato: proposta progettuale da verificare rispetto al repository e ai
documenti canonici.

## 0. Vincoli canonici (già decisi — non rinegoziabili)

Una quest generata che viola questi vincoli è bocciata a prescindere dalla
sua qualità strutturale. Fonti: `.mw/desiderata.md`, `QUEST_RULES.md`,
`FINAL-RESOCONTO.md` §7, R-105/R-108/R-109.

- **Mortalità DD/XCOM** (R-105): morte e ferimento sono esiti reali e
  frequenti; il party può perdere pezzi.
- **3–4 decisioni cruciali per run** (R-108): non una scena su tre — il
  budget delle scelte che contano davvero. Le scene minori esistono ma non
  pretendono lo stesso peso.
- **Skill = gestione del rischio probabilistico** (R-108): niente quest
  che premiano la memorizzazione di pattern o risposte "giuste" non
  deducibili. Le sorprese possono essere forti ma devono essere **eque
  retrospettivamente**.
- **Numeri esatti in preview** (R-108): le probabilità e i costi delle
  opzioni sono visibili; l'incertezza vive nello stato nascosto, non nei
  numeri delle scelte.
- **Allarme = stati nominati** (quieto/sveglio…), non meter numerico
  (parcheggiato, QUEST_RULES §9).
- **TAKEN ≠ SECURED** (v24): il bottino raccolto è a rischio fino
  all'estrazione; la vittoria non è acquisita al completamento
  dell'obiettivo.
- **Coerenza della minaccia** (QUEST_RULES §7b, vigente): il tipo di
  minaccia vincola la vittima credibile e il luogo; la generazione deve
  soddisfarla, non solo il flavour.
- **Conseguenze universali** (R-092, QUEST_RULES §8): ogni quest ha
  conseguenze se risolta, in base a come, e se non risolta.
- **Obiettivo emotivo**: le quest esistono per produrre emozioni
  specifiche — attaccamento/sacrificio e avidità/rimpianto in testa, poi
  suspense, sorpresa equa, sollievo, pressione. La libreria consolidata:
  `FINAL-RESOCONTO.md` §5. Una quest valida meccanicamente ma emotivamente
  piatta non raggiunge l'obiettivo.

## 1. Obiettivo

Creare un sistema capace di generare quest strategicamente interessanti,
narrativamente coerenti, emotivamente efficaci e sufficientemente varie,
senza dover scrivere e revisionare manualmente ogni combinazione
possibile.

Il sistema deve:

- Generare quest con meccaniche, scene, decisioni, diramazioni e climax.
- Produrre titoli e flavour text coerenti con il mondo, la scena e
  l'esperienza narrativa desiderata.
- Utilizzare i tratti dei personaggi per generare eventi e deviazioni
  significative.
- Riutilizzare le strutture attraverso domain kit diversi, rispettando i
  vincoli di ciascun mondo.
- Verificare automaticamente la correttezza strutturale e le proprietà
  matematiche.
- Misurare la qualità narrativa con valutazioni automatiche calibrate e
  playtest umani.
- Supportare main quest persistenti, suddivise in opportunità giocabili
  che modificano lo stato del mondo.

## 1b. Infrastruttura già esistente (non si parte da zero)

Il motore quest attuale fornisce già gran parte della macchina di
validazione e runtime. La generazione deve produrre artefatti compatibili:

- `QuestScenarioSchema` (Zod) — grafi authored con nodi/edge/opzioni
  condizionate da flag.
- `exploreScenario` — esplorazione engine-driven, witness replay, coverage
  dichiarata ⊆ dinamica (S2.1).
- Monte Carlo simulation su scenari + `analyzeCheck` per-check pins.
- `deriveOfferBand` / `DANGER_BANDS` — banda di difficoltà misurata su
  `referenceParty` (S2.3).
- `ScenarioInstance` content-addressed, congelata nell'offerta e nel save —
  è il posto naturale per il twist deck risolto.
- Adapter residente→quest member (S2.2), ritirata con costo, esiti sfumati
  (critico/quasi/grave), stati d'allarme nominati, F6 push-your-luck.
- `PersistenceService` — invariante per run state e (futuro) arc state.

## 2. Architettura complessiva

Il sistema comprende quattro livelli collegati.

- **A. Generazione della quest** — definisce il problema strategico,
  seleziona gli archetipi delle scene, combina i relativi hook e costruisce
  un grafo narrativo con percorsi alternativi.
- **B. Realizzazione narrativa** — produce titolo, descrizione e flavour
  text a partire da fatti, obiettivi, conseguenze e vincoli già definiti.
- **C. Validazione e bilanciamento** — verifica struttura, coerenza,
  raggiungibilità, influenza delle decisioni e comportamento
  probabilistico.
- **D. Persistenza narrativa** — mantiene lo stato delle main quest, dei
  personaggi, delle fazioni e delle conseguenze che possono riemergere
  nelle quest successive.

Il risultato della generazione è un `QuestScenario` authored e validato.
Durante la partita si aggiornano lo stato della run e i flag, senza
inventare nuovi nodi arbitrari a runtime.

## 3. Concetti e responsabilità

### 3.1 Core gimmick

La meccanica centrale che definisce il problema strategico della quest.
Ogni core gimmick specifica:

- Variabili di stato e limiti.
- Condizioni di avanzamento, vittoria, sconfitta e stallo.
- Decisioni e costi caratteristici.
- Hook ammessi per le scene.
- Condizioni del climax e relativi esiti.
- *(vigente, QUEST_RULES §7 — binding adottato R-134)* Canali di check
  ammessi sui check che muovono la variabile core — nativo + alternativi
  su stat/skill diverse (es. allarme: Destrezza di base, oppure
  Intelligenza/invisibilità o Carisma/camuffamento). I check non-core
  restano sulle stat native. Binding: lock run-level, capability-gated,
  eccezioni a consumo; dettagli in CONTRACTS §11.9 e PLAN-028.
  *(deepening R-153, PROPOSAL)* un canale non è solo «stat diversa»: una
  capacità può cambiare la natura della prova (es. disattivare l'allarme
  anziché superarlo) — i profili di fallimento divergenti del binding
  coprono parte dell'idea; vedi anche `QUEST_OPPORTUNITY_LAYER.md` §5.

**Roster delle gimmick** (dettaglio in `QUEST_GENERATION_ARCHITECTURE.md`
e descriptor in `labRegistry.ts` `QUEST_LAB_GIMMICKS`): `race` (gara di
avanzamento) e `flood` (la volta che allaga) implementate offline;
`meld` (**proposta R-149**, 2026-10-12 — bonus a scadenza *non
dichiarata* in stile XCOM: vars `rotta`/`soglia`/`scadenza`, indicatore
a stati nominati con «ultima chiamata», opzioni rapide ad alto rischio
ferita/morte → ARCHITECTURE §17); `investigation` (**discussione
2026-10-25**, R-286 — deduzioni realmente fallibili, indizio →
direzione × sicurezza sui 5 verdetti, acquisizione passiva trasversale
alle gimmick → ARCHITECTURE §19, OPEN-023).

> **Correzione di modello (Director 2026-10-25):** il roster qui sopra
> confonde core gimmick e **sfumature sul tema** — es. `flood`, `meld` e
> la candidata `difesa a ondate` sono verosimilmente varianti di
> «avanzamento sul tracciato» (limite a tempo / cursore avversario /
> resistenza), non gimmick distinte. Modello a tre livelli e criterio di
> bordo in ARCHITECTURE §20; re-analisi del censimento = OPEN-024.

### 3.2 Scene gimmick e archetipi decisionali

Un archetipo descrive una situazione decisionale riutilizzabile,
indipendentemente dal suo rivestimento narrativo. Una scena concreta
specifica:

- Prerequisiti e condizioni di attivazione.
- Opzioni e relative conseguenze.
- Variabili lette e modificate.
- Esiti, costi e informazioni comunicate.
- Hook compatibili con il core gimmick.

Ogni scelta offerta dalla scena deve superare quattro proprietà
(trade-off, conseguenza concreta, dipendenza dal contesto/party,
attribuibilità del risultato alla decisione). Scelte cosmetiche, dominanti
o a esito puramente casuale sono difetti da rilevare in validazione.

Target iniziale: almeno il 75% delle scene deve influenzare variabili
centrali o condizioni strategicamente rilevanti. La metrica deve essere
definita in modo verificabile e non limitarsi alla presenza nominale di
una variabile. **Metrica posticipata** (Director 2026-10-10: «ci pensiamo
dopo, adesso vediamo come viene») — il contratto scena dichiara gli hook,
il conteggio si osserva sul prototipo prima di fissare soglia e
denominatore. Resta aperta la tensione col budget «3–4 decisioni
cruciali» — il generatore deve marcare quali scene sono cruciali e quali
minori, e la sequenza deve avere una curva (pressione → dilemma →
conseguenza → risoluzione).

**Seconda categoria di nodi (R-151, 2026-10-11):** oltre alle scene con
scelta esistono i **nodi hazard** — eventi a innesco automatico con
`hiddenCheck` (check nascosto al momento, rivelato all'effetto — regola
vigente QUEST_RULES §3: il perché non si nasconde mai dopo). Primo
esemplare: **mimic** (check percezione su finta cassa → combat
lungo/breve, nessun bottino in nessun ramo). Famiglia
`ricompensa-ingannevole` e contratto v0 in CONTRACTS §15; decisioni
collaterali in ARCHITECTURE §18.4.

### 3.3 Twist

Un twist introduce una variazione sostanziale nel percorso, nelle opzioni
disponibili, nell'obiettivo o nel climax. Un twist deve dichiarare:

- Trigger e condizioni di eleggibilità.
- Eventuale selezione probabilistica.
- Effetto sul grafo già authored.
- Modifiche alle variabili e ai flag.
- Indizi disponibili al giocatore, quando appropriato.
- Conseguenze e possibilità di reazione.

Il twist non deve limitarsi a incrementare il danno o cambiare il testo.
Il criterio di qualità: **dopo il twist il giocatore ha un problema
sostanzialmente diverso** da quello che pensava di risolvere.

Quattro famiglie note: interferenza della personalità (un tratto crea una
scena/problema nuovo), deviazione obbligata (un tratto chiude l'opzione
sicura), rivelazione dell'obiettivo (il significato del target cambia),
conseguenza ritardata (una scelta precedente presenta il conto al climax).

Ciclo di vita (modello concordato): **compile-time** il generatore emette
tutti i rami possibili e li verifica raggiungibili → **inizio run** si
seleziona quali twist sono armati tra gli eleggibili, con casualità
controllata e seed-riproducibile → **in-run** trigger, scelte e flag
guidano l'attraversamento. Il grafo non muta mai a runtime: si percorrono
rami già authored. Corrisponde al pattern `ScenarioInstance` di S2.3.

Vincoli di equità: trigger leggibili o indiziati, nessun accumulo
incontrollato di twist negativi nella stessa run, il giocatore deve poter
reagire dopo la deviazione. Aperto: impatto minimo misurabile per
qualificarsi come twist, e selezione una-tantum vs trigger successivi
indipendenti.

### 3.4 Tratti dei personaggi

I tratti come Avido e Scavezzacollo possono **abilitare** un'opzione,
**precluderla** o **innescare** un evento — tre casi distinti, per evitare
che ogni tratto degeneri nello stesso inconveniente. Devono essere
distinti dai `statTags`, che descrivono caratteristiche meccaniche delle
statistiche. **Verificato: `ResidentState` non ha un campo tratti**
(`statTags` sono etichette delle stat dominanti) — il contratto dei tratti
e la loro collocazione (`ResidentState` vs profilo separato) sono da
progettare. Se i tratti sono visibili nella scheda/planning, «porto
l'Avido?» diventa una decisione strategica pre-quest che alimenta il
pilastro attaccamento.

## 4. Modello dei tag e della narrativa

I tag non devono essere un'unica lista piatta. Rappresentano dimensioni
differenti.

### 4.1 Domain kit

Definiscono il mondo concreto e i vincoli di ammissibilità:

- Creature e minacce.
- Luoghi e oggetti.
- Ruoli sociali e relazioni.
- Fenomeni fisici plausibili.
- Regole di coerenza bloccanti.

**Verificato:** esistono 3 kit draft compilati negli imprint
(`palude`, `mare`, `miniera` in `QUEST_IMPRINTS.md`) con regole di
coerenza bloccanti già definite — nessuno è integrato nel motore quest.
I tag possono essere **compositi** (ambiente + minaccia + posta), non solo
nomi singoli. Il kit deve inoltre soddisfare la regola di coerenza della
minaccia (§0): chi è minacciato e dove la quest accade derivano dal tipo
di antagonista.

### 4.2 Story mode

Descrive la modalità narrativa desiderata, per esempio horror,
esplorazione o intrigo. Influenza la selezione dei dettagli, gli indizi,
la tensione e il tipo di esperienza evocata. Non sostituisce il domain kit
e non modifica automaticamente le regole meccaniche. Il genere generale
del mondo, come fantasy, può essere una proprietà di ambientazione
condivisa anziché un tag ripetuto su ogni quest.

### 4.3 Core gimmick

Definisce la causalità e il problema della quest. Deve essere separato
dai tag ambientali e narrativi.

### 4.4 Tag adiacenti e distanza

Un grafo di adiacenza permette di cercare un domain kit alternativo quando
quello selezionato non supporta una scena. La metrica di distanza tra kit
deve valutare sia la composizione del mondo sia la struttura sociale e
fisica. La diversità strutturale del gameplay deve essere misurata
separatamente dalla diversità del flavour.

## 5. Generazione del flavour text

La generazione narrativa non deve essere responsabile di inventare le
regole della scena.

**Input:**

- Fatti canonici della scena.
- Stato e funzione della scena nella quest.
- Domain kit e vincoli.
- Story mode.
- Core gimmick e conseguenze meccaniche.
- Profilo stilistico condiviso.
- Eventuali informazioni note, ignote o deliberatamente ambigue.

**Output:**

- Titolo.
- Descrizione.
- Eventuali testi brevi degli esiti.

**Brief automatico per scena** — oltre ai tag, il modello riceve un brief
derivato dai dati della scena: cosa sta accadendo realmente, quali fatti
sono noti e quali ignoti, cosa il giocatore deve percepire o domandarsi,
quali dettagli sono inventabili e quali no, quale informazione meccanica
deve risultare comprensibile dal testo. Generato automaticamente dalla
scena, non scritto a mano per ogni combinazione.

**Pipeline:**

1. Generare una proposta narrativa.
2. Validare schema, riferimenti e contraddizioni verificabili.
3. Valutare la qualità narrativa tramite criteri espliciti.
4. Rigenerare o correggere solo gli elementi difettosi.
5. Sottoporre i casi dubbi a revisione umana.
6. Salvare il risultato validato nel `QuestScenario`.

La valutazione LLM è uno strumento di selezione e critica, non una prova
definitiva di qualità. Non è necessario scrivere preventivamente tutte le
combinazioni di scene e tag: è necessario calibrare il processo su un
campione rappresentativo di risultati reali.

**Traduzione (decisione Director 2026-10-10: «dovremo tradurre tutto»):**
il testo generato deve essere progettato traducibile fin da ora — chiavi
strutturate per nodo, niente interpolazioni che dipendano dalla grammatica
italiana. Le `PRESENTATION_KEYS` dello schema sono già escluse dall'hash
contenuto: traduzioni e ritocchi di testo non invalidano i run salvati.

## 6. Generazione del grafo

La generazione avviene prima della giocata.

Il grafo può includere rami condizionali relativi a:

- Scelte.
- Esiti delle prove.
- Tratti dei personaggi.
- Twist eleggibili.
- Flag e conseguenze precedenti.

Tutti i percorsi previsti devono essere verificabili. Il grafo deve
evitare nodi irraggiungibili, finali mancanti e rami che promettono
effetti non implementati.

La casualità deve essere esplicita e riproducibile quando possibile
(seed deterministici, come già nel motore). Modello concordato (§3.3):
a compile-time si genera il **deck** dei rami-twist eleggibili; a inizio
run si **arma** la selezione; in-run i flag guidano l'attraversamento —
il grafo non muta mai.

## 7. Validazione e simulazione

La validazione automatica deve comprendere:

- Schema e riferimenti validi.
- Raggiungibilità e risoluzione dei rami.
- Compatibilità con il domain kit.
- Copertura degli hook.
- Individuazione di scelte prive di conseguenze.
- Influenza marginale dei nodi sull'esito.
- Frequenze di vittoria, sconfitta, morte, costi e ricompense.
- Confronto tra politiche di gioco (es. sempre-prudente / sempre-rapido /
  interferenza / adattiva sullo stato di corsa): nessuna politica deve
  dominare in ogni situazione e nessuna deve essere chiaramente inferiore.
- Impatto misurato dei twist (frequenza × variazione di successo, morte,
  costi, ricompense) e influenza marginale di ogni nodo.
- Stima della difficoltà effettiva rispetto alla banda dichiarata
  (`deriveOfferBand` sul `referenceParty`).
- **Failure-mode check** contro il catalogo noto (`FINAL-RESOCONTO` §6):
  scelta che cambia solo una %, meter senza effetto sulle opzioni, near-miss
  inerte, ritirata tutto-o-niente, sacrificio auto-assegnato (→ rabbia, non
  dolore), conseguenza non attribuibile (→ sorpresa ingiusta).

Le soglie quantitative iniziali sono parametri sperimentali da calibrare.
La simulazione misura le proprietà meccaniche; non dimostra che una quest
sia divertente o emotivamente efficace.

## 8. Main quest e chain quest

Una main quest è un arco persistente, non una lunga quest lineare spezzata
in segmenti.

**Generazione dell'arco** — definisce:

- Premessa e problema centrale.
- Attori, fazioni e obiettivi.
- Stati e transizioni.
- Svolte possibili e condizioni di conclusione.
- Conseguenze persistenti e reazioni del mondo.

**Generazione delle opportunità** — quando le condizioni sono soddisfatte,
l'arco rende disponibile una nuova opportunità giocabile. Questa diventa
una quest normale, generata e validata attraverso lo stesso sistema.

**Persistenza** — gli esiti aggiornano lo stato dell'arco e del mondo.
Le opportunità future possono quindi cambiare in funzione delle scelte
precedenti.

**Tempo e omissioni** — l'avanzamento del mondo, la disponibilità di una
quest e la sua scadenza sono concetti distinti. Ignorare una quest può
modificare il mondo o le opportunità successive, senza implicare sempre
una penalità diretta — estende la regola canonica R-092 (conseguenze
anche per mancata risoluzione, OPEN-015). *(proposta R-153)* terzo
concetto temporale: la **finestra di opportunità** — un intervallo in
cui un'azione è vantaggiosa/possibile senza essere una scadenza dura
(`QUEST_OPPORTUNITY_LAYER.md` §7). Nessun contratto di arco esiste
oggi: il più vicino è `village_event_system_spec.md` / R-093 (registro
narrativo).

**Interfaccia giocatore** — la UI dovrebbe distinguere:

- Archi narrativi attivi.
- Opportunità attualmente disponibili.
- Archi sospesi.
- Archi conclusi e conseguenze.

Le informazioni segrete devono rimanere nascoste quando la fiction lo
richiede.

## 9. Protocollo di valutazione

La qualità viene misurata su tre livelli.

- **Correttezza**: test automatici e controlli di coerenza.
- **Qualità narrativa**: valutazione di concretezza, chiarezza, atmosfera,
  coerenza e assenza di dettagli gratuiti.
- **Qualità ludica**: simulazioni, influenza delle decisioni e playtest.

I playtest devono verificare se:

- I twist sono sorprendenti ma equi.
- Le decisioni cruciali sono percepite come tali (e sono davvero 3–4).
- Le conseguenze sono comprensibili.
- Le scelte producono rimpianto, sollievo, rischio o soddisfazione.
- Le quest non sembrano varianti cosmetiche dello stesso template.

Protocollo controfattuale (già previsto per F6): *«cosa hai perso e per
quale scelta?»* — l'unico test che discrimina "tassa RNG" da "l'ho
rischiata io".

## 10. Piano incrementale

1. Verificare il sistema quest attuale e i contratti esistenti.
2. Definire il modello minimo di core gimmick, scena e grafo.
3. Generare e validare una singola quest con pochi archetipi.
4. Aggiungere la generazione del flavour text e calibrare i controlli.
5. Aggiungere twist e tratti dei personaggi.
6. Integrare i domain kit e testare le combinazioni.
7. Aggiungere simulazioni e criteri quantitativi.
8. Estendere il sistema a più meccaniche e archetipi.
9. Introdurre gli archi persistenti delle main quest.
10. Integrare UI, avanzamento temporale e conseguenze persistenti.

Ogni fase deve avere test di accettazione e un risultato funzionante
prima di passare alla successiva.

## 11. Decisioni ancora aperte

**Decise dal Director (2026-10-10) — dettagli in CONTRACTS §11:**

- ✅ Routing verdetti → `verdictTable` dichiarativa sui nodi nuovi,
  switch legacy per i goblin (estensione additiva a I-3).
- ✅ Variabili core → layer numerico `vars` nel run state.
- ✅ Tratti → `traits: string[]` su `ResidentState`.
- ✅ Twist arm → misto (runstart per tratti, in-run per eventi).
- ✅ Traduzione → tutto il testo generato progettato traducibile.
- ✅ Regola 75% → posticipata, si osserva sul prototipo.
- ✅ Hidden check (2026-10-11, R-151) → nodi hazard come seconda
  categoria; check nascosto prima, rivelato sempre dopo (QUEST_RULES §3,
  `vigente`); contratto `HazardNode`/`hiddenCheck` v0 in CONTRACTS §15;
  mimic = primo esemplare, famiglia `ricompensa-ingannevole`.
- ✅ Varietà strutturale (2026-10-11) → reskin ≠ vera varietà: gimmick
  con la stessa algebra di cursori delle esistenti non contano nella
  metrica. Curio layer DD → REJ-008. Incontri neutrali → scena minore,
  non famiglia.

**Ancora aperte:**

- Impatto minimo misurabile perché un evento si qualifichi come twist;
  numero massimo di twist negativi per run.
- Tassonomia canonica dei tag e grafo di adiacenza.
- Metrica di distanza tra domain kit e tra strutture di gameplay.
- Come nascono i tratti (authored/generati/ereditati) — dove vivono è
  deciso, come si creano no.
- Formato esatto delle chiavi testo traducibili.
- Regola 75% **posticipata** (Director 2026-10-10): si osserva sul
  prototipo prima di fissare soglia e denominatore; resta aperta la
  conciliazione col budget «3–4 decisioni cruciali».
- Criteri di qualità narrativa e calibrazione del valutatore.
- Soglie di accettazione delle simulazioni.
- Regole di avanzamento, sospensione e conclusione delle main quest;
  generazione incrementale vs pre-generata dei segmenti; quanto del
  futuro dell'arco è visibile al giocatore.
- Layer sopra le quest (R-153, PROPOSAL): grafo delle opportunità,
  famiglie, tassonomie requisiti/ricompense, esploratore orientabile,
  tempo a tre concetti, capacità del villaggio → documento dedicato
  `context/QUEST_OPPORTUNITY_LAYER.md`, tracking OPEN-019/020/021.
- Binding degli approcci alternativi ai check core-gimmick (R-127):
  ~~per-check vs per-run vs gated~~ → **risolta** (R-134, delega
  Director): lock run-level capability-gated + eccezioni a consumo;
  varianti sullo stesso nodo. Ricerca R-128 →
  `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md`; contract sketch in
  `QUEST_GENERATION_CONTRACTS.md` §11.9; prototipo PLAN-028.

---

**Principio guida:** generare molto, validare automaticamente ciò che è
verificabile, misurare il comportamento e usare il giudizio umano dove
serve una vera valutazione creativa.

<!-- ===== repo-snapshot/QUEST_GIMMICK_CHANNELS_RESEARCH.md ===== -->

---
title: "Research — Canali di check alternativi sulla core gimmick"
type: research-report
status: active
created: 2026-10-10
revised: 2026-10-11 (P-01 adottata per delega Director R-134 → vigente;
  prototipo PLAN-028; OPEN-017 risolta, OPEN-018 aperta)
author: Devin (su richiesta Director)
related: [R-127, R-128, R-134, OPEN-017, OPEN-018, PLAN-028, QUEST_GENERATION_ARCHITECTURE.md §16, QUEST_GENERATION_CONTRACTS.md, QUEST_GENERATION_SPEC.md, QUEST_RULES.md §7]
run_dir: .mw/runs/20261010-gimmick-channels-research/
---

# Canali di check alternativi sulla core gimmick — rapporto consolidato

Ricerca strutturata sulla proposta R-127/OPEN-017: una core gimmick (es. allarme
infiltrazione) può ammettere **canali di check alternativi** su stat/skill diversi
(DEX furtività / INT invisibilità / CHA travestimento) — solo sui check che muovono
la variabile core, non sui check di scena ordinari.

**Questo documento è ricerca, non decisione.** Ogni raccomandazione è classificata
PROPOSAL finché il Director non ratifica. Le divergenze con regole frozen sono
esplicitamente marcate, non risolte.

## Metodo e copertura

- 6 sotto-argomenti, ciascuno con prompt potenziato (persona + contesto progetto +
  domande mirate) broadcast su provider web via `mw-broadcast.py`.
- Run dir: `.mw/runs/20261010-gimmick-channels-research/` — prompt, risposte raw
  (`*/BROADCAST.md`) e report per-argomento (`report-t*.md`).
- **Fallimenti registrati**: chatgpt 6/6 ("response did not stabilize"), claude
  5/6 ("login or challenge page"), grok 5/6 stub vuoti, gemini 2/6 stub.
  Contributi sostanziali: deepseek 6/6, gemini 4/6, claude 1/6, grok 1/6.
  Nota: la risposta deepseek T6 è arrivata in cinese (contenuto integro).
- Complemento web proprio: Blades SRD, The Alexandrian (skill challenge 4e),
  DE:HR/Dishonored postmortem, forum Larian/Steam (BG3, WotR, Solasta),
  Failbetter dev diaries + Emily Short, letteratura choice-overload.

### Matrice argomenti

| # | Argomento | Hat | Corpus utile |
|---|---|---|---|
| T1 | Precedenti "stesso problema, più soluzioni" | system designer | claude + deepseek + ricerca propria |
| T2 | Modelli di binding (OPEN-017) | system designer | deepseek + gemini + grok |
| T3 | Bilanciamento e validazione MC | balance designer | deepseek + gemini |
| T4 | UI e preview | UX designer | deepseek + ricerca propria |
| T5 | Psicologia del giocatore | PX researcher | deepseek + gemini + ricerca propria |
| T6 | Narrativa e pipeline testo | narrative designer | deepseek + gemini |

---

## 1. Cosa ha trovato la ricerca (findings robusti cross-fonte)

Le seguenti conclusioni convergono da ≥2 fonti indipendenti o hanno evidenza
da giochi shipped:

### F1 — I canali devono differire su ≥2 assi, mai solo sull'etichetta di stat
Costo, rischio, conseguenza sul fallimento, fiction, disponibilità.
"Same check, different label" = reskin collapse → il giocatore tira sempre la
stat più alta. [T1 claude+deepseek, T3, T5] **[finding robusto]**

### F2 — Il fallimento è il differenziatore chiave
I profili di fallimento devono divergere per canale: DEX fail = allarme+1;
INT fail = allarme+1 + caster rivelato; CHA fail = allarme+1 + lockout sociale.
Se i fallimenti sono identici contano solo le odds. Vale anche per il testo:
la divergenza narrativa sul fallimento deve essere ≥ quella sul successo.
[T3, T6] **[finding robusto]**

### F3 — Il binding model vincitore per v0: lock run-level capability-gated
Consenso sui provider sostanziali (deepseek STRONG, grok STRONG, gemini
STRONG su gating / VIABLE→STRONG su lock):
- **Scelta dell'approccio all'avvio della quest** (piano furtivo / arcano /
  sociale) lega tutti i check core della run. Precedente: heist genre +
  ME2 Suicide Mission — "la soddisfazione viene da commitment e conseguenza,
  non da flessibilità".
- **Il gate è la capability del party**: si offrono solo approcci che il
  party può sostenere (mago con invisibilità → canale arcano disponibile).
- **Estensione ibrida**: item/risorse a consumo sbloccano eccezioni puntuali
  (uno scroll = un check fuori-piano), con "exception budget" stretto.
- **Per-check free choice = WEAK** in un sistema a preview esatti: diventa
  shopping di percentuali (4e skill challenge revival).
- **Party-attached (best-of-party) = WEAK**: party ottimo = uno specialista
  per stat → problema risolto e identità dissolta (lezione WotR skill-share).
[T2] **[finding robusto]** → risponde parzialmente a OPEN-017 come PROPOSAL.

### F4 — Roll per membro nominato, non best-of-party
Il canale dovrebbe determinare CHI agisce (e chi è esposto al wound/death
roll), non solo la stat. Il rischio per-membro legato al canale è il leverage
meno esplorato e più prezioso. WotR party-skill-share è l'anti-pattern:
dissolve l'identità ("il gioco reagisce come se tu avessi notato ciò che ha
notato un altro"). [T1, T2] **[finding robusto]**

### F5 — Il giocatore sceglie l'approccio nella fiction, non la stat
Presentare "Intrufolati / Lancia invisibilità / Travestiti" non "DEX/INT/CHA".
La stat è la risoluzione meccanica; la fiction è la decisione. [T1, T5]
**[finding robusto]**

### F6 — Dominanza situazionale via counter-design, non dominanza universale
Nessun canale strettamente migliore su tutti gli assi. Ogni canale ha un
"posto dove splende" (ward anti-magia, checkpoint con controllo identità,
cortile aperto). Availability caps per nodo > penalità di stat. Parità di EV
è una trappola: EV diverso compensato da varianza/disponibilità/ceiling.
[T3, T1] **[finding robusto]**

### F7 — Preview: mostrare canali bloccati greyed con requisito
BG3/F:NV precedent forte: `[Speech 45]` visibile anche se non raggiungibile →
"il giocatore vede la forma dell'opportunità". Framing corretto: "Requires:
Rogue" = possibilità futura (motiva replay); "You lack a wizard" = taunting.
Cap ~3 canali visibili per check; riga = canale + stat + odds + costo + risk
tag semantico. Nessun shipped game mostra una party-coverage matrix → UI
nuova ma coerente col planning dei management game. [T4, T5] **[finding robusto]**

### F8 — Scelta espressiva vs strumentale: il rischio dei numeri esatti
Se i numeri rendono un canale ovviamente migliore, la scelta diventa
ottimizzazione, non espressione di identità. Mitigazioni compatibili con la
nostra regola frozen: (a) differenziazione su assi non-EV (rischio, costo,
fiction) così nessun canale è "ovviamente" migliore; (b) menu multi-canale
solo sui pivot checks (~20-30% dei check core); (c) stakes narrative accanto
alle odds ("65% — il fallimento alza l'allarme") → stakes-mindset, non
calculator-mindset. [T5, T3] **[finding robusto con caveat]**

### F9 — Narrativa: Minimal Viable Acknowledgment + world-rules validator
- La soglia percettiva è bassissima: un channel-verb nel verdict basta per
  "il sistema ha visto la mia scelta". Tier T1 (~1.1× costo) = default.
- **Storylet-gating > node-splitting**: un check node con varianti di canale
  a livello di testo/opzione, zero crescita del grafo. Coerente con il nostro
  vincolo no-runtime-mutation.
- Il canale è un **asse di validazione parallelo al domain-kit**: mustConvey /
  mustNotImply / channelVerb / failureTells per canale nel brief.
- Regola addizionale: i canali di un nodo = quanti punti di vista narrativi
  il nodo supporta naturalmente (un check "scasso" non ha un canale CHA
  sensato). [T6] **[finding robusto]**

### F10 — Monte Carlo: policy matrix per channel health
Policy: Always-X per canale, Party-Locked, Adaptive-Pick-Best (degeneracy:
>70-80% usage = rotto), Adaptive-Conserve. Metriche: win rate, morti/run,
spesa risorse, usage%, marginal influence per nodo, lockout frequency.
1000+ run per policy. Dead channel = mai scelto da adaptive su roster
realistici. [T3] **[finding robusto]**

### F11 — Il vincolo di scope è VALIDATO
Canali solo sui check che muovono la variabile core: nessun precedente che lo
invalidi; evidenza indiretta a favore (check sul critical path più rewarding;
DE:HR multi-path-everything = lusso da big team). Raffinamento emerso: anche
tra i core-check, non tutti meritano 3 canali — pivot vs routine. [T1, T5]
**[validazione della proposta R-127]**

### F12 — Warning strutturale: il nostro allarme è un "Y-failures counter"
Le skill challenge 4e fallirono perché il contatore di fallimenti era
dissociativo — contava *quanto* fallivi, non *cosa* fallivi. Il nostro
allarme (fail → escalation) ha la stessa forma. I canali devono cambiare
*quali transizioni di stato* produce il fallimento, non solo alimentare lo
stesso contatore. [T1, propria] **[finding robusto — rischio progetto]**

---

## 2. Divergenze registrate (non risolte)

| # | Divergenza | Posizioni | Gestione |
|---|---|---|---|
| D1 | Lock vs capability-gated come "modello più forte" | deepseek/grok → lock; gemini → gating | Risolta concettualmente: sono ortogonali (gate decide l'offerta, lock l'impegno) → PROPOSAL lock+gating |
| D2 | Per-check free choice | deepseek VIABLE-condizionale vs gemini WEAK | Incliniamo a WEAK per preview esatti; resta opzione per futuri pivot check |
| D3 | **Numeri esatti vs scelta espressiva** | research: EV-shopping sopprime roleplay vs nostra regola **frozen** R-108 | **DIVERGENZA-NOTA**: non proponiamo di cambiare la regola; mitigazione via F8. Da sottoporre al Director |
| D4 | Hybrid utility | gemini STRONG vs grok WEAK | Dipende da tolleranza grafo a eccezioni; testare dopo v0 |
| D5 | Canali bloccati mostrati/nascosti | BG3-model (mostra) vs immersive-sim (nascondi) | Mostriamo: node-graph non ha spazio esplorabile |

---

## 3. Cosa ci serve / cosa possiamo usare (contestualizzato al progetto)

### PROPOSAL P-01 — Modello di binding (risposta a OPEN-017)
**Run-level approach lock, capability-gated, con eccezioni a consumo.**
- All'avvio quest si sceglie l'approccio tra quelli che il party può
  sostenere. Il lock lega i check che muovono la var core.
- Item/skill a consumo aprono eccezioni puntuali (budget stretto, ~1 per run).
- Roll per membro nominato; il canale determina l'esposizione al risk roll.
- *Classificazione: PROPOSAL — attesa ratifica Director.*

### PROPOSAL P-02 — Definizione canale
Un canale = approccio fiction named + stat + profilo:
```
channel: { id, label(i18n), stat, eligibility (capability/item gate),
           cost {type: free|consumable|cooldown, ...},
           oddsProfile, failureProfile {coreVarOp, memberExposure, sideEffect},
           availabilityCap?, failureTells[] }
```
- Eleggibilità dichiarata a compile-time; nessuna mutazione runtime del grafo.
- *Classificazione: PROPOSAL — candidato per QUEST_GENERATION_CONTRACTS.*

### PROPOSAL P-03 — Tabella di transizione per canale
Per ogni check core: per ogni canale, cosa fa successo/fail/almost sulla var
core e sui side-effect. Una tabella per nodo core = mossa a più alto leverage.
Risponde a F12 (allarme non-dissociativo). *PROPOSAL.*

### PROPOSAL P-04 — Party coverage panel + greyed channels
Pre-quest: matrice membri×canali (chi può aprire cosa). Al check: canali
bloccati greyed con "Requires: …". Risk tag semantico accanto alle odds.
*PROPOSAL — implica UI nuova, valutare costo.*

### PROPOSAL P-05 — Brief narrativo channel-aware
Estendere NarrativeBrief con `channelOverrides` (mustConvey / mustNotImply /
channelVerb / failureTells) + validator dedicato. Tier testo T0-T3.5,
default T1, fallimento sempre un tier sopra il successo. *PROPOSAL —
contract-ready come estensione opzionale.*

### PROPOSAL P-06 — Policy MC channel-health
Estendere la sezione Monte Carlo dei contracts con le policy F10 e soglie
(degenerate >70-80%, dead = mai scelta, win-gap >45pt). *PROPOSAL.*

### PROPOSAL P-07 — Pivot vs routine
Tra i check core, il menu multi-canale va sui pivot check (~20-30%), i
routine check restano a canale singolo (quello del lock). Anti decision-fatigue.
*PROPOSAL.*

## 4. Cosa rifiutiamo (REJECTED, con motivazione)

- **REJ-1: best-of-party aggregation** — dissolve identità party (WotR lesson).
- **REJ-2: canali su OGNI check della quest** — distrugge grammatica stat;
  scope constraint già corretto.
- **REJ-3: opzioni identiche ri-skin** — reskin collapse garantito.
- **REJ-4: >3 canali per check** — option bloat; anche i pivot check restano ≤3.
- **REJ-5: nascondere canali bloccati** — perdita equity + flip attribuzione
  a "il gioco ha nascosto un'opzione" (post-hoc FOMO).
- **REJ-6: node-splitting per canale** — rejoin cost esponenziale; varianti a
  livello testo/opzione bastano.
- **REJ-7: parità di EV come target di tuning** — rende la scelta indifferente;
  differenziare EV + compensare su altri assi.
- **REJ-8: canale che bypassa la gimmick** — il canale manipola la var core,
  non la elude (altrimenti il giocatore non ingaggia il problema strategico).

## 5. Cosa resta aperto (aggiornamento OPEN-017)

- **OPEN**: regret vs ownership del lock va verificato in playtest — il
  v0 test è disegnato apposta (spec: 3 approcci × 4 check core, 1 item-
  eccezione in secondo passo). Metrica: "sai spiegare perché hai perso X?".
- **OPEN**: D3 — tensione numeri-esatti vs espressività. La regola è frozen;
  serve decisione Director se monitorare in playtest.
- **OPEN**: quanto del "capability gate" mappa su skill v12 vs item vs classe
  — dipende dalla skill-taxonomy non ancora finalizzata.
- **OPEN**: esposizione risk per canale = modello di wound/death per membro
  da dettagliare quando si implementa.
- **OPEN**: il "Karma Police coverage" (ogni stat ha almeno un canale nel
  quest set) va verificato sul quest set reale una volta autorato.

## 6. Impatto su architettura/schema (futuro, non autorizzato)

Se ratificato, servirebbero: (a) campo `channels[]` sui check node core (o su
CoreGimmick con riferimento per check); (b) approach tag a run-level sul
quest-run state; (c) transition table per canale nel nodo; (d) extension
NarrativeBrief + validator; (e) policy MC aggiuntive; (f) UI: channel selector
inline + coverage panel + greyed-requirement. **Nessuno di questi è
implementato né autorizzato da questo documento.**

Compatibilità: la proposta è coerente con authored-graph-no-runtime-mutation
(le varianti vivono nel nodo a compile-time), preview esatti (richiede solo
un campo risk tag in più), `vars: Record<string,number>` (transizioni
diverse sulla stessa var), e con traits/equip futuri (gate = stessa
macchina di eligibility).

## 7. Fonti principali

Provider outputs: `.mw/runs/20261010-gimmick-channels-research/t*/BROADCAST.md`.
Report per-argomento: stessa dir, `report-t1..t6.md`.
Fonti citate nei report: Blades in the Dark SRD (action rating, position/effect,
planning/engagement); The Alexandrian + Brandes Stoddard (skill challenge 4e
autopsia); DE:HR PlayStation.blog + Dishonored postmortem (multi-path
multi-solution); Warren Spector "problems not puzzles"; Disco Elysium (skill
voices); Fallout:NV (skill gates, Sawyer "Karma Police" coverage); BG3 +
F:NV (tagged/greyed options); WotR + Solasta (party-skill-share anti-pattern);
Shadow Tactics/Desperados (capability kit); ME2 Suicide Mission + Den of
Wolves + Invisible Inc. (approach lock); Failbetter QBN + Emily Short
(storylet gating, narrative physics); Iyengar/Schwartz + Wiener + regret
theory (psicologia); Reeves & Nass (salience threshold).

<!-- ===== repo-snapshot/QUEST_GOBLIN_REWORK_PROPOSAL.md ===== -->

---
title: Quest Goblin — brief emotivo, playtest critico e proposta di rework (narrativa, suspense, emozione)
type: design-proposal
status: proposta — nulla qui è applicato al lab; ogni modifica richiede approvazione del Director
created: 2026-10-08
related: src/docs/docs/idle_village/quest_sterminio_goblin_spec.md (documento unico della quest);
  RICHIESTE.md R-103; scripts/quest-goblin-playthrough.ts (player testuale + metriche baseline)
---

# «Sterminio dei goblin» — rework narrativo, suspense, emozione

Brief ricevuto: migliorare la quest **dentro** la struttura attuale (F0–F7, slot-targeting,
F5 v2, bande a 5 esiti), puntando a *più informazione narrativa ed emotiva per parola*, non
a più testo. Questo documento ha quattro parti: **A** cosa vogliamo che la quest faccia
(con ricerca), **B** la quest giocata davvero, **C** critica spietata (della quest *e* del
brief), **D** la proposta.

Convenzione: «[osservato]» = visto nelle run giocate col motore reale; «[ipotesi]» =
mia inferenza non verificata.

---

# A. Cosa vogliamo che la quest faccia

## A1. Obiettivo di esperienza

Una run da ~10 decisioni che lasci **una storia raccontabile**, non un esito. Il test finale
(del brief, e lo faccio mio): dopo dieci run il giocatore ricorda *«abbiamo quasi perso il
terzo, ma li abbiamo spezzati; li ho inseguiti con la guardia a pezzi; e sulla strada di
casa erano loro»* — non *«ho passato F4, F5, F7»*.

Quattro proprietà misurabili, in ordine di priorità:

1. **Leggibilità del rischio** — il giocatore capisce *chi* sta pagando e *quanto è vicino* al
   punto di rottura, prima di scegliere.
2. **Contrasto** — picchi e valli alternati; mai «un po' più pericoloso a ogni fase».
3. **Specificità** — ogni esito meccanico produce una *scena* che si può visualizzare e
   attribuire a una persona.
4. **Memoria** — i primi eventi tornano (un goblin, una sentinella, un nome) e la fine
   chiude ciò che l'inizio ha aperto.

## A2. Ricerca: cosa dice il campo (fonti consultate 2026-10-08)

| Principio | Fonte | Implicazione per la goblin |
|---|---|---|
| **Il contrasto fa il picco.** Una curva perfettamente ascendente è «indesiderabile perché manca di contrasto»; il picco esiste solo contro una valle. Il passaggio alto→basso può essere veloce (risolvi lo scontro), basso→alto richiede una rampa. | *Harnessed Pacing & Intensity* (Game Developer); *Swell and Lull* (Campaign Mastery) | Serve almeno **una valle vera** tra F4 e F7; oggi non c'è (vedi B). |
| **Intensità = funzione del giocatore, non del nodo.** Il Director di *Left 4 Dead* misura l'intensità vissuta (danno subito, nemici vicini) e inserisce *periodi di rilassamento* dopo i picchi. | *Using Intensity to Drive Player Engagement* (Game Developer) | La quest ha già lo stato (HP per slot): **il testo deve leggerlo**, non solo il motore. Un «relax» è un beat di una riga, non una meccanica. |
| **Mai ripetere un setup; gli esiti vanno variati per archetipo.** Setup a intensità variabile, con rumore, non monotona. | *When I'm designing a level…* (On Game Design) | 4–5 turni di F4 con la stessa frase = setup ripetuto. |
| **Near-miss: motiva a continuare ed è fisiologicamente eccitante, ma è percepito come frustrazione/quasi-vittoria — conta la *fenomenologia* dell'evento, non gli effetti sonori.** I *losses disguised as wins* fanno sovrastimare quanto si sta vincendo. | Near-miss systematic review (PMC 5663799); Clark et al. | `almost` è la banda più preziosa: va scritta come **«quasi»**, non come mezza vittoria. E attenzione: le righe «vinci ma paghi» sono LDW — vanno dette onestamente. |
| **Loss-chasing / win-chasing**: dopo una vittoria si tende a rilanciare; dopo una perdita si accelera. | Winning and losing in online gambling (PLOS ONE) | F6 (push-your-luck) è esattamente il punto dove la vittoria di F5 invita a rilanciare: è lì che la tentazione va *vista*. |
| **Morale leggibile e contagioso**: gli stati sono descritti (saldo → vacillante → in fuga), reagiscono ad eventi intuitivi (compagno che cade, nemico ucciso), e il *giocatore deve poter leggere lo stato in tempo*. La rotta è tattica, non un contatore di HP. | Battle Brothers dev blogs #4, #20 | Il morale dei goblin può essere un **readout narrativo** di variabili già esistenti (goblin rimasti, turno, ultimo esito) prima di essere una meccanica. |
| **Greed vs caution + ritirata con penale = il motore delle storie.** In *Darkest Dungeon* il «torno indietro?» è il cuore; la ritirata costa (ricompensa persa/stress) e la discussione della community è su *quando* diventa disponibile. | Darkest Dungeon (Game Informer; Steam) | La scelta «mollare il trofeo» di F7 è già un abandon con penale: va resa *sentire*, non solo disponibile. |
| **Peak-end rule**: il ricordo di un'esperienza è dominato dal picco e dalla fine; anche in giochi casual l'effetto sul *ricordo di difficoltà* è robusto, sul divertimento è più sfumato; in esperienze complesse l'intensità media pesa più del solo picco. | Peak-End Effects on Player Experience (CHI 2016); Frontiers 2019 | **La fine vale di più di ogni altro beat per parola.** Oggi è la riga più debole della quest. Ma attenzione: non basta il picco — serve intensità media non piatta. |

Cautela onesta sulla ricerca: la letteratura peak-end sui giochi è mista (forte sul ricordo
della *sfida*, variabile su fun/preferenza). Non la prendo come legge, la prendo come
motivo per **non sprecare l'ultima riga**.

## A3. Timing e pacing

Dato reale [osservato]: `transitMs = 2600` (config) per tutti i transit; i transit shippati
hanno **14–38 parole**. A ~3,3–4 parole/secondo di lettura in italiano, 14–38 parole
richiedono **~4–11 s**. Il hold è cioè **sotto il tempo di lettura per ogni singolo transit**.

Regole proposte (config-first, `questLabPacing.ts`):

| Elemento | Regola |
|---|---|
| Transit | hold = `clamp(parole / 3.5, 2.0 s, 7.0 s)`; tetto **≤ 24 parole**; sempre skippabile (già c'è skip nel cockpit) |
| Verdict flavor | **≤ 16 parole**, una immagine, nessuna cifra |
| Beat di relax | 1 riga, hold fisso 1.8 s, *nessuna scelta* |
| Beat di shock (agguato) | **zero preavviso**: la prima riga è corta (≤ 8 parole) e arriva *senza fade lungo* (l'interruzione del relax è il punto) |
| Fine run | hold libero, chiusura solo con click: è la riga più letta |

## A4. Psicologia: cosa deve provare il giocatore, e quale meccanismo lo produce

| Emozione | Meccanismo (esistente, non nuovo) |
|---|---|
| «Questo può andare male» | HP per slot + esposizione posizionale **già visibile** nell'HUD; il testo nomina chi è *in coda* |
| «Ancora un tiro e qualcuno cade» | F4 T3+ (2 colpi) + escalation; serve che il testo **abbassi la voce** quando qualcuno è <35% |
| «Ce l'abbiamo fatta» (sollievo) | uscita da F4/F5: oggi inesistente, va **scritto** |
| «Voglio ancora un po'» (avidità) | F6: richiede un **oggetto visibile e incompleto** |
| «No. Non ora.» (shock) | F7: richiede che il sollievo *venga prima* |
| «Mi ricorderò di questa run» | callback (F0→fine; F5→F7), e un **registro finale di chi è tornato** |

---

# B. La quest giocata davvero

Metodo: `scripts/quest-goblin-playthrough.ts` guida il **motore reale** (`createRun`,
`applyChoice`, preset `gob-band`) con una policy deterministica e stampa ciò che il
giocatore leggerebbe (transit, body, scelta, check con verdetto + flavor + danni + esito,
HP). 4 run commentate (seed 7 *optimal*, 41 *greedy*, 1983 *optimal*, 2024 *cautious*) +
4.000 run *optimal* per le metriche. **Nota di metodo:** lo script stampa il `transit` di
ogni nodo a ogni iterazione, quindi la ripetizione «Il momento è scelto» ×5 nel log è un
artefatto dello script (nella UI il transit di combat è solo a T1, `questRun.ts` ~`turn === 1`).

## B1. Cosa ho letto, in ordine (seed 41 — la più ricca)

> Banda 100/60/60/60. Assegnazione (il mugnaio). Transit nel bosco. **Forzo il sentiero**:
> *«Una traccia che gli altri avrebbero perso: qualcosa è nascosto qui.»* → il testo mi dice
> che c'è loot. **Bottino**: FAIL → *«Il filo di latta canta»* + *«Kran è ferito. Kran incassa
> il colpo (−10 HP)»* + *«Bottino di guerra +12 gold»*. **Assalto**: WIN *«Il muro cede
> esattamente dove lo colpite.»* **F4 · cinque turni:** *«Il party colpisce. Un goblin in meno.»*
> ×4, *«I goblin schivano…»* ×1, e 10 volte *«{nome} incassa il colpo (−12 HP)»* — Kran scende
> 47→35→23, cura, →31→19→7. **F5 Incalzare**: FAIL *«Le rocce vi tradiscono»* + *«Kran è ferito. Kran non si
> rialza»*. Kran è morto: **la scena più forte della run è una riga di log**. **F6**: ×3
> *«Razzia tra le tende»*, Bruna a 16/60. **F7**: scelgo *Affrontare* con Bruna a 11/60 → WIN
> *«Il party colpisce. Un goblin in meno.»* — a testo; in realtà 3 goblin abbattuti **e Bruna
> morta**. Fine: nessuna riga di chiusura.

## B2. Difetti verificati nel testo/meccanica

| # | Osservazione | Dove | Gravità |
|---|---|---|---|
| D1 | **Il flavor di F5 `win` contraddice l'esito.** Flavor: *«I pochi che scappano non basteranno per un agguato vero»*; esito (e spec): *«Non ne resta nessuno»* = sterminio, ritorno pulito. **L'ho scritto io in R-099** leggendo male la spec. | `gob-incalza-check` win | **bug narrativo** |
| D2 | F6 `bigwin`: *«il campo paga due volte»* ma l'esito dice **+8 gold**, identico a `win`. Il testo promette ciò che il motore non dà. | `gob-cerca` bigwin | bug narrativo |
| D3 | Ultimo scontro `win` con 3 goblin uccisi **e un PG morto** → riga *«Il party colpisce. Un goblin in meno.»* Il picco della run ha la riga più piatta. | `GOBLIN_ATTACK_LINES` | **alta** |
| D4 | F5 `win` con **morte del bodyguard** (seed 7: *«Kran è morto»* su un WIN): vittoria narrata, morte solo nel log. Il testo non si accorge. | harm presentation | **alta** (è il miglior potenziale di storia) |
| D5 | Stealth `win` con *«Kran è ferito»* (seed 1983, 57/60 HP): ferita su un passaggio «perfetto». Causa non verificata [ipotesi: ferita da roll di rischio nodo]. | `gob-stealth` | media — verificare |
| D6 | F2 `fail` lascia comunque **+12 gold** e il PG ferito: la spec lo vuole (*«il tentativo è sempre conveniente»*) — non è un bug, ma il testo *«Bottino di guerra»* sopra un fallimento stride. | `gob-bottino` | bassa |
| D7 | F1-B: *«qualcosa è nascosto qui»* **annuncia** il loot invece di lasciarlo scoprire. E il masso non ha alcun indizio visibile *prima* della scelta. | `gob-tracce-perfor` | media (brief) |
| D8 | F6 `fail`: il flavor dice *«La trappola»*, l'esito dice *«Solo cenere e spine»* — **due frasi in disaccordo** sotto la stessa carta. Stesso problema su più bande. | `gob-cerca` | media |
| D9 | F4 si chiude **sempre dopo 5 turni** con 1–2 goblin: il transit *«spezzano il fronte e corrono»* è la fine del contatore turni, non una rotta. | F4→F5 | strutturale |
| D10 | `goblin 2` resta mostrato dopo uno sterminio in F5 (`goblinLeft` non azzerato). | stato | minore |
| D11 | **Nessuna chiusura.** Il bilancio finale è: nessuna riga (cautious) o *«Il party colpisce…»* (greedy). | `gob-fine` | **alta** (peak-end) |
| D12 | Transit 14–38 parole con hold 2,6 s: **non leggibili** (vedi A3). | pacing | media |

## B3. Metriche baseline (4.000 run, policy *optimal*, preset `gob-band`)

| Metrica | Valore | Lettura |
|---|---|---|
| F4: finisce con ≥1 PG grave (<35% HP) | **53,8%** | la «disperazione» esiste già meccanicamente: **manca solo il testo** |
| F4: finisce con 1–2 goblin e ≥1 PG grave («quasi spezzati») | **22,8%** | lo stato-obiettivo del brief si verifica ~1 run su 4–5 |
| F5 raggiunto | 95,5% | F4 quasi mai stermina da solo |
| **F7 (scelta trofeo/sangue) raggiunto** | **21,6%** | **il «No, non ora» è assente nel ~78% delle run ottimali** (F5 riuscita ⇒ ritorno pulito) |
| F6 con HP minimo 30–75% (tentante ma pericoloso) | 45,0% | buona base per la tentazione |
| Morti medie/run · wipe | 0,40 · 0,0% | il rischio è basso: la tensione è soprattutto *percepita* |

Due metriche sono **saturate/mal definite** e non le uso come prova: «F5 dilemma credibile»
(100%) e «F7 oh-no» (96,5% *condizionata* a F7). Le ridefinisco in D7.

---

# C. Critica spietata

## C1. Alla quest com'è

1. **La curva è una rampa**, esattamente come diagnostica il brief: *curiosità → tensione
   lieve → azione → conseguenza*. La causa vera non è la scrittura: è che **il testo ignora
   lo stato**. Le frasi sono *per banda*, mai *per situazione*. Con Kran a 7/60 la riga è
   identica a quando è a 60/60.
2. **Il picco emotivo non è dove il motore lo mette.** Le scene più forti (la morte di Kran
   nell'inseguimento; Bruna che copre l'ultima mischia) escono come **righe di log**. Il
   testo premia i successi con flavor e relega le perdite a un `harmLines`.
3. **Non c'è sollievo.** F4→F5→F6 sono tre decisioni consecutive «sotto pressione». Senza
   valle, F7 non può essere shock.
4. **L'agguato è una tassa piatta.** All'ingresso F7 tutto il party prende 5 dry-damage
   *non posizionali* (spec): è l'opposto di «la persona in fondo paga». Il payoff posizionale
   arriva solo nell'ultima mischia, narrato con la riga generica D3.
5. **F7 è facoltativo per chi gioca bene.** Il momento in cui la quest dovrebbe lasciare il
   segno è, nel 78% delle run ottimali, **saltato**. Chi vince bene non vive mai l'agguato:
   quindi la chiusura deve funzionare *senza* l'agguato.
6. **Il combattimento è un contatore.** 5 turni fissi, −12 HP piatti, stessa frase ×4. Non
   comunica *chi sta vincendo*.
7. **Il lab promette ciò che il motore non dà** (D1, D2, D8): è il difetto peggiore per la
   fiducia: se il testo mente una volta, il giocatore smette di leggerlo.

## C2. Al brief ricevuto (dove non sono d'accordo)

| Idea del brief | Giudizio | Perché |
|---|---|---|
| **Morale come meccanica** (F4 si chiude per rotta) | **Rifiuto per ora** (P2). Accetto il *readout narrativo*. | F4 è calibrata MC (R-097) su 5 turni; una rotta anticipata cambia durata, danni attesi e distribuzione di F5. Il 95,5% di F4→F5 già finisce con 1–2 goblin: la «rotta» è già lo stato reale. Basta **dirlo** leggendo `goblinLeft`+turno+ultimo verdetto (Battle Brothers insegna che il valore sta nella *leggibilità* dello stato). |
| **Libreria di beat di combattimento** | **Sì, ma griglia, non libreria.** | Una libreria random produce eventi slegati dalla meccanica. Meglio una griglia `fase × banda` (3×5) + varianti di *gravità del colpo*: ~24 righe totali, ognuna agganciata a uno stato. |
| **Curva target con F7 = shock** | **Correggo.** | Con F7 raggiunto nel 21,6% (optimal), il picco non può essere *garantito* in F7. Il picco di una run deve poter stare in F5, F6 o F7 — dove la decisione è costata di più. La fine (registro) deve essere garantita *sempre*. |
| **Continuità goblin F5→F7** | **Sì, ma solo come testo condizionato a flag esistenti** (`agguatoPeggiore`/`agguatoMite`). | Costo ~2 stringhe. Nessuna entità persistente. Alto valore di memoria. |
| **F6 più concreta** | **Sì — e la meccanica fa già metà del lavoro.** | Il danno crescente 5→10→15 *è* una struttura che cede: va **mostrata** (tenda, trave), non aggiunta come regola. |
| **Metriche emotive MC** | **Sì, ma ridefinite** (D7). | Le due più naturali sono saturate; vanno condizionate a stato, non a nodo. |
| *«Non aggiungere stati/risorse»* | **Concordo** e lo applico a me stesso: nessuna delle mie P0 tocca RNG né calibrazione. | |

---

# D. Proposta

## D1. Diagnosi per fase

| Fase | Forza | Debolezza | Ruolo emotivo | Intervento |
|---|---|---|---|---|
| **F0** | Il mugnaio: conseguenza concreta, nessuna esposizione | — | scopo / responsabilità | **Non toccare.** Diventa il *seme* della chiusura (callback). |
| **F1** | Silenzio innaturale | Il masso non ha motivo visibile (D7); F1-A rivela *tutto* al bigwin | curiosità / disagio | Indizio visibile *prima* della scelta; rivelazione a **scalini** per banda |
| **F2** | Tentazione + campanelli | La spec la rende sempre conveniente (voluto) | tentazione | Solo testo: far *sentire* il rischio fisico (D6); non cambiare i numeri |
| **F3** | `almost` dello stealth = near-miss riuscito | Assalto generico | tensione | Assalto fisico; continuità con F1 (la sentinella) |
| **F4** | Meccanica ricca (slot, escalation) | Contatore: 5 frasi uguali, −12 piatti (D3, D9) | azione → pericolo → disperazione | Griglia fase×banda; gravità del colpo; readout morale; transit F4→F5 *sullo stato* |
| **F5** | La tensione dolore-ora / dolore-dopo | Testo bugato (D1); morte nel log (D4) | decisione dolorosa | Correggere D1; **la morte è la scena**, non il log |
| **F6** | Push-your-luck pulito | Tentazione astratta; flavor e esito in disaccordo (D8) | sollievo → avidità | Oggetto visibile e incompleto; la struttura cede a ogni giro |
| **F7** | Il bosco che guarda | Agguato piatto; ultima mischia con riga generica (D3) | sollievo → shock | Relax *esplicito* prima; prima riga secca; righe posizionali |
| **Fine** | — | Assente (D11) | conseguenza / rilascio | **Registro finale + callback al mugnaio** |

## D2. Curva emotiva: target e come la quest ci arriva

```
 intensità
   5 |                                  ▲F5            ▲F7*(shock)
   4 |                       ▲F4-late         ·
   3 |            ▲F3   ▲F4-mid         ▲F6(avidità)
   2 |  ▲F1  ▲F2        ·       ───valle───
   1 |▲F0                       (relax)                    ▲ Fine (rilascio)
```

| Fase | Stato emotivo target | Come lo produce il testo (non la meccanica) |
|---|---|---|
| F0 | scopo | il mugnaio |
| F1 | curiosità / disagio | silenzio + indizio visibile + sentinella a metà |
| F2 | tentazione | il campanello è *sulla mano* |
| F3 | tensione | stealth = quasi scoperti · assalto = ordine che si spezza |
| F4 apertura | fiducia | colpi puliti, linee che cedono |
| F4 mischia | pericolo | colpi pesanti, voce che si abbassa su chi è <35% |
| F4 rotta | disperazione / speranza | goblin che indietreggiano; *noi* a pezzi |
| F5 | decisione dolorosa | un nome vicino al limite + goblin che zoppica |
| **valle** | **sollievo** | 1 riga di quiete **(nuova)** |
| F6 | avidità → rimpianto | cuoio sotto la tenda; la tenda cede |
| F7 ingresso | sollievo | qualcuno fischietta |
| F7 agguato | shock | il fischio si interrompe |
| Fine | conseguenza / rilascio | registro + mulino |

**Picchi:** F4-rotta, F5, (F7 se avviene). **Valli:** dopo F5/F6-stop (relax), dopo F2.
**Punti di decisione:** F1, F2, F3, F5, F6 (×N), F7. **Punti di tragedia possibili:** F4, F5 (toll),
F6 (se si insiste), F7 (ultima mischia).

## D3. Interventi narrativi — testo proposto (solo dove cambia materialmente)

Convenzione: `{nome}` = interpolazione dal party (slot, non nome fisso); righe ≤ 16 parole;
nessuna cifra nel flavor (gli HP stanno nell'HUD). *Italiano soltanto, traduzioni rimandate.*

### F1 — il masso ha un motivo

- **body**: «Il bosco tace in un modo che ai boschi non viene naturale. Sul sentiero un masso
  sbarra il passo; da sotto spunta un lembo di straccio, schiacciato come da chi aveva fretta.»
- **label A**: *Salire sul masso per leggere il bosco* · **label B**: *Spostare il masso: sotto
  c'è dello straccio* (stesso masso, due gesti — coerenza gratis).
- **Rivelazione a scalini (check A):**
  - `bigwin`: «Dall'alto: fumo basso a est, una fila di pali appuntiti, una sentinella su un ceppo. E un varco dove nessuno guarda.»
  - `win`: «Fumo basso a est e, su un ceppo, una sagoma che non dorme. Il campo è vicino.»
  - `almost`: «Qualcosa si muove tra i rami — una volta sola. Scendete con un sospetto, non con una via.»
  - `fail` / `epicfail`: invariati.
- **Check B `win`**: «Spalle contro il masso. Sotto: stracci, e qualcosa di avvolto.» (non
  «qualcosa è nascosto qui»).
- **Continuità:** se `bonusStealth` (già impostato dal win di A), il body di F3-stealth apre con
  «La sentinella sul ceppo guarda dall'altra parte — per ora.» *(richiede testo condizionato a
  flag, vedi P1)*.

### F3 — assalto fisico, stesso peso dello stealth

| Banda | Riga |
|---|---|
| `bigwin` | «Il primo palo cade prima che qualcuno capisca. Una tenda si accartoccia sul fuoco; due goblin rotolano via ciechi di fumo.» |
| `win` | «Sfondate dove la palizzata è più bassa. Una lancia si alza — troppo tardi.» |
| `almost` | «La palizzata tiene un respiro di troppo. Qualcuno urla; il campo ha il tempo di afferrare le armi.» |
| `fail` | «La carica si pianta nel fango. Vi aspettano già, lance puntate.» |
| `epicfail` | invariato |

Effetto cercato: **stealth = «quasi scoperti»**, **assalto = «li abbiamo colti prima che si organizzassero»**.

### F4 — la griglia (fase × banda) e la gravità del colpo

Fase (derivata, nessuno stato nuovo): **apertura** = T1–T2 · **mischia** = T3–T4 · **rotta** = T5
oppure `goblinLeft ≤ 2`.

| | `bigwin` | `win` | `almost` | `fail` | `epicfail` |
|---|---|---|---|---|---|
| **Apertura** | «Un goblin vola contro il compagno; la linea si apre come una porta.» | «Il colpo apre un varco: un goblin a terra, e non si rialza.» | «Il colpo morde la spalla, non il cuore: barcolla e resta in piedi.» | «Scivola sotto il colpo e risponde nello spazio che avete lasciato.» | «Vi sbilanciate: due lame trovano il fianco scoperto.» |
| **Mischia** | «Una tenda crolla sulla loro retroguardia. Tre pensano ad altro che a voi.» | «Lo spazio si stringe, il colpo è pulito. Uno scudo cade nel fango.» | «Colpito, non abbattuto: arretra tenendosi il braccio e il varco si richiude.» | «Scudi serrati. Il colpo muore su legno e cuoio.» | «La linea si richiude: per un istante lungo siete circondati.» |
| **Rotta** | «Il più grosso cade; con lui la voce del campo. Le lance cominciano a cadere.» | «Un altro cade. Gli altri guardano il bosco, non voi.» | «Non cadono — ma non attaccano più. Indietreggiano un passo alla volta.» | «Ringhiano e si stringono: i disperati colpiscono più forte.» | «Uno che non ha più nulla da perdere si getta su chi è ferito.» |

**Gravità del colpo** (sostituisce *«{nome} incassa il colpo (−12 HP)»* nel testo; le cifre
restano nell'HUD). Soglia su `hpDopo/maxHp`:

| Banda | Riga |
|---|---|
| graffio (>70%) | «{nome} serra i denti. Resta in piedi.» |
| solido (35–70%) | «{nome} si piega, poi si rimette dritto.» |
| grave (20–35%) | «{nome} barcolla: c'è sangue sul fianco.» |
| al limite (<20%) | «{nome} regge solo perché non c'è altro da fare.» |

**Selezione senza toccare l'RNG:** variante scelta con un hash deterministico di
`(seed, checkSeq)` e senza ripetere la riga precedente. **Mai `roll(state)`**: consumare RNG
sposterebbe tutte le sequenze e invaliderebbe la calibrazione MC (R-097). Va coperto da un
test «stesso seed ⇒ stesse righe, stessi esiti».

**Readout del morale nemico** (una riga accanto al contatore goblin; testo derivato):
`≥4 rimasti`: «Tengono la linea.» · `3`: «Si guardano tra loro.» · `≤2 e ultimo win`: «Cedono
terreno.» · `1`: «Stanno per spezzarsi.»

**Transit F4→F5 sullo stato** (sostituisce la riga unica):
- base: «Polvere e sangue. I goblin che restano spezzano il fronte e corrono verso il bosco.»
- se qualcuno <35%: + «Dietro di voi, {nome} si regge a un palo.»

È il setup del brief — *«stiamo vincendo, ma se spingo qualcuno può morire»* — prodotto da
dati che esistono già.

### F5 — la morte è la scena

- `win` **corretto (D1)**: «Li chiudete contro le rocce, uno alla volta. Il sentiero torna silenzioso.»
- Riga di morte durante l'inseguimento (al posto di *«{nome} è morto — su «La caccia tra le rocce»»*):
  «{nome} resta indietro, tra le rocce, e non si alza più.»
- *Lasciarli fuggire* — consequence: «Li guardate svanire. Uno zoppica e si volta una volta sola, per ricordarsi le vostre facce.» → **setta il marcatore** (flag già esistente `agguatoPeggiore`).
- `almost`/`fail` — consequence: «Uno scappa con un braccio avvolto negli stracci. Vi guarda più con odio che con paura.» → marcatore per `agguatoMite`.

### F6 — la tentazione

Opzioni valutate come oggetto visivo:

| Candidato | Pro | Contro | Verdetto |
|---|---|---|---|
| Sacco di monete | chiarissimo | rivela la ricompensa: niente incertezza | scartato |
| Idolo strano | atmosfera | fuori dal kit `bosco`+`saccheggio`; invita lore | scartato |
| Botola / cantina | tentazione forte | è un nuovo spazio = una fase in più (vietato) | scartato |
| Arma ornata sotto la cenere | desiderabile | implica un oggetto-stat | scartato |
| **Cassa semibruciata sotto la tenda crollata** | visibile e *incompleta*; la struttura che cede **è** il danno crescente | — | **scelta** |

- **body**: «Sotto la tenda crollata, un angolo di cuoio con un fermaglio d'ottone. La cenere è ancora calda.»
- **Per turno** (`exploreTurn`): T1 «Il palo che regge il telo scricchiola.» · T2 «Il telo brucia ancora, in basso. Sentite il caldo sul viso.» · T3 «Una trave cede. Chi frugava arretra — e vede il cuoio più vicino.»
- **Fermarsi**: «Lasciate l'angolo di cuoio dov'è. Nessuno lo dice; tutti lo guardano finché non scompare.»
- **Fix D2/D8**: `bigwin` = «Sotto il telo, il cuoio cede: dentro, più di quanto sperassi.» — **oppure** +gold reale in config. Decisione al Director (D5). `fail` = una sola frase (il flavor *o* l'esito, non due che litigano).

### F7 — relax → shock → chi paga

1. **Relax** (`gob-ritorno`, transit/body): «La strada scende verso casa. Qualcuno ha cominciato a fischiettare. Poi smette, senza che nessuno dica perché.» *(il sollievo **prima**, l'inquietudine come ultima clausola — non il contrario)*.
2. **Shock** (`gob-agguato`): «Il fischiettio si interrompe a metà. Una freccia nel palo accanto a voi. Poi tutte le altre.» Prima frase ≤ 8 parole.
3. **Marcatore** (se `agguatoPeggiore`/`agguatoMite`): «Tra i cespugli, quella sagoma che zoppicava.» / «…quello con il braccio fasciato.»
4. **Chi paga** (testo agganciato a rango, non nuova meccanica): per il membro in fondo alla fila: «{nome} copre la ritirata e non la segue.» · per chi intercetta: «{nome} si frappone.» · per un ferito che regge: «{nome} resta in piedi, e questo basta a tutti.»
5. **Trofeo lasciato** — consequence: «Il trofeo rotola nel fosso e nessuno si volta a guardarlo. La strada, davanti, è solo strada.»
6. **Ultima mischia**: righe **della griglia «rotta» + gravità del colpo**, mai *«Il party colpisce. Un goblin in meno.»* quando i kill sono >1 o c'è una morte (D3).

### Fine — il registro e il mulino (massimo effetto per parola)

Chiusura **composta da stato**, non scritta per ogni combinazione:

- **Esito** (una riga, callback a F0):
  - `reward`: «Quella notte, dal mulino, torna il rumore della ruota.»
  - `survived` (trofeo lasciato): «Tornate a mani vuote. Il mulino resta fermo.»
  - `fled`: «Tornate prima del tempo. Il bosco resta dov'è.»
  - `wipe`: «Il consiglio aspetta fino all'alba. Poi manda qualcuno a cercarvi.»
- **Registro** (da `party`): «Tornano in {n}.» + «{nomi dei morti} non tornano.» + se ferito: «{nome} porta il trofeo, e non lo molla.»

Costo: 4 stringhe + 2 template. Ancora la fine al mugnaio di F0 — l'unica cosa che il giocatore
ha *visto* soffrire. È l'intervento col miglior rapporto emozione/parola della proposta.

## D4. Metriche emotive MC (definizioni da implementare nello script)

| Id | Metrica | Definizione | Baseline | Target |
|---|---|---|---|---|
| M1 | Disperazione F4 | P(fine F4 ∧ ≥1 PG <35% ∧ goblin 1–2 ∧ ≥2 PG vivi) | **22,8%** (stima) | 20–35% |
| M2 | Qualità dilemma F5 | per ogni stato F5, rollout *fork* di entrambe le opzioni: dilemma ⇔ ∆P(morte≥1) < 12pp **e** entrambe >5% | *non misurata* (la mia stima 100% è saturata) | 40–70% |
| M3 | Tentazione F6 | P(HP min 30–75%) · e *rimpianto* = P(danno F6 ≥ guadagno atteso) | 45,0% | 40–60% |
| M4 | Presenza del picco F7 | P(F7 raggiunto) condizionata alla policy | **21,6%** | descrittiva; ≥ 1 picco per run su altra fase |
| M5 | «Oh no» F7 | P(oh-no ∣ F7) con soglia *relativa* (danno ≥ 40% del totale) | 96,5% (saturata) | 50–80% |
| M6 | Significatività morte | P(la morte cambia la scelta successiva: slot compattato, bodyguard perso, intercettazione che sparisce) · P(morte su verdetto `win`) | *non misurata* | >70% · tracciata come anomalia |
| M7 | Distribuzione del picco | fase in cui cade il massimo `dangerLevel` per run | *non misurata* | distribuita, non su un nodo |
| M8 | Rapporto sollievo | P(∃ calo di `dangerLevel` ≥1 tra due fasi consecutive) | *non misurata* | >70% |
| M9 | Ripetizione testuale | max ripetizioni della stessa riga in F4 | **3–4** | ≤1 |

Nota onesta: M2, M6, M7, M8 non sono ancora implementate nello script; M1/M3/M4/M5 sì ma con
definizioni grezze (da affinare).

## D5. Piano di implementazione

### P0 — necessario per un alpha credibile (solo testo/dati; **zero RNG, zero calibrazione**)

1. **Fix delle contraddizioni** D1 (F5 win), D2/D8 (F6), D3 (riga dell'ultima mischia), D10 (`goblinLeft`).
2. **Chiusura**: registro + callback mulino (D11) — logica di testo, nessun cambio di esito.
3. **F1**: indizio visibile del masso + rivelazione a scalini.
4. **F3**: assalto fisico.
5. **F6**: cassa semibruciata + 3 righe per turno + riga di stop.
6. **F7**: relax→shock; righe «chi paga» agganciate a rango.
7. **Pacing**: hold transit ∝ parole (config), tetto 24 parole.
8. **Verifica D5** (ferita su stealth win) prima di scriverci sopra.

### P1 — alto valore, richiede piccoli hook

1. **Griglia F4** fase×banda + gravità del colpo, con selezione hash-deterministica e test di determinismo.
2. **Readout morale** dei goblin (derivato).
3. **Transit F4→F5 sullo stato** e **testo condizionato a flag** (`bodyIf`/`textIf`), che abilita anche la continuità F1→F3 e F5→F7.
4. **`options[].consequence`** (la frase di esito di una scelta senza check).
5. **M1–M9 nello script MC**.

### P2 — rimandato

1. **Morale come meccanica** (rotta anticipata di F4) — rompe la calibrazione R-097; si valuta *dopo* aver visto se il readout basta.
2. **Ingresso agguato posizionale** (un colpo al fondo invece di 5 flat a tutti): è la modifica più efficace per «il fondo paga», ma cambia numeri e spec → **decisione del Director**.
3. **Goblin persistente con identità**; **director dinamico** (intensità adattiva stile L4D); **beat di relax come nodo**.

## D6. Decisioni da prendere (Director)

| # | Decisione | Mia raccomandazione |
|---|---|---|
| 1 | Applicare **P0** subito (solo testo; test di non-regressione) | **Sì** |
| 2 | F6 `bigwin`: correggere solo il **testo** o dare un **+gold** reale? | testo ora; +gold valutato in MC |
| 3 | Ingresso agguato: restare **flat 5 a tutti** o passare a **un colpo posizionale**? | restare flat in P0; riaprire dopo il playtest del nuovo testo |
| 4 | Morale: **readout narrativo** (P1) o aspettare di giocare P0? | readout in P1; meccanica solo se serve |
| 5 | La fine con callback al mugnaio: va bene come direzione? | sì |

## D7. Cosa non ho fatto

- Nessuna modifica a `questScenarioGoblin.ts`, `questRun.ts`, né alla spec.
- Il file `scripts/quest-goblin-playthrough.ts` è nuovo (player testuale + metriche
  baseline); non è parte del lab e si può rimuovere.
- Le righe sono **bozze**: ogni «[R]» della spec resta valido finché non approvato.
- La ricerca è web a 5 fonti per tema: sufficiente per orientare, non per citare come legge.

## Fonti

- Game Developer — *Gameplay Fundamentals Revisited: Harnessed Pacing & Intensity*; *Using Intensity to Drive Player Engagement*; *Back to Basics: Intensity/Time graphs*.
- Campaign Mastery — *Swell and Lull: Emotional Pacing in RPGs*.
- On Game Design — *When I'm designing a level…*
- Battle Brothers Developer Blog — #4 *Tactical combat mechanics*, #20 *Bravery and Morale*.
- PMC 5663799 — *The Effect of Losses Disguised as Wins and Near Misses in EGMs*; Springer *Near-Misses and Stop Buttons in Slot Machine Play*; PLOS ONE *Winning and losing in online gambling: within-session chasing*.
- Game Informer — *Elder Gods in the Machine: Darkest Dungeon*; Steam Community — *Darkest Dungeon: Abandon Quest mechanic*.
- CHI 2016 — *Peak-End Effects on Player Experience in Casual Games*; Frontiers in Psychology 2019 — *Robustness of the Peak-and-End-Rule for Complex Experiences*.

<!-- ===== repo-snapshot/QUEST_IMPRINTS.md ===== -->

---
title: Quest Imprints — scheletri narrativi e istanziazioni (probe S5)
type: design-probe
status: DRAFT — artefatti del lab-probe; nessuna ratifica; non implementato
created: 2026-10-07
related: NARRATIVE.md §5 (M-07, M-13); R-098; run .mw/runs/20261008-story-archetype-imprints/
---

# QUEST_IMPRINTS — scheletri autoriali e istanziazioni

Materiale del lab-probe «generazione che dà risultati interessanti». Ogni
imprint = scheletro causale + **function spec per beat** (il contratto di
lavoro del testo, non il testo). Le istanziazioni mostrano lo stesso
scheletro rivestito da tag e cast diversi: sono il smoke test di varietà
percepita (M-09).

---

## IMPR-001 — «Il contratto col cuore»

*Estratto da «La strige» (Witcher). Mostro che è vittima; il contratto dichiara
un obiettivo, la soluzione migliore è un'altra; qualcuno guadagna dallo status
quo.*

### Scheletro causale

```
B0 PREMISE      comunità C soffre la minaccia X a cicli; contratto: elimina X
B1 REVELATION   X è la persona P trasformata — l'orrore ha origine dentro C
B2 STAKEHOLDER  qualcuno in C guadagna dal mostro o dal segreto sepolto:
                tentativo di corruzione/sabotaggio del party
B3 HIDDEN PATH  esiste una risoluzione alternativa (salvare P), più rischiosa
B4 ORDEAL       la via dura = sopravvivere al pericolo di X proteggendola
B5 LAST TEETH   anche a successo, P resta pericolosa nella transizione
B6 FORK         conseguenze divergenti: uccidi / salva / abbandona
```

### Function specs per beat

```yaml
B0-PREMISE:
  function: |
    Presentare un contratto leggittimo e pagabile. Il problema deve essere
    reale (perdite tangibili), la reward credibile, e la formulazione deve
    contenere un'unica incongruenza lievissima — un dettaglio stonato che il
    giocatore può ignorare ma che B1 ripagherà.
  must: posta in gioco concreta (vite/beni/routine di C); reward dichiarata
  must_not: accennare a P, alla vera natura di X, o allo stakeholder
  effetto: il giocatore accetta pensando "caccia al mostro standard"

B1-REVELATION:
  function: |
    Produrre indizi fisici che INVERTONo un'assunzione formata in B0.
    Assunzione tipica da invertire: "la minaccia arriva da fuori verso il
    luogo". L'indizio deve lasciare al giocatore la riformulazione.
  must: dettaglio sensoriale verificabile in scena
  must_not: nominare la vera natura; affermare — solo suggerire
  effetto: il giocatore dice "la cosa esce da qui" prima che il testo confermi

B2-STAKEHOLDER:
  function: |
    Far apparire la generosità dello stakeholder PRIMA della scoperta
    completa. Un'offerta che supera la reward del contratto, o un consiglio
    "prudente" a non scavare — il giocatore deve poter notare che conviene
    troppo a qualcun altro.
  must: l'offerta è razionale se la leggi come interesse privato
  must_not: rivelare il movente; rendere lo stakeholder inequivocabilmente
    ostile (deve restare "solo sospetto")
  effetto: sospetto attivo, non certezza

B3-HIDDEN-PATH:
  function: |
    Consegnare la via alternativa come SCOPERTA, non come opzione di menu.
    La condizione di salvataggio deve essere (a) più costosa della via
    standard e (b) giustificata narrativamente — il giocatore deve capire
    perché funziona, non solo che esiste.
  must: il costo extra è leggibile prima di impegnarsi
  must_not: presentarsi come opzione equiprobabile; richiedere oggetti
    che il giocatore non può avere (condizione inclusiva, P59)
  effetto: "rischioso ma giusto" — la via dura è una scelta di valori

B4-ORDEAL:
  function: |
    Convertire la protezione in tensione meccanica: il party deve reggere
    contro X senza eliminare X. Push-your-luck con uscita sempre disponibile
    a costo ridotto — la tentazione di mollare è parte del design.
  must: doppio vincolo (P viva AND party vivo); pressione crescente nel tempo
  must_not: punire l'uscita come fallimento morale — uscire è legittimo
  effetto: la via dura paga in sangue (R-094: varia la valuta del costo)

B5-LAST-TEETH:
  function: |
    Dopo il momento di sollievo, un ultimo pericolo concentrato. La vittoria
    apparente non è la fine — ma il morso finale deve essere più corto e più
    stretto dell'ordalia, non una seconda ordalia.
  must: arriva DOPO un segnale di risoluzione; singolo burst
  must_not: rovinare il salvataggio (P sopravvive al suo stesso morso)
  effetto: chiusura con residuo di adrenalina, non anticlimax

B6-FORK:
  function: |
    Scrivere conseguenze divergenti per TUTTI gli esiti (R-092). Nessuna
    risoluzione deve essere "quella giusta": ogni esito paga in una valuta
    diversa e lascia un'entità diversa nel registro.
  must: almeno un esito scrive un'entità persistente (NPC, nemico, regione);
    l'abbandono è un esito con conseguenze, non un non-evento
  must_not: segnalare quale fork era "canon"; punire il giocatore per
    aver scelto la via sicura
  effetto: il giocatore può raccontare "io ho scelto X e quindi Y"
```

### Invariante del pattern

Qualunque sia il flavor: **il contratto mente** (dichiara kill, la via buona
è altrove), **qualcuno guadagna dal mostro**, **salvare costa di più**,
**l'esito scrive nel mondo**.

---

## Istanza A — tag `palude` + `gilda`: «Il mostro del Molino»

Cast: Maesa (figlia del mugnaio, morta-data-per-morta), Aldo il mugnaio,
Vedovo Sarthe (mercante, destinatario della lettera col corvo — seme S1),
le Gorze. Render completo in conversazione 2026-10-07: indagine sociale,
artigli sul davanzale interno, lettera col sigillo del corvo, ordalia della
notte al mulino, ultimo morso all'alba, Sarthe smascherato→antagonista
ricorrente / mulino comprato se uccisa / notti di luna che mietono se
abbandonata.

## Istanza B — tag `mare` + `recuperi`: «La moglie del mare» (v2)

v1 bocciata dal Director 2026-10-07: impronte sulla battigia incoerenti con
vittime in mare; «padrone del porto» anacronistico; faro e ondata interna
stretchati. v2 riscritta coerente col dominio.

- **B0:** i pescatori da riva e i raccoglitori notturni spariscono; i corpi
  tornano a riva annegati. Contratto: la cosa nell'acqua. *Incongruenza:*
  non tocca mai le barche della corporazione dei recuperi.
- **B1:** sui corpi riportati a riva non ci sono segni di denti né artigli —
  ci sono **lividi di dita, come di mani umane** che trattengono sott'acqua.
  E i rari testimoni giurano di averla vista nuotare *verso* il porto
  all'alba: torna a terra, non viene dal profondo.
- **B2:** il maestro dei recuperi (corporazione dei diritti sui relitti)
  offre il doppio perché il tratto sia dichiarato «maledetto» e presidiato —
  un tratto maledetto è suo esclusivo. È lui che ha la pelle di foca,
  trovata in un relitto e mai registrata.
- **B3:** la pelle nella stiva del suo magazzino, tra il recuperato. La via
  dura: restituirgliela reggendo il suo richiamo.
- **B4:** la notte sulla battigia: il party forma letteralmente la linea
  tra lei e l'acqua fino all'alba — chi cede passo rischia di finire in
  mare con lei. Uscire si può sempre (contratto dimezzato).
- **B5:** quando la pelle la tocca diventa mare per un istante — chi è
  troppo vicino rischia di essere trascinato giù nell'ultima risacca.
- **B6:** *salvata* → torna al mare come entità viva altrove; il racket dei
  recuperi è esposto → il maestro fugge (pool antagonisti); *uccisa* →
  reward piena ma il mare smette di dare pesce e i relitti continuano a
  pagare lui; *abbandonata* → le notti senza luna continuano a prendere
  qualcuno.

## Istanza C — tag `miniera` + `compagnia`: «La vena che morde»

Sostituisce la v1 (`santuario`+`reliquia`) bocciata perché troppo vicina al
flavor originale («innocente trasformato in luogo sacro»). Dominio diverso:
industriale, compagnia mineraria, nessun sacro.

- **B0:** i minatori della galleria bassa tornano sfigurati o non tornano;
  la compagnia ha sigillato il livello. Contratto: la cosa nella vena.
  *Incongruenza:* la compagnia paga il presidio del sigillo più di quanto
  perderebbe a riaprire.
- **B1:** i morti non hanno ferite da bestia — hanno ustioni e segni di
  unghie *umane*; e le ruberie di viveri avvengono **sopra** il sigillo,
  nel dormitorio. La cosa non risale dalla galleria: vive nel campo.
- **B2:** il fattore della compagnia paga profumatamente perché il livello
  resti chiuso «per sempre»: sotto sta estraendo in proprio qualcosa che
  non deve vedere nessuno — e il mostro è il suo alibi perfetto.
- **B3:** P è il figlio del caposquadra, entrato nella vena mesi fa e
  «tornato diverso»; il fattore lo tiene nutrito e nascosto perché un
  mostro vivo vale più di una miniera aperta. La via dura: riportarlo alla
  luce tenendolo fino al tocco della campana del mattino.
- **B4:** la notte nella galleria di scarico: tenerlo dentro E tenerlo
  intero mentre l'istinto lo riporta giù — doppio contenimento.
- **B5:** alla campana torna sé stesso — e nel riprendersi dilania chi ha
  più vicino: ultimo pericolo concentrato.
- **B6:** *salvato* → il ragazzo torna, il traffico del fattore si apre al
  villaggio (esposto → nemico fuggiasco); *ucciso* → reward piena, la vena
  resta chiusa, il fattore continua; *abbandonata* → la galleria continua a
  «dare» morti e lui continua a incassare.

---

## Nota metodologica (appresa nel render + critica Director)

1. Lo scheletro nudo risulta scarno: **il pacing delle rivelazioni vive
   nelle function spec e nel flavor, non nella struttura**.
2. «Salvare P» si generalizza: non sempre «P torna nel villaggio» — nella
   Istanza B torna al mare come entità viva altrove. B6 parla di *scrittura
   nel mondo*, non di esito fisso.
3. **Le function spec non bastano da sole**: validano la *funzione
   narrativa*, non la *coerenza diegetica* (impronte sulla battigia per
   vittime in mare, ondata dentro un faro, «padrone del porto»
   anacronistico). Serve un secondo layer di validazione sul dominio.
4. **Insight Director (verbatim): «ci vuole un set di mostri da collegare
   ai tag»** → il tag non è un aggettivo, è un **domain kit**: creature
   ammissibili, ruoli sociali esistenti nel dominio (capitaneria, corporazione
   dei recuperi, fattore di compagnia), luoghi, oggetti, regole di coerenza.
   L'imprint riempie ruoli astratti; il kit fornisce il vocabolario legale.
5. **La distanza tra tag va misurata su fisica e struttura sociale del
   dominio, non sui nomi**: `santuario` era «troppo simile» perché
   «innocente trasformato in luogo sacro» è la stessa famiglia causale del
   flavor d'origine.

---

## Domain kit — schema

Il kit risponde ai bisogni dei beat, non è un lore dump (P49: entra solo ciò
che un beat consuma). Sezioni:

```yaml
domain_kit:
  tag: <nome>
  vocabolario:
    creature_ammissibili: []   # il «set di mostri» del Director
    ruoli:
      autorita_contratto: []   # chi può emettere un contratto qui
      stakeholder_economico: []# chi può guadagnare dal disastro (riempie B2)
      testimone_comune: []     # gente normale che vede cose (riempie B1)
    luoghi: []                 # luoghi nativi, inclusi «luoghi di veglia» (B4)
    props: []                  # oggetti veri del dominio (indizi, armi, offerte)
  fisica:
    cicli: []                  # cosa scandisce il tempo: luna, fiume in piena,
                             # campana del turno, giorno di mercato
    pericoli_ambientali: []    # la pressione dell'ordalia (B4)
    tracce_ammissibili: []     # quali indizi fisici questo mondo produce (B1)
  coerenza:
    - regola → violazione tipica che blocca
```

Mapping ai beat: B0 consuma `autorita_contratto`+`cicli`; B1 consuma
`tracce_ammissibili`+`fisica`; B2 consuma `stakeholder_economico`+`props`;
B4 consuma `luoghi di veglia`+`pericoli_ambientali`; B6 consuma
`ruoli`/`creature` per le entità da scrivere nel mondo.

## Domain kit compilato — `palude`

```yaml
tag: palude
vocabolario:
  creature_ammissibili:
    - fuoco fatuo / luce-guida
    - annegato rianimato
    - bestia da fango (lupo di palude, anguilla madre)
    - persona trasformata (maledizione, pelle rubata)
    # VIETATO: creature di mare profondo, desertiche, montane, celestiali
  ruoli:
    autorita_contratto: [capo delle chiuse, concistoro dei torbei, curato
      itinerante]
    stakeholder_economico: [guardiano delle chiuse (= controlla il livello
      dell'acqua = controlla chi ha terra asciutta), sensale della torba,
      mugnaio (monopolio della macina), compagnia dei dissodamenti]
    testimone_comune: [pescatore di anguille, raccoglitrice di erbe,
      traghettatore, guardiano notturno del pontile]
  luoghi: [mulino su canale, pontile, torbaia, cappella del poggio asciutto,
    passarelle, chiuse, camminamento dei giochi d'acqua]
  props: [reti da anguille, falce, ceste di torba, lanterna da nebbia,
    registro dei livelli dell'acqua, barca da canale]
fisica:
  cicli: [nebbia dell'alba, apertura stagionale delle chiuse, corsa delle
    anguille, luna (cielo, non maree — non ce ne sono)]
  pericoli_ambientali: [acqua bassa e stagnante, fango che affonda, nebbia
    che toglie suono e vista, passerelle che cedono]
  tracce_ammissibili: [orme nel fango che PARTONO da un luogo, reti aperte
    dall'interno, lanterna ritrovata spenta in un piede d'acqua, barca
    legata e vuota, impronte che affondano meno del peso atteso]
coerenza:
  - niente onde/maree/profondità → viola «acqua bassa e stagnante»
  - i corpi spariscono nel limo, non riemergono → viola «corpo riportato a
    riva» (a meno che non sia trovato da chi lo cercava)
  - di notte la nebbia isola: niente testimoni oculari a distanza
  - ogni spostamento è barca o passerella: niente «inseguimento a cavallo»
  - chi possiede le chiuse possiede la terra: il potere qui è *livello
    dell'acqua*, non denaro diretto
```

### Controllo retroattivo — il kit avrebbe preso gli errori?

| Errore (istanza B v1) | Cosa lo avrebbe bloccato |
|---|---|
| impronte sulla battigia per vittime in mare | `tracce_ammissibili` + regola «l'indizio deve venire dal dominio della vittima» (kit `mare`: corpi, reti, testimoni) |
| «padrone del porto» | `ruoli.stakeholder_economico` del kit `mare`: maestro dei recuperi / capitaneria — il ruolo astratto si riempie solo da lì |
| ondata dentro il faro | `fisica` del kit `mare`: l'ordalia è tra lei e l'acqua; il faro non è «luogo di veglia» dichiarato |
| istanza C «santuario» troppo simile | non è un errore di kit ma di **distanza tag** — serve la metrica ontologica (punto 5 sopra), non il kit |

Il kit `palude` compone col kit `gilda` per l'istanza A (Sarthe viene dal
kit `gilda`, le Gorze dal kit `palude`): dominante + adiacente = kit che si
sommano, esattamente come le adiacenze di tag già proposte.

## Domain kit compilato — `mare`

```yaml
tag: mare
vocabolario:
  creature_ammissibili:
    - persona-di-mare (selkie, figlia della tempesta)
    - annegato rianimato / equipaggio che torna
    - bestia di profondità (serpe, madre delle secche)
    - strega del mare (entità che chiama)
    # VIETATO: creature di fango/acque basse, desertiche, celestiali
  ruoli:
    autorita_contratto: [capitaneria del porto, consiglio dei padroni di
      barca, parroco marinaro]
    stakeholder_economico: [maestro dei recuperi (diritti sui relitti),
      armatore-assicuratore, sensale del pescato, contrabbandiere delle
      secche]
    testimone_comune: [pescatore da riva, guardiano del faro, vedova dei
      naufragati, oste del porto]
  luoghi: [molo, cantiere di riparazione, magazzino dei recuperi, secca che
    affiora a bassa marea, locanda del porto, faro, battigia]
  props: [reti strappate, relitto in vendita, registro dei recuperi, pece e
    sigilli, lampada a olio, lenze, campana del porto]
fisica:
  cicli: [maree, luna nuova (= buio vero), stagione delle tempeste, rientro
    delle flotte]
  pericoli_ambientali: [risacca che trascina fuori, buio completo sull'acqua,
    scogli affioranti, freddo che uccide prima del mostro]
  tracce_ammissibili: [corpi che la marea restituisce (con segni addosso),
    barca trovata intatta senza equipaggio, reti tagliate dal basso,
    oggetti del naufragio già rivenduti, testimone sopravvissuto che ha
    visto la cosa nuotare VERSO terra]
coerenza:
  - le vittime in mare lasciano prove nel mare: corpi, reti, relitti,
    testimoni — mai impronte su terreno asciutto
  - il potere qui è sui diritti (recuperi, dazi, approdo), non sul denaro
    diretto
  - di notte sull'acqua non ci sono testimoni oculari a distanza
  - la direzione dell'inversione nativa: «viene dal profondo» vs «torna a
    riva»
```

## Domain kit compilato — `miniera`

```yaml
tag: miniera
vocabolario:
  creature_ammissibili:
    - persona trasformata dal contatto con la vena
    - scavatore impazzito nel buio
    - la vena stessa (entità-ambiente che «respira»)
    - bestia di galleria (cieca, del sottosuolo)
    # VIETATO: creature aeree, marine, celestiali, di superficie aperta
  ruoli:
    autorita_contratto: [fattore della compagnia, caposquadra anziano,
      sindaco del campo]
    stakeholder_economico: [fattore (estrazione parallela nascosta),
      proprietario del campo, venditore di viveri a prezzi di monopolio]
    testimone_comune: [minatore di turno, ragazzo delle gabbie, medico del
      campo, vedova del campo]
  luoghi: [galleria bassa sigillata, bocca del pozzo, dormitorio, magazzino
    viveri, galleria di scarico, ufficio del fattore, catasta del puntellame]
  props: [registro dei turni, sigilli e legname d'assegnazione, contatore
    viveri, campana del turno, lampade a olio, canarino in gabbia]
fisica:
  cicli: [campana del turno, paga quindicinale, spedizione del carico,
    chiusura stagionale]
  pericoli_ambientali: [buio totale, aria cattiva, puntellamento che cede,
    dislivelli, galleria che si restringe]
  tracce_ammissibili: [ferite «umane» sui corpi risaliti, ruberie di viveri
    nel dormitorio (la cosa mangia SOPRA), turni firmati da chi era morto,
    attrezzi morsicati, voci nel buio che chiamano per nome]
coerenza:
  - il buio non ammette testimoni oculari: le prove sono fisiche o sonore
  - la cosa non può «venire da fuori»: o è sotto, o era già nel campo
  - il potere è la licenza di estrazione e le scorte, non il denaro diretto
  - chi controlla il registro dei turni controlla chi era dove
```

---

## IMPR-002 — «Il compagno che ride»

*Estratto da «L'Isola del Tesoro». L'antagonista non è la minaccia esterna:
è dentro la logistica della spedizione stessa — chi ti ha aiutato a partire
è chi ti porta a morire. Spina causale diversa da IMPR-001 (non c'è
vittima-da-salvare; c'è un alleato-da-smascherare).*

### Scheletro causale

```
B0 PREMISE      obiettivo X con mappa/chiave; serve organizzare una
                spedizione → serve aiuto che il party non ha
B1 THE HELP     alleato A offre esattamente ciò che manca (competenze,
                uomini, mezzi); competente, generoso, simpatico
B2 CRACKS       piccole incongruenze: gli uomini di A sono fedeli ad A, non
                alla missione; A sa cose che non dovrebbe; qualcuno tenta
                di avvisare troppo tardi
B3 THE TURN     a metà quest: la prova che A non era mai dei tuoi — non ha
                tradito il piano, il piano era suo
B4 INSIDE OUT   il party è dentro la disposizione del nemico: combattere,
                fuggire, o recitare la parte; le risorse (mappa, mezzi,
                numeri) sono in parte nelle sue mani
B5 IRONY        la posta risulta già spostata — qualcuno ha svuotato la
                posta in gioco prima; il conflitto si combatte su un
                fantasma
B6 FORK         esiti divergenti su TUTTI i fronti: destino di A (catturato
                / fuggito / caduto), stato della posta, cosa sa il villaggio
```

### Function specs per beat

```yaml
B0-PREMISE:
  function: |
    L'obiettivo deve essere impossibile con le sole forze del party:
    manca qualcosa di concreto (mezzi, uomini, accesso). Il bisogno è
    la porta d'ingresso di B1 — senza bisogno, l'alleato è decorativo.
  must: la carenza è nominata esplicitamente ("non abbiamo barca/uomini/")
  must_not: suggerire che l'aiuto arriverà da qualcuno di specifico
  effetto: il giocatore CERCA aiuto — l'antagonista gli viene incontro

B1-THE-HELP:
  function: |
    L'alleato deve essere LA risposta migliore disponibile, non una
    trappola ovvia. La sua utilità deve essere reale e dimostrata —
    la simpatia è gratuita, la competenza no.
  must: A risolve davvero un problema (dimostra, non promette)
  must_not: nessun segnale di minaccia; nessun costo occulto visibile
  effetto: il giocatore è contento di averlo — il tradimento sarà una
    perdita, non un "lo sapevo"

B2-CRACKS:
  function: |
    Indizi sociali, non fisici: la lealtà degli uomini di A corre verso A.
    Ogni indizio deve avere una spiegazione innocente plausibile — il
    giocatore può archiviarli tutti, e molti lo faranno.
  must: ogni crepa ha una lettura innocente; nessuna prova singola
    è decisiva; un avvisatore arriva troppo tardi o poco credibile
  must_not: mai una prova che FORZA la diffidenza prima di B3
  effetto: retroactive dread — a B3 il giocatore ripesca tutte le crepe

B3-THE-TURN:
  function: |
    La rivelazione deve essere strutturale, non morale: A non ha tradito
    il piano — il piano era suo, la spedizione era il suo veicolo.
    Il giocatore scopre di essere sempre stato il mezzo, non il capo.
  must: scoperta fattuale (intercettazione, prova, confessione sentita);
    avviene quando uscire è già costoso
  must_not: reveal via monologo del villain; avvenire in fase iniziale
  effetto: il giocatore rivaluta retroattivamente ogni gentilezza di A

B4-INSIDE-OUT:
  function: |
    Il party è dentro l'infrastruttura di A: scegliere tra forza (persa),
    fuga (parziale) o la recita (chi gioca da chi?). Le opzioni devono
    essere tutte giocabili e tutte costose.
  must: almeno due vie reali; le risorse di A sono le risorse del party
  must_not: rendere la forza bruta la via "giusta"
  effetto: la quest cambia natura a metà — da obiettivo a sopravvivenza
    sociale

B5-IRONY:
  function: |
    La posta era già stata mossa prima che il conflitto maturasse.
    Il senso: sia il party che A combattevano su un fantasma — la
    ricompensa dipende da chi ha mosso la posta E QUANDO, non da chi
    vince lo scontro.
  must: chi ha mosso la posta è un'entità esistente, non un deus ex;
    il momento dello spostamento è retrodatato a prima del turn
  must_not: annullare il valore delle scelte di B4 — cambiano il prezzo
    pagato, non l'esito della posta
  effetto: la vittoria non è chi ha vinto lo scontro

B6-FORK:
  function: |
    Come IMPR-001: ogni esito scrive nel mondo. La differenza: qui la
    conseguenza principale è sulle RELAZIONI — A rientra come nemico
    ricorrente, socio imbarazzante, o ricordo amaro. Chi ha mosso la
    posta (B5) diventa un'entità da scoprire nella prossima quest.
  must: A sopravvive almeno in un ramo (entità ricorrente più fertile
    di A morto); il villaggio apprende una versione parziale
  must_not: chiudere tutti i fili — questo imprint deve lasciare entità
    calde per il casting pool
```

### Invariante del pattern

Qualunque sia il flavor: **l'aiuto è la trappola**, **la prova arriva dopo
il punto in cui uscire era economico**, **la posta si muove indipendente
dal conflitto**, **l'antagonista deve poter sopravvivere**.

### Differenza strutturale da IMPR-001 (per la varietà percepita)

IMPR-001: la minaccia è esterna e contiene una vittima. IMPR-002: la
minaccia è interna e contiene un benefattore. I due scheletri non si
«sentono» uguali nemmeno nudi — buon segno: la distanza ontologica non è
solo tra tag, è tra imprint.

### Istanza IMPR-002-A — tag `palude`: «Il traghetto della cassa»

- **B0:** una cassa di matrimonio/documenti è affondata nei canali interni;
  recuperarla serve a chiudere un affare del villaggio. Manca: barche e
  conoscenza delle acque *(il bisogno = il mezzo mancante)*.
- **B1:** il **guardiano delle chiuse** offre i suoi barcaioli e la via
  d'acqua — competente, conosce ogni canale, «per il bene del villaggio».
- **B2:** i suoi uomini prendono ordini dai suoi gesti, non dalla missione;
  sa dove sono i fondali bassi troppo bene; la raccoglitrice avvisa tardi:
  «i suoi lumi non segnano la via, segnano la preda».
- **B3:** alla meta i suoi uomini sono già piazzati — la spedizione era il
  suo recupero privato; il party era copertura per un tratto che non poteva
  fare da solo *(chi controlla l'acqua controlla tutto — regola del kit)*.
- **B4:** sulle sue barche, nei suoi canali: forza (fuori numero, sull'acqua),
  fuga (torbaia — cedono le passerelle), recita (spartire il recupero).
- **B5:** la cassa era già stata svuotata — anni prima, da chi l'aveva
  affondata. Chi ha mosso la posta = entità calda per la prossima quest.
- **B6:** *A catturato* → il villaggio scopre chi controllava l'acqua;
  *A fuggito* → antagonista ricorrente che conosce i canali meglio di
  chiunque; *posta persa* → il depositario sconosciuto resta da scoprire.

### Istanza IMPR-002-B — tag `mare`: «La secca che affiora»

- **B0:** un relitto affiora a bassa marea su una secca lontana; il carico
  (registro di bordo/merce) serve al villaggio. Manca: una barca e
  uomini di mare.
- **B1:** l'**armatore-assicuratore** offre la sua caracca e l'equipaggio —
  «la zona la conosco, vi porto io».
- **B2:** l'equipaggio guarda lui prima di ogni ordine; conosce la posizione
  della secca «per sentito dire»; la vedova dei naufragati tenta di avvisare
  — arriva dopo la partenza *(tracce sociali, mai prove fisiche — regola del
  kit: di notte in mare niente testimoni)*.
- **B3:** alla secca la sua gente ha già il piano di recupero pronto — la
  spedizione era la sua copertura legale per razziare un relitto su cui non
  aveva diritti.
- **B4:** a mare sulla sua barca: forza persa, fuga = scialuppa/rumiglia in
  piena corrente, recita = fingersi soci.
- **B5:** la stiva del relitto era già stata alleggerita — dal **maestro dei
  recuperi** in una spedizione registrata a metà (cross-cast: due ruoli del
  kit, due persone diverse). Il party e l'armatore si contendono un fantasma.
- **B6:** *A fuggito* → pirata/ricorrente che conosce le secche; *posta
  parziale* → il maestro dei recuperi entra come entità-ombra del dominio
  mare; *se lo sgamano* → due stakeholder dello stesso kit si accusano a
  vicenda.

### Istanza IMPR-002-C — tag `miniera`: «La squadra del caposquadra»

*(revisionata R-165: la posta passa da «carico» a «persone» — la versione
originale era una quest di logistica, vedere il contratto di scrittura più
sotto)*

- **B0:** il crollo ha sigillato la galleria bassa **con un turno intero
  dentro** — nove minatori su aria cattiva, le famiglie già al pozzo. Manca:
  una squadra che conosce la roccia per arrivarci in tempo.
- **B1:** il **caposquadra anziano** offre i suoi minatori — «loro sanno dove
  camminare, io so dove». Aiutare il salvataggio lo espone: la sua vena
  segreta è vicina al punto che è caduto.
- **B2:** i minatori prendono gli ordini dal suo fischietto; il suo registro
  dei turni mostra squadre in una galleria che le mappe danno sigillata (e
  il materiale occultato sotto altri nomi); il ragazzo delle gabbie avvisa
  a metà discesa *(prop del kit: il registro dei turni decide chi era
  dove)*.
- **B3:** nella galleria — la sua estrazione parallela ha **indebolito il
  tetto che ha seppellito i nove**: il salvataggio che ha offerto è la
  copertura legale per l'ultimo carico prima che la compagnia noti. Loro
  sono le sue vittime; noi i testimoni del suo alibi.
- **B4:** sottoterra, nelle sue gallerie: forza (loro conoscono il buio),
  fuga (risalita lunga — e lasciare i nove a lui), recita (società nella
  vena = silenzio su chi ha causato il crollo), *più* la puntellatura
  marcia come argomento ambientale.
- **B5:** i minatori intrappolati non sono sotto la roccia — **sono stati
  presi**: attrezzi posati a metà, tracce di trascinamento verso la
  galleria profonda *(ponte diretto all'entità dell'istanza C di IMPR-001:
  la posta erano persone, e TAKEN≠SECURED ora significa anche loro)*.
- **B6:** *A catturato* → la compagnia scopre l'estrazione che ha causato
  il crollo; *A fuggito* → sa la roccia meglio di chiunque, antagonista
  tecnico; *posta già presa* → i presi sono la pressione del dominio, la
  prossima quest li cerca.

### Cosa insegna il secondo render

- **Chi è A dipende dal dominio:** in `palude` chi controlla l'acqua, in
  `mare` chi controlla il trasporto, in `miniera` chi controlla il registro
  dei turni. Regola emersa: *A = chi controlla il mezzo mancante di B0* — la
  coerenza non è decorazione, decide il casting.
- **B5 crea ponti tra istanze:** il «chi ha mosso la posta» può essere
  un'entità già viva in un'altra quest dello stesso dominio (istanza C di
  IMPR-001 appare in IMPR-002-C) — la memoria si intreccia senza costruirla.
- **Le function spec hanno tenuto** su tre domini diversi; gli errori della
  volta scorsa non si ripetono perché ogni dettaglio viene dal kit.

---

## Compilazione imprint→grafo (R-152, 2026-10-12)

Le function spec dei beat non sono più solo istruzioni per il testo: da
R-152 esiste la compilazione in **grafo meccanico reale**. Primo artefatto:
`gen-impr002-palude` «The Lock-Keeper's Bargemen» — IMPR-002 × kit palude —
in `src/balancing/config/idleVillage/quests/generation/impr002Palude.ts`.

### Il contratto di compilazione

| Beat (function spec) | Compilazione meccanica |
|---|---|
| B0 PREMISE — manca il mezzo | choice di apertura: accettare l'aiuto (flag `uomini-di-a`, prezzo pagato dopo) o pagare il pedaggio dell'autonomia (check di approccio) |
| B1 THE HELP — l'aiuto è la trappola | il flag dell'opzione: il costo si materializza nel routing di B3, non in un testo |
| B2 CRACKS — inconsistenze | vars del run (`sospetto`): N canali one-shot (flag `segna-*` + `hiddenIfFlag`), epicfail arma la trappola (`annusati`) — i segni sono sociali/comportamentali, mai prove fisiche |
| B3 THE TURN — il piano era suo | check router con `goto` condizionale sullo stato POST-effetto: pronti→sorpresa, sospetto≥2→lettura di conferma, annusati→imboscata pesante, altrimenti→pedaggio cieco. Tutte le rotte finiscono dentro la sua disposizione |
| B4 INSIDE-OUT — nella sua casa | fork a 4 vie: forza (combat lungo, numeri suoi), sorpresa (combat breve gated `pronti` — il payoff dei crack), fuga (check), recita (check sociale; il fail marca `smascherati` e l'opzione sparisce — una recita non si offre due volte) |
| B5 IRONY — la posta era un fantasma | il nodo cassa: `posta-mossa` su OGNI riga di verdetto — chiunque tenga il campo trova il contenuto già mosso; solo una buona lettura trova `depositario-traccia` (il seme della chain: chi l'ha svuotata) |
| B6 FORK — esiti divergenti | flag che il run scrive per il mondo: `a-consegnato` (reward), `a-fuggito` (seme entità ricorrente — può prodursi anche da un check fallito, TAKEN≠SECURED sul prigioniero), `a-padrone`, `soci-onorati`/`soci-traditi` |

### Cosa è generico e cosa resta authored

- **Generico (il ponte, riusabile):** lo scenario compilato è un
  `QuestScenario` che viaggia sul profilo motore `'gen'` via
  `ScenarioInstance` — stessa via dei generati skeleton×kit, zero switch
  authored. `verdictTable`, vars, `armRolls` trait-gated, goto condizionali
  bastano per esprimere i beat: **nessun delta motore** salvo la copy del
  combat (sotto). Id `gen-<imprint>-<dominio>` marca la provenance:
  `labModel.imprintCatalogEntries()` li espone come classe distinta dalle
  generazioni gimmick×kit — nessun GimmickId coinvolto.
- **Delta motore minimo:** `CombatSpec` ha ora copy dichiarativa opzionale
  (`enemyName`, `attackLines`, `clearedText`, `survivorsText`,
  `holdingText` con placeholder `{turn}`/`{left}`) — fallback goblin
  identico, nessuna migrazione. Serve a ogni fight non-goblin, incluso il
  mimic (combattimento breve da sorpresa, nessun bottino).
- **Authored (per-istanza):** il grafo stesso — nodi, vars, pesi delle
  tabelle, copy. La compilazione v0 è artigianale: il beat diventa nodo per
  scelta di design, non per trasformazione automatica. Un compilatore
  meccanico function-spec→grafo è possibile solo dopo 2-3 istanze (serve
  vedere cosa si ripete).

### Seconda istanza: cosa si è rivelato riusabile (R-159)

`gen-impr002-mare` «The Shipowner's Carrack» — IMPR-002 × kit mare — in
`src/balancing/config/idleVillage/quests/generation/impr002Mare.ts`. La
seconda compilazione conferma il contratto e ne misura i confini:

- **Riusabile alla lettera (la spina):** il turn router B3 (stesso
  `goto` identico, letteralmente riusato), la struttura dei canali crack
  one-shot `segna-*`, `armRolls` trait-gated, la logica `posta-mossa` su
  ogni riga di verdetto, il vocabolario dei flag B6
  (`a-consegnato`/`a-fuggito`/`a-padrone`/`soci-*`).
- **Diverso per meccanica, non per nomi (anti-reskin):**
  - B0 — in palude l'autonomia costava fatica (fail = solo HP); in mare
    **non ci si può nascondere**: il fail della vela solitaria paga danno
    *e* `annusati` — essere visti remare da soli equivale a essere stati
    colti a indagare. Stesso flag, causa diversa: il dominio decide cosa
    costa l'indipendenza.
  - B2 — il canale "avviso" di palude era informativo puro; il registro
    portuale di mare produce `polizza-ombra`, **prova documentale** che
    alimenta `sospetto` *e* gatea il ramo B6 più forte (`ma-sgama` via
    `requiresInfo`): investigare compra un finale, non solo un bonus.
  - B5 — il seme chain cambia dominio: `depositario-traccia` (palude) →
    `traccia-maestro` (il maestro dei recuperi — seconda entità ombra,
    cross-cast).
  - B6 — nuova via `a-sgamato` → convoglio-delle-prove (`ma-consegna`,
    check cha+int: le carte remano al posto tuo): consegnare uomo +
    documenti mette due stakeholder del kit l'uno contro l'altro.
- **Apprendimento confermato:** `costGold` sulle opzioni ha un side-effect
  goblin-hardcoded (intel `simbolo` + log "the merchant") — non usabile
  negli scenari `gen`. Un prezzo in oro per l'autonomia resta un desiderio
  authored, ma va espresso in altro modo (o il side-effect va reso
  dichiarativo in una futura R).

Con due istanze sullo stesso imprint, la parte riusabile è ora
dimostrata come *meccanica* (router, canali, vocabolario flag), non solo
come testo. Terza istanza candidata: `miniera` — se i pattern reggono una
terza volta, il compilatore automatico function-spec→grafo diventa
valutabile (proposal, non commitment).

### Contratto di scrittura dei nodi (R-165, 2026-10-12)

Regole per la copy di OGNI nodo compiled scenario — fonte: Wildermyth
*Event Design Philosophy* (le 5 regole degli eventi) + l'anatomia degli
indizi *Display → Informazione → Significato* (Jack Edward, *The Anatomy
of a Clue*) + la Three Clue Rule di Alexandrian che già applichiamo ai
canali B2. Un nodo che viola queste regole è un bug di scrittura, anche se
il grafo gira.

1. **Il testo serve una scelta.** Ogni nodo prepara la decisione che lo
   segue o la conseguenza che lo precede — il testo che non serve né
   l'una né l'altra è rumore.
2. **I membri del party entrano nel testo.** Quando un tratto o un ruolo
   ha prodotto un effetto (l'`armRoll` del `prudente`, un check vinto da
   un membro), il testo lo *nomina* — «Otta scuote la testa: "Quel fischio
   non è della campana"» — non lo astrae in «la squadra». *(Nota motore:
   oggi la copy non interpola nomi/tratti del party — gap noto, la regola
   vale dove il trait ha un canale dedicato come `fiuto-prudente`.)*
3. **Atmosfera concreta, non fiorita.** Immagini e dettagli materiali,
   non aggettivi. «Attrezzi posati a metà turno» batte «atmosfera
   inquietante».
4. **Contesto immediato.** Chi rischia cosa deve essere leggibile nel
   primo paragrafo del nodo — non al terzo.
5. **Brevità monumentale.** Poche frasi, peso massimo. Il giocatore deve
   poter decidere dopo una lettura, non dopo uno studio.

E tre regole nostre, nate dagli errori di `miniera` v1:

6. **La posta deve sanguinare.** Ciò che si perde fallendo deve essere
   persone (vite, salvezza, giustizia) — non logistica. «Un carico paga il
   trimestre» è un bilancio, non una posta; «nove minatori su aria
   cattiva» è una posta. Se la posta è un oggetto, il suo costo umano va
   reso visibile nella stessa frase.
7. **Ogni intel dichiara il suo Significato in una frase piana.**
   Display può essere evocativo, Informazione può essere parziale, ma il
   Significato si dice in chiaro: «qualcuno sta nascondendo queste morti»
   — mai un dettaglio criptico che richiede di ricomporre l'enigma
   (es. VIETATO: «turni firmati dai morti» senza spiegare cosa significa).
   Test: se il Significato non sta in una frase che un giocatore ripeterebbe
   a un amico, è troppo intelligente.
8. **Le chain seeds sono promesse comprensibili.** `traccia-morso` deve
   dire «tracce di trascinamento verso la galleria profonda — sono stati
   presi, non sepolti», non un engramma per il futuro autore. Il seme
   serve al giocatore prima che al registro mondo.

Applicazione: `impr002Miniera.ts` revisionata in R-165 (B0 da «carico» a
«minatori intrappolati», indizi in chiaro, B5 «presi non sepolti»). Le
istanze palude/mare rispettano già la regola 6? B0 palude/mare = la posta
è la cassa/relitto (oggetto) — **da rivalutare** alla prossima revisione
di copy: anche lì la posta dovrebbe avere un costo umano visibile.

### Terza istanza: il verdetto sul compilatore (R-163)

`gen-impr002-miniera` «The Foreman's Crew» — IMPR-002 × kit miniera — in
`src/balancing/config/idleVillage/quests/generation/impr002Miniera.ts`.
Con tre istanze la misura è fatta. **Riutilizzato identico (verbatim o
quasi):**

- il turn router B3 (`goto` letteralmente identico nelle tre istanze);
- il nodo `avviso` (l'evidenza che arriva tardi: testimone → vedova →
  ragazzo delle gabbie — stesso ruolo, stesso shape);
- la famiglia `disposti`/`lettura`/`trappola`/`imboscata` (4 nodi,
  differiscono solo in copy e pesi);
- la forcella `scelta` (primo-colpo gated `pronti` / forza / fuga→check /
  recita→check con `smascherati` one-shot);
- la forcella `in-piedi` (lega / sgama gated intel / lascialo);
- il nodo B5 (`posta-mossa` su ogni riga + seed intel su win+) e il suo
  goto router (`a-prigioniero→convoglio`, `a-sgamato→consegna`,
  `soci→patto`, else `ritorno`);
- la famiglia finale `convoglio`/`consegna`/`patto`/`lontana`/`ritorno`/
  `fine` + epilogue flag→lore/titles.

**Ciò che resta authored — il "foglio di parametri" del dominio:**

- identità di A e il mezzo che controlla (acqua / trasporto / registro);
- percorso autonomo B0: profilo stat (str+con / agi+con / con+int) e
  **modo di esposizione** del fail (nessuno / vista / suono — il kit
  `miniera` formalizza: "il buio non ammette testimoni oculari: le prove
  sono fisiche o sonore");
- il canale documentale B2: intel che alimenta `sospetto` E gatea il ramo
  più forte — `polizza-ombra` e `turni-ombra` sono **lo stesso ruolo
  riempito due volte** (prova scritta → `a-sgamato`); la variante palude
  (`avviso-tardivo`, informativo puro) è il grado zero di quel ruolo;
- opzioni B4 extra: `mi-via-puntelli` (buttare giù la puntellatura — win
  salta il combattimento, almost diventa la tua imboscata, fail combatte
  ferito) — **primo uso authored di hazard-ambiente come via al fight**,
  la via del «combat props» segnata interessante in ARCHITECTURE §18.4;
- il "chi ha mosso la posta" B5: `depositario-traccia` (umano ignoto) →
  `traccia-maestro` (umano noto, stakeholder) → `traccia-morso`
  (**non umano**: ponte diretto all'entità di IMPR-001-C — il dominio
  ricorda senza registro mondo);
- l'autorità di `a-sgamato` (porto / fattore della compagnia) e tutta la
  copy.

**Verdetto:** ~70-75% del grafo è template fisso; il resto è un foglio
parametri di ~10-15 risposte di dominio. Un compilatore
function-spec→grafo **è valutabile come proposal** — ma attenzione: ciò
che rende le istanze non-reskin vive esattamente nei parametri authored
(modo di esposizione, tipo di entità B5, opzioni extra B4). Un compilatore
che genera solo il template produce scenari corretti e generici; il valore
resta nel casting di dominio — che è lavoro di autore o di un LLM guidato
dal kit, non di una trasformazione meccanica.

### Chain-ready, non chain-executed

I flag B6 e l'intel `depositario-traccia` sono **hook espliciti**: il
grafo scrive entità e fatti irrisolti nel report (epilogue lore/titles),
ma il registro mondo che li leggerà (casting persistente, scheduling
«perché ora?», semi dormienti/consumati) è il gate M-02/M-12 — non
esiste ancora. La compilazione garantisce che quando arriverà, gli scenari
imprint avranno già qualcosa da consegnargli.

### Convenzione di naming

Attenzione alla collisione storica: in PLAN-026 «imprint» indicava lo
scenario generato skeleton×kit. Da R-152: **imprint narrativo** = scheletro
causale di QUEST_IMPRINTS (IMPR-XXX); **imprint-compiled scenario** =
questo file (id `gen-imprXXX-*`); **generated scenario** = skeleton×kit
(id `gen-<gimmick>-<kit>`).

<!-- ===== repo-snapshot/QUEST_OPPORTUNITY_LAYER.md ===== -->

---
title: Quest Opportunity Layer — grafo delle opportunità, famiglie, requisiti e ricompense
type: design-knowledge
status: PROPOSAL — sotto-decisioni parzialmente ratificate dal Director 2026-10-12 (marcate «ratificato» nel testo); il resto resta candidato (tracking OPEN-019/020/021)
updated: 2026-10-12
provenance: sintesi del Director di una discussione con ChatGPT; ledger di estrazione in context/ingestions/2026-10-11-quest-opportunity-layer.md
related: R-153, R-154, R-161, QUEST_ECONOMY_NOTES.md, QUEST_GENERATION_SPEC.md,
         QUEST_GENERATION_ARCHITECTURE.md (§15 chain quest), QUEST_RULES.md,
         OPEN-010, OPEN-012, OPEN-013, OPEN-015, OPEN-016,
         OPEN-019, OPEN-020, OPEN-021, PLAN-026, PLAN-028, NARRATIVE.md,
         VILLAGE_ECONOMY.md, GAMEPLAY_DESIGN.md
---

> **Status:** PROPOSAL. Il contenuto è candidato di design — nessuna
> regola vigente — salvo i punti marcati **«ratificato»** (decisioni
> Director 2026-10-11/12, registrate in `context/DECISION_LOG.md`):
> visibilità parziale del grafo, modello dati ibrido, archi config-first,
> transizione mid-run tra famiglie, stati gate su offer card, flashback
> prep alto tier, doppio timer, capacità parallela = solo
> leader-capacity, intel = no valuta (solo esploratore). Restano
> proposal: tassonomia requisiti (OPEN-020), economia villaggio
> (OPEN-010/012), conversion rewards (posticipate al playtest).

# Quest Opportunity Layer

Il **layer delle opportunità** è il livello sopra la singola quest: non
come si risolve una spedizione (dominio di `QUEST_RULES.md` e del
generatore in `QUEST_GENERATION_SPEC.md`), ma **quali quest esistono,
perché compaiono, cosa aprono e con cosa competono**.

Due concetti vicini ma distinti già documentati:

- **Arco narrativo / chain quest** (`QUEST_GENERATION_SPEC.md` §8,
  `ARCHITECTURE.md` §15): fili narrativi persistenti che generano
  occasioni di gioco e reagiscono alle risoluzioni. Vive nella fiction.
- **Grafo delle opportunità** (questo doc): struttura meccanica delle
  relazioni di sblocco tra quest, capacità, ricompense e accessi. Vive
  nelle regole. Un arco narrativo *può* percorrere il grafo; il grafo non
  presuppone una storia.

## 1. Il grafo delle opportunità

Non un albero «completa A → sblocca B»: un **grafo** in cui più percorsi
convergono sulla stessa opportunità e una quest apre porte diverse.

```
Obiettivo strategico
Es. infiltrarsi in una fortezza
Percorso A ─ skill furtività ─ riduce rischio allarme
Percorso B ─ camuffamento/contatti ─ ingresso alternativo
        └→ stessa quest: infiltration, preparazioni e rischi diversi
Ricompensa A → informazioni riservate  (apre porta X)
Ricompensa B → accesso o contatti      (apre porta Y)
```

Proprietà candidate:

- **Convergenza**: un'opportunità può richiedere «una di N preparazioni»,
  non una catena obbligata.
- **Divergenza**: la stessa quest produce ricompense che abilitano
  possibilità differenti a seconda di *come* è stata risolta (coerente
  con QUEST_RULES §8: conseguenze in base a come si risolve).
- **Il grafo rappresenta relazioni di sblocco**, non successione
  temporale: un arco «A apre B» può restare attivo per settimane di gioco.
- **Persistenza**: lo stato degli archi (porte aperte, informazioni
  possedute, accessi acquisiti) è parte del save — candidato al layer D
  «persistenza narrativa» di GENERATION_SPEC §2.

**Visibilità del grafo** (**ratificato**, Director 2026-10-11):
**visibilità parziale** — il giocatore vede i nodi persistenti (accessi,
contatti, luoghi, clocks) e le porte note; le quest non ancora sbloccate
restano nascoste. Via di mezzo tra board-only (Fallen London) e grafo
completamente visibile (Slay the Spire).

**Modello dati** (**ratificato**, Director 2026-10-12): **ibrido** —
(a) **qualities piatte** (`access:`, `intel:`, `contact:`, `clock:`) per
lo stato ambientale persistente + **offer generator** che interroga lo
stato e produce offerte transitorie; (b) pochi **nodi authored** per le
milestone/obiettivi strategici visibili (es. «infiltrarsi nella
fortezza») che tracciano quali approcci sono aperti. Le quest non sono
nodi del grafo: sono offerte attraverso lo stato.

**Tipi di arco** (**ratificato**, Director 2026-10-12): **set aperto
config-first** — i tipi di relazione (sblocco, informazione,
preparazione, …) sono un enum estendibile in config, non una tassonomia
chiusa. V0 suggerito: sblocco / informazione / preparazione + clocks
come nodi di stato.

Regole candidate (dalla ricerca R-154, proposal): ogni nodo critico
richiede ≥2 ingressi di tipo diverso (Three Clue Rule generalizzata); la
convergenza è lecita solo con **path-dependent modifiers** (il nodo di
arrivo registra come ci sei arrivato).

Aperto (OPEN-019): come gli archi persistenti sopravvivono alle run,
come il generatore attraversa il grafo, definizione dei clocks come
meccanismo di avanzamento del mondo.

## 2. Famiglie di quest

Le quest appartengono a **famiglie macro** — candidati iniziali:

| Famiglia | Tema | Meccaniche compatibili (esempi) |
|---|---|---|
| Stealth / infiltrazione | entrare senza farsi scoprire | allarme a stati nominati, contatori, canali DEX/INT/CHA |
| Combattimento / sopravvivenza | scontri, difesa, attrito | escalation danni, HP, posizionamento |
| Esplorazione / scoperta | territori ignoti, rovine | rivelazione, prove di percezione, finestre |
| Diplomazia / interazione | trattare, convincere, reclutare | prove sociali, relazioni, prezzi |
| Preparazione / risorse | raccogliere, costruire, commerciare | costi, tempi, resa |

Due livelli distinti:

- **Meccanica della famiglia**: ciò che rende il tipo riconoscibile (per
  l'infiltrazione: una variabile allarme, la sorveglianza, il rumore).
- **Soluzioni compatibili**: skill, statistiche, oggetti e preparazioni
  che permettono di affrontarla diversamente (DEX nativo, CHA via
  camuffamento, INT via invisibilità — vedi canali, QUEST_RULES §7).

La famiglia **non determina una soluzione unica**: identifica un insieme
di meccaniche e possibilità compatibili. La stessa meccanica si riusa in
molte quest con ambientazioni e conseguenze diverse — è il corrispettivo
a monte del binomio domain kit/core gimmick del generatore interno.

Relazione con i contratti esistenti (da chiarire, OPEN-019): la famiglia
è un livello *sopra* core gimmick e domain kit? La ricerca R-154 propone
una formalizzazione: **famiglia = signature pressure** (variabile di
stato + come si muove + condizione di stop) — cioè una classe di core
gimmick. Criterio di validazione proposto (**swap test**): se scambi la
fiction e la strategia ottimale resta identica, è un reskin non una
famiglia.

**Transizione mid-run tra famiglie** (**ratificato**, Director
2026-10-11): una quest può **cambiare famiglia in corso** sullo stesso
ScenarioInstance — es. allarme al massimo in un'infiltrazione → la quest
diventa survival/combattimento mantenendo stato e flag. Le famiglie non
sono silos.

## 3. Tassonomia dei requisiti

I requisiti non sono solo «livello minimo» o «Forza ≥ 10»:

| Tipo | Significato |
|---|---|
| **Accesso assoluto** | senza la condizione la quest non è disponibile — riservato alle impossibilità effettive |
| **Capacità** | puoi affrontarla, ma servono competenze adeguate per buoni risultati |
| **Costo o rischio** | puoi tentare impreparato accettando conseguenze peggiori |
| **Ottimizzazione** | una preparazione che rende la quest più efficiente/vantaggiosa |

Corollari candidati:

- I **gate assoluti** si riservano alle impossibilità reali. Se manca un
  equipaggiamento e il mondo offre alternative (costruirlo, noleggiarlo,
  ottenerlo via quest o token), il requisito non è assoluto — è un nodo
  del grafo.
- **Preparazione insufficiente = tre casi**: (a) capacità indispensabile
  mancante → impossibile; (b) compensabile con risorse/preparazione →
  costo aggiuntivo; (c) partenza impreparata → accessibile con rischi
  peggiori (allarme, ferite, tempo perso, bottino compromesso).
- Il giocatore deve poter **scegliere di rischiare** sapendo almeno in
  termini generali a cosa va incontro — coerente con «numeri esatti in
  preview» (R-108) e «fascia di pericolosità dichiarata» (R-105).

**Stato del gate sulla offer card** (**ratificato**, Director
2026-10-11): ogni offerta mostra uno stato calcolato — `Locked` (con la
via di sblocco nominata), `Underprepared` (banda di rischio + cosa manca
+ prezzo), `Ready`, `Over-qualified` — e la **qualità dello scout report
dipende dal party/esploratore** (banda larga con poco intel, stretta con
tanto). Il gate è uno stato calcolato, non una proprietà binaria della
quest.

Aperto (OPEN-020): **la tassonomia resta proposal per scelta del
Director (2026-10-12)** — si valida col prototipo prima della ratifica.
Questione residue: quali requisiti sono generici, quali di famiglia,
quali di singola quest; come si dichiara il tipo nel contratto; bande
di rischio calibrate su esiti reali; prezzo underprepared proporzionale
al gap.

## 4. Ricompense che aprono porte

Una ricompensa interessante modifica **ciò che diventa possibile fare
dopo**, non solo un incremento numerico. Otto categorie candidate:

| Categoria | Cosa cambia |
|---|---|
| Accesso | sblocca luoghi, contatti, opportunità nuove |
| Informazione | rivela requisiti, pericoli, approcci alternativi |
| Mitigazione | riduce danni, rischio o conseguenze future |
| Eccezione | permette di ignorare una regola in una situazione compatibile |
| Conversione | trasforma una risorsa/capacità in un vantaggio diverso — **POSTICIPATA AL PLAYTEST** (decisione Director 2026-10-11: fragile senza ratio control, fuori dal v0) |
| Sinergia | rende più efficaci capacità già possedute |
| Investimento permanente | modifica una possibilità/regola anche nelle quest successive |
| Consumabile / contromisura | risposta circoscritta a una minaccia specifica |

Il grafo deve rappresentare anche queste relazioni: una ricompensa
«accesso» è un arco verso nuovi nodi; una «informazione» riduce il
rischio di nodi già noti; una «contromisura» abbassa il costo di un tipo
di minaccia.

## 5. Capacità che cambiano le regole

Acquisire una skill, uno spell o un oggetto può cambiare *come* si
affronta una quest, non solo *quanto bene*. Catalogo effetti candidati:

- aprire un approccio alternativo;
- ridurre o azzerare una particolare conseguenza;
- trasformare una prova in un'altra prova compatibile (↔ canali §7);
- rivelare informazioni prima nascoste;
- aggirare un requisito;
- modificare il funzionamento di una meccanica (es. accumulo allarme);
- rendere disponibili nuove quest o ricompense;
- **preparazione retroattiva** (**ratificato**, Director 2026-10-11):
  capacità di **alto tier** che permette di dichiarare retroattivamente
  una preparazione entro vincoli dichiarati («avevamo già corrotto
  quella guardia» — modello flashback di Blades in the Dark).

Distinzione da formalizzare (OPEN-019/020): capacità **generiche** vs
effetti validi solo su determinate **meccaniche** vs effetti specifici di
una **singola quest**. Il rischio da evitare è l'esplosione di eccezioni
artigianali non bilanciabili — il punto di attacco dichiarato è lo stesso
dei canali: le capacità agiscono su superfici dichiarate (var core, tipi
di requisito, categorie di effetto), non su casi singoli.

Una skill non rende necessariamente più forti: può rendere **possibili**
azioni che prima non esistevano.

## 6. L'esploratore come attore strategico

Regola vigente (QUEST_RULES §2): l'esplorazione rivela informazioni
secondarie — stat delle fasi, pericoli, sorveglianza; un esploratore più
capace rivela più dettagli.

Estensioni:

- **Orientamento** (**ratificato**, Director 2026-10-11/12): il
  giocatore privilegia famiglie o tag; la preferenza diventa un **bias
  di peso dichiarato e visibile** sulla distribuzione delle offerte
  (mai filtro duro) — controllo strategico senza eliminare l'incertezza
  né le opportunità concorrenti.
- **Niente valuta "intel"** (**ratificato**, Director 2026-10-12): la
  qualità delle informazioni dipende **solo dalla qualità del
  party/esploratore** (livello, ruolo, capacità) — non esiste una
  risorsa spendibile per comprare scout report più precisi. Conseguenza:
  la mitigazione "numeri esatti come acquisto intel" per OPEN-018 NON è
  disponibile; OPEN-018 resta da verificare al playtest di PLAN-028 con
  le mitigazioni già adottate (risk tag, stakes narrative, multi-canale
  solo su pivot).
- **Portata** (PROPOSAL): un sistema di esplorazione più sviluppato
  rivela più info sulle quest, fa emergere opportunità più difficili
  con ricompense maggiori e aumenta il numero di quest disponibili
  contemporanee.

Il generatore delle offerte dovrebbe considerare: quest disponibili
contemporaneamente, obiettivi a lungo termine, requisiti soddisfatti o
mancanti, ricompense necessarie a preparare missioni successive,
scadenze e finestre temporali, opportunità che competono per le stesse
risorse.

## 7. Il tempo: durata, scadenza, finestra

Tre concetti distinti (allinea e aggiunge a GENERATION_SPEC §8, che già
separa avanzamento/disponibilità/scadenza):

- **Durata**: quanto tempo occupa un'attività.
- **Scadenza**: entro quando va raggiunto un obiettivo.
- **Finestra di opportunità**: un intervallo in cui un'azione è
  particolarmente vantaggiosa o possibile — può aprirsi e chiudersi
  senza essere una scadenza dura.

Questo rende le quest **concorrenti**: prepararsi per una può significare
rinunciare a un'altra, ritardare un investimento o perdere una finestra —
stesso principio di «ignorare ≠ perdere reward» delle chain quest
(ARCHITECTURE §15): il mondo avanza comunque.

**Due clock distinti** (**ratificato**, Director 2026-10-11, modello
RimWorld): *acceptance timer* (tempo per accettare l'offerta) separato
da *completion timer* (tempo per completare la quest una volta
accettata) — commitment ed esecuzione sono vincoli diversi.

**Nota sul modello temporale**: il gioco è un gestionale a tempo
continuo **senza progressione offline** (posizionamento "second monitor",
decisione in `marketing/steam/claim-ledger.md`) — NON un idle game: a
gioco chiuso il tempo non avanza e le offerte non si accumulano in
assenza. La pressione temporale vive solo durante il gioco; regola
correlata dalla ricerca R-154: *decision rate < event rate* (più offerte
di quante fattibili, senza richiedere una decisione per ognuna).

**Palette di meccaniche riutilizzabili** (candidati al roster, non
matrice definitiva): countdown, livello di allerta, prove contrapposte
ripetute, instabilità, push-your-luck, risorse esauribili. Relazione col
roster gimmick esistente (`race`, `flood`, `meld`, hazard `mimic`) da
mappare.

## 8. Crescita del villaggio: tre dimensioni

La base non produce solo risorse: amplia progressivamente ciò che il
giocatore è in grado di fare. Tre dimensioni separate:

| Dimensione | Domanda | Leve (esempi) |
|---|---|---|
| **Visibilità** | quante opportunità conosci, quanto sai di esse | esploratore, informazioni, contatti |
| **Capacità** | quali quest puoi affrontare | skill, stat, equip, preparazioni |
| **Capacità operativa** | quante attività gestisci in parallelo | umani disponibili, leader, edifici |

Un edificio/sistema dedicato all'esploratore (candidato): rivela più
informazioni sulle quest, fa emergere opportunità più difficili con
ricompense maggiori, aumenta le quest disponibili contemporaneamente e —
a regime — permette più party in missione parallela.

**Vincolo di design**: la crescita non deve rendere ogni attività
successiva semplicemente più facile — più spedizioni portano XP e denaro
ma anche logoramento del gruppo e pressione gestionale (coerente con
human-days e leader-capacity, `QUEST_ECONOMY_NOTES.md`, OPEN-010).

**Capacità parallela** (**ratificato**, Director 2026-10-12): **solo
leader-capacity** — un party in missione richiede un leader; la
capacità parallela cresce solo reclutando/addestrando leader (e
svincolando specialisti/feriti), NON tramite slot arbitrari dagli
edifici. Più stringente del modello a 3 layer proposto dalla ricerca:
gli edifici supportano (infermeria → feriti recuperano, ecc.) ma non
concedono spedizioni.

## 9. Architettura delle risorse

Candidato anti-moltiplicazione delle valute:

- **risorse comuni**, utili a più attività;
- **specializzazioni permanenti** dei personaggi;
- ~~una risorsa trasversale limitata legata all'informazione operativa~~
  **RESPINTO dal Director (2026-10-12)**: nessuna valuta "intel" — la
  qualità dell'informazione vive nella qualità dell'esploratore/party
  (§6). L'obiettivo anti-moltiplicazione delle valute resta valido, ma
  si raggiunge senza risorsa dedicata all'informazione.

Aperto (OPEN-021): come rappresentare economicamente il costo di
preparazione senza rendere le risorse troppo intercambiabili — la
forma della risorsa informativa è decisa (non esiste), resta da
definire il costo economico di preparazione/scouting.

## 10. Memoria delle conseguenze

Non duplicato qui — già tracciato:

- Regola vigente: conseguenze sempre (risolte, come risolte, non risolte)
  — QUEST_RULES §8, R-092, implementazione parziale PLAN-019-S2.5.
- Memoria narrativa su livelli (personaggi, relazioni, fazioni, mondo):
  OPEN-016, R-093, `NARRATIVE.md` §4, `context/ingestions/2026-10-07-registro-narrativo-del-mondo.md`.
- Trigger/forme delle conseguenze da mancata risoluzione: OPEN-015.

Il layer opportunità vi si aggancia: le conseguenze persistenti sono ciò
che *scrive* nuovi archi nel grafo (un prigioniero lasciato = nodo nuovo;
un rivale = modificatore di nodi futuri).

## 11. Perimetro del primo test

Candidato: **senza combattimento**, per verificare la struttura delle
opportunità senza confonderla con le complessità del combat system.

Deve permettere di verificare:

- i requisiti determinano correttamente accesso, rischio ed efficienza;
- esistono più modi **leggibili** di soddisfare uno stesso requisito;
- skill e ricompense aprono possibilità effettivamente diverse;
- l'esploratore può essere orientato verso determinate famiglie;
- le quest generano opportunità future senza produrre una sequenza
  rigida;
- scadenze e attività concorrenti producono decisioni strategiche.

Setup proposto: 3 famiglie (stealth, combattimento, esplorazione) × 3
livelli di difficoltà; statistiche già esistenti; requisiti configurabili;
ricompense inizialmente **fisse e configurabili** (niente incrementi
diretti alle stat nella prima prova — coerente con «il balancer non si
tocca», QUEST_RULES §7); preferenza dell'esploratore e casualità pesata.

Obiettivo: validare il controllo sulla generazione e sulle relazioni tra
quest prima di aggiungere combinazioni complesse. Posizione candidata:
piano successivo a PLAN-028 (canali) nel filone PLAN-026 (generazione).

## 12. Questioni aperte

- **OPEN-019** — modello del grafo delle opportunità: struttura dati,
  tipi di arco (sblocco/informazione/preparazione), persistenza,
  generazione pesata, rapporto famiglia↔(domain kit, core gimmick).
- **OPEN-020** — tassonomia requisiti e preparazione insufficiente:
  scope generico/famiglia/quest, regole dei gate, dichiarazione nei
  contratti.
- **OPEN-021** — orientamento esploratore e risorsa informativa
  trasversale: meccanismo di pesatura, forma economica, legame con
  capacità operative del villaggio.

## 13. Relazioni con il materiale esistente

| Concetto qui | Dove vive già |
|---|---|
| Approcci multipli / canali | QUEST_RULES §7 `vigente`; CONTRACTS §11.9; PLAN-028; ARCHITECTURE §16 |
| Conseguenze universali | QUEST_RULES §8 `vigente`; OPEN-015/016; PLAN-019-S2.5 |
| Archi narrativi | GENERATION_SPEC §8; ARCHITECTURE §15 (R-113) |
| Tempo (avanzamento/disponibilità/scadenza) | GENERATION_SPEC §8 «Tempo e omissioni» — qui si aggiunge la «finestra» |
| Esploratore rivela info | QUEST_RULES §2 `vigente` — qui si aggiunge l'orientamento |
| Quest come opportunità / human-days / leader-capacity | QUEST_ECONOMY_NOTES (OPEN-010/012/013); VILLAGE_ECONOMY.md |
| Generatore interno (gimmick/scene/twist/testo) | QUEST_GENERATION_SPEC.md + CONTRACTS.md + ARCHITECTURE.md |
| Preview a numeri esatti | R-108 `frozen`; OPEN-018 |

<!-- ===== repo-snapshot/QUEST_RULES.md ===== -->

---
title: Quest Rules — regole vigenti
type: canonical
updated: 2026-10-10
plan: PLAN-020
---

# QUEST_RULES — regole correnti di risoluzione delle quest

Fonte unica per «quali sono le regole quest attuali?». Compila i riferimenti —
non riscrive le desiderata FROZEN. `GAMEPLAY_DESIGN.md` resta la **visione**;
questo documento registra le **regole vigenti**.

Ogni regola ha: RULE · STATUS · SOURCE · (DECISION/RATIONALE dove serve).

Legenda STATUS:
- `vigente` — regola ratificata (desiderata FROZEN / decisione registrata)
- `mock-S1` — parametro di laboratorio S1, da calibrare al Gate A
- `divergenza-nota` — design e implementazione divergono, dichiarato e non
  risolto (vedi `context/OPEN.md`)
- `proposta` — idea candidata non ancora ratificata (NON è una regola)

Manutenzione (PLAN-020): quando il Director esprime una regola nuova o diversa,
questo doc va aggiornato nella stessa sessione; divergenza da FROZEN → domanda
al Director, non assorbimento silenzioso.

---

## 1. Struttura della quest

- **RULE:** la quest è una catena `PARTY → QUEST → PHASE → SITUATION →
  APPROACH → CHECK/CHOICE → CONSEQUENCE → NEXT PHASE`.
  **STATUS:** `vigente`. **SOURCE:** `plans/PLAN-019-quest-macro-plan.md`;
  `context/QUEST_S1_DESIGN.md` (copia tracciata di `.mw/runs/20261002-s1-quest-design/quest-design.md`).
- **RULE:** struttura di riferimento S1: viaggio → scelta approccio → evento →
  scoperta/lore → ulteriore evento/ricompensa → obiettivo → ritorno. La scelta
  d'approccio determina quale competenza è rilevante nella fase successiva.
  **STATUS:** `vigente`. **SOURCE:** `.mw/desiderata.md` v24 rev.1 p.1
  (sostituisce la lettura «spedizione goblin» — `context/REJECTED.md` REJ-003).
- **RULE:** la quest di riferimento S1 è «La cassa delle sementi», in un lab
  isolato. «Le Rovine sotto il Fiume» è una seconda quest authored del lab,
  non un rimpiazzo dello scenario S1.
  **STATUS:** `vigente`. **SOURCE:** `plans/PLAN-019-S1-quest-interessante.md`;
  `RICHIESTE.md` R-083.
- **RULE:** criterio S1 — *«nn ci interessa che funzioni, deve essere
  divertente»*. Le meccaniche sono strumenti di tensione valutati al Gate sul
  momento drammatico prodotto, non sulla correttezza.
  **STATUS:** `vigente` (criterio di valutazione, non meccanica).
  **SOURCE:** `context/DECISION_LOG.md` 2026-10-02; desiderata v24.

## 2. Party, slot e informazione

- **RULE:** il **leader** è uno slot speciale di spedizione, scelto dal
  giocatore; nella matrice S1 è slot fisso della quest.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.2; `context/QUEST_S1_DESIGN.md`.
- **RULE:** esistono ingredienti/slot **obbligatori** e **secondari**; la
  preparazione secondaria è facoltativa.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-10-01; DESIGN_PILLARS
  Pillar 3.
- **RULE:** la stat primaria della quest è sempre rivelata; esplorazione/
  esploratore rivela informazioni secondarie (stat secondarie delle fasi,
  pericoli, sorveglianza, presenze). Un esploratore più capace rivela più
  dettagli.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-10-01; v24 rev.2.
- **RULE:** la cavalcatura occupa uno slot equip — velocità = trade-off
  meccanico, non free lunch.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-09-29; v23 rev.3.

## 3. Skill check e rischio

- **RULE:** il modello di rischio è **per-fase, esteso per residente**: ogni
  fase produce chance di ferita/morte per ciascun membro (rischio base fase +
  `residentRiskModifiers` dello slot + contributi loadout).
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-09-29 (opzione A
  Director); PLAN-018.
  **DECISION:** `resolvePartyConsequences` non è più la fonte delle
  conseguenze — il planner mostra il rischio che accadrà davvero.
- **RULE:** lo skill check può essere sforzo di gruppo presentato come un solo
  tiro: il verdetto è del gruppo, ferita/morte sono tirate **per slot**
  separatamente. Il verdetto modifica le chance **prima** dei tiri personali:
  `win` −5pp a morte e ferita; `fail`/`almost` neutri; `bigwin` downgrade
  morte→ferita; `epicfail` upgrade ferita→morte.
  **STATUS:** `vigente` (struttura) / `mock-S1` (quantità — OPEN-007).
  **SOURCE:** v24 rev.2; `context/QUEST_S1_DESIGN.md`.
- **RULE:** `epicfail` opera **dentro la banda di rischio dichiarata** per quel
  check (può portare ferita→morte solo dove M%>0 era visibile al commit) — mai
  oltre la banda. La scelta definisce il range, il dado modula dentro.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-10-03. Da formalizzare
  come check-contract spec in S2.
- **RULE:** `almost` NON conta come fase superata: `isPassingVerdict` =
  `bigwin | win`; il near-miss resta narrativo.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-09-29; v23 rev.3.
- **RULE:** solo il **morto** smette di contribuire alle fasi successive; il
  **ferito** resta nella spedizione, contribuisce normalmente e continua a
  tirare rischi con rischio aumentato.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-09-29 («solo morto»);
  `context/QUEST_S1_DESIGN.md` (ferita = +rischio nei check successivi).
- **RULE:** il motore analitico del planner è **DP esatta sull'insieme dei
  vivi** (2^m insiemi × n fasi) — non Poisson-binomiale su probabilità fisse
  (`context/REJECTED.md` REJ-006). Monte Carlo = verifica secondaria con
  tolleranza.
  **STATUS:** `vigente` come contratto planner; la preview compound è aperta
  (OPEN-008). **SOURCE:** DECISION_LOG 2026-09-29.
- **RULE:** meccanica **cover**: slot/item/tag possono dichiarare
  `coverRiskDelta` (pp negativi) che riduce il rischio degli altri membri.
  **STATUS:** `vigente`. **SOURCE:** v23 rev.4 D1.
- **RULE:** `checkStatTags` separati dal gate + `partyStatMult` in
  `questSkillCheckConfig`.
  **STATUS:** `vigente`. **SOURCE:** v23 rev.4 D4.
- **RULE:** i **consumabili** formano un pool di party, applicati a ogni
  check, consumati al lancio. Nel total della simulation preview i
  consumabili sono ignorati (OPEN-008).
  **STATUS:** `vigente`. **SOURCE:** v23 rev.4 D3; DECISION_LOG 2026-09-30.
- **RULE — Check nascosti e rivelazione post-esito:** un check può essere
  **nascosto** mentre avviene (es. percezione su una minaccia mimetica,
  una trappola, un inganno). Se il check fallisce e produce un evento
  imprevisto (danno, combattimento extra, deviazione), il fallimento e
  l'oggetto del check **vengono rivelati al giocatore nel momento
  dell'effetto** — «hai fallito un check di X» è parte dell'esito, non un
  dettaglio soppresso. Il nascosto vale solo *prima*: il *perché* delle
  cose non è mai nascosto *dopo*.
  **STATUS:** `vigente` (principio espresso dal Director).
  **SOURCE:** Director 2026-10-11 (R-151). Collega P6/P13/P36
  (attribuzione), le clausole di equità dei twist (trigger leggibili /
  indizi) e la regola preview-vs-twist-nascosti (CONTRACTS §14).

## 4. Bodyguard e death save

- **RULE:** lo slot opzionale `bodyguard` intercetta **solo** esiti
  ferita/morte generati dagli skill check — non eventi, spell, combattimenti o
  incidenti diretti di viaggio. Finché vivo intercetta tutto il danno da check
  (matrice S1: anche da ferito, anche su danni multipli).
  **STATUS:** `vigente`. **SOURCE:** v24 rev.2; `context/QUEST_S1_DESIGN.md`.
- **RULE:** su esito morte, un **death save** del 5% trasforma l'esito in
  «sopravvive ferito».
  **STATUS:** `mock-S1` — da calibrare al Gate A (OPEN-006).
  **SOURCE:** `context/QUEST_S1_DESIGN.md`; DECISION_LOG 2026-10-02.
- **RULE — Targeting posizionale a cascata:** gli esiti pericolosi (morte,
  ferita) e i danni extra di check e turni di combattimento si assegnano con
  **un tiro sugli slot occupati**; il profilo è posizionale — il rischio sta
  in coda: 1 PG → S1 100%; 2 → 20/80; 3 → 0/20/80; 4 → 0/0/20/80. Quando un
  PG muore gli slot scalano e il profilo si ricalcola sugli occupati. Lo
  stesso tiro vale per ogni evento pericoloso (un solo concetto, nessuna
  probabilità separata di «sudden death»: l'eroe davanti vale 0 finché
  qualcuno è dietro, da solo vale 100). In combattimento **escalation**:
  T1 `0/0/20/80` → T2 `0/5/25/70` → T3+ `5/10/25/60` stabile (S4 −10%/turno,
  ridistribuito ai primi slot) — **valori placeholder**, calibrazione ancora
  da fare (Director 2026-10-06).
- **RULE — Combattimento (fase dedicata):** il danno arriva in colpi discreti
  per turno — 1 colpo a T1–T2, **2 colpi da T3 in poi**, mai due volte sullo
  stesso bersaglio nello stesso turno. **Nessuna morte secca nella fase di
  combattimento**: il profilo escalation distribuisce solo danno/ferita.
  **STATUS:** `vigente`. **SOURCE:** Director 2026-10-06
  (`quest_sterminio_goblin_spec.md` F4).
- **RULE — Consumabili:** usabili **solo prima di uno skill check o di una
  scelta** (mai in azione libera).
  **STATUS:** `vigente`. **SOURCE:** Director 2026-10-06.
- **RULE — Reward a doppio livello:** **XP sempre assegnata**; il trofeo
  dell'obiettivo si converte in reward reale (es. Gold) **solo al ritorno in
  città**. Abbandonare il trofeo = quest persa, nessun reward materiale.
  **STATUS:** `vigente`. **SOURCE:** Director 2026-10-06.
- **RULE — HP dei PG:** i membri del party hanno un pool HP (mock: eroe
  100, altri 60); in produzione gli HP sono ereditati dalle stat reali del
  PG assegnato. Il danno di check/combattimento consuma HP.
  **STATUS:** `vigente` per la quest goblin; mappatura stat→HP `open`.
  **SOURCE:** Director 2026-10-06.

## 5. Checkpoint, fuga e wipe

- **RULE:** il punto decisionale continua/ritirati sta **prima di ogni skill
  check rischioso** — non dopo ogni fase; conta «fase che può avere
  conseguenze di ferita, morte o perdita di HP».
  **STATUS:** `vigente`. **SOURCE:** v24 rev.1 p.6/p.9 (conferma Director);
  v23 rev.4 D2.
- **RULE:** fuga/ritirata = fallimento della quest, **ma il bottino raccolto
  resta**. Dopo l'obiettivo, «continua ad esplorare» espone le vite a rischio
  ma non perde l'acquisito; la regola leader-morto resta attiva.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.1 p.11; rev.2; `context/QUEST_S1_DESIGN.md`;
  confermata 2026-10-10 — «fuga = missione fallita» sempre: chi fugge lascia
  l'obiettivo sul campo (motore: `dropObjective` prima del terminale), quindi
  nessuna reward anche se la prova-obiettivo era riuscita. La lettura
  «fuga+obiettivo → reward» è decaduta.
  Danni extra in fuga: `open` (OPEN-009).
- **RULE:** wipe = tutti i membri morti → chiusura forzata `deadly`, **si
  perde tutto** (bottino incluso).
  **STATUS:** `vigente`. **SOURCE:** `context/QUEST_S1_DESIGN.md`; v23 rev.4 D2.
- **RULE:** la morte di un PG è **spesa di una risorsa PG** — scambiare
  risorse con risorse è parte del genere strategico.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-10-01 (supera la riga
  «nessuna perdita definitiva» di Pillar 2, aggiornato).

## 6. Vittoria e reward

- **RULE:** la reward di quest è assegnata da una **prova-obiettivo precisa**
  e richiede il **leader vivo al ritorno** — anche se la prova-obiettivo era
  già riuscita. Bottino di fase e reward di quest sono categorie distinte:
  l'acquisito si tiene, le fasi vinte possono dare extra.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.2; DECISION_LOG 2026-10-02.
  **DECISION:** sostituisce la soglia ≥50% come condizione di vittoria
  (REJ-002); sconfitta (fuga/obiettivo fallito) = nessuna reward di quest.
- **RULE:** la «% di riuscita» **dalla partenza** è compound: include rischi e
  percorsi prima dell'obiettivo, non solo la probabilità della prova finale.
  Nessun numero esatto inventato dove manca il modello.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.2.
- **RULE / DIVERGENZA:** PLAN-018 implementa il calcolo a **soglia** e non è
  stato modificato automaticamente da rev.2 — la rimappatura è prevista dopo
  S1.
  **STATUS:** `divergenza-nota` — non risolta qui (OPEN-001).
  **SOURCE:** `plans/PLAN-018-mission-planner.md`; v24 rev.2 «relazione»;
  KNOWLEDGE_AUDIT C7.

## 7. Stat e competenze

- **RULE:** le stat `strength`/`agility`/`endurance`/`intelligence`/
  `perception` in `idleVillage/defaultConfig.ts` sono **mock**: la fonte di
  verità sono le stat del balancer (`balancer-default-config.json`,
  `STAT_DESCRIPTORS`). Il balancer non si tocca.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.1 p.12–13; DECISION_LOG
  2026-10-01.
- **RULE:** le competenze di quest sono **derivate** dalle stat del balancer
  (Percezione ← `txc`, Forza ← `damage`, Costituzione ← `hp`, …).
  **STATUS:** `vigente` come direzione; mappatura completa `open` (OPEN-003).
  **SOURCE:** v24 rev.1 p.13.
- **RULE — Canali alternativi sui check della core gimmick:** una core
  gimmick (es. infiltrazione/allarme che sale) risolvibile normalmente su
  una stat può ammettere **canali di check alternativi** su stat/skill
  diverse — es. invisibilità → Intelligenza, camuffamento → Carisma al
  posto di Destrezza. La sostituzione riguarda **solo i check che muovono
  la variabile core** («ogni tiro che dovrebbe far aumentare l'alarm»):
  i check non-core della stessa quest restano sulle stat native.
  **Modello di binding (adottato):** lock di approccio a run-level,
  capability-gated dal party, con eccezioni a consumo per singoli check
  (exception budget ~1/run); roll per **membro nominato** (mai
  best-of-party); max **3 canali** per check; menu multi-canale solo sui
  **pivot check** (~20-30% dei check core), routine check sul canale del
  lock; canali bloccati **greyed con «Requires: …»**; divergenza dei
  **profili di fallimento** per canale obbligatoria (non solo DC diversa).
  **STATUS:** `vigente` — adottata su delega Director 2026-10-11
  («fai cm reputi meglio», R-134) a valle della ricerca R-128;
  reversibile al playtest del prototipo v0 (PLAN-028).
  **SOURCE:** `context/ingestions/2026-10-10-quest-gimmick-approcci-alternativi.md`;
  R-127/R-128/R-134; `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md`;
  dettaglio in `context/QUEST_GENERATION_ARCHITECTURE.md` §16.

## 7b. Coerenza della minaccia (quest authoring/generazione)

- **RULE:** il **tipo di minaccia** della quest deve essere correlato a
  **chi può essere minacciato** dall'antagonista — la vittima/indizio del
  briefing (F0) deve essere qualcuno che quella minaccia colpirebbe
  davvero. Es. goblin sulle strade → carri mercantili, viaggiatori,
  confini del villaggio; *non* chi vive dentro le mura e non viaggia.
  Il principio governa anche la direzione della generazione futura: la
  minaccia sceglie la vittima credibile, e la vittima scelta vincola
  dove la quest può accadere.
  **STATUS:** `vigente` come principio espresso dal Director.
  **SOURCE:** Director 2026-10-08 — applicato in F0 goblin (consiglio del
  villaggio → bosco infestato dai goblin, coerente con l'agguato F7 dei
  superstiti nel bosco). Nella nota originale comparivano mugnaio/carri
  al guado — fiction revocata dal Director 2026-10-18 (manoscritto v3:
  niente guado, niente strada dei mercanti).

## 8. Conseguenze oltre l'esito immediato

- **RULE:** tutte le quest devono avere conseguenze se vengono risolte, in base a **come** vengono risolte, e anche se **non** vengono risolte — quest'ultima parte **si applica normalmente**: un'offerta non presa/scaduta o una missione non risolta produce conseguenze come una risolta (Director 2026-10-10).
  **STATUS:** `vigente` come regola piena; `implementato (parziale)` sul runtime — conseguenze sulle quest TERMINATE attive dal 2026-10-10 (PLAN-019-S2.5): settlement idempotente su `/game` applica morte/ferita (con `injuredUntilTick` + recovery sweep), reward/bottino/XP e rilascio party come dati persistiti una sola volta (journal per-effetto, ledger co-locato). Da implementare: forma e trigger delle conseguenze da **mancata risoluzione** (scadenza offerta, offerta ignorata) — scope di un piano successivo; memoria narrativa resta OPEN-016 → S4.
  **SOURCE:** Director 2026-10-07, verbatim in `RICHIESTE.md` R-092; `.mw/desiderata.md` v24 S1–S4; conferma Director 2026-10-10 (DECISION_LOG); implementazione in `src/ui/idleVillage/quests/questSettlement.ts` + tabella transizioni in `plans/PLAN-019-S2.5-settlement-e2e.md`.

## 8b. Offerte quest sulla mappa (POI lifecycle e reveal)

- **RULE — Lifecycle dell'offerta (POI):** una quest POI è **one-shot di
  default** — quando il rapporto di una run ended+settled viene chiuso, il
  POI viene **consumato** (`consumedPoiIds`, persistito): lascia la mappa e
  non torna più, anche dopo reload. Un POI con `repeatable: true` authored
  in config non viene mai consumato: alla chiusura del rapporto la run si
  sgancia e l'offerta torna `available`, rilanciabile, finché la finestra
  `[availableFromDay, availableUntilDay)` resta aperta. Un flag `repeatable`
  aggiunto dopo ignora anche un eventuale record consumato stantio
  (migrazione onesta). Attualmente: `poi-goblin` è `repeatable` (caccia
  ripetibile), `poi-rovine` resta one-shot.
  **STATUS:** `vigente`. **SOURCE:** D-S4-6 (PLAN-019-S4 T-3) + Director
  2026-10-15 (R-200); implementazione `questPois.ts`
  (`repeatable`/`poiConsumesOnReportClose`/`isPoiConsumed`) + consumo in
  `src/pages/game-frame-pixi.tsx`.
- **RULE — Reveal delle offerte su `/game`:** i POI quest **compaiono da
  soli** all'apertura della pagina, uno alla volta sfalsati su wall-clock
  (`gameFrameConfig.questReveal`: primo ingresso `initialDelayMs` dopo
  l'uscita del boot veil, poi uno ogni `staggerMs`, default 1s/5s, ordine
  authored `QUEST_POIS`). Il reveal è **monotono**: ciò che è apparso non
  scompare per il reveal (l'uscita resta possibile solo per il lifecycle —
  offerta scaduta senza run, POI one-shot consumato). Il pulsante Director
  «Show quest» è un trigger **one-way** «reveal ora» che salta la coda;
  «Reset» ri-arma lo stagger per un nuovo take. Una run attiva monta il
  proprio POI senza attendere lo stagger.
  **STATUS:** `vigente`. **SOURCE:** Director 2026-10-15 (R-200); supera
  R-124 («nessun POI al boot»).

## 9. Parcheggiato / non-regole

- **Noise meter:** parcheggiato — stealth-specific, non regola generica
  (REJ-001). Rimosso dal lab il 2026-10-03 (stati nominati
  `campoAllertato`/`campoSveglio`, commit `f7a55a73`).
- **Proposte villaggio** (leader-capacity, human-days, quest come
  opportunità): `proposta` — non ratificate, tracciate in OPEN-010 e R-083.
- **Proposte layer opportunità** (2026-10-11, discussione Director↔GPT):
  tassonomia requisiti a 4 tipi (accesso assoluto / capacità /
  costo-o-rischio / ottimizzazione), gate assoluti solo per impossibilità
  effettive, preparazione insufficiente in 3 casi (impossibile /
  compensabile a costo / tentabile a rischio), ricompense che aprono
  porte (8 categorie), esploratore orientabile sulla generazione.
  `proposta` — non ratificate, tracciate in
  `context/QUEST_OPPORTUNITY_LAYER.md` e OPEN-019/020/021.
- **Proposte macro campagna** (2026-10-16, sintesi Director di una
  discussione di design): ciclo di campagna come crisi crescente a ondate
  con doppio obiettivo (resistere + sconfiggere), difese passive
  contenitive non risolutive, valore delle ricompense dipendente dal
  momento, quattro famiglie di ricompense (capacità quest / economia /
  combattimento party / infrastrutture), skill a **livelli di
  applicazione**, livelli delle quest con requisiti crescenti.
  `proposta` — non ratificate, nessun numero definito; tracciate in
  `context/QUEST_CAMPAIGN_MACRO.md` e OPEN-022.
- **Criterio di diagnosi:** *«una quest infallibile è inutile; le scelte non
  sono scelte se non posso mai fallire»* — losabilità e attribuibilità del
  fallimento sono il requisito, non una percentuale target.
  **STATUS:** `vigente` (principio). **SOURCE:** DECISION_LOG 2026-10-03.

---

*Manutenzione: divergenza PLAN-018 ↔ v24 rev.2 (OPEN-001) da risolvere con
decisione Director in sessione gameplay, non in questo doc.*

<!-- ===== repo-snapshot/QUEST_S1_DESIGN.md ===== -->

---
title: Quest S1 Design Matrix — «La cassa delle sementi»
type: design-knowledge
status: vigente (contenuti confermati dal Director 2026-10-02; parametri numerici = mock da calibrare al Gate A)
updated: 2026-10-05
provenance: copia tracciata di `.mw/runs/20261002-s1-quest-design/quest-design.md` (gitignored) — il contenuto è identico; questa copia è il riferimento stabile citato da QUEST_RULES.md
---

> **Provenance:** documento di design del lab S1, contenuti confermati dal
> Director il 2026-10-02. Originale in `.mw/runs/20261002-s1-quest-design/`
> (non tracciato). Le **regole vigenti** derivate sono compilate in
> `QUEST_RULES.md`; questo file conserva la matrice completa e il razionale.

---

# La cassa delle sementi — matrice

Contenuti della bozza AI **confermati dal Director**: goblin, torre, Passo del Corvo,
mercante ambulante, prigioniero in gabbia, simbolo del corvo, lettera (seme narrativo).

## Regole fissate dal Director (2026-10-02)

- **Leader** = **slot fisso della quest** (primo slot obbligatorio); il giocatore sceglie solo
  chi ci mette. Leader morto → reward di quest persa, anche a obiettivo ottenuto.
- **Ferita** = il PG ferito ha **rischio di ferita/morte aumentato nei check successivi**.
  Resta in spedizione, partecipa. HP separati (valori in lab).
- **Board wipe** = **tutti i PG morti**. Nessun trigger speciale: il wipe emerge quando i
  rischi per slot si sommano male.
- **Fonte di danno non-check** = **incidente in viaggio** (es. frana/caduta sul Passo):
  ferita diretta a uno slot, il bodyguard NON può intercettarla → il confine del bodyguard
  è osservabile in gioco.
- **Bodyguard** = slot opzionale; intercetta **tutti** gli esiti di ferita/morte da skill
  check destinati agli slot protetti, **finché è vivo** (ferito continua a intercettare).
  Solo danni da skill check.
- **Verdetti → rischi per slot** (pre-roll): `win` −5pp ferita+morte; `fail`/`almost` neutri;
  `bigwin` = −5pp **cumulati** + downgrade morte→ferita; `epicfail` upgrade ferita→morte.
  Quantità dello spostamento critico = parametro da bilanciare nel lab. In S1 la meccanica si
  chiama «modificatore di verdetto» — **nessuna keyword** (si decide in S2).
- **«Continua ad esplorare»**: se dopo la prova-obiettivo prosegui e poi fuggi/muori,
  **non perdi niente** (bottino e reward tenuti). Il rischio della scelta è solo la vita
  dei PG — la regola «leader morto = reward persa» resta sempre attiva.
- **Wipe** (tutti i PG morti) = **si perde tutto**: bottino, reward, PG.
- **Death save**: implementato. Su un esito di morte, il PG ha un **tiro del 5%** per
  sopravvivere come ferito. Valore di mock, si calibra al Gate.
- **Preset**: 4 — fisico / percettivo-intellettivo / ibrido / **con bodyguard** (party ridotto
  in stat ma con slot dedicato, per sentire il sacrificio).
- **Mercante**: pozione cura / fumogeno infiltrazione / corda arrampicata — confermati.
- **Prigioniero in gabbia**: confermato (liberarlo = check, ricompensa al ritorno).

## Nodi

| # | Nodo | Tipo | Stat | Rischio (per slot) | Fallimento → prosecuzione | Successo → |
|---|---|---|---|---|---|---|
| 0 | Partenza | setup | — | — | — | preset + gold + PG nello slot leader |
| 1 | Viaggio — mercante | scelta | — | — | non comprare = nessun effetto | oggetto + voce sul simbolo |
| 1b | Incidente di viaggio | evento diretto | — | ferita a uno slot | ferita = +rischio nei check seguenti; bodyguard non intercetta | — |
| 2 | Esplorazione | check rischioso (CP prima) | Perc / Perc+Int / For+Cos+Perc | solo approccio C: ferita/HP | info minime; con C possibile allarme → nodo 5 più difficile | info parziali/complete |
| 3 | Conseguenza | info | — | — | — | rivela pattuglia / turni / porta laterale / creatura |
| 4 | Scelta di approccio | scelta | — | — | — | decide la stat del nodo 5 |
| 5 | Evento | check rischioso (CP) | Agi / Car / Car+Int / For+Cos | ferita o morte per slot | allarme attivo → nodi 6-9 più difficili; si prosegue comunque | passaggio pulito |
| 6 | Nuova esplorazione | check | Perc+Int | nessuno se allarme spento; ferita se allarme | cassa non localizzata → riprova con difficoltà↑ o rinuncia | trovi cassa + lore |
| 7 | Scoperta/lore | info | — | — | — | simbolo del corvo, lettera |
| 8 | Prigioniero (opzionale) | scelta → check | For o Agi | allarme | prigioniero non liberato; allarme possibile | nuovo residente al ritorno + gold |
| 9 | **Prova-obiettivo** | check rischioso (CP) | Agi+Cos | ferita/morte | **obiettivo perso** → quest fallita (bottino resta) | cassa ottenuta |
| 9b | Continua ad esplorare? | scelta | — | riapre rischio su nodi extra | fuga dopo = niente perso (leader vivo a parte) | bottino extra |
| 10 | Ritorno | esito | — | — | — | reward se cassa + leader vivo |

## Parametri di mock (valori iniziali ragionevoli — si bilanciano nel lab)

| Parametro | Valore mock |
|---|---|
| Rischi base check rischioso | ferita 15% / morte 3% per slot |
| Approccio C esplorazione (arrampicata) | ferita 20% / morte 3% |
| Nodo 5 con allarme / nodo 9 | ferita 20% / morte 5% |
| Scontro astratto (forza bruta / allarme) | ferita 25% / morte 8% |
| Slot bodyguard (rischio proprio) | ferita 25% / morte 8% |
| Slot leader | ferita 10% / morte 2% (il bodyguard intercetta prima) |
| Ferito → check successivi | +5pp ferita e morte |
| `win` | −5pp ferita e morte |
| `bigwin` | −5pp + tutta la chance di morte spostata su ferita |
| `epicfail` | tutta la chance di ferita spostata su morte |
| Death save | 5% su esito morte → sopravvive ferito |
| Gold iniziale / prezzi mercante | 20 gold; pozione 10 / fumogeno 6 / corda 6 |
| Incidente di viaggio (non-check) | ferita a uno slot casuale, 25% di accadere |

## Cosa resta aperto

Nessuna decisione di contenuto. I valori sopra sono mock di partenza — il Director li ritocca
nel playtest. Death save al 5% è un mock anch'esso: al Gate si valuta se crea il momento
«forse ce la fa» o è solo rumore statistico.

## Cosa resta da osservare al Gate A

- Il bodyguard produce il sacrificio leggibile o è tassa obbligata/rumore?
- Il modificatore di verdetto si *sente* («bigwin = scampata per miracolo»)?
- «Continua ad esplorare» crea tensione anche se si rischiano solo vite?
- L'incidente di viaggio rende chiaro il confine check/non-check?

<!-- ===== repo-snapshot/QUEST_V6_REDESIGN.md ===== -->

---
title: Quest v6 — redesign «La cassa delle sementi» (TAKEN≠SECURED)
type: design-knowledge
status: PROPOSAL — nucleo TAKEN≠SECURED coerente con regole vigenti (QUEST_RULES §5, ingestion E-07); redesign completo non ratificato
updated: 2026-10-05
provenance: copia tracciata di `.mw/runs/20261003-quest-v6-science/quest-v6.md` (gitignored); evidence correlate nella stessa dir (`playtest-seed1983.md`, `critique-consolidated.md`)
---

# Quest v6 — "La cassa delle sementi" riscritta sulle evidenze

Design proposal guidata da `context/QUEST_GAMEPLAY_SCIENCE.md` (P1–P35).
Ogni scelta strutturale è taggata col principio scientifico che la motiva.

Vincoli rispettati: niente Noise nel prototipo; epicfail opera dentro la
banda di rischio dichiarata; morte solo dove M%>0 visibile; bodyguard
intercetta solo da skill check; death save 5%; wipe = perdi tutto;
reward = prova obiettivo + leader vivo al ritorno.

## L'idea in una frase

**TAKEN ≠ SECURED.** La cassa in mano non è vinta: è una posta fisica
sul tavolo che può ancora essere persa. La quest smette di essere una
sequenza di check e diventa un *heist con estrazione*: tutto ciò che
fai prima modifica la forma della fuga; la fuga è dove si vince o si
perde davvero.

Questo è il singolo cambiamento che crea la posta accumulata (P4) e il
reference point "potrei portarmela a casa" (P17) senza aggiungere un
sistema: è uno *stato*, non un meter.

## La catena causale (il contratto)

```
informazione → scelta → rischio → conseguenza → problema nuovo → scelta
                                                  │
OBIETTIVO PRESO → NON SICURO → EXTRACTION → SECURE / LOSE
```

Fail taxonomy (P14): ogni check fallito produce uno di
`minor` (risorsa/opportunità) · `strategic` (route/reward chiusa) ·
`quest` (obiettivo perso → ritirata) · `character` (ferita/morte su banda
dichiarata) · `catastrophic` (wipe). Mai "−1 ferita e tutto uguale" (P5).

## Fase per fase

### F0 · Party — "di chi ti fidi"

- Il giocatore *sceglie personalmente* i 3 membri dal roster/preset.
  **Perché**: l'attachment nasce dalla selezione personale e dall'uso,
  non dal nome (P15, Lewis/Weber/Bowman 2008; Burgess & Jones 2020).
  Se il PG muore deve avere una storia con te, anche di 3 minuti.
- Stats dichiarate: primaria AGI+PER, secondaria STR/CHA **ora visibili**
  — il piano richiede di sapere cosa serve (P24).
- Per-slot risk leggibile prima di partire: *chi rischia cosa*.

### F1 · Mercante — dilemma fictionale

- 3 oggetti, budget per 2. Effetti come **verbi**, non numeri
  (P24, P3): fumogeno = "attraversi un momento senza essere visti";
  corda = "apri la gabbia / cali dalla breccia"; pozione = cura.
- Ogni oggetto compra una *opzione futura*, quindi la scelta è un'ipotesi
  sulla run che stai per fare — non risolvibile a EV (P3, Sylvester).

### F2 · Viaggio — la lezione a posta bassa

- La frana diventa scelta: **via veloce** (check AGI leggero; fail =
  ferita su uno slot — dichiarato) vs **via lunga** (costo concreto:
  la pattuglia è già passata → meno intel all'avvistamento).
- **Perché**: prima catena decisione→conseguenza→stato (P13);
  insegna la grammatica del gioco a posta bassa (P14 `minor`).

### F3 · Avvistamento — l'informazione è la ricompensa

- Check PER. WIN: vedi gabbia, ritmo pattuglie, "qualcosa di grosso
  nella torre". BIGWIN: scopri anche la porta laterale (route vera, non
  −3% → P9). FAIL: arrivi con info parziali — il posto delle guardie
  resta incognito e il primo approccio peggiora (dichiarato in preview,
  P22). ALMOST: vedi la gabbia ma non il ritmo delle pattuglie
  (near-miss che *cambia qualcosa*, P32).
- **Perché**: il dado modula l'informazione disponibile per la
  decisione successiva — incertezza *decision-relevant* (P24).

### F4 · Approccio — decisione grande #1

Tre vie che **cambiano il problema**, non tre percentuali:

- **Infiltrarsi** — lento, silenzioso. Fail = scoperti → perquisizione
  forzata (il fail *genera* una scena, P14 `strategic`).
- **Porta principale** — veloce, parli. Fail = guardie allertate → i
  check interni peggiorano per tutto il campo (dichiarato).
- **Forza bruta** — immediato, le guardie non sono più un problema.
  Ma il campo resta sveglio: la fuga finale è ostile *di default* e
  qualcosa nella torre si muove prima. Bodyguard NON intercetta
  (dichiarato — il rischio è tuo, P13/P34).

Preview per ogni via: rischio + **"se fallisci: cosa cambia"** (P22 —
la conseguenza controfattuale è l'input della decisione, non solo F%/M%).

### F5 · Dentro il campo — decisione grande #2

- Posto raggiunto. Due opportunità opzionali, entrambe con costo
  dichiarato: **liberare il prigioniero** (check STR; fail = le guardie
  si muovono → la fuga peggiora; win = *ti mostra la breccia nel muro* —
  una via di fuga che altrimenti non esiste) e **il forziere** (contiene
  la mappa della torre = un oggetto che *fa qualcosa*, non gold).
- **Perché**: il prigioniero trasforma lo stato futuro (P9 divergenza
  vera) e ha un payoff morale+mecanico; ignorare tutto resta legittimo.

### F6 · La cassa — TAKEN

- Check AGI per prenderla pulita. **In ogni caso non-fallimentale la
  prendi** — il climax non è "ce la fai?", è "a che prezzo esci?".
  Fail = cassa presa MA il campo si sveglia → estrazione ostile.
  Epicfail = banda dichiarata (ferita/morte) + campo sveglio.
- **Perché**: da qui la posta è *fisicamente in mano al giocatore* —
  endowment attivo (P4). Goal proximity attiva la tensione (P19).

### F7 · Push-your-luck — il climax vero (2–3 iterazioni)

- Con la cassa in mano, scelta binaria ripetuta: **fruga ancora /
  avvia la fuga**. Ogni fruga: +bottino dichiarato, e *la torre si
  muove di più* — escalation visibile (la creatura = la minaccia col
  volto, telegrafata fin dall'avvistamento).
- Una fruga ALMOST trova la mappa → apre la fuga dalla torre
  (near-miss che cambia, P32).
- **Perché**: il push-your-luck funziona perché il progresso è
  *accumulato ed esposto* (P18, Incan Gold; El Rifai/Dyson 2026 su
  Can't Stop: stopping è plasmato dalle near-loss precedenti).
  Goal proximity = più vicino all'uscita, più si rischia (P19).

### F8 · Estrazione — la fuga È il gioco

La forma della fuga **è la run che hai scritto**:

- via breccia (solo prigioniero liberato) — rischio basso;
- via campo calmo (infiltrato, niente frughe) — rischio basso;
- via campo sveglio (forzato, fallimenti, frughe) — check con banda
  dichiarata, M%>0 visibile;
- fail in estrazione può costare: **il bottino caduto** (TAKEN→lost),
  un consumabile, un PG ferito, un PG morto — tutto nella banda
  dichiarata.
- **Fuga/ritirata sempre disponibile**: cristallizza ciò che hai
  messo in sicurezza, rinunci a ciò che non hai (P30 — il fold è una
  decisione perché ha un controfattuale, non un bottone neutro).
- Arrivare fuori = SECURED → reward. **Perché**: è qui che si perdono
  le cose per *propria* decisione (P1, P13) — il punto più lontano dal
  dado e più vicino all'agenzia (P34).

### F9 · Epilogo — peak + end

- Death beat di 3s col nome e l'attribuzione: *"KRAN È CADUTO — per la
  porta che hai forzato"* (P11 peak; P13 attribution; P16 permadeath
  amplifica l'investimento fatto).
- Esito graduato che racconta il *come*: cassa in silenzio / cassa col
  sangue / a mani vuote / ritirata / wipe — con la riga controfattuale
  *"senza il prigioniero la breccia non c'era"* (P22: il regret
  alimenta la run successiva — Marcatto 2015).

## Dove vive il RNG (P34)

Player control: party, oggetti, route, approccio, opzionali, push/secure,
ritirata, timing consumabili. RNG: solo l'esito del check dentro la
banda dichiarata. L'Astrolabe resta la finestra di attesa — **scalata
sulla posta** (P26 arousal budget): reveal breve per viaggio/
avvistamento/approccio, cerimonia piena solo sui check di estrazione e
sul verdetto finale (P7 × P11).

## Il gate di S1 riformulato

Non "ti è piaciuta?" ma: **il playtester sa dire *cosa ha perso e per
quale sua scelta*?** Se la risposta è "ho preso l'80%", il design ha
fallito (P13). Se è "ho perso Kran perché ho frugato una volta di
troppo", la quest è un gioco.

## Cosa la scienza NON risponde (territorio playtest)

- Mix ottimale di failure-tier in 3–5 min (nessuno studio — P14 gap).
- Quanto M% bastano per far male senza alienare (gap party-permadeath).
- Quante iterazioni di push-your-luck (gap — 2–3 è ipotesi, non legge).

<!-- ===== repo-snapshot/GOOD_QUEST_DEFINITION.md ===== -->

# Definizione di buona quest — artefatto finale PLAN-019 (S1–S4)

Sintesi delle regole **validate** e delle proprietà **emerse** durante gli
stadi S1–S4 del macro-plan quest. È l'ingresso di S5: la generazione si
subordina a questi pattern, non il contrario (desiderata v24, macro-plan
§S5). Ogni voce cita l'evidenza che l'ha prodotta — niente qui è auspicio,
è osservazione.

## 1. La ricompensa nomina l'obiettivo

Una buona quest paga quando **la cosa promessa è fatta**, non quando il
party ha generato abbastanza violenza generica. Il reward è legato a una
prova-obiettivo precisa e richiede il leader vivo al ritorno (D-8 rev.2).
Corollario misurato e ratificato: «Sterminio» paga solo con violenza
quasi totale — 99.3% reward inseguendo e finendo, ~6% giocando «bene ma
non da macellai». Il nome della missione e la struttura del reward sono
la stessa frase. Se la generazione crea una missione «recupera», il
reward non può stare sull'uccisione.

Evidence: `test-results/s3-tradeoff-sweep-2026-10-10.log`, gate S3 (d)
ratificato dal Director 2026-10-10 («si chiama sterminio»).

## 2. Il costo è scritto prima della resa

Il rapporto di ritorno racconta **prima** cosa la spedizione ha pagato
(caduti, feriti, consumabili spesi) **poi** cosa ha portato a casa
(reward, bottino, PE, scoperte, concessioni authored). Il costo primo è
la grammatica del rapporto: senza costo visibile la resa non ha peso.
Il wipe narra i morti e tace sulla resa — mai una sezione vuota.

Implementazione: `QUEST_EPILOGUE.sections` ordinato (config Zod),
`buildQuestEpilogue` deriva dal piano settlement reale — il report non
può divergere dal ledger.

## 3. Le conseguenze agiscono E sono narrate

Persistere un ferito non basta: il villaggio deve **vedere** cosa è
successo (journal `eventLog` con headline d'esito + una voce per destino)
e le conseguenze devono **agire** (ferito → non lavora → guarisce a
`injuredUntilTick`; morto → fuori dal roster; tutti feriti → game over).
Dato, azione, narrazione: tre canali, un ledger idempotente.

Evidence: T-1 (S4), `questSettlement.ts` — `appliedQuestEffectIds`
deduplica effetti e narrazione nella stessa scrittura d'aggregato.

## 4. La quest non si risolve nel planner

La preview è orientativa, mai la soluzione. Tra archetipi di strategia lo
spread è enorme (reward 5.5%→99.3%, morti 42%→73.4% su party identico) —
la run si gioca nelle scelte, non nell'assegnazione. E tra party
plausibili esiste un fronte di Pareto ≥2: nessun party domina su tutte
le metriche. Se una griglia party×strategia produce una cella dominante,
la quest è sbilanciata, non i numeri.

Gate S3 (a)+(b) PASS — evidence `s3-tradeoff-sweep`.

## 5. Il push-your-luck ha un muro authored

L'avarizia deve poter uccidere **deterministicamente**: «Razzia» ripetuta
all'infinito scala il danno per giro fino al wipe certo (100%, authored,
non un bug). Un push-your-luck che non può mai azzannare è una slot
machine gratis — il muro è ciò che rende «basta» una scelta.

Evidence: sweep `rapace∞` — 0% reward, 100% wipe, 27 oro incassato
e mai portato a casa.

## 6. I ruoli sono meccanica, non etichetta

Il bodyguard **intercetta**: muore al 71.8% assorbendo i colpi destinati
alla recluta (19.5%). Il leader è il porta-stendardo: il suo
`coverRiskDelta` copre gli altri finché regge — se cade, l'aura cade.
Un membro «carne da macello» identificabile nel forecast è una feature:
il planning deve sapere chi paga.

## 7. L'informazione è una risorsa authored

L'intel scoperta in-run sblocca bonus e strade (`hidden` nodes —
«Tesoro nascosto» non si vede nella strip fasi, esiste). Ciò che il
giocatore non sa **è parte del design**: la preview non rivela il percorso
vero, i nodi nascosti emergono solo giocando.

## 8. La sacca è pre-commitment, non inventario

Gli slot della sacca sono la domanda «cosa lascio a casa»: ogni item
packato costa uno slot e deve avere **ogni** canale dichiarato reale nel
motore (`isExpeditionItem` — nessuna promessa falsa). Consumabili si
armano prima del check (scelta), passivi agiscono finché sono trasportati.

## 9. Il POI ha un ciclo di vita authored

Un'offerta quest è una risorsa del mondo: **one-shot di default** — la
quest sparita non riappare (consumo persistito alla chiusura del
rapporto). Le attività ripetibili si dichiarano esplicitamente
(`repeatable`), e tornano a `available` finché la finestra authored
è aperta.

## 10. Seam authored, non sistemi inventati

Titoli, malattie, lore: lo scenario dichiara, il renderer mostra quando
arrivano (`epilogue` seam con grant `requiresFlag`/`requiresOutcome` —
dimostrato: «Sterminatori dei goblin»). Le categorie senza sistema
restano seam finché un sistema reale non le riempie. Per S5 questo è il
punto: **il contenuto generato si innesta sui canali esistenti**
(flag, epilogue grants, hidden, repeatable), non introduce canali nuovi.

## Cosa una buona quest NON è (scarti confermati)

- **Non è un testo**: è un grafo di decisioni con conseguenze meccaniche —
  la narrativa emerge dal motore, mai da copy libero (regola dominante
  della desiderata).
- **Non è equa**: il danno posizionale colpisce sempre qualcuno — la
  ferita è un pedaggio certo, non un «forse» (wound 100% su qualunque
  percorso goblin, ratificato).
- **Non perdona il panico gratis**: fuggire col tesoro lo fa cadere;
  fuggire è una scelta di resa, non un salvataggio.
- **Non si ferma alla schermata finale**: il loop vero finisce quando il
  villaggio ha sentito, pianto e registrato — epilogo → journal →
  conseguenze che agiscono.

## Uso in S5

Ogni candidato di generazione passa questo filtro:
1. la ricompensa nomina l'obiettivo (§1);
2. esiste almeno un trade-off reale party→esito (§4);
3. esiste almeno un modo authored di pagare troppo (§5);
4. le conseguenze prodotte entrano nel ledger e nel journal (§3);
5. ogni canale offerto al giocatore è reale nel motore (§8);
6. le novità narrative si innestano sui seam, non su canali inventati (§10).

Una quest che fallisce uno di questi punti non è «una quest più
semplice» — è un altro oggetto, e va chiamato con un altro nome.

<!-- ===== repo-snapshot/quest_sterminio_goblin_spec.md ===== -->

---
title: Quest «Sterminio dei goblin» — spec authored completa
type: spec
status: vigente — documento unico della quest (meccanica + manoscritto);
  assorbito `context/QUEST_GOBLIN_FLAVOR.md` il 2026-10-08
date: 2026-10-06
updated: 2026-10-19
source: proposta del Director (correzione alla bozza «Torre nel Bosco», 2026-10-06);
  modello di targeting posizionale a cascata definito dal Director;
  layer narrativo R-099; manoscritto r008 (IT+EN) — dibattito
  multi-AI convergente 20261018-narration-v3, artifact-r008 accettato
  2026-10-19 (R-219)
---

# Sterminio dei goblin — spec completa

Quest di **combattimento**, basata su **Forza**. Vincoli di presentazione
(Director, evoluti 2026-10-08): ~~pochissimo testo~~ → **layer narrativo
cinematografico** (R-099) — immagine, nomi d'azione, transit tra le fasi,
flavour per scelta ed esito; il manoscritto completo (v3, IT + EN) è in
fondo al doc.
Il giocatore in ogni fase può ritirarsi o usare un consumabile.

> **Questo documento è la fonte unica della quest.** Tutto ciò che il
> lab (`/quest-s1-lab`) mostra o esegue nasce qui; `questScenarioGoblin.ts`
> è la traduzione eseguibile, non una fonte parallela.

---

## Sistema di targeting per slot (DEFINITO DAL DIRECTOR — vigente in questa spec)

Gli esiti pericolosi (morte secca, ferita) e i danni extra di un check o di un
turno di combattimento si assegnano con **un tiro sugli slot occupati**. Il
profilo è **posizionale**: il rischio sta sempre in coda; chi sta davanti è
protetto finché qualcuno dietro vive.

| PG assegnati | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| 1 | 100% | — | — | — |
| 2 | 20% | 80% | — | — |
| 3 | 0% | 20% | 80% | — |
| 4 | 0% | 0% | 20% | 80% |

- Quando un PG muore, **i posti scalano e le % si spostano**: i superstiti
  risalgono di posizione e il profilo si ricalcola sul numero di occupati
  (es. 4→3 occupati: da 0/0/20/80 a 0/20/80).
- Lo stesso tiro vale per morte secca, ferita e danni extra — **un solo
  concetto** (nessuna probabilità separata per «sudden death dell'eroe»: l'eroe
  non muore finché qualcuno è dietro perché il suo slot vale 0; da solo = 100%).
- **Escalation in combattimento (solo fase F4, solo danni — NESSUNA morte
  secca nel combattimento):** dopo il turno 1 → S4 −10%, S2 +5%, S3 +5%;
  dopo il turno 2 → S4 −10%, S1 +5%, S2 +5%. (Profilo danni F4:
  T1 `0/0/20/80` → T2 `0/5/25/70` → T3+ `5/10/25/60`, **stabile oltre T3**.)
  Valori **fittizi/placeholder**: la calibrazione vera è ancora da fare.
  L'escalation su S1 produce solo **danno extra**, mai morte: in F4 non si
  muore, ci si ferisce/si perdono HP.
- Obiettivo di calibrazione Director: mediamente il bodyguard muore, S2
  prende ~20–30% del danno, S3 ~50–70%.

---

## Parametri globali

| Voce | Valore | Note |
|---|---|---|
| Competenze chiave | Forza (base), Percezione (rivelabile), Destrezza, Costituzione, Intelligenza | |
| Oggetti/consumabili portabili | Bonus Forza ×1 fase · Bonus Percezione ×1 fase · Healing +20 HP | assegnati in partenza |
| Difficoltà check combattimento | **−20 allo score** → miglior FOR del party = ~50% riuscita a turno (es. FOR 70 → bound 50, vantage assalto +10 → 60, stealth +15 → 65) | Director, calibrazione 2026-10-06 |
| Durata | ~4–6 turni di combattimento | Director |
| Checkpoint | continua / ritirati / consumabile prima di ogni check rischioso | vigente |
| Consumabili | usabili **solo prima di uno skill check o di una scelta** | Director 2026-10-06 |
| Wipe | si perde tutto | vigente |
| Ferita | X giorni di indisponibilità | vigente |
| Reward | **XP sempre**; il trofeo dei goblin si converte al ritorno in città nel reward vero — per ora **Gold** | Director 2026-10-06 |
| Vincoli party | nessun vincolo sul numero di PG (mock: 4 slot noti) | Director 2026-10-06 |
| HP | i PG **hanno HP**: mock eroe = **100 HP**, gli altri = **60 HP** — valori ereditati dalle stat reali del PG quando assegnato | Director 2026-10-06 |
| Lifecycle POI | **`repeatable`** (`poi-goblin`): il marker non viene mai consumato — chiuso il rapporto di una run ended+settled la run si sgancia e l'offerta torna `available` finché la finestra è aperta (rilanciabile); ignora anche record consumati stantii | R-200 (D-1) + D-S4-6, `questPois.ts` |

---

## Fasi

### F0 — ASSEGNAZIONE (planning)

- **Info visibili:** quest di combattimento, basata su Forza.
- **Info rivelabile:** Percezione (la riveli portando esplorazione/preview).
- **Oggetti assegnabili:** Bonus Forza ×1 fase · Bonus Percezione ×1 fase ·
  Healing +20 HP.
- **Nessuno skill check in questa fase.**

### F1 — ESPLORAZIONE (cercare tracce)

Testo minimo. Due check alternativi (nomi v3, Director 2026-10-18 —
sostituiscono «Cercare tracce»/«Arrampicarsi sull'albero» del 2026-10-08;
le opzioni NON dichiarano scopo né esito):

| Check | Successo | Fallimento |
|---|---|---|
| `PERCEZIONE` — **«Esaminare il terreno»** | **bonus all'approccio Stealth di F3** (→ vantaggio in F4) | nulla* |
| `FORZA + PERCEZIONE` — **«Esaminare dall'alto»** | **apre F2** (dall'alto si avvista il nascondiglio di tela) | −10 HP (caduta) |

- Ratificato (Director 2026-10-06): `PERCEZIONE` semplice non apre nulla —
  il suo successo alimenta la via stealth dell'accampamento.
- Il «nuovo evento» aperto da `FORZA+PERCEZIONE` **è F2**.
- Re-mapping nomi↔stat (Director 2026-10-08): la Percezione pura legge il
  suolo; Forza+Percezione è la salita (sforzo fisico + lettura dall'alto).
- **v3 (Director 2026-10-18): il masso esce dalla fiction** — la nicchia di
  F2 è un fagotto sotto tela cerata/fronde troppo regolari, avvistato
  dall'alto come dettaglio nascosto e inaspettato.
- **v3 — deciso (Director 2026-10-18): il danno è cablato.** L'epicfail di
  «Esaminare il terreno» applica −10 HP (lama nascosta nel terreno) — il
  flavor è reale, niente `unsupported-cost`.
- **Solo questi 2 check** — nessuna altra combinazione in questo esempio
  (Director 2026-10-06).
- Checkpoint: ritirati / consumabile sempre disponibili.

### F2 — EVENTO OPZIONALE (bottino) — agganciato a F1

- **Disponibile solo se `FORZA+PERCEZIONE` di F1 è riuscita** (è l'evento che
  quel check apre).
- **v3 (Director 2026-10-18): nessuna prova e nessuna scelta** — nodo
  `info`/reward con un'unica azione («Recupera il bottino»): il giocatore
  raccoglie e prosegue. Sostituisce il check `DESTREZZA` (silenzio vs
  allerta) della versione precedente.
- **v3 — implementato 2026-10-18:** nessun `kind: 'reward'` né campo
  `action` nuovo — il nodo è un `choice` a **una sola opzione**
  («Recupera il bottino» → `next` diretto su `gob-accampamento`).

### F3 — ACCAMPAMENTO GOBLIN (scelta di approccio)

Titolo v3 (Director 2026-10-18): **«Regole d'ingaggio» / «Rules of
engagement»**; le opzioni non dichiarano scopo né esito.

Lettura immediata voluta dal Director (quest Forza-based: il party avrà
mediamente più Forza che Destrezza):

| Approccio | Check | Successo | Fallimento |
|---|---|---|---|
| **Stealth** | `DESTREZZA` | **+Danno** a F4 (bonus migliore) | **Allerta** → malus a F4 |
| **Assalto** | `FORZA` | **+Danno** a F4 (bonus moderato) | nessun bonus (nessun malus) |

- Stessa leva (+Danno), rischio diverso: Assalto è l'opzione affidabile,
  Stealth quella rischiosa dal payoff migliore. Nessuna spiegazione di
  matematica necessaria.

### F4 — COMBATTIMENTO

- **X turni (≈4–6)** di danni a ogni turno, sia ai goblin sia al party.
- **Colpi al party per turno:** 1 colpo a T1 e T2; **2 colpi da T3 in poi**,
  sempre a bersagli diversi (regola Director: un singolo turno non può
  colpire due volte lo stesso PG — distribuisce l'attrito invece di
  concentrarlo).
- Il danno al party si distribuisce col **profilo slot posizionale** e con
  **escalation** (vedi sopra: T1 `0/0/20/80` → T3+ `5/10/25/60`).
- **Attesa Director:** mediamente il bodyguard (S4) muore; S2 ~20–30% del
  danno; S3 ~50–70%.
- **Difficoltà skill check = −20 allo score** (miglior FOR del party → ~50%
  riuscita a turno; es. FOR 70 → bound 50). Calibrazione Director 2026-10-06.
- I bonus/malus di F3 (stealth → danno, assalto → moderato) si applicano qui.

### F5 — INCALZARE (scelta) — punto di non ritorno psicologico

I goblin superstiti fuggono. La scelta è **dolore ora vs dolore dopo**
(Director, spec v2 2026-10-08):

- **Lasciarli fuggire** = zero danno immediato, ma si riorganizzano →
  agguato F7 **pesante** (mischia a 30).
- **Incalzare** = danno deterministico **sempre** (il prezzo della caccia) +
  check `FORZA`; se scappano comunque tornano *a pezzi* → agguato F7
  **mite** (mischia a 20). Se li chiudi → sterminio, ritorno pulito.

| Opzione | Esito |
|---|---|
| **Lasciarli fuggire** | nessun danno ora → agguato F7 **peggiorato** |
| **Incalzare** | **−10 HP posizionali sempre** (pedaggio) + check `FORZA` ↓ |

Bande del check `FORZA` (il juice dei tiri: almost e critici contano):

| Esito | Effetto |
|---|---|
| `bigwin` | toll + **Sterminio**, ritorno pulito |
| `win` | toll + **Sterminio**, ritorno pulito |
| `almost` | toll + fuggono feriti → agguato F7 **mite** |
| `fail` | toll + fuggono a pezzi → agguato F7 **mite** |
| `epicfail` | toll **−20** + fuggono → agguato F7 **mite** |

- Stat: **Forza** (coerente con la quest Forza-based).
- Flee resta razionale quando il pedaggio ucciderebbe subito il membro in
  coda (toll posizionale concentrato vs flat ambush spalmato) o quando il
  FOR residuo è debole e si prevede comunque di mollare il trofeo.
- La mischia F7 resta una scelta di valuta su entrambe le vie (bailout
  sempre disponibile).

**Calibrazione R-097 (MC 10k×2 bracci):** v1 (flee=mite, fail=peggiore+
bailout negato) è stata sostituita dalla struttura v2 sopra — la spec del
Director inverte il gradiente: flee = agguato pesante rinviato, pursue-fail
= agguato mite. Sweep: `scripts/quest-goblin-f5-sweep.ts` (N1 scelto).

### F6 — CONTINUA L'ESPLORAZIONE (opzionale, post-obiettivo)

- X turni di esplorazione; a ogni turno:
  - danni **5 → 10 → 15 → …** (crescenti) distribuiti col profilo slot;
  - skill check su `INTELLIGENZA` o `PERCEZIONE`.
- Push-your-luck puro: ogni turno in più costa di più.

### F7 — RITORNO / AGGUATO

- **Se F5 riuscita (sterminio):** ritorno pulito.
- **Altrimenti:** i goblin superstiti fanno un **agguato nel bosco** —
  pesante se lasciati fuggire, mite se inseguiti (spec v2). **v3
  (Director 2026-10-18):** ti stavano *aspettando* — attaccano per
  rabbia e vendetta, non per una motivazione «organizzata»; nessun
  riferimento a strada o guado nella fiction.
  **all'ingresso tutto il party prende 5 danni secchi** (bilanciabile dopo),
  poi scelta:
  1. **Lasciare il trofeo dei goblin** → si perde la quest (niente reward:
     il trofeo è ciò che si converte in Gold al ritorno), si scappa;
  2. **Affrontare il combattimento** → **un turno secco** come in F4
     (Director 2026-10-06). Attesa Director: **mediamente rischiano
     di morire tutti tranne l'eroe** (il profilo posizionale con pochi
     superstiti concentra il rischio in coda: chi resta a coprire muore, l'eroe
     resiste).

---

## Layer narrativo — manoscritto (r008, R-219 — dibattito 20261018-narration-v3)

Il vincolo «pochissimo testo» delle origini è **superato**: il Director ha
chiesto pathos, contesto, nomi d'azione per i check, flavour per scelta ed
esito, e narrazione durante il movimento tra le fasi. Questa sezione è il
**testo completo che il lab deve mostrare**, in ordine d'incontro — ogni
stringa annotata col campo dati che la porta.

La versione corrente è la **r008**: manoscritto del dibattito multi-AI
convergente (`.mw/runs/20261018-narration-v3/artifact-r008.md`, sha256
`eb25ec30…`, accettato 2026-10-19), che codifica le 11 correzioni
Director del 2026-10-18 (R-219) in forma validabile — italiano + inglese.
Sostituisce la v3 (2026-10-18 — in git history) ed è **sincronizzata
con `scenarios/goblin.ts`** dal 2026-10-19 — i residui sono elencati in
«Delta rimasti».

### Campi authored consumati dal lab

| Campo | Su quale nodo | Cosa fa |
|---|---|---|
| `transit` | choice, combat, end | narrazione durante la transizione cinematografica verso il nodo (~2.6 s, `questLabPacing`) — *cosa vedi, cosa incontri* |
| `title` | tutti | per i check è il **nome d'azione**, entra nel titolo dell'astrolabio |
| `body` | tutti | riga di contesto (sotto il check overlay / corpo della card) |
| `options[].label` | choice | prosa authored — il gesto che il giocatore firma |
| `options[].detail` | choice | stat + gesto, **mai** scopo né esito (convenzione Director 2026-10-18: detail non-spoiler — «Percezione. Vi abbassate tra le radici.») |
| `verdictFlavor` | check | una riga per banda `bigwin/win/almost/fail/epicfail` |
| `failHint` | check | testo pre-check che dichiara la posta |
| `upfrontDamage` | check | pedaggio deterministico narrato nell'esito |
| `previewHint` | check/combat/harm | hint di pericolo visibile al planning |
| `revealHint` | harm | hint sbloccato da scouting/rivelazione |
| gesto unico | choice a opzione unica | **v3 (confermata r008):** un nodo senza check né scelta si rappresenta come choice a **una sola opzione** (`gob-bottino` → «Recupera il bottino» → `next` diretto) — nessun campo `action`/`kind: 'reward'` nello schema |
| attack lines | combat | flavor per banda su ogni turno — authored in config (`combat.attackLines` sul nodo; `GOBLIN_ATTACK_LINES` nel motore resta il fallback) |
| `body` di `harm`/`end` | harm, end | il colpo subito / la chiusura |

Presentazione (`ResolvedCheck`, aggiornata 2026-10-08): la cinematica
separa `flavor` (verdict authored), `harmLines` (ferite e pedaggi),
`authoredText` (esito authored) e gli **harms ambient** (agguato,
attrito) senza check proprietario, presentati come beat a sé.

### Regole di scrittura

1. **Transit** — mostra ciò che i personaggi *vedono/fanno* in movimento,
   mai l'esito futuro. Copre l'animazione reale di spostamento.
2. **Action name** — il check si chiama per il gesto, non per la stat.
   Registro: seconda persona se il gesto è di uno («Ti arrampichi…»),
   plurale se è del gruppo («Saltate il filo…»), sostantivo se il gesto
   è già un'immagine («La carica»).
3. **VerdictFlavor** — riporta ciò che il *mondo* fa in risposta. I costi
   si possono nominare («costa sangue», «−10 HP») ma le cifre sono
   **provvisorie finché il budget di rischio non è calibrato**; la riga
   deve reggere anche senza numero.
4. **Nomi dei PG — mai hardcoded.** Il testo referenzia *slot*:
   `{leader}`, `{bodyguard}`, `{nome}` vengono interpolati dal party
   assegnato (il motore già lo fa nelle righe di danno). Accessorio
   italiano: costruzioni che **evitano l'accordo di genere** sul
   placeholder (`{leader} marcia davanti` è sicuro, `{leader} è ferita/o`
   no).
5. **Le uscite di un nodo vivono nel transit del nodo successivo** — non
   esiste «testo di uscita»: l'aftermath dello sterminio è il transit
   del campo conquistato.
6. **Le scelte senza check meritano flavor proprio** — oggi compresso in
   `detail`; campo candidato `options[].consequence` (proposto, non
   implementato).
7. **Attack lines = canale separato** — stesse regole del verdictFlavor
   ma stringate: si leggono 5 volte di fila, nessuna ridondanza.
8. **Le opzioni non anticipano scopo né esito** (Director 2026-10-18) —
   la label nomina il gesto («Esaminare il terreno»), mai cosa troverà né
   a cosa serve («dall'alto: dove nascondono ciò che rubano» = spoiler).
9. **Ciò che un check serve a scoprire non si mostra prima del check**
   (Director 2026-10-18) — se impronte e trappole sono già nel body del
   nodo-scelta, l'esplorazione non ha più oggetto.
10. **Gli esiti descrivono il mondo, non i risultati meccanici che l'UI
    mostra** (Director 2026-10-18) — niente conteggi di morti, bonus o
    HP nella prosa; «show don't tell»: le immagini di scena portano ciò
    che è ovvio, il testo porta ciò che le immagini non dicono.

### Budget di rischio (proposta — cifre placeholder da calibrare MC)

La quest dichiara *quanto deve costare*: il flavor promette sangue solo
dove il sangue è reale, e il tuning MC ha un target.

```yaml
quest: sterminio-dei-goblin          # party di riferimento: preset gob-band
danno_atteso_totale: 25–45 HP        # concentrato in coda di formazione
morte_pg:
  playthrough_normale: < 5%          # morte solo su chain di sfortuna
  f7_ultimo_scontro:   ~15–25%       # il prezzo del trofeo, se combatti
concentrazione_rischio:
  F1-B: ferita lieve (caduta dalla quercia)
  F4:   danni di scambio, escalation da T3
  F5:   pedaggio authored (10–20 HP) + intensità agguato
  F7:   unico nodo dove la morte è attesa come possibilità reale
regola: un testo che promette morte dove il modello non può uccidere
        è un bug narrativo.
```

---

## Manoscritto — testo per nodo, in ordine d'incontro

**Versione corrente: r008 (dibattito multi-AI convergente
20261018-narration-v3, artifact-r008 sha256 `eb25ec30…`, accettato
2026-10-19).** Sostituisce la v3 (R-219, 2026-10-18 — in git history).
Il manoscritto IT è quello del fixture accettato
`tests/fixtures/goblin-accepted-r008.ts` (0 hard issue sotto
`validateNodeCopyR8` + contratto epistemico `contract-v1.json`); il
render EN è il peer authored consumato dal runtime —
**sincronizzato con `scenarios/goblin.ts` il 2026-10-19** — i residui
sono in «Delta rimasti». `{nome}`/`{bodyguard}` = interpolazione dal
party assegnato (nel motore).

### Manoscritto IT — r008

#### Offerta

- **flavour:** «Il bosco si è fatto silenzioso. I goblin, no.»
- **objective:** «Sterminare l'accampamento goblin.»
- **dispatch:** «Seguite le tracce fino al loro accampamento. Nessuno deve tornare a minacciare il villaggio.»
- **beats:** Esplorazione · Bottino · Regole d'ingaggio · Combattimento · Incalzare · Razzia · Ritorno

#### F1 — Esplorazione `gob-esplora` (choice)

> **title:** «Esplorazione»
>
> **transit:** «Gli alberi chiudono la luce alle vostre spalle. Tra le
> felci umide l'aria è ferma e sa di muschio bagnato e legna marcia.»
>
> **body:** «Il sottobosco stringe il passo in una parete di tronchi
> caduti. Il folto tace da ogni lato, e non dice nulla di chi lo
> abita.»
>
> **Opzioni:**
> - *Esamina il terreno*
> - *Esamina dall'alto*

#### Check `gob-tracce-per` (PER)

> **title:** «Esamina il terreno»
>
> **transit:** «Vi abbassate tra le radici. Sotto lo strato di foglie, la
> terra conserva segni che il bosco non ha ancora avuto il tempo di
> cancellare.»
>
> **body:** «Vi piegate dove il muschio cede alla terra scura, cercando
> tra le foglie bagnate un segno.»
>
> **failHint:** «Le foglie tornano al loro posto, ma le vostre impronte
> restano impresse nella terra umida.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Sotto le foglie marce affiorano impronte leggere e, più avanti nell'erba alta, il riflesso sottile di un filo teso a mezza gamba, che corre verso il campo.» |
| win | «Talloni nudi nella terra umida e rami spezzati bassi disegnano una traccia obliqua che punta verso l'interno del bosco.» |
| almost | «Impronte sovrapposte e confuse nella terra molle: qualcuno è passato, ma il verso si perde tra le radici.» |
| fail | «Solo radici scoperte e terra smossa dalla pioggia. Il suolo non vi concede nulla.» |
| epicfail | «Il piede cede sul muschio fradicio e uno schianto di rami secchi rimbalza nel silenzio del bosco.» |

Nota meccanica: l'epicfail paga −10 HP cablati (ruling v3) — la ferita
è la caduta tra i rami secchi; il motore la nomina nel log («The dead
branches tear you on the way down.»), non nel verdict text.

#### Check `gob-tracce-perfor` (STR+PER)

> **title:** «Esamina dall'alto»
>
> **transit:** «Una vecchia quercia emerge sopra il sottobosco. I rami
> più bassi sono raggiungibili, ma la corteccia è ruvida e screpolata.»
>
> **body:** «Il tronco della quercia è umido e ruvido sotto i palmi;
> più in alto la cupola di foglie chiude la vista su tutto ciò che sta
> oltre.»
>
> **failHint:** «Il legno scricchiola sotto il vostro peso. Un ramo
> sottile si piega e torna al suo posto con un colpo secco.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Dall'alto il bosco cambia volto: un filo di fumo sale dritto sopra la radura dell'accampamento, il calpestio gira a spirale attorno ai fuochi e, lontano dalle tende, un lembo di sottobosco appare rimesso a posto con troppa cura, come una ferita ricucita.» |
| win | «Tra i rami alti scorgete il fumo grigio dell'accampamento e, lontano dai fuochi, un lembo di sottobosco rimesso a posto con troppa cura, come una ferita ricucita.» |
| almost | «Il vento apre le fronde per un istante: scorgete un filo di fumo grigio tra le cime, prima che le foglie richiudano la vista.» |
| fail | «La chioma è un muro verde e le braccia bruciano per la salita: scendete con la corteccia sotto le unghie senza aver visto oltre gli alberi.» |
| epicfail | «Il ramo marcio cede di schianto sotto il peso: precipitate tra i rami bassi e battete duro la spalla a terra.» |

Nota meccanica: ogni esito non-successo paga −10 HP — su `fail` è il
costo della salita («The climb costs you.»), su `epicfail` la caduta
(«The fall costs you.»).

#### F2 — Bottino `gob-bottino` (nodo nascosto, recupero diretto)

Condizione: il nodo compare se l'esplorazione dall'alto permette di
individuare il nascondiglio.

> **title:** «Ciò che era nascosto»
>
> **transit:** «Il lembo di sottobosco rimesso a posto con troppa cura
> è ancora là, in disparte dai fuochi.»
>
> **body:** «Le foglie vengono via in una sola manata. Sotto, in una
> buca foderata di pelli, giace ciò che i goblin avevano sepolto di
> nascosto: allungate le mani e lo tirate fuori.»
>
> **action:** «Recupera il bottino»

Nessuna prova e nessuna scelta: il giocatore raccoglie il bottino e
prosegue (Director 2026-10-18; runtime = choice a opzione unica,
`grantsGold` sul `next` diretto — nessun kind nuovo).

#### F3 — Regole d'ingaggio `gob-accampamento` (choice)

> **title:** «Regole d'ingaggio»
>
> **transit:** «Oltre l'ultima cortina di felci l'odore acre di grasso
> rancido vi investe nella penombra.»
>
> **body:** «Le braci basse ardono al centro della radura. Tra le tende
> storte si muovono sagome corte: resta solo da scegliere come
> entrare.»
>
> **Opzioni:**
> - *Muoviti nell'ombra*
> - *Carica a ferro scoperto*

#### Check `gob-stealth` (AGI)

> **title:** «Muoviti nell'ombra»
>
> **body:** «Avanzate piegati dove la penombra del sottobosco tocca il
> margine della radura, misurando ogni appoggio.»
>
> **failHint:** «Il filo si tende sotto il vostro peso: qualcosa cede
> accanto alla postazione.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Scivolate oltre un filo teso senza muovere un soffio: siete già alle loro spalle mentre fissano ancora il fuoco.» |
| win | «Un passo, una pausa, un altro passo nell'ombra. Superate il perimetro esterno senza che una sola foglia parli.» |
| almost | «Sfiorate il filo e qualcosa tintinna accanto alla postazione: vicino al fuoco una testa si volta, poi esita.» |
| fail | «Un filo vi morde lo stivale e un tonfo rimbomba accanto alla sentinella: le sagome attorno al fuoco scattano in piedi.» |
| epicfail | «Inciampate in pieno nel filo teso e il carico della postazione precipita in un fracasso: il campo intero si rovescia contro di voi.» |

#### Check `gob-assalto` (STR)

> **title:** «Carica a ferro scoperto»
>
> **body:** «Stringete le impugnature e vi lanciate fuori dalla
> macchia, puntando dritto verso il cerchio del fuoco.»
>
> **failHint:** «Il legno geme sotto la spinta. Dall'altra parte,
> qualcosa urta contro la barriera.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Travolgete la barricata all'ingresso di puro slancio: siete già sopra i fuochi prima ancora che il primo grido prenda forma.» |
| win | «Sfondate il margine del campo a spallate, portando le lame dentro il cerchio di luce.» |
| almost | «La terra molle frena gli stivali all'ultimo passo: entrate nella radura mentre le prime guardie già si alzano.» |
| fail | «Il fango sotto i piedi spezza lo slancio della corsa; davanti ai fuochi il muro di punte è già serrato.» |
| epicfail | «Il piede scivola nella melma in piena corsa: cadete in avanti contro la barricata con la guardia aperta.» |

#### F4 — Combattimento `gob-combattimento` (combat)

> **title:** «Ferro e cenere»
>
> **transit:** «Il respiro si chiude in gola. Poi resta solo il rumore
> del ferro.»
>
> **body:** «Tizzoni calpestati, urla rauche che rimbalzano tra i
> tronchi e il sapore caldo del rame sulla lingua. Ogni sagoma intorno
> alle braci ha denti e lama.»
>
> **previewHint:** «Tra fumo e fiamme, persino le ombre sembrano avere
> denti.»

Attack lines per turno — in config dal sync r008
(`combat.attackLines` sul nodo, `GOBLIN_ATTACK_LINES` resta fallback
motore per le quest senza righe authored):

| esito | riga |
|---|---|
| bigwin | «Tutto il peso del corpo scende nel fendente e sfonda la guardia davanti a voi.» |
| win | «L'urto secco dell'acciaio spezza il legno degli scudi, e il rumore resta nelle orecchie.» |
| almost | «Il fuoco fa di ogni lama un lampo storto: il taglio morde, ma di striscio.» |
| fail | «Il colpo muore sul cuoio unto e sul legno storto, lasciando il polso vibrare a vuoto.» |
| epicfail | «La cenere scivolosa tradisce il tallone e un urto da un fianco vi riversa il fiato in gola.» |

**Righe del motore (condivise da tutte le quest — `questRun.ts`, nomi
interpolati). Il danno legge lo stato: la frase dipende dagli HP residui
del bersaglio, non dal numero subito:**

- Danno, >70% HP — «{nome} serra i denti e resta in piedi (−X HP).»
- Danno, 35–70% — «{nome} si piega, poi si rimette dritto (−X HP).»
- Danno, 20–35% — «{nome} barcolla: c'è sangue sul fianco (−X HP).»
- Danno, <20% — «{nome} regge solo perché non c'è altro da fare (−X HP).»
- Morte — «{nome} cade, e non si rialza più — su «{fonte}».»
- Death save — «{nome} è a terra… e si rialza.»
- Bodyguard — «{bodyguard} si frappone e subisce il colpo destinato a {nome}.»

#### F5 — Incalzare `gob-incalzare` (choice, solo se superstiti)

> **title:** «Inseguimento»
>
> **transit:** «Le ultime braci fumano sulla terra calpestata. Verso
> l'interno del bosco si sente il fruscio convulso di chi scappa nella
> notte.»
>
> **body:** «Chi è rimasto in piedi si butta tra gli alberi senza
> voltarsi, inghiottito a pezzi dall'oscurità: una schiena, un ansimo,
> un ramo che oscilla.»
>
> **Opzioni:**
> - *Lasciarli fuggire*
> - *Incalza i fuggiaschi*

#### Check `gob-incalza-check` (STR)

> **title:** «Incalza i fuggiaschi»
>
> **body:** «Vi lanciate sotto le fronde basse dietro il rumore dei
> passi in fuga, dove il terreno scende ripido tra pietre umide e
> radici.»
>
> **failHint:** «Una lastra si muove sotto il peso degli scarponi. La
> pietraia non concede un passo sicuro.»
>
> **previewHint:** «Tra le rocce, ogni svolta cancella per un istante ciò
> che vi aspetta oltre.»
>
> **upfrontDamage:** 10 HP; 20 HP su epicfail, secondo la regola
> prevista. Il danno viene narrato negli esiti.

| esito | verdictFlavor |
|---|---|
| bigwin | «Li raggiungete dove la forra stringe il passo, e il bosco si fa muto di colpo.» |
| win | «Il vostro passo è più lungo del loro sulla salita di pietra: il fruscio davanti a voi si spegne sotto i colpi.» |
| almost | «La gola brucia ad ogni respiro; li urtate laggiù in fondo alla forra, ma la macchia si richiude sulle schiene più rapide.» |
| fail | «Le pietre bagnate vi tradiscono il passo e la macchia se li riprende prima che le lame arrivino.» |
| epicfail | «Scivolate lungo la scarpata battendo duro contro la roccia viva, mentre i passi in fuga si perdono.» |

Nota: `win`/`bigwin` = sterminio → F7 pulito; `almost`/`fail`/`epicfail`
= fuga → agguato mite.

#### F6 — Razzia `gob-esplora-extra` (choice, push-your-luck)

> **title:** «Tra le ceneri»
>
> **transit:** «Il silenzio ricade sulla radura devastata, rotto solo
> dallo scricchiolio dei legni anneriti dal fuoco.»
>
> **body:** «Attorno ai tizzoni spenti restano teli squarciati e cumuli
> di strame fumante che la fiamma non ha ancora consumato del tutto.»
>
> **Opzioni:**
> - *Fruga tra le braci*
> - *Fermarsi*

#### Check `gob-cerca` (INT/PER)

> **title:** «Fruga tra le braci»
>
> **body:** «Sollevate i teli anneriti col piatto della lama, cercando
> a tentoni nel tepore acre che sale dai resti del campo.»
>
> **failHint:** «Una trave scricchiola sopra di voi. Una pioggia di
> cenere cade sul terreno.»
>
> **previewHint:** «Il fumo torna a velare il campo; il legno bruciato
> cede al minimo urto.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Sotto lo strato più fondo le dita incontrano il cuoio pesante di una cassa risparmiata dalle fiamme.» |
| win | «Tra i resti anneriti tirate fuori ciò che il fuoco non è riuscito a divorare.» |
| almost | «Una presa corta nel fumo, mentre un sostegno bruciato cede a un soffio dalla spalla.» |
| fail | «Solo cenere calda che vi si attacca ai palmi attraverso i guanti.» |
| epicfail | «La trave annerita della tenda cede di schianto, rovesciandovi addosso una pioggia di braci ardenti e legno spaccato.» |

**Righe per turno** (motore, `GOBLIN_F6_CREAK_LINES` — la struttura che
cede, una per `exploreTurn`):

1. «Il palo che regge il telo scricchiola.»
2. «La brace cova ancora sotto la tela annerita; il calore lambisce il
   viso.»
3+. «Una trave si stacca con uno schianto e ricade dove, un istante
   prima, frugavate.»

#### F7 — Ritorno / Agguato

`gob-ritorno` (info):

> **title:** «Il ritorno»
>
> **body:** «L'aria si fa più fredda sotto le chiome alte. Qualcuno
> allenta la presa sull'elsa — poi un ramo schiocca dove il vento non
> soffia.»

`gob-agguato` (harm):

> **title:** «Quelli che erano rimasti»
>
> **body:** «I goblin superstiti vi stavano aspettando. Portano ancora
> addosso il fumo del loro campo: vi hanno seguito fin qui, e ora
> escono dalle fronde senza un grido, con i denti già scoperti.»
>
> **previewHint:** «Tra gli alberi, le ombre si muovono prima che
> riusciate a distinguere i corpi.»
>
> **revealHint:** «Le tracce dei fuggitivi si incrociano attorno al
> sentiero. Non sono finiti qui per caso.»

`gob-agguato-scelta` (choice):

> **title:** «Accerchiati»
>
> **transit:** «Le frecce vibrano ancora nei tronchi attorno a voi.»
>
> **body:** «Lame basse chiudono il passo tra gli alberi, e il ringhio
> sale da ogni lato.»
>
> **Opzioni:**
> - *Lasciare il trofeo*
> - *Affrontare*

`gob-ultimo-scontro` (combat, 1 turno):

> **title:** «L'ultimo assalto»
>
> **transit:** «Le spalle si toccano. L'urto arriva da ogni lato.»
>
> **body:** «Si gettano sugli scudi senza badare al ferro; dalle loro
> gole non esce più nessuna parola, solo un respiro lungo e basso, a
> denti stretti.»

Attack lines per turno — in config dal sync r008
(`combat.attackLines` sul nodo):

| esito | riga |
|---|---|
| bigwin | «Tutta la furia della mischia si rovescia in un solo fendente, e il cerchio si apre.» |
| win | «L'acciaio risponde all'acciaio con un suono corto che taglia il ringhio.» |
| almost | «Le lame si cercano nella penombra e si trovano solo a metà.» |
| fail | «I denti stridono sullo scudo mentre la linea tiene per un soffio.» |
| epicfail | «Un contraccolpo dal buio vi toglie il terreno da sotto i piedi per un istante lunghissimo.» |

`gob-fine` (end):

> **title:** «Cenere fredda»
>
> **transit:** «Gli alberi si diradano nel grigio dell'alba; l'odore di
> fumo e ferro vi resta cucito addosso.»
>
> **body:** «Sulle mani resta il segno della notte, mentre l'ombra
> degli alberi si richiude alle vostre spalle.»
>
> **closingLine:** «Nel folto il fumo sale ancora dritto, ma ormai non
> chiama più nessuno.»

Nel runtime la closingLine è fusa in coda al `body` (il kind `end` non
ha un campo dedicato — il bilancio meccanico resta compito di
`composeEndingText`, non della prosa).

**Epilogo composto dal motore** (`composeEndingText`): vittoria «The
trophy is on the scales. The village breathes again.»; sconfitta «…The
goblins keep the wood.»

### Manuscript EN — r008

Peer render of the IT r008 — same facts, same beats, English voice (per
the pipeline convention: a re-voicing, not a literal translation). This
is the authored text consumed by `scenarios/goblin.ts` (R-135).

#### Offer

- **flavour:** "The wood has gone quiet. The goblins have not."
- **objective:** "Exterminate the goblin camp."
- **dispatch:** "Follow their tracks to the camp. None of them must
  come back to threaten the village."
- **beats:** Exploration · Loot · Rules of Engagement · Combat ·
  Pursuit · Raid · Return

#### F1 — Exploration `gob-esplora` (choice)

> **title:** "Exploration"
>
> **transit:** "The trees close out the light behind you. Among the
> damp ferns the air lies still, smelling of wet moss and rotting
> wood."
>
> **body:** "The undergrowth narrows the path into a wall of fallen
> trunks. The thicket is silent on every side, and tells you nothing
> of who lives in it."
>
> **Options:**
> - *Examine the ground*
> - *Examine from above*

#### Check `gob-tracce-per` (PER)

> **title:** "Examine the ground"
>
> **transit:** "You crouch among the roots. Beneath the leaf litter,
> the earth still holds marks the wood has not had time to erase."
>
> **body:** "You crouch where the moss gives way to dark earth,
> searching the wet leaves for a sign."
>
> **failHint:** "The leaves settle back into place, but your own prints
> stay pressed in the damp earth."

| verdict | verdictFlavor |
|---|---|
| bigwin | "Beneath the rotting leaves, light prints surface — and further on, in the tall grass, the thin glint of a bell wire strung at shin height." |
| win | "Bare heels in the damp earth and low snapped branches draw a slanting trail that points deeper into the wood." |
| almost | "Overlapping, muddled prints in the soft ground: someone passed, but the direction dies among the roots." |
| fail | "Only bare roots and rain-turned soil. The ground yields you nothing." |
| epicfail | "Your foot gives on the sodden moss and you go down through the dry branches with a crash that bounces through the silence of the wood." |

#### Check `gob-tracce-perfor` (STR+PER)

> **title:** "Examine from above"
>
> **transit:** "An old oak rises above the undergrowth. The lowest
> branches are within reach, but the bark is rough and cracked."
>
> **body:** "The oak's trunk is damp and rough under your palms; higher
> up, the dome of leaves closes off everything beyond."
>
> **failHint:** "The wood creaks under your weight. A thin branch bends
> and snaps back with a sharp crack."

| verdict | verdictFlavor |
|---|---|
| bigwin | "From above the wood changes face: a thread of smoke rises straight over the camp's clearing, the trampling spirals around the fires and, far from the tents, a patch of undergrowth looks put back with too much care, like a stitched wound." |
| win | "Through the high branches you spot the camp's grey smoke and, far from the fires, a patch of undergrowth put back with too much care, like a stitched wound." |
| almost | "The wind opens the fronds for an instant: you glimpse a thread of grey smoke among the treetops before the leaves close over the sight." |
| fail | "The crown is a green wall and your arms burn from the climb: you come down with bark under your nails, having seen nothing past the trees." |
| epicfail | "The rotten branch gives with a crack under your weight: you drop through the lower boughs and slam your shoulder into the ground." |

#### F2 — Loot `gob-bottino` (hidden node, direct recovery)

> **title:** "What was hidden"
>
> **transit:** "The patch of undergrowth set back with too much care is
> still there, apart from the fires."
>
> **body:** "The leaves come away in a single handful. Beneath, in a
> hide-lined hollow, lies what the goblins buried in secret: you reach
> in and pull it out."
>
> **action:** "Recover the loot"

#### F3 — Rules of engagement `gob-accampamento` (choice)

> **title:** "Rules of engagement"
>
> **transit:** "Past the last curtain of ferns, the sharp smell of
> rancid fat hits you in the half-light."
>
> **body:** "Low embers burn at the clearing's heart. Short shapes move
> between the crooked tents: all that remains is to choose how to get
> in."
>
> **Options:**
> - *Move through the shadows*
> - *Charge with bare steel*

#### Check `gob-stealth` (AGI)

> **title:** "Move through the shadows"
>
> **body:** "You advance bent low where the undergrowth's shadow
> touches the clearing's edge, measuring every foothold."
>
> **failHint:** "The wire tightens under your weight. A bell quivers,
> barely."

| verdict | verdictFlavor |
|---|---|
| bigwin | "You slip past a bell wire without stirring a breath: you are already behind them while they still stare at the fire." |
| win | "A step, a pause, another step in the dark. You cross the outer perimeter without a single leaf speaking." |
| almost | "You brush a bell that sways faintly: near the fire a head turns, then hesitates." |
| fail | "A wire bites your boot and a bell rasps in the night: the shapes around the fire spring up." |
| epicfail | "You trip full into a taut wire and the bells erupt in a single sound: the whole camp pours out at you." |

#### Check `gob-assalto` (STR)

> **title:** "Charge with bare steel"
>
> **body:** "You tighten your grip on the hilts and burst out of the
> scrub, charging straight for the ring of fire."
>
> **failHint:** "The wood groans under the push. On the other side,
> something thuds against the barrier."

| verdict | verdictFlavor |
|---|---|
| bigwin | "You smash through the entrance barricade on sheer momentum: you are already on top of the fires before the first scream takes shape." |
| win | "You break the camp's edge shoulder-first, carrying your blades inside the circle of light." |
| almost | "The soft ground brakes your boots on the last step: you enter the clearing as the first guards are already rising." |
| fail | "The mud under your feet snaps the run's momentum; before the fires the wall of points is already tight." |
| epicfail | "Your foot slides in the mire at full run: you fall forward against the barricade, guard wide open." |

#### F4 — Combat `gob-combattimento` (combat)

> **title:** "Iron and ash"
>
> **transit:** "Your breath closes in your throat. Then there is only
> the sound of iron."
>
> **body:** "Trampled embers, hoarse screams bouncing between the
> trunks, and the warm taste of copper on your tongue. Every shape
> around the coals has teeth and a blade."
>
> **previewHint:** "Amid smoke and flame, even the shadows seem to have
> teeth."

Attack lines — in config as of the r008 sync (`combat.attackLines` on
the node; `GOBLIN_ATTACK_LINES` stays the engine fallback):

| verdict | line |
|---|---|
| bigwin | "The full weight of your body falls into the cleave and breaks through the guard in front of you." |
| win | "The dry clash of steel splits the shield-wood, and the noise stays in your ears." |
| almost | "The fire turns every blade into a crooked flash: the cut bites, but only in passing." |
| fail | "The blow dies on greased leather and warped wood, leaving your wrist humming on empty air." |
| epicfail | "The slick ash betrays your heel and a hit from the flank pours the breath back into your throat." |

#### F5 — Pursuit `gob-incalzare` (choice, survivors only)

> **title:** "Pursuit"
>
> **transit:** "The last embers smoke on the trampled earth. Deeper in
> the wood you hear the frantic rustle of those fleeing into the
> night."
>
> **body:** "Those still standing throw themselves among the trees
> without looking back, swallowed piecemeal by the dark: a back, a
> gasp, a swaying branch."
>
> **Options:**
> - *Let them flee*
> - *Run them down*

#### Check `gob-incalza-check` (STR)

> **title:** "Run them down"
>
> **body:** "You dash under the low fronds after the sound of fleeing
> steps, where the ground drops steep between wet stones and roots."
>
> **failHint:** "A slab shifts under the weight of your boots. The
> scree grants no safe step."
>
> **previewHint:** "Among the rocks, every turn erases for an instant
> what waits beyond."
>
> **upfrontDamage:** 10 HP; 20 HP on epicfail.

| verdict | verdictFlavor |
|---|---|
| bigwin | "You reach them where the gorge narrows, and the wood goes suddenly mute." |
| win | "Your stride outruns theirs on the stone rise: the rustling ahead dies beneath your blows." |
| almost | "Your throat burns at every breath; you catch them down at the gorge's end, but the thicket closes over the faster backs." |
| fail | "The wet stones betray your step and the thicket takes them back before the blades arrive." |
| epicfail | "You slide down the escarpment, striking hard against living rock, while the fleeing steps are lost." |

#### F6 — Raid `gob-esplora-extra` (choice, push-your-luck)

> **title:** "Among the ashes"
>
> **transit:** "Silence falls again over the ruined clearing, broken
> only by the creak of fire-blackened wood."
>
> **body:** "Around the dead embers lie torn tarps and heaps of
> smouldering straw the flame has not yet fully consumed."
>
> **Options:**
> - *Rummage through the embers*
> - *Stop here*

#### Check `gob-cerca` (INT/PER)

> **title:** "Rummage through the embers"
>
> **body:** "You lift the blackened tarps with the flat of your blade,
> groping through the acrid warmth rising from the camp's remains."
>
> **failHint:** "A beam creaks above you. A rain of ash falls to the
> ground."
>
> **previewHint:** "The smoke veils the camp again; the burnt wood
> gives at the slightest knock."

| verdict | verdictFlavor |
|---|---|
| bigwin | "Under the deepest layer your fingers meet the heavy leather of a chest spared by the flames." |
| win | "From the blackened remains you pull out what the fire failed to devour." |
| almost | "A short grab in the smoke, while a burnt support gives way a breath from your shoulder." |
| fail | "Only warm ash clinging to your palms through the gloves." |
| epicfail | "The tent's blackened beam gives with a crash, pouring a rain of burning embers and split wood over you." |

#### F7 — Return / Ambush

`gob-ritorno` (info):

> **title:** "The return"
>
> **body:** "The air turns colder beneath the high crowns. Someone
> loosens their grip on the hilt — then a branch snaps where the wind
> does not blow."

`gob-agguato` (harm):

> **title:** "Those who were left"
>
> **body:** "The surviving goblins were waiting for you. They still
> carry the smoke of their camp on them: they tracked you all the way
> here, and now they step out of the fronds without a cry, teeth
> already bared."
>
> **previewHint:** "Among the trees, the shadows move before you can
> make out the bodies."
>
> **revealHint:** "The fugitives' tracks criss-cross around the trail.
> They did not end up here by chance."

`gob-agguato-scelta` (choice):

> **title:** "Encircled"
>
> **transit:** "The arrows still quiver in the trunks around you."
>
> **body:** "Low blades close off the path between the trees, and the
> snarling rises on every side."
>
> **Options:**
> - *Leave the trophy*
> - *Stand and fight*

`gob-ultimo-scontro` (combat, 1 turn):

> **title:** "The last assault"
>
> **transit:** "Shoulder to shoulder. The impact comes from every
> side."
>
> **body:** "They throw themselves on your shields heedless of the
> steel; from their throats comes no word any more, only a long low
> breath, teeth clenched."

Attack lines — in config as of the r008 sync (`combat.attackLines` on
the node):

| verdict | line |
|---|---|
| bigwin | "All the melee's fury pours into a single cleave, and the circle opens." |
| win | "Steel answers steel with a short sound that cuts the snarl." |
| almost | "The blades seek each other in the dim light and meet only halfway." |
| fail | "Teeth grate on the shield while the line holds by a breath." |
| epicfail | "A counterblow out of the dark takes the ground from under your feet for one endless instant." |

`gob-fine` (end):

> **title:** "Cold ash"
>
> **transit:** "The trees thin into the grey of dawn; the smell of
> smoke and iron stays stitched to you."
>
> **body:** "Your hands still bear the mark of the night, while the
> trees' shadow closes behind you. Deep in the thicket the smoke still
> rises straight — but it calls no one any more."

---

## Delta rimasti (dopo il manoscritto r008 e il sync del 2026-10-19)

**Sync r008 → runtime/contratto — applicato 2026-10-19 (R-219):**

- `scenarios/goblin.ts` riscritto al render EN r008: F1 «Exploration»
  (le opzioni restano «Examine the ground» / «Examine from above»),
  check titles = gesto («Move through the shadows», «Charge with bare
  steel», «Run them down», «Rummage through the embers»), F2 «What was
  hidden» (choice a opzione unica, invariata la convenzione), F3
  «Rules of engagement», F4 «Iron and ash» con `combat.attackLines` in
  config, F5 «Run them down», F6 «Among the ashes», F7 «Those who were
  left» / «Encircled» / «The last assault» con attackLines authored,
  `gob-fine` «Cold ash» con la closingLine fusa nel body.
- `questRun.ts`: log engine riallineati alla nuova fiction —
  `gob-tracce-per` epicfail −10 HP ora è «The dead branches tear you on
  the way down.» (la «lama nascosta» non esiste più: il danno cablato
  v3 resta, la causa narrata è la caduta tra i rami); `gob-tracce-perfor`
  distingue «The climb costs you.» (fail) da «The fall costs you.»
  (epicfail).
- `GOBLIN_ATTACK_LINES` (motore) invariate: ora irraggiungibili per la
  quest goblin (entrambi i combat hanno `attackLines` authored) —
  restano fallback per eventuali quest future senza righe in config.
- Fixture/test: `goblin.oracle/coverage/checks` rigenerate via
  `generate-quest-scenario-fixture.mts` + `UPDATE_QUEST_FIXTURES=1`
  (re-baseline intenzionale, come per R-135).
- Riferimenti indiretti aggiornati: `quest-goblin-fun-audit.ts` (mappa
  label), strategie auto-play di `_tmp-play-quest-window.ts` e
  `quest-theatre-playtest.ts` (regex `Rummage`).

**Residui aperti dopo il sync r008:**

- Arte F1/F2 stale rispetto alla r008: `sentiero-tracce.jpg` mostra
  solchi di ruota, `carro-nascosto.jpg` mostra un carro mercantile —
  fiction revocata (niente carri/strada). La rigenerazione richiede
  ruling Director (v. `CATALOG.md` «Mancanti/pending» e prompt F1/F2
  marcati STALE in `.mw/specs/quest-goblin-scenes/`).
- `PHASE_ICONS` ha indici 0..7: i beat goblin ora occupano 0..6 —
  l'icona dell'indice 7 non è più raggiungibile in questa quest.
- `composeEndingText` invariato: il bilancio meccanico (morti, bottino,
  XP) resta nel report/log, non nella prosa — coerente con la regola
  r008 «la UI conta, la prosa descrive».

**Sync v3 → runtime/contratto — applicato 2026-10-18 (R-219):**

- `scenarios/goblin.ts` riscritto alla v3 EN: label F1 («Examine the
  ground» / «Examine from above»), F2 = choice a opzione unica
  («Recover the loot» → `next` diretto, nessun check né schema nuovo),
  F3 «Rules of engagement», offer/beats/epilogue senza guado, `beats`
  rinumerati 0..6 (convenzione engine — il filler «Assignment» è uscito).
- `options[].detail` → **decisione ratificata: detail non-spoiler**
  (stat + gesto, mai scopo né esito — es. «Perception. You crouch among
  the roots.»). Schema invariato.
- `gob-tracce-per` epicfail → **decisione ratificata: danno cablato**
  (−10 HP su epicfail, lama nascosta nel terreno) — il flavor è reale.
- `composeEndingText`: callback al guado rimosso («the village breathes
  again» / «the goblins keep the wood»); `GOBLIN_ATTACK_LINES` e
  `GOBLIN_F6_CREAK_LINES` → righe v3.
- `contract-v1.json` riscritto ai fatti v3 (bosco, nascondiglio come
  sorpresa, F2 senza prova, F7 superstiti in agguato per
  rabbia/vendetta); `GUADO_VOCAB` → `BOSCO_GOBLIN_VOCAB` (id
  `bosco-goblin`) con `guado/strada/carro/mercante/masso` in `vietati`
  — il gate li blocca meccanicamente.
- `narrationPrompt.ts`: VOICE_ANCHORS v3, convenzione detail
  non-spoiler, nuova classe critic `outcome-spoiler`.
- `QUEST_RULES.md` §7b: nota source corretta (guado revocato).
- Fixture/test: `goblin.oracle/coverage/checks` rigenerate; strategie
  sweep/playthrough e `questCertainty`/`questFrontier` allineate a F2.

**Residui aperti dopo il sync:**

- Arte F1/F2 stale rispetto alla v3: `sentiero-tracce.jpg` mostra solchi
  di ruota, `carro-nascosto.jpg` mostra un carro mercantile — fiction
  revocata (niente carri/strada). La rigenerazione richiede ruling
  Director (v. `CATALOG.md` «Mancanti/pending» e prompt F1/F2 marcati
  STALE in `.mw/specs/quest-goblin-scenes/`).
- `PHASE_ICONS` ha indici 0..7: i beat goblin ora occupano 0..6 — l'icona
  dell'indice 7 non è più raggiungibile in questa quest.

Applicati 2026-10-08 (P0, solo testo — zero RNG, zero calibrazione):
filo d'allarme, indizio visibile del masso, assalto fisico, attack
lines, righe di danno per gravità, fix F5-win (contraddiceva lo
sterminio), cassa semibruciata + righe-per-turno in F6, sollievo→shock
in F7, epilogo con registro, transit hold ∝ parole (`questLabPacing`).
Inoltre (2026-10-08, Director): re-mapping nomi↔stat in F1 — «Cercare
tracce» = PER pura (bonus stealth), «Arrampicarsi sull'albero» = STR+PER
(dall'alto rivela la nicchia → F2; il fallimento è la caduta, −10 HP —
e l'epicfail «ramo marcio» ora descrive il meccanismo giusto).

Ancora aperti:

1. Interpolazione slot nei transit (`{leader}`…): richiede supporto nel
   motore — finché non esiste, i transit restano name-agnostic.
2. `options[].consequence`: campo nuovo candidato — frase d'esito delle
   scelte senza check (F5 lasciar fuggire, F7 mollare il trofeo).
3. P1 rimandati (doc R-103): griglia F4 fase×banda, transit F4→F5 sullo
   stato del party, testo condizionato a flag (sentinella F1→F3, goblin
   riconoscibile F5→F7), metriche emotive M2/M6/M7/M8 nello script MC.
4. Morale dei goblin: **deciso dal Director 2026-10-08 — no** (né
   meccanica né readout; la rotta resta implicita nel contatore turni).
5. Budget di rischio: calibrare via MC prima di scrivere cifre nei flavor.

---

## Note aperte (da chiudere col Director)

**Chiusi 2026-10-06:** XP sempre · trofeo → reward reale al ritorno (Gold per
ora) · nessun vincolo min/max party (mock: 4 slot) · escalation piatta dopo
T3 con valori placeholder · consumabili solo prima di check/scelta · F4 =
1 colpo a T1–T2, 2 colpi da T3 a bersagli diversi · F1-PERCEZIONE → bonus
Stealth F3 · F3 semplificato (stesso bonus, rischio diverso) · F5 a bande
(**v2 2026-10-08**: pedaggio deterministico sempre, fuga → agguato mite;
lasciar fuggire → agguato peggiorato) · F6/F7 = greed trap voluta ·
HP: eroe 100 / altri 60 (mock, ereditati dalle stat reali) · F7 = turno
secco F4-like + 5 danni secchi a tutti · F1 = solo 2 check.

**Ancora aperti:**
- Valori esatti: danni per turno di F4, entità dell'agguato F7 (X danni
  secchi, mite vs peggiorato), durata/limite di F6, +Danno/Allerta di F3 —
  calibrazione da fare (placeholder, via Monte Carlo).
- ~~Struttura del combattimento F7~~ → **ratificato**: un turno secco come
  F4 + 5 danni secchi a tutti all'ingresso (Director 2026-10-06).
- ~~Modello HP~~ → **ratificato**: i PG hanno HP (mock eroe 100 / altri 60,
  ereditati dalle stat reali del PG in produzione).
- Soglia morte per HP: quando un PG arriva a 0 HP → morte? ferita? Da
  confermare (interpretazione probabile: 0 HP = morte, ferita = meccanica
  separata già vigente).
- ~~Testi per esito~~ → **manoscritto v3 (Director 2026-10-18, R-219)**
  in IT + EN: transit, action names, verdictFlavor a 5 bande, attack
  lines, previewHint/revealHint, gesto unico sui nodi reward.
  Sincronizzato col config il 2026-10-18 — vedi «Delta rimasti».
- Budget di rischio: proposta con cifre placeholder, da calibrare via MC.

<!-- ===== repo-snapshot/GAME_INVASION_SEQUENCE.md ===== -->

---
title: /game — sequenza evento invasione
type: reference
updated: 2026-10-19
plan: plans/PLAN-033-game-event-shroud-goblin-march.md
---

# /game — sequenza evento invasione

Come si svolge, oggi, l'evento d'invasione su `/game` (`src/pages/game-frame-pixi.tsx`). Il piano di riferimento è PLAN-033.

## Sequenza

1. **Tendina.** Il Director avvia l'evento (`startInvasion` in dev, o l'azione dal pannello). `WorldSurfaceEventShroud` chiude due metà di nuvola pergamena/ottanio. Ogni metà è un box di **125vw** (vedi `trailer.css`, `.ws-event-shroud__half`): così le due parti opache si sovrappongono al centro e non lasciano striscia di mappa visibile. La copertura è stata verificata sui pixel degli asset.
2. **Card.** Dopo 700 ms la card (`WorldSurfaceEventCard`) appare **nell'overlay a schermo**, non sulla mappa. È centrata sull'area libera fra le bande HUD, calcolata dagli inset di `safeFit`. Scala 1 (460 px di design). Non è più dentro `worldBoxRef`, quindi non viene coperta dai pannelli.
3. **Strappo dello sticker.** Al click su "conferma" la card entra in `peeling`: la teca mostra il proprio distacco (il bordo bianco si scopre, `clip-path` 0,9 s). Alla fine dello strappo lo sticker prende il posto del goblin della teca **nella posizione e nella scala misurate** (`getBoundingClientRect` del goblin della teca, non una scala calcolata a mano) e la teca nasconde il suo. Un solo goblin è visibile in ogni fotogramma. _(Sostituisce la versione del 2026-10-12, in cui lo sticker compariva al primo fotogramma dello strappo: il distacco non si vedeva, era un «pop» — rifiutato dal Director il 2026-10-14.)_
4. **Caduta e consegna.** Lo sticker vola dalla teca al marker del goblin (misurato sullo schermo, `landingSelector`) e a quel punto si smonta: il marker, rimasto nascosto fino ad allora (`goblinLanded`), prende il suo posto. Il goblin resta come **anchor sulla mappa**: la sua posizione è `progresso = (giornoCorrente − startDay) / INVASION_MARCH_DAYS`, limitato fra 0 e 1. **Alla riapertura della pagina l'invasione confermata viene ripristinata**: il clock di gioco si reidrata (`initializeMinimalGameplayStore` ripristina `currentDay`/`currentTick` al momento del save), `invasion_v1` viene letto solo *dopo* l'hydration, così il marker monta già posato sulla posizione salvata senza scatti e la riga registro è presente. Il teatro d'annuncio (tendina, card, strappo) è transitorio e **non viene mai replicato**: un reload a metà sequenza riprende allo stato post-conferma. _(Ruling Director 2026-10-19, opzione A — sostituisce la wipe-on-open del 2026-10-14, motivata all'epoca dalla premessa oggi falsa che il clock non si reidratasse.)_
5. **Registro.** Alla conferma il registro eventi (`HudEventLedger`) si apre **e resta aperto** (lo chiude il giocatore). Si apre senza ri-inquadrare la mappa (`ledgerFitIgnored`: la camera non si muove durante la scena). La riga dell'invasione esiste ma è nascosta (`arriving`); durante la caduta la card si ripiega sulla riga — stesso centro, larghezza e altezza della riga (`rowSelector`, `MORPH_MS` 1,1 s) — poi svanisce e la riga appare (`onArrive`). _(Sostituisce il «peek» da 1 s che richiudeva il registro e ri-inquadrava la mappa due volte — rifiutato dal Director il 2026-10-14.)_

## Costanti da sapere

- `INVASION_LAND`, `INVASION_VILLAGE`: punti normalizzati su 4240×2828.
- `INVASION_MARCH_DAYS = 30`, `INVASION_WARNING_DAYS = 5`.
- `INVASION_SCREEN_SCALE = 1` (scala della card a schermo).

## Test

- `tests/e2e/idleVillage/gameInvasionSequence.spec.ts`: BV-1 (le metà chiuse si sovrappongono al centro) e BV-2 (card dentro la viewport, in fascia centrale), a 16:9 e 21:9. Usa `window.__idleVillageTestHooks.startInvasion`.
- `tests/e2e/idleVillage/gameInvasionScene.spec.ts`: la scena dopo la conferma, campionata a fotogrammi: un solo goblin, lo sticker parte dove era il goblin della teca, camera ferma, la card si ripiega nella riga, il registro resta aperto.
- `tests/unit/idleVillage/regionOutline.test.ts`: tracciato e semplificazione dei contorni delle regioni.

## Limiti noti

- Il goblin si sposta a scatti di un giorno di gioco, non in modo continuo.
- L'esito al giorno 30 non è implementato: è l'evento di difesa del villaggio, futuro.
- **BV verificate 2026-10-19** (record `.mw/runs/PLAN-033/bv/record.md`, gate «BV PASS sul merito»): BV-1/BV-2 Playwright 4/4 a 16:9 e 21:9, BV-3 per-frame via sampler rAF in-page, BV-5 registro aperto/resta aperto, BV-6 anello regioni sotto nuvole via seam `__worldLayers`.
- **BV-4 / R-119 risolto 2026-10-19** (ruling Director opzione A): la premessa «il clock non si reidrata» era stale — `initializeMinimalGameplayStore` ripristina giorno e tick al save-time. Ora `invasion_v1` è letto dopo l'hydration e l'invasione confermata torna sulla mappa alla posizione salvata; spec `gameInvasionMarch.spec.ts` aggiornata di conseguenza.
