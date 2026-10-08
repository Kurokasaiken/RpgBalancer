---
title: Ingestion Report — Registro narrativo del mondo
type: ingestion-report
date: 2026-10-07
source: https://chatgpt.com/share/6ac63cac-f084-83ed-8694-f80bc084e094
related: RICHIESTE.md R-093; NARRATIVE.md; context/OPEN.md OPEN-014/015/016
---

# Knowledge Ingestion Report — Registro narrativo del mondo

Report di provenienza, **non** piano approvato né specifica canonica. Lo share HTML contiene 148 nodi `linear_conversation` (147 con messaggio), incluso il prompt iniziale, le domande del Director, ricerche/proposte ChatGPT, quattro critiche AI riportate dal Director e un macro-piano finale **proposto dall'assistente**. `webfetch` rendeva pagina vuota; acquisizione dell'intera struttura `linear_conversation` dal payload della share page, non dalla sola preview. Indici `msg` sotto = posizione nell'array serializzato della pagina, non ID di decisione. Le citazioni esterne e le stime commerciali presenti nelle risposte AI non sono state validate qui.

## 1. Source Overview

Si parte dal registro mondo/sociale già discusso (`NARRATIVE.md` §4); il Director esplora storia personale e reazioni ai traumi, fazioni/regioni/economia, mondo che evolve anche senza il giocatore, memoria leggibile, causalità cross-run. La conversazione include ricerche e critica avversariale di altre AI, una correzione del Director alla falsa lista degli «scarti», e infine una bozza di macro-piano a fasi. L'ultima richiesta *nella fonte* chiede un macro-piano, ma non contiene un avallo della risposta finale.

## 2. Extraction Ledger

| ID | TYPE | STATEMENT | TEMPORAL | VERDICT | REASON / RATIONALE | SOURCE | RELATIONSHIPS |
|---|---|---|---|---|---|---|---|
| E-01 | PROPOSAL | Registro di entità, relazioni e storia usato come casting pool e memoria interrogabile | PLANNED | CONFIRM | Già proposta Director; evita antagonisti inventati ogni volta e flag senza nome | msg 119/126 | `NARRATIVE.md` §4; OPEN-014 |
| E-02 | REQUIREMENT (Director) | Esperienze e tratti personali devono poter cambiare probabilisticamente titoli/carattere e creare scene, non una cascata di modificatori numerici | UNRESOLVED | INTEGRATE | Il Director rifiuta esplicitamente «troppi calcoli, modificatori»; esempi: incalzare o timore dei mannari; i nomi sono placeholder, non tabella approvata | msg 127/141/144/147 | caratteri/quest; E-03; OPEN-016 |
| E-03 | PROPOSAL (Director) | I tratti possono generare scene, gli hook quest; famiglie funzionali con nomi sinonimici per non moltiplicare regole | UNRESOLVED | REFINE | Precisa E-02; il modello di upgrade/downgrade fornito è esemplificativo | msg 147 | E-02; `NARRATIVE.md` §4 |
| E-04 | PROPOSAL (Director) | NPC/nemici ricorrenti possono avere carriere e crescere in ruolo/equipaggiamento, analogamente al Trial by Fire dei residenti | UNRESOLVED | INTEGRATE | Il Director dice che Trial by Fire è già stato considerato, non lo reinventa | msg 158 | `.mw/desiderata.md` v12; OPEN-005/016 |
| E-05 | PROPOSAL (Director) | Fazioni, regioni e commercio possono reagire alle quest e generare opportunità, anziché diventare tre gestionali completi | UNRESOLVED | INTEGRATE | Esempi Director: banditi/mercanti/prezzi/carestia; dio del mare/inondazione; commercio come possibile feedback, non un'economia già disegnata | msg 127/158/164/175; AI 140/174 | `VILLAGE_ECONOMY.md` DRAFT; OPEN-016 |
| E-06 | REQUIREMENT (Director) | Le quest devono essere percepite come modifiche al mondo; grandi divergenze/pressioni possono generare eventi più forti | UNRESOLVED | REFINE | Specifica il valore desiderato della conseguenza, non impone soglie o formule | msg 175 | `RICHIESTE.md` R-092; `QUEST_RULES.md` §8; OPEN-015/016 |
| E-07 | PROPOSAL (Director) | Anche il mondo non visto può evolvere, forse con check mensili e le bande BigWin/Win/Almost/Fail/EpicFail | UNRESOLVED | INTEGRATE | «magari una volta al mese» non è cadenza fissata; nessuna simulazione per-persona approvata | msg 188 | OPEN-016; tempo continuo in `DESIGN_PILLARS.md` |
| E-08 | REQUIREMENT (Director) | Lungo orizzonte desiderato: 5–10 run nello stesso mondo, potenzialmente ~200 anni; memoria di eroi, oggetti, magie ed eventi straordinari | UNRESOLVED | INTEGRATE | Ambizione dichiarata, non durata di runtime né milestone approvata | msg 188/192 | `NARRATIVE.md` §4; PLAN-019 S5; OPEN-016 |
| E-09 | REQUIREMENT (Director) | Quando riappare qualcosa, fornire un riassunto breve di chi/come/quando/perché è cambiato, con dettagli al click; spiegare anche bonus quest dovuti ad alleanze | UNRESOLVED | INTEGRATE | Il giocatore non deve ricordare i nomi; la provenance rende la causalità visibile | msg 158/195 | `NARRATIVE.md` §4; OPEN-016 |
| E-10 | PROPOSAL (AI) | Eventi con causa e conseguenze strutturate, storia selettiva, context card e domanda «perché ora?»; distingue fatto del mondo da conoscenza/rumor del giocatore | PLANNED | REFINE | Completa memoria/scheduling R-090 senza ratificare modello dati o gerarchie AI | msg 194/197/217/244/254 | `NARRATIVE.md` §3; P48–P63; E-09 |
| E-11 | PROPOSAL (Director) | Tradimenti/redenzioni/cambi fazione e traiettorie non lineari ma causalmente leggibili; rami narrativi irrilevanti diventano dormienti | UNRESOLVED | INTEGRATE | Il Director propone uno swap con ragione narrativa, ma ne chiede fattibilità; AI corregge verso transizioni condizionate, non random puro | msg 218; AI 228/244 | E-10; OPEN-016 |
| E-12 | PROPOSAL (Director) | Mondi diversi tramite parametri di partenza (popolazioni, risorse, ruoli, caratteri, religioni) | UNRESOLVED | INTEGRATE | «teoricamente potremmo»; non è una scelta di configurazione già approvata | msg 218; AI 228 | OPEN-016; config-first |
| E-13 | PROPOSAL (AI) | Pressioni/obiettivi, pattern narrativi, story seeds con promozione selettiva per contenere rumore e spiegare la ricorrenza | PLANNED | INTEGRATE | Utile ipotesi di design, ma nessuna architettura o metrica congelata | msg 244/254/258 | `NARRATIVE.md` §4; OPEN-016 |
| E-14 | CORRECTION (Director) | La lista di «sistemi scartati» AI (Destiny Deck, Narrative Debt risorsa, World DNA, Echo a intervalli, musica individuale, community, mod, legacy sofisticata, 30–50 anni presimulati, grande budget, LLM) non era il piano originale | HISTORICAL | CORRECT | Non attribuire retroattivamente la lista al progetto, né presentare quegli elementi come decisioni di scarto tutte ratificate | msg 258/259/262 | Nessuna voce `REJECTED.md` creata per elementi mai approvati |
| E-15 | PROPOSAL (Director) | Una magia significativa può diventare entità persistente trattata orientativamente come item; non tutte le spell | UNRESOLVED | INTEGRATE | «orientativamente» non definisce tassonomia finale | msg 259; AI 262 | E-08; OPEN-016 |
| E-16 | PROPOSAL (AI) | Macro-piano con Foundation → Consequences → World Simulation → Character Evolution → Story Detection → History → Items → Context → Agency → Cross-run → Polish; mini vertical slice e test del riconoscimento spontaneo | PROPOSED | INTEGRATE | Risposta finale dell'AI a richiesta di piano; **nessun avallo del Director**; non inserirlo in `plans/INDEX.md` come piano attivo | msg 263/265 | PLAN-019 S1–S5 (vincolo di sequenza); OPEN-016 |
| E-17 | RESEARCH (unverified) | Risposte AI citano Wildermyth, RimWorld, Dwarf Fortress, CK e ricerca su UX/narrativa; stime economiche e brevetti sono speculative | UNVERIFIED | DROP | Ricerca non verificata indipendentemente; i principi pertinenti esistono già in P48–P63; niente nuovi dati/claim scientifici o commerciali | msg 140/157/163/174/187/191/194/217/228/229/244/245/254 | `context/QUEST_GAMEPLAY_SCIENCE.md` |
| E-18 | PROPOSAL (AI) | La verifica del prototipo misura se il giocatore riconosce spontaneamente un ricorrente e sa spiegare perché è cambiato | PROPOSED | INTEGRATE | Criterio testabile interessante; numeri (2–4 ore, 8–10 PG, ~10 pattern) della bozza non sono target decisi | msg 258/265 | E-09/13; OPEN-016 |

## 3. New Knowledge

E-02/03/04/05/07/08/09/11/12/13/15/16/18: proposte e requisiti di direzione con provenienza, in `NARRATIVE.md` §4 e nella voce OPEN-016. E-16 resta bozza esterna, **non** nuovo piano operativo.

## 4. Confirmed Knowledge

E-01 conferma `NARRATIVE.md` §4 (registro e relazioni); E-06 precisa R-092/`QUEST_RULES.md` §8; E-10 conferma ricerca R-090 sulla memoria selettiva, senza farne regola vigente. `Trial by Fire` esiste come intento/desiderata ma lo stadio è ancora aperto (OPEN-005).

## 5. Refinements

E-03 distingue scene da quest-hook e famiglie funzionali da nomi; E-09 rende la memoria *comprensibile al momento del ritorno*; E-10 separa storia vera, memoria presentata e sapere del giocatore. E-06 collega la conseguenza della singola quest alle pressioni del mondo, senza decidere quando scatti per quest mai intraprese (OPEN-015).

## 6. Corrections

E-14: la lista dell'AI delle cose «scartate» non era l'elenco di funzionalità precedentemente approvate. Distinguere *mai previste*, *idee da non prioritizzare*, *vincoli espressi dal Director* e *scarti espliciti*. Nessuna cancellazione di piani o modifica a `REJECTED.md`.

## 7. Decisions

Nessun piano ratificato in questo share. Requisiti espressi direttamente dal Director (E-02/06/08/09) non implicano l'approvazione delle architetture AI. La precedente R-092 resta la fonte del principio «ogni quest ha conseguenze», con trigger per mancata risoluzione da chiarire (OPEN-015).

## 8. Research

E-17: le citazioni dei modelli nella conversazione sono **claim non verificati qui**; non si importano come evidenza. Usare il corpus già censito in `context/QUEST_GAMEPLAY_SCIENCE.md` P48–P63 per ragionare, senza spacciare stime di vendite, costi o probabilità per dati.

## 9. Rejected Approaches

Nessuna nuova voce: E-14 è soprattutto una correzione di provenienza. La proposta AI di Narrative Debt come valuta o Destiny Deck non diventa parte della roadmap; «no LLM» è una preferenza esplicita del Director nella fonte, da confrontare con eventuale futura desiderata.

## 10. Unresolved Questions

OPEN-015: quale evento fa scattare gli effetti delle quest non risolte? OPEN-016: quali entità e relazioni vanno persistite; quali effetti del mondo sono giocabili e visibili; granularità dei tick; distinzione verità/rumor; durata e importazione tra run; rapporto con `LoreDropService` e quest S1–S5; quale fetta minima misurare prima di investire in storia lunga.

## 11. Conflicts

**Tensione di sequenza:** E-16 propone di avviare un programma di world simulation prima della quest vera, mentre `.mw/desiderata.md` v24 e PLAN-019 vincolano la sequenza S1 → S2 → S3 → S4 → S5 e mantengono la generazione/narrativa emergente fuori dal contratto di S1–S4. Nessuna inversione autorizzata: eventualmente chiarire se la memoria minima necessaria a S2/S4 appartenga alla quest vera/integrata, senza anticipare l'intero simulatore. **Tensione di tempo:** tick mensili mondiali candidati (E-07) non devono essere confusi con turni o pause di fine giornata; in v4 i check quest aperti possono fermare il tempo della quest.

## 12. Changes of Direction

Nessuna direzione del progetto cambiata da questa ingestione. In conversazione il focus della *proposta AI* evolve da salience score astratto a pattern/seed, ma il Director non battezza un nuovo macro-piano.

## 13. Documentation Changes

- `RICHIESTE.md` R-093 — cattura richiesta attuale di acquisire e poi discuterne.
- `NARRATIVE.md` §4 — raggruppa gli intenti Director e i meccanismi AI come proposte, senza hardcodare schema.
- `context/OPEN.md` OPEN-016 — questione di design cross-domain e relazione con PLAN-019/OPEN-015.
- `context/INDEX.md` — registra questo report L4.
- `QUEST_RULES.md` §8 — resta invariato: già contiene il principio R-092, non vi si inseriscono trigger immaginati.
- `plans/INDEX.md`, `CANON.md`, `.mw/desiderata.md` — invariati: nessuna ratifica.

## 14. Implementation Impact

In futuro: resolver conseguenze quest e mancata risoluzione; registry/persistence async; selezione eventi/pressioni di fazioni e regioni; storie e tratti dei residenti; lore/casting; schede contesto e dettaglio; run successive. Nessuna modifica a codice o configurazioni in questa ingestione. Rispettare `PersistenceService`, config-first e i18n quando si passerà a un piano approvato.

## 15. Argomenti trattati

Registro sociale; titoli/tratti/scena; NPC ricorrenti; fazioni, regioni, commercio; quest e grandi conseguenze; check offscreen; cross-run/oggetti/spell; provenance/riconoscimento; conoscenza del giocatore; tradimenti/payoff; mondi iniziali; critiche multi-AI; correzione della falsa lista degli scarti; macro-piano AI proposto.

## 16. Problemi risolti

Chiarito in msg 259/262 che l'elenco AI degli «scarti» non era il piano originale. Non sono risolti trigger di quest ignorate (OPEN-015), contratto mondo, fattibilità, né ordine del futuro programma rispetto a PLAN-019.

## 17. Ripresa della conversazione

Il Director ha chiesto di acquisire lo share e parlarne, senza approvarne la bozza di macro-piano. Prossima discussione utile: quale *singola catena giocabile* quest → conseguenza → ritorno di una persona/luogo/fazione → riconoscimento dimostra il valore prima di costruire la simulazione cross-run? Chiarire a parte OPEN-015; se si sceglie una direzione concreta, formularla come nuova desiderata approvabile, poi pianificare rispettando PLAN-019 o chiedere esplicitamente la sua revisione.
