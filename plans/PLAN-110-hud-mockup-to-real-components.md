# PLAN-110: dai mockup scelti ai componenti veri, uno alla volta

**Status:** G0 chiuso 2026-11-02 (decisioni sotto, §2bis); strumenti approvati. **Aggiornamento 2026-11-02 sera:** restauro puro e costruzione pura hanno fallito (§2ter); si apre il **Sottopiano G (§12): rigenerazione mirata con Gemini**, che sostituisce S3 per gli ornamenti. **Dibattito multi-AI web 2026-11-02:** CONVERGED su artifact-r003 (sha `3c3154b5…`), ACCEPT 3/3 — gli **emendamenti §13 modificano** il piano qui sotto e prevalgono dove divergono.
**Sostituisce:** PLAN-109 (kit generico K2–K17), **chiuso, fallito** il 2026-11-02. La regola iniziale «non si generano immagini nuove» è superata dal Sottopiano G (§12): Gemini rigenera le zone del mockup come editing guidato.
**Parent:** PLAN-107, R-303.
**Ruolo:** lead system designer (AI) propone e verifica; agenti del Director eseguono; il Director decide a vista a ogni gate.
- visual-fork: .mw/runs/20261102-hud-zanara/visual-fork-hud-zanara.md — copre `src/ui/idleVillage/hudReal/` e `src/ui/idleVillage/zanara/` (mockup zanara-v1/v2/v3 + ruling zanara-Z1…Z11 + kit approvato; fork reale, niente skip).

---

## 0. Obiettivo e principio

Due risultati, in quest'ordine.

1. **R1, il bersaglio.** I componenti scelti dal Director, **esattamente quelli**, ritagliati in modo professionale e posati sulla mappa viva di `/hud-compose`, ognuno nella sua posizione. Il testo dei mockup resta: R1 è un bersaglio visivo, non ancora un componente.
2. **R2, i componenti veri.** Ogni pezzo di R1 diventa un componente React con dati reali dello store, stati, accessibilità e i18n. La meccanica del gioco non cambia; cambiano pelle e layout.

**Principio di produzione** (dalla ricerca, §11): l'asset si **restaura**, non si ridisegna.
- La forma dei pezzi viene dal mockup. Si migliorano risoluzione, bordi, coerenza dell'oro e difetti dell'AI.
- Si separano cornice e contenuto: la cornice è un'immagine restaurata, il contenuto è codice.
- Si stira solo ciò che è piatto. Gli ornamenti non si deformano mai.
- Gli stati si derivano dalla stessa immagine base: niente disegni separati che "ballano".

Divieti per tutta la traccia:
- nessuna immagine generata da AI generativa (Gemini, SD, SUPIR) **tranne nel Sottopiano G (§12)**, dove Gemini rigenera le zone del mockup come riparazione guidata, mai come generazione libera (ruling del Director, 2026-11-02);
- nessun upscaler che inventa dettaglio;
- nessuna posizione a occhio: ogni coordinata è misurata da script e salvata in JSON.

---

## 1. Inventario: i componenti scelti

Sorgenti in `public/mockups/hud-lab/sources/`. Riquadri in px sorgente (da `scripts/build-hud-lab-crops.mjs` e dalla sessione 2026-11-02).

| # | Componente | Sorgente (sha256, 16) | Riquadro sorgente [x,y,w,h] | Contenuto di gioco reale |
|---|---|---|---|---|
| C1 | Roster (colonna) | zanara-v2 `9eb79d66a4a2f238` | [5,190,240,440] + emblema [0,0,232,227] | `ResidentState[]` (ritratto, nome, LV, HP, fatica, stato) |
| C2 | Risorse | zanara-v3 `4d214e37aabc5a7f` | [880,15,690,100] | `ResourceReadoutItem[]` (oro, cibo n/max + andamento + pericolo, legna) |
| C3 | Nav | zanara-v1 `2085467d68251258` | [315,685,990,212] | `navItems` (villaggio, mappa, officina 🔒, taverna 🔒), voce attiva |
| C4 | Pannello contestuale | zanara-v3 | [1195,95,425,580] | dettaglio POI / spedizione (titolo, tipo, testo, ricompense, requisiti, azione) |
| C5 | Angolo basso-sinistra | zanara-v1 | [0,640,310,260] | giorno, fase, velocità (oggi in `WhenWhereCluster`) |
| C6 | Angolo basso-destra | board-breakdown `6283df805eb2f6e0` | [1285,570,251,205] | dock: recenter, menu, pannelli (badge), nascondi |
| C7 | Sigillo | mockup1-classic `4e6265c0f2bd0114` | [1285,75,210,190] | verdetto spedizione (probabilità + 5 teschi di pericolo) |
| C8 | Marchio | board-palette `db12f0d1ea94a3e4` | [5,10,480,180] | emblema (+ placca, vedi D-8) |
| C9 | Busti ×2 | busts-voce `845660700a3eba6e` | [0,0,100,160] · [1430,0,106,140] | ornamento, terminali delle ali (Z9) |
| C10 | Voce (Amanuense) | busts-voce | [0,740,455,270] | obiettivo, prossimo evento, esiti (Z11) |
| C11 | Roster aperto | busts-voce | [12,158,310,387] | come C1, con valori numerici e filtri |
| C12 | Pannello POI | desk-poi `0dabbab82d318214` | [1345,125,320,575] | ricompense, rischio a teschi, tempo stimato, azione |

C9–C12 vengono dagli ultimi due mockup approvati in sessione. **Gate G0** li conferma o li toglie.

**Posizione in R1:** layout di zanara-v1/v2/v3, tutti 1672×941, scalato a 1600×900 (fattore 0,957).
- C1–C5: nella posizione che hanno nel loro mockup.
- C6, C7, C8: dalle tavole o da mockup1, con formati diversi. Vanno nello slot zanara equivalente, scalati in modo che l'**altezza** coincida con quella del pezzo zanara corrispondente (misurata).
- C9–C12: nelle loro posizioni in `busts-voce`/`desk-poi`, scalate a 1600×900.

---

## 2. Decisioni del Director prima di partire (Gate G0)

Il Director ha chiesto "esattamente i componenti scelti". Alcuni ruling recenti li contraddicono. Per ogni punto si decide se il ruling resta o viene sospeso **per questa traccia**.

| ID | Conflitto | Opzioni |
|---|---|---|
| D-1 | Scala: Z-1 (scala ridotta, budget 18%) contro la scala dei mockup (~1,8×, ~45% di copertura) | (a) scala dei mockup in R1, budget misurato a R2; (b) scala ridotta da subito |
| D-2 | Edera e foglie nella banda del roster (Z-2) e nei busti | (a) restano come nel mockup; (b) si tolgono in restauro |
| D-3 | INIZIA a placca CTA (Z-3, CTA/BTN-1) | (a) resta come nel mockup; (b) diventa lastra di famiglia in R2 |
| D-4 | Astrolabio al centro della nav (nav-1: recenter fuori dalla barra) e 7 voci contro le nostre 4 | (a) astrolabio = recenter, 4 voci; (b) astrolabio solo ornamento |
| D-5 | Coordinate X/Y in C5 (Z-5: il gioco non le ha) | (a) diventa giorno + fase + velocità; (b) si toglie la piastrina |
| D-6 | Roundel del dock (Z-4: niente cerchi-con-simbolo) | (a) roundel con icone incise; (b) pillole |
| D-7 | Sigillo: dove vive (Z-6) | (a) nel dettaglio spedizione; (b) persistente vicino alla nav, come in compose |
| D-8 | Placca WANDERLUST (D-1 PLAN-107: solo emblema in HUD) | (a) solo emblema; (b) emblema + placca |
| D-9 | C9–C12 dentro o fuori | conferma voce per voce |
| D-10 | Gemma viola nelle risorse di zanara-v3 (purple-3) | si ricolora in restauro (sempre, è un ruling di livello 1) |

**Strumenti da installare** (vanno approvati: si scaricano file):
1. **BiRefNet**, il modello di scontorno con i bordi migliori nei confronti pubblici. Variante general, ~0,2–1 GB secondo la precisione, licenza MIT.
2. **Real-ESRGAN x4plus**, ~65 MB, e **SwinIR** classico ×4, ~60 MB, via `spandrel` (PyTorch, MPS su Mac). Fedeltà prima di tutto: niente SUPIR, che inventa texture.
3. **LaMa** (`big-lama`, ~200 MB) via IOPaint, per togliere testi e numeri dalle campiture.
4. Tutti girano in locale. Le versioni si fissano in `requirements-hud.txt`.

---

## 2bis. Esito del Gate G0 (Director, 2026-11-02)

| ID | Decisione |
|---|---|
| D-1 | **Scala dei mockup** in R1; budget misurato in R2 (sospende Z-1 per questa traccia) |
| D-2 | **Edera e foglie restano** come nel mockup (sospende Z-2 e «niente foglie» per questa traccia) |
| D-3 | **INIZIA resta** come nel mockup, testo vivo (sospende CTA/BTN-1 per questo pannello) |
| D-4 | **Astrolabio = recenter**, al centro; ai lati le 4 voci vere (Villaggio, Mappa \| Officina, Taverna) |
| D-5 | **Rimandata**: in R1 l'angolo resta com'è nel mockup per il layout; il contenuto della piastrina si decide prima di R2 di C5 |
| D-6 | **Roundel con icone incise** nel dock (sospende Z-4 per il dock) |
| D-7 | **Sigillo nel dettaglio spedizione** (verdetto: probabilità + 5 teschi, sporge dal pannello) |
| D-8 | **Emblema + placca WANDERLUST** (sospende D-1 di PLAN-107; la scritta resta immagine perché è un logo) |
| D-9 | Entrano **C9 Busti** e **C10 Voce**; **C11 Roster aperto e C12 Pannello POI escono** |
| D-10 | Gemma viola ricolorata in smeraldo (ruling di livello 1, non sospendibile) |

Strumenti: approvati tutti e **installati** in `tools/hud-real/` (venv Python 3.12, `requirements-hud.txt`, modelli in `tools/hud-real/models/` con sha256 in `MANIFEST.json`, cartella esclusa da git). Prova su un ritaglio del roster (`tools/hud-real/smoke.py`, `.mw/specs/hud-real/_smoke/`):
- SwinIR classico ×4: fedeltà a 1× MAD **1,39**, 3,6 s → **upscaler di default**;
- Real-ESRGAN x4plus: MAD 5,96, 1,9 s → altera di più, solo come alternativa;
- BiRefNet (ONNX via rembg, senza codice remoto): bordi puliti su anello e placca, smalto intatto, 35 s per ritaglio su CPU;
- LaMa big-lama (TorchScript): funziona.

## 2ter. Esito di C1 R1 e prova di costruzione (2026-11-02)

- **Restauro puro (S0–S2, `.mw/specs/hud-real/C1/`):** forma e ricchezza del mockup, ma conserva i difetti AI: le 4 righe hanno anelli, gemme e lunghezze di placca diverse, bordi ondulati, archi persi. Giudizio del Director: «il concept è corretto ma ci sono i classici errori da AI slop, errori di simmetria; non ci serve una copia, ci serve una HUD AAA».
- **Costruzione vettoriale pura (`tools/hud-real/proto/row.svg`):** simmetria e coerenza perfette, luce coerente, ma piatta e povera: conferma la lezione già nota (CSS/SVG non bastano per gli ornamenti dipinti).
- **Conclusione:** serve un **metodo ibrido**: geometria costruita (simmetrica, identica tra le righe) + materia e filigrana prese dalle parti migliori del mockup, specchiate e ripetute. Il piano si riscrive su questo prima di proseguire con S3.

## 3. Pipeline per un componente (sempre la stessa, otto stadi)

Ogni componente ha un fascicolo `.mw/specs/hud-real/<Cn>/` con i file di ogni stadio. **Non si passa allo stadio successivo senza il file dello stadio precedente.** Gli script sono riproducibili e vivono in `scripts/hud-real/`.

### S0. Blocco del riferimento
- Si copia il riquadro sorgente con un margine di 24 px. Si salvano sha256 della sorgente, riquadro, scala verso 1600×900 e posizione in R1.
- **Inventario visivo** (`inventory.md`): ogni elemento ha un ID. Esempio per C1: anello, banda, placca, edera, gemme ai giunti, emblema, ali, pendente, ritratto, testo nome, LV, barra.
- Ogni elemento riceve una classe:
  - `FRAME`: resta immagine restaurata;
  - `CONTENT`: diventa codice (testo, numeri, barre, ritratti, icone di stato);
  - `ART`: immagine di contenuto che resta (illustrazione del pannello);
  - `STATE`: parte che cambia con lo stato (gemma accesa/spenta).
- **Uscita:** `reference.json`, `inventory.md`.

### S1. Upscale fedele
- ×4 del riquadro con SwinIR e con Real-ESRGAN. Si sceglie per componente con un **test di fedeltà**: si riscala l'upscale a 1×, si confronta con l'originale e si sceglie quello con la differenza minore (soglia: MAD ≤ 3/255 sulla cornice).
- Solo sul livello `FRAME`/`ART`. Il testo non si upscala: tanto diventa codice.
- **Uscita:** `S1-x4.png` + `S1-fidelity.json`.

### S2. Scontorno
1. BiRefNet sull'upscale dà una maschera morbida.
2. Si vincola la maschera con la geometria misurata: cerchi degli anelli con fit dei minimi quadrati, poligoni delle placche dai bordi d'oro, simmetrie. Sono le tecniche già usate in `hud-roster-crop.py`.
3. Si ripuliscono i fori interni (ritratti, campi) e si fa decontaminazione del colore sul bordo, per togliere l'alone del fondo del mockup.
4. **Controlli:** composizione su magenta, su blu notte e sulla mappa viva. Metrica: alone = pixel di bordo con tinta del fondo originale, < 0,5%. Nessun buco nello smalto (errore "verdi cancellati" già visto).
- **Uscita:** `S2-alpha.png` + 3 composizioni di controllo.

### S3. Restauro (il lavoro che rende "più bello e professionale" senza ridisegnare)

> **Superato per gli ornamenti dal Sottopiano G (§12).** Qui restano valide solo le parti meccaniche: rimozione di testi e ritratti dalle campiture piatte (LaMa), oro unico, viola → smeraldo. Gli ornamenti si rigenerano.
1. **Rimozione del contenuto:** maschere dei testi, numeri, ritratti e icone di stato (classe `CONTENT`), riempite con LaMa sulle campiture piatte. Sugli ornamenti si ricostruisce per **clonazione simmetrica** dalla metà buona, mai per invenzione.
2. **Difetti da AI** (ornamenti fusi, asimmetrie non volute, righe del roster disegnate diverse): si sceglie l'istanza migliore e si replica con le geometrie misurate. Esempio: le 4 righe di C1 diventano 1 riga ripetuta, scelta dal Director tra le 4.
3. **Oro unico:** trasferimento di colore sulla sola maschera dell'oro (istogramma in Lab) verso l'oro di riferimento, il roster C1, deciso al gate G1. Obiettivo: creste a 35–45° di tonalità. Risolve il problema dei "tre ori diversi".
4. **Viola → smeraldo** dove c'è (D-10).
5. **Nitidezza:** unsharp mask leggera solo sull'oro inciso, misurata con la varianza del Laplaciano (≥ originale a 1×, senza aloni).
- **Uscita:** `S3-frame.png` (cornice pulita, ×4), `S3-art.png` se c'è illustrazione, `S3-report.md` con prima/dopo di ogni intervento.

### S4. Scomposizione per il comportamento
- **Cosa si allunga e cosa si ripete:** 3 fette o 9 fette solo su tratti piatti misurati (profilo d'opacità uniforme, come per la placca K2). Righe e segmenti si ripetono col passo misurato (roster, chip delle risorse, voci della nav).
- **Stati derivati da script dalla stessa base:**
  - normale;
  - hover: luminosità +8%;
  - premuto: luminosità −8% e 1 px giù;
  - disabilitato: desaturato e velato, ma leggibile;
  - attivo: oro di selezione + gemma accesa;
  - focus: anello oro.
  
  Le gemme di stato sono un livello a parte (`STATE`), ritagliate dalla stessa immagine.
- **Esportazione:** ×2 e ×3 (WebP lossless + PNG di riserva), con le misure di taglio scalate per ogni DPR (le misure di `border-image-slice` sono nei px del file).
- **Uscita:** `public/assets/ui/hud-real/<Cn>/*` + `geometry.json`.

### S5. Mappa del contenuto
- **Zone di montaggio misurate:** riquadri di testo, fori dei ritratti, alloggi delle icone, barre, gemme di stato.
- **Tipografia** abbinata al mockup: famiglia, corpo, colore campionato, ombra. Va verificata con l'estensione dei glifi a 1:1, come per il roster di prova.
- **Abbinamento a dati e stringhe:** ogni elemento `CONTENT` va a un campo reale (contratto di produzione) o a una chiave i18n. Se il mockup mostra un dato che il gioco non ha, è un elemento da togliere o una decisione D.
- **Uscita:** `content-map.json`.

### S6. Componente React
- `src/ui/idleVillage/hudReal/<Nome>.tsx`.
- **Stesso contratto dati del componente di produzione** che sostituisce:
  - C1 come `ResidentRosterPanelV2`;
  - C2 come `ResourceReadout`;
  - C3 come `navItems` + `activeNavId`;
  - …
- Geometria e colori da `geometry.json` e da un contratto di token, mai letterali sparsi.
- **Accessibilità:** ruoli, `aria-*`, focus da tastiera, `prefers-reduced-motion`, testo ≥ 12 px.
- **i18n** `en` + `it-IT`.
- **Test:** unit sulla logica pura (stati, mappature) in `tests/unit/idleVillage/`.
- **Uscita:** componente + test verdi.

### S7. Verifica e gate del Director
1. **Fedeltà:** il componente con il contenuto del mockup (stessi nomi e numeri) affiancato e sovrapposto al riferimento a 1:1. Metrica sulla cornice: MAD ≤ 4/255. Testo: estensione dei glifi entro ±1 px.
2. **Dati veri** dallo store su `/hud-compose`, a 1440×900, 1600×900, 1920×1080, 2560×1440, con DPR 1 e 2.
3. **Comportamento:** scroll, clic, tastiera, stati, con input reali (Playwright).
4. **Gate G-Cn:** il Director guarda la pagina di confronto e dice sì o no. Un no torna allo stadio indicato (S2 scontorno, S3 restauro, S5 tipografia).
- **Uscita:** `verification.md` con le catture.

---

## 4. Ordine di lavoro

Dal pezzo che fissa il riferimento a quelli che lo riusano.

1. **C1 Roster (colonna).** Fissa oro, smalto e il processo. Ha già un prototipo misurato (`scripts/hud-roster-crop.py`, `/hud-roster-crop`): riparte da lì, aggiungendo upscale, BiRefNet e restauro.
2. **C2 Risorse.** Prova il segmento ripetibile per numero variabile di chip.
3. **C3 Nav.** Prova le voci ripetute e lo stato attivo e bloccato.
4. **C4 Pannello contestuale.** Prova la 9 fette verticale con contenuto lungo e l'illustrazione (`ART`).
5. **C7 Sigillo.** È il primo pezzo da una sorgente diversa, quindi prova l'oro unico.
6. **C5 e C6, gli angoli.**
7. **C8 Marchio.**
8. **C9 Busti** e **C10 Voce** (C11 e C12 esclusi al G0).

Ogni componente chiude il suo gate prima di aprire il successivo. Il primo, C1, si chiude anche come **riferimento di qualità**: oro, nitidezza e scontorno di C1 diventano il metro per tutti gli altri.

---

## 5. Milestone R1 (bersaglio): dentro lo stesso ordine

- Per ogni componente, dopo S3 (restauro) e **prima** di S4, il pezzo restaurato **con il suo testo originale** si posa su `/hud-target-r1`: mappa viva, posizioni del §1.
- Quando tutti i pezzi scelti sono in R1, **Gate R1**: il Director approva la composizione intera. Solo allora si apre R2 sul resto della lista. Fa eccezione C1, che chiude R2 subito come prova del processo.

---

## 6. Fascicoli per componente (dettagli specifici)

**C1 Roster.**
- `FRAME`: emblema, banda, anello, placca, pendente.
- `CONTENT`: ritratto, nome, LV, barre.
- `STATE`: gemma ai giunti (accesa, spenta, ferro).
- Ripetizione: 1 riga al passo misurato (94 px sorgente); la banda come tile verticale.
- Lo scroll oltre 4 righe c'è già nel prototipo.
- Apertura del roster grande: l'emblema.

**C2 Risorse.**
- `FRAME`: barra con capi gemmati.
- `CONTENT`: icone dipinte (da produzione), valori, etichette.
- Ripetizione: segmento di chip misurato tra due divisori, 3 per i dati di oggi.
- Pericolo: tono + testo + sagoma + filetto pieno (halo-1).
- Gemma viola ricolorata.

**C3 Nav.**
- `FRAME`: barra, terminali, astrolabio (D-4).
- `CONTENT`: icone e etichette.
- Ripetizione: voce misurata, ×4.
- Attivo: fondo + filetto + etichetta (nav-1). Bloccato: velato + lucchetto inciso + requisito.

**C4 Pannello.**
- `FRAME`: cornice d'alabastro a 9 fette (angoli con statue intatti; si allungano solo i tratti piatti).
- `ART`: illustrazione verticale, sostituibile per POI.
- `CONTENT`: titolo, tipo, testo, ricompense, requisiti, azione (D-3).
- Altezza variabile col contenuto, entro un massimo, poi scroll interno.

**C5 Angolo sinistro.**
- `FRAME`: bussola + piastrina. `CONTENT`: piastrina (D-5).
- `STATE`: ago della bussola come livello a parte, animabile (amend v2) e fermo con reduced-motion.

**C6 Angolo destro.**
- `FRAME`: cluster. `CONTENT`: 4 comandi (corner-1), tasti rapidi, badge dei pannelli (D-6).

**C7 Sigillo.**
- `FRAME`: alloro, spade, disco. `CONTENT`: percentuale e 5 teschi (skull-1: accesi/spenti dalla stessa immagine).
- Oro portato su quello di C1.

**C8 Marchio.**
- `FRAME`: emblema (+ placca, D-8). Il testo WANDERLUST, se resta, è un logo e quindi un'immagine (unica eccezione al "niente testo nell'immagine").

**C9 Busti.** Solo `FRAME`, ancorati ai capi delle ali (Z9).

**C10 Voce.**
- `ART`: busto dell'Amanuense. `FRAME`: medaglione + placca del messaggio.
- `CONTENT`: messaggio, da obiettivo, eventi ed esiti. A riposo solo busto + medaglione.

**C11 Roster aperto.**
- `FRAME`: pannello, righe, testata.
- `CONTENT`: come il roster di produzione, con filtri e trascinamento invariati.

**C12 Pannello POI.**
- `FRAME`: cornice + medaglione dell'illustrazione.
- `CONTENT`: ricompense, teschi, tempo, azione.

---

## 7. Criteri di qualità ("professionale", misurabile)

| Criterio | Misura | Soglia |
|---|---|---|
| Fedeltà della cornice | MAD contro il riferimento a 1:1 | ≤ 4/255 |
| Nitidezza | varianza del Laplaciano a ×2 contro il riferimento riscalato | ≥ 1,0× |
| Scontorno | pixel di bordo con tinta del fondo | < 0,5% |
| Buchi nello smalto | componenti trasparenti interne non previste | 0 |
| Oro unico | mediana della tonalità delle creste, tutti i pezzi | 35–45°, spread ≤ 4° |
| Colori vietati | frazione di viola nella UI | 0 |
| Testo | glifi contro il mockup, altezza minima | ±1 px, ≥ 12 px |
| Stati | 6 stati derivati dalla stessa base, spostamento in px | 0 px (premuto: 1 px voluto) |
| Prestazioni | peso degli asset per componente a ×2 (WebP) | ≤ 400 KB (C4 ≤ 900 KB con ART) |
| Accessibilità | focus visibile, ruoli, tastiera, reduced-motion | tutti presenti |

Il verdetto finale resta l'occhio del Director (ranking-1). Le metriche servono a non portargli pezzi che falliscono in modo evidente.

---

## 8. Integrazione

1. Ogni componente R2 entra in `/hud-compose` al posto del pezzo vecchio (come già C1 e C2 prototipi).
2. Poi su `/game` **dietro il preset `zanara`** (D-4 di PLAN-107: `base` resta il predefinito), sostituendo i componenti in `GameFrame` tramite gli slot esistenti (`rosterSlot`, `resourcesSlot`, …).
3. Si controlla che la mappa non si muova per un pannello e che i fissi non coprano la terra a 1440×900 e 1280×800 (T-01).
4. **Chiusura:** `npm run lint -- <scope>`, `npm run build:check`, test, `npm run closure:lint`, cattura per viewport con il preset attivo e con `base`.

---

## 9. Cosa si butta e cosa si tiene del lavoro fatto

- **Si tiene:**
  - i contratti dati e la logica (`zanaraRosterState` + test, uso di `ResourceReadoutItem`);
  - tooltip, focus e scroll;
  - `measure-hud-slots.mjs` e `/hud-target`;
  - le tecniche di misura di `hud-roster-crop.py`.
- **Si sospende:** il kit generato K2–K17 (`PLAN-109`, `kit/approved/`), come riferimento soltanto. `ZanaraRoster` e `ZanaraResources` attuali restano finché le versioni C1 e C2 non passano il loro gate, poi si sostituiscono.
- **Da aggiornare a G0:** `LINGUAGGIO-v1.md` (scala, densità d'ornamento, oro) secondo le decisioni D-1…D-10.

---

## 10. Rischi

| Rischio | Mitigazione |
|---|---|
| I mockup sono immagini AI: dettagli fusi, righe diverse tra loro | restauro per clonazione simmetrica e istanza migliore replicata (S3); mai invenzione |
| L'upscale cambia il carattere | test di fedeltà a 1× (S1), solo modelli fedeli |
| Pezzi da sorgenti diverse non si somigliano | oro unico in Lab (S3) + gate sul confronto affiancato con C1 |
| Le decorazioni dipinte si leggono male in piccolo (lezione di Diablo IV) | testo e icone di stato sempre in codice, nitidi; l'ornamento resta immagine |
| Mockup a scala 1,8× contro budget | D-1 al G0; misura del budget in R2, con i due numeri di T-101b |
| Dati del mockup che il gioco non ha (X/Y, 7 voci, 5 risorse) | classe `CONTENT` + decisioni D, mai dati inventati |

---

## 11. Ricerca: cosa ne ho preso

- Sequenza concept → foglio componenti → 9 fette → atlante ed esportazione; gli angoli decorati restano interi e si allunga solo il centro piatto ([SpriteCook UI kit](https://www.spritecook.ai/docs/ui-kit); [Wildlife Studios](https://medium.com/tech-at-wildlife-studios/why-should-you-care-about-optimizing-ui-for-mobile-games-31090af6f59a); [UI 9 Slicer](https://github.com/ScottWoodhams/UI-9-Slicer); [SPRITE, arXiv](https://arxiv.org/pdf/2604.18591v1)).
- Riempimento separato dalla cornice, così una barra che cambia non tocca la cornice ([Sorceress](https://sorceress.games/blog/nest-an-ai-ui-generator-hud-panel-pack-2026)); livelli separati nel PSD di una HUD ([OpenGameArt](https://opengameart.org/node/6542)).
- Stati derivati da script dalla stessa base, per evitare il "ballo" tra normale e premuto; quattro stati minimi ([gegx Pixel UI Kit](https://gegx.itch.io/pixel-ui-kit); [generalistprogrammer](https://generalistprogrammer.com/tutorials/game-ui-design-best-practices); [atomic design](https://medium.com/swlh/the-importance-of-component-based-ui-design-666e5dfc7c1a)).
- Scontorno: BiRefNet più preciso sui bordi complessi di ISNet/U2Net ([Cloudflare](https://blog.cloudflare.com/background-removal/); [BiRefNet vs rembg](https://ice-ice-bear.github.io/posts/2026-04-15-birefnet/); [DEV](https://dev.to/om_prakash_3311f8a4576605/birefnet-vs-rembg-vs-u2net-which-background-removal-model-actually-works-in-production-d2f)).
- Upscale: SwinIR e Real-ESRGAN fedeli, SUPIR inventa; l'upscale peggiora testo e UI, quindi si upscala solo il livello d'arte ([youngju.dev](https://www.youngju.dev/blog/culture/2026-05-16-ai-image-upscaling-restoration-2026-topaz-photo-supir-gfpgan-real-esrgan-codeformer-magnific-krea-deep-dive.en); [zsky](https://zsky.ai/blog/ai-upscaling-comparison)).
- Rimozione testo: LaMa buono su fondi semplici, debole sugli ornamenti fitti, da cui la clonazione simmetrica per gli ornamenti ([LaMa Cleaner](https://pypi.org/project/lama-cleaner/0.26.1); [LaMa](https://medium.com/gliacloud/removing-any-object-from-your-photo-with-lama-7e966765fadc)).
- Lezione di Diablo IV: lo stile dipinto rende male negli elementi piccoli della UI ([Blizzard, quarterly update feb 2020](https://news.blizzard.com/en-us/article/23308274/diablo-iv-quarterly-updatefebruary-2020)).
- `border-image-slice` lavora nei px del file sorgente; a ×2 i tagli raddoppiano ([MDN](https://developer.mozilla.org/es/docs/Web/CSS/border-image-slice)).

---

## 12. Sottopiano G: rigenerazione mirata con Gemini

**Obiettivo.** Per ogni zona di ogni componente scelto, ottenere da Gemini un'immagine che sia **la stessa progettazione del mockup** (stesse forme, motivi, proporzioni, conteggi, colori) **senza i suoi difetti** e a risoluzione di produzione. Non è "genera qualcosa di simile": è **riparare il mockup**.

> **Aggiornamento sera:** la scoperta del metodo giusto passa da `PLAN-111-hud-generation-trials.md` (prove ed errori, catalogo di elementi da generare a mano o con agenti). Le fasi G-0…G-8 qui sotto restano la catena di produzione che usa la ricetta trovata.

### 12.1 Ruling e perimetro
- Director, 2026-11-02: il restauro puro (C1 R1) conserva gli errori dell'AI; la costruzione pura in vettoriale è simmetrica ma piatta; l'ibrido (anello srotolato, specchiato, riavvolto) è sfocato. La causa è unica: nel mockup un ornamento piccolo ha **pochi pixel** (la fascia dell'anello è larga ~9 px), e nessun trattamento a valle aggiunge dettaglio vero.
- Si torna a generare con Gemini, ma solo come **editing guidato** del mockup. Il divieto di §0 «niente immagini generate» è sospeso solo per questo sottopiano.
- Restano validi: niente componenti-immagine (testo, numeri, ritratti, stati in codice), niente viola nella UI, gli anelli K1 Ritratto e Insegna come riferimento di **materiale** approvato.

### 12.2 Diagnosi: perché la generazione di prima ha dato un risultato povero
| Cosa è successo (PLAN-109) | Conseguenza | Correzione in G |
|---|---|---|
| Ogni pezzo generato **isolato e generico** (lastra, banda…), senza il disegno del mockup come base | composizione diversa dal concept: campo verde piatto con filo d'oro | la base di ogni generazione è la **zona del mockup**, non un testo |
| Un prompt = un pezzo intero | pochi pixel per ornamento, dettaglio medio | **zone strette**: ogni ornamento ha la sua generazione e occupa tutta l'immagine |
| Nessuna lista di difetti, nessun «cambia solo questo» | l'AI ridisegnava tutto ogni volta | **registro dei difetti** numerato; una modifica = un difetto |
| Scarto automatico non applicato dagli agenti (marrone e cuciture oltre soglia passate) | varianti difettose arrivate al Director | il gate è **uno script che scarta**, non una regola da ricordare |
| Quota di Gemini esaurita a metà (K13–K17 non generati) | kit incompleto | si parte da un **pilota**, la quota si misura in G-0 |
| Allegati falliti in silenzio (T-27) | prompt che non regge senza ref | il prompt **regge da solo**; gli allegati rafforzano, non sostituiscono |

Cosa ha funzionato e si riusa: l'anello K1 isolato con il vocabolario dei materiali (ha dato i due anelli che hai scelto); le riparazioni ancorate nella stessa chat (`roster-sheet-repair`, protocollo r002); il lettore di conteggi e passo (F2 del protocollo).

### 12.3 Principi
1. **Il mockup è la base, non uno stile.** Si fa *editing* di un'immagine, non generazione da descrizione.
2. **Zone strette a pieno formato.** L'anello a 1024 px di lato lungo fa disegnare a Gemini l'incisione a 500+ px: il dettaglio che il mockup non ha.
3. **Il difetto ha un numero e una frase.** «Cambia solo #3.» Mai due modifiche insieme.
4. **Simmetria per costruzione.** Dove l'oggetto è simmetrico si genera **una metà** (o un quarto) e lo script specchia. Gemini non ha mai il compito di «essere simmetrico».
5. **Conteggi dichiarati e verificati da script** (gemme, tacche, volute).
6. **Una chat per variante.** Le riparazioni restano nella chat della variante; la migliore, se serve, riparte in chat fresca.
7. **Prima i numeri, poi l'occhio; l'occhio decide** (ranking-1).
8. **Il vocabolario dei materiali si ripete alla lettera** dai prompt già riusciti (T-26): niente parafrasi.

### 12.4 Le fasi

**G-0. Sonda delle capacità** (prima di tutto, misurata, non supposta)
- Che modello usa l'interfaccia web di Gemini (nome, modalità di ragionamento), quanti riferimenti accetta davvero (prova con 1, 3, 5, 8), la **risoluzione reale** dell'output (scarico dell'originale invece della cattura da canvas, già avvenuta per K1 v2/v3), quante generazioni al giorno concede prima del blocco.
- Le fonti trovate sono di terze parti e non concordano (3 riferimenti per i modelli veloci, 14 per quelli Pro): per questo si misura.
- Uscita: `.mw/specs/hud-real/gemini-capabilities.md`.

**G-1. Registro dei difetti** (con il Director, per componente)
- Ritaglio del mockup con i punti **numerati**; io elenco i difetti che vedo, il Director **conferma, cancella o aggiunge** e segna ciò che invece è voluto.
- Categorie: **S** simmetria · **R** ripetizione (elementi che dovrebbero essere uguali) · **F** ornamento fuso o sciolto · **C** conteggio · **E** bordo ondulato o alone · **M** materiale incoerente (oro, smalto) · **D** deriva dal concept (non corrisponde) · **T** glifi simili a lettere · **X** elemento in più o in meno · **B** sfocatura.
- Uscita: `defects.json` (id, zona, categoria, frase di correzione) + immagine numerata. È il contratto di ogni riparazione.

**G-2. Zone e tavole base**
- Per ogni componente: mappa delle zone (esempio C1: anello, placca sinistra, punta, giunto banda, gemma di stato, emblema, ala, pendente).
- Per ogni zona:
  1. ritaglio dal mockup;
  2. SwinIR ×4 (fedele);
  3. testi e ritratti tolti con LaMa → **tavola base** a 1024 px sul lato lungo;
  4. **guida di geometria**: schizzo vettoriale esatto (centri, raggi, assi, passo) in linee chiare su fondo neutro, generato da script;
  5. dichiarazione: tipo di simmetria (specchio verticale, rotazionale n, nessuna), conteggi attesi, parti da non toccare.
- Uscita: `zone.yaml` + immagini.

**G-3. Prompt compilato**
- Lo genera uno script dallo `zone.yaml` e dal registro dei difetti: nessun testo libero.
- Blocchi: ruoli delle immagini (1 = tavola da preservare, 2 = guida di geometria, 3 = riferimento di materiale), elenco numerato dei difetti, conteggi, vincoli (fondo piatto blu notte `#0a1622`, vista frontale, niente testo, niente foglie o viola aggiunti).
- Parte con «Generate an image:» (T: il prompt che comincia con un'etichetta viene letto come testo), è su **una sola riga** (Enter invia), e **regge anche senza allegati** (T-27).
- Esempio (zona «anello del ritratto», da compilare, non da scrivere a mano):
  > Generate an image: Image 1 is the approved design of a circular portrait ring for a fantasy strategy game HUD: preserve its exact design, same proportions, same number and positions of gems, same motifs, same colours. Image 2 is an exact symmetric layout guide: follow its circle centres, radii and axes precisely. Image 3 is a material reference only (finish of the gold and the enamel), do not copy its shape. Redraw the ring from image 1 at high resolution with crisp engraved detail in matte painted antique gold and deep vitreous emerald enamel, light from the upper left, and fix ONLY these defects: 1) the left and right halves are mirror images; 2) the three emerald gems are identical in size, cut and setting; 3) the outer rim is a perfect circle with no wobble; 4) remove the thin arcs that cross outside the rim; 5) the engraving repeats with equal pitch. Keep everything else unchanged. The centre of the ring is empty, flat navy #0a1622, the same flat navy as the background. Front orthographic view, centred, ring diameter 80% of the image width. No text, no letters, no leaves added, no purple, no brown, no watermark.

**G-4. Generazione**
- 4 varianti, **ognuna in una chat nuova**, tab in background (CDP :9222, `Target.createTarget background:true`).
- Cattura all'indice dell'immagine **nuova** (T-25: contare prima e dopo l'invio; se non sale è un fallimento).
- Registrare: modello, risoluzione, URL della chat, hash. L'output grezzo è immutabile.

**G-5. Gate automatico** (`scripts/hud-real/hud-gen-gate.py`, scarta lui, non l'agente)
| Controllo | Misura | Soglia provvisoria |
|---|---|---|
| Deriva di design | SSIM sulle mappe dei bordi, tavola base contro variante | ≥ 0,80 |
| Sagoma | IoU della maschera, sfocata | ≥ 0,93 |
| Conteggi | componenti rilevate (gemme, tacche, volute) contro `zone.yaml` | uguali |
| Simmetria | differenza media tra immagine e specchio, sulla maschera | ≤ 6/255 (se dichiarata) |
| Ripetizione | varianza tra istanze che dovrebbero essere uguali | ≤ 4/255 |
| Materiale | tonalità delle creste d'oro; viola; marrone | 35–45°; 0; ≤ 3% |
| Nitidezza | varianza del Laplaciano contro la tavola base ×4 | ≥ 1,5× |
| Fondo | deviazione del fondo piatto | ≤ 3/255 |
| Glifi | piccole componenti allineate simili a lettere | nessuna |
Le soglie sono **provvisorie**: si tarano sul pilota (come F5 di r002). Finché non sono tarate valgono come avviso, e restano vincolanti l'elenco dei difetti e il confronto a vista.

**G-6. Riparazione** (protocollo r002)
- Per ogni difetto residuo, **una** modifica ancorata nella stessa chat: «Keep everything exactly the same and change ONLY defect #n: …». Massimo 3 modifiche per difetto.
- Poi chat fresca con la variante migliore come immagine 1, massimo 3 volte.
- Poi **debito di fedeltà** registrato (non si nasconde) e quel dettaglio passa a G-7 per costruzione.

**G-7. Costruzione finale** (script, niente occhio)
1. Scontorno per flood-fill dal fondo navy: è un fondo piatto, quindi niente BiRefNet; lo smalto interno resta opaco.
2. **Oggetti simmetrici:** si sceglie la metà migliore (gate o Director) e lo script la specchia.
3. **Elementi ripetuti:** si sceglie l'istanza migliore e si replica al passo misurato (righe del roster, tacche).
4. **Oro unico:** trasferimento di colore in Lab sulla sola maschera dell'oro verso il riferimento approvato (il roster C1).
5. **Montaggio** sulle zone misurate (centri e raggi calcolati sull'alpha, non a occhio).
6. Esportazione a ×2 e ×3.

**G-8. Gate del Director**
- Tavola affiancata: mockup con i difetti numerati cerchiati | risultato negli stessi punti. Per ogni #n: «corretto / non corretto / peggiorato».
- Un difetto non corretto torna a G-6 per quel solo difetto; un difetto nuovo si aggiunge al registro.

### 12.5 Pilota (decide il metodo prima di estenderlo)
- **Oggetto:** una riga del roster, 3 zone: **anello del ritratto**, **placca con punta**, **giunto con la banda**.
- **Perché queste:** hanno tutte e tre un dettaglio piccolo, una simmetria da imporre e una ripetizione (4 righe da rendere identiche); in più l'anello ha già un riferimento di qualità, K1.
- **Successo se:**
  - almeno 1 variante su 4 per zona supera il gate;
  - almeno il 90% dei difetti dichiarati è corretto;
  - l'anello a ≥ 500 px di diametro e, ridotto a 56 px, resta leggibile;
  - il Director approva a vista.
- **Budget:** al massimo 45 generazioni (una finestra); il runner si ferma da solo al banner del limite.
- **Gate di decisione dopo il pilota:** il Director sceglie tra (a) estendere il sottopiano a tutti i componenti, (b) passare all'illustratore per i soli motivi ornamentali (strada 2).

### 12.6 Budget e quota (misurati in G-0, vedi `.mw/specs/hud-real/gemini-capabilities.md`)
- Account gratuito: **modello Auto, non selezionabile** (Pro e «4 Argon» bloccati). Output **1024² (1:1) o 1408×768 (16:9)**, non di più. **10 allegati per messaggio.**
- **Due contatori:** una finestra (oggi bloccata dopo ~46 immagini; si azzera alle 18:01) e un **limite settimanale** (16% usato, si azzera il 7 novembre alle 20:01).
- Stima dell'intero sottopiano: ~300 generazioni, cioè **quasi l'intero tetto settimanale** (stima non verificata: 250–300). Con ~45 immagini per finestra servono 6–7 finestre.
- Quindi: **il pilota sta in una finestra** (≤ 45 generazioni, non 60), le zone si generano a 1:1 dove possibile, ogni generazione che non produce immagine («Image Generation Limit Reached») si registra come errore e non come tentativo, e il runner si ferma da solo al banner del limite.
- Decisione del Director da prendere dopo il pilota: continuare a spezzare il lavoro su più finestre e settimane, oppure valutare il piano a pagamento (il banner offre un uso doppio con AI Plus): non lo propongo come soluzione, solo come variabile di tempo.
- Ordine delle zone per valore: anello, placca, emblema, cornice del pannello, nav, risorse, angoli, sigillo, busti.

### 12.7 Strumenti da realizzare
| Strumento | Funzione |
|---|---|
| `scripts/hud-real/compile-prompt.py` | compila il prompt da `zone.yaml` + `defects.json`; controlla riga unica, vocabolario, assenza di parole vietate |
| estensione di `scripts/gen-mappa2-sprite.mjs` | scarico dell'originale, registro di modello e risoluzione, modalità modifica nella stessa chat (`--chat`) |
| `scripts/hud-real/hud-gen-gate.py` | gate automatico G-5 con scarto |
| `scripts/hud-real/assemble-zones.py` | G-7: scontorno, specchio, ripetizione, oro unico, montaggio |
| pagina `/hud-defects` | confronto mockup numerato / risultato per il gate G-8 |

### 12.8 Rischi
| Rischio | Mitigazione |
|---|---|
| Gemini ridisegna e cambia il design | tavola base come immagine 1; gate SSIM e IoU; «keep everything» nelle riparazioni; riferimento di geometria |
| Non rispetta la simmetria o i conteggi | non glielo si chiede: specchio e replica da script |
| Allegati ignorati o falliti in silenzio | il prompt regge da solo; si conta l'upload; sonda G-0 |
| Riferimento che insegna i suoi difetti (T-27) | si allega solo il materiale approvato (K1) e le tavole pulite, mai i mockup interi; controllo degli angoli per marchi e firme |
| Quota esaurita | pilota, misura in G-0, runner ripartibile |
| Deriva dell'oro tra zone | oro unico in Lab su un riferimento approvato (G-7) |
| Il pilota non supera il gate | decisione del Director: illustratore per i motivi (strada 2), senza perdere struttura, montaggio e componenti |

### 12.9 Ricerca (fonti di terze parti, da verificare con la sonda G-0)
- Editing con riferimenti: allegare prima l'immagine, poi il testo; nominare il ruolo di ogni immagine; dire cosa cambia e cosa resta ([Pixelbin](https://www.pixelbin.io/blog/nano-banana-prompt-guide); [Runway](https://help.runwayml.com/hc/en-us/articles/50317213804435-Creating-images-with-Nano-Banana)).
- Numero di riferimenti: fino a 3 per i modelli veloci, fino a 14 per i Pro, fonti non ufficiali ([LangChain4j](https://docs.langchain4j.dev/apidocs/dev/langchain4j/model/googleai/GoogleAiGeminiImageModel.html); [guida alle skill](https://cdn.jsdelivr.net/npm/claude-code-skills@0.5.0/data/skills/image-generation/reference/gemini-image.md)).
- Descrizioni narrative battono elenchi di parole chiave; l'elemento da modificare si nomina, senza maschere manuali (stesse fonti).
- Non ho trovato la guida ufficiale di Google con un modello di prompt per «cambia solo X»: la forma «keep everything, change only X» viene dalla nostra pratica r002 e va confermata dal pilota.


---

## 13. Emendamenti dal dibattito multi-AI web (2026-11-02)

Run `mind-weaver/.mw/runs/20261102-plan110-hud-real/` — CONVERGED su `artifact-r003` (sha `3c3154b5a4973b674838a072bf80c6e66594777d526b32c898460f0667204043`), ACCEPT 3/3 (claude, gemini, deepseek; chatgpt e grok esclusi `provider_dead`). 12 obiezioni registrate, tutte disposizionate. **Le regole sotto modificano gli stadi e il Sottopiano G; dove divergono dal testo sopra, valgono loro.**

### 13.0 Ruling del Director (2026-11-02)

- **R1 v0 approvato (F-12):** i crop approvati **non restaurati** si montano sulla mappa viva come gate di composizione/posizioni — **precondizione** all'apertura del pilota, non traccia parallela. Costo ~1h di scripting, 0 generazioni.
- **Fallback API a pagamento: NO.** Nessuna autorizzazione preventiva. Su blocco quota: runner in pausa, pilota «inconclusive», si riprende alla finestra successiva o su istruzione del Director.
- **Budget asset totale: nessun numero fisso.** Regole: stati derivati via filtri CSS/sprite atlas dove possibile; PNG solo se WebP fallisce il check di fedeltà; peso reale misurato e riportato a ogni gate di componente (i cap per-componente di §7 restano).

### 13.1 Precondizioni FATAL all'apertura del pilota

- **E-01 Split fidelity/repair (F-01):** `zone.yaml` dichiara per regione `preserve` (sagoma, proporzioni, palette, identità del motivo, conteggi) e `repair` (dettaglio anello, forma gemme, lunghezza placca, ondulazione bordo, metà specchio). Le metriche di drift misurano **solo** le regioni preserve; le metriche di qualità misurano le regioni repair contro la guida di geometria — **mai** contro il mockup grezzo.
- **E-02 Probe da 8 generazioni (F-02):** prima del pilota, su una zona: 4 con guida di geometria, 2 senza (diagnostico non contato), 2 slack. Fingerprint del modello loggato per generazione in `runs.jsonl`. **Stop: il pilota non apre se meno di 2 delle 4 varianti guidate passano i check Tier-A** (conteggi, IoU maschera). Deriva di modello tra pilota ed estensione riapre la probe.
- **E-03 Calibrazione G-5 (F-05):** prima del pilota, a costo zero: 1 positivo noto (crop sorgente upscalato) + 2 negativi noti (redraw vettoriale, restauro cattivo). Il gate deve accettare il positivo e scartare entrambi i negativi; altrimenti il pilota non apre.
- **E-04 Checkpoint G-frozen dopo C4 (F-04):** il Director rivede C1–C4 come insieme; o congela, o **una sola** passata di riparazione su C1, budgetata DENTRO la stima 300. C9 vale come seconda ri-vista (linguaggio degli ornamenti a scala busti).
- **E-05 S4.5 stress contract (F-03):** nuovo stadio tra S4 e S5 — `stress.yaml` per componente (stringhe en/it più lunghe, 0/1/N righe roster, valori estremi, viewport min/max) + test Playwright che fallisce su clip, sovrapposizione o ornamento stirato. Politica text-fit per slot CONTENT in `geometry.json`: max char, font min, ordine shrink→truncate, niente «…» sulle placche ornamentali (label più corte). Niente S7 senza stress test verde.

### 13.2 MAJOR

- **E-06 Oro (F-06/F-07):** il **gamut** dell'oro è definito dai crop approvati (range check, non sorgente); il **ramp vincolante** a 5 anchor (ombra profonda, ombra, medio, luce, speculare) si estrae dall'output C1 corretto **dopo** il suo gate → `gold_reference.json`; l'oro corretto di C1 deve stare nel gamut mockup (drift alarm altrimenti). Riapertura solo via E-04. Il test dell'oro è la zona gemma-giunto del pilota; C7 verifica, non scopre. Banda di tonalità solo sui pixel mid-tone (L 35–85); le ombre si governano con max spostamento di croma, non di hue. Soglie calibrate sui 3 crop approvati, non numeri tondi.
- **E-07 Specchio e luce (F-08):** niente re-light programmatico (serve normal map, viola la separazione frame/contenuto). Si specchiano solo silhouette a basso dettaglio luminoso; le superfici con luce incisa si clonano **lungo l'asse di luce** dall'istanza non specchiata; la continuità speculare si chiede nel prompt G-3. Micro-variazione 2–3% sulle ripetizioni solo se il Director le trova sterili al G-8.
- **E-08 Tempo del Director (F-09):** ≤15 min per gate; contact sheet unica per zona (tutte le varianti, numeri difetto sovrapposti, bottoni corretto/non corretto/peggiorato); registro difetti **auto-proposto** da script (mappa di simmetria, varianza di ripetizione) — il Director conferma, non scrive; checklist 3 punti per gate (oro, bordi, contratto dati).
- **E-09 Quota e blocco (F-10/F-26):** tabella dura probe 8 + first-pass 12 + repair 12 + slack 8 ≤ 40/finestra; `quota.json` per finestra; **cap riparazioni per zona** imposto dal contatore; componente = tutto-o-niente dentro una finestra; quota Gemini esclusiva PLAN-110 nei giorni pilota; blocco account = «inconclusive» (runner in pausa e chiede, fork rinviato, stima non decrementata). Ogni generazione loggata (hash prompt + zona + variante scelta) → resume alla finestra successiva senza rifare il first-pass.
- **E-10 Allegati (F-11):** la probe verifica conteggio e ruolo degli allegati; fallback = immagine composita unica (design+guida affiancate); generazione sequenziale verificata end-to-end prima di qualsiasi parallelismo in background.

### 13.3 MINOR

- **E-11** KEEP/REMOVE/CODE si decide a **S0**, non a S5 (F-13): le regioni REMOVE non entrano nelle zone G.
- **E-12** Invariante riformulato (F-14): modelli learned solo sotto vincolo verificato da script (MAD per S1; maschere solo-campitura per LaMa — scarto se l'inpaint tocca FRAME/ART); generazione di nuovo ornamento solo in G.
- **E-13** Focus = **outline DOM fuori dall'immagine** (F-15); contrasto non-testo ≥3:1 verificato in S7; overlay per stato consentiti (glow, desaturato+opacità) oltre al ±8% globale.
- **E-14** Classe `radial repeat` (passo angolare misurato) **definita** nel plan (F-16); implementata solo quando il primo anello passa il suo gate di zona — niente meccanismo generale prima del pilota.
- **E-15** Il verdetto del pilota è visuale su `/hud-defects` (F-17): affiancato per difetto, la scelta estendi/illustratore si prende da lì.
- **E-16** Metriche a **due tier** (F-18): Tier-A auto-reject oggettivo (conteggi errati, viola, glifi, fondo non piatto); Tier-B drift alarm (MAD/SSIM/IoU) → escalation al Director, non pass/fail. La calibrazione E-03 assegna il tier. Gate vincolanti restano verdetti sui difetti + occhio.
- **E-17** «Costruzione» definita (F-19): = S4–S7 sul miglior asset disponibile, difetto loggato come debito accettato e mostrato al gate di componente; niente ritorno silenzioso al redraw vettoriale senza decisione Director.
- **E-18** Check energia HF sullo smalto vs baseline bicubica, soglia **calibrata sui crop approvati** (F-20); S1 rinominato «×4 con drift misurato ≤3/255».
- **E-19** Manifest con hash per componente (source rect + gold ref + geometry.json); flag `stale` sui dipendenti al cambio di un hash a monte (F-22).
- **E-20** `stages_required` auto-proposto dallo script a S0 dal registro difetti (registro vuoto → niente S3/G); conferma del Director dentro il contact sheet di S0, non sign-off separato (F-23).
- **E-21** Check di consistenza sull'**assemblato intero** prima che il Director lo veda (F-27): pezzi da generazioni diverse possono differire in spessore tratto e profondità d'incisione.

### 13.4 Scartati

- Secondo account gratuito di riserva (evasione ToS — gemini ha concesso lo scarto).
- Claim «le riparazioni non contano nel 45» (errato: il budget è totale; il rischio strutturale è coperto da E-09).
- Soglia «0/6» della probe (rotta aritmeticamente: le 2 run senza guida non si contano — vedi E-02).
- Ramp oro campionato direttamente dai mockup o da C1 da solo (circolare in entrambe le direzioni — forma fusa in E-06).

### 13.5 Avanzamento R1 v0 (2026-11-02)

Fatto: `scripts/build-r1v0-crops.mjs` (crop non restaurati dai rettangoli §1 + posizioni misurate → `public/mockups/r1v0/r1v0.json`, regola di mapping per pezzo); `/hud-r1` ricaricata su r1v0.json con toggle fondo (mappa/mockup/vuoto), contorni, etichette. Witness headless WebGL 1600×900: `test-results/r1v0/{map,tagged}.png`. Osservazioni al gate: **collisione C10 voce ↔ C5 bussola** (entrambi bottom-left — da decidere); **C9-bust-sx e C8 marchio si affollano** nello stesso angolo; i crop non restaurati portano i loro rettangoli di fondo (atteso, è il v0). In attesa dell'occhio Director.

**Feedback Director su R1 v0 (2026-11-02):** (a) FIX applicato — il palco era letterboxato in alto a sinistra, i pezzi di destra cadevano a centro pagina: ora `fit: riempi` (scala x/y indipendente, edge-hugging come nei mockup) + toggle `uniforme`. Witness `test-results/r1v0/fill-1920.png`. (b) **C10 voce + C5 bussola sovrapposti: tenere così com'è** (ruling — stanno bene entrambi come si vedono). (c) C9-bust-sx ↔ C8 marchio affollati: **questione aperta, da pensare**.

**Feedback Director (2026-11-02, v2):** (a) **busto sx rimosso** (niente busto in alto a sinistra); (b) **C6 = il globo di `globe-voyage.png`** (nuovo mockup aggiunto alle sorgenti, rect [765,400,259,176], ancorato basso-dx allo slot cornerBR zanara-v1) — sostituisce board-breakdown; (c) PLAN-109 da inventariare per riuso (vedi sotto).

**Gate R1 v0 PASSATO (2026-11-02):** «va ben» del Director sulla composizione v2 (globo-voyage C6, no busto sx). Precondizione E/F-12 soddisfatta → si apre il tooling a zero generazioni (R-311: calibrazione G-5, quota runner, compile-prompt, /hud-defects).

**R-311 tooling CHIUSO (2026-11-02):** gate G-5 calibrato e verde (`scripts/hud-real/gate-calibration.json`), compile-prompt, quota-runner con resume, `/hud-defects`, schemi zone/defects del pilota. Precondizioni E-03 ed E-09/E-15 soddisfatte. Resta prima del pilota: **probe da 8 generazioni** (E-02) nella prima finestra quota — serve il momento Gemini del Director.

**Probe C1-ring CHIUSA (2026-11-03, run `plan110-probe-c1`):** pipeline automatizzata end-to-end funzionante (allegati verificati, generazione, harvest `scripts/hud-gen-fetch.py`, gate, ledger quota+resume). Guidate: **3/4 PASS Tier-A** (v2-gen5, v3-gen7, v4-gen7 — v1 REJECT per design colonna intera) → **stop rule superata, pilota apribile**. Diagnostica senza guida inconclusive (2 risposte vuote — sospetto rate-limit). Finding: purple eps da ricalibrare sull'anello vuoto; base per tier-B = crop di zona; ogni send produce 2 varianti. Prossimo: occhio Director sui 3 PASS (`/hud-defects` o i file in `.mw/specs/hud-real/probe/gen-results/`).

**Revisione della probe C1-ring (2026-11-03): verdetto «pilota apribile» NON VALIDO.**
- **I tre PASS erano schermate della pagina di Gemini**, non immagini generate: dentro ci sono «Chiedi a Gemini», «Gemini Auto», la nota sulla privacy, i pulsanti di download, e il compositore copre il fondo dell'anello. Il gate li ha promossi lo stesso (il rilevatore di testo è in Tier-B; `--expect-counts` non passato, quindi i conteggi non sono stati controllati).
- **`v3/gen-7.png` e `v4/gen-7.png` sono lo stesso file** (sha256 identico): la raccolta ha catturato due volte la stessa immagine; l'uscita vera della send v4 non è stata salvata.
- **Originali recuperati** senza invio e senza quota: `scripts/hud-real/harvest-originals.mjs` → `.mw/specs/hud-real/probe/originals/` (6 immagini a 1024², 1 a 768×1408 dalla chat `a43296edffe393b6`; le send del 2026-11-03 sono in un'altra chat non registrata in `runs.jsonl`). Foglio: `probe/originals/contact.png`. Lo script citato `scripts/hud-gen-fetch.py` non esiste nel repository.
- **Esito a vista sugli originali:** **resa di alto livello** (incisioni nitide, gemme pulite, oro coerente) ma **deriva di struttura**: Gemini aggiunge un grande anello esterno completo attorno all'anello del mockup. In 3 immagini su 5 riappare un frammento dell'anello della riga sotto.
- **Cause, negli input:** (1) il riferimento di materiale era l'anello K1 **intero** e Gemini l'ha incollato come anello esterno (T-27: il riferimento insegna anche la sua forma); (2) il ritaglio di design era di 140 px e conteneva la riga sotto; (3) la «guida» era un disco rosso su fondo blu, non una guida geometrica.
- **Correzioni prima di ripetere la probe (8 generazioni, E-02):**
  1. riferimento di materiale = **campione** (un tratto di fascia o un quadrato di smalto e oro), mai un oggetto intero; oppure nessun riferimento;
  2. design = zona **mascherata** e ingrandita (SwinIR ×4, vicini rimossi, come `gen-inputs/RO-01.png`);
  3. guida = cerchi, assi e posizioni delle gemme della zona, non una maschera;
  4. raccolta = **solo originali scaricati**, con controllo che le dimensioni siano native (1024², 1408×768, 768×1408) e **deduplica per hash** dentro la run;
  5. Tier-A aggiunge: dimensioni native, testo dell'interfaccia, conteggi della zona (`--expect-counts` obbligatorio).

**Probe C1-ring, seconda presa (2026-11-03, `.mw/specs/hud-real/probe2/`)**
- Input corretti: design = solo anello dalla sorgente intera con maschera geometrica (SwinIR ×4, 1024²); guida = anello eccentrico pulito più largo a sinistra, assi, 4 posizioni gemma; materiale = striscia dritta di oro e smalto da K1, senza forma né gemme. Prompt con «exactly one ring … nothing added around it». Allegato riparato in `scripts/gen-mappa2-sprite.mjs` (menu «+» → «Carica file» → selettore, verifica del chip).
- 6 invii (4 guidati, 2 senza guida), 6 originali scaricati a 1024², nessun doppione. Foglio: `probe2/contact.png`.
- **A vista: 6/6 un solo anello**, niente doppia cornice, niente frammenti della riga sotto. 5/6 hanno le 3 gemme della mezzaluna più quella in basso (u1 ne ha una in più). Più vicini al disegno del mockup (mezzaluna di smalto a sinistra, oro a destra): g2, g3, u2. g1 mette lo smalto su tutto il giro; g4 e u1 aggiungono un filo di smalto a destra.
- **Gate:** il nuovo contatore di gemme (`--gems`) conta come gemme anche i riflessi dello smalto e ha scartato tutti e 6 (letture 3–7 contro le 4 reali). **Declassato a Tier-B** finché non è tarato; restano Tier-A dimensioni native, interfaccia nell'immagine, viola, fondo.
- Guidati contro non guidati: nessuna differenza netta su 4+2 (u2 tra i migliori); la guida non è dimostrata necessaria.
- Prossimo: occhio del Director sul foglio; se il livello va, la zona successiva è la placca (RO-02) con la stessa ricetta.
- **Scelta del Director (2026-11-03): g4** (guidato) → `.mw/specs/hud-real/approved/C1-ring.png` (sha256 8d5de5438db42390…). È il riferimento di qualità e di oro per le zone successive del roster (E-06: il ramp dell'oro si estrae da qui dopo il gate di componente).

**Ruling del Director (2026-11-03): «non serve identico, si può fare più bello, più AAA; devono essere componenti veri».**
- Il mockup fissa il **concept** (parti, disposizione, proporzioni, materiali); la resa può superarlo: incisioni più fini, gemme più ricche, smalto più profondo. Non si aggiungono parti nuove.
- Conseguenze: le metriche di deriva rispetto al mockup (SSIM, IoU, MAD) restano solo allarmi per segnalare cambi di concept, mai motivi di scarto; i prompt delle zone successive chiedono esplicitamente una resa premium oltre il mockup (dall'emblema in poi).
- Il traguardo resta il componente React con dati veri (S4–S7): ogni zona approvata entra nel componente del roster appena le tre zone pilota (anello, placca, emblema) sono scelte.

**Zona placca (RO-02), 2026-11-03 (`.mw/specs/hud-real/plaque/`).** Input: placca della riga 0 con testo, barra e icona del castone tolti (LaMa a rettangoli + castone svuotato), guida con binari paralleli, punta e castone sull'asse; materiale = striscia ricavata dall'anello g4 approvato. 6 invii (4 guidati, 2 no), 6 originali, **6/6 Tier-A PASS**, tutti a pezzo unico con lato incavato, punta con perla e castone vuoto; cornice d'oro più spessa del mockup, coerente con g4. Righe di prova anello g4 + placca (asset costruiti con `scripts/hud-real/build-roster-assets.py`): `plaque/rows-preview.png`. In attesa della scelta del Director.
- **Scelta del Director: placca g4** → `.mw/specs/hud-real/approved/C1-plaque.png` (sha256 f23d73a68fd7d0db…). **Ruling di interazione:** la placca non è fissa: la colonna mostra solo gli anelli; la placca esce da dietro l'anello al passaggio del mouse (e con focus o selezione, per tastiera e touch).

**Componente C1 (2026-11-03): `src/ui/idleVillage/hudReal/HudRealRoster.tsx`.** Pezzi approvati (anello g4, placca g4) scontornati e misurati da `scripts/hud-real/build-roster-assets.py` → `public/assets/ui/hud-real/C1/{ring,plaque}.webp` (26 KB + 57 KB, 2×) e `c1Geometry.ts` generato (foro del ritratto, arco incavato della placca, campo smaltato). Colonna a soli anelli; la placca esce da dietro l'anello su hover, focus da tastiera o selezione (tap su touch), niente slide con reduced-motion. Dati reali (`useRosterKitData`), stati del residente (`zanaraRosterState`, test verde), scroll. L'area vuota della colonna lascia passare i clic alla mappa. Verificato headless 1600×900 DPR 2: opacità placche a riposo tutte 0, hover/focus/selezione aprono solo la riga giusta, scroll 180 px, nessun testo fuori dal campo, nessun nome troncato. Lab `/hud-real-roster`; montato anche in `/hud-compose`. Catture: `.mw/specs/hud-real/C1/component/`.

**Zona emblema (RO-04), stesso giorno:** 6 originali con prompt «premium», 6/6 Tier-A PASS, foglio `emblem/contact.png`. In attesa della scelta del Director.
- **Scelta del Director: emblema u2** → `.mw/specs/hud-real/approved/C1-emblem.png`, con riserva: «non è ancora a livello AAA». Passata di rifinitura AAA (`emblem/aaa/`): 2 modifiche ancorate nella chat di u2 + 2 chat fresche con u2 come immagine 1, prompt «stesso design, resa premium» (rilievo, filigrana, luce di bordo, occlusione, gemma rifratta, piume definite).
- **Esito rifinitura AAA (`emblem/aaa/contact.png`, `detail.png`):** e1 è **identico a u2** (stesso sha256: la modifica nella chat esistente ha catturato l'immagine vecchia — bug di cattura con `--chat`, da correggere con il controllo hash già usato nelle probe); e2, f1, f2 migliorano poco (gemma con riflessi, bordo più inciso in f1), il disegno resta lo stesso. Conclusione: con questo account (modello Auto, output 1024²) chiedere «più AAA» sullo stesso pezzo dà ritocchi, non un salto di livello.
- **Zone a pieno formato (emblema u2, `emblem/zones/`):** 6 zone generate (quadrante ×2, ala ×2, puntale ×2); il pendente non è partito: **finestra quota esaurita** alle 16:53. Gemini non rispetta l'inquadratura (allarga ala e puntale): registrazione SIFT + ECC aggiunta a `scripts/hud-real/compose-zones.py` (inlier 129–519). Ricomposti A/B in `composed-compare.png`: miglioramento **piccolo** (quadrante e puntale un po' più incisi); in B resta un riquadro visibile attorno all'ala. Il salto AAA non arriva nemmeno così con questo modello.
- **Simbolo del logo (richiesta del Director):** esiste già: **K5 v1**, il sole nascente del logo di caricamento in chiave verde e oro (`.mw/specs/hud-zanara/kit/approved/K5-emblema.png`, scelto il 2026-11-02). È nello stile del kit vecchio (più piatto di u2 e dell'anello g4): da rifare con la ricetta attuale (K5 v1 come design, u2/g4 come materiale, prompt premium) alla prossima finestra quota.
- **Colore (Director 2026-11-03: «oro non brillante come il mockup, verde non abbastanza profondo»):** grade per materiale in Lab in `build-roster-assets.py` (`GRADE`), applicato a ogni pezzo all'esportazione. Misure: oro da C p50 30 → 41–43 e L p90 80 → 85–88 (come la nav di zanara-v1: C 41, L p90 85); smalto da L p50 25 → ~15 con i riflessi conservati. Confronto `C1/component/grade-compare.png`.
- **Roster, prossimi pezzi:** banda di raccordo (segmento ripetibile, fermaglio con gemma tra un anello e l'altro, terminale con pendente) in generazione dalle 19:04 (`band/run.sh`); emblema u2 in cima; scorrimento per molti residenti.
- **Colonna completa (2026-11-03):** `HudRealRoster` ha ora emblema u2 in cima, banda di raccordo che passa sotto il bordo sinistro degli anelli con un fermaglio a gemma a ogni giunto, terminale con pendente, e scorrimento per qualsiasi numero di eroi (5 visibili, scatto per riga, rotella, frecce sulla banda che spariscono ai capi, ↑/↓ da tastiera tra gli anelli, bordo sfumato quando c'è altro). Verificato con 14 eroi: freccia giù +90, rotella fino in fondo, tastiera fino all'ultimo, nessun errore. Banda, fermaglio e terminale sono **segnaposto del PLAN-109** finché non arrivano i pezzi generati (`band/run.sh` dopo le 19:01). Catture: `C1/component/column-4up.png`, `col-band-fix.png`.
- **Cimiero del roster (Director 2026-11-03):** basta pseudo rose dei venti; soggetto «opulento, ricco, magico/stellare, magari un meccanismo». Due prompt in coda dopo la banda (`crest/run.sh`, 3+3): **orologio astronomico** gioiello (quadrante smaltato con costellazioni, lancette sole e luna, ingranaggi a vista, cassa alla Fabergé) e **planetario a ingranaggi** (orrery). Si evita la sfera armillare perché è già al centro della nav.
- **Banda e cimiero generati (Chrome Canary, quota libera, 2026-11-03 17:51–18:14):** 9 pezzi di banda (`band/contact.png`) e 6 cimieri (`crest/contact.png`, orologio astronomico ×3, planetario ×3), tutti a pezzo unico su fondo blu notte. Nuovo `scripts/hud-real/build-band-assets.py` (stesso scontorno e grade dei pezzi C1; banda ripetibile con dissolvenza della cucitura; fermaglio e terminale scalati sulla larghezza della banda; `c1BandGeometry.ts` generato). Montaggio di prova con banda 1, fermaglio 2, terminale 2, cimiero orologio 2: `C1/component/col-v2.png`. Fermagli ridotti a 46 px (a larghezza di banda erano alti 115 e coprivano gli anelli). Fix scontorno: lo smalto verde scuro simile al fondo non viene più cancellato. In attesa delle scelte del Director.
- **Scelte del Director:** banda 2; fermaglio 1 con la gemma del 2; terminale 2 con la gemma dell'1 (gemme trapiantate da script: pietra rilevata per colore, ridimensionata sul castone di destinazione e fusa con la sua maschera) → `.mw/specs/hud-real/approved/C1-{band,joint,end}.png`. **Cimiero: nessuno dei 6 approvato**, si cambia soggetto.
- **Riallineamento al mockup (Director: «non assomiglia al mockup che avevo scelto»):** confronto alla stessa scala `C1/component/mockup-vs-now.png`. Colonna ancorata alle misure di zanara-v2 (centri anelli x 83,1, prima riga y 262,2, passo 90, banda x 17–46): in sovrapposizione 50% gli anelli coincidono (`align-compare.png`). Generato il **modulo di riga** (banda + anello con la mezzaluna saldata alla banda, 4 varianti, `rowmod/contact.png`) e `scripts/hud-real/build-rowmod-assets.py` (anello saldato + banda ripetibile dalla stessa immagine); montato row-1 (`align-compare-rowmod.png`). Restano diversi dal mockup: banda più stretta (24 contro ~35 px con il filo esterno), manca l'arco d'oro che racchiude la colonna, il cimiero, e le placche che nel mockup sono sempre visibili (qui al passaggio del mouse, per ruling).
- **Confermato dal Director (2026-11-03): le placche restano al passaggio del mouse** (non sempre visibili come nel mockup). La differenza di peso visivo a riposo rispetto al mockup è voluta: va compensata da banda, arco e cimiero più ricchi, non da placche fisse.
- **Cimiero, secondo giro (Director: «identità deboli, voglio mistico, bello, d'impatto, opulento»; l'isola in un gioiello scartata: la mappa è già isole e mare):** sei schizzi mistici, uno ciascuno, fenice, calice, occhio, arcano (carta dei tarocchi, lega con i pilastri: le carte hanno peso narrativo), corona, drago: `crest2/contact.png`. In attesa della scelta.
- **C2 Risorse avviato (mentre il Director sceglie il cimiero):** crop da zanara-v3, alloggi svuotati, tre moduli (capo sinistro con gemma e pendente + primo alloggio, segmento ripetibile con due alloggi, capo destro) su fondo blu notte (`resources/design-{left,mid,right}.png`); 2 varianti per modulo in generazione (`resources/run.sh`). Il gioco ha 3 risorse, il mockup 5: il segmento si ripete tante volte quante servono. Nota tecnica: eseguire Python con `-I` dal root del progetto, la cartella `coverage/` oscura il modulo omonimo e rompe rembg.

### Cronaca autonoma 2026-11-03 sera
- C2 barra risorse: bar3-2 scelta, HudRealResources montato (tre chip, pericolo con clessidra). C3 nav: nav-3 scelta, HudRealNav con navItems reali, astrolabio = ricentra; verificato a DPR 2. Da fare: icone incise, 2 tondi esterni vuoti, hover.
- Prossimo: C4 pannello contestuale (alabastro + INIZIA).
- C4 pannello: panel-2 scelta, HudRealPanel generico montato in /hud-compose; script build-panel-assets.py (ripristina l'avorio dal grade). Composizione a 1600x900 con C1–C4 senza errori. Prossimo C5.
- Preparati i job di generazione di C5–C10 (bussola, globo, sigillo, marchio, busto, Voce): 3 varianti ciascuno.
- C5 (HudRealCompass) e C10 (HudRealVoce) fatti; quota Gemini esaurita 21:36Z, coda riprende dopo il reset.
- **Richiesta del Director (2026-11-03):** per gli altri componenti veri del gioco serviranno buoni layout e poi un nuovo linguaggio di creazione di skin con questi colori (cornici, ornamenti, ecc.). Registrato in LINGUAGGIO-v2 §10; da pianificare dopo l'esame finale come piano separato.
- C6 (HudRealGlobe) e C7 (HudRealSeal) fatti; C8/C9 in generazione.
- C8 (HudRealBrand) e C9 (HudRealBust) fatti: C1–C10 tutti montati in /hud-compose; segue l'esame finale.
- Esame finale parziale: REVIEW-REPORT.md. Insieme da ritoccare: colore pezzi C2–C8 fuori soglia, gerarchia di peso, stella ripetuta, icone nav. Nessun componente dichiarato verified.
- Correzione n.1 del rapporto (colore pezzi C2–C8) fatta con regrade-assets.py; rimisure nel rapporto.
- Prima/dopo contro /game: aggiunti C11 (tempo, da progettare) e C12 (comandi tondi, HudRealRoundButton fatto).
- C11 (HudRealTime) fatto: giorno + pausa + velocità, riuso asset pipeline.
