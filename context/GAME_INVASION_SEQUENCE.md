---
title: /game — sequenza evento invasione
type: reference
updated: 2026-10-14
plan: plans/PLAN-033-game-event-shroud-goblin-march.md
---

# /game — sequenza evento invasione

Come si svolge, oggi, l'evento d'invasione su `/game` (`src/pages/game-frame-pixi.tsx`). Il piano di riferimento è PLAN-033.

## Sequenza

1. **Tendina.** Il Director avvia l'evento (`startInvasion` in dev, o l'azione dal pannello). `WorldSurfaceEventShroud` chiude due metà di nuvola pergamena/ottanio. Ogni metà è un box di **125vw** (vedi `trailer.css`, `.ws-event-shroud__half`): così le due parti opache si sovrappongono al centro e non lasciano striscia di mappa visibile. La copertura è stata verificata sui pixel degli asset.
2. **Card.** Dopo 700 ms la card (`WorldSurfaceEventCard`) appare **nell'overlay a schermo**, non sulla mappa. È centrata sull'area libera fra le bande HUD, calcolata dagli inset di `safeFit`. Scala 1 (460 px di design). Non è più dentro `worldBoxRef`, quindi non viene coperta dai pannelli.
3. **Strappo dello sticker.** Al click su "conferma" la card entra in `peeling`: la teca mostra il proprio distacco (il bordo bianco si scopre, `clip-path` 0,9 s). Alla fine dello strappo lo sticker prende il posto del goblin della teca **nella posizione e nella scala misurate** (`getBoundingClientRect` del goblin della teca, non una scala calcolata a mano) e la teca nasconde il suo. Un solo goblin è visibile in ogni fotogramma. _(Sostituisce la versione del 2026-10-12, in cui lo sticker compariva al primo fotogramma dello strappo: il distacco non si vedeva, era un «pop» — rifiutato dal Director il 2026-10-14.)_
4. **Caduta e consegna.** Lo sticker vola dalla teca al marker del goblin (misurato sullo schermo, `landingSelector`) e a quel punto si smonta: il marker, rimasto nascosto fino ad allora (`goblinLanded`), prende il suo posto. Il goblin resta come **anchor sulla mappa**: la sua posizione è `progresso = (giornoCorrente − startDay) / INVASION_MARCH_DAYS`, limitato fra 0 e 1. **Alla riapertura della pagina non c'è nessun goblin sulla mappa**: l'invasione non viene ripristinata (l'orologio non si ripristina, R-119, quindi la posizione sarebbe senza senso) e `invasion_v1` viene cancellato all'apertura. _(Sostituisce il ripristino da `invasion_v1` di PLAN-033 T-004 — rifiutato dal Director il 2026-10-14: «all'apertura della pagina vedo lo sticker goblin».)_
5. **Registro.** Alla conferma il registro eventi (`HudEventLedger`) si apre **e resta aperto** (lo chiude il giocatore). Si apre senza ri-inquadrare la mappa (`ledgerFitIgnored`: la camera non si muove durante la scena). La riga dell'invasione esiste ma è nascosta (`arriving`); durante la caduta la card si ripiega sulla riga — stesso centro, larghezza e altezza della riga (`rowSelector`, `MORPH_MS` 1,1 s) — poi svanisce e la riga appare (`onArrive`). _(Sostituisce il «peek» da 1 s che richiudeva il registro e ri-inquadrava la mappa due volte — rifiutato dal Director il 2026-10-14.)_

## Costanti da sapere

- `INVASION_LAND`, `INVASION_VILLAGE`: punti normalizzati su 4240×2828.
- `INVASION_MARCH_DAYS = 30`, `INVASION_WARNING_DAYS = 5`.
- `INVASION_SCREEN_SCALE = 1` (scala della card a schermo).

## Test

- `tests/e2e/idleVillage/gameInvasionSequence.spec.ts`: BV-1 (le metà chiuse si sovrappongono al centro) e BV-2 (card dentro la viewport, in fascia centrale), a 16:9 e 21:9. Usa `window.__idleVillageTestHooks.startInvasion`.
- `tests/e2e/idleVillage/gameInvasionScene.spec.ts`: la scena dopo la conferma, campionata a fotogrammi: un solo goblin, lo sticker parte dove era il goblin della teca, camera ferma, la card si ripiega nella riga, il registro resta aperto.
- `tests/unit/idleVillage/regionOutline.test.ts`: tracciato e semplificazione dei contorni delle regioni.

## Limiti noti

- Il goblin si sposta a scatti di un giorno di gioco, non in modo continuo.
- L'esito al giorno 30 non è implementato: è l'evento di difesa del villaggio, futuro.
- La verifica a schermo delle linee delle regioni e della card (BV-2 nel browser reale) resta da fare: nel pannello di anteprima la pagina `/game` non esce dalla schermata di boot.
