# PLAN-086 — Calibrazione del giudizio visivo dell'agente

**Status**: aperto · **Aperto**: 2026-10-24 · **Priorità**: alta (blocca la qualità di ogni scena futura)
**Fonte**: Director 2026-10-24 — "t devi allenare a creare e riconoscere immagini apprezzabili"
**Ricerca**: `context/research/2026-10-24-agent-visual-calibration/` (broadcast 4/4 + forense successi/fallimenti)

## Scopo

L'agente deve imparare a votare come il Director vota. Il fallimento
documentato (iterazioni prompt in peggioramento) nasce da un bias:
giudicare "ha le feature del brief" invece di "legge come pittura".

## Architettura (sintesi broadcast + ricerca)

1. **Corpus etichettato** — accettate + rifiutate, ogni rifiuto con la
   RAGIONE (mud, soggetto sbagliato, off-fiction, POV…).
2. **Pre-gate deterministico (Track B)** — edge-margin density,
   focal-centroid off-center, luminance spread → reject prima del giudizio.
3. **Valutazione per confronto** — 3 anchor accettate + 2 rifiutate in
   contesto, critica brutale 3 frasi PRIMA del voto (anti self-enhancement).
4. **Pairwise vs anchor** per i nuovi candidati; il Director vede il top.
5. **Metrica**: Cohen's κ su accept/reject; False Accept pesa 10×
   False Reject. Calibrato = κ>0.75 su ~30+ giudizi.
6. **Calibration-log** — ogni errore registra la dimensione pesata male.
7. **Opzione futura**: discriminatore CLIP nearest-neighbor vs manifold
   accettate/rifiutate (deepseek — leggero, niente rubrica).

## Due track separati (gate ∧, mai somma)

- **A — bellezza**: focal event, chroma discipline (luminance distribution
  + focal contrast, NON saturazione media), tecnica impasto, artifact clean.
- **B — animabilità**: occluder edges, sorgente FX dominante, regioni
  riservate, depth readability, affordance camuffate, aspect.

## Radice comune (Director, 2026-10-24 — REGOLA)

**La descrizione scena nasce dalla quest-gen, non dal prompt-author.**
Il dato che guida l'immagine deve venire dal sistema di creazione quest:
meccanica del nodo, tag, cosa fa il giocatore, perché la scena esiste,
feeling target, motivazione narrativa. Il prompt è la *compilazione* di
quel dato nel formato bibbia — non una scena inventata. (Errore f4/f6:
beat inventati invece di leggere `goblin.it-IT.ts` → scena sbagliata.
Registrato in PLAN-084 T-007 come data-path obbligatorio.)

## Task

- [ ] T-001 Corpus etichettato: `context/research/.../corpus-labels.md`
      (ogni img: path, verdetto, ragione, track A/B note)
- [ ] T-002 Pre-gate B deterministico (script misure: edge density,
      focal centroid, luminance spread) — solo dati, niente UI ancora
- [ ] T-003 Round 1 pairwise: i miei verdetto+critica vs anchor su 8-10
      immagini nuove/miste; Director segna errori
- [ ] T-004 Pagina report scorecard (lab o doc) — dopo round 1
- [ ] T-005 Opzione discriminatore embedding (se pairwise sottoperforma)
