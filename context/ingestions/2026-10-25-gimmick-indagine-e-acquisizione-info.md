---
title: "Ingestion — Gimmick «indagine»: deduzioni fallibili, sicurezza, acquisizione trasversale delle informazioni"
type: ingestion
date: 2026-10-25
source: "conversazione Director↔AI del 2026-10-25 (transcript parziale incollato
  in sessione Devin) + riepilogo prodotto da una sessione precedente dello
  stesso giorno; transcript pomeridiano integrale NON recuperabile"
related: R-286, QUEST_GENERATION_ARCHITECTURE.md §18.5/§19,
         QUEST_GENERATION_SPEC.md §3.1, QUEST_GENERATION_CONTRACTS.md §2,
         QUEST_RULES.md §3/§9, OPEN-021, OPEN-023, PLAN-029
status: archived — nuovo materiale in QUEST_GENERATION_ARCHITECTURE.md §19
        (PROPOSAL); questioni in OPEN-023; requisiti Director in DECISION_LOG
        2026-10-25
---

# Knowledge Ingestion Report — «Gimmick indagine e raccolta informazioni»

## 1. Source Overview

Discussione di design sulla **core gimmick investigativa** di RpgBalancer.

La fonte è composita e va letta con attenzione alla provenance:

1. **Transcript visibile** (incollato dal Director in questa sessione):
   la parte finale della conversazione — livelli di sicurezza,
   re-investigazione dello stesso indizio, e il problema dell'acquisizione
   delle informazioni (passiva e trasversale alle gimmick).
2. **Riepilogo di sessione precedente** (sempre nel transcript incollato):
   un assistente di un'altra sessione ha elencato i punti discussi nel
   pomeriggio — fallibilità reale, Agatha Christie, dichiarazione
   irrevocabile, albero degli indizi — ma **il dettaglio di quei passaggi
   non è recuperabile**: ciò che segue su quei temi è ricostruzione di
   seconda mano, marcata come tale.
3. Il compendio prodotto dalla sessione precedente e il documento
   `RpgBalancer_contesto_generazione_quest.docx` citato nella fonte
   **non sono presenti nel repository** — l'altra sessione non viveva in
   questo worktree. Nessun file `*compendio*` trovato su disco.

Contesto progetto di arrivo: la gimmick «indagine a soffio
(prove/sospetto/scadenza)» era già censita come candidata **non adottata**
in `QUEST_GENERATION_ARCHITECTURE.md` §18.5. Questa discussione la porta
da una riga a un modello articolato — con un requisito nuovo che supera
il perimetro della singola gimmick: la **raccolta passiva e trasversale**
delle informazioni.

## 2. Extraction Ledger

| ID | TYPE | STATEMENT | TEMPORAL | VERDICT | SOURCE | RELATIONSHIPS |
|----|------|-----------|----------|---------|--------|---------------|
| E-01 | REQUIREMENT | Le deduzioni investigative devono poter **fallire davvero**: una deduzione sbagliata può determinare la sconfitta della quest, non solo cambiarne il testo o imporre uno svantaggio. | CURRENT | REFINE — estende il principio vigente a una gimmick specifica | riepilogo sessione prec. + verbatim Director | applica QUEST_RULES §9 («quest infallibile = inutile», vigente 2026-10-03) alla gimmick indagine |
| E-02 | REQUIREMENT | Sullo stesso indizio si può **indagare più volte**: più interazioni, più domande; il valore (interpretazione/sicurezza) può cambiare nel tempo. Non una-tantum. | CURRENT | INTEGRATE | verbatim Director | vincola il modello info in ARCHITECTURE §19 |
| E-03 | REQUIREMENT | Le informazioni si raccolgono **anche passivamente** — in giro, dentro altre situazioni, come conseguenza di scelte fatte per altri motivi — e il meccanismo deve essere **riusabile da tutte le gimmick future**. | CURRENT | INTEGRATE | verbatim Director («molto importante») | motivazione esplicita: riuso cross-gimmick; collega OPEN-021 (risorsa info trasversale, scope meta-layer diverso) |
| E-04 | DECISION | Mappa dei due estremi del dado: **successo critico = convinzione corretta con sicurezza alta**; **fallimento critico = convinzione sbagliata con sicurezza alta**. | CURRENT | INTEGRATE | verbatim Director | ancore della tabella esiti; il motore ha già i 5 verdetti (FACT: `epicfail/fail/almost/win/bigwin`) |
| E-05 | PROPOSAL | Tre livelli di sicurezza (**basso / medio / alto**) — non due e non più di tre, «sufficienti senza complicare l'interfaccia». | CURRENT | INTEGRATE | risposta AI (proposta esplicita) | risposta alla domanda Director «medio o basta alto-basso?» — non ratificata |
| E-06 | PROPOSAL | Separare due variabili: **direzione** (l'indizio sostiene o contraddice la tesi) e **sicurezza** (quanto il personaggio è convinto della propria lettura). | CURRENT | INTEGRATE | risposta AI | fondamento del modello; E-04/E-07 ci si appoggiano |
| E-07 | PROPOSAL | Tabella esiti intermedi: `win` → direzione corretta + sicurezza media; `fail` → direzione sbagliata + sicurezza media. «Ipotesi, non regola»: il fallimento critico genera errore *radicato*, il fallimento semplice errore meno radicato. | CURRENT | INTEGRATE | risposta AI | completa E-04; `almost` escluso → E-08 |
| E-08 | UNRESOLVED | Semantica del verdetto **`almost` («quasi»)** nell'indagine: candidato = esito parziale (direzione giusta ma convinzione debole, o incertezza tra due interpretazioni). | CURRENT | INTEGRATE (come aperta) | risposta AI («da definire») | → OPEN-023; nel motore `almost` oggi non conta come passaggio (RULES §3) |
| E-09 | PROPOSAL | La sicurezza rappresenta **quanto il personaggio crede alla propria interpretazione**, non la probabilità oggettiva che sia corretta — è ciò che permette «assolutamente convinto del falso» senza che il gioco bari sui dadi. | CURRENT | INTEGRATE | risposta AI (scelta raccomandata su domanda aperta) | alternativa scartata-in-sede: sicurezza = probabilità oggettiva; → OPEN-023 se non ratificata |
| E-10 | PROPOSAL | Re-investigazione **senza auto-incremento**: ogni interazione è una *nuova* osservazione/domanda/verifica che può rafforzare, indebolire, **ribaltare la direzione**, o **radicare una convinzione falsa** (scavare più a fondo nell'errore). | CURRENT | INTEGRATE | risposta AI | implementa E-02 evitando il grinding «ripeti fino a certezza» — anti-pattern da ricordare |
| E-11 | PROPOSAL | L'indagine è **un sistema trasversale, non una modalità di gioco separata**, in tre atti: **Acquisizione** (come si entra in possesso dell'informazione) → **Interpretazione** (quale tesi sostiene, con che sicurezza) → **Deduzione** (come le informazioni permettono di formulare/verificare una conclusione). | CURRENT | INTEGRATE | risposta AI | E-03 è il requisito Director che la giustifica; la parte mancante era soprattutto Acquisizione |
| E-12 | PROPOSAL | Quattro **modalità di acquisizione** riusabili (non quattro sistemi): (1) **percezione passiva** — ingresso scena/evento/azione; (2) **osservazione intenzionale** — scelta esplicita del giocatore, qui entrano i check a 5 esiti; (3) **interazione** — domande, dialoghi, negoziazioni, reazioni NPC; (4) **scoperta emergente** — informazione come conseguenza di *qualsiasi* altra meccanica. | CURRENT | INTEGRATE | risposta AI | la (1) e la (4) realizzano il requisito passivo E-03; la (4) è il ponte verso le gimmick future |
| E-13 | PROPOSAL | Concetto di **«evento informativo»**: qualunque scena/meccanica può produrre un evento che contiene ciò che il personaggio ha percepito/appreso; il sistema investigativo decide quali interpretazioni ne derivano. **Informazione acquisita ≠ interpretazione** — è la separazione che rende possibili errori deduttivi non arbitrari. | CURRENT | INTEGRATE | risposta AI | cuore architetturale della trasversalità; seam motore esistenti: `setInfo`/`requiresInfo`, `hiddenCheck` (R-151) |
| E-14 | UNRESOLVED + PROPOSAL | Affidabilità dell'acquisizione: (A) il gioco comunica ciò che il personaggio ha **notato** (errore solo in interpretazione) vs (B) comunica ciò che **crede di aver notato** (errore già in acquisizione — personaggi inaffidabili, più potente ma meno leggibile). Proposta AI: tenere entrambe, scegliendo **per evento** tra oggettiva / parziale / fallibile. | CURRENT | INTEGRATE (come aperta + proposta) | risposta AI | → OPEN-023; si innesta sulla regola vigente dei check nascosti (RULES §3, R-151: nascosto prima, mai dopo) |
| E-15 | UNRESOLVED (provenance limitata) | Nel pomeriggio sono stati discussi: **storie di riferimento**, la questione delle **ipotesi alternative** e la **candidatura di Agatha Christie** come modello. Dettaglio non recuperabile. | CURRENT | INTEGRATE (segnalato) | riepilogo sessione prec. | non ricostruibile oltre il titolo — da riaprire col Director |
| E-16 | UNRESOLVED (provenance limitata) | Nel pomeriggio: la **dichiarazione irrevocabile della conclusione** e il rapporto tra indagine, vittoria e sconfitta (verosimilmente: il climax investigativo = dichiarare una tesi, con esito vincolante). Dettaglio non recuperabile. | CURRENT | INTEGRATE (segnalato) | riepilogo sessione prec. | collega E-01 (fallibilità) e il concetto di climax del contratto `CoreGimmick` |
| E-17 | UNRESOLVED (provenance limitata) | Nel pomeriggio: l'**albero degli indizi**, le **tesi contrapposte** e la **rappresentazione grafica delle convinzioni**. Dettaglio non recuperabile. | CURRENT | INTEGRATE (segnalato) | riepilogo sessione prec. | le «tesi contrapposte» sono coerenti col modello direzione×sicurezza (E-06); la UI delle convinzioni è subordinata al modello dati |
| E-18 | UNRESOLVED (provenance limitata) | Nel pomeriggio sono state scartate **«soluzioni che non risolvono il problema»** della fallibilità (verosimilmente: conseguenze decorative su quest imperdibile — il Director «non vuole flavour su una quest che non può essere persa»). Le singole soluzioni scartate non sono enumerabili dalla fonte. | CURRENT | INTEGRATE (segnalato) | riepilogo sessione prec. | non scrivibile come REJ-* onesta (manca la lista); registrato come limite |
| E-19 | FACT (repo) | Seam motore già esistenti per questa gimmick: 5 verdetti (`verdictTable`), `setInfo`/`requiresInfo` (info-gating su opzioni, usato da `raceGimmick`), `vars` numerico, `armRolls`/`rollFlag`, check nascosti R-151. | CURRENT | CONFIRM | codice (`questScenario.schema`, `raceGimmick.ts`, `gimmickRegistry.ts`) | la gimmick indagine non richiede un nuovo layer dati di base: richiede il *modello interpretazione* sopra `info[]` |
| E-20 | EXISTING → REFINE | «Indagine a soffio (prove/sospetto/scadenza)» era già candidata strutturale non adottata nel censimento gimmick (§18.5). | CURRENT | REFINE | ARCHITECTURE §18.5 | la discussione la sviluppa: da nome a modello — registrata come §19, status resta PROPOSAL e il cap v1 PLAN-029 è invariato |
| E-21 | CONSTRAINT (fonte) | Il transcript pomeridiano integrale e il compendio/file prodotti nell'altra sessione **non sono nel repo**; `RpgBalancer_contesto_generazione_quest.docx` non è nel repo. Questo report non copre ciò che non è in questa fonte. | CURRENT | INTEGRATE (come caveat) | questa sessione | limite del report; mitigazione: le sezioni E-15..E-18 marcano esplicitamente ciò che va ri-discusso |

## 3. New Knowledge

- **La gimmick investigativa ha un modello articolato** (era una riga di
  censimento): deduzione = conclusione dichiarata su tesi; indizio →
  interpretazione con direzione × sicurezza; mappa dei 5 esiti del dado
  sulle due variabili.
- **La sicurezza come convinzione del personaggio** (non probabilità di
  verità): il gioco può produrre «convinto del falso» senza mentire al
  giocatore sulle regole — il tiro decide *la convinzione*, la verità
  resta authored.
- **Acquisizione come layer trasversale**: il requisito Director (E-03)
  è più grande della gimmick — qualsiasi meccanica futura deve poter
  emettere «eventi informativi» che il sistema investigativo interpreta.
- **Re-investigazione senza grinding** (E-10): la ripetizione è lecita
  perché ogni interazione è un'osservazione *nuova*, mai un incremento
  meccanico della stessa barra — e può peggiorare l'interpretazione.

## 4. Confirmed Knowledge

- **Losabilità reale** (E-01) è già principio vigente: QUEST_RULES §9
  «una quest infallibile è inutile» — qui è solo applicato a una gimmick.
- **I 5 esiti del dado** esistono nel motore (`epicfail/fail/almost/win/
  bigwin`) — la domanda del Director era di mappatura, non di introduzione.
- **Info-gating e check nascosti** esistono (`setInfo`/`requiresInfo`,
  `hiddenCheck` R-151) — l'«evento informativo» proposto ha predecessori
  meccanici, la novità è il modello interpretazione sopra di essi.
- **«Indagine a soffio»** era già candidata non adottata (§18.5) —
  coerente: oggi è sviluppata, non inventata.

## 5. Refinements

- §18.5 «indagine a soffio» → ora §19 con modello completo (PROPOSAL).
- Il principio di fallibilità §9 RULES acquista un'applicazione concreta:
  non solo «check falliti = quest persa» ma «conclusione sbagliata =
  quest persa» — una forma di sconfitta *epistemica*, nuova rispetto a
  ferita/morte/fuga.

## 6. Corrections

Nessuna — la fonte non contraddice documentazione esistente.

## 7. Decisions

**Director-stated (requisiti di design):**

- D-INV-1 (E-01): deduzione fallibile → sconfitta reale della quest.
- D-INV-2 (E-02): indizi re-investigabili, valori evolvono nel tempo.
- D-INV-3 (E-03): raccolta passiva e trasversale alle gimmick — requisito
  architetturale, non feature della singola quest.
- D-INV-4 (E-04): ancore estreme della mappa esiti (crit-success =
  corretta+alta; crit-fail = sbagliata+alta).

**Nessuna proposta AI è ratificata.** Registrate in DECISION_LOG
2026-10-25 con la separazione Director/AI esplicita.

## 8. Research

Nessuna ricerca esterna in questa fonte. Il riferimento «Agatha
Christie» (E-15) è una candidatura discussa a voce, non un finding.

## 9. Rejected Approaches

- **Sicurezza = probabilità oggettiva di correttezza** — scartata in sede
  dalla proposta AI (E-09): renderebbe impossibile «convinto del falso»
  senza barare sui dadi. Non è un REJ-* del progetto: è una distinzione
  interna alla proposta.
- **Auto-incremento di sicurezza a ogni interazione** — scartato in sede
  (E-10): permetterebbe grinding «ripeti fino a certezza».
- Le soluzioni scartate nel pomeriggio (E-18) non sono enumerabili → non
  si creano voci REJ-* inventate.

## 10. Unresolved Questions

Raccolte in **OPEN-023** (`context/OPEN.md`):

1. Semantica di `almost` nell'indagine (E-08).
2. Sicurezza soggettiva vs probabilità (E-09 — proposta, da ratificare).
3. Affidabilità per-evento in acquisizione: oggettiva/parziale/fallibile
   (E-14).
4. Forma del climax investigativo: la «dichiarazione irrevocabile» (E-16)
   — cosa si dichiara, quando, con quali conseguenze.
5. Albero degli indizi / tesi contrapposte / rappresentazione delle
   convinzioni (E-17) — modello dati e UI.
6. Come gli eventi informativi passivi entrano nel run state (E-13) —
   `info[]` basta o serve un layer «interpretazioni»?
7. Contenuto pomeridiano non recuperabile (E-15..E-18) — da ri-coprire
   col Director.

## 11. Conflicts

Nessun conflitto con la conoscenza esistente. Due **tensioni da tenere
d'occhio** (non conflitti):

- **E-14(B) vs regola check nascosti** (RULES §3): un'acquisizione
  fallibile significa che il gioco può presentare un'informazione
  *sbagliata* come vera — la regola vigente impone che «il perché delle
  cose non è mai nascosto dopo»: quando l'errore si risolve, la
  rivelazione retroattiva va progettata esplicitamente.
- **E-03 vs F12 della ricerca canali** (`QUEST_GIMMICK_CHANNELS_RESEARCH`):
  se la sicurezza fosse un semplice contatore di successi/fallimenti,
  replicherebbe il «failure counter dissociativo» delle skill challenge
  4e — la separazione direzione×sicurezza e la re-investigazione
  non-meccanica vanno proprio contro quel rischio.

## 12. Changes of Direction

Nessun cambio di direzione. Sviluppo di una candidata già censita.

## 13. Documentation Changes

Applicato:

- `context/QUEST_GENERATION_ARCHITECTURE.md` — **nuova §19**: modello
  articolato della gimmick indagine + acquisizione trasversale (PROPOSAL).
- `context/QUEST_GENERATION_SPEC.md` §3.1 — riga roster: `investigation`
  come candidata discussa 2026-10-25 (PROPOSAL).
- `context/OPEN.md` — **OPEN-023** (le 7 questioni di §10).
- `context/DECISION_LOG.md` — entry 2026-10-25 (requisiti Director vs
  proposte AI, separati).
- `context/INDEX.md` — riga per questo report.
- `RICHIESTE.md` — **R-286** (la richiesta di compendio).

Non toccato: `CANON.md` (richiede approvazione esplicita), `QUEST_RULES.md`
(nessuna regola nuova ratificata — le proposte vivono in §19/OPEN-023).

## 14. Implementation Impact

Futuro, **nessuna implementazione autorizzata**:

- Il roster gimmick operativo resta cap 2 (`race`, `flood-vault`,
  PLAN-029); `meld` è già in coda come terza candidata — `investigation`
  si accoda *dopo*, salvo ruling Director sul prossimo slot.
- Se adottata: serve un layer «interpretazioni» sopra `info[]`
  (direzione × sicurezza × storia delle re-investigazioni), la mappa
  esiti→interpretazione in `verdictTable`, e un punto di «dichiarazione»
  nel grafo (climax investigativo) — tutto compatibile con
  authored-graph-no-runtime-mutation.
- L'acquisizione trasversale (E-13) è il pezzo con più blast radius:
  emettere eventi informativi da gimmick non-investigative richiede una
  convenzione condivisa — il momento per fissarla è la spec del
  generatore, non un refactor del motore.

## 15. Argomenti trattati

- Fallibilità reale delle deduzioni (quest persa per errore epistemico).
- Tesi, indizi, direzione × sicurezza come variabili separate.
- Livelli di sicurezza: due vs tre (proposta: tre).
- Mappa dei 5 esiti del dado sul modello (estremi Director, intermedi AI,
  `almost` aperto).
- Sicurezza soggettiva del personaggio vs probabilità oggettiva.
- Re-investigazione dello stesso indizio senza grinding.
- Acquisizione informazioni: passiva, intenzionale, per interazione,
  emergente — e il requisito di trasversalità su tutte le gimmick.
- «Evento informativo»: informazione ≠ interpretazione.
- Affidabilità dell'acquisizione: oggettiva / parziale / fallibile.
- (Pomeriggio, non dettagliato): Agatha Christie e storie di riferimento;
  dichiarazione irrevocabile; albero indizi / tesi contrapposte / UI
  delle convinzioni; soluzioni scartate.
- Gimmick esistenti citate: `race` (gara di avanzamento) come esempio di
  gimmick che produrrà eventi informativi.

## 16. Problemi risolti

- «Come rappresentare risposta giusta/sbagliata a sicurezza bassa» →
  modello direzione × sicurezza con tre livelli (proposta E-05/E-06/E-07;
  da ratificare).
- «Come si raccolgono le informazioni fuori dalle scene investigative» →
  separazione Acquisizione/Interpretazione/Deduzione + quattro modalità +
  evento informativo trasversale (proposte E-11/E-12/E-13).
- «Accesso alla conversazione del pomeriggio» → non risolto
  integralmente: contenuto recuperato solo come riepilogo (E-15..E-18);
  il compendio della sessione precedente non è su disco.

## 17. Ripresa della conversazione

**Stato:** la gimmick investigativa è un modello PROPOSAL completo a
livello concettuale (ARCHITECTURE §19), con requisiti Director chiari e
proposte AI non ratificate. Non c'è piano né implementazione autorizzata:
il roster operativo è fermo a race/flood (cap PLAN-029), meld è la
prossima candidata in coda.

**Thread aperti:** le 7 questioni di OPEN-023 — le più strutturali sono
la forma del climax investigativo (dichiarazione irrevocabile) e il layer
«interpretazioni» nel run state; la più urgente dal punto di vista del
Director è ri-coprire il materiale pomeridiano non recuperabile
(E-15..E-18).

**Prossimo passo atteso:** riportare al Director questo compendio per
verifica (R-286 `da verificare`); se il modello regge, il percorso
naturale è una desiderata per la gimmick indagine → spec tipo
`QUEST_GIMMICK_*` come per i canali (R-128) → eventuale slot nel roster.
