---
title: Quest Opportunity Layer — grafo delle opportunità, famiglie, requisiti e ricompense
type: design-knowledge
status: PROPOSAL — candidati non ratificati (da discussione Director↔GPT 2026-10-11; tracking in context/OPEN.md OPEN-019/020/021)
updated: 2026-10-11
provenance: sintesi del Director di una discussione con ChatGPT; ledger di estrazione in context/ingestions/2026-10-11-quest-opportunity-layer.md
related: R-153, QUEST_ECONOMY_NOTES.md, QUEST_GENERATION_SPEC.md,
         QUEST_GENERATION_ARCHITECTURE.md (§15 chain quest), QUEST_RULES.md,
         OPEN-010, OPEN-012, OPEN-013, OPEN-015, OPEN-016,
         OPEN-019, OPEN-020, OPEN-021, PLAN-026, PLAN-028, NARRATIVE.md,
         VILLAGE_ECONOMY.md, GAMEPLAY_DESIGN.md
---

> **Status:** PROPOSAL. Tutto il contenuto di questo documento è
> candidato di design — nessuna regola vigente. Ratifica pendente in
> OPEN-019/020/021 e nel filone economia-villaggio (OPEN-010/012).

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

Aperto (OPEN-019): struttura dati del grafo, tipi di arco, come gli archi
persistenti sopravvivono alle run, come il generatore lo attraversa.

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
è un livello *sopra* core gimmick e domain kit? Una famiglia = insieme
di gimmick compatibili + catalogo di soluzioni.

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

Aperto (OPEN-020): quali requisiti sono generici, quali di famiglia,
quali di singola quest; come si dichiara il tipo nel contratto.

## 4. Ricompense che aprono porte

Una ricompensa interessante modifica **ciò che diventa possibile fare
dopo**, non solo un incremento numerico. Otto categorie candidate:

| Categoria | Cosa cambia |
|---|---|
| Accesso | sblocca luoghi, contatti, opportunità nuove |
| Informazione | rivela requisiti, pericoli, approcci alternativi |
| Mitigazione | riduce danni, rischio o conseguenze future |
| Eccezione | permette di ignorare una regola in una situazione compatibile |
| Conversione | trasforma una risorsa/capacità in un vantaggio diverso |
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
- rendere disponibili nuove quest o ricompense.

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

Estensioni candidate (nuove, PROPOSAL):

- **Orientamento**: il giocatore privilegia famiglie o tag; la
  preferenza influenza la distribuzione delle quest proposte **senza
  garantirla** — controllo strategico senza eliminare l'incertezza né le
  opportunità concorrenti.
- **Portata**: un sistema di esplorazione più sviluppato rivela più info
  sulle quest, fa emergere opportunità più difficili con ricompense
  maggiori e aumenta il numero di quest disponibili contemporanee.

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
*Tensione aperta*: party multipli in parallelo vs regola leader-capacity —
da conciliare in sede di ratifica economia-villaggio.

## 9. Architettura delle risorse

Candidato anti-moltiplicazione delle valute:

- **risorse comuni**, utili a più attività;
- **specializzazioni permanenti** dei personaggi;
- una **risorsa trasversale limitata** legata all'informazione operativa:
  conoscere meglio una missione è un vantaggio strategico spendibile,
  senza introdurre una valuta per famiglia (stealth, diplomazia,
  combattimento…).

Aperto (OPEN-021): come rappresentare economicamente l'informazione e il
costo di preparazione senza rendere le risorse troppo intercambiabili.

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
