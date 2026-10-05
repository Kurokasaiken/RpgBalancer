# SPEC — Beat del Fallimento Critico (5%), Skill Check Web V1

## 0. Verdetto sulle tre proposte e cosa innesto

Nessuna proposta è sopravvissuta (0/3 su 3 lenti ciascuna). Non ne invento una quarta: innesto i **recuperabili dichiarati dalle nove refutazioni**, tutti già validati almeno una volta:

| Pezzo innestato | Da | Confermato da |
|---|---|---|
| Contabilità del tempo: budget già pagato, `totalMs` identico nei tre esiti, skip che collassa TUTTO il settle | P1 | 3/3 lenti |
| «Un raggio che muore non si cancella, si RITRAE» — ma **verso il telaio**, non verso la stella | P1 + correzione lente invarianti | invarianti, canvas |
| L'agente è il **residuo dello sfondamento** (il trofeo che ruba), non «un filo qualunque» | P1 | telegrafo (concesso), canvas |
| L'agente deve **abitare dove la pallina può stare**: trame dell'anello e **corde del mozzo** (`adversaryShapes.ts:552-563`) | refutazione canvas di P1 | esplicito |
| Beat **incondizionato**: il board disegna la stessa cosa nei tre esiti, divergenza solo nelle condizioni iniziali | P2 | 3/3 lenti |
| Selezione **deterministica** per distanza minima, zero random locale | P1 | 3/3 |
| **Accumulo sub-frame** come motion blur legale in canvas 2D (3-4 sub-posizioni, alpha 0.3) | refutazione canvas di P3 | esplicito |
| «La forma è il motion blur» per oggetti lunghi e sottili | P3 | canvas (parzialmente) |
| Audio che **toglie** prima di aggiungere, identico nei tre esiti, un solo stinger | P3 | invarianti |
| Anti-clumping sulla **messa in scena**, non sulla matematica | mappa dei tempi | — |
| `DIVERGENCE_MS` + guard test di identità pixel | mappa dei tempi | — |

Butto: il moncone come **mano** (geometricamente impossibile: 0/8100 combinazioni lo contengono dentro l'arena), lo **shear del mozzo** (falsifica il righello), l'**agente esterno** (pallina fuori dall'arena + secondo tiro mascherato).

---

## 1. Il modello del beat

### 1.1 La decisione strutturale che sblocca tutto

I due decreti del Director insieme **vietano** che il verdetto del crit-fail sia posizionale:

- la geometria resta quella che è (nessun tetto, nessuna regione) → a 99/10 la stella copre **tutta** l'arena (misurato: `rOf(99)=337.0`, valle `0.3675·337=123.9`, muro `rOf(10)=73.1` — l'intera arena è successo);
- il 5% è dato da fuori → il board deve saperlo mettere in scena **anche là**;
- l'arena è un contenitore chiuso → la pallina non può uscire.

Quindi non esiste, a vantaggio estremo, **nessun pixel di fallimento** dentro cui portare la pallina. Ogni proposta che legge il verdetto dallo spostamento muore lì. Conseguenza obbligata:

> **Il verdetto del crit-fail non è una POSIZIONE, è una CATTURA.** La frase è «non è più libera», non «è finita fuori». Dove la geometria esiste ancora (parità e vantaggio medio) la pallina finisce *anche* fuori dalla stella e il read posizionale arriva in regalo; dove non esiste (99/10) la cattura porta il verdetto da sola. Degradazione graduale invece di un crollo.

Corollario liberatorio: **la direzione della trazione non deve più portare il verdetto**. È esattamente il vincolo che imponeva a P1 di andare «da dentro a fuori» e che generava il problema di portata. Cade.

### 1.2 L'agente: la seta che la stella ha inghiottito

Il vincolo fisico (non un rumore, non un decreto): **la seta non evapora**. Quando la stella cresce e consuma un raggio, quella lunghezza di filo non svanisce — resta, lasca, spiaccicata sulla superficie che l'ha mangiata. Oggi `adversaryShapes.ts:435` fa `continue` e la cancella: è il bug estetico dello sfondamento, ed è anche la ragione per cui nessuna proposta trovava un agente dove serviva.

Da un raggio che muore nascono **due** oggetti distinti:

**(a) MONCONE** — il capo *esterno*, ancora annodato al telaio, che rincula verso l'esterno e si arriccia. Vive nell'anello. È il trofeo visibile dello sfondamento e il fix del pop dei fili che spariscono. **Non è l'agente.** (La lente invarianti ha dimostrato che il capo che sopravvive è quello esterno: la stella lo ha mangiato *dall'interno*.)

**(b) DRAPPO** — la lunghezza *inghiottita*, ora distesa **sulla superficie della stella**, trattenuta sulla linea di marea (il contorno) e lasca all'interno. Disegnata come **una trama con molto lasco**: identico primitivo, identico inchiostro, grammatica già a schermo (`o.sag` sulle trame, `o.curve` sull'ordito).

**L'INSIEME DEGLI AGENTI** = corde del mozzo (`:552-563`, esistenti, che già bombano *dentro* la stella perché il punto di controllo è il centro) ∪ drappi. È **complementare per costruzione**: per ogni raggio `i`, esattamente uno dei due esiste — vivo → corda del mozzo, inghiottito → drappo. Cardinalità ~N a **ogni** livello, e **tutti i membri stanno sopra la regione di successo**.

Curva di disponibilità **invertita** rispetto a P1 e P2: a 99/10 tutti i raggi sono inghiottiti, quindi la superficie della stella è coperta di drappi profondissimi — il massimo di disponibilità **esattamente nel caso X-COM**, dove P1 aveva 1 candidato e P2 aveva `NaN`.

### 1.3 Il beat: il lasco che finisce

La pallina si è fermata **nel seno** di un filo lasco. Il filo va in tensione: il seno risale verso la propria corda e porta su la pallina; quando il filo è teso, si ferma di colpo. **La corsa è il lasco stesso**, e il lasco è derivato dalla conservazione della lunghezza — non dichiarato.

Perché questo risolve la portata, che è ciò che ha ucciso P1: un seno che va in tensione non spazza un **arco sottile** (P1: 0.09–4.8% della regione), spazza la **luna** fra curva e corda, che è un'**area**. E le lune dell'insieme tassellano la regione di successo.

Cambio di soggetto (regola 8): il soggetto non è la pallina, è **il residuo del tuo stesso sfondamento**. Frase che resta: *«mi ha preso il filo che avevo strappato io.»*

Nessuna regione dedicata: il campo dei drappi è **coestensivo** alla regione di successo, non una sua sacca, e **non trattiene probabilità**. È inchiostro sopra la stella, non un luogo.

---

## 2. Refutazioni risolte, una per una

| # | Refutazione | Come la risolvo |
|---|---|---|
| R1 | *P1: portata 0.09–4.8%, Bayes 61–88% di tell 340ms prima* | La luna è un'area, non un arco; il campo è coestensivo alla regione di successo. **Gate misurabile** (§8-G1): copertura ≥99% su tutta la griglia, altrimenti il beat non si scrive. |
| R2 | *P1: 0/8100 combinazioni contengono un moncone dentro l'arena; ancoraggio fuori dal muro* | L'agente non è il moncone e non è ancorato al contorno-fuori-dal-muro. I piedi del drappo sono clampati a `min(rsAt(a), rFrame·0.985)`: **dentro l'arena per costruzione**. |
| R3 | *P1: l'attacco al mozzo non esiste (freeZone stacca l'ordito dal contorno)* | Non uso l'attacco al mozzo. Il drappo è pinzato sulla **linea di marea**, che è il contorno della stella *clampato al muro*, calcolato con la stessa `rsAt` del disegno. |
| R4 | *P1: fisica invertita, il capo superstite è quello esterno* | Accolta alla lettera: il moncone ritrae **verso il telaio**; il drappo è la parte inghiottita, trattenuta **dalla stella**. Due prodotti, due fisiche giuste. |
| R5 | *P1: cardinalità 26 falsa dove conta (1 a 95/20, 0 a 99/10)* | Complementarità corde-del-mozzo / drappi: per ogni `i` esattamente uno esiste. Cardinalità ~N a ogni livello, verificata da un test (§8-T4). |
| R6 | *P1/P3: pivot di 40-70° allontana il capo dal centro* | Nessun pivot. Il movimento è **radiale-verso-la-corda**, cioè la geometria del lasco che si consuma. |
| R7 | *P2: direzione = residuo di cancellazione del PRNG (|Σ|/n = 1-3%), NaN a vantaggio estremo* | Nessuna somma di versori. La direzione è la **normale locale** del filo selezionato, definita da un singolo oggetto. Mai zero, mai NaN. |
| R8 | *P2: la traslazione permanente falsifica il righello (±4.7 punti di stat)* | La stella **non si muove**, mai, in nessun frame. `drawStar` e il clip restano invariati; le punte restano a `rOf(stat)` con errore 0.0e+0. |
| R9 | *P2: la mezzaluna vulnerabile è una regione* | Non c'è confine spostato. Il confine successo/fallimento è immobile. |
| R10 | *P3: pallina fuori dall'arena, invariante del contenitore* | La corda del drappo sta **dentro** il muro (clamp a `rFrame·0.985`); la pallina finisce sulla corda, quindi dentro. Test hard (§8-T2). |
| R11 | *P3: strobo garantito, salto/frame > L* | Accumulo sub-frame (4 sub-posizioni/frame a 240Hz, `globalAlpha` 0.30 crescente): lo smear è proporzionale alla velocità. E la corsa è 20-40 unità, non mezzo canvas. |
| R12 | *P3: secondo tiro mascherato, agente non sul board* | L'agente è **sul board dal frame dello sfondamento**, in tutti e tre gli esiti, ed è il vocabolario più abbondante che il board possiede. Il ragno resta inesistente. |
| R13 | *Leak `totalMs` = la durata annuncia il verdetto* | `TOTAL_MS = 5510` costante, indipendente da esito e parametri (§3). |
| R14 | *Leak `:438` il rinculo pre-marca i condannati* | Il rinculo diventa **conseguenza**: solo i fili **già** scattati vibrano, dal proprio `snapAt` in poi, con forma chiusa (§4.2). Zero vibrazione profetica. |
| R15 | *Leak `:436` il `continue` sfasa il PRNG di 15 estrazioni* | **Stream PRNG separati per sottosistema + uno per raggio** (§4.1). `dead[]` non può più spostare il rumore a valle. Non «consumo comunque»: elimino la classe. |
| R16 | *Leak `:508` early return, la rete sparisce* | Rimosso; con i drappi la tela non è mai vuota. |
| R17 | *Leak `:262` il pannello promette 99.88% mentre il sistema trattiene il 5%* | `pShown = areaProb·(1 − CRITFAIL_P)` accanto al numero geometrico (§4.3). 95 mostrato = 95 onorato. |
| R18 | *Leak `VALLEY_CAP`: regione dedicata + probabilità deformata* | **Rimosso** (`effectiveValleyF` → `VALLEY_F` secco). La sua ragione dichiarata («la rete non svanisce mai») la assolvono i drappi, senza trattenere probabilità. |
| R19 | *Leak `:434` tell falso a parità (3 fili muoiono per span)* | Una sola causa di morte: `snapAt_i = rOut_i·(1+punchOut)/rStar(a_i)`. Lo span piccolo **accorcia** il filo, non lo cancella. |
| R20 | *Leak `seed:7` fisso* | `S.seed = hash(trialSeed)`, con lucchetto in lab. |
| R21 | *Leak `ph.name` nomina il verdetto* | Enum di fase **outcome-blind**: la fase `turn` esiste in tutti gli esiti (negli altri non si muove nulla). Nessun nome derivabile da `t`. |
| R22 | *Leak `showStar` / `gradRadii` inerti* | Cablati (§4.3, §4.5). |

---

## 3. Timeline — unica, invariante, `TOTAL_MS = 5510`

`SETTLE_MS` 800 → **500** e l'armamento della pallina **sovrapposto** alla coda dell'assestamento: è la leva pulita indicata dalla mappa dei tempi, applicata.

| Fase (`name`) | Da | A | Durata | Contenuto |
|---|---|---|---|---|
| `weave` | 0 | 1200 | 1200 | lancio della rete (invariato) |
| `hold` | 1200 | 1500 | 300 | invariato |
| `tear` | 1500 | 2400 | 900 | sfondamento; **qui nascono monconi e drappi** |
| `settle` | 2400 | 2900 | 500 | assestamento (era 800) |
| `arm` | 2780 | 2900 | 120 | anticipazione della pallina, **sovrapposta** a `settle`; il numero del pannello esce (fade 100ms), il righello **resta** |
| `roll` | 2900 | 4320 | 1420 | pinball, 7 impatti a cadenza geometrica |
| `creep` | 4320 | 4580 | 260 | nessun impatto, decelerazione a zero |
| `land` | 4580 | 4700 | 120 | arresto; il braccio sotto la pallina si accende **se e solo se** la pallina è sulla stella; suono di successo |
| `breath` | 4700 | **4900** | 200 | silenzio, zero eventi nuovi |
| `turn` | 4900 | 5110 | 210 | agguanto 60 + trazione 110 + impatto 40. **In successo e fallimento questa finestra passa senza che nulla si muova** |
| `read` | 5110 | 5390 | 280 | aria morta, fotogramma stabile |
| `verdict` | 5390 | 5510 | 120 | l'UI verbalizza ciò che il mondo ha già detto |

- **`DIVERGENCE_MS = 4900`**, esportata. Nessun percorso di codice legge `outcome` per produrre un frame con `t < DIVERGENCE_MS` **salvo** il braccio acceso di `land`, che distingue successo da fallimento (lettura onesta, già geometrica) e **non** distingue successo da crit-fail.
- **Finestra di falso sollievo = 320ms** (`land` + `breath`).
- **Ribaltamento = 210ms**, cioè 1/7 del rotolamento e meno della finestra che l'ha preparato.
- **Skip** (dalla seconda occorrenza): collassa `2780 → 5510` in una dissolvenza fissa di **180ms** verso lo **stato finale del board**, poi `verdict`. Mai salto diretto al pannello. La durata dello skip è identica nei tre esiti.
- 60ms e 40ms vanno scritti in **frame** (`4f`, `2f`), non in ms: a 30fps il beat va ridisegnato, non riscalato.

---

## 4. Interventi per file, in ordine di merge

### 4.1 `src/ui/skillCheckWebV1/adversaryShapes.ts` — PR 1 «igiene» (nessun beat, nessun crit-fail)

Va mergiata e **approvata dal Director da sola**, perché cambia l'aspetto di un beat approvato.

1. **Stream PRNG separati.** Sostituire `const rnd = mulberry32(S.seed)` (`:323`) con:
```ts
const rndAnc  = mulberry32((S.seed ^ 0x9e3779b1) >>> 0); // ancoraggi
const rndAng  = mulberry32((S.seed ^ 0x85ebca6b) >>> 0); // angoli ordito
const rndFrm  = mulberry32((S.seed ^ 0xc2b2ae35) >>> 0); // jitter passata 2 telaio
const rndWft  = mulberry32((S.seed ^ 0x27d4eb2f) >>> 0); // wobble trame + gocce
const rndDrp  = mulberry32((S.seed ^ 0x165667b1) >>> 0); // drappi
const rayRnd  = (i: number) => mulberry32((Math.imul(S.seed, 0x27d4eb2d) ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0);
```
   Nel loop dei campioni (`:454`) usare `rayRnd(i)`. Esito: `dead[]` non può più spostare il rumore di nessun altro elemento. **Cambia l'aspetto attuale della tela** (rumore diverso): va guardato e riapprovato.

2. **Una sola causa di morte** (sostituisce `:428-435`):
```ts
const snapAt = (i: number) => {                       // starS a cui il raggio i scatta
  const rs1 = S.rStar(ang[i]);                        // raggio pieno a starS=1
  if (rs1 <= 0) return Infinity;
  return (rOuter[i] * (1 + o.punchOut)) / rs1;        // forma chiusa, nessuna bisezione
};
const gone = A.starS >= snapAt(i);
```
   Lo span piccolo **non** uccide: `span = Math.max(0, rOut - r0Adj)`; se `span < MIN_SPAN (=2)` il raggio si disegna come nub di lunghezza `span` con 3 campioni. Risolve R19 (il tell falso a parità: 3 fili su 26 che svanivano nel frame culminante).

3. **Rinculo come conseguenza** (sostituisce `:437-441`): rimuovere il ramo su `snapFrac`. Ogni raggio **scattato** riceve
```ts
const tS = tearTimeOfStarS(snapAt(i), p);             // inversa di easeInOutCubic sul tear
const dt = Math.max(0, A.tearT - tS) / 1000;
const ring = A.recoil * Math.exp(-A.damping * dt) * Math.sin(dt * 26);
```
   applicato al **moncone**, non al raggio vivo. I raggi vivi hanno rinculo zero. Risolve R14. `snapFrac` resta nel tipo per compatibilità ma diventa inerte: rimuovere lo slider (`tsx:345`).

4. **Moncone.** Nuova funzione `drawStub(ctx, S, i, ...)`: `fillTapered` su 6 campioni, **taper invertito** (spesso al capo libero: `w0=0.9, w1=1.8`), ancorato a `rOuter[i]` e rivolto **verso l'interno**, lunghezza `STUB_LEN = clamp(0.10 * (rOuter[i] - rsAtSnap_i), 4, 18)` unità engine, curvatura di arricciamento `STUB_CURL = 0.35` (frazione della lunghezza, versore `gravity` come i raggi). Non disegnato se `punchedAt(ang[i])` (il telaio non c'è più: niente a cui appendersi).

5. **Drappi.** Nuova funzione **esportata pura** — la stessa che userà il beat, così board e beat non possono divergere (è la classe di bug del riquadro «fili superstiti»):
```ts
export interface Strand {
  kind: 'drape' | 'hubcord';
  pts: { x: number; y: number }[];   // px, con lancio già applicato
  chord: [{x,y},{x,y}];              // la corda: dove il filo arriva quando è teso
  depth: number;                     // profondità del seno in px
}
export function agentStrands(S: ShapeCtx, o: WebOpts, A: WebAnim): Strand[];
```
   Costruzione del drappo per il raggio `i` scattato:
   - **linea di marea**: `rTide = Math.min(rsAt(a), S.rFrame * TIDE_CLAMP)` con `TIDE_CLAMP = 0.985`. È il clamp che salva l'invariante del contenitore (R10).
   - **piedi**: `a1 = ang[i] - halfSpan`, `a2 = ang[i] + halfSpan`, con `halfSpan` allargato su raggi consecutivi scattati fino a `chord >= CHORD_MIN = 3 * BALL_R`. A vantaggio estremo l'arena è piccola (`rOf(10)=73` unità) e la corda su un solo passo angolare vale 17 unità, meno del diametro della pallina: **il raggruppamento è obbligatorio, non un'ottimizzazione**.
   - **lunghezza inghiottita**: `Lsw = (rOuter[i] - fz0_i) - Math.max(0, span_i)`, con `fz0_i = Math.min(o.freeZone, rOuter[i] * 0.35)` (la zona libera a `starS=0`).
   - **profondità dal lasco** (conservazione della lunghezza, seno sinusoidale `y = d·sin(πx/c)`, `L ≈ c(1 + π²d²/4c²)`):
```ts
const c = chordLen;
const d = Math.min((c / Math.PI) * Math.sqrt(Math.max(0, 4 * (Lsw / c - 1))), rTide - R_CORE_PX);
```
   - 9 campioni, `fillTapered(pts, 0.8, 0.8, INK.silkDim)` con `globalAlpha = DRAPE_ALPHA`.
   - Il drappo è funzione di `A.starS` e di `snapAt(i)`: nasce **durante** `tear`, nel frame in cui il filo scatta. Nessun elemento nuovo dopo `tear` in nessun esito.

6. **Corde del mozzo** (`:552-563`): cambiare il gate `dead[i] || dead[j]` in «fra due radici **vive consecutive**» (indice `i` → prossimo vivo), così esistono finché almeno 2 raggi sono vivi, e restituirle da `agentStrands` con `kind:'hubcord'` (corda = segmento fra le due radici, `depth` = distanza del punto medio della quadratica dalla corda). Zero modifiche al disegno.

7. **Rimuovere l'early return** `:508` e il commento morto `:399-403` (le «cinque sacche»).

8. **Pallina.** Nuova `drawBall(ctx, S, ball, sub)` con `sub` = array di 4 sub-posizioni del frame: disegna prima le 3 sub-posizioni più vecchie con `globalAlpha` 0.12/0.20/0.30 e raggio pieno (**smear**), poi il corpo. Corpo: alone `INK.ballHalo` r+2.2, poi `INK.ball`. Nuovi inchiostri: `ball: '#e8eef5'`, `ballHalo: '#0d1117'`.

9. Aggiungere accanto a `fillTapered` (`:74`) il commento sul **motion blur** — la forma copre il buco fra due frame **solo lungo il proprio asse**; sul trasversale la copertura è zero, quindi per gli spostamenti serve l'accumulo sub-frame. È il teorema di P3 con la correzione della lente canvas: va scritto lì perché il prossimo agente non lo riscopra a metà.

### 4.2 `src/ui/skillCheckWebV1/webEngine.ts` — PR 1 (stessa PR)

- **Rimuovere** `VALLEY_CAP` (`:50`), `effectiveValleyF` (`:86-93`) e il commento `:36-50`. Tutti i call site passano a `VALLEY_F` secco: `readout:229`, `tsx:117`. Deltas attesi e da riportare al Director: `vf` 0.3675 a ogni livello (era 0.1952 a 99/10, 0.1239 a 99/1).
- Nuova costante `export const CRITFAIL_P = 0.05;` con il commento che dice **cosa non è**: non è geometria, non è un tiro del board, arriva da fuori.
- `readout`: aggiungere `pShown = areaProb * (1 - CRITFAIL_P)`; correggere `survivors` (`:249-254`) per usare **lo stesso N e lo stesso predicato del disegno** (`snapAt`), e renderlo **funzione di `t`** (a `t=0` deve leggere lo stato pre-sfondamento, non quello post).
- Timeline: `HOLD_MS 300`, `SETTLE_MS 800→500`, e
```ts
export const ARM_MS=120, ROLL_MS=1420, CREEP_MS=260, LAND_MS=120,
             BREATH_MS=200, TURN_MS=210, READ_MS=280, VERDICT_MS=120;
export const GRAB_F=4, HAUL_MS=110, IMPACT_F=2;    // in FRAME dove è al pavimento
export const TOTAL_MS = 5510;                       // costante, non funzione dei parametri
export const DIVERGENCE_MS = 4900;
export type Outcome = 'success' | 'failure' | 'critfail';
```
  `totalMs(p)` resta esportata ma ritorna `TOTAL_MS` (compatibilità con `tsx:88,269,276`). **Gli slider `weaveMs`/`tearMs` non possono più cambiare il totale**: se il lab li muove, la fase `settle` assorbe la differenza. Questo è il fix del leak bloccante.
- `phaseAt(t)` → `beatAt(t)` che ritorna `{ name, weaveP, starS, tearT, ballP, subP }` con `name` dall'enum outcome-blind di §3. Nessun ramo su `outcome`.
- Nuova `tearTimeOfStarS(s, p)`: inversa di `easeInOutCubic` (Newton, 6 iterazioni) per il rinculo dei monconi.

### 4.3 `src/ui/skillCheckWebV1/ballSim.ts` — NUOVO, PR 2

```ts
export interface BallState { x: number; y: number; vx: number; vy: number; }   // unità engine
export interface RollPlan { init: BallState; rest: {x,y}; impacts: number[]; frames: BallState[][]; }
export function simulate(init: BallState, rFrame: number, ballR: number, ms: number): ...
export function planRoll(trialSeed: number, rFrame: number, ballR: number,
                         accept: (rest:{x,y}) => boolean): RollPlan;
```
- Passo fisso `DT = 1000/240` (4 sottopassi per frame a 60fps: **gli stessi che alimentano lo smear**, gratis).
- Riflessione elastica contro il cerchio dell'arena: `RESTITUTION = 0.86`, attrito tangenziale all'urto `MU = 0.06`, attrito di rotolamento `ROLL_DRAG = 1.9 /s`. **Nessuna gravità** (pinball). Nessun ease verso una posizione imposta: `rest` è dove la simulazione si spegne.
- `planRoll`: 256 candidati da `mulberry32(trialSeed)` su (angolo di partenza, modulo, direzione). Si tiene il primo che soddisfa **tutte**:
  1. `|v| < V_EPS (=0.6 u/s)` entro `ROLL_MS + CREEP_MS`, e **non prima** di `ROLL_MS − 1 frame`;
  2. numero di impatti in `[6, 8]` con intervallo minimo 110ms;
  3. `accept(rest)` vero.
- **`accept` include SEMPRE il filtro dell'agente, in TUTTI e tre gli esiti**: `rest` deve cadere in una luna con `depth ≥ 2.2·BALL_R` e `chord ≥ 3·BALL_R`. Se il filtro valesse solo per il crit-fail, la posizione di arresto insegnerebbe la condanna in tre ripetizioni. Questo è il punto in cui la spec può essere sabotata da un'ottimizzazione ingenua: va scritto come commento in maiuscolo nel codice.
- Fallback ordinato se nessun candidato passa (loggare, mai allargare il budget): rilassa (2), poi il quadrante di `rest`, **mai** (1) e **mai** il filtro dell'agente.
- Costo: ~103k passi per prova, <5ms, una volta, fuori dal frame.

### 4.4 `src/ui/skillCheckWebV1/critFail.ts` — NUOVO, PR 3

```ts
export function selectAgent(strands: Strand[], ball: {x,y}, history: number[]): number;
export function turnPose(t: number, agent: Strand, ball: {x,y}): { pts, ball, taut: number };
```
- **Selezione**: distanza punto-polilinea minima, fra i **K=3** più vicini si prende quello la cui normale di trazione ripete meno le ultime **due** occorrenze (anti-clumping, `history`). Deterministico: nessun random decide **se** il filo agguanta — agguanta se e solo se `outcome === 'critfail'`.
- **Agguanto** (4 frame): `depth(t) = d0 · (1 − easeOut3(u))`. La polilinea si rigenera; dal frame in cui interseca il disco della pallina, `ball = punto più vicino sulla polilinea + normale·BALL_R`. Contatto esatto senza una riga di collisioni — e questa volta il contatto **avviene**, perché la pallina è nella luna per costruzione (filtro di §4.3).
- **Trazione** (110ms): la pallina sale alla corda. Corsa = distanza dalla corda ≤ `d0` (20-40 unità nel range tipico). Velocità 2-4× la massima del rotolamento. Smear sub-frame.
- **Impatto** (2 frame): il filo è teso, `taut=1`, la pallina si ferma di colpo, il filo suona un periodo con l'idioma del rinculo esistente. Stinger unico, il suono di successo duckato in 30ms.
- **Nessun rendering speciale**: durante `turn` il filo selezionato resta nel proprio z-order. Un `z` privilegiato è una differenza che qualcuno finirà per applicare un frame troppo presto.

### 4.5 `src/pages/skill-check-web-v1.tsx` — PR 2/3

- `seed: 7` (`:118`) → `seed: hash32(trialSeed)`, `trialSeed` da un contatore incrementato a ogni `replay`, più **checkbox «lucchetto seed»** per l'A/B. Varianza accettata e dichiarata: ai default la densità della tela oscilla (9-12 raggi vivi).
- `rStar` (`:117`): via `effectiveValleyF`, via il commento sulle sacche (`:115-116`).
- Nuovo selettore **Esito**: `success | failure | critfail`, più `casuale (5%)`. Il board **riceve** l'esito.
- `rig`: due famiglie di tacche — `value` da `rOf(v)` (invariante, invariata) e `prob` da **`gradRadii(rFrame, 20, p.graduation)`**, che oggi non è chiamata da nessuno mentre il pannello dichiara il contrario. Il toggle deve cambiare il **board**, non il colore dei bottoni.
- `showStar` (`:363`) cablata: `drawWeb` prende `drawStarLayer: boolean`. Senza, non c'è modo di giudicare se un beat legge senza la risposta disegnata sotto.
- Transport: `ph.name` (`:278`) stampa l'enum outcome-blind. Aggiungere **step-frame ±1** (`1000/60`) e `±1/240`.
- Pannello: mostrare `pShown` come numero primario, `areaProb` come secondario etichettato «geometrica».
- Rimuovere il commento morto a `:116`.

---

## 5. Costanti nuove, valori di partenza

| Costante | Valore | Dove | Note |
|---|---|---|---|
| `CRITFAIL_P` | `0.05` | webEngine | dato, non geometrico |
| `TOTAL_MS` | `5510` | webEngine | invariante nei tre esiti |
| `DIVERGENCE_MS` | `4900` | webEngine | testato |
| `SETTLE_MS` | `500` (era 800) | webEngine | `arm` sovrapposto agli ultimi 120ms |
| `BALL_R` | `clamp(0.06·rFrame, 4.5, 11)` u | ballSim | **compromesso dichiarato**: costante in unità engine la pallina è 1/5 dell'arena a difficoltà 1 |
| `RESTITUTION` | `0.86` | ballSim | se la fisica dà una cadenza diversa da 1.20, **vince la fisica** |
| `MU` | `0.06` | ballSim | attrito tangenziale all'urto |
| `ROLL_DRAG` | `1.9 /s` | ballSim | tarato per spegnersi nel budget |
| `V_EPS` | `0.6 u/s` | ballSim | soglia di arresto |
| `DT` | `1000/240` | ballSim | 4 sottopassi/frame = sub-posizioni dello smear |
| `PRESIM_N` | `256` | ballSim | candidati |
| `TIDE_CLAMP` | `0.985` | adversaryShapes | **salva l'invariante del contenitore** |
| `CHORD_MIN` | `3·BALL_R` | adversaryShapes | obbligatorio a vantaggio estremo |
| `DRAPE_ALPHA` | `0.42` | adversaryShapes | leva primaria contro il rumore visivo |
| `DRAPE_W` | `0.8` px | adversaryShapes | più sottile delle trame vive (0.75) no: **uguale**, è la stessa seta |
| `STUB_LEN` | `clamp(0.10·Δ, 4, 18)` u | adversaryShapes | moncone |
| `STUB_CURL` | `0.35` | adversaryShapes | arricciamento |
| `MIN_SPAN` | `2` u | adversaryShapes | sotto: nub, non cancellazione |
| `SMEAR_SUB` | `4`, alpha `0.12/0.20/0.30` | adversaryShapes | motion blur legale |
| `GRAB_F / IMPACT_F` | `4 / 2` frame | webEngine | **in frame**, non in ms |
| `HAUL_MS` | `110` | webEngine | |
| `AGENT_K` | `3` | critFail | pool di anti-clumping |
| `NO_REPEAT` | `2` | critFail | ultime due occorrenze |

---

## 6. Ordine di disegno (per frame, esplicito)

1. `fillRect` fondo `INK.bg`
2. `drawArena` — disco `INK.field` + righello (valore + probabilità)
3. `drawStar` (clip a `rFrame`, fill + contorno) — **`S.cx/S.cy` mai offsettati**
4. **DRAPPI** (`agentStrands` → `kind:'drape'`), `INK.silkDim`, `DRAPE_ALPHA`
5. **CORDE DEL MOZZO** (`kind:'hubcord'`) — invariate
6. ORDITO vivo — `fillTapered(1.5, 0.9, INK.silk)`
7. **MONCONI** — `fillTapered(0.9, 1.8, INK.silk)`, taper invertito
8. TELAIO (2 passate + nodi)
9. TRAME
10. GOCCE
11. **PALLINA** — 3 sub-posizioni in smear, poi corpo con alone
12. HUD (numero durante `weave…arm`, verbale da `verdict`)

Un solo cambio d'ordine rispetto a oggi: i drappi entrano fra stella e corde del mozzo. Le corde del mozzo e le trame restano dove sono (oggi le corde sono **dopo** le trame: mantenere, per non toccare un read approvato — l'ordine reale è 6→8→9→5→10).

---

## 7. Gate e test eseguibili

**G1 — GATE DI COPERTURA (bloccante, prima di scrivere una riga del beat).** Script Monte Carlo che usa `agentStrands` reale. Per ogni `(stat, diff)` sulla griglia `1..99` passo 7 (196 celle), 200k campioni uniformi in area su `stella ∩ arena`:
`copertura = area(∪ lune con depth ≥ 2.2·BALL_R e chord ≥ 3·BALL_R) / area(stella ∩ arena) ≥ 0.99`.
Se una cella fallisce, **il beat non si scrive**: si aumenta la densità dei drappi (raggruppamento più fine, drappi anche sulle righe di trama inghiottite) e si rimisura. Se copertura e leggibilità non chiudono insieme, torna al Director come scelta, non come taratura silenziosa. *Questo gate è la refutazione R1 trasformata in condizione di merge.*

**T1 — identità pixel prima della divergenza.** Stesso `trialSeed`, stesso piano di rotolamento: il frame renderizzato a `t = 4899` con `outcome='success'` e con `outcome='critfail'` deve essere **identico byte per byte** (`toDataURL` o hash del buffer), e la prima differenza deve cadere a `t = 4900`. Vale anche per la timeline audio. Non giudica il movimento: giudica un'uguaglianza (immune all'anti-pattern 12).

**T2 — contenitore chiuso.** Su 5000 prove `critfail` su griglia: `hypot(ball − centro) ≤ rFrame − BALL_R` in **ogni** frame, per tutta la timeline. Zero eccezioni.

**T3 — invarianti geometrici.** Punte a `rOf(stat)` con errore `0.0e+0`; parità 50.09% a ogni livello; graduazione equal-area scarto 0.000. Da scrivere ora, che non esistono: sono gli invarianti del Director e il repo non li protegge.

**T4 — cardinalità dell'insieme degli agenti.** Per ogni cella della griglia e `starS ∈ {0.6, 0.8, 1.0}`: `agentStrands().length ≥ N/2`, e ogni membro ha almeno un campione dentro `stella ∩ arena`.

**T5 — indistinguibilità della distribuzione di arresto.** 2000 prove per esito: gli istogrammi di `|rest|/rFrame` e di `dist(rest, filo più vicino)` devono coincidere fra `success` e `critfail` (KS, p > 0.2). È il test che smaschera il filtro di §4.3 se qualcuno lo applica solo al crit-fail.

**T6 — invarianza della durata.** `TOTAL_MS` identico per i tre esiti e per ogni combinazione degli slider; durata dello skip identica nei tre esiti.

**T7 — stabilità del PRNG.** Il jitter del telaio, il wobble delle trame e la posizione delle gocce devono essere **bit-identici** al variare di `A.starS` da 0 a 1 a parametri fissi. È il test che chiude R15 per sempre.

---

## 8. Cosa NON è verificabile a fermo-immagine (e va guardato dal Director in movimento)

Il pane del browser congela `requestAnimationFrame` (`visibilityState=hidden` blocca `currentTime` a 0). **Tutto quanto segue va guardato in una finestra reale in primo piano**, o pilotato con lo step-frame a `1/240`. Uno screenshot qui convalida pose, che è l'errore che ha prodotto metà della storia di questo componente.

1. **L'agguanto (4 frame).** Se legge «qualcosa l'ha presa» o «il filo X l'ha presa». Se si distingue *quale* filo, sono troppi frame.
2. **La trazione (110ms) come forza esterna** e non come fisica continuata. Dipende interamente dal rapporto fra la sua velocità e la massima del rotolamento; il numero 2-4× è indovinato.
3. **La qualità dello smear sub-frame.** 4 sub-posizioni con quegli alpha possono leggere come scia o come quattro palline. Non giudicabile a fermo-immagine per definizione.
4. **Il campo dei drappi come detrito o come sporco.** È il rischio numero uno (§9.1) e si vede solo con la stella intera in movimento durante lo sfondamento.
5. **La pallina visibile sopra i drappi.** La pallina è già l'oggetto meno visibile del board e io le ho messo sotto un campo di seta.
6. **I 200ms di respiro.** Il test non è uno screenshot, è la frase che resta: *«ce l'avevo fatta e mi hanno preso»* = giusta; *«la pallina è andata male»* = troppo corta; *«ma era già finito»* = troppo lunga.
7. **L'arresto teso** come stop, e non come «il filo si è cancellato».
8. **La cadenza dei 7 impatti** e la coda di `creep`: se la fisica reale non dà ~1.20, vince la fisica e i 1420ms si ritarano.
9. **La tela con gli stream PRNG separati** — è un beat già approvato che cambia aspetto.
10. **Lo skip** a 180ms: se legge come taglio o come chiusura.

---

## 9. Rischi residui, non addolciti

**9.1 Il campo dei drappi può essere respinto in blocco per estetica, ed è portante.** Sto mettendo inchiostro **sopra la regione di successo**, che è l'unica area pulita del board e dove vive l'oggetto meno visibile che possiede. Se legge come scarabocchio, la silhouette della stella — cioè la promessa (regola 1) — si degrada. E non è rimovibile: senza campo non c'è agente, senza agente non c'è copertura, senza copertura la posizione di riposo torna a essere un oracolo (R1). Le leve sono `DRAPE_ALPHA` e la densità, e **tirano in direzione opposta al gate G1**. Non ho una via d'uscita se G1 richiede densità e l'occhio richiede pulizia: quello sarebbe un vicolo cieco vero, da riportare al Director invece di tararlo di nascosto.

**9.2 Modifico un beat approvato.** Lo sfondamento v11 cambia: nuovi monconi, nuovi drappi, rumore diverso (stream separati), un'unica causa di morte. Il Director ha approvato la versione attuale. La PR 1 va approvata **da sola**, e potrebbe non passare.

**9.3 G1 non è ancora misurato.** Ho un argomento strutturale (complementarità corde/drappi, lune invece di archi) e un ordine di grandezza, non un numero. La refutazione che ha ucciso P1 era esattamente una misura di copertura, e ho il dovere di non ripetere l'errore di P1 che era **non averla fatta**. Se la copertura reale è 85-90%, il filtro di §4.3 diventa visibile («la pallina si ferma sempre vicino a un filo») e T5 fallisce.

**9.4 La conservazione della lunghezza è approssimata e clampata.** `d` è clampato a `rTide − R_CORE`: a vantaggio estremo il lasco in eccesso **sparisce**. Chi va a cercare la seta conservata non la trova. La derivazione fisica che giustifica l'irregolarità è quindi vera nel range medio e retorica agli estremi.

**9.5 A vantaggio estremo il verdetto è solo cattura.** A 99/10 non esiste conferma posizionale: la pallina resta sulla stella, tirata, e il resto lo dice la HUD. È la stessa obiezione che la lente invarianti ha mosso a P3 («il board si svuota e un'etichetta spiega»), e la risolvo solo a metà: il board *mostra* il filo teso e la pallina spostata dal punto di atterraggio, ma non mostra un *fallimento*. Se il Director giudica insufficiente questo read, l'unico rimedio noto è una regione — cioè l'errore vietato.

**9.6 L'arena a difficoltà bassa è troppo piccola per un pinball.** `rOf(1) = 46.4` unità, `rOf(10) = 73.1`. Con `BALL_R` relativo la pallina cambia taglia per prova (accettabile ma discutibile); con `BALL_R` assoluto è una biglia in una tazzina e i 7 impatti non leggono. Ho scelto il relativo e non è una scelta pulita.

**9.7 5510ms per un'azione ripetuta, di cui 3.2s di preambolo.** Ho già speso la leva pulita (`SETTLE 800→500` + sovrapposizione). Non ne ho una seconda che non accorci beat già al pavimento percettivo.

**9.8 Volume di codice nuovo.** La pallina non esiste (grep: 4 occorrenze, tutte in commento). Fra `ballSim`, `critFail`, drappi, monconi, smear e stream PRNG sono ~600 righe nuove, di cui il beat vero è 210ms. Il rischio di schedule è che PR 1 e PR 2 consumino il budget e il beat arrivi non tarato.

**9.9 Rimuovere `VALLEY_CAP` cambia i numeri del pannello ad alto vantaggio** (`vf` da 0.1239 a 0.3675 a 99/1) e toglie l'unico meccanismo che il codice documentava come garanzia di «nessuna vittoria automatica». La garanzia la sostituisce `CRITFAIL_P`, che però **non è sul board**: la promessa capata al 95% vive nel pannello. È coerente con «il crit-fail non è un luogo», ma indebolisce la regola 1 (la promessa esplicita e insistente **sul board**). Punto aperto per il Director.

**9.10 Anti-clumping su K=3.** Con `NO_REPEAT=2` e K=3, in una sequenza sfortunata la scelta si riduce a un solo candidato e la direzione di trazione si ripete. Non c'è random che la salvi (vietato), quindi la ripetizione è possibile per costruzione.