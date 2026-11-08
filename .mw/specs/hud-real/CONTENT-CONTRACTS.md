# CONTENT-CONTRACTS — PLAN-112 F2 (2026-11-05)

> Contratti di contenuto dei componenti della pianta B1 firmata (G1). Parte di F2: **0 immagini, nessun componente**. Tipi in `src/ui/idleVillage/hudReal/contracts/hudContracts.ts`, scala in `hudType.ts`, test `tests/unit/idleVillage/hudTypeScale.test.ts` (11 verifiche). La meccanica non cambia: ogni voce sotto nomina il dato reale esistente o dichiara che il dato **manca** (e allora l'elemento è contestuale o assente, mai finto: P5).

## 1. Tabella tipografica (pixel CSS allo zoom 1 del gioco; vedi `hudType.ts`; amend G1 #2: la colonna «tela 1440×720» qui sotto è sostituita dai pixel reali = token × zoom, zoom ≥ 1)
| Token | Tela | A 1280×800 (0,889) | Al minimo leggibile (0,875) | Uso |
|---|---|---|---|---|
| didascalia | 14 | 12,4 | 12,25 | etichette (nav, risorse), sovratitoli, suggerimenti; **mai testo corrente** |
| secondario | 15 | 13,3 | 13,1 | riga del livello, bottoni piccoli |
| corrente | 16 | 14,2 | **14,0** | testo del pannello, Voce, requisiti, ricompense |
| nome | 19 (lunghi 16) | 16,9 | 16,6 | nomi nella placca al passaggio |
| valore | 22 | 19,6 | 19,3 | valori di risorse e orologio |
| titolo | 24 | 21,3 | 21,0 | titolo del pannello |
Regole: un testo che non entra nel campo si **accorcia con puntini**, mai sotto il suo token; i numeri grandi si compattano (99.999 → 1,2M) con il valore intero nel tooltip; font: titoli Cinzel, frasi EB Garamond, numeri a larghezza fissa. Sostituisce la scala 1600×900 di PLAN-110 (13/14/15/19/20/21). Sul 150% e 125% i token scalano insieme alla tela.

## 2. Contratti per componente
### Roster — `roster` · persistente · livello 1 · D1=B, D5
- **Dato (reale):** `ResidentState[]` da `useRosterKitData`; stato visivo da `zanaraRosterState(resident, locked)` (available / away / exhausted / injured / dead / locked: gemma accesa/spenta/ferro, ritratto normale/velato/caduto). Livello da `heroLevelView`. Salute = `currentHp/maxHp`, riposo = `1 − fatigue/100`.
- **A riposo si vede (D5):** solo il ritratto in medaglione + arco di salute + gemma di stato. **Nessun nome a riposo.** La selezione si vede come alone + arco acceso; non apre la placca da sola.
- **Al passaggio / focus / selezione da tastiera:** placca con nome (token nome), livello (secondario), barre salute e riposo, etichetta di stato. Touch: primo tocco apre la placca, secondo seleziona.
- **Stati interattivi:** riposo, hover, focus (anello fuori dall'immagine), attivo (selezionato), disattivo (caduto, non interattivo), bloccato. Derivati da una sola forma.
- **Tastiera:** Su/Giù tra i medaglioni; Invio seleziona; Esc chiude la placca. **A11y:** lista `role=list`; ogni medaglione ha `aria-label` = nome + livello + stato; salute a parole nel label («salute 60%»).
- **Scorrimento:** per righe intere con frecce; mostra tante righe quante ne dà lo slot risolto (`maxRows`); fine sfumata se c'è altro.
- **Dato mancante:** nessuno. **Da fare:** legenda delle barre nel tooltip del primo uso.

### Risorse — `resources` · persistente · livello 2
- **Dato (reale):** `buildResourceReadoutItems(selectResourceOutlook(state, config), t)` → `ResourceReadoutItem[]` (id, icona, etichetta, valore, `max`, `detail` tipo «−6/d · 0 d left», `tone`, `description`). Oggi: oro, cibo, legno. Variazione transitoria `resourceDelta` (2600 ms).
- **Visibile nel chip (D7):** valore (token valore) + massimo se c'è spazio + **consumo in forma breve** (secondario) **quando `tone` è `danger` o `warning`**; il testo completo nel tooltip e in `aria-label`. Pericolo = vermiglio + clessidra + filetto (mai solo colore).
- **Stati:** riposo, hover/focus (tooltip), pericolo. **Tastiera:** i chip sono focalizzabili; il tooltip si apre da focus. **Numeri:** compatti oltre 99.999.
- **Dato mancante:** nessuno.

### Tempo — `time` · persistente · livello 2
- **Dato (reale):** `WhenWhereClusterProps`: `currentDay` (da formattare 1-based), `isDayPhase`, `cycleProgress`, `isPaused`, `speed {multiplier, available, onChange, onTogglePause}`. **Il componente di prova è ancora locale: va cablato.**
- **Visibile:** «Giorno N» (valore), medaglione giorno/notte con alone di avanzamento (`cycleProgress`), pausa, velocità disponibili (×1/×2/×4 da `speed.available`, non scritte nel codice). In pausa la velocità tenuta mantiene l'anello.
- **Stati:** riposo, hover, focus, attivo (velocità corrente), premuto. **Tastiera (A2, verificato in `src/pages/game-frame.tsx`):** il gioco **già lega** Spazio = pausa/ripresa e i tasti **1–9 = velocità nell'ordine di `speed.available`** (guardie: non con modificatori, non in campi di testo, non su un bottone o link, non se la finestra di spedizione ha già preso il tasto, non se `locked`). **Il componente nuovo non lega nessun tasto**: mostra solo i suggerimenti nel tooltip («Pausa · Spazio», «Velocità ×2 · 2») e ha lo stato disattivato quando `locked`. Le frecce NON sono usate (la versione precedente di questa riga era sbagliata). **A11y:** `aria-pressed` su pausa e velocità; il giorno è un `aria-live=off` (non si annuncia ogni tick).
- **Dato mancante:** meteo (non esiste, non si inventa).

### Nav — `nav` · persistente · livello 2
- **Dato (reale):** `gameFrameConfig.navItems` (id, `labelKey`, `icon`, `locked`); `onNavSelect`; ricentra = azione della mappa. Oggi quattro voci (villaggio, mappa, officina, taverna); due bloccate.
- **Visibile:** icona incisa + etichetta sotto (token didascalia); attiva = anello + alone; bloccata = attenuata con suggerimento «non ancora» nel tooltip. **Il dock ha tanti tondi quante voci reali:** con più di quattro voci va rigenerato (non si aggiungono tondi vuoti).
- **Astrolabio:** unico comando di orientamento, ricentra la mappa; è l'**unica rosa dei venti** della HUD.
- **Stati:** riposo, hover, focus, attivo, premuto, bloccato. **Tastiera:** Tab tra le voci; Invio attiva. **A11y:** `aria-pressed`, nome a parole, bloccata = `aria-disabled` + motivo.

### Comandi — `commands` · persistente · livello 3
- **Dato (reale):** registro `HUD_PANELS` (id, scorciatoia, visibilità, `isHudPanelListed`), menu di gioco (`HudGameMenu`), nascondi HUD. **Azioni da cablare: oggi sono segnaposto nel prototipo.**
- **Visibile:** tre tondi: menu, pannelli, nascondi; il tooltip mostra la scorciatoia (es. «Pannelli · P»). **Nascondi HUD** lascia solo un controllo per ripristinare.
- **Stati:** riposo, hover, focus, attivo (menu aperto / pannelli aperti), premuto. **Tastiera:** Esc apre il menu di gioco (già così in `HudGameMenu`).

### Pannello — `panel` · contestuale · livello 1
- **Dato:** **oggi nessuna sorgente unica**: il contenuto viene dal chiamante (dettaglio POI, spedizione, scheda eroe, mercante, scorta, eventi). Il contratto (`PanelContract`) fissa la forma: sovratitolo, titolo, testo, illustrazione opzionale, ricompense (icone di risorsa reali), requisiti, **seal (probabilità di successo + marchi: solo vittoria e pericolo, teschi ok, niente drop %)**, azione.
- **Regole:** **la finestra ad arco compare solo se esiste un'illustrazione** (mai una finestra di vetro vuota); l'illustrazione di ogni luogo la fornisce il gioco (oggi un ritaglio della mappa come segnaposto); il sigillo vive **solo qui**, dentro i pannelli di spedizione; l'azione disattivata dice il motivo (`disabledReason`).
- **Altezza:** naturale 470; sotto scorre il corpo (titolo e azione fissi, sfumatura ai bordi, focalizzabile e scorrevole da tastiera); minimo 240 (~7,7 righe a 150% su 1080p).
- **Stati:** riposo, hover/focus (azione), premuto, disattivato. **A11y:** `role=region` con `aria-label` = titolo; area scorrevole `tabindex=0`.

### Notifiche (la «Voce») — `voce` · temporaneo · livello 1
- **Dato:** **nessuna sorgente oggi**: il testo viene da eventi di gioco (narrativi, esiti, avvisi). Contratto `NotificationContract`: tipo, titolo, testo, priorità, espandibile, chiusura automatica opzionale, `onDismiss`.
- **Comportamento (già in `HudRealVoce`):** entra da sinistra (320 ms), esce (240 ms), «Leggi tutto» apre il testo intero, × o Esc chiude, chiusura automatica sospesa da hover/focus/espansione; `prefers-reduced-motion` toglie le animazioni.
- **Dato mancante:** l'evento che la genera (da definire con la meccanica, non qui).

## 3. Regole di esclusione e collisione (E-15)
1. **Uno slot contestuale a destra, un pannello alla volta.** Condividono lo slot: eventi (E), scheda eroe (P), mercante (M), scorta (V). Aprirne uno **sostituisce** quello aperto (vince l'ultimo); lo stesso tasto lo chiude. Le scorciatoie restano quelle del registro.
2. **Il centro scena** (`quest`, `questDetail`): a 100% sta accanto al pannello; quando non c'è larghezza (125/150%, vedi `fitPanel`) **sospende e sostituisce** il pannello laterale (già `runPolicy: suspend` nel gioco); alla chiusura il pannello precedente **non** si riapre da solo.
3. **Notifiche (priorità):** avviso (1) > esito (2) > narrativa (3). **Al massimo 2 visibili insieme**; le altre attendono per priorità e arrivo. Un avviso interrompe una narrativa (che resta in coda, non si perde).
4. **Modali di spedizione** (`QuestRewardPopup`, controllo di abilità): nascondono la Voce finché sono aperti; non nascondono risorse, tempo, nav.
5. **Esc:** chiude in ordine la notifica espansa → il pannello contestuale → il menu; mai più di uno per pressione.

## 4. Movimento e accessibilità (comuni)
- Rivelazione: placca del roster, pannello, notifica entrano in 200–320 ms (ease-out), escono in ≤ 240 ms; **nessuna animazione continua** oltre al respiro delle gemme (se approvato in F3) e all'alone di selezione; `prefers-reduced-motion` = nessuna animazione.
- **Focus** sempre visibile (anello d'oro, 2 px, fuori dall'immagine); contrasto testo ≥ 4,5:1 sulle superfici reali (misurato in F5); nessuna informazione solo a colore (pericolo = colore + clessidra + testo).
- **i18n:** tutto in `it-IT` ed `en` (chiavi già esistenti per nav, ricentra, risorse, stati del roster: `gameFrame.roster.zanara.*`, `gameFrame.nav.*`, `gameFrame.status.*`); le etichette nuove («Leggi tutto», «Riduci», «Chiudi», requisiti, sigillo) vanno aggiunte in entrambe le lingue in F4; pseudo-locale per i testi lunghi.

## 4b. Decisioni e proposte che F2 lascia aperte (non decise qui)
- **A1 — RISOLTO con amend G1 #1 (2026-11-05): slot `toast` sopra la Voce.** (testo originale della proposta:) un'**area per le notifiche di esito**. Oggi `QuestOutcomeToast` (320×~72) è ancorato in alto a destra e collide con le risorse. Proposta: slot `toast` sopra la Voce, in basso a sinistra (impilato). Modificherebbe il contratto firmato (nuovo slot, roster più corto di ~80 px): richiede una tua decisione scritta di amend.
- **A2:** tasti di velocità e pausa: confermare che il gioco già li usa (evitare duplicati).
- **A3:** se il pannello contestuale mostra anche la scheda eroe a 340 (compressa da 380): verificare con il rendering vero in F4.
- **A4:** icone di ricompensa non risorsa (cristallo, libro del mockup): non esistono nel gioco; restano fuori finché non c'è il dato.

## 4c. A2–A4: risposte verificate sul codice (2026-11-05)
- **A2 — tasti pausa/velocità: risolto.** Esistono già (vedi sopra). Il tempo nuovo li riceve dal gioco e non li duplica; aggiunto `locked` al contratto.
- **A3 — scheda eroe a 340: compatibile sulla carta, NON provata a rendering.** `HeroSheetPanel` prende la larghezza da un prop (`widthPx`, config 380, minimo 280): il contenuto è flessibile (`flex`, `minWidth: 0`, colonne `1fr`, ellissi) con poche larghezze fisse (ritratto 56, etichette vitali 34 e 44), quindi a 340 si comprime. **Due attenzioni:** (1) si posiziona da sé (`position: fixed`, `left/top` e un'«ancora» che segue il roster): in F4 va ancorata allo slot e non al roster; (2) usa **testo da 12 px reali** (e simili in `QuestRewardPopup`, mercante, scorta): **sotto i pavimenti della scala nuova**. Il testo dei pannelli di produzione resta com'è finché non si migra (F6, fuori dal perimetro di F4: nessun testo cambia senza la sua scheda).
- **A4 — icone di ricompensa non risorsa: confermato, restano fuori.** Il gioco ha icone solo per oro, cibo e legno (`public/assets/ui/resources/`, `HUD_ICON_ASSETS`). Il mockup mostra cristallo e libro: non esistono come dato. Esistono icone incise di oggetti (`ico-pouch`, `ico-chest`, `ico-vial`, `ico-scroll`…) ma non sono mappate a nessuna ricompensa. Il pannello mostra solo le ricompense che il gioco produce (`PanelRewardRow.kind`: oro, cibo, legno, oggetto con l'icona incisa dell'oggetto, se esiste).
- **A5 — RISOLTO il 2026-11-05 (A5-a, amend G1 #2):** la pianta adotta il modello di scala del gioco (pixel CSS + zoom `hudScale`). Vedi `plans/PLAN-112` §15.

## 5. Dove sta cosa
| Contratto | Dato reale | Cablaggio da fare in F4 |
|---|---|---|
| roster | `useRosterKitData`, `zanaraRosterState`, `heroLevelView` | già reale |
| risorse | `selectResourceOutlook` | già reale |
| tempo | `WhenWhereClusterProps` | **da cablare** (oggi locale) |
| nav | `navItems`, `onNavSelect`, mappa (ricentra) | ricentra **da cablare** |
| comandi | `HUD_PANELS`, `HudGameMenu` | **da cablare** |
| pannello | chiamante (POI/spedizione/eroe/…) | **da definire** per famiglia |
| notifiche | eventi di gioco | **da definire** con la meccanica |
