---
title: /game — sequenza evento invasione
type: reference
updated: 2026-10-12
plan: plans/PLAN-033-game-event-shroud-goblin-march.md
---

# /game — sequenza evento invasione

Come si svolge, oggi, l'evento d'invasione su `/game` (`src/pages/game-frame-pixi.tsx`). Il piano di riferimento è PLAN-033.

## Sequenza

1. **Tendina.** Il Director avvia l'evento (`startInvasion` in dev, o l'azione dal pannello). `WorldSurfaceEventShroud` chiude due metà di nuvola pergamena/ottanio. Ogni metà è un box di **125vw** (vedi `trailer.css`, `.ws-event-shroud__half`): così le due parti opache si sovrappongono al centro e non lasciano striscia di mappa visibile. La copertura è stata verificata sui pixel degli asset.
2. **Card.** Dopo 700 ms la card (`WorldSurfaceEventCard`) appare **nell'overlay a schermo**, non sulla mappa. È centrata sull'area libera fra le bande HUD, calcolata dagli inset di `safeFit`. Scala 1 (460 px di design). Non è più dentro `worldBoxRef`, quindi non viene coperta dai pannelli.
3. **Strappo dello sticker.** Al click su "conferma" la card entra in `peeling`: lo sticker del goblin è montato subito alla sua posizione nella card, e la finestra nasconde il proprio goblin (`goblinHidden`). Così un solo goblin è visibile in ogni fotogramma.
4. **Caduta e marcia.** Lo sticker cade su `INVASION_LAND` e poi cammina verso `INVASION_VILLAGE`. Dopo la chiusura della card, il goblin resta come **anchor sulla mappa**: la sua posizione è `progresso = (giornoCorrente − startDay) / INVASION_MARCH_DAYS`, limitato fra 0 e 1. `startDay` è salvato nel persistence sotto `invasion_v1`, quindi dopo un ricaricamento la posizione è la stessa.
5. **Registro.** L'invasione compare come riga nel registro eventi (`HudEventLedger`). Se il pannello era chiuso, si apre per `LEDGER_PEEK_MS` (1 s) e si richiude; se era già aperto resta aperto.

## Costanti da sapere

- `INVASION_LAND`, `INVASION_VILLAGE`: punti normalizzati su 4240×2828.
- `INVASION_MARCH_DAYS = 30`, `INVASION_WARNING_DAYS = 5`, `LEDGER_PEEK_MS = 1000`.
- `INVASION_SCREEN_SCALE = 1` (scala della card a schermo).

## Test

- `tests/e2e/idleVillage/gameInvasionSequence.spec.ts`: BV-1 (le metà chiuse si sovrappongono al centro) e BV-2 (card dentro la viewport, in fascia centrale), a 16:9 e 21:9. Usa `window.__idleVillageTestHooks.startInvasion`.
- `tests/unit/idleVillage/regionOutline.test.ts`: tracciato e semplificazione dei contorni delle regioni.

## Limiti noti

- Il goblin si sposta a scatti di un giorno di gioco, non in modo continuo.
- L'esito al giorno 30 non è implementato: è l'evento di difesa del villaggio, futuro.
- La verifica a schermo delle linee delle regioni e della card (BV-2 nel browser reale) resta da fare: nel pannello di anteprima la pagina `/game` non esce dalla schermata di boot.
