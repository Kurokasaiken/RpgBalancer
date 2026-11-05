# Esame finale della HUD: protocollo

Obiettivo (Director): capire se questa HUD è bella e all'altezza, cosa cambiare e come.
Si esegue quando tutti i componenti di `queue.json` sono `verified`. Produce `REVIEW-REPORT.md` e la pagina `/hud-review`.

## A. Misure (oggettive, tutte da script)
1. **Fedeltà al mockup scelto**, per componente: sovrapposizione al 50% (landmark: centri, raggi, passi), scarto in px.
2. **Coerenza tra pezzi**: oro e smalto in Lab (L e C, p50 e p90) di tutti i pezzi; scarto massimo tra pezzi (oro: C p50 ±4, L p90 ±5); frequenza di incisione (varianza del Laplaciano a scala comune) entro 1 : 1,5.
3. **Risoluzione**: nessun pezzo ingrandito oltre 1,5× a 1920×1080 e 2560×1440; nitidezza a DPR 1 e 2.
4. **Leggibilità**: contrasto del testo su smalto e alabastro ≥ 4,5 : 1, corpo ≥ 12 px, nessun nome troncato (it ed en).
5. **Ingombro**: superficie percepita della HUD a riposo (unione dei pixel occupati) contro il 18% e il tetto 1/3; i fissi non coprono la terra a 1440×900 e 1280×800.
6. **Interazione**: hover, focus, tastiera, scorrimento, stati di ogni componente; `prefers-reduced-motion`.
7. **Stress con dati reali**: 0, 1, 14 eroi; risorse estreme; testi lunghi; pannello con contenuto lungo.
8. **Peso**: KB per componente a 2× (WebP); texture totali.

## B. Composizione (a vista, con screenshot veri)
- HUD intera su tre zone della mappa (mare, giungla, isola con terra chiara) a 1600×900 e 1920×1080: contrasto, ostruzione, equilibrio tra i pesi.
- Prima/dopo: HUD di oggi (`/game`) contro la nuova, sullo stesso stato.
- Confronto con il mockup scelto, intero, a parità di scala.

## C. Giudizio "all'altezza AAA"
Per ogni componente e per l'insieme, una scheda: **cosa funziona**, **cosa no** (categoria: oro, smalto, incisione, luce, proporzione, ritmo, coerenza, leggibilità, ingombro), **come correggere** (rigenerare una zona / correzione colore / codice / ridisegno) e **costo** (immagini, ore). Parere esterno opzionale: la tavola intera a Gemini in chat di testo (non consuma quota immagini), con il mio parere accanto e le divergenze segnate.

## D. Esito
`REVIEW-REPORT.md`: verdetto per componente (pronto / da ritoccare / da rifare), elenco ordinato delle correzioni con costo, e cosa va nel linguaggio (`LINGUAGGIO-v2.md`) come regola.
