# LAYOUT-SPEC — pianta B1 (PLAN-112 F1) — **G1 FIRMATO il 2026-11-05 · amend #1 (toast) · amend #2 (modello di scala del gioco)**
> 2026-11-05. Fonte unica: `src/ui/idleVillage/hudReal/layout/hudLayoutB.ts`. Pagina: `/hud-layout` (sagome sulla mappa viva, viste `?view=overview|context|narrative`, `?step=1|1.25|1.5`, `?guides=0`, `?map=0`). Test permanente: `tests/unit/idleVillage/hudLayoutContract.test.ts` (36 verifiche su 7 finestre, controllato per mutazione: rompendo l'allineamento del pannello 7 test diventano rossi).

## Regole
- **[SUPERATO dall'amend #2: vedi in fondo]** Tela di riferimento **1440×720** (D6, rivista il 2026-11-05 con D10b: era 1440×810), scalata con la finestra (`scala = min(w/1440, h/720) × passo`) e **estesa alla finestra reale**: gli ancoraggi a destra/in basso stanno sul bordo vero.
- Griglia 8 px; margine unico **24 px** su ogni bordo; **barra alta = un modulo** (tempo e risorse: stessa altezza 56, stessa linea centrale y = 52, stesso margine alto del roster).
- Colonna destra e riga bassa su un margine solo: risorse, pannello e comandi finiscono a `W − 24`; nav, comandi e Voce finiscono a `H − 24`.

## Contratto (px sulla tela)
| Componente | Modo | Liv. | Ancora | l×a | Viste |
|---|---|---|---|---|---|
| Eroi (roster) | fisso | 1 | alto-sx, 24/24 | 88×432 (medaglioni 72, passo 80; placca 200×64 al passaggio, fuori ingombro) | tutte |
| Tempo | fisso | 2 | alto-centro, y 24 | 420×56 | tutte |
| Risorse | fisso | 2 | alto-dx, 24/24 | 360×56 | tutte |
| Pannello | a evento | 1 | dx, 24, y 96 | **340×520** (amend G1 #3; era 340×470 e prima 300×470; il gioco riserva già 340 all'ala destra, `stageZones.rightWing`; contiene la riga sigillo/probabilità) | contestuale |
| Nav | fisso | 2 | basso-centro, 24 | 460×88 (etichette incluse) | tutte |
| Comandi | fisso | 3 | basso-dx, 24/24 | 132×40 | tutte |
| Voce | temporaneo | 1 | basso-sx, 24/24 | 360×96 | narrativa |
| **Esiti (toast)** *(amend G1 #1, 2026-11-05)* | temporaneo | 2 | basso-sx, 24 / **sopra la Voce** (+8) | 320×72 | narrativa |
Fuori dalla pianta (decisioni D2/D3/D4): emblema/marchio, bussola, globo, busto; il sigillo vive nel pannello.

## Misure (riquadri DOM, T-101b cifra 1; la cifra a pixel si fa con l'arte vera)
| Finestra | Tela | Scala | Fissi | In vista (contestuale / narrativa) | Testo 16 → px reali |
|---|---|---|---|---|---|
| 1440×810 | 1440×810 | 1,00 | 10,9% | 23,0% / 13,9% | 16,0 |
| 1280×800 | 1440×900 | 0,89 | 9,8% | — / 12,5% | 14,2 |
| 2400×1000 | 1944×810 | 1,23 | 8,1% | — / 10,3% | 19,8 |
Tetto 18% per i fissi: ampiamente sotto sui riquadri. **Attenzione:** l'arte aggiunge sporgenze (ornamenti, ombre) che i riquadri non vedono; nel prototipo R2 la differenza tra riquadri e pixel era ~+9 punti. Stima prudente con l'arte: fissi ≈ 14–17%. Va rimisurata a pixel in F5.

## Trovato dalla pianta (da decidere)
1. **[RISOLTO 2026-11-05, riflusso approvato — vedi «Regole di riflusso»]** La «dimensione interfaccia» 125/150% non entrava a 1440×810: con il passo 125 la tela scende a 1152 di larghezza, sotto il minimo di 1220 per tenere roster, tempo e risorse sulla stessa riga. I passi sono quindi abilitati solo su finestre più larghe (a 2400×1000 sì, a 1440×810 e 1280×800 no). Servono: (a) riflusso della barra alta sotto una soglia (tempo sopra le risorse, o un solo modulo), oppure (b) limitare l'impostazione. Decisione D6b.
2. **Il pannello da 470 px è alto:** a 1440×810 in vista contestuale la vista pesa 23%; resta sotto un terzo, ma copre il lato destro. Da verificare con il contenuto reale (14 eroi, testo lungo).
3. **Roster 432 px per 5 righe:** con più di 5 eroi scorre; la placca al passaggio è fuori ingombro ma può sovrapporsi alla mappa (accettato).

## Non fatto in F1 (ancora aperto per G1)
- **Card visual-fork delle varianti di B** (il Director ha scelto B su sagome; la card formale con 2–3 varianti di B non è stata generata).
- Fit check delle famiglie di pannelli (HUD-INVENTORY §3): la variante più larga in-scope non è stata provata nello slot 300×470.
- Vista mobile (390×844, D10: fallback `base`) e 3440 (il test copre 3440×1440 sul contratto, non a occhio).
- **Firma G1 del Director: non data.**

## Regole di riflusso (D6b, approvate dal Director il 2026-11-05)
- **Barra alta:** sotto 1220 px di tela il tempo scende **sotto le risorse**, stesso bordo destro; il pannello scende con lui.
- **Riga bassa:** sotto 1260 px di tela la Voce sta **sopra la nav**, non accanto.
- **Altezze adattive:** roster e pannello si accorciano allo spazio rimasto (il roster mostra meno righe, il pannello scorre); minimi: roster 176, pannello 360, altrimenti il passo non è offerto.
- Il contratto dichiara **quali passi di interfaccia entrano** per finestra (`allowedSteps`, test permanente: 67 verifiche):
  | Finestra | Passi offerti |
  |---|---|
  | 1280×800, 1366×768, 1440×900, 1920×1080, 2560×1440 | 100% e 125% |
  | 2400×1000, 3440×1440 | 100%, 125% e 150% |
- **Limite noto:** il 150% non entra sulle finestre 16:9 fino a 2560×1440 per **altezza**, non per larghezza (tela di 540 px: il pannello scenderebbe sotto 360). Chi ne ha bisogno lì avrebbe un pannello a scorrimento; decisione D6c, aperta.
- A 125% su 1440×810: fissi 16,2% (sui riquadri), testo 16 → 20 px reali.

## D6c — il 150% con pannello a scorrimento (scelto dal Director il 2026-11-05)
- Il pannello può accorciarsi fino a **240 px** (invece di 360) e **scorre il contenuto**; titolo, qualche riga di testo e azione restano visibili. In più il pannello finisce sopra la nav quando le due si toccano in larghezza (a 960 px di tela).
- Con questo il **150% entra su tutte le finestre canoniche** (1280×800 … 3440×1440): `allowedSteps` = 100/125/150 ovunque; test permanente a 68 verifiche.
- **Costo di ingombro (riquadri, fissi):** 100% 10,9% · 125% 16,2% · 150% 20,2–21,4% (17,6% su ultrawide). **Confermato dal Director il 2026-11-05:** budget 18% a 100/125%, **24% al 150%** come eccezione di accessibilità dichiarata (con gli ornamenti ≈ +3–6 punti: resta sotto un terzo). Il test usa già questa soglia.
- Da verificare in F5: il pannello a scorrimento con contenuto lungo (barra di scorrimento nello stile della HUD, fine sfumata, tastiera), e il roster con 3–4 righe a 150%.

## Fit check delle famiglie di pannelli (F1, 2026-11-05)
Metodo: le dimensioni minime e naturali di ogni pannello vengono da `gameFrameConfig.ts` (`panels.*`, `questWindow`); `fitPanel()` in `hudLayoutB.ts` calcola dove cade ciascuno nella pianta a ogni finestra e passo. Test permanente: `tests/unit/idleVillage/hudLayoutFit.test.ts` (nessun pannello senza posto a 100/125/150% su 1280×800, 1440×810, 1920×1080, 2560×1440).
| Famiglia | Pannello | Min l×a | Naturale l×a | Zona oggi | Dove cade nella pianta |
|---|---|---|---|---|---|
| editorial | eventi (ledger) | 280×160 | 300×320 | ala dx | slot 340: **naturale** (scorre a 150%) |
| editorial | scheda eroe | 280×200 | 380×400 | ala dx | slot 340: **compresso** (min 280 ok) |
| table | mercante | 320×240 | 360×420 | ala dx | slot 340: **compresso** (min 320 ok; con lo slot a 300 NON entrava) |
| table | scorta del villaggio | 236×200 | 320×360 | **ala sx** | si sposta nello slot dx: naturale/scorre |
| quest | dettaglio spedizione | 460×300 | 680×520 | centro | centro: naturale a 100%, compresso a 125%, scorre a 150% |
| quest | finestra di spedizione | 640×400 | 820×600 | centro | idem; a 125/150% **sostituisce il pannello laterale** |
Estesi in F2 (non provati qui): `QuestRewardPopup` 400 largo, `QuestOutcomeToast` 320, `QuestSkillCheckColumn` 340/420, dispatch, memoriale, impostazioni.

### Trovato dal fit check
1. **Slot del pannello 300 → 340:** corretto nel contratto (test ancora verdi, 88+3).
2. **Un solo slot contestuale a destra** (e prima c'erano un'ala sinistra e una destra): scorta, mercante, scheda eroe ed eventi non possono stare aperti insieme. Serve una regola di esclusione/priorità (matrice E-15) in F2. Oggi il gioco li apre in zone diverse.
3. **La finestra di spedizione in centro a 125/150%** non sta accanto al pannello laterale: lo sostituisce (nel gioco ha già `runPolicy: suspend`). Da dichiarare come regola.
4. **`QuestOutcomeToast` ancorato in alto a destra (24/24, 320 largo) collide con la barra delle risorse** nella pianta: va riancorato (sotto il pannello o in basso a sinistra con la Voce).
5. **Limite onesto di questo controllo:** si basa sulle dimensioni dichiarate in configurazione, **non su un rendering dei pannelli veri dentro lo slot**. Che un pannello «compresso» a 340 px regga davvero (testi, tabelle, bottoni) è da verificare quando i pannelli reali verranno montati (F4/F6).

## Prova del pannello a scorrimento con contenuto lungo (F1, 2026-11-05)
Sonda in `/hud-layout?view=context&probe=1&content=long` (sagoma piatta: titolo fisso, corpo che scorre, azione fissa; contenuto di 14 paragrafi, ~800 px di altezza propria). Misure headless:
| Finestra | Pannello (px reali) | Titolo e azione dentro | Corpo visibile | Scorre | Tastiera |
|---|---|---|---|---|---|
| 1440×810 @100% | 470 (tela) | sì | 379 px di tela (~18 righe) | sì | Tab entra nell'area; Giù/PagGiù scorrono |
| 1920×1080 @150% | 252 (tela) = 504 reali | sì | **161 px di tela = 322 reali = ~7,7 righe** | sì | idem (scorre di 180) |
| 1280×800 @150% | 312 (tela) | sì | 221 px di tela (~10,5 righe) | sì | idem |
Esiti: (1) struttura corretta a tutti i passi: titolo e azione (91 px di tela insieme) restano visibili, l'area centrale è focalizzabile con la tastiera e scorre; la sfumatura ai bordi compare solo dove c'è altro; nessun errore in console. (2) Al minimo (150% su 1080p) il corpo mostra **~7,7 righe da 21 px** (161 px di tela, 322 reali): sufficiente per una descrizione di 5–6 righe senza scorrere. (3) Da fare nell'arte vera: barra di scorrimento nello stile della HUD (oggi nativa sottile oro), contrasto del focus, test con lettore di schermo.
**Correzione (2026-11-05):** la prima versione di questa tabella e delle decisioni dichiarava «~4 righe» al minimo: era un errore di misura mio (confrontavo l'altezza del pannello in pixel reali con quella del corpo in pixel di tela). Ricalcolato nella stessa unità: 7,7 righe. **D6d chiusa: nessun intervento sulla nav.** Il minimo del pannello (240) resta.

## Vista mobile e finestre piccole (F1, 2026-11-05; D10)
- **Sotto 768 px di larghezza la pianta NON si applica:** il gioco tiene l'HUD `base` con il suo mobile-fit (PLAN-083). Il contratto non copia la soglia: usa `isMobileFitViewport` di `mobileFitConfig.ts` (`blueprintMode`, test `hudLayoutMobile.test.ts`). A 390×844 la tela scalerebbe a 0,27 (testo 16 → 4,3 px): non è una vista da pianta, è da mobile-fit.
- **Trovato: tra 768 px e ~1260 px, e sulle finestre basse, la pianta c'è ma il testo è piccolo.** Il testo corrente (16 sulla tela) raggiunge 14 px reali solo con scala ≥ 0,875 (`readable`):
  | Finestra | Scala | 16 → px reali | Leggibile |
  |---|---|---|---|
  | 768×1024 (tablet verticale) | 0,53 | 8,5 | no |
  | 1024×768 | 0,71 | 11,4 | no |
  | 1180×820 | 0,82 | 13,1 | no |
  | 1280×800 | 0,89 | 14,2 | sì |
  | **1366×650 / 1280×650 (laptop con barre del browser)** | **0,80** | **12,8** | **no** |
  | 1366×700 / 1440×700 | 0,86 | 13,8 | quasi |
  | 1536×730 | 0,90 | 14,4 | sì |
  | 1440×810 e oltre | ≥ 1,00 | ≥ 16 | sì |
  La causa è l'altezza: la tela di riferimento 1440×810 ha un rapporto 16:9 e su finestre più basse scala per l'altezza. È un problema vero per i laptop, dove la finestra utile è spesso 1366×650-700.
- **Decisione D10b, aperta:** (a) accettare 12–14 px reali su finestre basse, con il 125% come rimedio dell'utente; (b) fallback `base` anche sotto la scala 0,875; (c) tela di riferimento più bassa (es. 1440×720: scala più alta sulle finestre basse, ma i fissi pesano il ~13% invece del ~11%, e al 125% il budget del 18% si stringe); (d) nessuna scala sotto 0,875: la tela si estende in larghezza senza ridursi ancora (più aria ai lati, nessun testo sotto 14).

## D10b risolta: tela di riferimento 1440×720 (scelta del Director, 2026-11-05)
La tela scende da 1440×810 a **1440×720** (2:1): su finestre basse la scala sale e il testo corrente (16) resta ≥ 14 px reali. Misure sul contratto (riquadri dei fissi a 100/125/150%, testo 16 → px reali, passi offerti):
| Finestra | Scala | 16 → reali | Fissi 100 / 125 / 150% | Passi |
|---|---|---|---|---|
| 1280×650 | 0,89 | 14,2 | 12,1 / 17,1 / 22,7 | 100, 125 |
| 1366×700 | 0,95 | 15,2 | 12,0 / 17,0 / 22,6 | 100, 125 |
| 1280×720 | 0,89 | 14,2 | 10,9 / 16,2 / 21,4 | 100, 125, 150 |
| 1440×720 | 1,00 | 16,0 | 12,3 / 17,2 / 23,0 | 100, 125 |
| 1440×810 | 1,00 | 16,0 | 10,9 / 16,2 / 21,4 | 100, 125, 150 |
| 1920×1080 | 1,33 | 21,3 | 10,9 / 16,2 / 21,4 | 100, 125, 150 |
| 2400×1000 | 1,39 | 22,2 | 10,2 / 15,8 / 19,1 | 100, 125 |
**Costi dichiarati:**
1. I fissi pesano di più sulle finestre basse: **12,3% a 100%** (prima 10,9%) e **17,2% a 125%**, a 0,8 punti dal tetto del 18%. Sui riquadri; con gli ornamenti la misura a pixel del 125% potrebbe **superare il 18%**: da misurare in F5, e se serve il 125% passa all'eccezione del 24% come il 150%.
2. Il **150% non è più offerto sulle finestre basse** (1280×650, 1366×700, 1440×720) né su 2400×1000: la tela scende a 480 di altezza e il pannello non starebbe sopra il minimo. Resta su 1280×720, 1280×800, 1440×810, 1920×1080, 2560×1440.
3. Gli ancoraggi verticali vengono ricalcolati (roster 432 e pannello 470 su 720: nessun conflitto nei test).
Fuori dal conto: sotto 768 px resta il fallback `base` (D10); tablet 768–1180 continua a non essere leggibile (scala < 0,875).

## Amend G1 #1 (2026-11-05): slot `toast`
Aggiunto lo slot «Esiti» sopra la Voce (320×72). Il tetto del roster è il bordo alto della pila Voce + esito. A 100% il roster resta a 5 righe; a 125/150% sulle finestre basse scende a 3/2 righe. Passi offerti invariati. Impronta nuova del contratto: `31b7bdaeda9c32b6`. Dettagli in `plans/PLAN-112` §13.

## A5 — il modello di scala del gioco contro la tela proporzionale (aperto, 2026-11-05)
**Fatto verificato (`hudScale.ts`, PLAN-058/PLAN-043):** la HUD di produzione è in **pixel CSS 1:1**, finestra di riferimento 1920×1080; lo zoom (`hud_scale_v1`) va da 1 a 2, modi `auto`/1/1,25/1,5/2; `auto` vale 1 fino a Full HD e poi sale a passi di 0,05; nell'app desktop lo zoom è nativo; nel browser è CSS `zoom` sul layer «chrome». **Non scende mai sotto 1.**
**Pianta firmata:** tela proporzionale 1440×720 (scala = min(w/1440, h/720) × passo): sulle finestre piccole **rimpicciolisce** (0,89 a 1280×800) e il testo scende sotto i 16 px.
**Misure del contratto firmato nel modello del gioco (pixel CSS, zoom ≥ 1; fissi sui riquadri, righe del roster):**
| Finestra | zoom 1 | zoom 1,25 | zoom 1,5 | zoom 2 |
|---|---|---|---|---|
| 1280×650 | ok, 15,1% | NO | NO | NO |
| 1280×720 | ok, 13,8% | ok, **18,2%** | NO | NO |
| 1366×700 | ok, 13,3% | ok, 17,3% | NO | NO |
| 1366×768 | ok, 12,1% | ok, 16,5% | NO | NO |
| 1440×810 | ok, 10,9% | ok, 15,2% | ok, 20,1% | NO |
| 1920×1080 | ok, 6,1% | ok, 9,6% | ok, 13,8% | ok, 20,1% |
| 2560×1440 | ok, 3,5% | ok, 5,4% | ok, 7,8% | ok, 13,8% |
(«NO» = il contratto non entra: sovrapposizioni o altezza insufficiente; il riflusso non basta.)
**Cosa implica:**
- Nel modello del gioco il **testo è sempre 16 px reali** a zoom 1 (nessun problema D10b) e i pannelli di produzione (che già vivono in pixel CSS) **si integrano senza conversioni**.
- I fissi pesano **di più** sulle finestre piccole (15,1% a 1280×650, ancora sotto il 18%), ma a **zoom 1,25 il 18% si supera su 1280×720** e il passo non entra a 1280×650.
- Sulle finestre grandi (≥ 1920) il modello del gioco dà **meno ingombro** della tela proporzionale (6,1% contro 10,9%).
**Opzioni (decisione A5, del Director; non decisa qui):**
- **A5-a — adottare il modello del gioco (consigliata dal planner):** la pianta lavora in pixel CSS con lo zoom `hudScale` esistente (auto/1/1,25/1,5/2); la tela di riferimento e la «dimensione interfaccia» propria del contratto spariscono (D6/D6b/D10b e l'eccezione 24% si riscrivono: lo zoom è quello del gioco). Costo: amend G1 #2, nuovo test di contratto sui modi `hudScale`; il 125% su finestre basse può non entrare (si dichiara).
- **A5-b — tenere la tela proporzionale firmata:** il modello resta quello firmato; in F6 serve un ponte con `hudScale` (due zoom sovrapposti) e i pannelli di produzione vanno convertiti. Costo: complessità di integrazione, testo sempre < 16 px sulle finestre piccole.
- **A5-c — ibrida:** tela proporzionale solo **sopra** Full HD (dove il gioco già scala) e pixel CSS 1:1 sotto. È in pratica il modello `auto` del gioco ed è la più vicina a ciò che i giocatori hanno già.

## Amend G1 #2 (2026-11-05): modello di scala del gioco (A5-a)
- **Layout in pixel CSS 1:1; unica scala = lo zoom HUD del gioco** (`hudScale.ts`: 1..2, auto/1/1,25/1,5/2, mai sotto 1). Canvas = finestra / zoom; ancoraggi a destra e in basso sul bordo vero. Le sezioni «Regole», «Misure», «D10b» e le tabelle a tela proporzionale sopra sono **superate** (restano per storia).
- Budget fissi **18%** (24% da zoom 1,5), **applicato da `fits`**: uno zoom che lo supera non è offerto.
- Zoom offerti (riquadri dei fissi, righe roster a zoom 1): 1180×820 e 1280×650 e 1280×720 → solo 1; 1366×768 → 1, 1,25; 1440×810 → 1, 1,25, 1,5; ≥ 1920×1080 → 1, 1,25, 1,5, 2.
- Testo ≥ 16 px reali a zoom 1 su ogni finestra ≥ 768 px; sotto 768 px, HUD `base` con mobile-fit (D10 invariata).
- Dettagli, impronta e backup: `plans/PLAN-112` §15.

## Amend G1 #3 (2026-11-05): pannello 340×520
Lo slot del pannello sale a **340×520** per la cornice pf-3 (512,7 px). Passi di zoom offerti invariati; a 1280×650 il pannello scorre (474 s). Impronta nuova: vedi `plans/PLAN-112` §22.

## Amend G1 #4 — approvato 2026-11-05
Vedi PLAN-112 §29. Aggiunge: slot cimiero sopra la colonna roster; slot contestuale secondo per il pannello aperto del roster (da `/game`). Valori di partenza dal mockup `/hud-roster-mockup` (cimiero 156 px, pannello 620 px); da validare nel contratto `hudLayoutB.ts` con test di fit.
