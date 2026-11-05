# Linguaggio HUD Wanderlust: v1

> Stato: **approvato dal Director il 2026-11-02**, Z-1…Z-8 accettate come proposte (registro `zanara-Z1…Z8` in `.mw/ui-catalog/ART-DIRECTION.md`).
> Precedenza: i ruling del Director (registro in `.mw/ui-catalog/ART-DIRECTION.md`) vincono su questo testo.
> Quando sarà approvato, il contenuto confluisce in `src/docs/docs/design/hud_component_guide.md` come preset `zanara` (D-4: `base` resta il predefinito).
> Tavola bersaglio: `/hud-target` (slot reali di `/game` misurati da `scripts/measure-hud-slots.mjs`, con i ritagli scelti come riferimento).

## 0. Perché un linguaggio e non i mockup

I mockup zanara sono generici: voci da gioco qualunque (Ricerca, Gilda, Negozio), 5 risorse con una gemma viola, coordinate X/Y, un bottone CTA. Il gioco ha altro: Villaggio/Mappa/Officina/Taverna, oro/cibo/legna, giorno e velocità, ordine di marcia, pericolo/ricompensa/durata.

Misurato sulla tavola:
- La densità è sbagliata per noi. Nav del mockup ≈947 px contro i 532 px dello slot reale (1,78×); risorse 660 contro 360 (1,83×); colonna roster 230 contro 150 (1,53×).
- Il chrome di zanara-v2 copre circa il 45% dello schermo (stima su riquadri). Il budget è 18%, con tetto a 1/3. Gli slot reali a riposo, compresi quelli fissati dai ruling e non ancora costruiti, coprono il 14,8%.

Dai mockup si prende la **materia** e il **modo di costruire**. Non si prendono layout, voci, quantità, densità né dimensioni.

## 0b. Riferimenti aggiunti (2026-11-02)

Due mockup nuovi, in `public/mockups/hud-lab/sources/`, usati con la stessa regola dei precedenti (materia e struttura, mai copiati):
- `busts-voce`: roster aperto (bersaglio diretto: ha i nostri dati), busti, Voce, anatomia dei chip risorse;
- `desk-poi`: pannello POI (medaglione-illustrazione, ricompense in fila, 5 teschi di rischio, tempo con clessidra, un'azione).

Scartati: gli oggetti da scrivania, il fogliame, il viola, la rosa dei venti al centro della nav, la nav verticale.

## 1. Materiali (quattro, nessun altro)

| Materiale | Ruolo | Regole |
|---|---|---|
| **Oro NMM** | Struttura: bordi, giunti, terminali | Un solo oro in tutta la HUD (una famiglia di token); opaco, consumato, cresta chiara → piede scuro; tonalità 35–45° (guida §2). Mai semitrasparente sopra lo smalto. |
| **Smalto smeraldo** | Fondo dei dati brevi (numeri, nomi, comandi) | Profondo, verde-petrolio scuro, con profondità cromatica interna (non piatto); ombre teal, mai grigie o marroni. |
| **Alabastro** | Superficie di lettura (prosa, piani, schede) | Avorio caldo con venatura lieve; testo inchiostro scuro EB Garamond; mai sotto numeri di stato critico. |
| **Gemma smeraldo** | L'unico segnale luminoso | Accesa o spenta = stato; sempre in coppia con forma o testo (stato mai solo a colore). Mai viola (purple-3). |

Ogni superficie ha tre strati (amend T-002): **cornice** (oro), **campo interno** (smalto o alabastro), **inserti** (gemme). Se una superficie non si legge senza decorazioni, i materiali non sono separati abbastanza.

## 2. Famiglie di forme

Ogni componente, presente o futuro, si compone da queste famiglie. Un componente che ne richiede una nuova è un giudizio di livello 3 (Director).

| Famiglia | Forma | Usa per | Non usare per |
|---|---|---|---|
| **F1 Lastra** | Campo di smalto, bordo d'oro, capi a punta (chevron) o tondi | Dati brevi, chip di risorsa, righe di lista, voci di nav, cartigli | Prosa lunga |
| **F2 Foglio** | Alabastro in cornice d'oro con dorso di smalto | Pannelli di lettura e pianificazione: dettaglio spedizione, scheda eroe, menu, impostazioni, registri | Valori che cambiano a ogni tick |
| **F3 Medaglione** | Anello d'oro inciso con un soggetto dentro. Due varianti, stesso oro (K1, 2026-11-02): **F3a Ritratto** = oro a incisione fitta, smalto sottile, gemma incastonata in basso (persone: eroi, residenti); **F3b Insegna** = smalto protagonista con intarsi geometrici d'oro (luoghi e simboli: emblema, sigillo POI, sigillo del verdetto) | Soli soggetti | Stati, badge, bottoni («niente cerchi-con-simbolo», guida §6b); mai F3a e F3b sullo stesso soggetto |
| **F4 Castone** | Gemma incastonata in una montatura d'oro | Stato acceso/spento, grado (es. 5 teschi = pericolo, skull-1) | Decorazione senza significato |
| **F5 Sigillo** | Placca-verdetto con alloro, può sporgere dal pannello (seal-1) | Esito/probabilità di una spedizione, vittoria | Comandi |
| **F6 Pillola** | Comando di testata 26 px (`data-hud-controls`, esistente) | Utilità: chiudi, riduci, filtri, dock | Azione primaria |
| **F7 Giunto** | Banda o nodo d'oro e smalto che lega due pezzi | Unire pezzi di uno stesso componente (banda del roster, attacco ala-cartiglio) | Riempire spazio |
| **F8 Busto** | Busto scolpito in avorio-alabastro con finiture d'oro, rivolto verso il centro (zanara-Z9) | Solo i due capi esterni delle ali della barra in alto | Ovunque altro; mai con foglie |
| **F9 Voce** | Busto dipinto dell'Amanuense (il narratore, la stessa voce del folio delle quest) + medaglione F3b con quadrante e ago + lastra F1 del messaggio (zanara-Z11) | La Voce in basso a sinistra (~320×140): obiettivo, prossimo evento, esiti, registro. A riposo solo busto + medaglione; la placca del messaggio compare con una novità | Comandi, dati numerici densi |

**Azione primaria** = una F1 di dimensione maggiore, con gemma e oro di selezione. Una sola per schermata. Mai la placca CTA (CTA/BTN-1).

## 3. Regole di composizione

1. **L'ornamento sta ai giunti e ai capi, mai sul campo dei dati.** Il campo resta pulito (brushwork-1).
2. **Un solo ornamento-eroe per regione dello schermo** (emblema in alto a sinistra, astrolabio solo se ha una funzione). Niente rose dei venti ripetute.
3. **L'oro di selezione** (più chiaro, con gemma accesa) segnala solo selezione e azione attiva. L'oro ovunque non segnala niente.
4. **Densità dalla scala reale:** spazio di disegno 1600×900, misure da token `--skin-hud-*`, testo ≥12 px (consigliato 13–15 px), numeri `tabular-nums`, target 26 px su desktop e ≥44 px in mobile-fit (targets-1).
5. **Budget:** la HUD a riposo ≤18% (perceived surface, T-101b). Ogni ornamento persistente conta.
6. **Stati:** forma + testo + tono insieme (gemma + sagoma incisa + etichetta). Il normale non parla, l'eccezione sì.
7. **Icone:** le cose del mondo (edifici, risorse, oggetti) sono dipinte; comandi e stati sono incisi nell'oro (icons-1). Mai emoji o glifi unicode.
8. **Movimento sobrio:** solo gli ornamenti funzionali (ago della bussola, shimmer della gemma), nessun overshoot, rispetto di `prefers-reduced-motion` (motion-1).
9. **Niente testo nelle immagini.** Ogni stringa passa da i18n `en` + `it-IT`.

## 4. I componenti che esistono → famiglia

Fonte: catalogo `.mw/ui-catalog/INDEX.md` (45 voci) e misure di `/hud-target`.

| Componente reale | Slot 1600×900 | Famiglie | Riferimento scelto | Copertura |
|---|---|---|---|---|
| Emblema + tempo (giorno, regolo velocità) | 20,0 · 294×73 | F3 emblema + F1 ala + F4 perle del regolo | brand / board-palette (solo emblema, D-1) | parziale |
| Cartiglio evento (topbar-1) | centro · ~320×88 | F1 cartiglio + F7 attacco alle ali | — | manca |
| Risorse oro / cibo / legna | 1220,0 · 360×73 | F1 chip fissi + F4 stato critico | resources / zanara-v3 | parziale |
| Roster chiuso (colonna) | sx · ~150×440 | F3 ritratto + F1 placca + F7 banda + F4 stato | roster / zanara-v2 | copre |
| Roster aperto (pannello) | 400×268 | F2 testata + righe F1 | — (produzione rivestita) | manca |
| Dettaglio spedizione | 546,92 · 680×587 | F2 + F1 slot ruolo + F1 primaria | panel / zanara-v3 | parziale |
| Previsione / pericolo / intel | 1236,100 · 338×380 | F2 + F1 chip + F4 teschi | — | manca |
| Sigillo del verdetto | sporge dal dettaglio | F5 + F4 | seal / mockup1-classic | copre |
| Nav (4 slot, nav-1) | 534,822 · 532×78 | F1 voci + icone dipinte + F7 | nav / zanara-v1 | parziale |
| Dock (4 comandi, corner-1) | 1438,834 · 136×40 | F6 | cornerBR / board-breakdown | parziale |
| Bussola (D-2) | bassa sx · ~250×100 | F3 + F1 lettura | cornerBL / zanara-v1 | parziale |
| Tooltip, toast, menu Pannelli | — | F1 piccola / F2 | — | regola |
| Scheda eroe, memoriale, reliquiario, impostazioni, carica partita | — | F2 «editoriale» | — | regola |
| Mercante, magazzino, registro | — | F2 «tabella» + righe F1 | — | regola |
| Sigillo POI sulla mappa | marker | F3 (linea di design a parte: Medaglione di Valenflø) | — | fuori scopo |

## 5. Ricetta per un componente futuro

1. **Che cosa dice?** Dato breve (F1), lettura (F2), soggetto (F3), stato (F4), esito (F5), utilità (F6).
2. **Dove sta?** Fisso (non copre la terra) o fluttuante (chiudibile). Misuralo nello spazio 1600×900 e somma la sua superficie al budget.
3. **Componi dal kit (§6).** Niente asset nuovo se le famiglie bastano. Un asset nuovo passa dal registro del kit con prompt e deroga (assets-1).
4. **Ornamento solo ai giunti e ai capi.** Al massimo un ornamento-eroe nella regione.
5. **Stati:** elenca gli stati reali dal codice (non quelli di un mockup) e dai a ciascuno forma + testo + tono.
6. **Prova:** affiancalo agli altri componenti della stessa famiglia su `/hud-target` e su `/game` a 1440×900 e 1280×800. Chiude il giudizio a occhio del Director.

## 6. Kit di asset (da generare: il Director, con i prompt del kit)

Ogni pezzo va generato isolato, su fondo piatto, a 4× della dimensione a schermo, nella stessa sessione e con lo stesso riferimento di materiale (un solo oro). Le cornici si montano a 9 fette: angoli fissi, lati ripetuti.

| Pezzo | Famiglie | Note di produzione |
|---|---|---|
| Profilo d'oro dritto (orizzontale e verticale) | F1 F2 F7 | Ripetibile senza cuciture |
| Angolo d'oro | F1 F2 | Quattro orientamenti da un'unica immagine |
| Terminale a punta (chevron) e terminale tondo | F1 | Capi delle lastre |
| Campo di smalto smeraldo | F1 F7 | Texture ripetibile, profondità interna |
| Campo d'alabastro | F2 | Texture ripetibile, venatura lieve |
| Anello medaglione: F3a ritratto (`kit/approved/K1-ring-ritratto.png`, ex v2) e F3b insegna (`kit/approved/K1-ring-insegna.png`, ex v4) | F3 | Foro trasparente, ombra interna separata; oro creste 42,7° / 41,8° |
| Castoni: tondo, goccia, losanga (3 taglie) + stato spento | F4 | Acceso e spento dalla stessa gemma |
| Nodo / giunto | F7 | Banda del roster, attacco ala-cartiglio |
| Emblema Wanderlust | F3 | Soggetto = il sole nascente del logo di boot (`src/assets/ui/idleVillage/wanderlust-logo.png`, D-1), ridisegnato in oro + smalto: non la rosa dei venti dei mockup |
| Sigillo con alloro | F5 | Da mockup1-classic, ridisegnato a 4× |
| Icone dipinte: villaggio, mappa, officina, taverna, oro, cibo, legna | — | icons-1 |

## 7. Decisioni (approvate 2026-11-02)

Conflitti tra i mockup scelti e i ruling già presi. Tutte le proposte sono approvate così come scritte.

- **Z-1. Densità.** I mockup lavorano a circa 1,8× la nostra scala e al ~45% di copertura.
  *Proposta:* teniamo gli slot reali e il budget del 18%; il linguaggio si disegna alla nostra scala, con ornamenti più piccoli e meno numerosi.
- **Z-2. Edera nella banda del roster** contro «niente foglie» (guida §1.1).
  *Proposta:* la banda resta smalto, oro e gemme, senza edera. In alternativa, eccezione dichiarata solo per la banda.
- **Z-3. Bottone INIZIA.** È una placca CTA, vietata da CTA/BTN-1.
  *Proposta:* primaria = lastra F1 maggiore con gemma accesa, senza rosa dei venti.
- **Z-4. Medaglioni e roundel.** Ammessi solo per i soggetti (F3). I comandi del dock restano pillole F6.
- **Z-5. Bussola in basso a sinistra.** Il gioco non ha coordinate X/Y.
  *Proposta:* legge l'ora del giorno e il punto cardinale della vista, oppure si toglie. È la terza rosa dei venti, insieme all'emblema e all'astrolabio della nav.
- **Z-6. Sigillo.** D-3 lo voleva come lettura persistente del lascito; il mockup è un verdetto di spedizione (68% + teschi).
  *Proposta:* diventa il verdetto nel dettaglio spedizione (seal-1); il lascito si decide a parte.
- **Z-7. Regola madre.** Oggi è «sembra il Roster V2» (roster-base).
  *Proposta:* con il preset zanara la regola madre diventa questo linguaggio e il componente di riferimento è il primo costruito dal kit (anchor-first, r002).
- **Z-8. Oro.** L'oro dei mockup è più lucido della regola NMM opaca.
  *Proposta:* resta NMM opaco, campionato e verificato a 35–45°.
