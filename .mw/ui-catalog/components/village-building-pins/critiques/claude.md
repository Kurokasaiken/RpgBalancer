# claude — village-building-pins (T-001 refill, image-grounded)

Run `20261025-critique-village-building-pins-r2`, turn T-001 (critique-refill dopo il reset quota delle 17:20),
prompt verbatim R-282, shot allegati (default-ctx-a, default-iso-0), POSTED+collect SUCCESS
(~11k chars). Conversazione: https://claude.ai/chat/6c929335-83d5-4e9a-ae9a-b8f2d929851f.

Run fresh -r2 (binding originale avvelenato su /new).

---

## Risposta T-001 (verbatim)

Claude ha risposto: Ho preso come componente il marker degli edifici sulla scena del villaggio: il disco scuro con il badge in numeri romani, ingrandito nel crop.
Cercato sul web

Cercato sul web

Ho preso come componente il marker degli edifici sulla scena del villaggio: il disco scuro con il badge in numeri romani, ingrandito nel crop. La mia critica si basa su screenshot statici, quindi non posso giudicare hover, focus e animazioni.

Critica

1. I dischi vuoti sembrano bug, non design.
Molti marker sono dischi navy pieni senza alcun glifo leggibile. Sulla pittura luminosa fanno l’effetto “buco nel fondale” o texture mancante. Se le icone dovrebbero esserci e non caricano, è un bug da risolvere prima di tutto. Se sono davvero vuote, il giocatore non ha modo di capire che cosa rappresenta il marker.

2. Non esiste un linguaggio unico.
Nella stessa schermata convivono tre trattamenti diversi:

dischi pieni;
glifi beige minuscoli con parentesi laterali, quasi invisibili sul tetto di paglia;
scudi senza fondo.

La legenda in basso promette un codice a forme (cerchio, parentesi, scudo), ma in scena viene applicato in modo incoerente. Il risultato è una scheda tecnica, non un sistema.

3. La gerarchia informativa è capovolta.
L’informazione più importante per un gestionale è “qui posso costruire”. Nel tuo marker è il “+” in un cerchietto di circa 10px, cioè l’elemento più debole. Il tier, che è secondario, ha invece un badge con ghiera dorata. Lo stato (costruito, costruibile, bloccato) è codificato solo da glifi microscopici: “I”, “+” e il lucchetto.

4. Il badge “II” è illegibile.
Nel tuo crop è circa 10px, con un tratto sottile su fondo scuro. I numeri romani non funzionano a colpo d’occhio: I, II e III hanno forme quasi identiche a quella dimensione. I pip (●●○) si leggono molto più in fretta.

5. Il contrasto non regge.
Le linee guida di settore indicano un rapporto minimo di 3:1 per i componenti UI. Xbox suggerisce di contornare gli elementi di gioco chiave per aumentarne il contrasto sullo sfondo (3:1 per componenti UI; i contorni aumentano il contrasto sugli elementi chiave). I tuoi glifi beige su paglia e legno, e il lucchetto su legno chiaro, non ci arrivano. Non hanno alone né contorno che li separi dal fondale. Un fondale dipinto cambia luminosità ovunque, quindi un colore fisso non basta: serve una piastra o un alone che garantisca il contrasto a prescindere da ciò che sta dietro. 
outlookindia

azure


6. Le ellissi tratteggiate sono rumore.
Ne vedo circa otto, tutte con lo stesso tratteggio e senza un legame chiaro col marker. Sembrano debug overlay dimenticati. Competono con la pittura e con i marker, e non dicono se sono hit area, footprint o altro.

7. L’ancoraggio è vago.
Alcuni marker galleggiano nel cielo o tra gli alberi, a sinistra e in alto a destra, senza una relazione leggibile con un edificio. Manca un elemento che li lega al mondo, come uno stelo, un’ombra a terra o un punto d’ingresso.

8. Stile incoerente con il resto dell’HUD.
La cornice del HUD è ornata e fantasy: oro, doppio filetto, spessore. I marker sono dischi piatti quasi senza bordo. Sembrano un altro gioco.

9. Target e scalabilità.
Il disco da circa 40px va bene per il mouse, ma l’icona interna da 14-16px no. Ti avevo visto lavorare sul mobile-fit a 390×844: lì a 40px il badge e il glifo spariscono.

Cosa funziona:

l’idea della codifica a forma per categoria, che è una ridondanza accessibile;
l’hint da tastiera (← → / Enter);
il fatto che il HUD lasci respirare la scena.
Proposta

Il principio è una piastra unica con strati fissi:

forma = categoria;
anello e colore = stato;
pip = tier;
alone scuro esterno = leggibilità su qualsiasi fondale;
footprint solo su hover o focus.

tsx
// BuildingMarker.tsx
import { ReactNode } from "react";
import "./building-marker.css";

type Category = "production" | "civic" | "defense";
type State = "built" | "buildable" | "locked";

const PLATE: Record<Category, string> = {
  production: "M24 3a21 21 0 1 0 0 42a21 21 0 1 0 0-42Z",                 // cerchio
  civic:      "M24 3L42 13.5V34.5L24 45L6 34.5V13.5Z",                    // esagono
  defense:    "M24 3L42 9V24C42 34 34 42 24 46C14 42 6 34 6 24V9Z",       // scudo
};

interface Props {
  label: string;
  category: Category;
  state: State;
  tier: number;          // 0 se non costruito
  maxTier?: number;
  x: number; y: number;  // % sulla scena, punto = base dell'edificio
  icon: ReactNode;       // SVG 24x24, fill: currentColor
  requirement?: string;  // es. "Richiede Legno 20"
  onOpen: () => void;
}

export function BuildingMarker(p: Props) {
  const max = p.maxTier ?? 3;
  return (
    <button
      className={`mk mk--${p.state} mk--${p.category}`}
      style={{ left: `${p.x}%`, top: `${p.y}%` }}
      onClick={p.onOpen}

      aria-label={`${p.label}, ${p.state}${p.tier ? `, livello ${p.tier} di ${max}` : ""}`}
    >
      <svg className="mk__plate" viewBox="0 0 48 48" aria-hidden>
        <path className="mk__halo" d={PLATE[p.category]} />
        <path className="mk__body" d={PLATE[p.category]} />
        <path className="mk__ring" d={PLATE[p.category]} />
      </svg>

      <span className="mk__icon" aria-hidden>
        {p.state === "buildable" ? <PlusGlyph /> : p.icon}
      </span>

      {p.state === "locked" && <span className="mk__lock" aria-hidden><LockGlyph /></span>}

      {p.state !== "locked" && (
        <span className="mk__pips" aria-hidden>
          {Array.from({ length: max }, (_, i) => (
            <i key={i} className={i < p.tier ? "on" : ""} />
          ))}
        </span>
      )}

      <span className="mk__stem" aria-hidden />
      <span className="mk__tip" role="tooltip">
        <b>{p.label}</b>
        {p.state === "locked" && p.requirement && <em>{p.requirement}</em>}
      </span>
    </button>
  );
}

css
/* building-marker.css */
:root {
  --mk-size: 48px;
  --mk-ink: #0a1822;
  --mk-ink-2: #13303f;
  --mk-gold: #e0bb62;
  --mk-gold-dim: #7d6a3c;
  --mk-go: #8be9cf;
  --mk-halo: rgba(4, 10, 16, .9);
}

.mk {
  position: absolute;
  width: var(--mk-size);
  height: var(--mk-size);
  transform: translate(-50%, calc(-100% - 8px));   /* il punto (x,y) è la base */
  padding: 0; border: 0; background: none;
  cursor: pointer;
  color: var(--mk-gold);
  filter: drop-shadow(0 3px 4px rgb(0 0 0 / .45));
}
/* hit area ≥ 48px anche se il disegno è più piccolo */
.mk::before { content: ""; position: absolute; inset: -4px; }

.mk__plate { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.mk__halo  { fill: none; stroke: var(--mk-halo); stroke-width: 6; stroke-linejoin: round; } /* separa da qualsiasi fondale */
.mk__body  { fill: url(#mk-grad, var(--mk-ink)); fill: var(--mk-ink); }
.mk__ring  { fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; }

.mk__icon { position: absolute; inset: 0; display: grid; place-items: center; }
.mk__icon svg { width: 24px; height: 24px; fill: currentColor; }


/* stelo + ombra a terra: ancora il marker all'edificio */
.mk__stem {
  position: absolute; left: 50%; top: 100%;
  width: 2px; height: 8px; transform: translateX(-50%);
  background: linear-gradient(var(--mk-halo), var(--mk-halo)), currentColor;
  box-shadow: 0 0 0 1px var(--mk-halo);
}
.mk__stem::after {
  content: ""; position: absolute; left: 50%; top: 100%;
  width: 22px; height: 7px; transform: translate(-50%, -2px);
  background: radial-gradient(closest-side, rgb(0 0 0 / .5), transparent);
}

/* tier: pip, non numeri romani */
.mk__pips { position: absolute; left: 50%; bottom: -3px; transform: translateX(-50%); display: flex; gap: 3px; }
.mk__pips i {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--mk-ink); box-shadow: 0 0 0 1.5px var(--mk-gold-dim), 0 0 0 3px var(--mk-halo);
}
.mk__pips i.on { background: var(--mk-gold); box-shadow: 0 0 0 1.5px var(--mk-gold), 0 0 0 3px var(--mk-halo); }

/* STATI */
.mk--built     { color: var(--mk-gold); }
.mk--buildable { color: var(--mk-go); }
.mk--buildable .mk__icon svg { width: 28px; height: 28px; }
.mk--buildable .mk__ring { stroke-dasharray: 0; filter: drop-shadow(0 0 4px var(--mk-go)); }
.mk--buildable::after {                      /* pulse SOLO sul costruibile */
  content: ""; position: absolute; inset: 2px; border-radius: 50%;
  border: 2px solid var(--mk-go); opacity: 0;
  animation: mk-pulse 2.4s ease-out infinite;
}
.mk--locked { color: #8f9aa1; }

.mk--locked .mk__body { fill: #0c141a; }
.mk--locked .mk__icon { opacity: .55; }
.mk__lock {
  position: absolute; right: -6px; bottom: -4px; width: 20px; height: 20px;
  display: grid; place-items: center; border-radius: 50%;
  background: var(--mk-ink); box-shadow: 0 0 0 1.5px #8f9aa1, 0 0 0 3px var(--mk-halo);
}
.mk__lock svg { width: 12px; height: 12px; fill: #c9d1d6; }

/* tooltip: nome sempre disponibile su hover/focus */
.mk__tip {
  position: absolute; left: 50%; bottom: calc(100% + 10px); transform: translateX(-50%) translateY(4px);
  display: grid; gap: 2px; padding: 6px 10px; white-space: nowrap;
  background: var(--mk-ink); color: #f3e9cf; font: 600 13px/1.1 "Cinzel", serif; letter-spacing: .04em;
  border: 1.5px solid var(--mk-gold-dim); border-radius: 4px;
  opacity: 0; pointer-events: none; transition: opacity .12s, transform .12s;
}
.mk__tip em { font: 500 11px/1.2 system-ui; color: #ffb4a0; font-style: normal; }
.mk:hover .mk__tip, .mk:focus-visible .mk__tip { opacity: 1; transform: translateX(-50%); }
.mk:hover, .mk:focus-visible { filter: drop-shadow(0 0 8px rgb(224 187 98 / .6)); z-index: 5; }
.mk:focus-visible { outline: 2px solid #fff; outline-offset: 6px; border-radius: 6px; }

@keyframes mk-pulse { 0% { transform: scale(.9); opacity: .8; } 100% { transform: scale(1.5); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .mk--buildable::after { animation: none; opacity: .5; transform: scale(1.15); } }

/* mobile 390×844: stessa piastra, ma più grande e senza hover */
@media (max-width: 480px) { :root { --mk-size: 52px; } .mk__tip { display: none; } }

Footprint al posto delle ellissi tratteggiate. Si mostra solo per l’edificio in hover o focus, come un’ombra dorata morbida.


tsx
// dentro la scena, un solo <svg> overlay
<ellipse
  cx={b.fx} cy={b.fy} rx={b.rx} ry={b.ry}
  className={`footprint ${hoverId === b.id ? "on" : ""}`}
/>

css
.footprint { fill: url(#fp-glow); opacity: 0; transition: opacity .15s; pointer-events: none; mix-blend-mode: soft-light; }
.footprint.on { opacity: 1; }
Ordine di intervento
Verifica perché i dischi sono vuoti (bug di caricamento icone o assenza di asset).
Elimina le ellissi e passa al footprint su hover.
Sostituisci i romani con i pip e fai del “costruibile” lo stato più forte.
Passa a un’unica piastra con alone, anello e stelo.
Aggiungi un’opzione di alto contrasto, con piastra opaca e anello a 7:1. Le guide Xbox raccomandano un contrasto configurabile, non fisso (alcuni giocatori con disabilità cognitive trovano più difficili le UI ad altissimo contrasto, quindi l’obiettivo è la configurabilità). 
xbox

Testa su 5 fondali diversi: cielo, paglia, legno, acqua e ombra del bosco. Se il marker non si legge su tutti, la piastra non è abbastanza forte.

Se vuoi, preparo anche un banco di prova HTML con i tre stati × tre categorie × tre tier su fondali diversi, per confrontare prima e dopo.






ora
