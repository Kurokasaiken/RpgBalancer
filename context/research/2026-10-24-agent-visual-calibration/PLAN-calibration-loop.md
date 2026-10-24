# Piano — calibrazione del giudizio visivo dell'agente (draft v0)

Obiettivo del Director: allenare l'agente a *creare* e *riconoscere*
immagini apprezzabili. Due direzioni contemporanee: **prompt generici**
(track A — bella immagine) e **prompt per le quest** (track B — plate
animabile). Un'immagine può passare A e fallire B — le rubriche stanno
separate e il gate è A ∧ B.

## Lezione dallo studio successi/fallimenti (input)

Il bias documentato dell'agente: giudico su "ha le feature del brief"
invece che su "legge come pittura". Errore f4 (direzione attori), f2
(enumerazione→soggetto), dusk senza sorgente = murk. La calibrazione
deve testare esattamente questi punti ciechi.

## Track A — rubrica generica (bella?)

| Cat | Domanda | Misura meccanica | Mio voto percettivo |
|---|---|---|---|
| A1 Focal hierarchy | c'è UN evento dominante? | contrasto max region vs resto | sì/no + dove |
| A2 Light event | luce con sorgente+direzione+conseguenza? | luminance gradient coerenza | sì/no |
| A3 Chroma discipline | ombre sature, zero fango | %px low-sat mid-dark; sat mean | sì/no |
| A4 Tecnica | impasto leggibile, non digitale | edge/texture stats | sì/no |
| A5 Artifact clean | no watermark/testo/firme | corner detection + eye | sì/no |
| A6 Mood coerente | emozione = brief? | — | sì/no |

## Track B — rubrica animabilità (vive?)

| Cat | Domanda |
|---|---|
| B1 Hero motion | c'è una sorgente che giustifica 1 FX dominante? |
| B2 Occluder edges | masse ai bordi con silhouette+gradini per parallax? |
| B3 Regioni riservate | zone a basso conflitto per fog/embers/particles? |
| B4 Depth readability | 3 piani leggibili → bake depth pulito? |
| B5 Affordance | segreti leggibili-ma-camuffati per A1/A2 hooks? |
| B6 Aspect | 2.4:1 / safe window |

## Protocollo di calibrazione

1. **Round cieco**: io voto il corpus (15 library + i rifiutati in
   Downloads) SENZA sapere i verdetti → tabella score × categoria.
2. **Confronto**: le differenze voto↔verdetto si segnano in
   `calibration-log.md` con la ragione del mio errore (non solo il delta).
3. **Iterazione**: ogni nuova generazione passa prima da me; il Director
   vede solo il top pick + il mio scorecard. Ogni errore corretto
   aggiusta la rubrica.
4. **Criterio "calibrato"**: 10+ immagini consecutive con accordo
   su A-gate E B-gate (non sui punteggi di categoria — sul verdetto).

## Strumento di presentazione

Pagina report nel lab o doc `scorecard-results.md` — tabella immagine ×
categorie × (mio voto, verdetto, divergenza). Da progettare dopo il
broadcast (le risposte possono cambiare la forma: pairwise vs assoluto,
ecc.).

## Domande aperte per il Director

- Il voto per categoria 0-5 o pass/fail? (pass/fail più onesto, meno
  false precision)
- Il corpus cieco include anche le immagini NON-quest (moodboard)?
- Vuole vedere il mio reasoning per categoria o solo il gate finale?
