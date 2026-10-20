# Ruling Director sui fork del mockup — 2026-10-20 (R-234)

| Fork | Selezionato | Vincoli verbatim |
|---|---|---|
| SC-1 comando di lancio | **A** | — |
| SC-2 dopo il verdetto | **A** (idle vivo) | «ma + carino d 3 linee in quel modo, devi fare una ricerca e una proposta migliore» → opzione da riprogettare, ruling sulla forma ancora aperto |
| QW-1 barra | **B** (tempo reale, scala che si allunga) | «inoltre le icone in basso nn stanno bene, sn fuori stile cn il resto» |
| PL-3 magazzino nel planner | **A** (icona + tooltip) | — |
| HUD-1 cibo | **A** (brace sulla tessera scura) | — |

Baseline congelate: `mockups/baseline/*.png` (ritagli harness 1440×900). sha256 in `rulings/baseline-sha256.txt`.
Conseguenza su gate battezzati: SC-2 = A tocca il gate BV-04 `settledIdle` (PLAN-043-S9 r003). Il ruling A autorizza a ridefinirlo come «0 ridisegni del canvas», non «0 animazioni». Da confermare quando si scrive il plan.

## Ruling v2 — 2026-10-20 (mockup `fork-mockups-v2.html`)

| Fork | Selezionato |
|---|---|
| SC-2 idle dopo il verdetto | **A2 · Marea d'inchiostro** (pozza che respira, nebbia; vittoria = scintille d'oro, sconfitta = cenere fredda e inchiostro che si allarga) |
| QW-1 icone sotto la barra | **I1 · Sigilli sulla barra** (sigillo d'ottone sulla tacca reale; pieno / incrinato con brace / bordo d'oro con fiamma / contorno di ferro) |
| HUD-2 lastre in alto | **H1 · Tre lastre, una famiglia** (stessa altezza e respiro; MENU icona + etichetta dentro i margini; risorse in tre colonne uguali, cibo a brace) |

Richiesta successiva (verbatim): *«e tutte le altre cose che nn abbiamo visto ed esaminato? adesso puoi esaminare anche quel tipo d cose che sn state sviste al primo giro? POI, POI detail (cn preview), la scheda dei personaggi, il componente che mostra gli oggetti nell'inventario, la quest, ecc?»*

## Ruling v3 — 2026-10-20 (mockup `fork-mockups-v3.html`)

| Fork | Selezionato | Vincolo verbatim / nota |
|---|---|---|
| LVL level-up mock | **B · Cerimonia** | — |
| EXP sconfitta spedizione | **A · Lapidi sulla scena spenta** | — |
| SET caduta insediamento | **B · La mappa si spegne** | — |
| LEG eredità | **B · Reliquiario con scelta** | «nn hai letto la documentazione: quelle scelte dipendono da edifici costruiti, sarà dinamico». **Correzione:** gli slot del reliquiario non sono fissi «2 di 5»: li danno gli **edifici costruiti** (Lose to Progress, `GAME_VISION_IDLE_INCREMENTAL.md` §2; `MASTER_PLAN.md` «Legacy Vault» con `storedItems`, `hallOfHeroes`, `unlockedBlueprints`; «meta-progression persistente tramite edifici/upgrade non distruttibili»; NARRATIVE M-11). Il mockup va rifatto con categorie e numero di slot derivati dagli edifici. |
| FAM-1 schede teaser | **A · Famiglia Roster** | — |
| POI-T POI | **B · La sagoma dice il rischio** | riferimento esistente: `/poi-marker-lab` «Sigillo fork — B4-map» («discreto»); c'era un documento su Claude, da ritrovare; tocca il Sigillo approvato → ruling S11 |
| INV-1 oggetto | **B · Riga comune, tre vesti** | — |
| DEATH-1 eroe caduto | **B · Sala dei caduti** | coerente con `hallOfHeroes` del Legacy Vault: la sala è la fonte degli eroi «da ricordare» per LEG |

Richiesta successiva (verbatim): *«dobbiamo fare molti + lavori e interazioni, magari dopo questo?»* (sui POI).

## Decisioni aperte risolte — 2026-10-20 (PLAN-067)

| DN | Risposta Director |
|---|---|
| DN-1 edifici → reliquiario | **Tre edifici dedicati**: Magazzino → oggetti, Santuario → eroi, Torre del mago → progetti; nessun edificio = nessuno slot. **Slot = livello dell'edificio.** |
| DN-8 gate BV-04 | **Amend ratificato**: «0 ridisegni del canvas da parcheggiato; CSS transform/opacity ammesso». SC-2 A2 resta valida. |
| DN-2 badge Pannelli | **Toglierlo.** |
| DN-3 cartiglio obiettivo | **Nessuna preferenza** (posizione e testo): resta aperto, T-B9 parte obiettivo bloccata. |
