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
