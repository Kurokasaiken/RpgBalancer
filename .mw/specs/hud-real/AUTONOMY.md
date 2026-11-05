# Modalità autonoma HUD (Director, 2026-11-03)

> «Continua a creare tutti i componenti del mockup anche se mi addormento e non rispondo.
> Quando finiamo dobbiamo capire se questo HUD è bello e all'altezza, cosa cambiare, come.
> Deve diventare un linguaggio a sé, da cui farò anche tutti gli altri componenti.»

## Mandato
Costruire **tutti** i componenti scelti dei mockup (vedi `queue.json`) fino al componente React vero con dati reali,
senza fermarsi a chiedere. Alla fine: esame onesto della HUD (`REVIEW.md`) e linguaggio scritto (`LINGUAGGIO-v2.md`).

## Cosa NON si fa mai (anche da soli)
- Nessun commit, push, PR. Niente di cancellato: le alternative restano su disco.
- Nessuna modifica alla meccanica del gioco, allo store, ai contratti dati; i componenti nuovi sono una pelle sopra gli stessi dati.
- Nessuna modifica a `/game` di produzione: si lavora nei lab (`/hud-real-*`, `/hud-compose`, `/hud-review`, `/hud-library`).
- Niente viola nella UI; niente testo dentro le immagini; niente stringhe senza i18n (en + it-IT).
- Non si supera `gen-budget.json` (tetto di immagini Gemini, protegge il limite settimanale).

## Come si decide quando il Director non risponde
1. **Scelta delle varianti generate:** regola deterministica, in quest'ordine: (a) passa il gate Tier-A; (b) è un pezzo unico, senza elementi in più; (c) più vicina al disegno del mockup (IoU della maschera); (d) oro e smalto più vicini alla media dei pezzi già approvati; (e) a parità, la più ricca di incisione (varianza del Laplaciano).
2. **Ambiguità di concept:** si sceglie ciò che è più vicino al mockup scelto dal Director, poi la versione più opulenta.
3. **Ogni decisione automatica** va in `DECISIONS.md` con: cosa, alternative scartate, come tornare indietro (di solito cambiare un nome file e rilanciare uno script). Stato: `provvisoria, da confermare`.
4. **Ruling del Director già dati** valgono sempre: placche al passaggio del mouse (roster), scala del mockup, foglie ammesse, INIZIA come nel mockup, dock a roundel, sigillo nel dettaglio spedizione, marchio con placca, oro brillante e verde profondo (grade), nessuna bussola/sfera armillare nel cimiero.

## Generazione (quota Gemini)
- Si usa `scripts/hud-real/gen-queue.mjs` (Canary, tab in background, chat nuova per ogni immagine).
- Alla quota esaurita aspetta il reset orario (:04) e riprova; dopo 3 errori di allegato salta il lavoro e lo segna `failed`.
- Duplicati scartati per hash. Ogni uscita è registrata in `scripts/hud-real/runs.jsonl`.

## Per ogni componente (stessi stadi, nessuna eccezione)
1. **Disegno di partenza** dal mockup scelto: ritaglio, SwinIR ×4, contenuto vivo svuotato (testi, numeri, icone, ritratti), moduli (capi + segmento ripetibile).
2. **Prompt** compilato (struttura del mockup preservata, resa premium, materiale dall'anello g4).
3. **Generazione** 2 varianti per modulo.
4. **Gate + scelta automatica** (regola sopra); contact sheet per il Director.
5. **Asset**: scontorno (flood fill dal fondo blu notte, smalto scuro protetto), grade oro/verde, geometria misurata su alpha, esportazione 2×.
6. **Componente React** con i dati reali (stesso contratto del componente di produzione), stati, tastiera, i18n, test sulla logica.
7. **Verifica**: cattura headless 1600×900 DPR 2 sulla mappa, confronto/overlay col mockup, nessun errore in pagina, tipi e lint puliti.
8. **Registro**: `queue.json` (stato), `PLAN-110` (cronaca), `DECISIONS.md`.

## Condizioni di stop (e cosa scrivere)
- Budget finito, o 3 job consecutivi falliti: scrivere `STATUS.md` con lo stato esatto e fermarsi.
- Un controllo non risolvibile (tipi, test, console): registrarlo in `STATUS.md`, passare al componente successivo.
- Tutti i componenti `verified`: lanciare l'esame finale.

## Ripartenza (dopo una pausa o un contesto nuovo)
Leggere nell'ordine: `AUTONOMY.md`, `queue.json`, `STATUS.md`, `DECISIONS.md`, coda `PLAN-110` (§13.5). Poi continuare dal primo componente non `verified`.
