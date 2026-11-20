# Claude Web — Prompt Stub

Prompt copy-paste per il Project **"Wanderlust: Triumph — Game Design"** su claude.ai.
Le istruzioni del Project impostano già ruolo, convenzioni e formato risposte —
questi stub servono ad aprire sessioni mirate e a chiedere deliverable repo-ready.
Le istruzioni sono la fonte canonica: `context/CLAUDE_PROJECT_PRIMER.md` §6.

## 1. Apertura sessione (sempre)

```
Scope di oggi: <ARGOMENTO>. Leggi solo i documenti che 00-NAVIGATION.md elenca per
questo tema prima di rispondere, poi dimmi in 5 righe cosa sai di rilevante e cosa
ti manca.
```

Argomenti tipici: `quest design`, `gimmick`, `bilanciamento`, `economia villaggio`,
`progressione early/mid/end`, `campagna macro`, `pacing`.

## 2. Critica di una quest / quest chain

```
Critica questa quest contro QUEST_RULES.md e GOOD_QUEST_DEFINITION.md:

<incolla la quest / descrivi la chain>

Per ogni punto debole: cita il test S5 violato, poi proponi UNA alternativa
concreta. Chiudi con un verdetto: pronta / rivedibile / da riscrivere.
```

## 3. Brainstorm gimmick

```
Genera <N> gimmick per <SITUAZIONE>. Vincoli: usano i canali reali di
QUEST_GIMMICK_CHANNELS_RESEARCH.md, niente gimmick che violano i 4 pillar,
nessuna direzione già in REJECTED.md. Per ciascuno: nome, trigger, effetto di
gioco, costo di authoring. Poi dimmi quali 2 terresti tu e perché.
```

## 4. Bilanciamento / progressione

```
Analisi <early|mid|end>game su <TEMA>. Confronta ciò che CURRENT_STATE.md dice
esistere oggi con gli obiettivi di PROGRESSION.md / VILLAGE_ECONOMY.md.
Distingui: cosa è verificabile nel repo (FACT), cosa è decisione presa
(DECISION), cosa è tua proposta (PROPOSAL). Chiudi con le 3 tensioni principali.
```

## 5. Review di una mia proposta (pillar check)

```
Ti propongo questa direzione:

<incolla la proposta>

Valutala contro: (a) i 4 Design Pillar, (b) desiderata-digest (intent FROZEN),
(c) REJECTED.md. Se trovi tensione con qualcosa di FROZEN, dichiarala
esplicitamente invece di aggirarla — la decisione è mia.
```

## 6. Analisi da riferimento esterno

```
<incolla descrizione di una meccanica di un altro gioco / un articolo>

Cosa si può rubare per Wanderlust? Per ogni idea: adattamento al nostro modello
PARTY→QUEST→PHASE→SITUATION→APPROACH→CHECK→CONSEQUENCE, costo, e perché non è
già scartata (controlla REJECTED.md).
```

## 7. Deliverable repo-ready

```
Riscrivi il risultato di questa discussione come: <scegli>
- entry desiderata draft ("**Intento del Director:**" + "**Formulazione proposta:**")
- entry OPEN-NNN per context/OPEN.md
- entry R-NNN per RICHIESTE.md
- spec tecnica nello stile dei doc del pack (sezioni, tabelle, status header)
```

## 8. Chiusura sessione

(Le istruzioni lo chiedono già in automatico — usa questo se la discussione era
ramificata e vuoi forzare il riepilogo.)

```
Chiudi con "## Delta per la governance": bullets di cosa cambia rispetto al
canon — decisioni emerse, nuove OPEN, proposte da registrare, doc da aggiornare.
Niente prosa, solo bullets integrabili.
```

## Note d'uso

- **Una chat = un argomento.** Non mischiare economia e quest nella stessa
  chat: il retrieval del Project funziona meglio con scope dichiarato.
- Per discussioni su UI/mappa/estetica allega screenshot — Claude non vede il
  renderer. Script headless in `scripts/_tmp-*-check.mjs`, golden in
  `test-results/`.
- Snapshot knowledge del 2026-11-19 — se discuti di qualcosa cambiato di
  recente, digli di leggere il file live dalla repo GitHub collegata.
- A fine sessione utile: gira il "Delta per la governance" a Devin per
  integrarlo in OPEN/RICHIESTE/desiderata (skill `knowledge-extractor`).
