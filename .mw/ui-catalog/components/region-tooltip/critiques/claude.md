# claude — region-tooltip (T-001 refill, image-grounded)

Run `20261025-critique-region-tooltip-r2`, turn T-001 (critique-refill dopo il reset quota delle 17:20),
prompt verbatim R-282, shot allegati (default-ctx-a, default-iso-0), POSTED+collect SUCCESS
(~9k chars). Conversazione: https://claude.ai/chat/8c434cc9-21ea-4101-826e-3e5abb751ac4.

Run fresh -r2 (run originale bound su /new, con T-001 POSTED orfano).

---

## Risposta T-001 (verbatim)

Claude ha risposto: Critica: plaque "WHISPERING WOODS"
Cercato sul web

Cercato sul web
Critica: plaque “WHISPERING WOODS”

Assunzione: il pannello dorato con il contorno blu è lo stato hover/selected di una regione. Se invece è sempre visibile, i problemi sotto valgono ancora di più.

Verdetto

È una bella targa, ma una targa da HUD appoggiata sopra una mappa. Il linguaggio visivo coerente col resto dell’interfaccia (navy e oro) è l’unica cosa che funziona davvero. Come elemento cartografico è debole: non dice dove inizia e finisce la regione, copre l’illustrazione e non comunica nulla di giocabile.

Cosa non va, in ordine di gravità

1. Crisi d’identità (P0). La targa ha lo stesso trattamento del pannello risorse e della barra di navigazione. Sulla mappa sembra uno sticker flottante, non un nome sul territorio. La ricerca sulla tipografia cartografica va nella direzione opposta: l’etichetta deve riflettere la forma della feature. Un’etichetta curva ricalca la costa o il fiume che nomina, mentre qui il testo resta rigido e orizzontale su una regione a due lobi. 
mapbox


2. Piazzamento sbagliato (P0). La targa è sul collo di strozzatura tra il lobo ovest e quello est, proprio sopra la linea del contorno. Quel punto non è il centro visivo di nessuna delle due zone. In più nasconde il bordo che dovrebbe spiegare l’area. Gli algoritmi di placement seri assegnano un punteggio a ogni posizione candidata, penalizzano le sovrapposizioni e premiano il testo sulla terraferma. Qui nessuna di queste regole è rispettata. 
redblobgames


3. Il contorno non regge (P1).

Lo stroke blu scuro di circa 3px ha una luminanza quasi uguale al verde oliva sotto: contrasto sotto il 3:1, la soglia WCAG comunemente usata per gli elementi non testuali.
Il poligono non coincide con l’illustrazione: la foresta più densa, in basso a sinistra, resta fuori dal confine.
Non c’è riempimento, dimming esterno o distinzione tra hover e selected. La regione “si accende” solo come linea.

4. Taglia e scala (P1). Il testo è circa 13px (stima a occhio dallo screenshot), con altezza maiuscole di 9px, su un display da 1440. Per riferimento, le linee guida TV di Amazon indicano 28px come minimo su 1080p, da usare come soglia minima e non come obiettivo. Un gioco desktop non è una TV, ma 13px in oro su sfondo variabile è sotto qualsiasi soglia comoda. Non vedo nessuna logica di LOD: le buone pratiche prevedono di non etichettare tutto, variare la densità per zoom e scartare le etichette che si sovrappongono invece di comprimerle. 
gameaccessibilityguidelines

atlas


5. Zero informazione e zero affordance (P1). Un click su questa targa cosa fa? Non c’è pericolo, livello, risorse, stato di esplorazione. Non c’è niente che dica “interagibile”. La targa occupa circa 215×30px e restituisce solo un nome.

6. Ornamento che diventa rumore (P2). I terminali a punta e il doppio bordo oro a 30px di altezza diventano pixel sporchi. Il pin senza icona sotto (quello vuoto a destra) ha lo stesso peso visivo della targa, e la gerarchia si appiattisce.

7. Nessun aggancio al terreno (P2). È un blocco opaco scuro senza alone, senza ombra radente e senza fade verso la mappa. La ricerca suggerisce l’alternativa: gli aloni testuali servono proprio sugli sfondi affollati. 
mapbox


Cosa salvare
Palette navy/oro coerente col sistema.
Serif maiuscolo con tracking ampio. È il registro giusto: le label di regione sono tipicamente in maiuscolo o small caps, di peso medio. 
atlas

Il contrasto oro su navy dentro la targa è ampiamente sopra il 4.5:1 consigliato.
Proposta: sistema a due livelli

Livello A, idle. Niente targa. Il nome è inchiostro sulla mappa, curvo lungo la “spina” della regione, con alone scuro, tracking largo, opacità e dimensione guidate dallo zoom. Ha un arco leggero: gli archi funzionano, i percorsi curvi complessi no. Il testo resta sempre leggibile da sinistra a destra. 
redblobgames


Livello B, hover/selected. Compare una targa compatta ancorata al punto di massima distanza dai bordi, in screen-space a dimensione costante, con codoli di puntamento e dati utili. Il contorno diventa duale, con dimming del resto della mappa.

1. Ancoraggio con polylabel

ts
import polylabel from 'polylabel';

type Ring = [number, number][];

export function labelAnchor(rings: Ring[]) {
  const p = polylabel(rings, 1.0);      // polo di inaccessibilità
  return { x: p[0], y: p[1], r: p.distance }; // r = raggio del cerchio inscritto
}

Il polo cade nel punto più “dentro” del lobo maggiore, quindi non finisce più sul collo di strozzatura.

2. Etichetta curva con alone (SVG sopra il canvas)

tsx
const arcPath = (cx: number, cy: number, len: number, bend = 0.12) =>
  `M ${cx - len / 2} ${cy} Q ${cx} ${cy - len * bend * 2} ${cx + len / 2} ${cy}`;

export function RegionLabel({ id, name, anchor, zoom, textLen }: Props) {
  const rScreen = anchor.r * zoom;
  if (rScreen * 2 < textLen * 0.8) return null;       // scarta, non comprimere

  const fontPx = Math.min(28, Math.max(13, rScreen * 0.16));
  const k = fontPx / zoom;                            // contro-scala: size costante a schermo
  const len = Math.min(rScreen * 1.7, textLen * 1.4) / zoom;

  return (
    <g style={{ opacity: Math.min(1, (rScreen - 40) / 80) }} pointerEvents="none">
      <path id={id} d={arcPath(anchor.x, anchor.y, len)} fill="none" />
      <text className="region-label" style={{ fontSize: k }}>
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{name}</textPath>
      </text>
    </g>
  );
}

css
.region-label {
  font-family: 'Cinzel', serif;
  font-variant-caps: all-small-caps;
  letter-spacing: .22em;
  fill: #f1e4b8;
  stroke: rgba(8, 22, 30, .75);
  stroke-width: .18em;
  stroke-linejoin: round;
  paint-order: stroke fill;          /* alone dietro, testo sopra */
}
3. Contorno duale con dimming esterno

tsx
export function RegionHighlight({ d, W, H, state }: Props) {
  return (
    <svg className={`region-hl is-${state}`} width={W} height={H}>
      {/* evenodd: scurisce tutto tranne la regione */}
      <path d={`M0 0H${W}V${H}H0Z ${d}`} fillRule="evenodd" fill="rgba(5,14,20,.38)" />
      <path d={d} fill="rgba(233,196,106,.07)" />
      <path d={d} className="hl-under" />
      <path d={d} className="hl-over" />
    </svg>
  );
}

css
.hl-under { fill: none; stroke: #0b1c24; stroke-width: 6; stroke-linejoin: round;
            opacity: .85; vector-effect: non-scaling-stroke; }
.hl-over  { fill: none; stroke: #e9c46a; stroke-width: 2; stroke-dasharray: 10 6;
            vector-effect: non-scaling-stroke; animation: march 1.4s linear infinite; }
.is-hover .hl-over { opacity: .6; animation: none; stroke-dasharray: none; }
@keyframes march { to { stroke-dashoffset: -16; } }
@media (prefers-reduced-motion: reduce) { .hl-over { animation: none; } }

Lo stroke scuro sotto e quello chiaro sopra garantiscono contrasto su verde, arancio e sabbia. È la tecnica standard per i contorni su sfondi eterogenei.

4. Targa compatta, solo in hover/selected

tsx
export function RegionPlaque({ name, danger, resources, x, y }: Props) {
  return (
    <div className="plaque" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <div className="plaque-name">{name}</div>
      <div className="plaque-meta">
        <span className="pips" aria-label={`Pericolo ${danger} su 5`}>
          {'◆'.repeat(danger)}{'◇'.repeat(5 - danger)}
        </span>
        {resources.map(r => <i key={r} className={`ico ico-${r}`} />)}
      </div>
    </div>
  );
}

css
.plaque {
  position: absolute; left: 0; top: 0; pointer-events: none;
  margin: calc(-100% - 14px) 0 0 -50%;          /* sopra l'ancora */
  padding: 7px 16px 8px;
  background: linear-gradient(#17394a, #0d232e);
  border: 1px solid #c9a24d;
  box-shadow: 0 0 0 1px #05141b, 0 8px 16px rgba(0,0,0,.45);
}
.plaque::after {                                  /* codolo verso l'ancora */
  content: ""; position: absolute; left: 50%; bottom: -7px;
  width: 12px; height: 12px; transform: translateX(-50%) rotate(45deg);
  background: #0d232e; border: solid #c9a24d; border-width: 0 1px 1px 0;
}
.plaque-name { font: 600 15px/1.1 'Cinzel', serif; letter-spacing: .14em;
               text-transform: uppercase; color: #f1e4b8; }
.plaque-meta { display: flex; gap: 8px; align-items: center; margin-top: 4px;
               font-size: 12px; color: #c9a24d; }

Se la mappa è un canvas Pixi, le stesse idee valgono: Text con stroke e strokeThickness, e contro-scala a ogni frame con label.scale.set(1 / world.scale.x).

Criteri di accettazione
Testo ≥ 4.5:1 su almeno tre terreni campionati (foresta, deserto, costa). Con sfondo non uniforme servono contorni e ombre marcati. 
gameaccessibilityguidelines

Outline ≥ 3:1 sugli stessi tre terreni.
Nessuna label sovrapposta a pin o hitbox cliccabili.
Altezza testo ≥ 13px a schermo a qualunque zoom e con scala UI al 100%. Con scala al 200% niente deve uscire dallo schermo.
Il confine del poligono coincide con l’illustrazione. Questo è lavoro di art direction, non di codice.

Se mi mandi lo schema dei poligoni delle regioni, posso adattare il placement a quel formato.






ora
