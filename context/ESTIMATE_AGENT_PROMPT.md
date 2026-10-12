# Prompt per gli agenti: dati per la stima di RPG Balancer (v2, ridotto)

Incolla il blocco sotto a un agente con accesso al repo. Output in `context/ESTIMATE_INPUT.md`.
Già noto, NON rifare: stato dei sistemi (CURRENT_STATE.md), teaser a 7 scene (R-072), direzione (DESIGN_PILLARS.md). Business: premium ~14.99, nessuna pagina Steam, nessuna scadenza, tempo libero pieno, obiettivo = reputazione, prima uscita = teaser trailer in-engine poi demo Next Fest.

---

Sei un auditor tecnico. Raccogli fatti verificabili da repo e git; NON stimare tu. Separa sempre **FATTO (path o comando + output)**, **INFERENZA**, **NON SO**. Niente ottimismo.

## A. Distanza dal core loop giocabile e dalla demo
1. Per il core loop su `/game` (mappa → quest → astrolabio → conseguenza → ritorno al villaggio): per ogni passaggio dì se è collegato end-to-end o solo in lab/test hub. Elenca ciò che impedisce di giocare 30 minuti di fila senza il Director a guidare.
2. Contenuto giocabile oggi: n. quest (authored), POI, tipi di evento, residenti/eroi, oggetti, ore di gioco stimabili (con metodo).
3. Per una demo di 30-60 min: elenco di cosa manca (contenuto, onboarding/tutorial, salvataggio, fine demo, schermata titolo/menu/opzioni). Una riga per voce, con file/plan di riferimento se esiste.
4. Per il teaser R-072 (55 s, 7 scene): per ogni scena, stato (registrabile oggi in-engine? sì/no/parziale), cosa blocca, file.

## B. Misure di codice e velocità storica (comandi eseguiti, output incollato)
1. LOC per cartella (escludi node_modules/build/generati), n. file, n. test e stato attuale (con Node 22).
2. git: n. commit, primo commit, commit/settimana ultime 26 settimane, separando umani / AI worker / coordinator.
3. Velocità: plan/slice completati per mese (plans/INDEX.md), tempo medio per slice, tasso di rework (fix/revert dopo "completed").
4. Debito tecnico: TODO/FIXME, file > 1000 righe, codice morto, feature flag, aree fragili note (memory e DECISION_LOG).
5. Performance su `/game`: build size, tempo di avvio, FPS con mappa + HUD + atmosfera, memoria. Se non misurabile: dì come misurarlo.

## C. Piattaforma
1. Esiste una build desktop (Tauri/Electron) funzionante su Mac e Windows? Cosa manca. Steamworks (achievement, cloud save): stato.
2. Salvataggi: versioning, migrazioni, rischio corruzione. Gamepad/Steam Deck, risoluzioni, localizzazione (lingue, stringhe hardcoded IT: quante).
3. Audio: musica/SFX presenti? licenze? quanti ne servono per la demo.

## D. Asset
1. Inventario asset (conteggio, provenienza AI/disegnato/acquistato, licenza, risoluzione). Quanti AI-generati (serve disclosure Steam)? Licenze incerte?
2. Costo per produrre un asset nuovo coerente con lo stile approvato; cosa è pipeline riproducibile e cosa one-off.
3. Scene "catturabili" già pronte per trailer/screenshot/capsule e quelle mancanti.

## G. Capacità di lavoro
Ore/settimana reali dai log e dai commit (orari), quota lavoro agenti AI, costo mensile API/abbonamenti da `.mw/runs` e log. Solo dati, non supposizioni.

## Formato
Sezioni A–D e G, tabelle, ogni cifra con la fonte. In fondo: "Domande che non so risolvere dal repo" (max 10).
