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
