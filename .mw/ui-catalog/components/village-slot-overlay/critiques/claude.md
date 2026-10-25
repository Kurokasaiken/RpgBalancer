# claude — village-slot-overlay (T-002 retry, image-grounded)

Run `20261025-critique-village-slot-overlay`, turn T-002 (retry of T-001).
T-001 (post-only) POSTED 3 images; claude.ai returned provider-side error «Questa risposta non è stata caricata. Riprova» (collect T-001, discarded).
T-002: same verbatim R-282 prompt + 3 shots re-attached in the same
conversation (https://claude.ai/chat/695eda1a-2f2f-401f-b7aa-68cb100bb7c5),
`image_attached: 3`, response below verbatim.

---

Claude ha risposto: Critica del componente "Village scene + pin edifici"
Cercato sul web, memoria letta

Cercato sul web, memoria letta
Critica del componente “Village scene + pin edifici”

Voto: 5/10. La cornice (oro su blu notte, maiuscoletto serif) è coerente, la tripartizione costruito / costruibile / bloccato è l’idea giusta, e ci sono hotkey (R, Esc, frecce). Però il sistema di segnali sopra la scena è a metà. Il giocatore guarda una pittura bellissima, ma non capisce cosa può fare, dove, né cosa conviene fare adesso.

Una nota sulla ricerca: non ho trovato teardown specifici su questo pattern (pin sopra illustrazione in un city builder). Ho quindi applicato le linee guida di accessibilità e di UI per giochi di strategia a quello che vedo negli screenshot.

P0: rompono la leggibilità

1. I medaglioni grandi sono ciechi. I dischi neri da circa 40px (alto-sx, centro-alto, riva in primo piano) e gli scudi a sinistra e in alto a destra non mostrano alcun glifo, solo anello oro e numero. O l’icona non viene renderizzata, o è nero su nero. In entrambi i casi sono i pin più pesanti della scena e quelli che comunicano meno.

2. Due linguaggi di marker in uno. Accanto ai blob pieni ci sono pin minuscoli da 20-30px con parentesi a chevron ai lati, che sembrano frecce di paginazione o gizmo di selezione. Il peso visivo dei pin non segue nessuna gerarchia di gioco: dipende da chi li ha disegnati. La scala “prospettica” (lontano = piccolo) peggiora la cosa, perché i pin delle case in fondo diventano inclickabili.

3. I pin galleggiano, senza ancora. Il disco in alto a sinistra sta nel cielo, ben sopra il tetto. Quello centro-alto sta sugli alberi, quello in primo piano sulla riva. Non c’è stelo, ombra a terra o linea guida, quindi non so a quale edificio appartengano. Se sono edifici non ancora disegnati, la scena non lo dice.

4. Le ellissi tratteggiate sembrano debug. Il tratteggio nero e oro (stile “marching ants”) sulle basi delle case non compare in legenda e non distingue slot liberi, footprint o hitbox. Ne conto cinque, sempre visibili, e fanno rumore sopra un dipinto già pieno di dettaglio.

5. Lo stato mente. Siamo al giorno 2 con Wood 0, Gold 15 e Food a 2/20, −6 al giorno e 0 giorni rimasti. Eppure i pin “+ can be built” sono identici a quelli che potrei davvero costruire. La legenda ha tre stati, ma ne mancano due: costruibile ma non me lo posso permettere e bloccato, e ti dico perché. Peggio ancora, la scena non mi dice quale edificio risolve la fame, e quella è l’unica cosa che conta in questo momento.

6. Contrasto e hit area. Le linee guida Xbox per l’accessibilità sottolineano che la UI di default spesso ha troppo poco contrasto con lo sfondo, ed escludono chi ha ridotta capacità visiva (devdocs.xbox.com). Per sfondi non uniformi dicono di misurare il contrasto contro la zona peggiore, non la media. La Game Accessibility Guidelines consiglia, quando non si può avere uno sfondo piano, contorni e ombre marcati, con un riferimento di 4.5:1 per il testo (gameaccessibilityguidelines.com). Qui la legenda in beige a 11px sta su una pillola semitrasparente sopra erba e fiume, e il badge romano “I/II” è di circa 14px. Per i bersagli, WCAG 2.2 richiede almeno 24×24 CSS px, oppure spazio sufficiente intorno (tabnav.com). Il livello AAA indica 44×44 (disabilityworld.org). I tuoi pin piccoli non arrivano a 44 e, nei cluster centrali, rischiano di non passare nemmeno 24. L’eccezione “essential” citata per i pin di mappa non ti salva, perché qui la dimensione ridotta non è necessaria all’informazione. 
devdocs.xbox.com
 +3


P1: fanno sembrare il prodotto non finito

7. La legenda fa tre lavori in una riga. Mescola tipi (Production / Civic / Defense), stati (I / + / lock) e hint di tastiera (← → · Enter · Esc), tutto a 11px. Il palo della bandiera in basso la attraversa. Gli hint da tastiera dovrebbero comparire solo quando qualcuno usa la tastiera, e non hanno equivalente touch.

8. Bandiere orfane. Le quattro bandierine gialle con palo sottile non sono in legenda. Non capisco se siano arte, punti d’interesse o slot di espansione.

9. I conti non tornano. L’header dice “6 of 16 built”, io sulla scena conto circa 11 pin. “REGISTRY 10” è probabilmente 16−6, ma sembra un badge di notifica. Dove sono gli altri 5 edifici? Il giocatore non lo sa.

10. La scena è un rettangolo incollato. Occupa circa 610px su 900, con bande morte di circa 145px sopra e sotto e tagli netti. I blu e i verdi saturi del dipinto litigano con il navy desaturato della UI. Il cielo enorme e la montagna attirano lo sguardo più di qualsiasi pin.

11. Ridondanza e naming. “VILLAGE” compare nel banner e nel tab attivo in basso. “Registry” è un termine da software, in un gioco fantasy stona. “Ledger” o “Cronaca edifici” sono più diegetici.

P2: rifinitura

12. Dagli screenshot non vedo né hover, né focus ring, né selezione, né tooltip. Se non esistono, sono P0. 13. Il glifo “Civic” con le parentesi è illeggibile a 14px. 14. Tutto è oro su navy: categoria e stato non si distinguono a colpo d’occhio.

Sull’affollamento di icone, le linee guida generali suggeriscono di mostrare di default solo 3-5 elementi critici e rivelare il resto su richiesta (abratabia.com). Avvertono anche che troppe piccole icone indistinguibili diventano un ostacolo, e consigliano tooltip all’hover (wayline.io). Tu mostri tutto, sempre, nella stessa forma. 
abratabia

wayline


Proposta
A. Anatomia del pin: 3 canali, mai sovrapposti
Canale	Codifica	Perché
Categoria	Glifo bianco-pergamena con contorno scuro (e forma del medaglione)	Si legge anche in scala di grigi
Stato	Colore e stile dell’anello	Si scansiona senza leggere
Livello	Pip sotto il disco (●●○)	Più leggibile del numero romano a 14px
Stato	Anello	Disco	Extra
built	Oro pieno	Navy	Pip livello
buildable	Teal	Navy	“+” e costo al hover
unaffordable	Grigio-azzurro	Desaturato	Chip rosso con la risorsa mancante
locked	Grigio scuro	Tratteggio diagonale	Lucchetto e motivo nella card
priorità hero	Pulse sull’anello	Come lo stato	Solo il pin che risolve la crisi attuale
B. Modello dati, con ancoraggio e priorità contestuale

ts
type Category = 'production' | 'civic' | 'defense';
type PinState = 'built' | 'buildable' | 'unaffordable' | 'locked';
type Res = 'gold' | 'wood' | 'food';

interface PinModel {
  id: string;
  name: string;
  category: Category;
  state: PinState;
  level: number;
  maxLevel: number;
  anchor: { x: number; y: number }; // 0..1 sulla scena, punto a terra dell'edificio
  depth: number;                    // 0 lontano .. 1 vicino
  produces?: Res[];
  cost?: Partial<Record<Res, number>>;
  lockReason?: string;
}

export function pinPriority(pin: PinModel, critical: Res | null) {
  if (critical && pin.state === 'buildable' && pin.produces?.includes(critical)) return 'hero';
  if (pin.state === 'locked') return 'quiet';
  return 'normal';
}

// La scala prospettica NON scende mai sotto una soglia usabile
export const pinSize = (depth: number) => Math.round(34 + depth * 14); // 34..48px
C. Componente pin

tsx
export function BuildingPin({ pin, priority, selected, onOpen }: Props) {
  return (
    <button
      className="pin"
      data-category={pin.category}
      data-state={pin.state}
      data-priority={priority}
      aria-pressed={selected}
      aria-label={`${pin.name}, ${STATE_LABEL[pin.state]}${pin.level ? `, livello ${pin.level}` : ''}`}
      style={{
        left: `${pin.anchor.x * 100}%`,
        top: `${pin.anchor.y * 100}%`,
        ['--pin-size' as string]: `${pinSize(pin.depth)}px`,
      }}
      onClick={() => onOpen(pin.id)}
    >
      <span className="pin__stem" aria-hidden />
      <span className="pin__disc"><Glyph name={pin.category} /></span>
      <span className="pin__pips" aria-hidden>
        {Array.from({ length: pin.maxLevel }, (_, i) => <i key={i} data-on={i < pin.level} />)}
      </span>
    </button>
  );
}

css
.pin {
  --pin-size: 40px;
  --ink: #0b1a24; --parch: #f4e7c3;
  --ring: #e2b94f;
  position: absolute;
  width: var(--pin-size); height: var(--pin-size);
  transform: translate(-50%, calc(-100% - 10px)); /* la punta dello stelo cade sull'ancora */
  padding: 0; border: 0; background: none; cursor: pointer;
}
/* hit area >= 44px, indipendente dalla grafica */
.pin::before {
  content: ""; position: absolute; left: 50%; top: 50%;
  width: max(44px, 100%); height: max(44px, 100%);
  transform: translate(-50%, -50%);
}
.pin__disc {
  position: absolute; inset: 0; border-radius: 50%; color: var(--parch);
  background: radial-gradient(circle at 35% 28%, #1c3a4b, var(--ink));
  box-shadow:
    0 0 0 2px var(--ring),            /* anello di stato */
    0 0 0 4px rgb(0 0 0 / .55),       /* alone scuro: stacca dal dipinto */
    0 8px 12px rgb(0 0 0 / .45);      /* ombra: lo "appoggia" alla scena */
}
.pin__disc svg { width: 58%; height: 58%; margin: 21%; filter: drop-shadow(0 1px 0 #000); }
.pin__stem {
  position: absolute; left: 50%; top: 100%; width: 2px; height: 10px;
  background: var(--ring); transform: translateX(-50%);
}
.pin__pips { position: absolute; top: calc(100% + 12px); left: 50%; display: flex; gap: 3px; transform: translateX(-50%); }
.pin__pips i { width: 6px; height: 6px; border-radius: 50%; background: #0b1a24; box-shadow: 0 0 0 1px var(--ring); }
.pin__pips i[data-on="true"] { background: var(--ring); }


.pin[data-state="built"]        { --ring: #e2b94f; }
.pin[data-state="buildable"]    { --ring: #4fd1c5; }
.pin[data-state="unaffordable"] { --ring: #8a9aa3; }
.pin[data-state="unaffordable"] .pin__disc svg { opacity: .6; }
.pin[data-state="locked"]       { --ring: #4a5560; }
.pin[data-state="locked"] .pin__disc {
  background: repeating-linear-gradient(45deg, #101c25 0 4px, #16262f 4px 8px);
}

.pin[data-priority="hero"] .pin__disc { animation: hero 1.6s ease-out infinite; }
@keyframes hero {
  from { box-shadow: 0 0 0 2px var(--ring), 0 0 0 4px rgb(0 0 0 / .55), 0 0 0 0 rgb(79 209 197 / .7); }
  to   { box-shadow: 0 0 0 2px var(--ring), 0 0 0 4px rgb(0 0 0 / .55), 0 0 0 22px rgb(79 209 197 / 0); }
}
@media (prefers-reduced-motion: reduce) {
  .pin[data-priority="hero"] .pin__disc { animation: none; outline: 3px solid var(--ring); outline-offset: 5px; }
}
.pin:focus-visible .pin__disc { outline: 3px solid #fff; outline-offset: 5px; }
D. Footprint solo quando serve, al posto delle ellissi

css
.slot .footprint {
  position: absolute; left: var(--fx); top: var(--fy);
  width: var(--fw); height: var(--fh); transform: translate(-50%, -50%);
  border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .15s;
  background: radial-gradient(closest-side, rgb(79 209 197 / .30), transparent 72%);
  box-shadow: inset 0 0 0 1.5px rgb(79 209 197 / .85);
}
.slot:is(:hover, :focus-within, [data-selected="true"]) .footprint { opacity: 1; }
E. Legenda trasformata in filtri di livello

I giocatori di Factorio hanno chiesto esplicitamente di separare gli overlay sul campo per ridurre il rumore visivo (forum Factorio). Stesso principio: la legenda diventa interattiva, e quando serve isola una categoria. 
factorio



tsx
function LayerChips({ active, counts, onToggle }: LayerProps) {
  return (
    <div role="group" aria-label="Livelli del villaggio" className="layers">
      {(['production', 'civic', 'defense'] as const).map(c => (
        <button key={c} aria-pressed={active.has(c)} onClick={() => onToggle(c)}>
          <Glyph name={c} /> {LABEL[c]} <b>{counts[c]}</b>
        </button>
      ))}
    </div>
  );
}

// Hint tastiera: solo dopo il primo uso della tastiera
function useKeyboardMode() {
  const [kbd, setKbd] = useState(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => (e.key === 'Tab' || e.key.startsWith('Arrow')) && setKbd(true);
    const off = () => setKbd(false);
    addEventListener('keydown', on);
    addEventListener('pointerdown', off);
    return () => { removeEventListener('keydown', on); removeEventListener('pointerdown', off); };
  }, []);
  return kbd;
}
F. Card hover/focus con costo “onesto”

tsx
<PinCard pin={pin}>
  <h3>{pin.name}</h3>
  <small>{LABEL[pin.category]} · Liv. {pin.level} → {pin.level + 1}</small>
  {pin.produces && <p className="gain">+3 {pin.produces[0]}/giorno</p>}
  <ul className="cost">
    {Object.entries(pin.cost ?? {}).map(([r, n]) => (
      <li key={r} data-short={have[r as Res] < n}>
        <ResIcon r={r as Res} /> {n} {have[r as Res] < n && <em>−{n - have[r as Res]}</em>}
      </li>
    ))}
  </ul>
  {pin.state === 'locked'
    ? <p className="lock">Si sblocca con: {pin.lockReason}</p>
    : <button disabled={pin.state === 'unaffordable'}>Costruisci</button>}
</PinCard>
G. Integrare la scena nella UI

css
.stage { position: relative; aspect-ratio: 2.36 / 1; width: 100%; }
.stage__art {
  width: 100%; height: 100%; object-fit: cover; display: block;
  mask-image: linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent);
  transition: filter .4s;
}
/* vignetta: la UI e la scena condividono la stessa "luce" */
.stage::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(120% 90% at 50% 50%, transparent 55%, rgb(3 10 16 / .75));
}
/* con una crisi attiva, lo sfondo cede il passo al pin hero */
.stage[data-has-hero="true"] .stage__art { filter: saturate(.85) brightness(.9); }
H. Navigazione spaziale, non lineare

ts
function nextPin(pins: PinModel[], cur: PinModel, dir: 'left'|'right'|'up'|'down') {
  const v = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
  return pins
    .filter(p => p !== cur)
    .map(p => {
      const dx = p.anchor.x - cur.anchor.x, dy = p.anchor.y - cur.anchor.y;
      const d = Math.hypot(dx, dy);
      return { p, d, cos: (dx * v[0] + dy * v[1]) / d };
    })
    .filter(o => o.cos > 0.5)                            // cono di ~60°
    .sort((a, b) => a.d * (2 - a.cos) - b.d * (2 - b.cos))[0]?.p ?? cur;
}
Ordine di lavoro
Subito (P0): rendere visibili i glifi, rimuovere le ellissi permanenti, scegliere una sola famiglia di pin, hit area 44px, alone scuro e ombra su ogni pin.
Poi: stati unaffordable e locked con motivo, pin hero legato alla risorsa critica, card hover con costi.
Dopo: chip di livello al posto della legenda, hint tastiera condizionali, mask e vignetta sulla scena, spiegare o eliminare le bandiere, allineare conteggi e naming.

Se vuoi, ti costruisco un prototipo HTML interattivo di questo sistema di pin sopra una scena mock, con i tuoi stati e la crisi cibo, così lo giudichi dal vivo prima di toccare il codice vero.






ora
