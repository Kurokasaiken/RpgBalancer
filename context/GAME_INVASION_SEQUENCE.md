---
title: /game — sequenza evento invasione
type: reference
updated: 2026-10-19
plan: plans/PLAN-033-game-event-shroud-goblin-march.md
---

# /game — sequenza evento invasione

Come si svolge, oggi, l'evento d'invasione su `/game` (`src/pages/game-frame-pixi.tsx`). Il piano di riferimento è PLAN-033.

## Sequenza

1. **Tendina.** Il Director avvia l'evento (`startInvasion` in dev, o l'azione dal pannello). `WorldSurfaceEventShroud` chiude due metà di nuvola pergamena/ottanio. Ogni metà è un box di **125vw** (vedi `trailer.css`, `.ws-event-shroud__half`): così le due parti opache si sovrappongono al centro e non lasciano striscia di mappa visibile. La copertura è stata verificata sui pixel degli asset.
2. **Card.** Dopo 700 ms la card (`WorldSurfaceEventCard`) appare **nell'overlay a schermo**, non sulla mappa. È centrata sull'area libera fra le bande HUD, calcolata dagli inset di `safeFit`. Scala 1 (460 px di design). Non è più dentro `worldBoxRef`, quindi non viene coperta dai pannelli.
3. **Strappo dello sticker.** Al click su "conferma" la card entra in `peeling`: la teca mostra il proprio distacco (il bordo bianco si scopre, `clip-path` 0,9 s). Alla fine dello strappo lo sticker prende il posto del goblin della teca **nella posizione e nella scala misurate** (`getBoundingClientRect` del goblin della teca, non una scala calcolata a mano) e la teca nasconde il suo. Un solo goblin è visibile in ogni fotogramma. _(Sostituisce la versione del 2026-10-12, in cui lo sticker compariva al primo fotogramma dello strappo: il distacco non si vedeva, era un «pop» — rifiutato dal Director il 2026-10-14.)_
4. **Caduta e consegna.** Lo sticker vola dalla teca al marker del goblin (misurato sullo schermo, `landingSelector`) e a quel punto si smonta: il marker, rimasto nascosto fino ad allora (`goblinLanded`), prende il suo posto. Il goblin resta come **anchor sulla mappa**: la sua posizione è `progresso = (giornoCorrente − startDay) / INVASION_MARCH_DAYS`, limitato fra 0 e 1. **Alla riapertura della pagina l'invasione confermata viene ripristinata**: il clock di gioco si reidrata (`initializeMinimalGameplayStore` ripristina `currentDay`/`currentTick` al momento del save), `invasion_v1` viene letto solo *dopo* l'hydration, così il marker monta già posato sulla posizione salvata senza scatti e la riga registro è presente. Il teatro d'annuncio (tendina, card, strappo) è transitorio e **non viene mai replicato**: un reload a metà sequenza riprende allo stato post-conferma. _(Ruling Director 2026-10-19, opzione A — sostituisce la wipe-on-open del 2026-10-14, motivata all'epoca dalla premessa oggi falsa che il clock non si reidratasse.)_
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
- **BV verificate 2026-10-19** (record `.mw/runs/PLAN-033/bv/record.md`, gate «BV PASS sul merito»): BV-1/BV-2 Playwright 4/4 a 16:9 e 21:9, BV-3 per-frame via sampler rAF in-page, BV-5 registro aperto/resta aperto, BV-6 anello regioni sotto nuvole via seam `__worldLayers`.
- **BV-4 / R-119 risolto 2026-10-19** (ruling Director opzione A): la premessa «il clock non si reidrata» era stale — `initializeMinimalGameplayStore` ripristina giorno e tick al save-time. Ora `invasion_v1` è letto dopo l'hydration e l'invasione confermata torna sulla mappa alla posizione salvata; spec `gameInvasionMarch.spec.ts` aggiornata di conseguenza.
