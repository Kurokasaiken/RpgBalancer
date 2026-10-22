# PLAN-076: Menu di gioco — Carica partita, Impostazioni, Esci al titolo, schermata titolo (DN-7 di PLAN-067)

**Status:** `baptized` — Director 2026-10-22 («PLAN-076 approvato, procedi (battesimo + check P8 + esecuzione)», via sessione madre). Check P8: vedi `.mw/plan-dispositions/PLAN-076-dn7-game-menu-save-load-settings-title.jsonl`.
**Richiesta:** DN-7 (PLAN-067, Director 2026-10-21: «implementare»). Scelte fork e risposte O-1…O-5 ricevute dal Director via sessione madre il 2026-10-22.
**Desiderata:** v36 FROZEN (contratti vivi `/game`), v35 FROZEN (visual fork gate). Nessun drift: realizza fork già decisi.
**Fonte:** `src/docs/docs/game_surface_audit/F8_menu_carica_impostazioni_titolo.md`; mockup `mockups/menu-fork-v1.html` (+ `menu-v1-png/`).
**Visual-fork:** card da emettere a T-0 (`.mw/runs/plan076-fork/visual-fork-menu.md`) con baseline PNG + sha256 delle opzioni scelte: LOAD-1 **A**, SET-1 **A**, QUIT-1 **B**, TITLE-1 **A**; condizione: valutato a 1280×720, il ruling non si estende ad altre viewport. Azione primaria = pillola neutra (BTN-1 aperto: nessun uso della placca CTA, nessun viola, nessun testo sopra immagini).
**Headless:** ogni cattura/witness è headless/background, porta vite 5198 (mai 5191/5197/5173); l'eye-check visivo è un passo manuale del Director (`.windsurf/rules/16`).

## 1. Grounding (verificato 2026-10-22)

- `HudGameMenu.tsx`: «Carica», «Esci», «Tutte le impostazioni» sono `stubProps` disabilitati; Salva ora usa `gameplay.saveNow()`. Tema già tolto (DN-6, `INV:R-234-menu-no-theme`).
- `saveNow()` (`src/store/useMinimalGameplay.ts`) salva **solo** `minimal-gameplay-state`. Il progresso sta in `gameProgressKeys()` (`questInitialState.ts`): gameplay, `idle_village_state` (+`_history`), POI consumati, `invasion_v1`, `expeditionLoadout`, `idleVillage.questRun.<id>`, bozze `idleVillage.questExpeditionDraft.*`. → «Salva ora» oggi è incompleto; caricare una sola chiave dissincronizzerebbe quest/invasione/dispensa.
- Autosalvataggio 30 s (`autosaveIntervalMs`) su un'unica chiave; serializer con checksum (`minimalSnapshotSerializer.ts`) solo per il gameplay.
- Nessuna schermata titolo: `GameBootScreen` è un velo (anche fallback Suspense in `App.tsx`).
- Audio: nessuna impostazione in /game; `questTheatreAudio` usa un AudioContext condiviso; `useAudioCueConfig.setMasterVolume` non collegato. Trappola T-10: mai `new AudioContext()` in un'animazione.
- Reset affidabile = `clearGameProgress()` + `window.location.reload()` (pattern Director «Stato iniziale»).
- Trappole: T-03 (scope `data-hud-controls` sul root del menu, anche per dialog/popover), T-04 (witness), T-11 (ICU `{{var}}` letterale), T-13 (sessioni parallele: commit scoped, `HudGameMenu.tsx` condiviso → commit solo dei propri hunk), T-14/T-15, T-16 (overlay portaled a `document.body`), T-21 (controlli nativi in pill).

## 2. Decisioni (Director 2026-10-22)

| ID | Decisione |
|---|---|
| O-1 | 3 slot manuali + 1 autosalvataggio, rotazione singola |
| O-2 | «Nuova partita»: conferma come QUIT-1 B (mostra giorno e ultimo salvataggio); testi it-IT/en scritti dall'esecutore, sobri, elencati nel report per revisione |
| O-3 | Criterio più semplice sul contesto audio condiviso, mai nuovi AudioContext; mappatura cue→canale documentata in §6 |
| O-4 | «Esci dal gioco» nascosta nel browser, visibile solo in Tauri |
| O-5 | Intervallo autosalvataggio escluso dalla demo (fisso 30 s); la riga non compare in Impostazioni |

## 3. Task (ogni passo richiede lo stato garantito dal precedente)

Ogni task che muta comportamento porta: `npm run sync:bug -- --component <id> --source-ref DN-7` (Mode A per i difetti, Mode B-add per le nuove invarianti), `redfirst:record`, test permanente con tag `// INV:`; ruolo non visivo → `visual-fork: skipped — perimetro non visivo (file in src/engine|src/store)` con puntatore ai file.

### T-0 — Card visual-fork e baseline
Emettere la card (scope: LOAD, SET, QUIT, TITLE), baseline PNG + sha256 dai file `menu-v1-png/{load-A,set-A,quit-B,title-A}.png` congelati al ruling del Director. *Done:* card con `selected` e `baseline_frozen_at` valorizzati.

### T-1 — Pacchetto di salvataggio atomico e versionato (non visivo)
Nuovo modulo (es. `src/shared/persistence/gameSave.ts`): `captureGameSave()` legge **tutte** le chiavi di `gameProgressKeys()` + bozze, produce `{ schemaVersion, appVersion, savedAt, meta:{day, settlementName, heroes, expeditionsActive, gold}, entries:{key→value}, checksum }`; `restoreGameSave()` valida (checksum, versione) e scrive **tutto o niente** (staging + rollback su errore), poi segnala il reload. Aggiunge un `listSaves()`.
*Contratto:* test unitari red-first: round-trip, checksum corrotto → rifiutato senza scrivere nulla, versione più nuova → rifiutata con motivo, scrittura interrotta a metà → stato precedente intatto.
*Done:* `npm run test -- tests/unit/persistence/gameSave*.test.ts` verde.

### T-2 — Slot, autosalvataggio e correzione di `saveNow()`
Slot manuali + slot auto separato (mai sovrascritto dai manuali); autosalvataggio e «Salva ora» usano `captureGameSave()` (corregge il difetto latente: salvataggio parziale). Miniatura: cattura del canvas Pixi a 224×126 solo a salvataggio manuale/auto (O-1). Retrocompatibilità: lettura di vecchi `minimal-gameplay-state` come slot «Autosalvataggio (legacy)».
*Contratto:* Mode A su `saveNow` (INV: il salvataggio contiene le chiavi di quest/invasione/dispensa); test che fallisce se `saveNow` torna a salvare una chiave sola. Witness headless: salva → pulisce → ripristina → stesso stato di tre quest/invasione.
*Done:* test verde + evidenza `.mw/runs/plan076-t2/`. Non verificabile in preview pane la miniatura se rAF fermo (T-04): dichiarare.

### T-3 — «Carica partita» (LOAD-1 A, lastra centrale con velo)
Componente `LoadGamePanel` (`HudPlaque panel`, pillole `data-hud-controls` sul root, portale a `document.body` — T-16), righe slot (insediamento, giorno, ora, eroi, miniatura 112×63, tag Autosalvataggio), «Carica» (pillola primaria neutra), «Elimina», messaggio di sostituzione con quanto si perde (`lastSavedAt`). Conferma prima di sostituire. Slot corrotto/versione nuova: riga con motivo, non caricabile. Cablaggio in `HudGameMenu` (solo gli hunk della voce, T-13). Chiavi i18n en + it-IT (`gameFrame.menu.load*`, T-11).
*Contratto:* Mode B-add su `hud-game-menu`; test componente (stati: vuoto, selezionato, sostituzione, corrotto); same-viewport pre-registrato a 1280×720 vs baseline `load-A.png`; `human-eye` side-by-side.
*Done:* test verde + witness headless 5198 + side-by-side.

### T-4 — Impostazioni (SET-1 A, una lastra a sezioni)
Lastra «Impostazioni»: Generale (lingua; autosalvataggio solo se O-5), Audio (principale/effetti/musica sul contesto condiviso, persistiti; O-3), Interfaccia (dimensione — riusa `useHudScale`; movimento ridotto persistito + applicato ai componenti che già leggono `prefers-reduced-motion`, boot veil incluso), «Ripristina». Voce menu «Tutte le impostazioni» sostituisce le righe lingua/dimensione sparse oppure le richiama (decisione: lasciare le righe esistenti, evitare regressioni).
*Contratto:* Mode B-add; test: i tre volumi persistono e agiscono sul gain del contesto condiviso (nessun nuovo AudioContext — T-10); reduced-motion porta le durate a 0.
*Done:* test + witness audio (gain misurato, non udito: **dichiarare che l'ascolto resta al Director**).

### T-5 — «Esci al titolo» (QUIT-1 B, conferma solo se c'è qualcosa da perdere)
`hasUnsavedProgress()` = stato cambiato dopo `lastSavedAt`. Se no → esce subito; se sì → lastra con «Annulla / Non salvare / Salva». Uscita: ferma timer di gioco, audio e autosave, scrive se richiesto, torna alla schermata titolo (T-6) senza lasciare stato in memoria (pattern reset+reload).
*Contratto:* Mode B-add; test: salvato → nessun dialog; modificato → dialog; «Non salvare» non scrive; nessun timer vivo dopo l'uscita.

### T-6 — Schermata titolo (TITLE-1 A) e «Nuova partita»
Nuova route/stato `title` prima di `/game`: logo, filetto d'ottone, colonna Continua · Giorno N / Nuova partita / Carica partita / Impostazioni / Esci dal gioco (O-4). «Continua» carica il più recente. «Nuova partita» con conferma se esiste progresso (O-2, fork di testo). Riusa i token del velo di boot; `GameBootScreen` resta il velo di caricamento.
*Contratto:* Mode B-add (nuovo componente → contratto nuovo `game-title-screen`); same-viewport vs `title-A.png`; test: senza salvataggi «Continua» assente.

### T-7 — Chiusura
Tutti i contratti `sync:bug`/`redfirst` registrati; `npm run closure:lint`; `verification.json` → `verify:bundle` → `bundle.json`; voce `fatta` in `RICHIESTE.md`; aggiornare `COMPONENT_MASTER_INDEX`/INVENTARIO; rimuovere `comingSoon` e chiavi orfane. *Done:* bundle verde; elenco esplicito di ciò che **non** è verificato (ascolto reale, miniatura su Metal reale, Tauri/«Esci dal gioco», 2560×1440 e 1440×900 non coperti dal ruling).

## 4. Rischi
Slot multi-chiave: atomicità e versioni; miniatura WebGL; sessioni parallele su `HudGameMenu.tsx`; reload come reset (scritture in volo); mancanza di fonti verificate sui giochi di riferimento (F8 §3).

## 5. Contratto di chiusura

- **OB-1** Unit permanenti red-first (gameSave, slot, saveNow completo, hasUnsavedProgress, volumi).
- **OB-2** Witness headless su porta 5197 (harness `game_surface_audit/harness`), evidenza `.mw/runs/plan076-*/`.
- **OB-3** Living-contract sync: `sync:bug`/`redfirst:record`/`// INV:` su `hud-game-menu` e nuovi contratti; `contracts:check` verde.
- **OB-4** Regression test permanente per ogni task comportamentale (R-247).
- **OB-5** `lint` / `build:check` / `closure:lint` verdi; elenco esplicito del non verificato.
- **OB-6** `human-eye` Director: side-by-side baseline vs implementazione a 1280×720.
- **OB-7** `verification.json` → `verify:bundle` → `bundle.json`; voce `fatta` in RICHIESTE.

## 6. Mappatura audio (O-3)

Da compilare a T-4 dopo lettura di `questTheatreAudio`.

## 7. Verifiche pre-battesimo (storico)
1. Il Director conferma in chat le scelte LOAD-1 A / SET-1 A / QUIT-1 B / TITLE-1 A (oggi note solo via messaggio dalla sessione madre).
2. Risposte O-1…O-5.
3. Check P8 (`mw-plan-disposition.py`) — **non eseguito**.
