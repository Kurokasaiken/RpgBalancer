Claude ha risposto: Verdetto
Cercato sul web, memoria letta

Cercato sul web, memoria letta
Verdetto

Il componente è esteticamente coerente con l’art direction (cornice dorata, tono pittorico) ma funzionalmente è una barra decorativa, non uno strumento di navigazione. Come stato dell’arte AAA direi 5.5/10: bello in screenshot, debole in uso. Giudico da screenshot statici, quindi hover/pressed/focus non li vedo e i contrasti sono stime a occhio, da verificare con un tool.

Critica spietata

1. Lo stato attivo è troppo timido. Tra Village e Map la differenza è un gradiente teal appena percettibile, mentre le etichette restano dorate in entrambi i casi. Le linee guida chiedono che lo stato attivo non dipenda dal solo colore, ma usi anche peso, indicatore o forma (un indicatore distinguibile con più di un solo colore). Gli elementi UI e i loro stati selezionati dovrebbero avere almeno 3:1 di contrasto con i colori adiacenti. Qui rischi di non arrivarci, e il teal-su-teal-scuro-su-oceano-teal della mappa peggiora la situazione. 
skillselion

boia


2. I tab bloccati sono “ghost tab”. Workshop e Tavern sono grigi con un lucchetto da ~8px nell’angolo. Non dicono perché sono bloccati né cosa serve per sbloccarli. Il lucchetto è un’icona-francobollo, e al giorno 3 metà della barra è decorazione morta. Le guide mettono in guardia contro i tab fantasma senza contenuto associato. Un tab disabilitato ha senso quando comunica che potrebbe diventare disponibile in futuro, ma il tuo non comunica niente. Nota: i controlli inattivi sono tecnicamente esenti dal requisito di contrasto, ma questo non è un permesso di renderli illeggibili. 
Tabs UI design guide
 +2


3. Il pulsante compass nel mezzo è un errore di architettura. È un’azione (presumo “centra/recenter”), ma sta dentro una barra di navigazione. La regola è che una tab bar serve solo a navigare, non a eseguire azioni. Inoltre: 
apple


spezza la barra in due gruppi (2 sbloccati | 2 bloccati) che semanticamente non esistono;
l’icona a mirino si legge come “bersaglio/attacca”, non come “ricentra”;
duplica lo stile dei 3 cerchi in basso a destra, quindi non è chiaro quale famiglia di controlli sia;
in vista Village non è chiaro cosa faccia.

4. Larghezze irregolari. Gli slot seguono la lunghezza dell’etichetta (Map stretto, Workshop largo). Una barra di navigazione dovrebbe avere slot uguali, perché la memoria muscolare si costruisce sulla posizione. Le guide dicono anche di non far andare a capo o troncare le etichette (niente wrapping né troncamento), quindi slot fissi con min-width sono la soluzione. 
toyota-europe


5. Scala tipografica e icone. Le icone (~14px) perdono il dettaglio: il cartello del Workshop e la botte della Tavern si leggono a stento. Le etichette in small caps spaziate a ~11px, oro su teal scuro, sono il testo più piccolo e fragile dell’intera HUD, mentre la risorsa FOOD in alto è molto più leggibile. Sul viewport mobile (390px) con 4 slot + compass + cornice non entri.

6. Rumore di cornici. Cornice esterna doppia, bordo interno di ogni tab, bordo teal sull’attivo, cerchio dorato della compass: quattro grammatiche di bordo in 530px. Una cornice ornata dovrebbe contenere elementi piatti e silenziosi, non competere con loro.

7. Zero metadati di gioco. Nessun hotkey sui tab, mentre la schermata Village sfoggia R, ←→, Esc. Nessun badge di notifica, e i badge servono proprio a mostrare lo stato del contenuto del tab senza aprirlo. Il Village potrebbe mostrare “villager inattivi”, la Tavern “evento in arrivo”. Oggi la barra non sa niente del gioco. 
uxplanet


8. Cosa funziona. Il teal dell’attivo riecha il pill ×1 dei controlli tempo: stesso token per “selezionato”, ottima coerenza. Le icone scelte sono diegetiche e la sagoma a “coperchio” della barra è un bel segno distintivo. Tienili.

Proposta

Principi: 4 slot uguali, azione fuori dalla barra, stato attivo a 3 canali (fondo + indicatore + luminosità), bloccato = informativo, hotkey e badge come cittadini di prima classe.

Layout: il compass diventa contestuale, nel cluster in basso a destra (visibile solo in vista Map, con hotkey C e tooltip). La barra torna a 4 slot simmetrici.

Componente React

tsx
type TabId = 'village' | 'map' | 'workshop' | 'tavern';

interface DockTab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  hotkey: string;                    // '1'..'4'
  badge?: number | '!';
  locked?: { reason: string };       // es. "Costruisci la Falegnameria (Villaggio lv.2)"
}

export function NavDock({ tabs, active, onSelect, onLockedAttempt }: {
  tabs: DockTab[]; active: TabId;
  onSelect: (id: TabId) => void;
  onLockedAttempt: (t: DockTab) => void;   // shake + toast col requisito
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      const t = tabs.find(x => x.hotkey === e.key);
      if (t) t.locked ? onLockedAttempt(t) : onSelect(t.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tabs, onSelect, onLockedAttempt]);

  return (
    <nav className="dock" aria-label="Navigazione principale">
      <ul className="dock__list">
        {tabs.map(t => (
          <li key={t.id}>
            <button

              className="dock__tab"
              data-active={t.id === active}
              data-locked={!!t.locked}
              aria-current={t.id === active ? 'page' : undefined}
              aria-disabled={!!t.locked}          // resta focusabile e annunciato
              aria-describedby={t.locked ? `${t.id}-why` : undefined}
              onClick={() => (t.locked ? onLockedAttempt(t) : onSelect(t.id))}
            >
              <span className="dock__icon">{t.icon}</span>
              <span className="dock__label">{t.label}</span>
              <kbd className="dock__key">{t.hotkey}</kbd>
              {t.badge && <span className="dock__badge">{t.badge}</span>}
              {t.locked && <span className="dock__lock" aria-hidden />}
            </button>
            {t.locked && (
              <span id={`${t.id}-why`} role="tooltip" className="dock__why">
                {t.locked.reason}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
CSS

css
.dock__list {
  display: grid;
  grid-template-columns: repeat(4, minmax(88px, 1fr)); /* slot uguali, regge 390px */
  gap: 1px;                                            /* divisori, non 4 box bordati */
}
.dock__tab {
  position: relative; min-height: 60px;
  display: grid; place-items: center; gap: 2px;
  background: transparent; border: 0;
  color: color-mix(in oklab, var(--gold) 62%, transparent);   /* inattivo ~ -40% */
  font: 600 12.5px/1 var(--font-display); letter-spacing: .08em; text-transform: uppercase;
  transition: color .15s, background .15s;
}
.dock__icon svg { width: 24px; height: 24px; }               /* era ~14px */

/* ATTIVO: 3 canali, non solo colore */
.dock__tab[data-active='true'] {
  color: var(--gold-bright);
  background: radial-gradient(120% 90% at 50% 100%, rgb(255 214 120 / .22), transparent 70%),
              linear-gradient(var(--teal-700), var(--teal-900));
  box-shadow: inset 0 -3px 0 var(--gold-bright);             /* indicatore */
  text-shadow: 0 0 10px rgb(255 214 120 / .45);
}
.dock__tab[data-active='true'] .dock__icon { filter: drop-shadow(0 0 6px rgb(255 214 120 / .5)); }

/* HOVER / FOCUS (≥2px, ≥3:1) */
.dock__tab:hover:not([data-active='true']) { color: var(--gold); background: rgb(255 255 255 / .04); }
.dock__tab:focus-visible { outline: 2px solid var(--focus-cyan); outline-offset: -4px; }

/* BLOCCATO: lucchetto sopra l'icona, non francobollo nell'angolo */
.dock__tab[data-locked='true'] { color: color-mix(in oklab, var(--ink) 45%, transparent); cursor: not-allowed; }
.dock__tab[data-locked='true'] .dock__icon { opacity: .35; }

.dock__lock { position: absolute; top: 10px; left: 50%; width: 18px; height: 18px;
  transform: translateX(-50%); background: url('/ui/lock-brass.svg') center/contain no-repeat; }
.dock__why { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%);
  padding: 8px 12px; max-width: 240px; background: var(--panel-ink); border: 1px solid var(--gold-dim);
  opacity: 0; pointer-events: none; transition: opacity .12s; }
li:hover > .dock__why, li:focus-within > .dock__why { opacity: 1; }

/* Hotkey + badge */
.dock__key { position: absolute; top: 5px; left: 7px; font: 600 10px var(--font-mono); opacity: .55; }
.dock__badge { position: absolute; top: 6px; right: 10px; min-width: 16px; height: 16px;
  border-radius: 8px; background: var(--ember); color: #1a0d05; font: 700 10px/16px var(--font-ui); text-align: center; }

/* Tentativo su bloccato */
@keyframes deny { 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
.dock__tab.is-denied { animation: deny .18s 2; }
@media (prefers-reduced-motion: reduce) { .dock__tab.is-denied { animation: none; outline: 2px solid var(--ember); } }
Quick win in ordine di impatto
Rimuovi il compass dalla barra e portalo nel cluster destro (30 min, risolve semantica e mobile).
Indicatore attivo a 3 canali (il blocco CSS sopra).
Tooltip + toast sul bloccato con il requisito esatto, e valuta di mostrare solo il prossimo tab sbloccabile come teaser.
Slot uguali + icone a 24px.
Hotkey + badge collegati allo stato di gioco.

Dal lato QA, aggiungerei al catalogo gli stati mancanti hover, pressed, focus-visible, locked-denied, badge, così la prossima critica può giudicare anche il comportamento e non solo la posa statica. Se vuoi, posso fare un secondo passaggio come “critico severo” in formato verdict JSON, oppure disegnare un mockup SVG dell’attivo/bloccato.






1 minuto fa