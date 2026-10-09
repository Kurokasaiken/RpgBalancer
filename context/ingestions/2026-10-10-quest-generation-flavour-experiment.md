---
title: "Ingestion — architettura di generazione quest (gimmick/scene/hook) + esperimento flavour-separation"
type: ingestion
date: 2026-10-10
source: "trascript incollato dal Director (conversazione con AI esterna + repliche del Director); provenance del blocco architetturale ambigua — contenuto portato dal Director come direzione da discutere"
related: R-091, R-108, OPEN-014, QUEST_IMPRINTS.md, QUEST_GAMEPLAY_SCIENCE.md
status: archived — doc strutturato in context/QUEST_GENERATION_ARCHITECTURE.md
---

# Trascript archiviato — «Generazione quest: gimmick core, scene base, flavour»

## Blocco 1 — Framework proposto (architettura a tre livelli)

> Penso che sia la direzione giusta. C'è però una condizione importante: le
> scene base non devono diventare eventi generici a cui applichiamo un
> modificatore della gimmick. Devono creare una decisione locale che acquista
> un significato ulteriore grazie alla gimmick core.

**1. Architettura di generazione delle quest**

- **A. Gimmick core** — definisce il problema centrale, le variabili che
  evolvono, le condizioni di risoluzione e il tipo di dilemma caratteristico.
- **B. Scene base** — introducono ostacoli, opportunità, informazioni, costi e
  alternative. Devono essere interessanti anche localmente.
- **C. Hook della core** — modificano la scena attraverso le variabili
  centrali: cambiano costi, rischi, opzioni, conseguenze o stato del problema
  principale.
- **D. Crescendo e climax** — le scene preparano una risoluzione che dipende
  dalla gimmick core e da ciò che il giocatore ha fatto lungo il percorso.

La distinzione scena/hook è **concettuale**: non richiede due oggetti separati
nel codice.

**2. Il vincolo del 75%**

Obiettivo di design da verificare, non garanzia automatica. Almeno il 75%
delle scene non finali deve interagire con la core. Un hook è valido se
soddisfa ALMENO una di:

- modifica una variabile centrale;
- apre o chiude un approccio;
- cambia il costo o il rischio di una decisione successiva;
- crea un compromesso fra la scena corrente e la risoluzione finale;
- altera le condizioni del climax in modo comprensibile.

Anti-esempio: una scena che infligge solo danni generici NON soddisfa il
criterio; una che permette di evitarli spendendo una risorsa che servirà per
la core SÌ. Quota minoritaria di scene non collegate resta legittima
(varietà, respiro, ricompense, deviazioni).

**3. Le quattro proprietà della scelta vera**

| Proprietà | Domanda di verifica |
|---|---|
| Trade-off | Le alternative hanno vantaggi e costi differenti? |
| Conseguenza | La scelta cambia qualcosa di concreto, ora o dopo? |
| Contesto | La scelta dipende dalla situazione del party e dallo stato della core? |
| Attribuzione | Il giocatore può capire perché la sua decisione ha prodotto quel risultato? |

Diagnostica: opzione sempre migliore → scelta apparente; stesso stato
finale → cosmetica; esito solo da tiro → suspense possibile, agency no.

**4. Varietà combinatoria — i due fallimenti opposti**

- *Scene scollegate*: eventi interessanti ma trasferibili a qualsiasi quest.
- *Scene tutte uguali*: ogni evento modifica la stessa variabile con la
  stessa scelta «paga per ridurla o rischia di aumentarla».

Il catalogo scene deve contenere **archetipi decisionali diversi**: acquisire
qualcosa rinunciando ad altro; scegliere chi esporsi; interpretare
informazioni ambigue; ostacolo con approcci incompatibili; ordine delle
operazioni; sfruttare una vulnerabilità creandone un'altra. Sono famiglie di
decisioni, non gimmick — il valore dipende dal collegamento alla core.

**Proposta operativa**: catalogo di scene base con **contratti di
compatibilità espliciti** — ogni scena dichiara variabili leggibili,
modificabili, decisioni offerte; ogni gimmick core dichiara hook accettati e
conseguenze che rendono il climax significativo. Generare senza riscrivere,
senza prefabbricare.

Caveat dichiarato: il sistema aumenta la *probabilità* di divertimento,
agency, tensione — non li garantisce. Va verificata la qualità delle
decisioni e il feeling, non solo il 75%.

## Blocco 2 — Richiesta Director → AI

> «Scrivi 5 tag d flavour come li abbiamo pensati. Scegline 2 casualmente,
> prendi una delle gimmick scritte da te. Fa una quest di 5-8 scene circa con
> la stessa gimmick, stesse scene, prima con un flavour poi con un altro.
> Diamo delle % di successo ad ogni scena e cerchiamo di creare un "feeling"
> e vedere se è interessante da leggere (lo dico io) e da giocare: fai delle
> simulazioni tu e mi dici quante sono le % di successo, fallimento e quali
> sono i nodi che effettivamente sono influenti ai fini della
> vittoria/sconfitta. Che ne pensi?»

## Blocco 3 — Esperimento eseguito dall'AI

Correzione metodologica dell'AI: separare **probabilità di successo della
scena** da **probabilità di completamento della quest** (una scena può
riuscire e peggiorare il climax; può fallire senza compromettere la vittoria).

**Gimmick scelta: Gara di avanzamento** — due forze progrediscono verso
obiettivi incompatibili; le scene accelerano il party, rallentano il rivale o
concedono vantaggi a costo di risorse/ferite.

**5 tag di flavour** (ipotesi di test, non canonici): Foresta antica ·
Monastero infestato · Passo montano · Laboratorio proibito · Città assediata.

**Estratti: Monastero infestato + Passo montano.**

Modello dimostrativo: avanzamento 0→6, party vince se raggiunge 6 prima del
rivale; rivale avanza a ogni scena; percentuali **ipotetiche, non
calibrate**.

**Quest A «Il cuore del monastero»** — 4 scene: portale sigillato (75%,
+2/rivale+1), processione (65%, +2/perdi risorsa), cripta che cede (60%,
+2/danni), cuore del rituale (70%, vinci/fallisci).

**Quest B «La corsa oltre il passo»** — stessa struttura: barricata (75%),
tracce nella neve (65%), valanga (60%), convoglio sul crinale (70%).

**Simulazione preliminare (onestà dell'AI)**: con +2/successo e soglia 6, il
climax arriva in 3 successi; senza regole su avanzamento rivale, costo dei
fail, danni bloccanti, pareggi, approcci — le % di vittoria non sono ancora
calcolabili onestamente. Finding: *cambiare flavour a struttura fissa è
facile; il difficile è far interagire le scene con la core*.

## Blocco 4 — Director → AI → risposta sulla matematica

Director: «entrambe interessanti, dobbiamo usare la matematica per renderle
matematicamente interessanti, no?»

Risposta AI — modello a **tre approcci per scena** (numeri illustrativi):

| Approccio | Successo | Avanzamento | Costo del fallimento |
|---|---|---|---|
| Prudente | 90% | +1 | nessuno |
| Rapido | 65% | +2 | ferita o risorsa |
| Interferenza | 70% | rivale rallentato | il rivale avanza comunque |

Politiche da confrontare in MC: sempre-prudente, sempre-rapido,
sempre-interferenza, adattiva sullo stato della gara. Metriche: vittorie,
fallimenti, ferite, risorse, esito climax.

**Criterio di interesse matematico**: strategie con risultati diversi;
nessuna dominante ovunque; scelte precedenti che cambiano la probabilità
finale; climax incerto ma non scollegato; party diversi giustificano
strategie diverse. Replica identica su entrambi i flavour → isola l'effetto
del flavour.

Ordine corretto: **prima il dilemma interessante, poi la calibrazione**.

---

## Classificazione Devin (cosa è cosa)

- **[PROPOSAL — da ratificare]** L'architettura gimmick/scene/hook/climax, il
  vincolo del 75%, le 4 proprietà della scelta, i contratti scena↔core.
  Direzione coerente con R-108 e QUEST_GAMEPLAY_SCIENCE, ma NON canonica.
- **[EVIDENCE — prototipo]** L'esperimento flavour-separation: stessa
  struttura × 2 flavour, finding «flavour facile, hook difficile». Percentuali
  NON calibrate, esplicitamente illustrative.
- **[PRECEDENTE PROGETTO]** QUEST_IMPRINTS.md (IMPR-001, 3 istanziazioni su
  tag) e ingestion R-091 (struttura/flavor, generatore a vincoli, OPEN-014):
  il metodo flavour-separation esiste già in forma di imprint; questo
  esperimento lo estende al piano *giocabile+misurabile*.
- **[OPEN]** Le regole mancanti della Gara: avanzamento rivale per fase, fail
  consuma una fase?, danni bloccanti?, pareggi, scelta di approccio. Da
  fissare prima di qualsiasi MC (stesso principio del gate R-109: regole
  prima dei numeri).
- **[RELAZIONE CON LO SCHEMA CANONICO]** S2.1 ha appena congelato
  `QuestScenarioSchema` (nodi/opzioni authored). Il framework generativo deve
  chiarire se produce *scenari authored* (compile-time, alimenta lo schema) o
  *runtime* (motore a vincoli). Non chiesto, non deciso.
