# claude — tuning-panel (T-003 refill, image-grounded)

Run `20261025-critique-tuning-panel`, turn T-003 (critique-refill dopo il
reset quota delle 12:20). Stessa conversazione bound
(https://claude.ai/chat/ddbc4bbb-a672-4c3e-aa25-8478c5313143), stesso prompt
verbatim R-282, 2 shot allegati (default-ctx-a, default-iso-0),
POSTED 12:28 CET → collect SUCCESS (~18.4k chars, con pixel-sampling dei
colori dagli screenshot e ricerca web).

T-001/T-002 della mattina: transport SUCCESS ma generazione interrotta
server-side (~146/94 chars, quota free) — storico sotto; la critica qui
sotto è quella che alimenta il digest e il visual fork.

---

## Risposta T-003 (verbatim)

Claude ha risposto: Sto chiudendo: ricerca fatta e colori misurati dagli screenshot, ecco critica e proposta.
Eseguiti 3 comandi, cercato sul web

Eseguiti 3 comandi, cercato sul web

Sto chiudendo: ricerca fatta e colori misurati dagli screenshot, ecco critica e proposta.

Verdetto

Il pannello ha una cornice coerente con l’HUD e un buon contrasto di base, ma non sa cosa vuole essere. È un pannello da developer travestito da UI di gioco, con undici parametri crudi e controlli che non rispondono. Visivamente è ordinato, ma funzionalmente è una slab opaca che copre il 20% della mappa e dice all’utente che metà dei suoi slider è morta.

Ho ricavato i numeri campionando i pixel dei tuoi screenshot. Sono stime, perché l’antialiasing sposta qualche valore. Non ho potuto testare l’interazione dal vivo, quindi hover, focus e tastiera restano da verificare.

Critica spietata

P0: da risolvere prima di tutto

Pannello dev o impostazioni giocatore? Oggi è entrambi e quindi nessuno dei due.
Se è dev, le pratiche consolidate dei tuning panel sono: gruppi in cartelle, preset, reset e visibilità solo in debug (gruppi, preset e reset sono le basi di un tuning panel). L’export dovrebbe contenere solo i valori modificati. Qui manca tutto. 
skills

skills

Se è per il giocatore, “Cloud shape drift” e “Shadow offset Y 140” sono il modello mentale di un engineer. A un giocatore servono 2–3 scelte, tipo “Movimento ambientale: Off / Sottile / Pieno”.
Il banner arancione contraddice il pannello.
Dice che con Reduce motion attivo sway, fumo, nuvole e onde sono spente. Eppure Cloud speed, Sea sway, Coast foam speed e Cloud shape drift restano pienamente interattivi. È un’affordance falsa: l’utente trascina e non succede niente.
Il banner non offre nessun override. La pratica consigliata è usare la preferenza di sistema come default ma lasciare al giocatore la possibilità di cambiarla. 
abratabia

Il colore (
#d98a4a) è nella stessa famiglia semantica dell’allarme Food nell’HUD, quindi un’informazione neutra si veste da warning. “Sea wonders” è gergo interno.
Sono 3 righe di testo arancione da circa 12px, la cosa che pesa di più nel pannello, e non è nemmeno azionabile.
Le icone ⓘ sono quasi invisibili.
Misuro circa 
#546260 su 
#0f2832, cioè 2.4:1. Per i componenti UI la soglia è 3:1 per i controlli non testuali. 
abratabia

Sono grandi circa 12px e dipendono da un tooltip. Su touch o gamepad sono morte.
Il testo è troppo piccolo. Le label sono circa 12–13px in serif. La linea guida Xbox parla di un minimo di 28px a 1080p. Non so a che scala renderizza il tuo gioco, ma sei molto sotto qualunque soglia seria. Un pannello da width: 400px fisso non scala con il testo e va in overflow. 
abratabia

abratabia


P1: gravi

Il valore sta troppo lontano dalla label e non è modificabile.
Sta a circa 200px dalla label, a destra. Non si può digitare 0.45, e in tuning serve eccome.
La formattazione è incoerente (0.7 contro 0.42, 90, 1), e le unità compaiono solo in due label (“(s)”, “(px)”).
Le cifre sono proporzionali, quindi i numeri “ballano” mentre trascini.
Le linee guida Microsoft dicono di mostrare tick e value label quando l’utente deve conoscere il valore esatto. Qui non ci sono né tick né default. 
microsoft

Le scale sono illeggibili.
Cloud speed vale 1 con il thumb a 0%. Cloud parallax vale 1 con il thumb a circa 50%. Cloud shape drift vale 1 a circa 35%. Lo stesso numero cade in tre posizioni, senza min/max e senza segno del default.
Non c’è reset per riga e non si vede cosa hai cambiato rispetto al default.
I target sono minuscoli.
Il thumb misura circa 14px e il track 6px.
Il target minimo WCAG 2.2 è 24×24px, che qui passa solo grazie alla spaziatura tra le righe. Il consigliato è 44×44px. 
jsdelivr

jsdelivr

Il track vuoto è 
#3b3b3b su 
#0f2832, cioè 1.37:1. Il thumb dorato regge il controllo, ma la parte “vuota” quasi non si legge.
Clipping.
L’ultima riga, “Wave spacing (px)”, viene tagliata a metà e non c’è alcun indizio di scroll.
Non esiste un footer fisso dove vivrebbero Reset e Copy.
La gerarchia è piatta. TUNING, CLOUDS e SEA hanno peso e dimensione quasi uguali. I gruppi non si collassano e l’header non è sticky.
Shadow offset X e Y sono un vettore 2D spezzato in due slider. Servirebbe un XY pad.
Il posizionamento è sbagliato.
È una lastra opaca che copre foresta e mare ovest, cioè esattamente dove stai tarando sway e schiuma.
Non c’è ghost mode durante lo scrub e nemmeno un collasso.
Una larghezza di 260–300px, galleggiante in un angolo e comprimibile è lo standard per i pannelli di tuning. 
sharedcontext

Semantica da verificare. Nello screenshot non posso vedere label for, aria-valuetext e focus ring. Il pattern atteso è nome, ruolo e valore, tipo “Music Volume, slider, 52%”. 
microsoft


Cosa funziona

La cornice oro su teal è coerente con l’HUD.
Il testo oro su sfondo ha 10:1 e l’etichetta crema ha 10.1:1.
Il ritmo verticale di circa 45px è buono.
Il fill dorato comunica il valore.
Raggruppare in Clouds e Sea è la scelta giusta.
Proposta

Decisione 0: dividere in due superfici.

Giocatore (Impostazioni → Accessibilità): un segmented control “Movimento: Sistema / Ridotto / Pieno” più al massimo 2 slider. Sono i preset che scrivono i parametri grezzi.
Dev (?debug o import.meta.env.DEV): il pannello completo qui sotto.

I min/max/step nello schema sono segnaposto: prendili dai tuoi config reali. I def sono i valori degli screenshot.

1. Schema e hook

ts
// tuning/schema.ts
export interface Param {
  key: string; label: string; hint: string;
  min: number; max: number; step: number; def: number;
  unit?: string; decimals?: number;
  motion?: boolean; // inerte con reduced motion
}
export interface Group { id: string; title: string; params: Param[] }

export const GROUPS: Group[] = [
  { id: 'clouds', title: 'Clouds', params: [
    { key: 'cloudShadowOpacity', label: 'Shadow opacity', hint: 'Darkness of cloud shadows on the map.',
      min: 0, max: 1, step: 0.01, def: 0.42 },
    { key: 'cloudSpeed', label: 'Cloud speed', hint: 'Drift speed. Inert when motion is reduced.',
      min: 0, max: 3, step: 0.1, def: 1, unit: '×', motion: true },
    // ...
  ]},
  { id: 'sea', title: 'Sea', params: [
    { key: 'seaSwayPeriod', label: 'Sway period', hint: 'Seconds per sway cycle.',
      min: 2, max: 30, step: 1, def: 10, unit: 's', motion: true },
    { key: 'waveSpacing', label: 'Wave spacing', hint: 'Distance between wave lines.',
      min: 200, max: 2000, step: 10, def: 900, unit: 'px' },
  ]},
];

ts
// tuning/useReducedMotion.ts
import { useEffect, useState } from 'react';
export type MotionMode = 'system' | 'reduced' | 'full';

export function useReducedMotion(mode: MotionMode) {
  const q = '(prefers-reduced-motion: reduce)';
  const [sys, setSys] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const on = () => setSys(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mode === 'system' ? sys : mode === 'reduced';
}
2. Slider: label, numero editabile, default, reset, hint accessibile

tsx
// tuning/TuneSlider.tsx
import { useId, useState, type CSSProperties } from 'react';
import type { Param } from './schema';

interface Props {
  p: Param; value: number; disabled?: boolean;
  onChange: (v: number) => void;
  onScrub?: (active: boolean) => void;
}

export function TuneSlider({ p, value, disabled, onChange, onScrub }: Props) {
  const id = useId(), hintId = useId();
  const [hintOpen, setHintOpen] = useState(false);
  const dec = p.decimals ?? (p.step < 1 ? 2 : 0);
  const span = p.max - p.min;
  const clamp = (n: number) => Math.min(p.max, Math.max(p.min, n));
  const dirty = value !== p.def;
  const fmt = value.toFixed(dec) + (p.unit ?? '');

  return (
    <div className="ts" data-disabled={disabled || undefined} data-dirty={dirty || undefined}>
      <label htmlFor={id} className="ts__label">
        {p.label}
        {p.unit && <span className="ts__unit"> ({p.unit})</span>}
        {disabled && <span className="ts__badge">off · reduced motion</span>}
      </label>

      <button type="button" className="ts__icon" aria-expanded={hintOpen}
        aria-controls={hintId} aria-label={`About ${p.label}`}
        onClick={() => setHintOpen(o => !o)}>i</button>

      <input className="ts__num" type="number" inputMode="decimal"

        aria-label={`${p.label} value`} min={p.min} max={p.max} step={p.step}
        value={Number(value.toFixed(dec))} disabled={disabled}
        onChange={e => Number.isFinite(e.target.valueAsNumber) && onChange(clamp(e.target.valueAsNumber))} />

      <button type="button" className="ts__icon ts__reset" aria-label={`Reset ${p.label}`}
        disabled={!dirty || disabled} onClick={() => onChange(p.def)}>↺</button>

      <input id={id} className="ts__range" type="range"
        min={p.min} max={p.max} step={p.step} value={value} disabled={disabled}
        aria-valuetext={fmt}
        style={{ '--p': (value - p.min) / span, '--d': (p.def - p.min) / span } as CSSProperties}
        onChange={e => onChange(clamp(e.target.valueAsNumber))}
        onDoubleClick={() => onChange(p.def)}
        onPointerDown={() => onScrub?.(true)}
        onPointerUp={() => onScrub?.(false)}
        onPointerCancel={() => onScrub?.(false)}
        onBlur={() => onScrub?.(false)} />

      {hintOpen && <p id={hintId} className="ts__hint">{p.hint}</p>}
    </div>
  );
}
3. Pannello: gruppi collassabili, footer fisso, ghost mode, export dei soli valori cambiati

tsx
// tuning/TuningPanel.tsx
import { useMemo, useState } from 'react';
import { GROUPS } from './schema';
import { TuneSlider } from './TuneSlider';
import { useReducedMotion, type MotionMode } from './useReducedMotion';

interface Props {
  values: Record<string, number>;
  setValue: (k: string, v: number) => void;
  resetAll: () => void;
  onClose: () => void;
  motionMode: MotionMode;
  setMotionMode: (m: MotionMode) => void;
}

export function TuningPanel(props: Props) {
  const { values, setValue, resetAll, onClose, motionMode, setMotionMode } = props;
  const reduced = useReducedMotion(motionMode);
  const [ghost, setGhost] = useState(false);

  const changed = useMemo(() => Object.fromEntries(
    GROUPS.flatMap(g => g.params).filter(p => values[p.key] !== p.def).map(p => [p.key, values[p.key]])
  ), [values]);

  return (
    <aside className="tune" data-ghost={ghost || undefined} aria-label="Tuning">
      <header className="tune__head">
        <h2>Tuning</h2>
        <button className="ts__icon" aria-label="Close tuning" onClick={onClose}>×</button>
      </header>

      <div className="tune__motion" role="group" aria-label="Motion">

        <span>Motion</span>
        {(['system', 'reduced', 'full'] as MotionMode[]).map(m => (
          <button key={m} aria-pressed={motionMode === m} onClick={() => setMotionMode(m)}>
            {m === 'system' ? `System (${reduced ? 'reduced' : 'full'})` : m}
          </button>
        ))}
      </div>

      <div className="tune__body">
        {GROUPS.map(g => (
          <details key={g.id} open className="tune__group">
            <summary>
              {g.title}
              <span className="tune__count">{g.params.filter(p => values[p.key] !== p.def).length || ''}</span>
            </summary>
            {g.params.map(p => (
              <TuneSlider key={p.key} p={p} value={values[p.key]}
                disabled={!!p.motion && reduced}
                onChange={v => setValue(p.key, v)} onScrub={setGhost} />
            ))}
          </details>
        ))}
      </div>

      <footer className="tune__foot">
        <button onClick={resetAll}>Reset all</button>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(changed, null, 2))}
          disabled={!Object.keys(changed).length}>Copy changed</button>
      </footer>
    </aside>
  );
}


// uso, sempre gated:
// {import.meta.env.DEV && <TuningPanel ... />}
4. CSS

I colori proposti sono già verificati sul fondo 
#0f2832:

Token	Valore	Contrasto
ink	
#e8dfc6	11.5:1
ink-dim	
#a9b8b4	7.5:1
icone	
#8fa3a3	5.8:1
track	
#6b7f82	3.6:1
warn	
#f2a65a	7.6:1
disabled	
#7d8f8c	4.5:1

Il fill oro sul track fa 2.8:1, quindi il thumb ha un anello scuro per separarsi.


css
.tune{
  --bg:#0f2832; --ink:#e8dfc6; --ink-dim:#a9b8b4; --gold:#f0cf6a; --gold-dim:#c9a84e;
  --track:#6b7f82; --icon:#8fa3a3; --off:#7d8f8c; --focus:#fff3c4;
  --row:44px; --thumb:18px;
  position:fixed; top:max(72px,8vh); bottom:16px; left:16px;
  width:clamp(280px,22vw,340px);
  display:flex; flex-direction:column;
  background:var(--bg); color:var(--ink);
  font:500 clamp(14px,.95vw,16px)/1.3 var(--ui-font, serif);
  border:1px solid var(--gold-dim); border-radius:10px;
  transition:opacity .15s;
}
.tune[data-ghost]{ opacity:.28; }                 /* vedi la mappa mentre trascini */
@media (prefers-reduced-motion:reduce){ .tune{ transition:none; } }

.tune__head{ display:flex; justify-content:space-between; align-items:center; padding:10px 14px; }
.tune__head h2{ margin:0; font-size:1.15em; color:var(--gold); }

.tune__body{
  flex:1; overflow:auto; padding:0 14px 28px; overscroll-behavior:contain;
  mask-image:linear-gradient(#000 calc(100% - 28px), transparent);  /* cue di scroll */
}
.tune__foot{ display:flex; gap:8px; padding:10px 14px; border-top:1px solid color-mix(in srgb,var(--gold-dim) 35%,transparent); }

.tune__group > summary{
  position:sticky; top:0; z-index:1; background:var(--bg);
  min-height:var(--row); display:flex; align-items:center; justify-content:space-between;
  font:600 .8em/1 var(--ui-font, serif); letter-spacing:.14em; text-transform:uppercase;
  color:var(--gold); cursor:pointer;
  border-bottom:1px solid color-mix(in srgb,var(--gold-dim) 35%,transparent);
}
.tune__count{ color:var(--ink-dim); font-variant-numeric:tabular-nums; }


/* riga */
.ts{ display:grid; grid-template-columns:1fr auto 72px auto; align-items:center; column-gap:6px; padding:4px 0; }
.ts__unit{ color:var(--ink-dim); }
.ts__badge{ margin-left:8px; font-size:.75em; padding:1px 6px; border:1px solid var(--off); border-radius:4px; color:var(--off); }
.ts__num{
  width:72px; height:32px; text-align:right; background:transparent; color:var(--gold);
  border:1px solid transparent; border-radius:6px; font:inherit; font-variant-numeric:tabular-nums;
}
.ts__num:hover{ border-color:var(--track); }
.ts__icon{
  position:relative; width:28px; height:28px; border:0; border-radius:50%;
  background:none; color:var(--icon); font:inherit; cursor:pointer;
}
.ts__icon::after{ content:""; position:absolute; inset:-8px; }   /* hit area 44px */
.ts__reset:disabled{ visibility:hidden; }
.ts__hint{ grid-column:1/-1; margin:0 0 6px; color:var(--ink-dim); font-size:.9em; }

/* range: fill + tick del default + thumb */
.ts__range{
  grid-column:1/-1; appearance:none; -webkit-appearance:none; margin:0; height:var(--row);
  background:transparent; cursor:pointer;
  --fx:calc(var(--thumb)/2 + (100% - var(--thumb)) * var(--p));
  --dx:calc(var(--thumb)/2 + (100% - var(--thumb)) * var(--d));
  background:
    linear-gradient(var(--ink-dim),var(--ink-dim)) calc(var(--dx) - 1px) 50% / 2px 14px no-repeat, /* default */
    linear-gradient(var(--gold),var(--gold)) 0 50% / var(--fx) 6px no-repeat,                        /* fill */
    linear-gradient(var(--track),var(--track)) 0 50% / 100% 6px no-repeat;                           /* track */
  border-radius:3px;
}
.ts__range::-webkit-slider-runnable-track{ height:var(--row); background:transparent; }
.ts__range::-moz-range-track{ height:var(--row); background:transparent; }

.ts__range::-webkit-slider-thumb{
  appearance:none; -webkit-appearance:none; width:var(--thumb); height:var(--thumb);
  margin-top:calc((var(--row) - var(--thumb)) / 2);
  border-radius:50%; background:var(--gold); border:3px solid var(--bg); box-shadow:0 0 0 1.5px var(--gold);
}
.ts__range::-moz-range-thumb{
  width:var(--thumb); height:var(--thumb); border-radius:50%;
  background:var(--gold); border:3px solid var(--bg); box-shadow:0 0 0 1.5px var(--gold);
}
.ts__range:hover::-webkit-slider-thumb{ box-shadow:0 0 0 3px var(--gold); }
.ts__range:focus-visible{ outline:none; }
.ts__range:focus-visible::-webkit-slider-thumb{ box-shadow:0 0 0 2px var(--bg), 0 0 0 4px var(--focus); }
.ts__range:focus-visible::-moz-range-thumb{ box-shadow:0 0 0 2px var(--bg), 0 0 0 4px var(--focus); }

/* disabled: cue non cromatico (badge testuale) + desaturazione */
.ts[data-disabled]{ color:var(--off); }
.ts[data-disabled] .ts__range{ filter:grayscale(1); opacity:.6; cursor:not-allowed; }

Il tick del default può sbagliare di circa 1px, perché le percentuali di background-position sono relative a container meno immagine. Per una tacca da 2px è irrilevante.

Cosa cambia per l’utente
I parametri morti sono marcati come tali, con un badge testuale e non solo con il colore.
Digiti i valori e doppio clic o ↺ riporta al default. La tacca indica dove stava il default, e un contatore per gruppo mostra quanti valori hai toccato.
Mentre trascini il pannello va al 28% di opacità e vedi la mappa.
Reset e Copy restano sempre visibili, e l’export contiene solo ciò che hai cambiato.
Se vuoi la strada breve

Per il solo uso dev, Leva (React) o Tweakpane danno già cartelle, preset, reset ed export. Li consigliano anche i riferimenti che ho trovato, che suggeriscono Leva per React e Tweakpane per vanilla JS. Basta tematizzarli con i token sopra. Per la versione giocatore, invece, serve comunque il segmented control a preset. 
sharedcontext


Checklist di accettazione
 Il pannello dev non esiste in build di produzione.
 Nessuno slider motion è attivo quando il movimento è ridotto, e lo stato si legge anche senza colore.
 L’override del movimento è possibile (Sistema / Ridotto / Pieno).
 Ogni valore è digitabile, ha l’unità e un default visibile.
 I target sono ≥44px e il contrasto UI ≥3:1.
 Il focus ring è visibile da tastiera e funziona il gamepad.
 Il testo scala con il root font-size.
 Reset e Copy sono sempre raggiungibili.
 Nessuna riga è tagliata, e c’è un cue di scroll.

Se mi dici se il pannello è dev o giocatore, posso produrre il mockup della versione giocatore con i preset Off/Sottile/Pieno e la mappatura sui parametri. Posso anche adattare il codice alla tua struttura di store, che qui ho solo ipotizzato come values e setValue.






ora

---

## Storico failure (verbatim, pre-reset quota)

### T-001 response

Memoria richiamata
plan-086-ui-catalog.md

Questa risposta si è interrotta prima della fine.
Continua

### T-002 response

Cercato sul web

Questa risposta si è interrotta prima della fine.
Continua
