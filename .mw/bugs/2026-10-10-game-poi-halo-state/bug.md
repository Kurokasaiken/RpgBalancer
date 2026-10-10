# Bug — /game: POI sempre in mappa + halo che nasce pieno

**Data:** 2026-10-10
**Segnalato da:** Director (verbatim)

> "sempr ein /game c'è un POI sulla mappa sempre, nn deve esserci.
> quando clicco director per fare apparire i POI appaiono cn l'halo già
> riempito, nn deve essere così.
> cambia proprio lo stato: un poi 'appena creato' deve partire sempre cn
> l'halo Vuota, a meno che nn c sia il flag 'in scadenza' (nn ricordo cm si
> chiama esattamente), in quel caso parte da pieno, il colore dell'halo è
> diverso e si 'scarica in senso antiorario. Consulta la documentazione,
> ma d default il comportamento è vuota => carica in senso orario"

## Sintomo (riprodotto via Puppeteer su /game)

- `poi-goblin` e `poi-rovine` montati e visibili al boot, senza alcuna
  azione del Director (`data-quest-status="available"`, opacity 1).
- I POI demo del bottone «Tipi di POI» nascono col sigillo già scritto:
  `MapDemoPoi` passava `state="available" progress={1}`.
- Lo stato `available`/`new` della famiglia disegna il sigillo pieno
  (`sealProgress=1`) — contratto giusto per il lab, sbagliato per una
  offerta quest appena rivelata.
- L'anello di scadenza era un `LiquidHalo` separato che si **riempiva in
  senso orario** — il contrario del countdown canonico.

## Contratto documentato (fonti)

- `poi_cooldown_spec.md` C-001/C-004: countdown in scadenza → halo **piena
  che scarica in senso antiorario**, colore ambra→rosso (`expiring`).
- RICHIESTE D-H (L2135): «l'halo (che fin'ora era vuoto) comincia a
  riempirsi» dopo «Invia spedizione» — offerta idle = halo vuota.
- `questAvailability.ts`: il flag «in scadenza» è `state === 'expiring'`,
  scatta sotto `EXPIRING_BELOW = 0.25` della finestra residua.
- `poi_family_spec` S-004: `available`/`new` = sigillo scritto per intero
  (semantica "in attesa di assegnazione", non "appena creato").

## Cause

1. `game-frame-pixi.tsx`: i POI expedition reali erano pushati in
   `anchors` incondizionatamente (solo `expired`/consumed filtrati) —
   nessun gate di reveal.
2. `MapQuestPoi`: stato passato al primitivo non distingueva «offerta
   fresca» da «in scadenza»; `timerDirection` fisso `clockwise` +
   `LiquidHalo` separato per la deadline.
3. `PoiMatericV3_5`: `expiring` non aveva palette warn — l'accento era
   l'oro di famiglia.
4. `MapDemoPoi`: `state="available" progress={1}` esplicito.
5. Mock legacy `city-rats` (`questPois[0]` + `useQuestPoiSession`)
   coesisteva come secondo sistema POI.

## Fix

- `MapQuestPoi` → `mapQuestPoiView` restituisce `{state, progress,
  deadlineWarn, direction}`: offerta sana = `assigned`+0 orario
  (sigillo vuoto, poi si riempie solo con `activityProgress` della run);
  `expiring` = stato semantico `expiring`, progress = stretch di
  scadenza rinormalizzato (piena→0), **antiorario**; `expired` = fade.
  Rimosso il `LiquidHalo` separato.
- `PoiMatericV3_5`: `expiring` → palette warn (`--skin-status-unmet`,
  `#d98a4a` + lettere chiare), classe `poiv3_5--expiring` con respiro
  lento sul seal (C-004), accent-rgb warn per bloom/fog.
- `MapDemoPoi`: `assigned`+0 orario + entrata ease-in come i POI veri.
- `game-frame-pixi.tsx`: gli anchor delle offerte reali montano solo se
  `questShown` (toggle del Director «Mostra quest») **o** c'è una run
  attiva (la run resta pinnata per design). Mock `city-rats` rimosso
  dalla mappa. `extraEvents` riagganciato al goblin. Nuovo hook E2E
  `revealQuestPois` (serve a `?capture=1`, dove il Director è nascosto).
- Test: `mapQuestPoi.test.ts` aggiornato (direction, soglia expiring,
  ccw); E2E lifecycle/expedition/steam capture usano il reveal (hook o
  F10).
