# F1c — Lettura visiva dello skill check (Opus, 2026-10-20)

Materiale letto: `shots/skillcheck-f1b/` (1440×900 e `1280x800/`), ritagli ingranditi ×2/×4 e contact sheet in `shots/skillcheck-f1b/f1c-crops/`. Le differenze tra frame sono misurate in pixel con PIL, non a occhio.

Legenda: **FATTO** = visto e/o misurato · **FLAG** = giudizio di gusto, decide il Director · **NON VERIFICATO** = detto esplicitamente.

## 1. Le tue segnalazioni, una per una

| # | Segnalazione | Esito | Evidenza |
|---|---|---|---|
| 1 | «sembra tagliato» | **FATTO, confermato.** Il quadrante è più grande del suo riquadro: l'anello d'oro è tagliato a sinistra, a destra, in alto e in basso. Restano visibili gli angoli del fondo quadrato blu notte attorno al cerchio. Succede a 1440×900 e a 1280×800, in tutti gli stati. | `f1c-crops/board-armed-1440.png`, `contact-sheet.png`; C5: `div.arena` 766×766 in 279×279, `scene-col` 402×411 in 340×340 |
| 2 | «non ha il pulsante per lanciare» | **FATTO, sfumato.** Il pulsante esiste: è **la stella al centro** (`.da-tira`, solo `aria-label="Throw"`). Non ha però etichetta, né testo guida, né segno che sia cliccabile. Per i primi ~4 s (intro: gocce d'inchiostro, poi aculei blu) non c'è nulla da premere né istruzioni. | contact sheet, frame 1-3; tempi F1b §3 |
| 3 | «si blocca al risultato» | **FATTO, comportamento di design poco segnalato.** Dopo il verdetto tutto si ferma finché non clicchi. L'unica indicazione è una riga in corsivo grigio a ~12 px in fondo alla carta («Click anywhere to continue — the details stay in the log»), a basso contrasto. | `f1c-crops/col-verdict-1440.png` |
| 4 | «non abbastanza cinematografico» | **FLAG.** Vedi §3. | — |
| 5 | barra in basso che si colora | **FATTO parziale.** La barra si riempie (20 → 43/110 tick nei frame) e ha 6 tacche per fase; la tacca della fase corrente è più chiara. **NON VERIFICATO**: se il riempimento è coerente con la durata reale lungo tutta la quest (servono catture su tutta la run). | `20-armed-throw-visible.png` vs `42-parked-t3000.png` |
| 6 | idle finale congelato | **FATTO, confermato tre volte.** (a) contatore `astroFrames` fermo; (b) **0 pixel cambiati su 115 600** nel quadrante tra 0 e 3 s dopo il parcheggio, mentre la scena a sinistra nello stesso intervallo cambia il 2,6%; (c) a vista: i raggi di luce restano congelati a metà spazzata, un fotogramma di movimento fermo. Il giocatore vede un'animazione «morta» accanto a una scena viva. | `board-parked-1440.png`, contact sheet ultimi 2 frame |

## 2. Candidati di F1b, verificati

| Criterio | Candidato | Verdetto |
|---|---|---|
| C1 centratura | `quest-party-toggle` −4.5 px, `quest-belt-toggle` −5.5 px | **Non è un errore di centratura.** Le pillole contengono icona **più** un indicatore di stato (barra verde verticale, pallino oro) e quindi l'icona è spostata di proposito. Ma l'indicatore stesso **viola la regola 6b della guida HUD** («niente pallini, dischetti di stato, semaforo verde/rosso»). → `correctness` rispetto alla regola di progetto. |
| C4 / C7 coerenza | header della QuestRunWindow | **FATTO.** Nella stessa riga ci sono tre grammatiche: 2 pillole con contorno, 1 cerchio teal con contorno, 3 cerchi neri pieni. Le icone mischiano figure incise piene (party, bisaccia, pergamena) e glifi a linea (✦, −, ×). Per un livello AAA è un difetto di coerenza. (`f1c-crops/header-1440.png`) |
| C5 clipping | 6-7 elementi | **Uno è il difetto n. 1 (quadrante).** `quest-theatre-frame` 745×340 in 730×303 è il ritaglio dell'immagine di scena: a vista l'inquadratura è pulita, quindi è voluto. |
| C6 contrasto | lettere `V I T T O R Y` 46 px, rapporto 1.06-2.08 | **Falso positivo dello strumento**: quelle lettere non compaiono in nessun frame. È la carta interna dell'astrolabio nascosta (`hideInternalCard`); lo strumento non considera l'opacità degli antenati. Da correggere. |
| C6 contrasto | titolo della colonna «Examine the ground» oro su teal: **2.52:1** | **FATTO.** Il titolo della colonna non ha una lastra: galleggia sullo sfondo. A 1280 passa sopra la mappa, quindi la leggibilità dipende da cosa c'è dietro. |
| C6 contrasto | readout FOOD crema su salmone: **2.26:1** | **FATTO**, visibile. Fuori dallo skill check (HUD), lo annoto per la scheda HUD. |
| C8 composizione | finestra spostata a sinistra (−30 px a 1440, −110 px a 1280) | **FATTO, non un errore.** Finestra + colonna formano un gruppo (310..1424 a 1440, 150..1264 a 1280). Il layout 3-zone sposta la finestra per far posto alla colonna. **FLAG**: l'equilibrio del gruppo è una scelta di composizione. |

## 3. Difetti nuovi trovati leggendo i frame

1. **FATTO — testo duplicato nella carta del verdetto**: «Fresh tracks heading north. You know how to approach (Stealth bonus).» compare due volte, una grigia e una bianca. La stessa frase compare una terza volta nella finestra quest. `col-verdict-1440.png`.
2. **FATTO — verdetto triplicato**: «VICTORY» + narrazione + effetto sono sia nella finestra sia nella carta sotto il quadrante. Due posti da leggere per la stessa informazione.
3. **FATTO — il chip «VICTORY» è verde**, in contrasto con la regola 6b («niente semaforo verde/rosso»).
4. **FATTO — il chip «58/50»** accanto al titolo non dice cosa sia (punteggio contro difficoltà?). Il giocatore non ha legenda.
5. **FATTO — titolo duplicato**: «EXAMINE THE GROUND» è sia titolo della colonna sia titolo del beat nella finestra.
6. **FATTO — baseline non allineate**: il titolo della colonna (y≈126) sta 13 px sopra il titolo della finestra (y≈139) che le sta accanto.
7. **NON VERIFICATO, anomalia di cattura o di gioco**: a 1440×900 in tutti i frame la mappa non c'è (fondo teal piatto); a 1280×800 la mappa si vede. Può essere la camera inquadrata sul mare aperto (nebbia piatta, T-01) o un problema di rendering. Da indagare prima di attribuirlo al gioco. **Aggiornamento F3:** correlato 4/4 con l'errore Pixi `reading 'ids'`, intermittente e indipendente dal viewport. Vedi `F3_scheda_questrunwindow.md` §7.

## 4. FLAG di gusto per il Director (`taste`, proposte, nessuna decisione)

Cappello `game_director`, ancorato alle ricerche di F0 §5:
- **Il momento del lancio non è messo in scena.** In BG3 il tiro importante occupa lo schermo con i modificatori visibili; qui il quadrante sta in una colonna laterale da 340 px, tagliato, e la scena principale a sinistra non reagisce al tiro (cambio di pixel durante lo spin: 1,5%). Due direzioni possibili (**visual-fork**): (A) il check prende il centro della scena per la sua durata; (B) resta in colonna ma la scena reagisce (luce, camera, suono).
- **Intro di 4 s senza istruzione.** È tensione o attesa? Due direzioni: (A) intro che dice cosa sta per succedere (abilità, probabilità, «tocca la stella»); (B) intro accorciata a favore del gesto del giocatore.
- **Dopo il verdetto.** Disco Elysium non chiede «continua»; qui sì. Tre direzioni sono già in F0 §8 (idle vivo, idle ridotto, uscita animata) + la scelta tra auto-avanzamento e affordance esplicito.

Cappello `ui_developer`:
- La stella-pulsante è bella ma non si legge come comando. Un'etichetta incisa o un invito che pulsa risolverebbe senza perdere la fantasia (rispetta la 6b: è una sagoma, non un cerchio con simbolo).

## 5. Revisione `objective_critic` di questa stessa lettura (max 5)

1. **ASSUMPTION** — «il giocatore vede un'animazione morta»: provato su un percorso (Column, run goblin, beat «Examine the ground»). Altri check, il percorso overlay e altri verdetti (fallimento, ferita) non sono stati catturati. *Fix*: ripetere su un fallimento e su un check di combattimento.
2. **UNSUPPORTED** — «la scena non reagisce al tiro (1,5%)»: misura su due frame a 1,5 s di distanza; con frame rate headless basso un effetto breve può cadere tra i due. *Fix*: sequenza con `page.clock` a 100 ms durante lo spin.
3. **RISK** — il quadrante tagliato potrebbe dipendere dalla larghezza di colonna del layout corrente (WIP parallelo su PLAN-043/063). *Fix*: dichiarare il commit/stato del worktree nel manifest e ricatturare dopo l'atterraggio delle sessioni parallele.
4. **BIAS** — le direzioni di §4 sono influenzate dai due riferimenti cercati (BG3, Disco). Altri modelli (dado fisico, carta, nessun dado) non sono stati esplorati.
5. **CONTRADICTION potenziale** — «ritmo» contro «spettacolo»: allungare la messa in scena peggiora il «si blocca». Va deciso insieme, non separatamente.

## 6. Difetti dello strumento emersi (da correggere prima di F2/F3)
- Il contrasto non scarta i testi con antenati a opacità 0 o nascosti: falso positivo sulle lettere VICTORY.
- C1 non distingue icona + indicatore di stato da icona fuori centro: serve escludere i figli «indicatore».
- Errore mio di copia in F1b: il PNG 1440 dello stato armato era stato sovrascritto dal 1280. Corretto: ora i file 1280 stanno in `1280x800/`.

## 7. Non verificato
Percorso overlay; check falliti, ferite, morte; riempimento della barra su tutta la run; audio; reduced-motion; build di produzione (tutto su dev server con config isolata); la mappa assente a 1440.

---

## 8. Ricattura: sconfitte e combattimento (Opus, 2026-10-20, strumento corretto)

Run completa goblin, `shots/skillcheck-fullrun/` (contact sheet: `full-c-verdict.png`, `full-d-parked3s.png`). Seed non controllabile (`Date.now() ^ Math.random()` in `useQuestExpeditionSession.tsx:671`), quindi si è giocato un run intero: **7 check**, cioè 2 check di esplorazione/assalto in **DEFEAT**, poi «Iron and ash» turni 1–5: DEFEAT, VICTORY, TRIUMPH, VICTORY, TRIUMPH. Party del `demoLaunch`: solo Sir Spaccaculi.

### Strumento corretto: verifica
- Contrasto: le lettere nascoste «VICTORY» non compaiono più (opacità cumulata, ritaglio, copertura). Restano solo testi visibili.
- C1: 0 icone fuori centro; `quest-party-toggle` e `quest-belt-toggle` ora classificati `icon+indicator` (barra verde 4×12.5 px `rgb(123,201,111)`, pallino oro 6×6 px). Diagnosi di F1c §2 confermata dal dato.

### Fatti nuovi
1. **FATTO — la sconfitta non è messa in scena.** In DEFEAT il quadrante resta scuro, stella piccola, una scintilla: identico al «prima del verdetto». VICTORY/TRIUMPH hanno un bagliore pieno. L'unico segnale di sconfitta è il chip rosso «DEFEAT» (contrasto **2.41:1**, sotto soglia; rosso/verde = semaforo vietato dalla regola 6b).
2. **FATTO — il testo duplicato è sistematico**, non un caso. In 7 carte su 7 la seconda riga compare due volte (grigia nel riepilogo, bianca subito sotto): «The climb costs you (−10 HP)», «The charge dies in the mud. No vantage.», «Goblins down: 1. 5 remain.»…
3. **FATTO — il combattimento è lo stesso skill check ripetuto 5 volte.** Stesso quadrante, stessa intro, stesso click «Throw», stesso click per chiudere; cambia il glifo (fiore a 5 petali al posto della stella). Con i tempi misurati in F1b (intro 4.1 s + spin 3.6–4.0 s) ogni turno costa **≥ 8 s prima ancora di leggere**, cioè **≥ 40 s per uno scontro di 5 turni**.
4. **FATTO, dal dato — l'esito del tiro non cambia il danno subito.** HP di Sir Spaccaculi turno per turno: 83 → 71 → 59 → 47 → 35 → 23: **−12 a ogni turno** con DEFEAT, VICTORY e TRIUMPH. La carta lo dice anche nel trionfo («bends, then straightens up (−12 HP)»). Se è voluto («they answer blow for blow»), il giocatore non può percepire che il tiro conti per la propria sopravvivenza. **Domanda di design per il Director**, non un bug dichiarato.
5. **FATTO — cifra sospetta «−210 HP»** sotto l'icona della fase precedente nella cronologia (`hp-chips.png`), con un party da 93 HP massimi. **Causa NON VERIFICATA** (concatenazione di «−2»+«10»? somma di più eventi?).
6. **Correzione di una mia ipotesi**: il «100 %» rosso accanto alla barra HP **non sono gli HP** (la barra è all'89%, coerente con 83/93): è l'**esposizione** (`combat-exposure-hero-sir-spaccaculi`). Il dato è giusto, ma la presentazione è ambigua: una percentuale accanto a una barra che dice un'altra cosa. Contrasto 2.46:1.
7. **FATTO — numeri senza legenda**: chip `61/50`, `48/50`, `28/50`; un TRIUMPH su `28/50` rende il chip ancora meno leggibile come «probabilità».
8. **FATTO — 6b nel combattimento**: conteggio goblin con pallini rossi («× ●●●●●●») e numerazione dell'opzione in un cerchio («①»): entrambi esempi vietati dalla guida HUD regola 6b.
9. **FATTO — refuso di copy**: «Goblins down: 1. 5 remain.» si legge come un elenco puntato.
10. Il congelamento dopo il verdetto vale per tutti e 7 i check, sconfitte comprese: raggi fermi a metà spazzata.

### Aggiornamento della §7 «Non verificato»
Verificati ora: sconfitta, combattimento, trionfo. Restano non verificati: percorso overlay, ferita grave/morte, audio, reduced-motion, build di produzione, mappa assente a 1440 (presente anche in questa run, 1440×900), causa di «−210 HP».
