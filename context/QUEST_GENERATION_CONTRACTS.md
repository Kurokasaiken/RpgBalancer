---
title: Quest Generation Contracts — modello minimo v0
type: contract-draft
status: PROPOSAL — deliverable pre-spec (R-113, deliverable 1-4).
  I contratti descrivono *dati*, non ancora codice. I gap motore in §10
  sono verificati sul repo e precedono qualsiasi implementazione.
source: QUEST_GENERATION_SPEC.md (specchietto), QUEST_GENERATION_ARCHITECTURE.md §13,
        ingestions 2026-10-10; schema reale verificato su
        questScenario.schema.ts + questRun.ts (2026-10-10)
related: R-091, R-108, R-111, R-112, R-113, R-114, R-116, OPEN-014,
         PLAN-019 (S5), QUEST_RULES.md, QUEST_IMPRINTS.md
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
