# Linguaggio HUD Wanderlust: v2 (Smeraldo e Oro)

> Stato: **in costruzione**, 2026-11-03. Sostituisce `hud-zanara/LINGUAGGIO-v1.md` (v1 nata da regole teoriche e dal kit generico, bocciata dal Director).
> Questa versione nasce dai **pezzi reali approvati** e dalle misure fatte su di essi. Le sezioni marcate ⏳ le completa l'esame finale (`REVIEW.md`).
> Scopo (Director): un linguaggio a sé, da cui costruire **tutti gli altri componenti** del gioco, non solo quelli del mockup.

## 1. Idea
Una HUD di **gioielleria fantastica**: oro antico dipinto e smalto smeraldo profondo, gemme che rifrangono, incisione fine, luce da sinistra in alto. Opulenta e mistica, mai fredda né da "UI kit". L'ornamento non decora: **costruisce** gli oggetti (anelli, placche, bande, capi, cimieri). Il contenuto (testo, numeri, ritratti, barre) è sempre vivo, in codice, dentro alloggi vuoti.

## 2. Materiali (misurati sui pezzi approvati, dopo il grade)
| Materiale | Come appare | Misura (Lab) |
|---|---|---|
| **Oro antico dipinto** | caldo, luminoso, mai cromato, incisione fine, bordo di luce a sinistra in alto | L p50 55–58, L p90 85–88, C p50 41–43 |
| **Smalto smeraldo** | vetroso, profondo, con bagliore interno lieve; riflessi tenuti | L p50 15–19, C p50 22–26 |
| **Gemma smeraldo** | sfaccettata, rifrazione, riflesso puntiforme; accesa/spenta per stato | più luminosa dello smalto, C alto |
| **Vetro scuro** (alloggi) | quasi nero-verde, bordo d'oro sottile | L < 12 |
| **Alabastro** ⏳ | avorio caldo, venatura lieve | da misurare con C4 |
Regola del colore: **un solo oro e un solo smalto per tutta la HUD**. Si impone con `GRADE` in `scripts/hud-real/build-roster-assets.py` a ogni esportazione. Ombre sempre teal profondo, mai grigie o marroni. Mai viola nella UI.

## 3. Vocabolario delle forme
| Forma | Cos'è | Dove vive | Stato |
|---|---|---|---|
| **Anello** | cerchio d'oro con mezzaluna di smalto e gemme; ospita un soggetto (ritratto) | roster | ✅ g4 + modulo di riga |
| **Placca** | lastra smaltata a chevron con lato incavato che si infila dietro l'anello; ospita nome e barre | roster | ✅ g4 |
| **Banda** | fascia verticale di smalto con binari d'oro; lega i moduli | roster | ✅ |
| **Fermaglio** | gemma in castone d'oro sul punto di giunzione | banda | ✅ |
| **Capo** | chiusura di una barra, con gemma e pendente | barre, banda | ✅ terminale; ⏳ barra risorse |
| **Segmento ripetibile** | binari + alloggi vuoti, si ripete senza cucitura | barre (risorse, nav) | ⏳ |
| **Cimiero** | oggetto-simbolo in cima a un componente | colonna, pannelli | ⏳ vedi libreria |
| **Medaglione** | disco con un simbolo o uno strumento | bussola, sigillo | ⏳ |
| **Cornice** | alabastro in oro | pannelli | ⏳ |
| **Roundel** | disco d'oro con un comando inciso | dock | ⏳ |
Libreria dei motivi (cimieri e simboli, con significato e usi): `/hud-library`, sorgente `library/library.src.json`.

## 4. Regole di costruzione
1. **Moduli, non immagini intere.** Ogni componente è fatto di capi + segmento ripetibile (+ eventuale cimiero). Si stira solo il piatto: **un ornamento non si deforma mai**.
2. **Alloggi vuoti** (vetro scuro con filetto d'oro): contengono contenuto vivo. Mai testo, numeri o icone di stato dentro l'immagine.
3. **Sovrapposizione che lega**: la mezzaluna dell'anello si salda alla banda; la placca esce da dietro l'anello. I pezzi si compenetrano, non si affiancano.
4. **Geometria misurata, non stimata**: ogni punto di montaggio (foro, arco, campo) si ricava dall'alpha e si scrive in un modulo TypeScript generato (`c1Geometry.ts`, `c1BandGeometry.ts`, `c1RowModGeometry.ts`).
5. **Stati derivati dalla stessa immagine**: hover = luminosità, focus = contorno **fuori** dall'immagine, disattivo = desaturato, attivo = oro più chiaro + gemma accesa. Gli stati non sono disegni separati.
6. **Rivelazione**: le informazioni secondarie escono dal componente (placca al passaggio del mouse) invece di stare sempre a schermo; a riposo restano i soli simboli. Tastiera e touch aprono come il mouse.
7. **Scorrimento** a righe intere; frecce d'oro sulla banda, che spariscono ai capi; bordo sfumato dove c'è altro.
8. **Movimento sobrio**: solo gli ornamenti funzionali (gemme, luce); `prefers-reduced-motion` sempre rispettato.

## 5. Tipografia e colore del testo
Nomi e titoli: Cinzel. Frasi: EB Garamond. Avorio `#f1e8cc` (primario), verde chiaro `#b9d2c4` (secondario), ambra `#f0c987` (eccezione), ferro freddo `#93a4ad` (caduto), oro di focus `#e8c766`. Minimo 12 px, numeri a larghezza fissa. Ombra del testo teal `rgba(3,26,30,.9)`.

## 6. Come si produce un pezzo (ricetta provata)
1. **Disegno di partenza**: ritaglio dal mockup scelto, SwinIR ×4 (il più fedele), contenuto svuotato, fondo blu notte `#0a1622`, vicini rimossi.
2. **Riferimenti**: solo il disegno (immagine 1) e una **striscia di materiale** dall'anello approvato (immagine 2). Mai un oggetto intero come materiale: Gemini lo copia come forma.
3. **Prompt** su una riga che inizia con «Generate an image:»: ruolo del pezzo → «Image 1 è il disegno approvato, preserva struttura e proporzioni» → «Image 2 è solo il materiale» → resa premium (rilievo profondo, incisione nitida, luce di bordo da sinistra in alto, occlusione morbida, smalto a strati, gemme rifratte) → vincoli di vuoto (alloggi vuoti, niente testo/numeri) → fondo piatto, vista frontale, niente viola/marrone.
4. **Generazione** con `scripts/hud-real/gen-queue.mjs` (Chrome Canary, tab in background, chat nuova per ogni immagine, solo originali scaricati, dedupe per hash). 2–4 varianti per modulo.
5. **Gate** (`hud-gen-gate.py`): dimensioni native, niente interfaccia nell'immagine, viola, fondo piatto. Il resto sono allarmi.
6. **Asset** (`build-*-assets.py`): scontorno dal fondo blu notte con smalto scuro protetto; grade oro/verde; geometria; WebP lossless 2×.
7. **Componente** con i dati reali, e verifica con catture a DPR 2 e confronto col mockup.
Trappole note: il riferimento insegna la sua forma; le catture di schermo contengono l'interfaccia; lo scontorno può mangiare lo smalto scuro; `coverage/` oscura un modulo Python (usare `-I`); la modifica nella stessa chat può restituire l'immagine vecchia.

## 7. Come si costruisce un componente nuovo
1. A quale **famiglia di forme** appartiene (barra, colonna, pannello, medaglione)? Esiste già un modulo?
2. Quali **pezzi mancano**? Si cercano nella libreria prima di generarne.
3. Disegno di partenza e moduli (§6); l'ingombro a schermo parte dalla scala del mockup di riferimento.
4. **Contratto dati**: lo stesso del componente di produzione che sostituisce; nessuna meccanica nuova.
5. Contenuto negli alloggi, stati derivati, tastiera, i18n, test sulla logica pura.
6. Verifica a DPR 2 su 3 zone di mappa; consegna con lo stato in `queue.json`.

## 8. Token da promuovere a variabili CSS (preset `zanara`)
`--hud-gold-*` (ramp a 5 ancore dall'oro di C1 dopo il suo gate), `--hud-enamel-*`, `--hud-glass`, `--hud-text-primary/secondary/exception/fallen`, `--hud-focus`, `--hud-shadow-teal`, `--hud-slide-ms`, `--hud-pitch` ⏳ (oggi sono costanti in `HudRealRoster.tsx`).

## 9. Da compilare dopo l'esame finale ⏳
- Alabastro, roundel, medaglione, cornice: misure e regole.
- Ramp dell'oro a 5 ancore e soglie di coerenza tra pezzi.
- Elenco dei difetti ricorrenti e delle correzioni standard.
- Regole di ingombro e di peso visivo a riposo (la colonna è più leggera del mockup per scelta).

## 10. Fase 2: dal mockup ai componenti veri del gioco (richiesta del Director, 2026-11-03)
Dopo i componenti del mockup, il linguaggio deve diventare un **sistema di creazione di skin** per tutti gli altri componenti reali del gioco (finestre, schede, liste, pannelli, tooltip, modali, bottoni). Si procede in due tempi:
1. **Studio dei layout**: per ogni famiglia di componenti reali (inventario in `.mw/ui-catalog` e `surface-map.json`) si studia un buon layout prima di vestirlo, partendo dai dati e dalle azioni che il componente ha già (meccanica invariata).
2. **Linguaggio di skin**: una libreria di parti componibili con i colori di §2 (oro, smalto smeraldo, vetro scuro, alabastro):
   - **Cornici**: bordo oro con angoli e centri (nove fette o capi + segmento), in più taglie.
   - **Ornamenti**: cimieri, fermagli, gemme, pendenti, filigrane d'angolo, dalla libreria `/hud-library`.
   - **Campi**: smeraldo, alabastro, vetro scuro, con margini misurati.
   - **Controlli**: bottone/placca, tondo, barra, scheda, con stati derivati dalla stessa immagine.
   - **Token**: ramp oro/smalto, tipografia, ombre, tempi (§8), per preset di skin.
Obiettivo: far nascere un componente nuovo componendo cornice + campo + ornamenti + contenuto, senza generare un'immagine intera ogni volta. Punto di partenza: quanto si può ricavare da C1–C10 (es. HudRealPanel è già una cornice con campo, finestra e azione).
Stato: ⏳ da pianificare dopo l'esame finale (REVIEW.md); candidato a PLAN dedicato.

## 11. Dall'esame (2026-11-04, parziale: vedi REVIEW-REPORT.md)
- **Soglie di coerenza misurate** (Lab, p50): oro C 41–43 (±4), smalto L 15–19 e C 22–26. I pezzi C2–C8 sono fuori tolleranza (smalto L 6–10, C 10–17; oro C 33–37): ogni nuovo pezzo si misura prima dell'approvazione e si ricalibra con `GRADE`.
- **Trappole di produzione nuove:** il grade oro macchia l'alabastro (si ripristina l'avorio nel campo); lo scontorno e la misura dei campi per soglia scura fondono i tondi con il vetro vicino (usare apertura morfologica e `--square`); il campo misurato per erosione è più stretto della placca reale (allargare di 2–6 px verticali, 20–40 px orizzontali); `/app` di Gemini può mostrare un interstiziale che blocca l'allegato.
- **Regola di gerarchia (da confermare):** a riposo solo risorse, nav e roster; marchio, bussola e ornamenti sono quiete; Voce, sigillo e pannello compaiono per evento.
- **Regola del motivo:** un simbolo (la stella a quattro punte) vale una funzione (orientamento: astrolabio e bussola); gli altri componenti usano altri simboli dalla libreria.
- **Ancora da completare ⏳:** ramp dell'oro a 5 ancore, alabastro misurato (L p50 ~78, C ~18), difetti ricorrenti dopo la ricalibrazione.
- **Regola di contenuto vivo (dall'esame, stress):** ogni campo di testo ha una politica di overflow dichiarata: titoli = riduzione del corpo fino a 12 px poi puntini; testi = limite di righe con puntini; numeri = forma compatta oltre il limite dell'alloggio (99.999 → 1,2M) con il valore intero nel tooltip. Mai testo tagliato a metà riga o sovrapposto agli ornamenti. Pagina di prova: `/hud-compose?stress`.
- **Smalto unico (correzione del 2026-11-04):** il bersaglio dello smalto non è "smeraldo giallo-verde" ma verde-acqua profondo: Lab tinta ≈188°, L p50 ≈21, C ≈18 (mockup: tinta 170–230°, L 16–36). Si impone con `unify-enamel.py` come ultimo passo di ogni pezzo; gemme ed edera restano fuori dalla correzione. Le misure di coerenza vanno fatte su **tinta e luminosità**, non solo su cromia.
