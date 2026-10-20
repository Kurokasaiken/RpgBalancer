# Inventario: tutto ciò che il giocatore vede su /game e stato dell'audit (2026-10-20, R-234)

Risposta a: *«Ci sono altri elementi che stiamo dimenticando?»* Sì. Qui c'è l'elenco completo, ricavato dai componenti in `components/gameFrame/`, `components/` e dal menu di gioco, con lo stato di copertura. **Esaminato** = scheda con catture e critica · **Parziale** = visto di passaggio · **Mai** = non ancora guardato.

> **Aggiornamento F5 (2026-10-20):** esaminati anche invasione goblin, tooltip delle regioni, rapporto finale dopo una sconfitta, menu di sessione, it-IT a 1280. Vedi [F5_secondo_giro.md](F5_secondo_giro.md) §13 per ciò che resta.

## Esaminati

| Elemento | Scheda |
|---|---|
| Skill check (colonna) | F1c, F2 |
| QuestRunWindow: header, scelte, barra, cronaca fasi, minimizzata, abbandono, rapporto | F3 QuestRunWindow |
| Teatro / quest cinematografica | F3 quest cinematica (**da ricatturare** dopo il fix Pixi) |
| POI quest, planner, roster V2, slot, tray, forecast | F3 POI/planner |
| Village Stash (pannello + 3 ingressi) | F3 Stash |
| HUD fissa: MENU, tempo, risorse, nav, Pannelli, Nascondi, registro eventi | F3 HUD (+ §12 ri-audit) |
| Hero sheet, Mercante, vista Village + Registro | F3 Hero/Mercante/Village |

## Parziali (visti, senza scheda propria)

| Elemento | File | Cosa abbiamo visto | Cosa manca |
|---|---|---|---|
| Rapporto finale / Epilogo | `QuestRewardPopup.tsx`, `QuestEpilogue.tsx` | «SURVIVED — NO REWARD» + «COLLECT REWARDS» incoerenti | stati vittoria/sconfitta/morte, messa in scena |
| Toast d'esito | `QuestOutcomeToast.tsx` | — | quando compare (`skipIntro`, check esterni) |
| Rotta del viaggio sulla mappa | `QuestJourneyRoute.tsx` | linea d'oro dal villaggio al POI (minimizzata) | andata/ritorno, marker del party, stile |
| Menu di gioco | `HudGameMenu.tsx` | 19 voci, tema Lacquer Atlas ancora presente | Save/Load/Quit to title, «All settings…» |
| Opzioni check | `QuestCheckOptionsPanel.tsx` | due checkbox (salta intro, salta check) | effetto reale delle due opzioni |
| Cronaca della quest | `QuestLogPanel.tsx` | colonna alta quasi vuota | contenuto a fine run |
| Secondo POI («The Ruins beneath the River») | `MapQuestPoi.tsx` | compare col tempo | planner e run della seconda quest |
| Velo di boot | `GameBootScreen.tsx` | logo + «Ready» | durata, transizione verso la mappa |

## Mai esaminati

| Elemento | File | Perché conta per il giocatore |
|---|---|---|
| **Invasione goblin** (evento di mondo) | `WorldSurfaceEventShroud.tsx`, `WorldSurfaceEventCard.tsx`, `GoblinInvasionWindow.tsx`, `WorldPresenceRail.tsx`, `context/GAME_INVASION_SEQUENCE.md` | il momento più spettacolare del mondo (le pergamene che si chiudono): è «cinema» quanto la quest |
| **Tooltip delle regioni** | `RegionTooltip.tsx` | primo testo che il giocatore legge passando sulla mappa |
| **Atmosfera della mappa** (mare, onde, uccelli, nuvole, creature) | World Surface / atmosphere | dà vita alla mappa; da verificare il congelamento in headless e il costo |
| **Cursori di gioco e cursore di trascinamento** | `gameFrameCursors.css`, `GameFrameDragCursor.tsx` | ogni gesto passa da lì; mai catturati |
| **Level-up dell'eroe** | `rosterV2/HeroLevelDecor.tsx`, `heroLevelUpEvents.ts` (PLAN-032 SP-5) | ricompensa visibile dopo la run |
| **Dettaglio edificio / upgrade** | `MockUpgradeControl.tsx`, `MockBuyControl.tsx` | tutte le azioni del villaggio sono «preview only» |
| **Viste Workshop e Tavern** | nav bloccata | il clic ha nascosto la HUD (da verificare) |
| **Schermate di sessione** | Save / Load game… / Quit to title / All settings… | prima e ultima cosa che il giocatore tocca |
| **Lingua italiana** | i18n `it-IT` | tutte le schede sono state viste in inglese |
| **Overlay dello skill check** (percorso portal) | `QuestSkillCheckOverlay.tsx` | attivo quando non c'è la geometria del cluster |
| **Suono** | `questTheatreAudio.ts`, astrolabio (`removeSounds`) | metà del «cinematografico» |
| **Viewport 1920 / 2560 / Steam Deck reale** | — | target dichiarati dalla guida HUD |

## Solo sviluppo (non al giocatore, fuori perimetro)

Director (F10 / D), Tuning (T), `MapDemoPoi`. Il **tema** e le voci dev nel menu vanno verificate in build di produzione (F3 HUD §5.8).

## Ordine proposto per finire (solo proposta)

1. Ricattura del teatro dopo il fix Pixi.
2. Invasione goblin.
3. Rapporto finale, toast, level-up: il ritorno dalla quest.
4. Sessione (save/load/titolo/impostazioni) e it-IT.
5. Atmosfera, cursori, tooltip regioni.
