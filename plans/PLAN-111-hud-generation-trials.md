# PLAN-111: HUD, prove ed errori fino a trovare il metodo di generazione

**Status:** proposta, da approvare (Director)
**Parent:** PLAN-110 (§12 descrive la catena di produzione; questo piano **scopre la ricetta** che la catena userà).
**Strumenti già pronti:** `.mw/specs/hud-real/generation-catalog.md` (24 elementi con prompt A e B), `gen-inputs/` (22 ritagli ingranditi e verificati a vista), `trials.md` (registro), `gemini-capabilities.md` (limiti misurati).

---

## 1. Obiettivo e criterio di arrivo

Trovare per via sperimentale **la ricetta** con cui Gemini produce, per un elemento del mockup, un'immagine che sia **lo stesso disegno senza i difetti** (simmetria, ripetizioni, ornamenti fusi, bordi ondulati, deriva dal concept).

**Ricetta trovata (arrivo)** quando, su **tre elementi diversi** (anello, placca, emblema):
- almeno **2 varianti su 4** ottengono ≥ 13/18 nella griglia di voto (§3) e **nessun criterio a 0**;
- la ricetta è scritta in un documento (`recipe-v1.md`) che un altro agente può eseguire senza di noi;
- il Director, guardando le varianti **alla cieca** (senza sapere quale condizione le ha prodotte), sceglie quelle della ricetta.

**Non trovata** dopo il round R5 → si ferma tutto e si decide (§7): illustratore per i soli motivi, oppure modalità A più composizione da script.

---

## 2. Regole delle prove (valgono per chiunque generi, a mano o con agenti)

1. **Una variabile alla volta.** Ogni round cambia un solo fattore, tutto il resto resta identico.
2. **Stesso prompt, chat nuove.** Ogni variante in una chat nuova. Il prompt è copiato, mai riscritto o parafrasato (T-26).
3. **Almeno 3–4 varianti per condizione**, perché una sola immagine dimostra poco: Gemini cambia a ogni invio.
4. **Tutto registrato in `trials.md`**: elemento, modalità, allegati, URL della chat, sei voti e una nota. Un tentativo senza immagine («Image Generation Limit Reached») **non conta** e si annota a parte.
5. **Voto alla cieca quando si può:** si rinominano i file con un numero casuale e si vota prima di sapere la condizione. Lo script `tools/hud-real/blind-sheet.py` (da scrivere) fa il foglio.
6. **Quota:** mai più di **40 immagini per finestra** (restano 5 di margine). Prima di cominciare si legge il banner «Il limite verrà reimpostato alle…». Il runner automatico si ferma da solo; a mano si smette al banner.
7. **Un solo consumatore alla volta.** Oggi gira ancora un lanciatore degli agenti del PLAN-109 (`kit-gen-all`): va fermato prima di cominciare, altrimenti consuma la finestra per un kit sospeso.
8. **Ogni round finisce con una decisione scritta**: quale condizione vince, cosa si fissa, cosa si cambia nel round dopo.

---

## 3. Griglia di voto (0–3 per criterio)

| Criterio | 3 | 0 |
|---|---|---|
| **Fedeltà** al disegno del mockup (stesse forme, motivi, conteggi) | uguale | disegno diverso |
| **Simmetria** (dove deve esserci) | indistinguibile dallo specchio | evidente |
| **Difetti dichiarati corretti** (dalla lista del prompt) | tutti | nessuno |
| **Nitidezza** a 1:1 e a dimensione di schermo | incisione leggibile | sfocato |
| **Materiale** (oro, smalto, luce da sinistra in alto) | coerente | piatto o incoerente |
| **Pulizia** (niente testo, glifi, elementi in più, viola, marrone) | pulito | invaso |

Soglie: **pass ≥ 13/18, nessun criterio a 0.** Misure di supporto (non sostituiscono l'occhio): differenza con lo specchio, varianza del Laplaciano, tonalità delle creste d'oro (35–45°), SSIM sui bordi con la tavola base.

---

## 4. I fattori da provare

| ID | Fattore | Livelli |
|---|---|---|
| F1 | **Origine** | A: descrizione, nessun allegato · B: modifica del ritaglio del mockup |
| F2 | **Qualità del ritaglio allegato** | grezzo (ingrandito Lanczos) · SwinIR ×4 · SwinIR con zona vuota riempita di navy |
| F3 | **Forma dell'istruzione** | rigenera con elenco generico · elenco di difetti specifici · «descrivi i difetti che vedi, poi rigenera» (due passaggi) |
| F4 | **Quanti riferimenti** | 1 (ritaglio) · 2 (+ materiale K1) · 3 (+ guida di geometria) |
| F5 | **Strumento** | chat con «Generate an image:» · strumento «Crea immagine» del menu «+» |
| F6 | **Simmetria** | si chiede l'oggetto intero · si chiede **una metà** e si specchia da script |
| F7 | **Inquadratura** | zona stretta · riga intera · componente intero · formato 1:1 contro 16:9 |
| F8 | **Iterazione** | una sola generazione · riparazione «cambia solo #n» nella stessa chat (1, 2, 3 giri) · chat fresca con la migliore come immagine 1 |
| F9 | **Livello di ragionamento** | predefinito · altro, se il menu lo offre sull'account gratuito |
| F10 | **Lunghezza e ordine del prompt** | corto · lungo · ruoli delle immagini prima o dopo |

---

## 5. La scala dei round

| Round | Domanda | Condizioni (n per condizione) | Elementi | Immagini | Regola di decisione |
|---|---|---|---|---|---|
| **R0** | Il punto di partenza: da descrizione o da modifica? | F1: A contro B (4+4) | RO-01 | 8 | Vince chi ha la media più alta. Se A ≥ B, il mockup non aiuta e si cambia strategia (vedi §7) |
| **R1** | Conta la qualità del ritaglio allegato? | F2: grezzo / SwinIR / SwinIR+navy (3×3) | RO-01 | 9 | Si fissa il migliore |
| **R2** | Conta come si scrivono i difetti? | F3: generico / specifici / due passaggi (3×3) | RO-01 | 9 | Si fissa la forma migliore |
| **R3** | La simmetria si ottiene da Gemini o da script? | F6: intero / una metà (3+3) | RO-01 | 6 | Se la metà batte l'intero, la simmetria si costruisce sempre da script |
| **R4** | Quanti riferimenti e quale strumento? | F4: 1 / 2 / 3 (3×3); poi F5: «Crea immagine» (3) | RO-01 | 12 | Si fissano riferimenti e strumento |
| **R5** | Quanto aiuta riparare? | F8: 1, 2, 3 giri di «cambia solo #n» sulla migliore dei round precedenti; confronto con chat fresca (2 candidate × 3) | RO-01 | 6 | Si fissa il numero massimo di giri |
| **R6** | La ricetta regge su altre zone? | ricetta contro la baseline A (4+4) | RO-02 placca, RO-04 emblema | 16 | Se vince su entrambe → ricetta v1 |
| **R7** | Regge su un pezzo intero? | F7: zona contro riga intera (3+3) | RO-05 | 6 | Si decide la dimensione standard delle zone |
| **R8** | Congelamento | — | — | 0 | Si scrive `recipe-v1.md` |

Totale: **~72 immagini**, cioè due finestre; più 10–15 di riserva per ripetere prove andate male. Con la mia stima non verificata di 250–300 immagini a settimana, è circa un quarto del tetto.

**Ordine pratico:** R0 e R1 nella stessa finestra (17 immagini), poi R2–R4 (30), poi R5–R7 (28).

---

## 6. Cosa generare a mano, e quando

Il catalogo ha **24 elementi**. Puoi generare in qualsiasi momento quelli che ti servono, senza aspettare i round:

- **Modalità A (da descrizione) non dipende dai round:** è il metodo di K1 e dà sempre materiale utile, sia come fallback sia come riferimento di materiale. Va bene generare a mano **tutti** i 24 elementi in modalità A.
- **Modalità B** si usa dentro i round, perché è proprio il fattore che si sta provando.

**Ondate consigliate:**
1. **Per decidere il metodo:** RO-01 (anello), RO-02 (placca), RO-04 (emblema), poi RO-05 (riga).
2. **Il resto del roster:** RO-03, RO-06.
3. **Barre:** RS-01, RS-02, NV-01, NV-02, NV-03.
4. **Pannello e pulsante:** PN-01, PN-02, PN-03.
5. **Angoli, sigillo, marchio:** AN-01, AN-02 (verificare cosa intendi), SG-01, MR-01.
6. **Voce e busti:** BU-01, BU-02, VO-01, VO-02, VO-03, e GM-01 (gemme).

Salvataggio: `gen-results/<ID>/<A|B>-<n>.png`. Mi basta che li lasci lì: scontorno, misure e confronto li faccio io.

---

## 7. Cosa succede secondo i risultati (albero delle decisioni)

- **R0: A ≥ B.** Il mockup come base non migliora: si lavora in modalità A (descrizione) e il mockup serve solo come guida di composizione e per i conteggi. Si salta R1 e si prova R2–R4 solo in A.
- **R0: B > A.** Si prosegue sulla strada del piano (editing del mockup).
- **R3: la metà batte l'intero.** La simmetria non la chiediamo più a Gemini: ogni oggetto simmetrico si genera a metà e si specchia da script (PLAN-110 §12, G-7).
- **Nitidezza insufficiente in tutte le condizioni** (< 2 di media). Il limite è la risoluzione (1024 px): si lavora a zone più strette e si accetta il lavoro in più; oppure si valuta di spendere per un piano che offra più risoluzione, decisione tua.
- **Nessuna condizione arriva a pass dopo R5.** Si ferma. Opzioni: (a) illustratore per i soli motivi (anello, angolo, gemma, filigrana), con struttura e montaggio fatti da noi; (b) modalità A più composizione da script, accettando meno fedeltà ai mockup; (c) rivedere il livello di dettaglio dei mockup scelti.
- **Quota esaurita a metà di un round.** Il round riprende nella finestra dopo; i voti già dati restano validi, perché ogni condizione ha le sue varianti.

---

## 8. Chi fa cosa

| Chi | Fa |
|---|---|
| **Director** | genera a mano (o dà il via agli agenti), vota alla cieca, decide a ogni round, risponde alle decisioni pendenti (D-5, AN-02, ala singola o doppia, narratore della Voce) |
| **Io** | preparo ritagli e prompt, compilo e mantengo `trials.md`, scrivo il foglio cieco, calcolo le misure di supporto, scrivo la ricetta, poi scontorno, specchio e monto |
| **Agenti** | generano gli elementi del catalogo in modalità A con il runner, rispettando §2 (una finestra alla volta, fermi al banner) |

---

## 9. Dopo la ricetta

1. Catena di produzione di PLAN-110 §12 (G-5 gate, G-6 riparazione, G-7 costruzione da script, G-8 gate del Director), con la ricetta come G-3/G-4.
2. Dai pezzi ai componenti veri (PLAN-110 R2): scomposizione in fette, stati derivati, mappa del contenuto, componenti React con dati reali.

---

## 10. Il resto del lavoro, oltre alla generazione (cosa potresti non avere in mente)

1. **Stati e movimento.** Ogni componente deve avere normale, hover, premuto, focus, disabilitato e attivo, derivati dalla stessa immagine; e le animazioni dichiarate (ago della bussola, gemme, sigillo) con `prefers-reduced-motion`.
2. **Il resto della UI.** Il catalogo del gioco ha **45 componenti**; i 12 scelti sono solo la cornice principale. Mercante, magazzino, scheda eroe, impostazioni, carica partita, tooltip, toast, finestra delle quest, epilogo, schermata del titolo e caricamento devono ereditare lo stesso linguaggio. Va deciso quali ricevono la pelle zanara per la demo.
3. **Preset e sicurezza.** Preset `zanara` selezionabile accanto a `base`, ritorno a `base`, test di parità tra i due preset, baseline degli screenshot a 1280, 1440, 1920, 3440 e in modalità mobile.
4. **Prestazioni.** Memoria delle texture, peso degli asset (WebP/AVIF, ×2 e ×3) e il budget del 18% misurato davvero sulla superficie occupata.
5. **Aspetti legali e di pubblicazione.** Il gioco punta a Steam (premium, demo e Next Fest). Steam richiede di dichiarare nella pagina del gioco l'uso di contenuti generati con AI, e le immagini generate possono avere una protezione di diritto d'autore limitata; vanno inoltre verificati i termini d'uso di Gemini per l'uso commerciale con un account gratuito. Sono cose generali che conosco, non verificate sulle regole di oggi: da controllare **prima** di investire sulla generazione, perché possono cambiare la strategia.
6. **Dati che i mockup mostrano e il gioco non ha.** Coordinate X/Y (D-5), 5 risorse invece di 3, 7 voci di nav invece di 4, il forziere dell'angolo destro (AN-02).
7. **Tipografia.** I font dei mockup contro Cinzel e EB Garamond usati dal gioco: da campionare e confrontare.
8. **Pulizia di oggi.** Niente è stato committato in tutta la sessione: pagine di prova (`/hud-compose`, `/hud-roster-crop`, `/hud-target`, `/hud-zanara-roster`, `/hud-r1`), componenti prototipo (`ZanaraRoster`, `ZanaraResources`, `ZanaraTooltip`), asset sospesi del PLAN-109, ambiente Python in `tools/hud-real/`. Va deciso cosa tenere come laboratorio e cosa eliminare, e fare un commit ordinato.
9. **Documenti.** `LINGUAGGIO-v1.md`, la guida `hud_component_guide.md` e i ruling si contraddicono (G0 ha sospeso Z-1, Z-2, CTA, Z-4): vanno riallineati quando la direzione è definitiva.
10. **Chiusura tecnica.** Lint, `build:check`, test, `closure:lint`, e la verifica che i fissi non coprano la terra a 1440×900 e 1280×800 (trappola T-01).
