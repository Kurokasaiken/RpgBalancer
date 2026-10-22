# F7 — Vista Villaggio: cosa è stato chiesto (R-202) vs cosa c'è, e «i cerchi dappertutto»

Audit in sola lettura, 2026-10-20 (modalità explorer). Nessun codice, piano o RICHIESTE toccato. Catture: Chromium headless `--use-angle=metal`, vite proprio su :5198, 1440×900 e 1280×800, `shots/F7/`. Nessuna decisione è presa qui: le direzioni in (c) sono domande per il Director.

---

## (a) Chiesto vs fatto

### Cosa ha chiesto il Director (R-202, 2026-10-15)

La frase verbatim in RICHIESTE.md è: *«Sei lo strategist… Questa è una risposta di claude come critica al nostro plan, fa una ricerca online, esamina, valuta. Crea un nuovo plan»*. Il Director ha incollato il piano di Claude *«Villaggio con slot e sprite + nuovo linguaggio dei pin»* e ha chiesto di valutarlo e fare un nuovo plan. Quel piano proponeva:

- uno **slot per edificio** (1:1);
- **sprite WebP** degli edifici su uno **sfondo ripulito** dagli edifici dipinti;
- il **pin come etichetta di stato**, non più come l'edificio;
- fasi 0-6, 8-11 giorni.

Due giorni dopo (R-206, 2026-10-16) il Director scrive di sua iniziativa: *«quindi adesso dovrei prendere quell'immagine, farne una versione senza edifici… e poi fare edifici di vario tipo… e "appiccicargliele sopra" una alla volta?… usare quell'immagine come menu nn m fa impazzire, ho qualche dubbio»*. Questo suggerisce (è un'inferenza, non un fatto) che a quel punto ragionasse ancora su «versione senza edifici + sprite appiccicati», cioè sulla proposta originale.

### Cosa ha deciso lo strategist (PLAN-038, chiuso `fatta` il 2026-10-16)

Dalla «Valutazione» di R-202 e dal §2 di PLAN-038: la proposta è «architetturalmente sana» ma assume che `villaggio.png` sia uno sfondo pulito, mentre il dipinto **contiene già gli 11 edifici**. Gli sprite richiederebbero inpainting di ~11 edifici + 11 sprite AI coerenti, quindi il piano **tiene il dipinto come edificio** e ci aggiunge sopra overlay di stato.

| | Proposta (slot + sprite) | Implementato (PLAN-038, «paint-first») |
|---|---|---|
| Edificio | sprite WebP su sfondo ripulito | **il dipinto stesso** (nessuno sprite, nessun inpainting) |
| Slot | un lotto per edificio | `region` (bbox invisibile) → **ellisse a terra** derivata, 11 gruppi `g[data-region]` |
| Stato | pin-etichetta | pin con **cornice per categoria** (cerchio/stendardo/scudo) + **badge tondo** (numero romano, «+», lucchetto) + sull'edificio: ellisse tratteggiata (costruibile), vignetta + ellisse punteggiata (bloccato), bandierina (livello ≥ II) |
| Livelli | decorazioni sull'edificio | bandierine ottone a terra (4); fumo tagliato |
| Extra non chiesti | – | plaque «VILLAGE 6 of 16 built», legenda in basso, bottone **Registry** (PLAN-042) con cassetto da 16 righe |

Il piano successivo (PLAN-042, da R-206) ha aggiunto il **Registro** (cassetto HUD con catalogo che scala oltre gli 11 edifici dipinti). Lì il Director ha scritto «approvo» (frontmatter PLAN-042: *«baptized 2026-10-16 (Director «approvo»; artifact r005…)»*).

### Il Director ha approvato esplicitamente la deviazione?

**Non ho trovato nessun ruling citato.** Cosa c'è:

- R-202 registra la «Valutazione» come testo dello strategist; non c'è una riga «Director: approvo la variante paint-first».
- PLAN-038 non ha il campo `baptized/approvato`, a differenza di PLAN-042. La sua unica fonte di legittimazione è il dibattito multi-AI web (`mw-web-debate`, artifact-r003 sha d5342089, citato in `plans/INDEX.md`), non una risposta del Director. Il giudizio «sprite appiccicati = collage AI… bocciato già nel dibattito PLAN-038» (PLAN-042 §Perché) è del dibattito tra AI.
- `.mw/director-answers.jsonl` e `context/DECISION_LOG.md` non contengono voci su R-202/PLAN-038 (grep).
- Il PLAN-038 §5 lascia una «decisione rimandata … flag Director»: sul copy «buildable» su una casa già dipinta (contraddizione di finzione) e sugli sprite («valido solo se un giorno il villaggio diventa editabile»).

La lettura più prudente è che la deviazione sia stata una decisione dello strategist/del dibattito, comunicata al Director nell'esito, senza un suo sì esplicito. Non è provato che il Director l'abbia mai vista presentata come scelta.

---

## (b) I cerchi, uno per uno

Il Director vede soprattutto due famiglie: dischi neri (alcuni **vuoti**) e ellissi tratteggiate. Conteggio a 1440×900, stato a riposo.

### b1. Dischi neri vuoti — **BUG DI RENDERING, confermato** ⚠

- **Dove:** pin di categoria *production* (lumbermill, quarry, farm) e *defense* (palisade, watchtower, barracks): **6 pin su 11** non mostrano nessuna icona. Si vede un disco/scudo scuro col badge romano. Foto: `shots/F7/pins-sheet.png`, `village-rest-1440x900.png`.
- **Cosa dovrebbe essere:** `VillagePinFrame` (cornice) + `VillageBuildingIcon` (glifo 20 px, colore chiaro) dentro, in `VillageScreenView.tsx` ~riga 523-525.
- **Causa (verificata con esperimento runtime, nessuna modifica al sorgente):** la cornice SVG è `position:absolute` con riempimento **opaco** `--skin-hud-lacquer-base`; il glifo, dopo, è un SVG statico non posizionato. In CSS i discendenti posizionati si dipingono *sopra* i non posizionati, quindi la cornice **copre il glifo**. Misure: glifo 20×20 centrato sul frame 44×44, colore `rgba(237,224,196,.92)`, visibile, ma sotto. Sollevando il glifo a runtime (`position:relative; z-index:1`) le icone compaiono (taglialegna: tre cerchietti; palizzata: staccionata): `shots/F7/pins-glyph-lifted.png`.
- **Perché gli stendardi (civic) sembrano a posto:** il path `banner` di `FRAME_PATHS` è sostanzialmente un contorno a V senza area piena, quindi il glifo resta visibile — ma **senza campo scuro dietro**: sul tetto di paglia il glifo chiaro del Locanda/Fucina ha contrasto scarso (`pins-sheet.png`, riga 1 colonne 5-6).
- **Verdetto:** rotto, solo sui pin sul dipinto. Nel Registro (aperto con i gruppi espansi, secondo giro) le righe production (taglialegna, cava, fattoria) mostrano il glifo dentro il cerchio e sono leggibili: `shots/F7/village-registry-expanded-it-1440.png`. Il bug dei pin è confermato anche a 1920×1080 (`village-rest-en-1920.png`).
- Il PLAN-038 §7 documenta di aver già corretto un bug simile («disc opaco copriva il frame») ma non questo; il witness T-04 della chiusura non lo ha visto (le immagini a 1280×800 mostrano già dischi vuoti: `village-pinned-1280x800.png`).

### b2. Badge rotondo (numero romano / «+» / lucchetto) — 11 pin

- Codice: `<span>` 16 px, `borderRadius: 8`, lacquer + bordo ottone, in `VillageScreenView.tsx` ~riga 531-552 (`badgeTab(b)`).
- Significato: **I/II = livello** (solo costruiti), **«+» = costruibile**, **lucchetto = bloccato**.
- Rende correttamente; leggibile a 10 px. Ma è letteralmente un «cerchio con dentro un simbolo».

### b3. Cornice cerchio (roundel) = categoria *production*

- `FRAME_PATHS.roundel`: cerchio pieno 44 px. Significato: «produzione» (la forma sostituisce il nome della categoria).
- Qui è un cerchio *vuoto* (b1) per via del bug. Dopo il fix sarebbe un cerchio con dentro un simbolo.

### b4. Ellissi a terra — `VillageSlotOverlay.tsx`

| Elemento | Chi | Significato per il giocatore | Rende? |
|---|---|---|---|
| **Ellisse tratteggiata ottone** (dash 14/10) con underlay scuro | inn, smithy, watchtower (costruibili) | «qui puoi costruire»; copre anche pareti e tetti dei vicini perché derivata dal bbox (l'ellisse dell'Inn è larga ~375 px a 1440) | sì, ma grande e senza testo: si legge come «cerchio» attorno all'edificio già dipinto |
| **Vignetta scura + ellisse punteggiata** (dash 4/10, opacità .55) | infirmary, barracks (bloccati) | «non ancora disponibile» | sì, molto tenue |
| **Ellisse glow nascosta** (opacità 0, una per edificio, 11) | tutti | si accende all'hover/focus del pin (`:has()`) | non visibile a riposo; all'hover appare un anello sottile attorno alla regione (`village-hover-1440x900.png`) |
| **Bandierine** | farm, lumbermill, warehouse, palisade (≥ II) | «livello II» sul terreno | sì (sono bandierine, non cerchi) |

Il conteggio «cerchi» a schermo a riposo, ellissi e dischi compresi: 11 badge + 11 cornici (di cui 3 cerchi pieni) + 3 ellissi tratteggiate + 2 ellissi punteggiate con vignetta + legenda (cerchio «Production», cerchio «locked», cerchio «can be built», cerchio «level built»).

### b5. Cerchi nella legenda e nel Registro

- Legenda in basso: cerchio vuoto «Production» + quattro piccoli dischi (livello, «+», lucchetto). Rende correttamente.
- Registro: righe con cornice a 30 px + disco-badge + icone di stato a destra (casa, rombo): la cornice civic rende bene; il rombo azzurro e il badge sono «dischetti di stato» da UI kit.

### Contro regola 6b

HUD guide §6b (Director 2026-10-13): *«Niente pallini, anelli, dischetti di stato… Vale per cursori, badge, indicatori e icone: se è un cerchio con dentro un simbolo, rifallo.»*

- **Violazioni letterali:** badge tondo con simbolo (b2), cornice roundel con glifo (b3), legenda (b5). Il disco col numero romano è proprio il caso «cerchio con dentro un simbolo».
- **Anelli:** le ellissi tratteggiate sono «anelli» a terra, anche se non sono UI kit in senso stretto: sono più un'idea di «anello da geometra» (PLAN-038 §3) che non una sagoma di oggetto.
- Il PLAN-038 non cita 6b: il badge tondo con numero è una scelta del piano, non un'eccezione approvata.

---

## (c) Direzioni per il Director (nessuna scelta presa)

1. **Tornare a «slot + sprite» come nella proposta originale?** Costo: ripulire l'immagine dagli edifici e produrre sprite AI coerenti per ~11 edifici (rischio di collage visivo segnalato dal piano stesso; nel R-206 lei ha già dubbi su «appiccicare» sprite). Vantaggio: il villaggio diventa davvero editabile, i pin potrebbero sparire a favore dello stato visibile sull'edificio. Domanda: preferisce un villaggio *editabile* (sprite, lotti vuoti) o *dipinto fisso* come oggi?
2. **Semplificare i pin e rispettare 6b?** Es.: togliere il disco-badge, mostrare livello/stato con una sagoma di oggetto (bandierina, lucchetto di ferro, ponteggio) invece di cerchi con simboli; oppure una sola forma di pin per tutti, con la categoria detta altrove (registro). Domanda: quanta informazione vuole *sul dipinto* a riposo (solo icona? icona + livello?), e quanta nel tooltip o nel registro?
3. **Togliere le ellissi?** Lo stato «costruibile/bloccato» potrebbe stare solo sul pin (e nel registro) lasciando il dipinto pulito, oppure l'ellisse potrebbe essere sostituita da qualcosa che sul dipinto già si vede (ponteggio, bandierina). Domanda: l'ellisse tratteggiata a terra le serve, o è «rumore» sopra l'immagine?

Indipendente dalla scelta: i 6 pin senza icona sono un difetto di rendering e non una scelta di design (b1); aggiungere un fondo scuro dietro il glifo degli stendardi risolve il contrasto scarso sul tetto.

Altro da segnalare al Director: il plaque dice «6 of 16 built» ma sul dipinto ci sono 11 pin; i 5 edifici in più vivono solo nel Registro (PLAN-042). Il conteggio in alto non corrisponde a quello che si vede sul dipinto.

---

## (d) Cosa NON ho verificato

- Non ho letto le conversazioni originali (chat del 2026-10-15/16) né gli artifact del dibattito: «nessun ruling esplicito trovato» è limitato a RICHIESTE.md, i piani, `director-answers.jsonl`, `DECISION_LOG.md`, `CURRENT_STATE.md`. Un sì a voce nella chat non sarebbe visibile qui.
- Italiano: la cattura con `locale: it-IT` ha mostrato comunque l'interfaccia in inglese (la lingua dell'app non segue il locale del browser), quindi l'IT **non è verificato**. 1920×1080 catturato solo a riposo.
- Scheda dettaglio del Registro e righe defense non aperte (le production sì).
- Non ho misurato i pin sulla mappa dell'altra superficie (R-202 riguardava solo la vista Villaggio).
- Esperimento «glifo sollevato» fatto solo nel DOM a runtime: prova la causa, non è un fix testato (nessun test, nessuna modifica sorgente, nessun controllo a 1280).
- Il rendering WebGL della mappa sotto la vista è irrilevante per questa pagina; screenshot singoli, nessuna sequenza di frame: le animazioni (pop-in, respiro ellissi) non sono verificate.
- La pagina è catturata con orologio di gioco reale: «Day 4/5/6» cambia tra le catture, non rilevante.
- Stato dei pin: costruito/costruibile/bloccato è quello di mock data (`initialState`), non uno stato reale di gioco.

File di supporto: `shots/F7/` (screenshot `village-{rest,hover,pinned,registry}-{1440x900,1280x800}.png`, `pin-*.png`, `pins-sheet.png`, `pins-glyph-lifted.png`, `pins-*.json`).
