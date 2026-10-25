# claude — materic-roster-component-v2 (T-001 refill su run -r2, image-grounded)

Run `20261025-critique-materic-roster-component-v2-r2` (run fresh: il
binding del run originale era avvelenato su `claude.ai/new`), turn T-001,
prompt verbatim R-282, 5 shot allegati (default-ctx-a, default-iso-0,
default-iso-1, party-pick-ctx-a, party-pick-iso-0). POSTED 12:43 CET →
collect SUCCESS (~12.7k chars). Conversazione:
https://claude.ai/chat/63c84c9c-bdfa-43fc-b362-25deb86404be.

T-001 del run originale (mattina): POSTED 5 img su claude.ai/new, collect
FAILED «did not stabilize» — rate limit piano free, reset 12:20.

---

## Risposta T-001 (verbatim)

Claude ha risposto: Ho fatto una ricerca rapida su pattern di party/roster nei giochi e sulle linee guida di leggibilità, poi ho guardato i tuoi screenshot (isolato e in contesto …
Cercato sul web

Cercato sul web

Ho fatto una ricerca rapida su pattern di party/roster nei giochi e sulle linee guida di leggibilità, poi ho guardato i tuoi screenshot (isolato e in contesto accanto alla Quest Window).

Cosa dice la ricerca
Le guide di settore indicano un minimo di circa 16pt per il testo in gioco e un contrasto di almeno 3:1 per componenti UI e testo grande (accepted minimum 16pt, 3:1 contrast). Per un titolo desktop si può scendere, ma non a 9px. 
outlookindia

Il principio ricorrente è mostrare meno e comunicare di più, con la gerarchia visiva che guida l’occhio verso ciò che conta per primo. 
generalistprogrammer

Le lamentele storiche sui party list (FFXIV) sono sempre le stesse: lista troppo piccola, poca informazione per membro, impossibilità di riordinare i membri. Il tuo roster ricade in tutte e tre. 
square-enix

Critica spietata

1. Il componente non sa quanti elementi ha. L’header dice “6/6”, le righe visibili sono 4, e della quinta si vede una sliver tagliata sul fondo. Non c’è scrollbar, non c’è fade, non c’è “+2”. Il giocatore pensa che il roster finisca lì. È il bug più grave, perché nasconde dati e non lo segnala.

2. L’header è una barra di sei bottoni uguali. Filtro, ordinamento, direzione, densità, minimizza, chiudi: tutti pillole/cerchi con lo stesso peso. “Chiudi” sta a 8px da “densità”. Il bottone di direzione sembra disabilitato, ma non si capisce se lo è. La label del dropdown di ordinamento è troncata a “:”, quindi non so nemmeno per cosa sto ordinando. Sono 340px di UI che dicono poco e rischiano click sbagliati.

3. “6/6” è ambiguo. È capienza, disponibili, in gruppo? Per un roster che alimenta la Quest Window l’unico numero che conta è quanti eroi sono disponibili adesso.

4. Il ritratto è sacrificato. Il badge “LV 4” si mangia mezzo avatar da ~24px. L’avatar è l’ancora visiva principale di una riga di personaggio e qui è un francobollo coperto. Bertoldo non ha badge: se è voluto (NPC? senza livello?) non si legge, se è un bug è un bug.

5. Le barre sono rumore. Sono linee da 1–2px, senza icona né etichetta: quale è HP e quale è l’altra risorsa? Il significato è affidato solo al colore (verde/oro), che è fragile per il daltonismo. I numeri sono ~9px. Soprattutto, tutti sono al 100%: stai disegnando 8 barre piene e 8 coppie di “100/100” per dire “tutto ok”. Informazione a costo massimo e valore zero.

6. Mancano le informazioni che servono davvero. Classe/ruolo, stato (libero, in missione, ferito, in riposo), idoneità alla quest selezionata. Nello screenshot in contesto il roster accanto alla Marching Order non dice chi posso trascinare negli slot. Tra nome e barre c’è un buco orizzontale di ~100px che potrebbe contenere esattamente queste cose.

7. Nessuna affordance di interazione. Non si vede grip di drag, stato hover/selected/disabled, né drop target feedback. Se le righe sono trascinabili sugli slot, il design non lo dice.

8. Cornici dentro cornici. Bordo oro esterno, bordo teal interno, bordo su ogni riga. Tre livelli di contorno su un pannello da 340px. L’ornamento mangia il contrasto che servirebbe ai dati, e il pannello sembra “decorato” invece che “funzionale”.

9. In contesto sparisce. Nella Quest Window i tre pannelli hanno lo stesso peso visivo, quindi l’occhio non sa dove andare. Il roster è lo strumento di input, il centro è il lavoro in corso, la destra è la lettura: dovrebbero avere pesi diversi.

Proposta

Struttura. Header a due zone: a sinistra titolo + conteggio utile (“Roster · 4 disponibili”), a destra solo i controlli di finestra, separati. Filtro e ordinamento passano in una sotto-barra, con ordinamento e direzione fusi in un unico controllo che mostra la label per esteso (“Livello ↓”). Densità va in overflow.

Riga. Altezza minima 48px, ritratto 40px con il livello come chip fuori dal volto, nome + riga meta (ruolo e stato), e vitali a destra. I numeri compaiono solo se il valore non è pieno, oppure in hover/focus/selezione.

Lista. Scroll vero con scrollbar sottile, fade in basso quando c’è altro contenuto, e altezza che termina su una riga intera.

Codice (React + CSS)

tsx
// RosterPanel.tsx
import { useEffect, useRef, useState } from "react";

type Status = "idle" | "questing" | "injured" | "resting";
export interface Member {
  id: string; name: string; portrait: string;
  level?: number; role: string; status: Status;
  hp: { cur: number; max: number };
  res: { cur: number; max: number };
}

const STATUS_LABEL: Record<Status, string> = {
  idle: "Libero", questing: "In missione", injured: "Ferito", resting: "Riposo",
};

function Meter({ kind, cur, max, label }: {
  kind: "hp" | "res"; cur: number; max: number; label: string;
}) {
  const pct = Math.round((cur / max) * 100);
  const low = pct <= 30;
  return (
    <div className={`meter meter--${kind}`} data-low={low || undefined}
         role="meter" aria-label={label}
         aria-valuemin={0} aria-valuemax={max} aria-valuenow={cur}>
      <i className="meter__icon" aria-hidden />
      <div className="meter__track"><div className="meter__fill" style={{ width: `${pct}%` }} /></div>
      {/* numeri solo quando portano informazione */}
      <span className="meter__num" data-always={cur < max || undefined}>{cur}/{max}</span>
    </div>
  );
}


function RosterRow({ m, selected, onSelect }: {
  m: Member; selected: boolean; onSelect: () => void;
}) {
  const unavailable = m.status === "questing" || m.status === "injured";
  return (
    <li role="option" aria-selected={selected} aria-disabled={unavailable}
        data-status={m.status} className="rr" tabIndex={0}
        draggable={!unavailable} onClick={onSelect}>
      <span className="rr__grip" aria-hidden />
      <div className="rr__portrait">
        <img src={m.portrait} alt="" />
        {m.level != null && <span className="rr__lv">{m.level}</span>}
      </div>
      <div className="rr__id">
        <span className="rr__name">{m.name}</span>
        <span className="rr__meta">
          <i className={`role role--${m.role}`} aria-hidden />
          <span className="chip" data-status={m.status}>{STATUS_LABEL[m.status]}</span>
        </span>
      </div>
      <div className="rr__vitals">
        <Meter kind="hp"  label="Salute"   cur={m.hp.cur}  max={m.hp.max} />
        <Meter kind="res" label="Stamina"  cur={m.res.cur} max={m.res.max} />
      </div>
    </li>
  );
}

export function RosterPanel({ members }: { members: Member[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const [sel, setSel] = useState<string | null>(null);


  useEffect(() => {
    const el = listRef.current!;
    const check = () => setScrollable(el.scrollHeight - el.clientHeight > 1 &&
      el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check); ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  }, [members.length]);

  const free = members.filter(m => m.status === "idle").length;

  return (
    <section className="roster" aria-label="Roster">
      <header className="roster__head">
        <h2>Roster <small>{free} disponibili / {members.length}</small></h2>
        <div className="roster__win">{/* minimize, close — soli, a destra */}</div>
      </header>
      <div className="roster__tools">{/* FilterMenu + SortMenu ("Livello ↓", label sempre intera) */}</div>
      <ul ref={listRef} role="listbox" className="roster__list" data-more={scrollable || undefined}>
        {members.map(m => (
          <RosterRow key={m.id} m={m} selected={sel === m.id} onSelect={() => setSel(m.id)} />
        ))}
      </ul>
    </section>
  );
}

css
/* roster.css */
.roster{
  --row-h: 52px;
  --gap: 4px;
  --c-hp: #5fcf7a;  --c-res: #e0b341;  --c-low: #ff5a4d;
  --c-text: #e9e4d2; --c-text-dim: #a9b3b0;      /* >= 4.5:1 su fondo pannello */
  display:flex; flex-direction:column;
  /* altezza = N righe intere, mai righe tagliate */
  max-height: calc(var(--row-h) * 5 + var(--gap) * 4 + 96px);
  background: rgb(8 24 30 / .94);
  border: 1px solid #c79a3a;               /* UNA sola cornice */
  border-radius: 8px;
}

.roster__list{
  list-style:none; margin:0; padding:6px 8px;
  display:flex; flex-direction:column; gap:var(--gap);
  overflow-y:auto; scrollbar-width:thin; scrollbar-gutter:stable;
  scroll-snap-type:y proximity;
}
/* fade + hint solo se c'è altro contenuto sotto */
.roster__list[data-more]{
  -webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 28px),transparent);
          mask-image:linear-gradient(to bottom,#000 calc(100% - 28px),transparent);
}

.rr{
  display:grid; grid-template-columns: 12px 40px 1fr 140px; align-items:center;
  gap:10px; min-height:var(--row-h); padding:6px 8px;
  border-radius:6px; background:rgb(255 255 255 / .03);   /* niente bordo per riga */
  scroll-snap-align:start; cursor:grab;
}

.rr:hover{ background:rgb(255 255 255 / .07); }
.rr[aria-selected="true"]{ background:rgb(199 154 58 / .16); box-shadow:inset 2px 0 0 #c79a3a; }
.rr:focus-visible{ outline:2px solid #fff; outline-offset:1px; }
.rr[aria-disabled="true"]{ opacity:.55; cursor:not-allowed; }
.rr__grip{ width:6px; height:18px; opacity:.35;
  background:radial-gradient(circle,currentColor 1px,transparent 1.5px) 0 0/6px 6px; }

.rr__portrait{ position:relative; width:40px; height:40px; }
.rr__portrait img{ width:100%; height:100%; border-radius:50%; object-fit:cover; }
.rr__lv{ position:absolute; right:-6px; bottom:-4px; min-width:18px; padding:0 4px;
  font:700 11px/16px var(--font-ui); text-align:center; border-radius:9px;
  background:#0b1c22; border:1px solid #c79a3a; color:#f2d17a; }

.rr__name{ font:600 15px/1.2 var(--font-display); color:var(--c-text);
  letter-spacing:.04em; text-transform:uppercase; }
.rr__meta{ display:flex; gap:6px; align-items:center; font-size:12px; color:var(--c-text-dim); }
.chip{ padding:1px 6px; border-radius:4px; border:1px solid currentColor; }
.chip[data-status="idle"]{ color:#7ad3b0; }
.chip[data-status="questing"]{ color:#8fb4ff; }
.chip[data-status="injured"]{ color:var(--c-low); }

/* Vitali: spesse abbastanza da leggere, numeri solo se utili */
.rr__vitals{ display:grid; gap:5px; }
.meter{ display:grid; grid-template-columns:14px 1fr auto; align-items:center; gap:6px; }
.meter__track{ height:6px; background:rgb(255 255 255 / .12); border-radius:3px; overflow:hidden; }
.meter--res .meter__track{ height:4px; }
.meter__fill{ height:100%; background:var(--c-hp); transition:width .25s; }
.meter--res .meter__fill{ background:var(--c-res); }
/* low HP: colore + PATTERN, non solo colore (a11y daltonismo) */
.meter[data-low] .meter__fill{
  background:repeating-linear-gradient(45deg,var(--c-low) 0 4px,#8f2820 4px 8px);
}

.meter__num{ font:500 11px/1 var(--font-mono); color:var(--c-text-dim);
  opacity:0; transition:opacity .12s; min-width:5.5ch; text-align:right; }
.meter__num[data-always],
.rr:hover .meter__num, .rr:focus-visible .meter__num,
.rr[aria-selected="true"] .meter__num{ opacity:1; }

@media (prefers-reduced-motion:reduce){ .meter__fill,.meter__num{ transition:none; } }
Dettagli che alzano il livello
Drag feedback: mentre trascini, gli slot compatibili della Marching Order si illuminano e quelli per cui l’eroe è inadatto si spengono con una ragione (“Troppo ferito”).
Idoneità alla quest: con una quest aperta, ogni riga mostra un indicatore di fit (es. STR/PER rispetto alle KEY STATS) invece di costringere a ricordarselo a mente.
Ordinamento sticky: ricorda l’ultimo criterio per sessione, e lascia riordinare a mano (è la lamentela n.1 dei party list).
Gerarchia tra pannelli: il roster resta a bassa opacità/senza glow finché non c’è un drag in corso; il pannello centrale tiene il peso visivo.
Scala testo: nome 15px, meta 12px, numeri 11px come minimo, con un setting di scala UI globale.
Priorità
P0: scroll con fade e altezza a righe intere (bug di dati nascosti), label del sort non troncata.
P1: ritratto leggibile con livello fuori dal volto, barre da 6px con icona, numeri condizionali, stato e ruolo.
P1: header riorganizzato, finestra separata dai controlli di lista.
P2: una sola cornice, stati hover/selected/disabled, grip e feedback di drag.

Se mi passi il CSS/markup attuale e i token di ART-DIRECTION, adatto lo snippet ai tuoi valori reali (font, colori, spaziature) invece di quelli di esempio.






ora
