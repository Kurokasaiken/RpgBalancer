# F5 — Secondo giro: tutto ciò che il primo giro non ha visto (Opus, 2026-10-20, R-234)

> Richiesta (verbatim): *«e tutte le altre cose che nn abbiamo visto ed esaminato? adesso puoi esaminare anche quel tipo d cose che sn state sviste al primo giro? POI, POI detail (cn preview), la scheda dei personaggi, il componente che mostra gli oggetti nell'inventario, la quest, ecc?»*
>
> Ruling registrati prima del giro: SC-2 = **A2 Marea d'inchiostro**, icone barra = **I1 Sigilli sulla barra**, lastre in alto = **H1** (`rulings/`).
>
> Evidenze: `shots/round2/` con tre giri:
> - **A**: mappa → regioni → POI → planner con preview → scheda personaggio → inventario (tray oggetti e compagni) → magazzino → slot → roster → stash → mercante → eventi → menu → villaggio → registro → invasione. 37 stati a 1440×900, poi ripetuto a **1280×800 in italiano**.
> - **B**: quest completa, dal primo beat al rapporto finale, ai morti e al roster dopo la run. 27 stati.
> - **Probe invasione**.
>
> Ogni stato ha PNG, manifest e `*.lens.json`. Legenda: **FATTO** · **FLAG** · **NON VERIFICATO**.

## 0. Perché il primo giro ha mancato questi difetti, e cosa è cambiato

Il primo giro misurava **dentro** un componente per volta (centratura, contrasto, overflow nascosto) e leggeva ritagli ingranditi. Erano sfuggite tre classi di difetto: quelle **tra** elementi (testo su testo, controllo sopra la cornice), quelle **di famiglia** (font, palette, forme che cambiano da pannello a pannello) e quelle che compaiono **solo in certi stati** (tray aperto, italiano, 1280, dopo una morte).

Nuovo strumento `lensAudit` (in `harness/harness.mjs.txt`), misurato su **ogni superficie visibile** in **ogni stato**:

| Lente | Cosa trova |
|---|---|
| L1 | testo sovrapposto a testo |
| L2 | troncamenti («…», ellissi) |
| L3 | famiglie di font usate |
| L4 | colori fuori palette: ciano, verde e rosso saturi, viola |
| L5 | grammatiche di bottone (forma/altezza) |
| L6 | righe a zero |
| L7 | «cerchio con simbolo» (regola 6b) |
| L8 | testo sotto i 12 px |
| L9 | respiro dalla cornice sotto 22 px |

Più la lettura visiva di ogni foto e una **verifica di ogni claim sorprendente** prima di scriverlo: il caso dell'invasione in §6 è un mio errore corretto proprio così.

## 1. Riepilogo per superficie (FATTO, misure delle lenti)

| Superficie | Collisioni testo | Troncamenti | Font | Fuori palette | Grammatiche bottone | 6b | < 12 px |
|---|---|---|---|---|---|---|---|
| Lastre in alto + nav | 0 | 0 | Cinzel, EB Garamond, **system-ui** (1) | 0 | nav: 2 | 1 | 0 |
| Roster | **3** (LV sopra il nome) | 4 nomi in it/1280 | Cinzel + **system-ui ×12** | 0 | 2 | **6** | **12** (valori a **9 px**) |
| Planner (POI detail) | 0 a riposo; **3 col tray aperto** | 1 | Cinzel, EB Garamond | rosso + verde (Danger/Reward) | **6** | 2 | 8 |
| Scheda personaggio | 0 | 0 | **system-ui ×40** | **verde 8, ciano 9, rosso 7** | 2 | 1 | 0 |
| Tray oggetti / compagni | 0 | nomi compagni | — | — | — | — | — |
| Village Stash | 0 | 0 | **system-ui ×18** | **ciano 6** | 1 | 1 | 0 |
| Mercante | 0 | 0 | **system-ui ×21** | **ciano 5** | 2 | 1 | 0 |
| Registro eventi | 0 | 0 | Cinzel, EB Garamond | 0 | 2 | 1 | 0 |
| Menu di gioco | 0 | 2 | Cinzel ×31 | 0 | 1 | 0 | 0 |
| Tooltip edificio | 0 | 0 | **system-ui ×7** | ciano | 2 | 2 | 0 |
| **Registro del villaggio** | **10** | **8** | Cinzel, EB Garamond | **ciano 11** | 1 | 0 | 0 |
| QuestRunWindow | 0 | 0 | Cinzel, EB Garamond | 0 | **5** | **4** | 3 (11 px) |
| Rapporto finale | 0 | 0 | Cinzel, EB Garamond | rosso | 2 | 1 | 0 |

**Lettura:** la famiglia del Roster (Cinzel + EB Garamond, ottone) vale per HUD, planner, finestra quest, rapporto, eventi e menu. **Quattro superfici escono dalla famiglia** usando il font di sistema (`system-ui`) e il ciano o il semaforo come colore di significato: **scheda personaggio, Village Stash, Mercante, tooltip degli edifici**. Sono tutte del filone PLAN-032 (mock teaser), nate prima della guida HUD. È un singolo difetto di sistema, non quattro.

## 2. POI sulla mappa e tooltip delle regioni

- **FATTO** Il marker POI a riposo e in hover è identico salvo un leggero schiarimento. Non c'è tooltip, nome o rischio (la guida vieta il testo **sul** marker, non un tooltip). Il giocatore deve cliccare per sapere cos'è.
- **FATTO** I **tooltip delle regioni funzionano** («WHISPERING WOODS», «HOLLOW WOOD» con il confine disegnato): mai esaminati prima, sono tra le cose più belle e coerenti della mappa.
- **FATTO** Il secondo POI («The Ruins beneath the River») compare col tempo con un marker a stivale: la famiglia dei glifi va verificata (addendum S11).
- **FLAG** La regola «niente testo sul marker» lascia il POI muto. Il tooltip di regione dimostra che un'etichetta incisa al passaggio del mouse può stare nella famiglia della mappa.

## 3. POI detail con preview (planner)

- **FATTO, nuovo.** Con il tray aperto la preview si comprime (da 150 a 56 px, scelta WS-3) e **i tre sigilli «Danger / Reward / Duration» finiscono sopra il titolo «GOBLIN EXTERMINATION»**: L1 misura 3 collisioni (in italiano «Durata» sopra «Ordine di marcia»). Il layout compatto della testata non è stato progettato per i sigilli.
- **FATTO** «Danger **LETHAL**» in rosso e «Reward **DECENT**» in verde: semaforo (L4). In questa run il pericolo è salito da «High» a «Lethal» senza che cambiasse nulla nel party (**NON VERIFICATO** perché).
- **FATTO** KEY STATS con party vuoto mostra «STRENGTH —», «PERCEPTION —»: il trattino suona come un errore, non come «da coprire».
- **FATTO** In italiano la preview mescola le lingue: titolo, descrizione, ruoli degli slot («Expedition leader», «Fighter»…), nomi dei rischi («Iron and ash», «Run them down») e Intel restano **in inglese**.

## 4. Scheda personaggio

- **FATTO** In ogni contesto (roster sulla mappa, roster accanto al planner) è la stessa scheda: font di sistema, 40 testi, **3 colori di categoria** (rosso, ciano, verde), pallini come icone, **9 righe a zero** su 20.
- **FATTO** Si apre al passaggio sul roster. In una delle due run il passaggio successivo ha mancato l'elemento (il roster si era chiuso col planner, vedi F3 POI §6.5). Il **tasto P** non è stato provato con successo in nessuna run: **NON VERIFICATO** che funzioni.
- **FATTO, nuovo** Dopo una sconfitta totale **l'eroe morto sparisce dal roster** («ROSTER 5/6») senza traccia (niente lapide, niente memoria), mentre il rapporto lo nomina tra i «FALLEN». Lisetta è grigia senza spiegazione (**NON VERIFICATO**: ferita o assente).
- **FLAG** La scheda è un elenco di statistiche da ARPG. In un gioco dove gli eroi muoiono, è il posto della loro storia (spedizioni, ferite, cicatrici).

## 5. Inventario (bisaccia, tray, magazzino)

- **FATTO** Il tray oggetti mostra 6 tessere con icona e contatore «×2 / ×1» **minuscolo nell'angolo**. In hover il tooltip «STRENGTH BONUS — +15 TO ONE CHECK… In store: ×2» **esce dal planner e copre il roster**.
- **FATTO** Il tray compagni tronca i nomi («Sir Spaccac…», «Mastro Bep…»). In italiano si tronca anche la guida «Trascina un co…».
- **FATTO** «APRI MAGAZZINO» trabocca anche in italiano.
- **FATTO** A 1280 il Village Stash aperto dal planner **esce dal fondo** dello schermo: «7 DI 12 BENI IN DEPOSITO» è tagliato.
- **FATTO** L'inventario ha **tre presentazioni diverse dello stesso oggetto**:
  - tessera icona nel tray;
  - riga lunga sans + ciano nello stash;
  - riga col prezzo nel mercante.
  
  Nessuna è la «carta oggetto» della famiglia.

## 6. Invasione goblin (mai vista prima)

Sequenza catturata: tendina di nuvole → card «INVASION — In 5 days an army will attack!» → «Prepare the defenses» → lo sticker vola sulla mappa → riga nel registro eventi («Goblin host reaches the village», conto alla rovescia 4 g → 2 g → «today»).

- **Correzione di un mio errore.** Nel giro A la teca sembrava **vuota** (solo nebbia). La sonda dedicata ha mostrato il contrario: immagini caricate (1377 e 2752 px), filtro vetro attivo, e **a 2,5 s il goblin è visibile**. Il fatto vero è un altro.
- **FATTO** Per circa 2 s la teca è solo nebbia, ma il pulsante «Prepare the defenses» è **già cliccabile**: un giocatore rapido conferma l'invasione senza aver visto il nemico.
- **FATTO** La tendina copre tutto lo schermo con un motivo a nuvole al tratto su teal piatto. La card è piccola (≈ 300×400) al centro: grande annuncio, piccolo oggetto.
- **FATTO** Il goblin atterra sulla mappa come **sticker con bordo bianco** (scelta documentata in `GAME_INVASION_SEQUENCE.md`) e resta lì, grande quanto un gruppo di montagne.
- **FATTO** Il conto alla rovescia arriva a «**today**» e nulla accade: la difesa del villaggio non è implementata (documentato). Per il giocatore è una minaccia che si spegne da sola.
- **FATTO, nuovo errore** Durante la sequenza la console registra due volte **«Maximum update depth exceeded»** (React, setState in un effetto senza dipendenze stabili). Il componente colpevole **non è localizzato**.

## 7. La quest, da capo a fondo (giro B)

- **FATTO** Un'intera spedizione finita in **WIPE — EVERYTHING IS LOST**: Sir Spaccaculi morto.
- **FATTO** Rapporto finale:
  - **due titoli «EXPEDITION REPORT»** (testata e sezione);
  - chip **rosso su rosso** illeggibile;
  - lapide **viola** (colore fuori famiglia);
  - **il testo della finestra dietro traspare** attraverso il rapporto («…THE EMBERS» si legge sotto «Nobody came back»): la lastra del rapporto non è opaca.
- **FATTO** Cronaca delle fasi a fine run: «**−684 HP**», «**−216 HP**» con un eroe da 93 HP. Il difetto 2 di F4 (doppio conteggio) si riproduce.
- **FATTO** L'errore Pixi `reading 'ids'` si è ripresentato e **la mappa è sparita** dopo la run. Il fix è sul branch `claude/eloquent-goodall-4d2bf1`, non in questo checkout.
- **FATTO** Finestra quest: 5 grammatiche di bottone e 4 «cerchi con simbolo» nell'header (L5, L7), testo a 11 px nella striscia del viaggio.

## 8. Villaggio e registro

- **FATTO** Il **Registro del villaggio** è la superficie peggiore misurata: **10 collisioni testo-testo**, **8 troncamenti**, 11 testi ciano. Identico in italiano («Custodisce le scorte del…» sopra «Locanda»).
- **FATTO** L'ingresso nella vista Village è pulito in questo giro: nessuna fascia nera a 300/900/1800/3000 ms. Il «flash» del primo giro (F3 §C.4) **non si riproduce**: declassato a non confermato.
- **FATTO** **Esc chiude il registro** (`registryVisibleAfterEsc: false`): corretta la mia ipotesi di F3 §C.6.
- **FATTO** Workshop e Tavern sono `disabled`: il clic non fa nulla (l'harness non può cliccarli). La HUD sparita in F3 §C.7 era quindi un artefatto. Ma un pulsante bloccato **non dice perché** (né tooltip né «disponibile al livello…»).

## 9. Menu, sessione, lingua

- **FATTO** «Load game…», «Quit to title» e «All settings…» sono **disabilitati** (grigi, testo quasi invisibile) e non si possono aprire: il giocatore non può caricare né uscire al titolo dal menu.
- **FATTO** Italiano: le traduzioni coprono HUD, menu, pannelli; **mancano** i contenuti della quest (titolo, descrizioni, intel, nomi delle prove, ruoli degli slot).
- **FATTO** A 1280 in italiano la lastra del tempo perde la regione (solo «GIORNO 2»).

## 10. Nuovi difetti di correttezza (da aggiungere alla lista di F4)

| # | Dove | Difetto |
|---|---|---|
| 11 | Planner, tray aperto | sigilli della preview sopra il titolo (3 collisioni) |
| 12 | Tray oggetti | tooltip che esce dal planner e copre il roster |
| 13 | Village Stash a 1280 | esce di schermo dal fondo (già in F3, ora anche dal planner e in italiano) |
| 14 | Registro del villaggio | 10 collisioni + 8 troncamenti (titolo sopra descrizione) |
| 15 | Rapporto finale | lastra trasparente (testo dietro visibile), titolo duplicato, chip rosso su rosso |
| 16 | Invasione | «Maximum update depth exceeded» ×2 |
| 17 | Invasione | pulsante attivo prima che il goblin si veda |
| 18 | Roster dopo la morte | l'eroe morto sparisce senza traccia |
| 19 | i18n | contenuti quest non tradotti in it-IT |
| 20 | Menu | Load / Quit / All settings disabilitati senza spiegazione |
| 21 | Famiglia | 4 superfici PLAN-032 in `system-ui` + ciano/semaforo (hero sheet, stash, mercante, tooltip edifici) |

## 11. Nuovi problemi di cattura (seguito di F4 Parte 1)

| # | Problema | Soluzione |
|---|---|---|
| S-21 | **Macchina sovraccarica** (load average fino a **166**): con altre sessioni attive i primi screenshot dopo il boot costano 20–25 s e vanno in timeout. | `warmUp()`: si cattura solo quando uno screenshot di prova costa < 3 s; timeout di cattura 120 s |
| S-22 | Il server dell'audit si ricaricava anche per `dist-playwright/index.html`, rigenerato da altre sessioni | `watch.ignored` esteso a `dist/`, `dist-playwright/`, `playwright-report/`, `coverage/` |
| S-23 | **Un frame troppo presto è un falso difetto**: la teca «vuota» era nebbia d'ingresso | regola: ogni claim sorprendente → sonda dedicata prima di scriverlo |
| S-24 | Pulsanti `disabled` non cliccabili dall'harness, quindi un «effetto del clic» non esiste | leggere `disabled` prima di interpretare uno stato |

## 12. Visual fork / decisioni nuove (FLAG, nessuna scelta)

| Fork | A | B |
|---|---|---|
| FAM-1 superfici PLAN-032 (hero sheet, stash, mercante, tooltip edifici) | portarle nella famiglia Roster (Cinzel/EB Garamond, ottone, niente ciano) | dichiararle «schede di carta» con un'identità propria ma coerente (pergamena + inchiostro) |
| POI-T tooltip del POI | etichetta incisa come i tooltip delle regioni (nome + rischio) | nessun tooltip, ma il sigillo cambia sagoma per rischio |
| INV-1 inventario | una «carta oggetto» unica usata in tray, stash e mercante | tre viste diverse ma con la stessa riga di base |
| DEATH-1 eroe morto | lapide nel roster + voce nella cronaca del villaggio | rimosso dal roster, ma un «memoriale» raggiungibile dal menu |

## 13. Ancora non esaminato

Level-up dell'eroe (nessuna run l'ha fatto scattare); toast d'esito (non apparso); overlay portal dello skill check; suono; cursori di gioco; atmosfera della mappa (uccelli, onde) in movimento; seconda quest («rovine»); schermata del titolo; build di produzione e Tauri; Steam Deck reale.
