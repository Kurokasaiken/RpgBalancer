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
