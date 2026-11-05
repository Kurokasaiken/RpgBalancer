# Esame finale della HUD (PLAN-110): rapporto

> 2026-11-04, eseguito in modalità autonoma. **Esame parziale**: le misure A.2, A.3 (in parte), A.5 (stima), A.8 e la composizione a tre risoluzioni sono fatte; il resto è elencato in "Non verificato". Dati grezzi: `review-measures.txt`. Nulla committato.

## Verdetto d'insieme: **da ritoccare** (non da rifare)
L'identità regge: oro antico e smalto smeraldo, gemme, incisione, nessun viola, nessun testo nelle immagini, tutti i componenti con dati e stati in codice. Il quadro a 1280×800, 1600×900 e 1920×1080 si compone senza errori e senza sovrapposizioni gravi. Non è ancora "AAA" per quattro motivi, tutti correggibili senza rifare i pezzi: **colore non uniforme tra i pezzi**, **troppa roba accesa insieme**, **motivo a stella ripetuto**, **icone della nav generiche**.

## A. Misure
**A.2 Coerenza colore (Lab, pezzi con ≥3000 px di materiale).**
| Misura | Obiettivo (§2 LINGUAGGIO) | Roster C1 | Pezzi nuovi C2–C8 |
|---|---|---|---|
| Oro, C p50 | 41–43 (±4) | 38–43 | **33–37** (globo 33,5; barra risorse 33,0; sigillo 35,1; nav 37,0; marchio 37,3) |
| Oro, L p90 | 85–88 (±5) | 87–98 | 80–97 (globo 80,4 il più spento; voce e nav 95–98 troppo chiari) |
| Smalto, L p50 | 15–19 | 9–17 | **6–10** (nav 6,3; marchio 6,7; barra 6,7; sigillo 7,8) |
| Smalto, C p50 | 22–26 | 14–23 | **10–17** |
Esito: **fuori tolleranza**. I pezzi generati dopo C1 hanno lo smalto più scuro e meno saturo e l'oro meno saturo (tranne voce e bussola, ok). Il pannello (alabastro) ha "oro" C 18 solo perché la maschera cattura l'avorio: misura non significativa.
**A.3 Risoluzione:** nessun pezzo oltre 1,0× a DPR 2 e a 1600×900; a 1920×1080 la scala è 1,2× (sotto il limite 1,5×). Nitidezza a DPR 2 vista a occhio sui singoli pezzi: buona. Non misurata a DPR 1.
**A.5 Ingombro:** l'unione dei rettangoli dei componenti dà 61% a 1920×1080 e 55% a 1280×800, ma **è una sovrastima** (la colonna roster è un rettangolo di 930 px con poco opaco dentro; la nav include il medaglione). La misura giusta (pixel opachi) non è fatta. A vista: pannello, Voce e sigillo insieme coprono il lato est e il centro; sono contestuali e non dovrebbero essere accesi tutti insieme (la pagina di prova li accende per mostrarli).
**A.8 Peso:** 2,76 MB totali a 2× (WebP lossless). Più pesanti: pannello 630 KB, nav 500 KB, voce 392 KB. Accettabile; il pannello e la nav si possono comprimere (lossy 90) per ~40%.

## B. Composizione (screenshot veri)
1600×900, 1920×1080 e 1280×800 su una sola zona di mappa (isola con terra chiara). Nessuna sovrapposizione tra componenti; il sigillo sta a destra della nav senza toccarla; il pannello copre il vulcano, la Voce copre il centro-sud dell'isola (accettabile se transitoria). Il marchio sfiora il cimiero del roster (voluto, ma da rifinire). **Non fatti:** mare/giungla come zone di fondo, prima/dopo contro `/game`, confronto intero col mockup a parità di scala.

## C. Giudizio per componente
| # | Componente | Verdetto | Cosa funziona | Cosa no (categoria) | Come correggere (costo) |
|---|---|---|---|---|---|
| C1 | Roster | da ritoccare | anello, placca al passaggio, scorrimento, stati | cimiero provvisorio (fenice), banda stretta, niente arco d'oro esterno (proporzione) | scelta cimiero del Director; banda più larga e arco (0–3 immagini, 1 h) |
| C2 | Risorse | pronto (con colore) | 3 alloggi, pericolo leggibile, tooltip | smalto scuro e poco saturo (smalto); alloggi stretti per valori lunghi (leggibilità) | ricalibrare il grade smalto (0 immagini, 20 min); testare 5 cifre |
| C3 | Nav | da ritoccare | medaglione astrolabio, stati attivo/bloccato | glifi generici non incisi (coerenza); 2 tondi esterni vuoti (ritmo); smalto scuro | icone incise oro dalla libreria, oppure rigenerare il dock a 4 tondi (3–4 immagini) |
| C4 | Pannello | pronto | alabastro pulito, finestra e placca misurate, generico | finestra vuota nella demo; "oro" della cornice più verde-giallo (oro) | illustrazioni nel codice; nessun costo immagini |
| C5 | Bussola | da ritoccare | stella con gemma, due righe live | tondino vuoto; contenuto della piastrina non deciso (D-5) | icona di fase nel tondino; decidere il contenuto (1 h, 0 immagini) |
| C6 | Globo | da ritoccare | lettura da icona, hover | nessuna azione assegnata; oro spento (L p90 80) | assegnare l'azione (decisione del Director) |
| C7 | Sigillo | pronto | campo e 5 marchi in codice, teschi | marchi piccoli (14 px, leggibilità); smalto scuro | teschi a 16–18 px; grade |
| C8 | Marchio | da ritoccare | emblema e placca | titolo da centrare meglio; sfiora il cimiero (ritmo) | spostare/rifinire (30 min) |
| C9 | Busto | pronto | ornamento d'angolo, oro coerente | una sola variante; appoggia sul bordo del pannello solo a occhio (proporzione) | verificare l'ancoraggio sugli angoli reali |
| C10 | Voce | pronto | disco smeraldo, foglie, testo su 3 righe | tre righe strette nella placca (leggibilità) | accorciare i testi o placca più alta |
**Problemi d'insieme:** (1) colore tra pezzi (tabella A.2); (2) **il motivo a stella a quattro punte compare in marchio, bussola, astrolabio, scudo della Voce e roster**: cinque occorrenze riducono l'identità di ciascuna (ritmo/coerenza); (3) i fissi sono ancora molti e tutti ricchi: manca una gerarchia di peso (a riposo solo risorse, nav e roster; il resto per evento); (4) tre materiali di fondo (alabastro, smeraldo, vetro) ben distinti: va bene, è la regola.

## D. Esito: correzioni in ordine (costo)
1. **Ricalibrare il colore** (grade per pezzo verso oro C 41–43 e smalto L 15–19 / C 22–26) su C2, C3, C5, C7, C8, C6; test con le misure A.2. *0 immagini, ~1 h.*
2. **Gerarchia di peso**: stabilire quali componenti sono sempre accesi e quali compaiono per evento (Voce, sigillo, pannello); misurare l'ingombro in pixel opachi. *0 immagini, ~2 h + decisione.*
3. **Differenziare la stella**: tenerla solo su astrolabio e bussola; marchio e Voce con altro simbolo dalla libreria `/hud-library`. *1–3 immagini.*
4. **Icone della nav incise oro** o dock a 4 tondi. *0–4 immagini.*
5. Decisioni aperte del Director: cimiero del roster, azione del globo, contenuto della piastrina (D-5), colore del marchio/ali.
6. Completare le verifiche non fatte (sotto) prima di dichiarare `verified`.

## Non verificato (da dire chiaramente)
- A.1 fedeltà numerica col mockup (solo confronto a occhio), A.4 contrasto del testo ≥ 4,5:1 e nomi troncati in en/it (solo it visto), A.6 hover/tastiera/riduzione del movimento per C2–C10 (fatti solo su C1 e in parte C3), A.7 stress con 0/1/14 eroi su C1 (fatto in precedenza) ma non per risorse estreme e pannello con testo lungo.
- B: zone mare e giungla, prima/dopo `/game`, confronto intero col mockup.
- Parere esterno (Gemini testo) non richiesto.
- Pagina `/hud-review` non creata (il rapporto è questo file).

## Aggiornamento 2026-11-04 (dopo la correzione n. 1)
Ricalibrato il colore di barra risorse, nav, bussola, sigillo, marchio e globo con `scripts/hud-real/regrade-assets.py` (originali in `regrade-backup/`, 0 immagini). Rimisurato (Lab p50):
| Pezzo | Oro C | Smalto L | Smalto C |
|---|---|---|---|
| Risorse | 38,1 | 12,9 | 14,4 |
| Nav | 39,3 | 15,7 | 20,6 |
| Bussola | 40,8 | 16,1 | 22,1 |
| Sigillo | 39,1 | 16,5 | 15,8 |
| Marchio | 39,6 | 15,7 | 21,6 |
| Globo | 38,8 | 15,7 | 22,2 |
Oro e luminosità dello smalto ora dentro l'obiettivo (oro C 37–45, smalto L 15–19) tranne le risorse (L 12,9). **Ancora sotto per saturazione dello smalto: risorse (14,4) e sigillo (15,8)**: la maschera comprende il vetro scuro degli alloggi e il guadagno è limitato a ×1,8; se serve, rigenerare quei due o ritoccare per zona. Verifica a vista a 1600×900: smeraldo più vivo e coerente col roster, alloggi ancora scuri e leggibili. Voce e roster non toccati. Correzione n. 1 = **fatta**, restano 2–6.

## Aggiornamento 2026-11-04 (verifiche automatiche di interazione e leggibilità)
Eseguite su `/hud-compose` a 1600×900 (Playwright):
- **Interazione:** clic sulla nav cambia `aria-pressed` (villaggio sì, mappa no); la voce bloccata è `disabled`; Tab porta il focus alla voce successiva con contorno visibile (2 px solido); tooltip su ricentra e sulle risorse; globo e CTA presenti e raggiungibili; `prefers-reduced-motion` azzera le transizioni del globo (0 s). Nessun errore in console.
- **Contrasto (calcolato sulle coppie di colori reali):** avorio su smalto scuro 10,6:1; verde chiaro su vetro 11,2:1; inchiostro su alabastro 11,4:1; titolo oro su smalto 8,8:1; CTA 8,5:1; pericolo vermiglio su vetro 4,8:1; glifo bloccato 5,5:1; sovratitolo del pannello 4,8:1. Tutti ≥ 4,5:1. Non misurato sui pixel reali dello sfondo mappa (i testi stanno su campi opachi, quindi non dipendono dalla mappa).
- **Corpo minimo:** trovato 11 px (sovratitolo del pannello): portato a 12 px. Troncature orizzontali: nessuna; il titolo del marchio e due chip di risorse hanno 2 px di scarto verticale (marchio corretto con overflow verticale visibile).
- **Ancora non verificato:** inglese (la pagina di prova gira in it), stress con risorse estreme e pannello con testo lungo, hover del globo e del sigillo a vista, zone mare/giungla, prima/dopo contro `/game`, parere esterno.

## Aggiornamento 2026-11-04 (stress con testi lunghi e valori estremi, A.7)
Pagina `/hud-compose?stress` (solo laboratorio): oro 1.234.567, cibo/legno 99.999, titolo marchio lungo, coordinate a 7 cifre, titolo del pannello di 60 caratteri con testo di 800, Voce con titolo e testo lunghi.
**Prima delle correzioni** (difetti reali): titolo del marchio tagliato su entrambi i lati; cifre grandi della barra risorse fuori dall'alloggio con clessidra sovrapposta; testi di Voce e pannello tagliati a metà riga; coordinate della bussola tagliate.
**Correzioni fatte:** marchio con corpo ridotto in base alla lunghezza (minimo 12 px) e puntini; risorse con numeri compatti oltre 99.999 (1,2M) e massimo nascosto se il valore ha 4+ cifre (resta nel tooltip); Voce e pannello con limite di righe e puntini (titolo del pannello 2 righe, corpo 7); bussola con puntini.
**Dopo:** nessun testo tagliato a metà riga; restano i puntini dove il testo è davvero più lungo. Residuo: clessidra del cibo a 5 cifre vicina al bordo dell'alloggio; il massimo di una risorsa a 4+ cifre non si vede a colpo d'occhio (decisione di prodotto: forse barra o tooltip).
Non misurato: 0 e 1 eroi nel roster (fatti in precedenza su C1), inglese.

## Nota 2026-11-04 (inglese non verificato)
Il controllo in inglese è stato tentato e rimandato: la macchina era sotto carico elevato (load ~250, causato da Chrome Canary e WindowServer, non dai nostri processi) e il caricamento di `/hud-compose` in Playwright è andato in timeout. Metodo pronto: `browser.newContext({ locale: 'en-US' })` (il rilevatore di lingua usa `navigator`); controllare troncature e `aria-label` della nav. Chiavi `gameFrame.nav.*` e `gameFrame.compass.recenter` esistono in en.

## Aggiornamento 2026-11-04 (inglese verificato)
A carico ridotto (load ~73) il controllo è riuscito. In **inglese** (`/hud-compose`, 1600×900): nessun errore in console, nessuna troncatura orizzontale nei componenti, etichette della nav "Village", "Map", "Workshop — Not yet", "Tavern — Not yet", ricentra "Re-centre the map", risorse "Gold / Food / Wood". Il contesto `it-IT` di Playwright mostra però ancora l'inglese: la lingua dell'app non segue `navigator` in questo percorso, quindi **l'italiano delle chiavi `gameFrame.*` non è verificato dal vivo** (i testi di esempio della pagina sono italiani fissi nel codice). Da fare: impostare la lingua tramite il selettore del gioco (`setLocale`) e rifare il controllo.

## Aggiornamento 2026-11-04 (italiano verificato)
Lingua impostata con `localStorage['rpg-locale-config'] = {"locale":"it-IT"}` (il rilevatore usa quella, non `navigator`): `lang="it-IT"`, nav "Villaggio / Mappa / Officina — Non ancora / Taverna — Non ancora", ricentra "Ricentra la mappa", risorse "Oro / Cibo / Legno"; nessuna troncatura e nessun errore. **Inglese e italiano verificati** per nav e risorse; Voce, pannello, marchio, bussola e sigillo ricevono i testi dal chiamante (nella pagina di prova sono italiani fissi): le chiavi vere si verificheranno quando saranno collegati ai dati di gioco. Per cambiare lingua nei test: usare questa chiave.

## Aggiornamento 2026-11-04 (selezione e zone di mappa)
- **Difetto trovato e corretto:** trascinando il mouse sulla pagina la HUD veniva evidenziata (testo e immagini selezionabili), con evidenziazione blu sopra tutti i componenti. Aggiunto `user-select: none` alla radice di tutti i componenti `HudReal*` (e al busto). Verifica: dopo un trascinamento attraverso la schermata la selezione è vuota (vedi esito nella cronaca).
- **Zone di mappa mare/giungla:** non verificabili in questa pagina: il trascinamento non sposta la mappa (`/hud-compose` non ha pan). Servirebbe `/game` o un parametro di posizione della mappa; resta aperto, insieme al prima/dopo contro `/game`.

## Aggiornamento 2026-11-04 (prima/dopo contro /game): lacune funzionali
Catturato `/game` (produzione, sola lettura) a 1600×900 e confrontato con la nuova composizione. **La HUD nuova non copre tre cose che `/game` ha oggi** (meccanica da conservare):
1. **Tempo:** "DAY 3" con pausa e velocità ×1/×2/×4 (in alto a sinistra). Non c'è nei mockup scelti. → nuovo componente **C11**, da progettare (placca + 4 tondi); costo stimato 1–3 immagini per la placca o riuso del pezzo bussola.
2. **Comandi:** menu, pannelli, nascondi HUD (tre tondi in basso a destra). → **C12 fatto in forma base**: `HudRealRoundButton` (anello d'oro su vetro scuro ritagliato da un tondo della nav, glifi incisi `cmd-menu/panels/eye`, stati hover/attivo/focus). Posizione definitiva da decidere (nella prova sta in alto al centro perché il basso a destra ospita globo e sigillo).
3. **Dettaglio del cibo:** `/game` mostra "0/20 −6/d · 0 d left" sul chip; i nostri alloggi mostrano solo valore/massimo e il resto va nel tooltip. Da decidere se il consumo giornaliero deve stare a vista (il pericolo "0 giorni" è informazione critica).
Altre differenze: in `/game` la nav ha 4 voci + ricentra al centro come la nostra (coerente); il roster non compare nella cattura di produzione; la mappa di produzione è l'attuale (più piatta e meno satura), quindi il giudizio "più bello" dipende anche dalla mappa nuova.
Non fatto: zone mare/giungla (il pan non è disponibile in `/hud-compose`).

## Aggiornamento 2026-11-04 (C11 tempo fatto)
La lacuna "tempo" di `/game` è coperta da `HudRealTime` (giorno, pausa, ×1/×2/×4; time-3 scelta, colore regradato, clic verificato, nessun errore). Restano le lacune: dettaglio del consumo del cibo a vista (decisione) e posizione definitiva del cluster comandi. Componenti ora 12; verdetto d'insieme invariato (da ritoccare).

## Controllo componente per componente contro il mockup (2026-11-04, su richiesta del Director)
Confronto affiancato mockup/nostro a parità di scala. Il Director: "completamente diverso da quello che avevo chiesto" (pannello e roster), barra laterale "brutta, piccola", cimiero "molto brutto".
| Componente | Buon lavoro? | Differenze principali dal mockup | Azione |
|---|---|---|---|
| C1 Roster | **No** | binario sottile (10 px) invece di una fascia ornata larga con edera; cimiero (orologio da taschino) che nel mockup non esiste: lì in cima c'è l'emblema del marchio; placche nascoste | emblema del marchio in cima (fatto); placche a scelta (hover di default, `plaques='rest'` come mockup); **nuova fascia in generazione (rail-1..3)** |
| C2 Risorse | Parziale | 3 slot invece di 5 (il gioco ne ha 3); mockup più scuro e sottile; il mio ricalibro aveva schiarito lo smeraldo | smeraldo originale ripristinato (solo oro corretto) |
| C3 Nav | Parziale | mockup: icone grandi con etichette, 7 voci; nostro: tondi con icone piccole, 2 vuoti | etichette aggiunte; 2 tondi vuoti da risolvere |
| C4 Pannello | **No** | mancano statua d'alabastro, edera, angoli smaltati con rami, finestra ad arco con illustrazione, bottone con medaglione, sezione requisiti | frame panel-3 (angoli smaltati) provvisorio; **nuova generazione panelv2 con tratti del mockup** |
| C5 Bussola | Sì, con ritocchi | lettere N/E/S/W e icona del sole mancavano | lettere aggiunte; icona del sole nel tondino da fare |
| C6 Globo | Passabile | è un oggetto isolato, senza funzione | decisione del Director |
| C7 Sigillo | Sì | numero e teschi più piccoli | numero 32 px, teschi 17 px |
| C8 Marchio | Sì dopo i ritocchi | senza ali; titolo piccolo/troncato | titolo adattato; fuso col roster |
| C9 Busto | Passabile | nel mockup è dietro la placca delle risorse, qui sul pannello | da riposizionare |
| C10 Voce | **Sì** | molto vicina | — |
| C11 Tempo | **Sì** | manca l'icona del sole | da aggiungere |
Lezione: ho scelto varianti "pulite" a scapito dei tratti distintivi del mockup (statua, edera, angoli smaltati, medaglione sul bottone). Regola nuova: una variante generata si sceglie per **fedeltà ai tratti elencati del mockup**, poi per pulizia.

## Aggiornamento 2026-11-04 (verifica a quattro risoluzioni dopo il rifacimento)
`/hud-compose` a 1280×800, 1440×900, 1920×1080 e 2400×1000 (tela fluida): bordo destro di risorse, pannello e sigillo identico ai quattro pixel (1261/1418/1891/2373 = finestra − 26 px scalati); nessun testo tagliato in pannello, risorse, nav, tempo; nessun errore in console. Trovato e corretto: il roster a 5 righe sovrapponeva la Voce sopra i 1600 px → 4 righe visibili (la quinta scorre); "Leggi tutto" andava a capo → nowrap. Sovrapposizione roster/marchio: voluta (la fascia passa sotto l'emblema). Non misurato: 3440, 390×844, ingombro percepito a pixel dopo il rifacimento, confronto con /game.

## Aggiornamento 2026-11-04 (ingombro percepito a pixel, metodo T-101b cifra 2)
Differenza di pixel tra schermata con e senza HUD, con il rumore della mappa animata sottratto (due catture a HUD spento: 3,5–4,3% dei pixel). «Persistenti» = marchio, roster, tempo, comandi, risorse, nav; «contestuali» (pannello, sigillo, Voce) esclusi; «tutto» = tutto acceso.
| Finestra | Persistenti | Tutto acceso | Terzo sinistro / centro / destro (persistenti) |
|---|---|---|---|
| 1280×800 | 18,6% | 34,2% | 28,5 / 18,1 / 9,4 |
| 1440×900 | 18,6% | 33,7% | 27,6 / 18,9 / 9,2 |
| 1920×1080 | 20,1% | 36,0% | 30,0 / 20,8 / 9,3 |
Esito: i persistenti sono **sul limite del 18%** (prima della rifusione era ~20–21%: la nav compatta e il roster a 4 righe hanno aiutato), con tutto acceso si resta sotto il tetto di un terzo (34–36%, sopra a 1920). **Squilibrio:** il terzo sinistro pesa 28–30%, il destro solo 9%. Il peso sta in marchio + roster + (a evento) Voce. Correzione proposta: marchio più piccolo (emblema senza placca a riposo) o roster a ritratti più stretti, per portare il terzo sinistro sotto il 22%. Limiti: soglia di differenza 30/765 per pixel, ombre incluse; 3440 e mobile non misurati.
