---
title: "Astrolabe V6.3 — il modello di V16 nell'astrolabio, pilotato dall'area"
status: active
created: 2026-08-30
---

# PLAN-010 — Astrolabe V6.3

Desiderata: **v16 FROZEN** (`.mw/desiderata.md`). Conserva il modello della v15
(stella = personaggio, materia sotto = difficoltà, prova = quanto resta scoperto) e
revoca il divieto di materia fluida.

## Spec

> **Immutabile dopo il battesimo.**

### La regola architetturale

> **Il contratto di copertura vince sulla forma.**
> `copertura = 50 + (stat − difficoltà)`, e la forma è quella che serve a produrlo.
> Decisione del Director, 2026-08-30: *«fiore pieno va bene, vince il contratto»*.

Sotto la parità e attorno ad essa la forma si legge (le punte stanno dentro il muro);
sopra la parità le punte sono comunque tagliate dal muro e il contratto comanda senza
contendere niente di visibile.

### Cosa V6.3 è, e cosa non è

Un fork di V6.2 che **ripiloto** la geometria di V16 e rifà pelle e coreografia del catrame.
Non porta una geometria nuova: quella di V16 è già scritta.

**Si eredita da V6.2** (già nel working tree, verificato a misura): la marea che clippa la
stella al muro, i tentacoli a 7 bracci, `MAX_BLOBS` 36, i raggi negativi corretti in
`drawStar`, le ghiere interne clippate al path.

**Si butta**: il profilo a corde di V6.2, `geo.starMix`, la finestra di famiglia
`smoothstep(elong, 0.90, 1.00)`, le costanti `V62_VALLEY_FLOWER/STAR/BLADE`. La famiglia a
tre forme discrete sparisce.

### I fatti misurati che il piano assume

Tutti verificati sui pixel dipinti o sul sorgente, non stimati.

1. **Profili e copertura alla parità** (punta = muro):

   | profilo | angolo punta | area |
   |---|---:|---:|
   | corda — la stella vera | 34.2° | 34.4% |
   | lineare (`rHeroAt` di V16) | 89.6° | 50.1% |
   | coseno — il fiore | nessuno spigolo | 51.8% |

   **Alla parità una stella vera copre il 34.4%, non il 50%.** Per mostrare il 50% la forma
   deve essere del fiore. È geometria, non preferenza.

2. **Il morph esiste già in V16.** `buildHeroShape` calcola `mix` **per asse**;
   `rHeroNarrowAt` miscela in continuo `fiore*(1−m) + stella*m`; la valle segue l'asse più
   debole; la forma della punta segue in proporzione per costruzione. **Diverge solo il
   pilota**, che è `punta/muro` — dichiarato morto dal Director.

3. **La «stella cicciona» è impossibile per costruzione.** Il ramo stella tiene la valle in
   `[0.15, 0.30]`, il fiore ha la punta tonda. Una punta acuta con valle alta non è
   costruibile nel modello.

4. **Mappa di fattibilità** sull'insieme ammesso oggi (fiore fisso a 0.3675): solo 8 casi su
   16 sono EXACT; sette sfondano in alto nella fascia in cui il personaggio è più forte della
   prova (a 85/50 il massimo è 78.6% contro un bersaglio di 85%).

5. **Sbloccando la valle del fiore** fino a ~0.55 tutto il dominio torna raggiungibile:
   0.416 a 80/50, 0.442 a 85/50, 0.503 a 95/50, 0.541 a 99/50. La punta resta tonda, quindi
   nessuna cicciona.

6. **Curva di colata**: `tarPour(t) = seed + (1−seed)·t²(3−2t)` è una smoothstep, derivata
   `6t(1−t)` — zero all'inizio, **massima a metà**. Il catrame accelera nella prima metà.

7. **Smorzamento del bordo**: `ζ = (1 − 0.985) / (2√0.015) = 0.061`, gravemente
   sottosmorzato. Osservato: bordo a 267px con muro a 205, ancora a 240 a onda zero.

8. **Colore del catrame**: tre stop tutti nel fondo scala → skewness nulla per costruzione.
   Motoyoshi (*Nature* 2007): una superficie scura è riconosciuta come materiale solo con una
   piccola popolazione di pixel molto luminosi. Senza, è percettivamente un buco.

9. **Banda *almost***: dipinta come profilo scalato (`s·1.085`) → ~25px sulle punte, ~10px
   nelle valli; la fisica `inAlmost` usa **16px costanti**.

10. **Ghiera**: tre cerchi SVG contro gli 8–12 layer prescritti da
    `visual_design_philosophy.md`. `SlottedMedalSkin.tsx` è riusabile.

### Le tre classi di criteri

Ogni criterio appartiene a **una** classe, e le classi non si mescolano nello stesso gate.

- **Invarianti dure** — automatiche: copertura, monotonia, clipping, overshoot, assestamento,
  determinismo, performance, area durante l'animazione, indipendenza degli assi.
- **Vincoli strutturali** — verificati sul sorgente: config-first, `MAX_BLOBS`, niente
  obelischi persistenti, WebGL2.
- **Review del Director** — occhio umano: «legge come materia e non come buco», «la punta
  debole si identifica», «la minaccia sembra periferica», «il contatto è credibile».

In più, **Coherence review** come controllo *trasversale* (non una quarta classe):
*lo stato che il sistema simula è lo stato che il giocatore vede?*

### Fuori scope

- Il bottone **THROW** resta al centro.
- Gli **obelischi** non restano in scena.
- **Morti, da non riproporre**: la regola `punta/muro` per scegliere la forma; il disco con
  cinque fessure; la stella grassa a punta acuta.
- Niente compute shader: WebGPU non è affidabile in Tauri, WebGL2 SDF è il tetto.
- La divergenza fra `destinyAstrolabeV62/` e `skillCheckWebV1/` non si risolve: ne resterà uno.

## Tasks

### CP-A — Snapshot V6.2 + harness minimo ✓ fatto 2026-08-30

Fork della rotta (`destinyAstrolabeV63/`, kit, `/minimal-destiny-astrolabe-v6-3`) e
infrastruttura di misura **subito**, non alla fine: CP-C e CP-D sono calibrazione geometrica e
senza strumento non si distingue il profilo dal renderer, dal clipping o dall'antialiasing.

Quattro famiglie: geometria, copertura, fisica, render. Ridotto all'essenziale — hash dei
file V6.2, pochi golden input, output deterministico, metriche minime.

*Invarianti*: stesso input → stesso report; V6.2 produce gli stessi output prima e dopo il fork.

**Esito.** Rotta `/minimal-destiny-astrolabe-v6-3` con `destinyAstrolabeV63/`, kit e pagina;
navigazione incrociata V6.2 ↔ V6.3. Baseline a hash dei 6 file della V6.2
(`npm run astrolabe:baseline[:check]`). Harness di copertura come test puro sul modello reale
`coverage.ts`, deterministico (`npm run astrolabe:coverage`). Banco di misura permanente
`window.__ASTROLABE_V63__`, montato **solo in sviluppo**, con `step(now)` che disegna un
fotogramma senza riprogrammarsi — serve perche' il pannello di anteprima congela
`requestAnimationFrame` (misurato: 0 frame/s). Verificato: 260 fotogrammi pilotati a mano
portano il canvas da 0 a 1558 campioni dipinti, timeline a `risk-pour`, zero errori.
`build:check` verde, 4/4 test verdi, V6.2 invariata.

**Scoperto qui, da tenere per CP-C/CP-D.** Con una sola skill i cinque assi **non** sono
equivalenti: il muro porta `sin(3t) + sin(5t) + sin(7t)` e i termini a 3 e a 7 non sono
simmetrici a cinque. Asimmetria misurata fino a **3.72 punti** fra assi (50/50, profilo fiore).
E' rumore che compete con il segnale semantico «quale skill ti tradisce».

### CP-B — Feasibility map del contratto ✓ fatto 2026-08-30

Il task più importante, e precede ogni implementazione. Non chiede «si può?» ma **«in quale
regione esatta?»**, e lo calcola sul modello parametrico V16 **già esistente**, senza
implementare il morph che si vuole validare.

Classifica il dominio in **EXACT / SATURATION / IMPOSSIBLE** e determina il limite superiore
della valle del fiore necessario a rendere EXACT tutto il dominio giocabile.

*Invarianti*: ogni classificazione riproducibile dall'harness; nessuna forma prodotta fuori
dall'insieme ammesso.

**Esito.** `tests/unit/astrolabe/v63-feasibility.test.ts`, riproducibile. Su **61 casi
giocabili** (bersaglio non al tappo):

| classe | casi |
|---|---:|
| EXACT | **53** |
| SAT-alto | 2 |
| SAT-basso | 6 |

E il divario, che e' quello che serve alla policy di CP-D: **nessun caso sfonda di piu' di
4.9 punti**, e solo tre superano il punto singolo — 50/90 (bersaglio 10%, ottenibile 14.9%),
30/10 (70% / 73.1%), 40/80 (10% / 13.0%). Gli altri cinque stanno sotto 1.0.

**Tetto della valle richiesto: 0.774**, al caso 10/20 (bersaglio 40%). Il tetto e' guidato dai
casi a **stat bassa**, non dagli allungamenti alti: il fiore pieno serve quando il personaggio
e' debole, non quando e' forte — coerente con «quando possibile voglio il fiore».

**Correzione a una misura precedente.** La mappa calcolata a mano in sessione diceva sette casi
fuori banda con divari di 4-12 punti. Era **sbagliata**: usava un profilo coseno, mentre il
fiore del codice (`rHeroAt`) e' lineare nell'angolo. Il modello reale se la cava molto meglio.
E' il motivo per cui CP-B doveva stare nell'harness e non in uno script usa-e-getta.

**Da verificare a CP-C**: una valle a 0.774 incide solo il ~23% verso il centro — e' un fiore
molto pieno, vicino al «disco con cinque fessure» che il Director ha vietato. Il numero regge il
contratto; va guardato se regge l'occhio.

**Abilitato qui**: `measureCoverage` accetta ora un `valleyF` opzionale. Al default il
comportamento e' identico — verificato confrontando i numeri prima/dopo su tutta la griglia
golden.

### CP-C — Rewire del modello V16 al pilota d'area ✓ fatto 2026-08-30

Non si riscrive la geometria: si sostituisce il **driver**, da `punta/muro` a errore d'area.

Conservare: morph continuo, `mix` per asse, weak-axis sulla valle, proporzionalità
fiore↔stella della punta. Sbloccare la valle del fiore secondo CP-B. Eliminare il vecchio
pilotaggio.

**Decisione del Director (2026-08-30):** un bersaglio **per settore**, non uno globale —
«ogni petalo dice la verità sulla propria skill, e la copertura totale viene da sé».

**Esito.** Il motore V6.3 consuma il modello di `skillCheckWebV1`: nessun profilo locale
superstite (`radialFromAxes`, `chordFromAxes`, `geo.starMix`, `V63_VALLEY_*` rimossi).
`starPath` ora campiona, perché il profilo miscelato **non è un poligono**: passare per i
dieci vertici taglierebbe la componente curva del fiore dove è più grassa.

Misurato **nel motore vivo**, copertura contro bersaglio:

| caso | bersaglio | P | scarto |
|---|---:|---:|---:|
| 40/60 | 30 | 30.0 | 0 |
| 50/50 | 50 | 50.0 | 0 |
| 70/50 | 70 | 70.0 | 0 |
| 85/50 | 85 | 85.1 | +0.1 |
| 95/50 | 95 | 94.8 | −0.2 |
| 50/20 | 80 | 80.1 | +0.1 |
| 20/80 | 1 | 3.1 | +2.1 (satura) |

Prima del rewire, 85/50 valeva **69.0** contro un bersaglio di 85: mancavano 16 punti.

**Difetto trovato e corretto:** `rHeroNarrowAt` calcolava la componente fiore con la valle
inchiodata a `VALLEY_F`, ignorando le valli della forma — al capo fiore il morph non arrivava
mai al petalo pieno. Era esattamente il tetto che faceva mancare 5.0 punti a 85/50.

**CONFLITTO STRUTTURALE scoperto qui, da risolvere in CP-D.** Due regole approvate
separatamente si contraddicono: «la valle segue l'asse più debole» (V16, conservata) e «un
bersaglio per settore». La prima fa scavare le valli di un asse **forte** dai suoi vicini
deboli, e allora la seconda diventa irraggiungibile per quel settore. Misurato su board a
spread crescente (difficoltà fissa 50):

| spread fra le stat | scarto max | settori fuori |
|---:|---:|---:|
| 0 | 0 | 0 |
| 20 | 0 | 0 |
| 40 | 4.7 | 1 |
| 60 | 11.8 | 1 |
| 75 | 16.1 | 1 |

Fino a ~20 punti di spread il contratto tiene esatto. Sopra, satura **sempre e solo un
settore** — il forte accanto al debole. Un test lo inchioda perché non passi inosservato.

*Invarianti*: la geometria risultante appartiene al modello V16 atteso, con differenza
attribuibile **esclusivamente** al nuovo driver; nessuna forma discreta; nessuna dipendenza
da `punta/muro`; `stat_i` tocca solo la punta *i* e lascia le altre quattro invariate.

### CP-D — Contratto di copertura e policy di saturazione ✓ fatto 2026-08-30

Formalizza il risultato di CP-B nel comportamento a runtime. Nella regione EXACT il contratto
è esatto; nella regione SATURATION la forma va al massimo ammesso e lo scarto è **spiegato
dalla frontiera**, non da tuning casuale.

*Invarianti*: `|copertura − (50+delta)| ≤ 3` nella regione EXACT; monotonia lungo `stat` a
difficoltà fissa **e** lungo `difficoltà` a stat fissa, verificate separatamente; nessuna
discontinuità; il correttore globale è un parametro documentato del modello, non un fix.

**Esito.** `solveShapeReported` restituisce la forma **e il verbale**: per ogni asse
bersaglio, copertura ottenuta, morph, residuo e — se ha ceduto — contro quale frontiera.
Due frontiere, e dicono cose diverse: `flower` (morph al minimo, non c'è altra area da
prendere) e `star` (morph al massimo, copre comunque troppo). Il motore espone
`geo.coverageReport` e `geo.anySaturated`.

Il punto della policy non è che la saturazione non accada — CP-B ha misurato che accade — ma
che **non sia muta**. Uno scarto non dichiarato è il modo in cui il quadro smette di predire
l'esito senza che nessuno se ne accorga.

Verificato nel motore vivo:

```
sano  (85/50)            tutti i settori 85/85, anySaturated: false
conflitto [90,30,60,75,45]
  a0: 76.98/90  res=-13.02  sat=flower   ← dichiara la frontiera
  a1..a4                    res=0        sat=none
```

**Invarianti, tutti verdi al primo colpo** su griglia 9×9: nessuno scarto muto; nella regione
raggiungibile il contratto è centrato entro 3 punti; monotona lungo `stat` **e** lungo
`difficoltà`, verificate separatamente; nessuna discontinuità oltre i 10 punti che il
bersaglio stesso si muove fra due celle; la saturazione dichiara la frontiera corretta.

**Sulla clausola del correttore globale**: non esiste. Con un bersaglio per settore ogni
petalo si risolve contro il proprio e non c'è niente da correggere dopo. La clausola è
soddisfatta per assenza, non per implementazione.

**Revisione dopo obiezione del Director: «non capisco perché dovremmo scegliere qualcosa, ogni
settore ha la propria costruzione».** Aveva ragione, e il conflitto era in gran parte mio.

La vecchia parametrizzazione legava la profondità della valle al morph dell'**asse più debole**.
Conseguenza: un asse forte fra due vicini deboli non controllava **nessuna** delle sue due
valli — restava senza gradi di libertà e saturava a 13 punti dal bersaglio. Non erano due
regole in conflitto: era una parametrizzazione che sprecava incognite.

Le valli però sono **cinque** e i bersagli **cinque**: il sistema è quadrato. Riscritto il
solver sulle valli (`solveValleys`), con il `mix` della punta derivato in proporzione dalle due
valli che delimitano il petalo — la regola del Director è conservata, non imposta.

| board | peggiore prima | peggiore ora |
|---|---:|---:|
| [90,30,60,75,45] | 13.02 | **2.94** |
| [90,30,60,60,60] | 11.8 | **1.42** |
| [95,20,60,60,60] | 16.1 | **4.90** |
| skill singola 85/50 | 0.1 | **0.0** |

Quel che resta è **saturazione vera e convergente**: identica a 400, 3000 e 20000 passate, con
due valli incollate al tetto del fiore (0.80). Con una valle bloccata restano quattro incognite
per cinque equazioni — il sistema è sovravincolato e il rilassamento **distribuisce** il
residuo (cinque settori a ±2.9) invece di concentrarlo. È il comportamento giusto.

**Corretta anche la classificazione della saturazione**: si guarda il **sistema**, non la
singola valle. Se anche una sola valle è incollata, nessun settore è più garantito esatto,
nemmeno quelli con le proprie valli libere; chiamarli `none` sarebbe uno scarto muto travestito.

**Un secondo percorso silenzioso, trovato e rimosso.** Per un giro `solveHeroShape` ha chiamato
il vecchio solver mentre il motore usava già quello nuovo: i test misuravano il morto e
restavano verdi. È il difetto che ha aperto questa sessione. Ora c'è un solo solver, e
`solveMorph`/`buildHeroShapeFromMorph` sono stati cancellati invece che tenuti «per
compatibilità».

**Flake diagnosticato e chiuso.** La suite falliva ~1 volta su 5. Il modello è dimostrabilmente
puro (nessun `Math.random`, `Date`, `performance.now`), quindi non poteva essere logica: erano
i miei test troppo lenti (~4s) che sotto carico sfondavano il timeout di 5s di vitest.
Memoizzati i solve (21s → 8.2s) e messo un timeout esplicito sui tre test di griglia.

### CP-E — Dinamica del goo ✓ fatto 2026-08-30

Stella congelata. Curva di colata, smorzamento, monotonia, overshoot, assestamento, area
durante l'animazione, determinismo.

Huppert (1982, JFM 121:43–58) è un **profilo di riferimento**, non l'ontologia del catrame:
`r ∝ t^((3α+1)/8)`, flusso costante `t^(1/2)`, volume costante `t^(1/8)`.

*Invarianti*: fronte monotono non decrescente; velocità non crescente dopo la fase iniziale;
a riposo il bordo coincide con `rCheckAt` entro 1px **senza assestamento oscillante**; area
secondo contratto; stesso seed → stesso output.
Il criterio è il **comportamento osservabile**, non il valore di `stiffness`/`damping`.

**Esito, misurato sul fronte simulato nel motore vivo:**

| | prima | ora |
|---|---:|---:|
| overshoot oltre il muro | +62px | **0** |
| scarto a riposo | +35px | **0.00** |
| velocità per quarto | `[0.93, 0.89, 3.09, 3.85]` ↑ | `[2.89, 2.13, 0.68, 0.10]` ↓ |
| determinismo | assente | **400 campioni identici fra due caricamenti** |

**Due curve, non una.** Correggere `tarPour` non bastava: il fronte non segue quella, segue
`poolFraction`, che applicava **una seconda smoothstep** riaccelerando a valle ciò che a monte
era stato reso decelerante. Con la sola prima correzione il fronte accelerava ancora
(`[0.93, 0.89, 3.09, 3.85]`). Il test ora guarda la **composizione**, che è quella che il
giocatore vede.

**Caduto anche il plateau.** La pozza restava ferma fino a `rev=0.52` e poi ripartiva, e un
plateau seguito da movimento **richiede** un'accelerazione — non è una taratura da aggiustare,
è la forma. Rimosso: resta il pavimento del seme, che è la pozza già presente e non un ritardo.
Costo: si perde il beat «la pozza si accumula, poi cede». Guadagno: «sempre più lentamente»
diventa letterale, come chiedeva il Director.

**Config-first e V6.2 intatta.** I valori stanno in un blocco `v63` separato in
`tarGooConfig.ts`: `simulation` e `timing` sono letti anche dalla V6.2, e cambiarli avrebbe
mosso il termine di paragone insieme all'esperimento.

**Determinismo della sola dinamica del goo.** Le gocce nascevano da `Math.random`: due
esecuzioni davano fronti diversi e l'harness misurava rumore. Seme fisso, stesso RNG dei
tentacoli. Il resto del motore — moti, stelle, scintille, tiro del rischio — **resta casuale**:
è decorazione e sta fuori da CP-E.

**Una soglia che mi ero inventato.** Il test chiedeva «rallenta di almeno un ordine di
grandezza», numero che non derivava da niente e che la legge non può soddisfare: per `r = t^p`
il rapporto è `(1−0.75^p)/(0.25^p)`, cioè 3.7× con p=1/2. Ora il test lega la soglia
all'esponente in config.

### CP-F — Contatto stella/catrame ✓ fatto 2026-08-30

Menisco, occlusione, bagnatura del bordo. **Niente spostamento**: la stella copre, non rimuove.

*Invarianti*: copertura invariata entro tolleranza numerica; la stella non trasla; area del goo
costante durante il contatto.
*Review*: «il contatto è credibile, la stella non è un adesivo».

**Esito.** Due segni, **entrambi dal lato del catrame**: ombra di contatto (la stella sta
*sopra*) e menisco (la superficie che si arrampica sul fianco, cioè bagnatura). Niente
spostamento del goo — la v15 dice «la prova è quanto resta scoperto», e spostare racconterebbe
che la difficoltà si è *ridotta*.

Profilo di luminanza uscendo dal bordo, in direzione della valle:

| distanza dal bordo | 2px | 6px | 10px | 16px | 24px | 40px |
|---|---:|---:|---:|---:|---:|---:|
| luminanza | 56.9 | 30.7 | 30.7 | **5.9** | 8.0 | 75.9 |

Menisco chiaro attaccato al fianco → gola d'ombra → catrame normale. È la firma di un oggetto
appoggiato *dentro* la materia, non sopra.

**Copertura: 84.99 contro un bersaglio di 85** — non si è mossa.

**Perché non può muoversi**, e non è una misura ma una garanzia strutturale: il contatto è
clippato a `tarSide` (evenodd di muro + path della stella), cioè **strettamente fuori** dalla
stella. Non può dipingere un pixel dentro la silhouette che porta la probabilità.

**Niente `ctx.filter`**: non esiste su WebKit, quindi la morbidezza è fatta a strati di alfa
calante invece che con una sfocatura — la stessa ragione per cui R-032 aveva scartato la
ricetta blur+contrast.

**Non implementata la bagnatura sul lato della stella.** Sarebbe una banda scura *dentro* il
bordo, e lì c'è già la ghiera bronzea: due segni sovrapposti si sarebbero impastati. Il
contatto è affidato ai due segni sul catrame, che sono quelli che dicono «sta sopra».

### CP-G — Coreografia: la minaccia si raduna, non nasce al centro ✓ fatto 2026-08-30

**Reinserito 2026-08-30.** Comprimendo i dodici task del contro-piano in nove ho **perso**
questo, senza accorgermene e senza segnalarlo. Era la **direzione A** approvata dal Director e
progettata in dettaglio in sessione, e risolve il difetto numero uno del video: *«la minaccia
nasce al centro e cresce»*, che è la causalità sbagliata — il goo **è** la difficoltà, una
condizione che c'è già, non un evento che accade.

È anche l'unico task fra CP-A e CP-F il cui esito si **vede** invece di misurarsi: la
correttezza numerica fatta finora ha come firma visiva un incavo 26px meno profondo, e il
Director l'ha giustamente notata solo guardandola due volte.

**I beat:**
1. **Si raduna** — gocce da tutti i lati, distribuite, più numerose sugli assi difficili.
2. **Converge** — scivolano nella conca decelerando, secondo la legge di CP-E.
3. **Si assesta** — trovano il livello; il bordo lobato è il *risultato*, non un disegno.
4. **La stella preme** — CP-F, già fatto.
5. **Resta scoperto** — ciò che non copri è il fallimento.

Oggi le gocce cadono **verticalmente** da sopra su `x` sparso attorno al centro
(`d.y = CY − seedDropHeight`): è esattamente la nascita centrale da eliminare.

**Vincoli:** gli obelischi non restano in scena (decisione del Director); la conca è già
stabilita dalla ghiera, che il markup chiama *«the well»* — quindi la materia che scivola al
centro è giustificata dalla composizione esistente e non è una gravità arbitraria.

*Invarianti*: nessun fotogramma in cui la regione scura sia una macchia centrale connessa più
piccola del 60% del raggio del goo; il fronte resta monotono e decelerante (CP-E non regredisce);
determinismo (stesso seme → stessa colata).
*Review*: «la minaccia sembra radunarsi, non nascere dal centro».

**Esito.** Le gocce nascono su un anello **fuori** dall'arena (raggio 427 contro 362) ad angoli
distribuiti su tutto il giro — misurati 8°, 24°, 93°, 127°, 191°, 211° — e convergono nella
conca: 427 → 278 → 188, fino a posarsi a ~175, appena dentro il muro. L'angolo di nascita è
pesato sugli assi più difficili, così il lobo del muro se lo merita invece di essere disegnato.

`vy` è diventata la velocità **radiale**: lo smorzamento è lo stesso, quindi la convergenza
decelera come la colata invece di accelerare.

**Invarianti verificati:**
- estensione della materia scura fra 288 e 498px contro una soglia di 123 (60% del muro). Un
  solo fotogramma risulta sotto, ed è il primo — `area=164` contro un picco di 6712: è la
  scintilla iniziale, non il catrame;
- **CP-E non regredito**: overshoot 0, scarto a riposo 0.00, velocità per quarto
  `[2.89, 2.13, 0.68, 0.10]` decrescente;
- copertura 84.99 contro 85, invariata;
- **determinismo**: 560 campioni identici fra due caricamenti separati.

### CP-H — Background lock, poi materialità

Il fondo è parte del sistema di contrasto, non decorazione postuma: si congela un contesto di
calibrazione **prima** dei test di materialità, e si rimisura sul contesto finale. Candidata
principale **pergamena** — il componente andrà anche su mappa e quest chronicles, quindi deve
soddisfare i contratti di tutti i contesti d'uso.

*Diagnostica* (non gate): skewness della luminanza, percentuali di banda.
*Review*: «legge come materia e non come buco».

**Baseline misurata, e corregge una premessa del piano.** Il fatto #8 diceva «tre stop tutti nel
fondo scala → skewness nulla per costruzione»: quei tre stop sono il **fallback** senza WebGL2,
non il rendering reale, che lo fa lo shader.

Prima misura, sull'intera regione fuori dalla stella: skewness **+1.902**, bin più pieno 53.5% —
sembrava già a posto. Era **contaminata** dalle fasce di contatto e *almost*, che sono interfaccia
e non materia. Isolando il catrame puro (margine 12px da stella e muro):

| | media | dev.std | bin più pieno |
|---|---:|---:|---:|
| con contatto e *almost* | 34.4 | 36.1 | 49.2% |
| **catrame puro** | **8.6** | **4.9** | **94.3%** |

Il 94% dei pixel in un solo bin: nero quasi uniforme, il «buco» che le tre critiche esterne
descrivevano.

**E una lezione sul criterio.** La skewness del catrame puro vale **3.93** — altissima — su una
distribuzione praticamente degenere, perché la coda è fatta di pochissimi pixel. *La skewness da
sola non è un criterio*: è soddisfacibile da una distribuzione che legge come un buco. Quello che
prende il difetto è `binPiuPieno`, e fallisce (94% contro 65%).

**Le varianti di fondo**, selezionabili con `?bg=<nome>`: `teal` (attuale), `pergamena`,
`pergamenaScura`, `ardesia`.

| | teal | pergamena |
|---|---:|---:|
| contrasto catrame/fondo | 8.17× | **13.67×** |
| contrasto stella/fondo | **1.66×** | **1.10×** |
| bin del catrame | 94.4% | 94.1% |

**Il baratto è netto e va deciso dal Director:** su pergamena il catrame guadagna moltissimo
(inchiostro su carta, riconoscibile senza convenzione) ma **la stella quasi sparisce** — avorio su
crema, contrasto 1.10. Su pergamena la stella va ricolorata, non è un dettaglio.

**E il fondo non risolve la piattezza:** il bin del catrame resta ~94% su entrambi. Il lavoro
sulla materia serve comunque, qualunque fondo si scelga.

### CP-I — Coherence review, ghiera assorbita

Controllo trasversale su geometria, fisica, render, timing, *almost*, contatto, ghiera:
**lo stato simulato è lo stato che il giocatore vede?** È qui che muore un secondo caso
«25px dipinti / 16px fisici».

La ghiera non ha una fase propria: riusa `SlottedMedalSkin.tsx` e deve solo non competere
visivamente con stella e goo e non muovere le metriche della scena.

*Invarianti*: banda *almost* dipinta = banda fisica; nessuna divergenza fra rappresentazioni.

### CP-J — Release regression

Certificazione del **delta**, non seconda validazione. Tre colonne: INVARIATO /
INTENZIONALMENTE CAMBIATO / BUG, con replay deterministico dei casi rappresentativi e
confronto esplicito V6.2 ↔ V6.3.

Ultimo task = esecuzione reale con log.

## Ordine

`CP-A → CP-B → CP-C → CP-D → CP-E → CP-F → CP-G → CP-H → CP-I → CP-J`

CP-B prima di ogni implementazione comportamentale: se il contratto non è raggiungibile in una
regione, si sa **prima** di costruirci sopra.

## Rischi noti

- **Overfitting ai test numerici**: un astrolabio che passa tutti i gate e continua a non
  comunicare «la stella copre la difficoltà». Mitigazione: la classe *Review del Director*
  resta separata e obbligatoria, e una variabile dominante per fase con tutto il resto congelato.
- **Il caso 50/35** (scarto +7.7 nel campione) è rimandato per decisione del Director.
- La banda di fattibilità dipende dagli estremi ammessi: stringere gli estremi la stringe.
