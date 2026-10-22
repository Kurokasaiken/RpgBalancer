# F8 — Menu di gioco: «Carica partita», «Tutte le impostazioni», «Esci al titolo»

Explorer, 2026-10-22. Origine: PLAN-067 DN-7 (Director, 2026-10-21: implementare). Nessun codice in `src/ui/**` toccato. Mockup: `mockups/menu-fork-v1.html` (12 fotogrammi 1280×720, PNG in `mockups/menu-v1-png/`).

## 1. Stato attuale (verificato nel codice)

- `HudGameMenu.tsx`: «Salva ora» funziona (`gameplay.saveNow()` → `saveMinimalGameplaySnapshot`). «Carica partita» e «Esci» sono `stubProps` (disabilitate, tooltip `comingSoon`); «Tutte le impostazioni» idem. Lingua (en/it-IT) e dimensione interfaccia (solo desktop, `scale`) sono reali. La sezione Tema è già stata tolta (DN-6).
- **Un solo salvataggio, ma i dati di progresso sono in più chiavi.** `saveNow()` scrive solo `minimal-gameplay-state`. Il progresso vive anche in `idle_village_state` (+ `_history`), `idleVillage.questPois.consumed`, `invasion_v1`, `idleVillage.expeditionLoadout`, una chiave per run di quest (`idleVillage.questRun.<id>`) e le bozze per giorno. L'elenco canonico c'è già: `gameProgressKeys()` in `questInitialState.ts` (usato dal Director «Stato iniziale»). **Conseguenza: «Salva ora» oggi non salva davvero tutta la partita**; caricare solo la chiave del gameplay dissincronizzerebbe quest, invasione e dispensa dal giorno.
- Autosalvataggio ogni 30 s (`autosaveIntervalMs`), sempre sulla stessa chiave: nessuna cronologia, nessuna distinzione auto/manuale, nessun metadato (c'è solo `lastSavedAt` e `currentDay`), nessuna anteprima.
- Nessuna schermata titolo. `GameBootScreen` è un velo di caricamento (logo, barra, didascalia) che svanisce; è anche il fallback Suspense. `/game` carica direttamente la partita (`hydrateFromSnapshot`).
- Reset a partita nuova: `clearGameProgress()` + `window.location.reload()` (Director). È la base per «Nuova partita».
- Impostazioni vere oggi: lingua, dimensione interfaccia. **Audio: nessuna impostazione in /game**; esiste `questTheatreAudio` (cue di quest, AudioContext condiviso) e un `useAudioCueConfig` con `setMasterVolume` ma non collegato a `/game`. Il rispetto di `prefers-reduced-motion` esiste nei componenti (boot veil, guida §6.7), non è un'opzione del giocatore. Le scorciatoie sono fisse (Spazio, 1–4, R, E, Q, H): nessun remap.

## 2. Cosa farebbe ognuna oggi / cosa deve fare per la demo Steam

**Carica partita.** Oggi: niente. Deve: elenco di slot con insediamento, giorno, ora, anteprima mappa, eroi; autosalvataggio separato dai manuali; conferma prima di sostituire la partita in corso (con quanto si perde: «Giorno 14, salvata 2 min fa»); gestione slot corrotto/versione diversa (c'è `deserializeSnapshot` con checksum). Serve **prima** un modello di slot: un salvataggio = pacchetto di tutte le chiavi di `gameProgressKeys()` + metadati + miniatura (cattura canvas Pixi). Senza questo «Carica» non è fattibile.
**Tutte le impostazioni.** Oggi: nessuna schermata; reali solo lingua e dimensione. Per la demo bastano lingua, dimensione, audio (principale/effetti/musica, **da costruire**: oggi nulla le controlla), movimento ridotto (da costruire). Intervallo di autosalvataggio è un'aggiunta facoltativa. Non esistono e non vanno mostrate: grafica, comandi rimappabili, risoluzione.
**Esci al titolo.** Oggi: niente da cui uscire. Perde al massimo ≤30 s (autosalvataggio). Deve: svuotare lo stato in memoria (il pattern sicuro è già quello del Director: scrivere/pulire chiavi e ricaricare), non lasciare timer/audio vivi, portare a una schermata titolo che **non esiste**: Continua · Nuova partita · Carica · Impostazioni · Esci dal gioco (solo desktop). Quindi le tre voci richiedono un quarto pezzo, la schermata titolo.

## 3. Ricerca online (limiti dichiarati)

Fonti lette e fatti che ne ricavo:
- Factorio, thread «Make save game overwrites less dangerous»: lo staff ha aggiunto la conferma di sovrascrittura solo se il salvataggio scelto è di una versione più recente o ha più tempo di gioco (avviso rafforzato oltre 5 h in più); dichiara di non voler confermare «ogni azione potenzialmente dannosa». https://forums.factorio.com/viewtopic.php?p=475989 → modello per QUIT-B / conferma di caricamento «solo se c'è qualcosa da perdere».
- Steamworks, funzioni di accessibilità: la scheda chiede di dichiarare volumi personalizzati, testo regolabile, sottotitoli, contrasto, «giocabile al proprio ritmo». https://partner.steamgames.com/doc/accessibility_features → un giocatore Steam si aspetta volumi e dimensione.
- Game Accessibility Guidelines (livello base): «controlli o mute separati per effetti, voce e musica», font leggibile di default, contrasto alto. https://gameaccessibilityguidelines.com/basic/ → audio a tre canali.
- Thread di un forum su salvataggi di city builder (autosave periodico + salvataggi su eventi, slot a rotazione) e richieste di slot autosave separati dai manuali: https://forum.unity.com/threads/auto-save-system-for-a-simple-city-building-game.1341635/ e https://support.keenswh.com/spaceengineers2/pc/topic/51581-really-poor-save-management — **opinioni di sviluppatori/giocatori, non linee guida**.
- Una pagina di un blog («bugnet.io… prevent overwriting the wrong save») è comparsa solo come estratto di ricerca; la pagina letta direttamente non conteneva il testo, quindi **non la cito come fonte**.

**Non trovato**: documentazione verificabile di come Frostpunk, Against the Storm, Anno ecc. organizzano pausa/caricamento/uscita (le ricerche hanno dato solo forum e articoli generici; un articolo era 403). Quindi non posso affermare cosa facciano quei giochi; le forme A/B/C dei mockup derivano dai pattern generali sopra e dal materiale HUD del progetto, **da validare guardando i giochi di riferimento di persona**.

## 4. Fork (mockup `menu-fork-v1.html`, nessun marker «scelto»)

| Fork | A | B | C |
|---|---|---|---|
| LOAD-1 superficie dell'elenco | lastra centrale sulla mappa, velo | pagina intera, anteprima grande, plinth | lastra laterale accanto al menu, senza velo |
| SET-1 forma | una lastra, sezioni in colonna | pagina intera con binario categorie | dentro la tendina, niente schermata |
| QUIT-1 conferma | sempre, 3 scelte | solo se c'è qualcosa da perdere | mai, salva da solo |
| TITLE-1 titolo | colonna centrale su lacca (velo di boot) | dipinto mappa + colonna a sinistra | mappa viva + plinth in riga |

Raccomandazioni (non decisioni): LOAD **B** se si vuole l'anteprima che i giocatori si aspettano (costo alto) altrimenti **A**; SET **A** (oggi 7 righe, la forma B regge solo se cresce); QUIT **B** (coerente con Factorio, meno attrito; richiede `lastSavedAt` vs stato); TITLE **A** (riusa il velo esistente). Condizioni: valutato a 1280×720; il ruling non si estende ad altre viewport.

Vincoli di stile rispettati: token skin base, nessun viola, nessuna placca CTA (azione primaria = pillola neutra in attesa di BTN-1), niente testo sopra immagini, pillole `data-hud-controls`.

## 5. Rischi e aperti

1. Slot = pacchetto multi-chiave: atomicità (scrivere tutto o niente) e versioning; oggi `saveNow()` incompleto è un bug latente da dichiarare.
2. Miniatura: serve cattura del canvas Pixi (WebGL; nel preview pane il rAF non gira, T-04: verifica con witness reale).
3. Audio: scegliere dove vive il master volume (AudioContext condiviso, T-10: mai crearne di nuovi in animazione).
4. Tab/focus e gamepad non coperti; Esci dal gioco solo in Tauri.
5. i18n: nuove chiavi en + it-IT nel namespace `idleVillage`; ICU `{{var}}` letterale (T-11).
6. `HudGameMenu.tsx` è in mano a un'altra sessione (PLAN-067 T-A12): non toccato.
7. «Nuova partita» richiede una conferma: non coperta dai mockup.
