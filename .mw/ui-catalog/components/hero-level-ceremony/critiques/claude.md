# claude — hero-level-ceremony (T-001 refill, image-grounded)

Run `20261025-critique-hero-level-ceremony-r2`, turn T-001 (critique-refill dopo il reset quota delle 17:20),
prompt verbatim R-282, shot allegati (default-ctx-a, default-iso-0, default-iso-1), POSTED+collect SUCCESS
(~14k chars). Conversazione: https://claude.ai/chat/4f15cb70-d0d8-4e92-99fd-3a2b6c77d522.

Run fresh -r2 (binding originale avvelenato su /new).

---

## Risposta T-001 (verbatim)

Claude ha risposto: Parto con una ricerca su best practice e riferimenti, poi ti do la critica.
Revisione spietata del modale di livello superiore.
Revisione spietata del modale di livello superiore.

Parto con una ricerca su best practice e riferimenti, poi ti do la critica.

Cercato sul web

Cercato sul web
Critica del popup “Level Up” (RpgBalancer /game)

Nota sulla ricerca. Il web ha dato soprattutto feedback di community, non letteratura da AAA. Ne ho preso i punti utili e li ho incrociati con quello che conosco da Fire Emblem, Pokémon, BG3 e dagli RPG in generale. Dove cito un riferimento esterno, lo segnalo.

Verdetto

Lo stile è coerente con il resto della UI: cornice dorata, teal scuro, serif. Ma è un componente di sistema, non di cerimonia. Un level-up è uno dei pochi momenti di ricompensa pura in un RPG, e qui è trattato come una tabella di dati con tre copie del bottone “Continue”. Il giocatore riceve l’informazione ma non prova nulla.

Critica
Critici (rompono l’esperienza)

1. Tre modali simultanee, senza scrim.

Competono tra loro per l’attenzione e non c’è un ordine di lettura chiaro.
Coprono il Roster a metà. “BERTOLDO” resta tagliato dietro una card, e sembra un bug di layout.
Il resto della UI resta acceso e in competizione. Il box FOOD rosso (8/20 · 1 d left) pulsa mentre devi leggere i numeri.
Non è chiaro se la mappa e il Roster siano ancora interattivi.
Se la simulazione gira a ×1 dietro le modali, stai punendo il giocatore per aver letto.

2. Stato desincronizzato.

Il Roster mostra già Lv 5/6/4 ma gli HP vecchi (195/195, 210/210, 280/280). Le card dicono 195 → 207, 210 → 220, 280 → 296.
Il livello è stato aggiornato e gli stat no. Il giocatore vede una UI che si contraddice nello stesso frame.
O si committa tutto alla chiusura, o tutto subito.

3. Nessun volto.

È il momento in cui l’eroe è protagonista e non c’è né ritratto né illustrazione.
Il nome è sepolto in una frase in maiuscolo spaziato: “SIR SPACCACULI REACHES LEVEL IV”.
Il giocatore non riconosce chi è cresciuto prima di aver letto la riga.
Maggiori (indeboliscono la comunicazione)

4. Gerarchia invertita.

Il titolo è un periodo verbale. La cosa importante è il nome e il livello.
“IV” compare due volte, nel badge e nel titolo, ed è ridondante.
Il titolo va a capo in modo orfano: “REACHES / LEVEL IV”.
Il roster usa “Lv 5” arabo e le card usano “V” romano, quindi due notazioni per la stessa informazione.

5. Il delta non c’è.

24 → 29 mette vecchio e nuovo allo stesso peso visivo. Il cervello deve sottrarre.
Il dato emotivo è +5, e non compare.
Un addon WoW per level-up mostra esplicitamente vecchi e nuovi valori. Qui lo fai a metà.

6. Tutto è oro.

Titolo, numeri, bordo, bottone: un solo colore, senza semantica.
Se ogni cosa è enfatizzata, nulla lo è.
Il guadagno merita un colore semantico suo, accompagnato da un segno come ▲ o + per non dipendere dal solo colore. Un articolo sulle animazioni di delta nei grafici nota giustamente il rischio daltonismo del rosso/verde.

7. Righe stat senza icone e con allineamento debole.

Etichetta grigia piccola e a basso contrasto sul teal (sembra sotto 4.5:1).
I numeri non sono tabulari, quindi le frecce non si allineano in colonna.
Il consiglio ricorrente dei forum di UI è nome a sinistra e valore a destra come due elementi distinti. Qui l’impostazione c’è, ma manca la struttura a colonne (icona, etichetta, da, a, delta).

8. Ordine arbitrario.

Le card sono IV, VI, V. Il Roster è Giggiolillo, Salvatrice, Spaccaculi, cioè l’inverso.
Il giocatore non trova una logica, né per roster, né per livello, né per ruolo.
Minori

9. CTA debole e triplicata.

“CONTINUE” è un ghost button di circa 125×34 px, con bordo sottile e nessun focus ring visibile.
Tre bottoni identici significano tre decisioni inesistenti.
Mancano il suggerimento da tastiera e il “continua tutti”.

10. Gli HP sono mescolati agli stat di classe.

HP compare in tutte le card come ultima riga ed è la costante. Andrebbe separato visivamente (barra o riga evidenziata).
Gli stat variabili (Damage/Armor, Regen/Ward, Agility/Evasion) non spiegano perché sono quelli. Un tooltip “da classe” basta.

11. Nessun gancio per il futuro.

Niente sblocchi (“Nuova abilità!”), niente anteprima del prossimo livello, niente XP residuo.
Un level-up senza una promessa si dimentica in due secondi.

12. Cose che non posso giudicare da uno screenshot.

Animazione e audio. Se il tutto appare di colpo, va aggiunto motion.
Un feedback community chiede che la schermata di level-up non sparisca finché il giocatore non clicca, perché sparendo troppo in fretta toglie il momento di soddisfazione. Qui è un modale bloccante, quindi giusto. Resta da progettare come arriva.
Soluzioni
Architettura: una cerimonia sola, non tre popup

[scrim scuro + simulazione in pausa]
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ ritratto │ │ ritratto │ │ ritratto │   ← stagger 120 ms
   │ LV badge │ │ LV badge │ │ LV badge │
   │ NOME     │ │ NOME     │ │ NOME     │
   │ stat…    │ │ stat…    │ │ stat…    │
   └──────────┘ └──────────┘ └──────────┘
            [   CONTINUE  ⏎   ]            ← un solo CTA
Una sola modale con scrim e pausa della simulazione finché è aperta.
Card in ordine di Roster, con reveal a cascata.
Un solo CTA primario, attivo (o saltabile con Enter) dopo il reveal.
Se gli eroi sono più di 3–4, passa a carosello con paginazione, o a coda.
Il Roster si aggiorna alla chiusura, con un flash sulle righe cambiate.
Codice (React + TypeScript + CSS, senza dipendenze extra)

Modello dati


ts
// levelUp.types.ts
export type StatDelta = {
  id: string;
  label: string;
  icon: string;          // es. "/ui/icons/damage.svg"
  from: number;
  to: number;
  kind?: "core" | "hp";  // hp viene separato visivamente
};

export type LevelUpEvent = {
  heroId: string;
  name: string;
  portraitSrc: string;
  level: number;
  stats: StatDelta[];
  unlocks?: { id: string; label: string }[];
};

Utility e hook


tsx
// levelUp.utils.ts
const ROMAN: [number, string][] = [[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
export const toRoman = (n: number) =>
  ROMAN.reduce((out, [v, s]) => { while (n >= v) { out += s; n -= v; } return out; }, "");

export function usePrefersReducedMotion() {
  const [r, setR] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
}

export function useCountUp(from: number, to: number, delay: number, enabled: boolean, duration = 550) {
  const [v, setV] = useState(enabled ? from : to);
  useEffect(() => {
    if (!enabled) { setV(to); return; }
    let raf = 0, t0 = 0;
    const timer = setTimeout(() => {
      const tick = (now: number) => {
        t0 ||= now;
        const p = Math.min((now - t0) / duration, 1);
        setV(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [from, to, delay, enabled, duration]);
  return v;
}

Overlay (usa <dialog> nativo: focus trap, Esc e ::backdrop gratis)


tsx
// LevelUpOverlay.tsx
export function LevelUpOverlay({ events, onDone }: { events: LevelUpEvent[]; onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    gameClock.pause("levelup");            // la simulazione NON deve girare dietro
    return () => gameClock.resume("levelup");
  }, []);

  return (
    <dialog
      ref={ref}
      className="lvlup"
      aria-labelledby="lvlup-title"
      onCancel={(e) => { e.preventDefault(); onDone(); }}  // Esc = Continue
    >
      <h1 id="lvlup-title" className="lvlup__sr">Level up</h1>
      <div className="lvlup__row">
        {events.map((ev, i) => <HeroLevelCard key={ev.heroId} ev={ev} index={i} />)}
      </div>
      <button className="lvlup__cta" autoFocus onClick={onDone}>
        Continue <kbd>⏎</kbd>
      </button>
    </dialog>
  );
}

Card e riga stat


tsx
function HeroLevelCard({ ev, index }: { ev: LevelUpEvent; index: number }) {
  const core = ev.stats.filter((s) => s.kind !== "hp");
  const hp = ev.stats.filter((s) => s.kind === "hp");
  const base = 350 + index * 120;                       // stagger tra le card

  return (
    <article className="lvl-card" style={{ "--i": index } as React.CSSProperties}>
      <header className="lvl-card__head">
        <img className="lvl-card__portrait" src={ev.portraitSrc} alt="" />
        <div className="lvl-card__badge" aria-label={`Level ${ev.level}`}>
          <small>LV</small><b>{toRoman(ev.level)}</b>
        </div>
        <h2 className="lvl-card__name">{ev.name}</h2>
      </header>

      <ul className="lvl-stats">
        {core.map((s, k) => <StatRow key={s.id} s={s} delay={base + k * 140} />)}
      </ul>
      {hp.length > 0 && (
        <ul className="lvl-stats lvl-stats--hp">
          {hp.map((s) => <StatRow key={s.id} s={s} delay={base + core.length * 140} />)}
        </ul>
      )}

      {ev.unlocks?.map((u) => (
        <p key={u.id} className="lvl-card__unlock">✦ New: {u.label}</p>
      ))}
    </article>
  );
}

function StatRow({ s, delay }: { s: StatDelta; delay: number }) {

  const reduced = usePrefersReducedMotion();
  const value = useCountUp(s.from, s.to, delay, !reduced);
  const gain = s.to - s.from;

  return (
    <li className="stat" aria-label={`${s.label}: ${s.from} to ${s.to}, plus ${gain}`}>
      <img className="stat__icon" src={s.icon} alt="" />
      <span className="stat__label">{s.label}</span>
      <span className="stat__from">{s.from}</span>
      <span className="stat__arrow" aria-hidden>→</span>
      <span className="stat__to" aria-hidden>{value}</span>
      <span className="stat__delta" style={{ animationDelay: `${delay + 450}ms` }}>
        ▲ {gain}
      </span>
    </li>
  );
}

CSS (token, scrim, gerarchia, motion)


css
.lvlup {
  --gold: #e8c875;
  --gold-dim: #b79a52;
  --text: #eef1ee;
  --text-muted: #a9bdbb;      /* ≥ 4.5:1 sul teal scuro, da verificare col vostro bg */
  --gain: #8be0a0;
  --panel: #0e2a33;

  border: 0; padding: 0; background: transparent; color: var(--text);
  max-width: none; width: 100vw; height: 100vh;
  display: grid; place-items: center; align-content: center; gap: 28px;
}
.lvlup::backdrop {
  background: radial-gradient(ellipse at center, rgb(5 14 20 / .72), rgb(2 6 10 / .92));
  backdrop-filter: blur(3px) saturate(.8);   /* spegne il FOOD rosso e la mappa */
  animation: fade .25s ease-out;
}
.lvlup__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.lvlup__row { display: flex; gap: 20px; align-items: stretch; }

.lvl-card {
  width: 280px; padding: 0 0 18px;
  background: linear-gradient(180deg, #123541, var(--panel));
  border: 1px solid var(--gold-dim); border-radius: 10px;
  box-shadow: 0 0 0 3px #0a1a20, 0 18px 50px rgb(0 0 0 / .55);
  opacity: 0; transform: translateY(14px) scale(.97);
  animation: card-in .45s cubic-bezier(.2,.8,.2,1) forwards;
  animation-delay: calc(var(--i) * 120ms + 150ms);
}
.lvl-card__head { position: relative; text-align: center; padding-top: 18px; }
.lvl-card__portrait {
  width: 96px; height: 96px; border-radius: 50%; object-fit: cover;

  border: 2px solid var(--gold); box-shadow: 0 0 24px rgb(232 200 117 / .35);
}
.lvl-card__badge {
  position: absolute; left: 50%; top: 92px; transform: translateX(-50%);
  min-width: 44px; padding: 2px 10px; border-radius: 999px;
  background: var(--gold); color: #1a1405; display: flex; gap: 4px; align-items: baseline;
  justify-content: center; font-variant-caps: all-small-caps;
}
.lvl-card__badge b { font-size: 20px; line-height: 1; }
.lvl-card__badge small { font-size: 11px; letter-spacing: .12em; }
.lvl-card__name {
  margin: 22px 12px 10px; font-size: 22px; letter-spacing: .04em;
  color: var(--text); text-wrap: balance;
}

.lvl-stats { list-style: none; margin: 0; padding: 8px 16px; }
.lvl-stats--hp { border-top: 1px solid rgb(232 200 117 / .25); margin-top: 6px; padding-top: 12px; }
.stat {
  display: grid; grid-template-columns: 20px 1fr auto 14px auto 52px;
  align-items: center; column-gap: 8px; padding: 6px 0;
  font-variant-numeric: tabular-nums;
}
.stat__label { color: var(--text-muted); font-size: 14px; }
.stat__from  { color: var(--text-muted); text-align: right; }
.stat__arrow { color: var(--gold-dim); }
.stat__to    { color: var(--text); font-weight: 700; font-size: 18px; text-align: right; }
.stat__delta {
  justify-self: end; padding: 1px 7px; border-radius: 999px; font-size: 12px; font-weight: 700;
  color: #062010; background: var(--gain);
  opacity: 0; transform: scale(.6);
  animation: pop .3s cubic-bezier(.3,1.6,.5,1) forwards;
}

.lvl-card__unlock { margin: 10px 16px 0; color: var(--gold); font-size: 13px; }

.lvlup__cta {
  min-width: 220px; min-height: 48px; padding: 0 28px;
  font: inherit; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
  color: #1a1405; background: linear-gradient(180deg, #f3d98d, var(--gold));
  border: 1px solid #fff3c4; border-radius: 6px; cursor: pointer;
  opacity: 0; animation: fade .3s ease-out 1.2s forwards;   /* arriva dopo il reveal */
}
.lvlup__cta:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
.lvlup__cta kbd { opacity: .6; margin-left: 8px; font-family: inherit; }

@keyframes fade    { to { opacity: 1; } }
@keyframes card-in { to { opacity: 1; transform: none; } }
@keyframes pop     { to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .lvl-card, .stat__delta, .lvlup__cta { animation-duration: .01ms; animation-delay: 0ms; }
}

Fix al Roster (stato coerente)


ts
// Un solo punto di commit: la UI del Roster legge `displayed`, non `live`.
function onHeroLevelUp(ev: LevelUpEvent) {
  pendingLevelUps.push(ev);           // il Roster continua a mostrare i valori vecchi, livello incluso
}
function onLevelUpContinue() {
  commitDisplayedStats(pendingLevelUps);       // Roster salta ai nuovi Lv e HP insieme
  flashRosterRows(pendingLevelUps.map(e => e.heroId));
  pendingLevelUps.length = 0;
}
Priorità
Priorità	Intervento	Sforzo
P0	Scrim, pausa sim, un solo CTA, sync Roster	ore
P0	Ordine card = ordine Roster	minuti
P1	Nome come hero, badge unico, via la ridondanza “LEVEL IV”	ore
P1	Chip delta ▲ +5, colonne tabulari, contrasto etichette	ore
P2	Ritratti, icone stat, riga HP separata	richiede asset
P2	Reveal a cascata, count-up, SFX	1–2 giorni
P3	Sblocchi e anteprima del livello successivo	richiede design di sistema

Se vuoi, il passo successivo è un mockup del flusso con 1, 3 e 6 eroi che salgono insieme, per decidere quando passare da riga a carosello.






ora
