# F6 — Pannello Director e i mock del ciclo di gioco (level-up, run persa, eredità) (Opus, 2026-10-20, R-234)

> Richiesta (verbatim): *«il menu director ha pulsanti che nn funzionano, nn ci dovrebbero essere o funzionano male, tipo level up (voglio una versione mockata), un pulsante per mostrare quando perdi la run (che nn c'è, ma il componente esiste), un pulsante per quello che porti nella prossima run (nn esiste il pulsante ma il componente mockato esiste). Tutti questi devono essere esaminati bene e correttamente.»*
>
> Metodo: ogni pulsante cliccato davvero (F10 → Director), con frame a 400 / 1500 / 4000 ms, firma DOM prima e dopo, errori di console. Più una sonda dedicata per ogni esito sorprendente. Evidenze in `shots/director/`. Codice: `harness/run-director.mjs.txt`. Legenda: **FATTO** · **FLAG** · **NON VERIFICATO**.

## 1. Il pannello stesso

Il Director è uno **strumento di sviluppo** (`hudPanelRegistry`: `devOnly`, montato solo in dev; `DirectorPanel.tsx`: «test / trailer instrument, not product UI»). Ha 9 azioni più «Reset scene».

- **FATTO** Un'etichetta mostra la **chiave i18n grezza** `gameFrame.director.resetInitial`, che esce oltre il bordo destro del pannello (`00-director.png`). La traduzione manca.
- **FATTO** L'azione «Skin» porta a **Lacquer Atlas**, la skin bocciata il 2026-10-16.
- **FATTO** Il pannello resta **sopra** il takeover bloccante «Settlement lost»: per uno strumento dev va bene, ma il trailer ripreso così lo mostrerebbe.

## 2. Pulsante per pulsante

| # | Azione | Cosa deve fare (codice) | Cosa succede (FATTO) | Esito |
|---|---|---|---|---|
| 1 | **Goblin invasion** | apre la sequenza d'invasione | tendina → card → sticker → riga nel registro (F5 §6) | **FUNZIONA** (con i difetti di F5) |
| 2 | **Show quest** | rivela subito i POI quest | compare il secondo POI | **FUNZIONA** |
| 3 | **`gameFrame.director.resetInitial`** | cancella i progressi e ricarica | non premuto (distruttivo); etichetta non tradotta | **ETICHETTA ROTTA** |
| 4 | **Start goblin quest** | lancio canonico `demoLaunch` | apre la finestra quest. A 1,5 s **il teatro mostra una banda nera** sopra l'immagine e il testo del beat è troncato («The un…»); a 4 s è a posto | **FUNZIONA**, ingresso con artefatto |
| 5 | **POI types** | mostra le famiglie di POI per la review | compaiono 2 marker con **una croce generica «+»**: è il fallback `icon_<type>.webp` che l'addendum S11 dice «non vale come icona approvata» | **FUNZIONA**, mostra placeholder |
| 6 | **Sea wonder** | evento raro nel mare | una balena compare in alto a sinistra, piccola, al bordo dello schermo | **FUNZIONA**, poco visibile |
| 7 | **Hero level-up** | flare di level-up mock sulle schede del roster (PLAN-032 SP-5) | **senza roster aperto non fa nulla** (rifiuto silenzioso, by design: «nessuna scheda montata»). Con il roster aperto: a 400 ms una scritta fantasma «LEVEL 4 / LEVEL 5 / LEVEL 3» sopra i nomi, poi sparisce. **Il livello non cambia** (badge sempre LV 4/5/3), non c'è suono udibile né cerimonia | **FUNZIONA MALE**: invisibile senza roster, impercettibile con il roster |
| 8 | **Settlement lost** | takeover di fine run (`SettlementLostOverlay`, PLAN-034 T-010) | **a mappa libera funziona**: iride scura, card «SETTLEMENT LOST», tre perdite, tre statistiche, «BEGIN A NEW SETTLEMENT». **Con la finestra quest aperta non si vede nulla** (pulsante premuto, nessun velo, nessuna card) | **FUNZIONA A METÀ** |
| 9 | **Skin: …** | alterna le skin confrontabili | passa a Lacquer Atlas (bocciata); HUD e scala cambiano | **NON DOVREBBE ESSERCI** (o solo la skin base) |
| — | **Reset scene** | riarma invasione e reveal | non provato | NON VERIFICATO |

### Difetti dentro «Settlement lost» (FATTO, `lost-5000.png`)
- «**0** Days survived» al giorno 3: statistica sbagliata (`buildGameOverSummary`).
- «Your heroes have fallen» anche se nessun eroe è morto: le tre perdite sono **testo fisso di config**, non lo stato della run.
- Il dialog non espone `role="dialog"` (cercato e non trovato), nonostante focus trap e blocco di Esc. **NON VERIFICATO** come lo legga uno screen reader.
- **Copy** «The settlement has fallen. What was learned carries on.» promette un'eredità che il gioco non mostra mai.

## 3. «Quello che porti nella prossima run»: il componente esiste, il pulsante no

- **FATTO** I componenti sono due, entrambi **solo trailer**, con le intestazioni «@trailer-only, NO gameplay logic, NO persistence, NO i18n»:
  - **`TrailerLegacy`** (scena 6 del trailer, `/trailer?scene=legacy`): «KNOWLEDGE PRESERVED — what survives becomes the foundation» con tre carte (Ancient Artifact, Sacred Altar Blueprint, Surviving Heroes), ognuna con una **spunta verde**, icone tipo emoji, e un titolo che in headless esce con un'ombra pesante (`trailer-legacy.png`). Nei 3 frame tra 2 e 11 s è statica.
  - **`TrailerLegacyV2`** («The Preservation Table»: artefatto che si condensa, progetto che si traccia, eroi che si rivelano, sigillo d'oro al posto della spunta). **Non è montato da nessuna parte**: nessuna route, nessuna scena del visore, nessun import. È orfano e non si può vedere senza codice.
- **FATTO** Su `/game` non c'è un pulsante Director né un flusso che li mostri. Il takeover «Settlement lost» finisce con «BEGIN A NEW SETTLEMENT» e ricomincia, senza passare da un'eredità.

## 4. «Quando perdi la run»: cosa c'è davvero

Ci sono **tre «perdite»** diverse, ed è facile confonderle:

| Perdita | Componente | Raggiungibile da | Stato |
|---|---|---|---|
| Spedizione fallita (party sterminato) | `QuestRewardPopup` («WIPE — EVERYTHING IS LOST») | gioco reale | F5 §7: lastra trasparente, titolo doppio, chip illeggibile |
| **Insediamento perso (fine run)** | `SettlementLostOverlay` | **solo Director** (manca il percorso del giorno 30, documentato) | funziona a mappa libera; invisibile con la quest aperta; statistiche sbagliate |
| Scena trailer «Consequence» | `TrailerConsequence` | `/trailer?scene=consequence` | in 11 s mostra solo «INVASION IN 5» su fondo scuro (serve «Play»: NON VERIFICATO l'animazione) |
| Game over generico | `GameOverModal`, `MinimalGameOverModal` | solo pagine lab vecchie (`MinimalPolishedPage`) | non su /game |

Se con «il pulsante per quando perdi la run» intendi **la perdita dell'insediamento**, il pulsante c'è ed è «Settlement lost». Funziona solo a mappa libera e racconta numeri sbagliati. Se intendi **la sconfitta della spedizione**, non esiste un pulsante Director: oggi la si vede solo giocando e perdendo.

## 5. Il ciclo che manca (cappello `game_director`, FLAG)

Oggi i tre momenti forti di un roguelite-settlement esistono come pezzi staccati:
- **la crescita** (level-up) è un fantasma di 400 ms;
- **la caduta** (settlement lost) è una card con numeri finti;
- **l'eredità** (ciò che porti avanti) è una scena di trailer che nessuno può aprire dal gioco.

Il teaser e la demo vendono proprio questo ciclo («What was learned carries on»). Proposta da decidere: un **mock giocabile del ciclo** guidato dal Director, **caduta → eredità → nuovo insediamento**, con il level-up come ricompensa visibile in mezzo. Tutto dichiaratamente mock, come lo stash e il mercante.

## 6. Raccomandazioni per il pannello Director (correctness, proposte)

1. Tradurre `resetInitial` (en, it-IT) e far andare a capo le etichette dentro il pannello.
2. «Skin» limitata alla skin base, o rimossa: Lacquer Atlas è bocciata.
3. «Hero level-up»: aprire il roster da solo se è chiuso (oggi rifiuta in silenzio), e renderlo un evento vero in mock: il livello sale (4 → 5), con cerimonia.
4. «Settlement lost»: deve vincere su ogni finestra (z-order sopra il cluster quest), con statistiche vere (giorni, residenti persi, oro).
5. **Nuovo** «Expedition lost»: mette in scena il rapporto di sconfitta di una spedizione senza dover perdere davvero.
6. **Nuovo** «Legacy / next run»: porta su `/game` l'eredità (TrailerLegacyV2 riadattato, non il file del trailer) come mock, dopo un ruling sull'aspetto.
7. «POI types»: mostra placeholder a croce; o si collegano i glifi veri (S11), o il pulsante va nascosto.

## 7. Non verificato
Reset scene; «Stato iniziale» (distruttivo, non premuto); CTA «BEGIN A NEW SETTLEMENT» (riavvia la partita); suono del level-up; animazione completa di TrailerConsequence con «Play»; build di produzione (il Director non c'è: va confermato).
