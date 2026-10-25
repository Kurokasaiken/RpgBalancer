# claude — village-building-tooltip (T-002 refill, image-grounded)

Run `20261025-critique-village-building-tooltip-r2`, turn T-002 (critique-refill dopo il reset quota delle 17:20),
prompt verbatim R-282, shot allegati (default-ctx-a, default-iso-0), POSTED+collect SUCCESS
(~12k chars). Conversazione: https://claude.ai/new.

Run fresh -r2. T-001 (12:57) POSTED ma quota gia' ricappata (reset 17:20) — draft mai sottomesso; T-002 e' il refill.

---

## Risposta T-002 (verbatim)

Claude ha risposto: Parto con una ricerca rapida su best practice e riferimenti di genere, poi ti do la critica.
Reviewing UI component images to critique.
Reviewing UI component images to critique.

Parto con una ricerca rapida su best practice e riferimenti di genere, poi ti do la critica.

Cercato sul web

Cercato sul web

Ho letto i due componenti nei crop: il pannello Events (immagine 2) e la card Warehouse (immagine 4). Se intendevi solo uno dei due, la parte che ti serve è comunque separata.

Cosa dice la ricerca (e dove ti colpisce)
Se un bottone deve essere disabilitato, va sempre spiegato perché, indicando la condizione che lo sblocca. Altre linee guida chiedono che l’interfaccia circostante dica che cosa serve all’utente per attivare il componente. 
basis

joinhomebase

I tooltip sui bottoni disabilitati non sono affidabili, perché questi non ricevono il focus e i tooltip non sono disponibili su tutti i dispositivi. Quindi la spiegazione deve essere testo visibile, non hover. 
vonage

Nei gestionali/RTS la convenzione consolidata è che un costo che non puoi permetterti mostra in rosso il numero della risorsa insufficiente. 
github

Per gli empty state, la guida di Unity dice che devono prevenire la confusione e dire all’utente cosa fare dopo. 
unity

Critica spietata
A. Events panel
Controlli vivi su un contenuto morto. Con 0 eventi mostri “DUE”, “TYPE” e “X”. Filtri che non filtrano niente sono rumore, e i pill sono più forti visivamente del contenuto.
Spazio nobile sprecato. Occupa il top-center della mappa, la zona più preziosa, per dire “non c’è niente”. Copre anche il terreno, e ha lo stesso telaio dorato dell’HUD, quindi compete con le risorse per importanza.
“DUE” e “TYPE” sono ambigui. Sono filtri, ordinamenti o toggle? “DUE” è attivo (teal) ma non si capisce cosa sia attivo. Servono un’etichetta di gruppo e uno stato esplicito.
Il contatore è un numero nudo. “EVENTS 0” in small caps minuscole spaziate: nessun badge, nessun cambio di stato quando arriva un evento.
La X è una trappola. Cosa succede dopo averla premuta? Non c’è nulla che dica come riaprire il pannello.
Il testo non è un empty state. “Nothing on the horizon.” ha un buon tono, ma non dice nulla di utile (quando arriva il prossimo evento? cosa lo scatena?). Va bene come flavor, non come informazione.
Nessun segnale che il pannello è un feed. Non c’è aria-live visibile nel comportamento: un evento che arriva deve essere annunciato, altrimenti il giocatore non se ne accorge.
B. Warehouse card
Costi senza stato di affordability (grave). Dall’HUD si vede legno 0 e cibo 0, ma i costi 80 / 25 / 60 sono tutti neutri. Il giocatore deve fare il confronto a mente.
Il bottone UPGRADE è muto. Disabilitato, a contrasto bassissimo, con “preview only” in corsivo minuscolo su due righe. Non si capisce se manchino le risorse, se sia un build di prova o se la feature non esista. È gergo da sviluppatore che trapela nella UI.
Icone dei costi indistinguibili a 16 px. Tre sagome marroni/dorate quasi identiche, senza label. Il colore è l’unico discriminante, quindi anche un problema di accessibilità.
“LV II/III” + “24 → 48” mescola stato attuale e anteprima. Il livello mostrato è quello corrente, ma l’effetto è quello del prossimo, senza etichettarlo. In più “Effect: Storage capacity:” è ridondante e manca il delta (+24).
“OPEN WAREHOUSE” va a capo dentro il bottone. Due righe, line-height scorretto, e il bottone primario ha altezza diversa dal secondario accanto. Basta “Open”.
Pin e Close sono due cerchi uguali e adiacenti. Il pin teal pieno sembra l’azione primaria della card, e non spiega né cosa fa né se è attivo. Rischio di mis-click, specie su touch.
Icona d’intestazione ambigua. Il quadrato con la X accanto al titolo si legge come “annulla/errore”, ed è vicino alla X di chiusura. Non coincide nemmeno con l’icona della riga nel Registry.
Gerarchia tipografica da 5 stili in 220 px. Small caps, sottotitolo grigio, serif bianco, grassetto dorato, corsivo. Il flavor text sta sopra i dati, quando in una card di utilità i dati vengono prima.
Trasparenza che sporca la leggibilità. Dietro il testo si intravede un glifo (scudo) del layer sottostante.
Ancoraggio assente. Nessuna coda o linea verso l’edificio, e la card galleggia vicino al Registry. Inoltre Esc ha tre significati nella stessa schermata: “Esc to close”, “Esc map” e la X della card. Quale chiude cosa?

Cosa funziona: la coerenza del telaio con l’HUD, il tono del copy, i numeri romani come identità del gioco e la chiara separazione tra azione primaria e secondaria. L’impianto è giusto, la mancanza è di informazione di stato.

Soluzioni
1. Events: collasso quando è vuoto, filtri solo quando servono

tsx
// EventFeed.tsx
type GameEvent = { id: string; kind: 'due' | 'weather' | 'trade' | 'threat'; text: string; dueIn?: number };

export function EventFeed({ events }: { events: GameEvent[] }) {
  const [filter, setFilter] = useState<'all' | GameEvent['kind']>('all');
  const [open, setOpen] = useState(false);
  const count = events.length;
  const shown = filter === 'all' ? events : events.filter(e => e.kind === filter);

  // Vuoto: solo un chip discreto, nessun filtro, nessuna X
  if (count === 0 && !open) {
    return (
      <button className="event-chip" onClick={() => setOpen(true)} aria-label="Events, none pending">
        <BellIcon /> <span>Quiet</span>
      </button>
    );
  }

  return (
    <section className="event-feed" aria-label="Events">
      <header>
        <h2>Events</h2>
        <span className={`badge ${count ? 'badge--active' : ''}`}>{count}</span>

        {count >= 3 && ( // i filtri appaiono solo se hanno senso
          <div role="radiogroup" aria-label="Filter events" className="seg">
            {(['all', 'due', 'threat'] as const).map(k => (
              <button key={k} role="radio" aria-checked={filter === k}
                      className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>
                {k === 'all' ? 'All' : k === 'due' ? 'Due soon' : 'Threats'}
              </button>
            ))}

          </div>
        )}
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Collapse events (E)">
          <ChevronUpIcon />
        </button>
      </header>

      <ul aria-live="polite">
        {shown.length === 0
          ? <li className="empty">Quiet seas. Next trader expected in ~3 days.</li>
          : shown.map(e => <li key={e.id}>{e.text}</li>)}
      </ul>
    </section>
  );
}

css
.event-chip { /* 28px di altezza, ancorato al bordo, non copre la mappa */
  display:inline-flex; gap:6px; align-items:center;
  padding:4px 10px; border-radius:999px;
  background:var(--ui-surface-2); color:var(--ui-text-dim);
  border:1px solid var(--ui-line-subtle);
}
.badge--active { background:var(--ui-accent); color:#0b1a1f; animation:pop .25s ease-out; }
@keyframes pop { from { transform:scale(.6) } to { transform:scale(1) } }

La X diventa “collassa” (chevron) e il chip resta sempre per riaprire. Quando arriva un evento, il chip si espande da solo con il badge animato.

2. Warehouse: modello dei blocchi + costi con have/need

ts
// upgrade.ts: la UI non decide perché è bloccato, lo dice il dominio
export type Blocker =
  | { type: 'resource'; res: Res; need: number; have: number }
  | { type: 'maxLevel' }
  | { type: 'busy'; daysLeft: number }
  | { type: 'locked'; requires: string };

export function getUpgradeBlockers(b: Building, stock: Stock): Blocker[] {
  const out: Blocker[] = [];
  if (b.level >= b.maxLevel) return [{ type: 'maxLevel' }];
  if (b.construction) out.push({ type: 'busy', daysLeft: b.construction.daysLeft });
  for (const [res, need] of Object.entries(b.nextCost) as [Res, number][]) {
    const have = stock[res] ?? 0;
    if (have < need) out.push({ type: 'resource', res, need, have });
  }
  return out;
}

tsx
// CostRow.tsx
export function CostRow({ costs, days }: { costs: Cost[]; days: number }) {
  return (
    <ul className="cost-row" aria-label="Upgrade cost">
      {costs.map(({ res, need, have }) => {
        const short = have < need;
        return (
          <li key={res} className={short ? 'cost is-short' : 'cost'}>
            <ResIcon res={res} size={20} title={RES_LABEL[res]} />
            <span className="cost__val">{short ? `${have}/${need}` : need}</span>
            {short && <WarnDot aria-hidden />}  {/* non solo colore */}
            <span className="sr-only">{RES_LABEL[res]}{short ? `, short by ${need - have}` : ''}</span>
          </li>
        );
      })}
      <li className="cost cost--time"><ClockIcon size={16} /> {days}d</li>
    </ul>
  );
}
3. Bottone con motivo sempre visibile (niente tooltip su disabled)

tsx
export function UpgradeAction({ building, stock, onUpgrade }: Props) {
  const blockers = getUpgradeBlockers(building, stock);
  const blocked = blockers.length > 0;
  const reason = describeBlockers(blockers); // "Need 80 wood · 25 stone"
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (!blocked) return onUpgrade(building.id);
    ref.current?.animate([{ transform:'translateX(-3px)' }, { transform:'translateX(3px)' }, { transform:'none' }],
                         { duration: 180 });
    highlightMissingCosts(blockers); // fa pulsare le voci rosse nella CostRow
  };

  return (
    <div className="upgrade">
      <button ref={ref} className="btn btn--secondary" aria-disabled={blocked}
              aria-describedby="upgrade-why" onClick={handleClick}>
        Upgrade
      </button>
      {blocked && <p id="upgrade-why" className="why">{reason}</p>}
    </div>
  );
}

aria-disabled al posto di disabled mantiene il focus e il click (che spiega, invece di non fare nulla).

4. Card: layout e gerarchia

┌───────────────────────────────────┐
│ [icona]  WAREHOUSE        ⌖   ✕   │
│          Civic · Level II of III  │
├───────────────────────────────────┤
│ Storage     24 → 48     (+24)     │  ← dati prima
│ ─────────────────────────────────│
│ 🪵 0/80   🪨 25   🌾 0/60   ⏱ 4d │  ← rosso + puntino se manca
│ Need 80 wood · 60 food            │  ← motivo, testo visibile
│ [ Upgrade ]        [   Open   ]   │
│ "Keeps the village's stock…"      │  ← flavor in fondo, corsivo dim
└───────────────────────────────────┘

css
:root {
  --ui-text: #f1e9d2;           /* 4 stili tipografici totali */
  --ui-text-dim: #b9b19a;       /* contrasto >= 4.5:1 sul fondo card */
  --ui-danger: #ff7a6b;
  --ui-accent: #3fd0c9;
}
.card { background: rgb(8 24 30 / .96); } /* quasi opaca: niente glifi che trasparono */
.card__title { font: 600 14px/1.2 var(--font-display); letter-spacing:.08em; text-transform:uppercase; }
.card__meta  { font: 400 12px/1.2 var(--font-body); color:var(--ui-text-dim); }
.stat        { font: 600 15px/1.3 var(--font-body); font-variant-numeric: tabular-nums; }
.cost.is-short .cost__val { color:var(--ui-danger); text-decoration: underline dotted; }
.why   { font:400 12px/1.3 var(--font-body); color:var(--ui-danger); margin:4px 0 0; }
.btn   { min-height:36px; min-width:96px; white-space:nowrap; } /* mai a capo */
.btn[aria-disabled="true"] { opacity:.6; cursor:not-allowed; } /* leggibile, non fantasma */
.icon-btn { width:32px; height:32px; }
.icon-btn + .icon-btn { margin-inline-start:12px; } /* separa pin e close */
@media (pointer:coarse) { .icon-btn, .btn { min-height:44px; min-width:44px; } }

Altri interventi veloci:

Pin: icona che cambia (contorno → pieno) e aria-pressed, con label “Pin card”.
Icona header: usa la stessa icona del Registry per il Warehouse, mai una X.
Esc: una sola regola a pila (“chiude il layer più alto”), mostrata nel footer di quel layer.
Ancoraggio: una coda o linea tratteggiata dalla card all’edificio selezionato, per evitare la card galleggiante.
Priorità
#	Fix	Impatto	Costo
1	Costi con have/need e rosso + segnale non-colore	Altissimo	Basso
2	Motivo del blocco visibile sul bottone Upgrade, eliminare “preview only”	Altissimo	Basso
3	Events collassato quando vuoto, filtri condizionali	Alto	Medio
4	Un solo livello di tipografia/gerarchia nella card	Medio	Basso
5	Pin/Close separati, label bottone su una riga, icona header	Medio	Basso
6	Ancoraggio + gestione Esc a pila	Medio	Medio

Se mi dici il framework reale (React puro, Pixi per il canvas, ecc.) e i token che hai già, posso adattare il codice al tuo design system e alle tue variabili.






3 minuti fa
