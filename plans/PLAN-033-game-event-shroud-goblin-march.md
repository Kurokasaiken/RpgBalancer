---
title: '/game — evento invasione: tendina, card centrata, goblin che marcia, handoff al registro, linee regioni'
status: active
created: 2026-10-12
desiderata: .mw/desiderata.md v2 FROZEN (World Surface, tier eventi, invasione goblin)
---

# PLAN-033 — /game: sequenza evento invasione

## Spec

> Battezzato dopo esplorazione e approvazione esplicita del Director ("approvo", 2026-10-12).
> Non è stata eseguita la deliberazione multi-AI né il claim challenge con secondo agente: i claim sono ipotesi da lettura di codice e asset, da falsificare in T-001/T-002.

### Problema (segnalato dal Director su `/game`)
1. La tendina di nuvole dell'evento non si chiude completamente.
2. La card dell'evento finisce parzialmente sotto la HUD: va resa centrata e con forma corretta.
3. I goblin non appaiono subito e, quando appaiono o "si dividono", sembrano doppi (regressione di bug già risolti).
4. La card deve diventare una riga nel registro eventi; se il registro è chiuso, si apre.
5. Extra: le linee delle regioni seguono pedissequamente il bordo (devono essere più dritte) e sono sopra le nuvole (devono stare sotto).

### Decisioni del Director
- **Tendina:** ri-esportare gli asset (niente toppa CSS).
- **Goblin:** resta sulla mappa dopo l'evento e si muove lentamente verso il villaggio in ~30 giorni di gioco. Appare insieme alla card "post shroud", nel punto in cui oggi atterra lo sticker (non da un'altra parte). L'esito al giorno 30 NON fa parte di questo piano (sarà un evento di difesa del villaggio, futuro).
- **Salvataggio:** si salva il giorno di partenza della marcia; la posizione al caricamento è quella del momento del salvataggio (derivata da `startDay`).
- **Registro eventi:** si apre quando arriva la riga; se era chiuso, dopo circa 1 s si richiude. Se era già aperto resta aperto.
- **Linee regioni:** tracciato semplificato (più dritto), disegnato sotto le nuvole.

### Contesto tecnico (da lettura di codice, non eseguito)
- `/game` = `src/pages/game-frame-pixi.tsx`. Usa l'overlay DOM `WorldSurfaceEventShroud` (z 6, CSS in `trailer.css:483-530`); la mappa Pixi esclude i layer `event_shroud_*` (`PixiWorldMap.tsx:528`). La pagina di test (`WorldSurfaceTestPage`) usa i layer del renderer: non è un riferimento valido per T1.
- Asset `event_shroud_{left,right}_{ottanio,pergamena}.webp` 2822×1546: la sinistra è opaca in 0–50% e sfuma fino a 60%, la destra è speculare. Il crop CSS (due box 58vw, `object-fit: cover`) lascia una striscia semitrasparente al centro.
- La card è renderizzata in spazio mondo dentro `worldBoxRef` (`PixiWorldMap.tsx:1702-1712`), centrata sul canvas 4240×2828, camera fissa a zoom 1; scala ~3,4×. Il wrapper ha `isolation: isolate`, quindi lo z-index 7 non supera la HUD (z 8–12, `gameFrameConfig.ts:487`).
- Il goblin esiste solo dentro la card (`WorldSurfaceEventCard.tsx`, `GoblinInvasionWindow.tsx`); dopo `onClose` resta solo la riga `invasion` nel registro (`game-frame-pixi.tsx:317-326`). Sdoppiamento: due immagini impilate nella finestra (`GoblinInvasionWindow.tsx:432-465`) e coesistenza ~0,5 s con lo sticker staccato (`AnimatePresence mode="wait"`).
- Registro: `HudEventLedger` (pannello `events`, `hudPanelRegistry.ts:9`, `useHudPanels`).
- Linee regioni: `PixiWorldMap.tsx:1360-1470` (maschera raster da `region_ids.png`, blur + soglia + erosione); sprite aggiunto con `world.addChild` dopo i layer nuvole.

### Claim da falsificare durante l'implementazione
1. La tendina fallisce per trasparenza degli asset al centro.
2. La card è nascosta dall'`isolation: isolate`; uno slot `GameFrame` la risolve.
3. Lo sdoppiamento viene dalle due immagini nella finestra + coesistenza con lo sticker.
4. Il giorno di gioco è leggibile nello stato di `/game` e il salvataggio può contenere `startDay`.
5. `panels.set('events', …)` apre e chiude il pannello.
6. Le linee semplificate non rompono l'hit-test dell'hover (`idAt`).
7. Il punto di atterraggio dello sticker è fuori dal villaggio.

### Not in scope
- Esito e gameplay dell'evento di difesa al giorno 30.
- Modifiche ai layer `event_shroud_*` della pagina di test e al manifest (`manifest.json:522-548`).
- Nuove animazioni oltre a quelle descritte.

### Decisioni ancora aperte
- Nessuna bloccante. Da verificare in T4: se il punto di atterraggio non è "fuori" dal villaggio, il planner/Director decide un altro punto prima di procedere.

### Behavioral Verification
Su `/game`, a 16:9 e 21:9, con screenshot e campionamento pixel (non solo a occhio):
- **BV-1** a sequenza chiusa, la colonna centrale della tendina ha alpha pieno (nessun varco).
- **BV-2** la card è interamente dentro l'area libera fra le bande HUD, sopra i pannelli.
- **BV-3** nessun fotogramma con due goblin nel passaggio finestra → sticker → mappa.
- **BV-4** il marker goblin è al punto di atterraggio a giorno 0, a metà a 15, al villaggio a 30; identico dopo ricaricamento.
- **BV-5** pannello `events` chiuso→aperto→richiuso dopo ~1 s; già aperto→resta aperto.
- **BV-6** l'anello della regione è sotto le nuvole e le ombre; l'hover seleziona le stesse regioni di prima.
- Gate su `completed`: `BV PASS` / `BV BLOCKED`.

## Tasks

- [~] **T-001 (codice fatto, BV-2 non verificata nel browser) — Card in spazio schermo.** Fuori da `worldBoxRef`, in uno slot sopra i pannelli, centrata sull'area libera (stessa di `safeFit`). Target di caduta/marcia dello sticker convertiti dalla camera viva. Falsifica claim 2. Acceptance: BV-2.
- [~] **T-002 (CSS 58vw→125vw; copertura verificata sui pixel degli asset, BV-1 da verificare a schermo) — Tendina chiusa.** Ri-esportare i quattro webp con nucleo pieno fino alla giunzione e sovrapposizione; adattare il crop in `trailer.css`. Verificare prima il claim 1 con misura pixel sul rendering reale. Acceptance: BV-1.
- [~] **T-003 (sticker montato a peeling, finestra nasconde il suo goblin; BV-3 da verificare a schermo) — Fine dello sdoppiamento.** Nascondere l'immagine della finestra allo stacco dello sticker, uscita istantanea, sticker montato a `peeling` con precaricamento. Falsifica claim 3. Acceptance: BV-3. `depends: T-001`
- [~] **T-004 (codice fatto; BV-4 da verificare) — Goblin che marcia.** Marker in spazio mondo che nasce al punto di atterraggio dello sticker e cammina verso il villaggio; progresso = (giornoCorrente − startDay)/30 limitato a 1; salvataggio di `startDay`. Verificare claim 4 e 7 prima di scrivere. Acceptance: BV-4. `depends: T-003`
- [~] **T-005 (apre `events` alla riga nuova, richiude dopo 1 s se era chiuso; BV-5 da verificare) — Handoff al registro.** A fine sequenza si apre `events`, la card si rimpicciolisce verso la riga evidenziata; se era chiuso si richiude dopo ~1 s. Falsifica claim 5. Acceptance: BV-5. `depends: T-001`
- [~] **T-006 (anelli sopra terra e sotto le nuvole; contorno tracciato e semplificato con Douglas-Peucker, 5 test unitari verdi; aspetto a schermo da verificare) — Linee regioni.** Contorno tracciato una volta e semplificato; sprite in un contenitore creato prima delle nuvole (non calcolato su `children.length`). Falsifica claim 6. Acceptance: BV-6.
- [ ] **T-007 — Test visivi Playwright.** Copertura di BV-1, BV-2, BV-3 a 16:9 e 21:9. `depends: T-001, T-002, T-003`
- [~] **T-009 (implementato, 2026-10-12; E2E 3/3) — Freeze del clock durante il teatro + wake HUD.** Director (R-169): mentre lo shroud si chiude, la card gioca e le tende si riaprono, il tempo è fermo; a fine animazione torna allo stato pre-trigger (paused→paused, 2x→2x — lo snapshot salva `isPaused`, il multiplier non è mai toccato). Implementato in `game-frame-pixi.tsx`: snapshot+`pauseGame('auto')` sul rising edge di `shroudCovered`, release +1000ms dopo il falling edge (tende 900ms), `timeInputLocked` su `GameFrameScreen`/`useTimeEngineLoop` per mutare Space/1-9/click durante la sospensione. Wake HUD: `hudWakeSignal` prop su `GameFrame` (+ `events.length` nel signal) → il chrome torna anche da nascosto. La marcia del goblin (~16min) NON è teatro: clock già ripristinato. Spec `tests/e2e/idleVillage/gameEventFreeze.spec.ts`.
- ⚠️ **Nota collaterale (2026-10-12):** lo spawn dei sea wonders sembra rotto — il bump del Director (`wonderRequest`) produce `__wonders()=0` su 8/8 tentativi sul dev server; anchor liberi esistono (7/10 non coperti da wave mark attivi). Da investigare nel blocco `spawnWonder` (build `PixiWorldMap`, territorio di questo piano).
- [ ] **T-008 — Documentation & Knowledge Update.** Aggiornare le note su `/game` e sequenza evento (`context/`, `hud_component_guide.md`), e l'indice dei piani. `depends: T-001…T-007`
