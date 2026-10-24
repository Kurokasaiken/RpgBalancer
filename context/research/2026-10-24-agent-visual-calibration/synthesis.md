# Sintesi — calibrazione giudizio visivo agente (broadcast 2026-10-24, 4/4)

## CONVERGENZE (il segnale)

1. **No punteggio singolo.** Track A (bella?) e Track B (animabile?) sono
   task diversi — gate-and-route: A prima, B solo se A passa; oppure due
   vettori indipendenti + selezione congiunta. Un weighted sum fa
   compensare un bel ritratto piatto → disastro in pipeline.
   (4/4, unanime)
2. **Pairwise > assoluto.** "Quale delle due è più Wanderlust?" è
   affidabile; "7/10" è rumore. Bradley-Terry/Elo leggero su confronti
   (gemini, deepseek, chatgpt).
3. **Corpus 15-20 = aneddoti, non calibrazione.** Servono 60-80 sample
   contrastivi o ~200 pairwise; la statistica è Cohen's κ su accept/reject
   binario, con costo asimmetrico: False Accept 10× peggio di False
   Reject (gemini, deepseek, chatgpt).
4. **Critica avversariale prima del voto.** Forzare "3 frasi di critica
   brutale" prima di qualsiasi score rompe il self-enhancement bias
   (gemini: "un modello che scrive la rubrica E vota si premia").
5. **B ha gate deterministici.** Edge-margin density (occludenti nel
   15% esterno), focal-centroid offset dal centro, spread di luminanza —
   misurabili senza gusto, rejection immediata PRIMA del giudizio
   estetico (gemini "parallax-compliance mask").
6. **Cieco strutturale**: cromia sintetica vs pittorica, peso narrativo,
   "si sente viva", coerenza fiction (prop vs bibbia mondo), affordance
   camuffata elegante vs asset mobile — non misurabili da pixel soli.

## DIVERGENZE (opzioni per il Director)

- **deepseek**: discriminatore embedding — CLIP nearest-neighbor vs
  manifold accettate/rifiutate, niente rubrica ("la rubrica codifica la
  mia teoria di cosa conta; l'embedding codifica cosa varia davvero").
  Leggero, no GPU.
- **gemini**: contrastive in-context retrieval — iniettare 3 accettate +
  2 rifiutate annotate nel contesto quando valuto.
- **chatgpt**: tassonomia criteri in 3 tipi (hard constraints → fail
  secco; quality dims → ordinate con anchor comportamentali; giudizi
  contestuali → Director+rationale) + ridefinizione di "no mud"
  (luminance distribution + focal-to-bg contrast, non saturazione media).

## VOCI SOLITARIE (blind spot)

- chatgpt: **separare calibrazione giudizio da ottimizzazione prompt** —
  ogni generazione = esperimento con modo-di-fallimento predetto e UNA
  variabile cambiata; altrimenti self-confirming loop (imparo a generare
  ciò che so lodare).
- deepseek: le spiegazioni delle critiche contano più dei voti — scrivere
  la critica nella voce del Director e confrontare il linguaggio, non i
  numeri.

## L'architettura corretta (sintesi)

1. Corpus etichettato: accettate + rifiutate CON la ragione del rifiuto.
2. Pre-gate deterministico B (edge density, centro focale, luminanza).
3. Valutazione = confronto con anchor (3 accettate + 2 rifiutate
   in-context) → critica 3 frasi → gate binario per track.
4. Metrica: κ su accept/reject, penalizzando i False Accept.
5. Pairwise vs anchor per i nuovi candidati; il Director vede il top pick.
6. Feedback → calibration-log con la RAGIONE dell'errore (quale
   dimensione ho pesato male), non solo il delta.
