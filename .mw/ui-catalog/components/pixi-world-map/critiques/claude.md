Claude ha risposto: Ho preso come componente il Village Stash, il pannello centrale.
Cercato sul web, memoria letta

Cercato sul web, memoria letta

Ho preso come componente il Village Stash, il pannello centrale. Il card Warehouse lo tratto solo dove interferisce. Le misure sono stimate a occhio dallo screenshot a 1440×900, non misurate. Più sotto c’è uno script per verificarle davvero.

Verdetto

È un pannello coerente con il mood dell’art direction, ma oggi sembra una lista di tooltip impilati. Il diorama dietro è più curato del pannello, l’informazione importante (capacità e stato degli item) è la più debole, e quella ridondante è la più rumorosa.

Cosa ho verificato online
Le linee guida Xbox (XAG) indicano un contrasto minimo di 4.5:1 per il testo di dimensione standard, e una modalità ad alto contrasto con rapporto di almeno 7:1. 
xbox

xbox

Il testo UI dovrebbe stare intorno a 28px a 1080p. È un riferimento pensato per console e TV. Su PC si può scendere, ma i tuoi ~11px restano ben sotto qualsiasi soglia difendibile. 
abratabia

L’informazione non va mai veicolata dal solo colore. 
abratabia

Per l’inventario, i pattern ibridi funzionano bene: griglia per gli slot, lista per il resto, e la griglia solo se è una scelta deliberata. 
strayspark

Chi ha un item deve sapere perché ce l’ha. Questo pesa sul tema delle prenotazioni, più sotto. 
strayspark

Critica
P0: leggibilità e ridondanza
Il testo secondario è troppo piccolo e troppo spento. Le righe “+15 to Strength checks” sono un serif da ~11px, oro-grigio su teal scuro. Probabilmente non arrivano a 4.5:1, e con il serif decorativo la resa è peggiore.
Ogni riga dice la stessa cosa due volte. “Strength Bonus — +15 to one check” seguito da “+15 to Strength checks”. Healing ripete “+20 HP to the most hurt” nel titolo e nella descrizione. Sono 6 righe e 12 linee di testo, per 6 informazioni.
La quantità è illeggibile. Il badge “×1” sull’angolo dell’icona è di ~8px e sembra tagliato. È proprio il dato che cambia quando prenoti items nel planner.
Le sei icone sono tutte uguali. Stessa cornice, stesso oro, glifi piccoli. Non c’è categoria (check, cura, infiltrazione), quindi non si scansiona.
P1: gerarchia e stato
Header debole, bottoni forti. Il titolo “VILLAGE STASH” è piccolo, mentre minimize e close sono due cerchi con anello pesante e di fatto dominano l’intestazione.
La capacità è solo una frase. “6 OF 24 GOODS IN STORE” è testo oro maiuscolo tracciato. Non vedi che mancano 18 slot. Inoltre “goods” non è il vocabolario del resto (items, stock).
La modalità sola lettura è invisibile. L’unico indizio è “Open a quest planner to pack items into its bag”, la riga più debole del pannello. Le righe non hanno hover, cursore o stato disabilitato, quindi sembrano cliccabili e non lo sono.
Le prenotazioni spariscono senza traccia. Rimuovere la riga riservata è una decisione già presa e la rispetto. Ma un item prenotato da una spedizione può far sembrare che lo stock sia calato senza motivo. Serve almeno un riepilogo aggregato (non una riga), da sottoporre al Director.
P1: composizione
Due pannelli con lo stesso peso visivo, attaccati. Stash e Warehouse hanno stessa cornice, stesso oro, nessuno scrim, nessuna gerarchia di focus. Non capisci quale è attivo.
Ridondanza di navigazione. Il card Warehouse offre “OPEN WAREHOUSE” mentre il contenuto del magazzino è già aperto accanto. Il testo del bottone va a capo su due righe (“OPEN / WAREHOUSE”). Il bottone UPGRADE disabilitato con “preview only” in corsivo minuscolo è la peggior copy di stato che c’è sullo schermo.
Il pannello copre il villaggio. Sta al centro, proprio sulla scena che stai gestendo, quando potrebbe stare su un bordo.
P2
Tabular nums assenti. Le cifre (80, 25, 60, 4d nel costo, 24 → 48) usano le stesse figure del testo.
Touch target. Le righe sono ~42px, sotto i 44px consigliati. Per il pass mobile 390×844 diventa un problema.
Soluzioni
1. Token tipografici e di colore

Il pavimento è 13px per il testo secondario. I colori sono indicativi e vanno validati dallo script del punto 6.


css
:root {
  --text-2xs: 0.8125rem;  /* 13px, mai sotto */
  --text-sm: 0.9375rem;
  --text-md: 1.0625rem;

  --ink-primary:   #f4ecd4;
  --ink-secondary: #c9c3a8;
  --ink-effect:    #9fe0cf;   /* i numeri dell'effetto hanno un loro colore */
  --accent-gold:   #e3b95f;
  --surface-panel: #0a1d24;

  --cat-check:  #d9a441;
  --cat-heal:   #d8685f;
  --cat-stealth:#7a93d6;
  --cat-climb:  #8fbf7a;
}

.num { font-variant-numeric: tabular-nums lining-nums; }
2. Riga item senza ridondanza

Nome e effetto sono separati nei dati, quindi niente “—” nel titolo. L’effetto è compresso in una sola riga. La quantità passa dall’angolo dell’icona a una pillola a destra. La categoria usa colore più forma, mai solo colore.


tsx
type StashItem = {
  id: string;
  icon: IconId;
  category: 'check' | 'heal' | 'stealth' | 'climb';
  qty: number;       // copie massime (da config Zod, non hardcodato)
  reserved: number;  // prenotate da borse
};

export function StashRow({ item }: { item: StashItem }) {
  const { t } = useTranslation('idleVillage');
  const available = item.qty - item.reserved;   // se 0, la riga è filtrata a monte

  return (
    <li className="stash-row" data-category={item.category}>
      <ItemIcon id={item.icon} category={item.category} />
      <div className="stash-row__body">
        <span className="stash-row__name">{t(`stash.item.${item.id}.name`)}</span>
        <span className="stash-row__effect">{t(`stash.item.${item.id}.effect`)}</span>
      </div>
      <span className="qty num" aria-label={t('stash.qty', { count: available })}>
        ×{available}
      </span>
    </li>
  );
}

json
"stash": {
  "item": {
    "strength-bonus": { "name": "Strength Bonus", "effect": "+15 Strength · one check" },
    "healing":        { "name": "Healing",        "effect": "+20 HP · most hurt member" }
  }
}

css
.stash-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px;
             align-items: center; min-height: 48px; padding: 4px 12px; }
.stash-row__name   { font-size: var(--text-md); color: var(--ink-primary); }
.stash-row__effect { font-size: var(--text-2xs); color: var(--ink-secondary); }
.stash-row__effect::first-letter { color: var(--ink-effect); } /* oppure wrappa il numero in <b> */
.qty { font-size: var(--text-md); color: var(--accent-gold);
       min-width: 2.5ch; text-align: right; }

Nota per i contratti: la stringa dell’effetto va nel catalogo i18n (en, it-IT, pseudo). Il test sulla pseudo-localizzazione deve verificare che la riga regga +40% di lunghezza senza troncare la quantità.

3. Capacità come barra a slot

Qui il pattern ibrido torna utile: la lista resta, ma la capacità diventa una griglia di tacche. Con l’upgrade a 48 il pannello non cambia forma, cambiano solo le righe di tacche.


tsx
export function CapacityMeter({ used, capacity }: { used: number; capacity: number }) {
  const { t } = useTranslation('idleVillage');
  const full = used >= capacity;
  return (
    <div className="cap" data-state={full ? 'full' : 'ok'}
         role="meter" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={used}
         aria-label={t('stash.capacity')}>
      <div className="cap__cells">
        {Array.from({ length: capacity }, (_, i) => <i key={i} data-filled={i < used} />)}
      </div>
      <span className="cap__label num"><b>{used}</b> / {capacity}</span>
      {full && <WarnIcon aria-hidden />}   {/* forma + testo, non solo colore */}
    </div>
  );
}

css
.cap__cells { display: grid; grid-template-columns: repeat(12, 1fr); gap: 3px; }
.cap__cells i { height: 6px; border-radius: 1px; background: #ffffff1a; }
.cap__cells i[data-filled="true"] { background: var(--accent-gold); }
.cap[data-state="full"] .cap__cells i[data-filled="true"] { background: var(--cat-heal); }

Il footer testuale “6 OF 24 GOODS IN STORE” si può eliminare. Il numero “6 / 24” sta già nella label della barra.

4. Gerarchia tra pannelli (focus stack)

Un solo pannello ha il focus, gli altri si abbassano. Lo stato di dominio condiviso va in Zustand, in linea con i vincoli.


ts
type PanelId = 'stash' | 'building-card' | 'registry';
export const usePanelFocus = create<{
  stack: PanelId[];
  focus: (id: PanelId) => void;
  close: (id: PanelId) => void;
}>((set) => ({
  stack: [],
  focus: (id) => set((s) => ({ stack: [...s.stack.filter((p) => p !== id), id] })),
  close: (id) => set((s) => ({ stack: s.stack.filter((p) => p !== id) })),
}));

css
.panel[data-focus="false"] { filter: saturate(.55) brightness(.72); }
.panel[data-focus="true"]  { box-shadow: 0 0 0 1px var(--accent-gold), 0 24px 60px #000a; }

Per il Warehouse card, quando lo stash è già aperto il CTA diventa “Close” o sparisce. Il testo del bottone non va mai a capo: white-space: nowrap più un’etichetta più corta (“Open stash”).

5. Sola lettura leggibile

Righe senza hover e con cursore default, e un rigo informativo in alto, non sepolto in fondo:


css
.stash[data-mode="readonly"] .stash-row { cursor: default; }
.stash[data-mode="readonly"] .stash-row:hover { background: transparent; }

tsx
<p className="stash__mode" role="note">
  <LockIcon aria-hidden /> {t('stash.readonly')}   {/* "Pack items from a quest planner" */}
</p>

Per la prenotazione aggregata (proposta, serve ruling del Director): una riga unica sotto la barra, “2 packed in expeditions”, visibile solo se > 0. Non reintroduce righe, ma risponde al “perché ne ho meno”.

6. Verifica automatica del contrasto

Così il 4.5:1 non resta un’opinione. Il test vive accanto ai token e fallisce se qualcuno li cambia al ribasso.


ts
const lin = (c: number) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
export const ratio = (a: string, b: string) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

it.each([
  ['--ink-primary',   '#f4ecd4'],
  ['--ink-secondary', '#c9c3a8'],
  ['--accent-gold',   '#e3b95f'],
])('%s ≥ 4.5:1 su surface-panel', (_n, fg) => {
  expect(ratio(fg, '#0a1d24')).toBeGreaterThanOrEqual(4.5);
});
7. Posizionamento

Meglio agganciare lo stash a un bordo laterale come drawer (≈ 380px), così il villaggio resta visibile e le priorità del gioco, cioè edifici e risorse, non sono coperte. Il drawer, a differenza del popup centrale, si adatta anche al layout a sheet del pass mobile.

Ordine di intervento consigliato
Token e dimensione testo (punto 1), con dedupe delle righe (punto 2): il guadagno più grande al costo più basso.
Capacity meter (3) e focus stack (4).
Sola lettura e riepilogo prenotazioni (5), previo ruling.
Posizionamento come drawer (7), da validare insieme al pass mobile.

Se vuoi, preparo la bozza di emendamento dei contratti (village-stash-panel.md) con i test aggiornati nello stesso diff, oppure un mockup HTML dello stash ridisegnato da confrontare con lo screenshot.






ora