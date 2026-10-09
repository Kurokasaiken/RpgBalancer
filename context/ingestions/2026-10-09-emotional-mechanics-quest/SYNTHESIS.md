---
title: Sintesi comparativa — Emotional Mechanics (4 AI + audit repo)
type: synthesis
date: 2026-10-09
status: draft — manca DeepSeek 2/5
based-on: 00-brief-chatgpt.md, 01-claude.md, 03-gemini.md, 04-grok.md, 05-chatgpt.md
repo-audit: src/ui/idleVillage/questS1Lab/{questRun,questScenarioGoblin}.ts,
  context/QUEST_GAMEPLAY_SCIENCE.md, context/QUEST_GOBLIN_REWORK_PROPOSAL.md,
  RICHIESTE.md R-105/R-107
---

# Sintesi comparativa — Emotional Mechanics per le quest

4 risposte su 5 raccolte (manca DeepSeek). Tutte e 4 senza accesso al repo:
il loro «audit» è ricavato dal brief. Qui i FACT sono verificati sul codice.

## 1. Convergenze — cosa dicono tutte e 4 (segnale forte)

**Diagnosi identica.** Le quest attuali producono *esito senza decisione*:
check → conseguenza → prossima fase. Il giocatore non ha niente da leggere,
anticipare o correggere. Non servono più fasi o più flavour: serve che ogni
risoluzione cambi lo stato e le opzioni successive.

**Il benchmark RPS funziona solo con un avversario leggibile.** Tutte
concordano: RPS vs RNG puro = «un generatore di numeri casuali con pulsanti»
(Claude: equilibrio di Nash). Serve un avversario con pattern inferibile ma
non deterministico. Questo è il requisito più citato e il più lontano dallo
stato attuale.

**Set di primitive quasi identico** (6–7 per risposta, ~80% sovrapposte):

| Primitiva | Claude | Gemini | Grok | ChatGPT | Stato nel repo |
|---|:-:|:-:|:-:|:-:|---|
| Duello a round / RPS con punteggio | P1 | P1 | #1 | #1 | ❌ assente |
| Push-your-luck | P2 | P2 | #2 | #2 | ✅ F6 esiste |
| Check nascosto / info a costo | P3 | P3 | #3 | #4 | ⚠️ parziale |
| Allarme con soglie qualitative | P4 | P4 | #4 | #3 | ⚠️ 3 stati, non track |
| Targeting / rischio per slot | P5 | P6 | #5 | #5 | ✅ implementato |
| Impegno irrevocabile + conseguenza differita | P6 | — | #6 | — | ⚠️ implicito |
| Stato che riscrive le opzioni | P7 | — | — | — | ⚠️ parziale |
| Timer come risorsa spendibile | — | P5 | — | (in allarme) | ❌ assente |
| Intent display (Slay the Spire) | — | sì | — | — | ⚠️ primitivo |

**Validazione: stessa proposta ovunque.** A/B «check lineari» vs «decisioni
interattive» + telemetria (cambi di strategia dopo info, % decisioni che
cambiano l'esito, distribuzione rimonte) + survey breve (agency, suspense,
equità, rimpianto). Criterio di abbandono: se le decisioni non spiegano
varianza dell'esito → il problema è il design dell'avversario, non la forma.

**Primo prototipo: il duello.** Claude, Grok, ChatGPT e Gemini (fase 1) scelgono
tutti il confronto RPS-like con check nascosto come primo esperimento — costo
basso, riusa check/slot/esiti esistenti.

**Near-miss: caveat unanime.** Clark et al. 2009: attiva circuiti di reward e
aumenta la voglia di continuare, ma non il piacere — può frustrare o risultare
«truccato». Coerente col nostro P32 («a tool, not a feature»).

**Loss aversion / prospect theory**: citata da tutte (λ≈2); implicazione
pratica condivisa: la posta deve essere *già posseduta* per creare tensione
(coerente con P4 e con TAKEN≠SECURED già in motore).

## 2. Contributi unici per AI

- **Claude**: onestà epistemica migliore (dichiara di non poter fare B/H);
  primitiva «stato che riscrive le opzioni» (fallimenti → sviluppi, non
  malus); metrica elegante di falsificazione («varianza spiegata dalle
  decisioni», simulabile in codice prima di qualunque UI).
- **Gemini**: scheda primitiva più completa (regole minime → failure mode →
  costo); **Intent System di Slay the Spire** come primitiva a sé
  (dichiarare l'azione nemica sposta la tensione da «cosa farà?» a «come
  alloco?»); claim Epstein & Roupenian (arousal massimo ~5% probabilità
  evento avverso — *da verificare*); telemetria con soglie numeriche;
  risk register; 3 open question ben poste.
- **Grok**: citazioni nominali migliori (Ortony/Clore/Collins; Lehne &
  Koelsch 2015 — modello formale della suspense: conflitto/incertezza →
  anticipazione → desiderio di risoluzione); «perceived agency > branch
  count» (Fendt/Cardona-Rivera, già nostro P52); domande giuste sullo
  stato dell'infrastruttura.
- **ChatGPT**: il più debole sul piano scientifico (PENS/flow generici,
  citazioni vaghe); utile però sulle 3 open question finali
  (notifica del check fallito, griglia parametri rischio/ricompensa,
  quanta narrativa accompagnare gli esiti).

## 3. Audit FACT — cosa esiste davvero nel repo

Verificato su `questRun.ts` / `questScenarioGoblin.ts` (motore a grafo,
«deliberately NOT a general engine», 3 quest authored: cassa/rovine/goblin).

**Già implementato (le AI non lo sapevano):**

- **Targeting posizionale reale** — `positionalWeights`: il rischio vive in
  coda (4 vivi → 0/0/20/80) e **scala tra i turni** (T1→T3 shift 10pp).
  È già la primitiva «targeting asimmetrico»: manca solo la *scelta* del
  giocatore su chi espone (oggi è il profilo che decide).
- **Push-your-luck** — F6: `exploreTurn`, danno crescente 5·N su bersaglio
  posizionale, oro per turno, stop/continue ad ogni giro. Struttura già
  presente; mancano: visibilità del rischio corrente e semantica di «bust»
  pulita.
- **Allarme a 3 stati** — `escalateCamp`: quieto → allertato → sveglio
  (−10pp ai check, bivio risveglio). **Il Director ha rimosso
  deliberatamente il meter a favore di stati nominati** — le AI propongono
  tutte track graduati; la forma importa (vedi §5).
- **Ritirata con costo** — `flee()`: si tiene il loot, si molla l'obiettivo
  (TAKEN≠SECURED già in motore). F7: agguato al ritorno → «trofeo o sangue».
- **Intent primitivo** — `nextCombatHits()` (colpi del prossimo turno) +
  `currentExposure()` (chi è esposto al prossimo colpo). Mezzo Intent
  System alla Slay the Spire già esiste.
- **Preview ricca** — `previewOption`: successPct, woundPct/deathPct *per
  slot*, contributors, bonus consumabile/intel, `failHint` («cosa cambia se
  fallisco», già allineato a P22).
- **Intel → bonus numerico** — `intelBonusFor`: info raccolte danno +5/+10
  su check specifici. E F2 esiste solo se il check STR+PER riesce:
  l'informazione *sblocca opzioni* oltre che numeri.
- **Esiti a 5 bande** — bigwin/win/almost/fail/epicfail (5/5/5 flat + tail
  ≥96), con effetti meccanici distinti (bigwin degrada morte→ferita,
  epicfail upgrade ferita→morte solo dentro la banda dichiarata).
- **Harms strutturati** — `HarmEvent` per-slot, bodyguard intercept, death
  save 5%, wounded risk bonus. La posta in gioco è già leggibile.
- **Frontier/tick** — v27: nodi maturabili a schedule assoluto, batch dei
  nodi scaduti (D-K). Esiste come *pacing*, non come *risorsa*.

**Assente (la vera lacuna, confermata dalle 4 AI):**

- **Nessun modello di avversario** — i nemici sono un contatore
  (`goblinLeft`); il «combattimento» è un check ripetuto per turno con
  contrattacco posizionale. Nessuna mossa da scegliere per round, nessun
  pattern da leggere. È esattamente il problema che il benchmark RPS
  punta.
- **Nessun check nascosto** — ogni check produce una cinematica astrolabe
  esplicita. Il flag «conosci/non sai di aver fallito» (K) non esiste.
- **Nessun timer-risorsa** — U spendibile per scouting/esecuzione non
  esiste (i tick sono gating, non budget decisionale).
- **Decisione per-round in combattimento** — oggi l'unica scelta in fight è
  «turno successivo» + consumabile. Il punteggio persistente leggibile
  c'è implicitamente (goblinLeft), ma non come struttura di gioco.

**Allineamento collaudato ma non standard**: `previewOption` mostra %
esatte — il nostro P39 dice che l'info perfetta uccide la suspense
(qualitative bands + consequence > raw %). Gemini pone la stessa questione
come open question. È una tensione reale da decidere (R-105 vuole forecast
di fascia, non % — la direzione già presa va verso le bande).

## 4. Sovrapposizione con la ricerca già fatta

`QUEST_GAMEPLAY_SCIENCE.md` copre già (con fonti *verificate*, più rigorose
delle loro): suspense=varianza×stakes×waiting (P2), stake posseduta (P4),
failure attribuibile (P6/P13/P36), push-your-luck (P18), near-miss (P32),
info perfetta vs suspense (P39), agency percepita (P52), choice overload
(P42), regret anticipato (P46), attaccamento (P15/P45), sunk-cost/ritirata
(P30/P40), arousal budget (P26). **Le sezioni C delle 4 risposte aggiungono
poco di nuovo** — il valore è nelle primitive e nei prototipi, non nella
letteratura.

Materiale realmente nuovo da raccogliere:

- **Intent System** (Gemini) — estensione naturale di `nextCombatHits`/
  `currentExposure`: dichiarare l'azione nemica, non solo il conteggio
  colpi. Costo basso, effetto grande (sposta la tensione su allocazione).
- **Modello avversario a pattern** — tabella di comportamento per nemico
  (bias, reazione all'ultima mossa, «baro»): infrastruttura nuova ma
  piccola (Claude: «due contatori + tabella»).
- **Check nascosto** — un check che risolve senza cinematica e setta un
  flag K; UI e motore hanno già `flags`/`info`. Meccanicamente banale, il
  costo è di *design* (cosa rivela, quando paga).
- **Varianza spiegata dalle decisioni** (Claude) — metrica falsificante
  che `quest-goblin-mc.ts`/`questSimulation.ts` possono già misurare *in
  codice*, senza UI né playtester: la prima validazione è quasi gratis.

## 5. Come ci aiuta concretamente

1. **Set canonico di primitive** — la sovrapposizione 80% è un segnale:
   il nucleo è {duello a stato, push-your-luck, check nascosto, allarme a
   soglie, targeting, commitment}. Da confrontare con i `QuestNode.kind`
   attuali (choice/check/combat/info/harm/end): duello e check nascosto
   sarebbero **nuovi kind**; push-your-luck e targeting sono *potenziamenti*
   di kind esistenti. Decisione architetturale collegata: restare authored-
   per-quest o aprire node-kind primitivi (open question Gemini #3).
2. **Priorità implementativa quasi unanime: il duello** — ma nel nostro
   contesto l'ordine ottimale può essere diverso: **check nascosto + intent
   display sono più economici del duello** (estensioni di flag/preview
   esistenti) e preparano il terreno per l'avversario a pattern.
3. **L'allarme**: le AI propongono meter; noi abbiamo scelto stati nominati
   (Director). Sintesi possibile: stati nominati **come** soglie
   qualitative (quieto/allertato/sveglio sono già T0/T1/T2 con effetti
   diversi, non solo malus) — la forma «track a 0-5» aggiungerebbe solo
   granularità, non decisioni. Verificare col Director prima di importare.
4. **F6 push-your-luck**: applicare la scheda — rischio visibile, «bust»
   come perdita secca vs stop consolidato, e la decisione «chi fruga»
   (targeting dentro il push).
5. **Validazione**: il piano A/B si esegue in Monte Carlo *oggi* — si può
   costruire il duellante a pattern in `questSimulation`/script e misurare
   la varianza spiegata dalle decisioni prima di scrivere una riga di UI.
6. **Ganci col lavoro in corso**: R-105 (letalità DD/XCOM, forecast a
   bande — già coerente con P39 e con l'open question Gemini #1);
   R-107/PLAN-019-S2 (offerta/scaling — le primitive sono il layer *sopra*
   l'offerta: il POI vende il rischio, la quest lo gioca);
   `QuestRunWindow`/beat sequencer (i kind nuovi ereditano la
   presentazione a beat — un duello = beat per round, naturale).

## 6. Domande aperte aggregate per il Director — RISPOSTE (2026-10-09)

Dalle AI + dalle 5 domande del brief. Il Director ha risposto a tutte le
domande rilevanti del brief:

| # | Domanda | Risposta Director | Conseguenza |
|---|---|---|---|
| Q1 | Controllo durante la quest | **Poche decisioni cruciali** (3-4 scelte grandi per run) | Il duello per-round perde il presupposto |
| Q2 | Skill del giocatore | **Gestire probabilità e rischio** (NO pattern-reading) | Il modello avversario a pattern NON è centrale |
| Q3 | Prevedibilità rischio | **Sorprese forti ma eque** — inattese ma retrospettivamente logiche | Check nascosto/info a costo = meccanismo di *fairness*, non di discovery |
| Q4 | Morte dei PG | **R-105 confermata** — DD/XCOM, morte presente, wipe raro | — |
| Q5 | Emozioni prioritarie | **Attaccamento/sacrificio + Avidità/rimpianto** | Ridisegna la classifica delle primitive (§6.1) |
| — | Preview numeri | **Numeri precisi** | Resta la preview attuale; tensione P39 accettata |
| — | Allarme | Stati nominati reggono (raccomandazione mia, non riaperta) | Nessun cambio su `escalateCamp` |

### 6.1 Effetto delle risposte sulla classifica delle primitive

Le 4 AI mettevano il **duello RPS a pattern** al primo posto — ma quel
primato poggiava su presupposti che il Director ha **rifiutati**: decisioni
frequenti per-round e skill di lettura avversario. Classifica rivista:

**Tier 1 — fit diretto con le risposte:**

1. **Push-your-luck approfondito** — è *esattamente* avidità/rimpianto, poche
   decisioni con peso (continua/fermati), gestione di probabilità note.
   F6 esiste già: serve rischio visibile, «bust» chiaro, e la decisione
   *chi espone/chi fruga* (targeting dentro il push).
2. **Esposizione/targeting come scelta** — attaccamento/sacrificio: la
   matrice posizionale esiste e scala già (T1→T3); oggi *decide il
   profilo*, non il giocatore. Dare al giocatore 1-2 decisioni di
   allocazione del rischio (chi copre, chi è in coda, chi tiene il trofeo)
   è il modo più economico di produrre sacrificio *attribuibile*.
3. **Sorprese forti ma eque** — l'agguato F7 esiste già ed è quasi-equo
   (flag `agguatoPeggiore` deciso a F5). Per renderlo *equo* serve il
   meccanismo di fairness: **info a costo** — segnali acquisibili (check
   nascosto) che il giocatore può ignorare; chi non guarda subisce la
   sorpresa *perché non ha guardato* (attribuibilità, P6/P13/P36).

**Tier 2 — supporto alle Tier 1:**

4. **Check nascosto** — infrastruttura della fairness (flag senza
   cinematica). Costo meccanico basso, costo di design medio.
5. **Intent display leggero** — `nextCombatHits`/`currentExposure` già
   esistono; estenderli serve la gestione del rischio (Q2), non la lettura
   del pattern (esclusa).

**Tier 3 — deprioritizzato dalle risposte:**

6. **Duello a pattern** — richiede decisioni frequenti + pattern-reading:
   entrambi esclusi dal Director. Resta opzione per una quest *dedicata*
   (il capo che bara) dove il pattern è il tema della singola quest, non
   una primitiva di sistema.
7. **Timer risorsa** — non serve le emozioni prioritarie; utile ma non
   prima.

**Rapporto col benchmark RPS:** il brief chiedeva «perché RPS funziona» —
la risposta (punteggio persistente, incertezza interpretabile, momento
decisivo) resta valida come *analisi*, ma il Director ha scelto di produrre
quegli effetti con gestione del rischio e poche decisioni di peso, non con
un minigioco di lettura avversario.

### 6.2 Domande rimaste aperte

- **Authored vs framework** (Gemini #3): con il duello deprioritizzato,
  l'urgenza di generalizzare cala — push e targeting sono *potenziamenti
  dei kind esistenti*, non nuovi kind. Il check nascosto è il solo
  candidato a nuovo kind; decidibile dopo il primo uso authored.
- **Notifica del check fallito** (ChatGPT #1): dipende da Q3 — «eque»
  suggerisce segnali *osservabili ma ambigui* (Claude): il giocatore vede
  che un check è avvenuto? O scopre solo le conseguenze? Da decidere
  quando si progetta il primo check nascosto.
- **Griglia parametri push** (ChatGPT #2): valori di rischio/ricompensa
  per F6+ — calibrabile in Monte Carlo, non serve risposta teorica.

## 7. Prossimi passi proposti (rivisti post-risposte)

- [ ] Incollare DeepSeek 2/5 → completare la comparazione.
- [ ] Esperimento 0 MC: simulare F6 push-your-luck con varianti (rischio
      visibile vs no, bust totale vs parziale, scelta di chi fruga) →
      distribuzioni esiti e «decisione che cambia l'esito» — quasi gratis
      con `questSimulation`/script MC esistenti.
- [ ] Prototipo authored: F6 approfondito + una decisione di esposizione
      in combat nella quest goblin (nessun nuovo kind — kind esistenti,
      flag e opzioni authored). Verificabile nel lab.
- [ ] Ingestion report canonico in `context/ingestions/` quando DeepSeek
      arriva.
