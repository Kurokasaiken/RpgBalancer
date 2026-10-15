# Pubblicazione pagina Steam — checklist (2026-10-13)

Pacchetto pronto: `marketing/steam/upload/` (nomi e misure degli slot Steamworks).
Anteprima: `python3 -m http.server` su `marketing/steam` (config `steam-preview` in `.claude/launch.json`) → `/preview/`.
Rigenerare la preview dai file canonici: `python3 -I marketing/steam/tools/sync-preview.py`.
Controlli automatici: `npx tsx marketing/steam/tools/check-page.mts` → **45/45 PASS** (misure, limiti, link, parole vietate, BBCode).

## 1. Fatto (verificato dallo script)
- Capsule (header 920×430, small 462×174, main 1232×706, vertical 748×896), library capsule/hero/logo, page background, icone: misure Steam 2024.
- 5 screenshot 1920×1080 in EN dal build reale (mappa, planner con forecast, scelta, conseguenza, ritorno).
- 3 GIF per l'About, tutte < 5 MB (9 MB in totale), larghezza ≤ 616.
- Short description EN 249 / IT 278 caratteri (limite 300), testo semplice, genere nelle prime parole.
- About EN/IT ~400 parole (sotto le ~600 del "Read More"), nessun link, nessuna parola vietata dal claim ledger, 3 GIF.
- 19 tag, ordine in `upload/copy/tags.txt` (le prime 5 pesano).

## 2. Bloccanti: servono tu o Steamworks (non li posso fare io)
| # | Cosa | Perché blocca | Stato |
|---|---|---|---|
| B1 | **Verifica marchio** «Wanderlust: Triumph» (EUIPO/USPTO) prima di stampare il logo nelle capsule | D1 in `context/STEAM_PAGE_PLAN.md`: esiste il franchise «Wanderlust» (Different Tales) | da fare |
| B2 | **Questionario contenuti AI** compilato in Steamworks, coerente col testo di `ai-disclosure.md` | D5: bloccante; è pubblico sulla pagina | da fare |
| B3 | **Provenance audit** dei prompt (nessun nome di artista vivente) + conferma dei paintover a mano | TODO in `ai-disclosure.md`; il post community dice «ho ricercato artisti», quindi va fatto | da fare |
| B4 | **Test di comprensione**: 5 estranei di fila, zero fraintendimenti, sull'intera sequenza (capsule + short desc + screenshot) | gate §2.1 del piano | da fare |
| B5 | **Account Steamworks** (fee 100 $, fiscale/bancario) e app creata | prerequisito | da fare |
| B6 | **Trailer**: lo carichi tu quando è pronto. Senza trailer serve un waiver scritto del Director (gate §7 del piano) | detto in chat il 2026-10-13: «lo caricherò quando sarà pronto» | waiver da registrare |

## 3. Decisioni prese e punti aperti
- **Lingue dichiarate: solo EN + IT** (Director, 2026-10-13). Le altre restano nella roadmap dell'About, non nella tabella lingue.
- **Requisiti di sistema: sì, subito** (`upload/copy/{en,it}/system-requirements.txt`). Sono stime prudenti dallo stack (Tauri/WebView2, mappa WebGL, ~230 MB di asset): Windows 10 64 bit, dual-core 2 GHz, 4 GB RAM, GPU con WebGL 2, 1 GB di spazio. Su una pagina Coming Soon si possono correggere in qualsiasi momento: **validali sul build prima della demo** (RAM reale, spazio dell'installer) e aggiusta in Steamworks se serve. Piattaforma dichiarata: solo Windows, anche se Tauri produce anche macOS/Linux.
- **Metadati dell'app da sistemare prima del primo build per Steam** (non bloccano la pagina): `src-tauri/tauri.conf.json` ha ancora `productName` «Progetti Personali», identificatore `com.progetti-personali.app` e descrizione «A tactical combat game» (non è questo gioco). Compaiono nell'installer, nel nome dell'eseguibile e nel titolo finestra.
- **Achievements:** confermati ma la lista va definita; non vanno nell'About.
- **Event capsule 800×450** (opzionale): pronta, serve solo per i post di aggiornamento.

## 4. Passi di upload (Steamworks → Store Page)
1. Basic Info: short description da `upload/copy/{en,it}/short-description.txt`; link social (Discord ecc.) **nei campi link**, mai nell'About.
2. Graphical Assets: capsule/library/page background/icone da `upload/capsules`, `upload/library`, `upload/icons`.
3. Screenshots: i 5 in ordine `01…05`; **segnarne almeno 4 come adatti a tutti** (altrimenti sparisce dalle anteprime in hover).
4. Trailer: il primo slot; i primi due trailer vengono prima degli screenshot.
5. About This Game: incolla `about.bbcode`; carica le 3 GIF in «Store Page Assets» e sostituisci `{STEAM_CLAN_IMAGE}/gif-N.gif` con gli URL che Steam restituisce.
6. Tag: `upload/copy/tags.txt`. Poi ricontrollare i tag ogni mese (i giocatori possono spostarli).
7. Lingue, requisiti, AI survey, Release date «Coming soon».
8. Invio a review Valve ≥ 7 giorni lavorativi prima della pubblicazione desiderata (la pagina deve restare pubblica ≥ 2 settimane prima del rilascio).

## 5. Il moodboard: non sulla pagina store
- Gli screenshot Steam devono essere **gameplay reale** (niente concept art o mock): lì non entra.
- Nell'About ogni immagine deve mostrare una meccanica; il moodboard non ne mostra nessuna, e sul tema «nessun posto nel gioco» è proprio quello che crea aspettative non mantenute. Avendo già una key art più ricca del gioco come capsule, aggiungere altre immagini bellissime allarga il divario con ciò che si vede nel gameplay.
- **Dove sì:** nel post pinnato della Community Hub (`copy/*/community-post.md`, sezione «A World Built Around Wonder»), 3–5 immagini con didascalia «concept / mood, non gioco». Il testo già dice che «non sono necessariamente asset finiti». Va bene anche per devlog e Reddit.
- Anche queste sono immagini AI: il testo di disclosure le copre («most of the artwork»).

## 6. Dopo la pubblicazione
Nessun aggiornamento «a scadenza»: un update solo quando c'è qualcosa di dimostrabile (piano §7 F5). Il copy va **ri-auditato contro il build demo** prima del push Next Fest (`claim-ledger.md`).
