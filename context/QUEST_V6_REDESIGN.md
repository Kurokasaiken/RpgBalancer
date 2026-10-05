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
