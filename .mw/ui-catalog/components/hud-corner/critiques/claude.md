Claude ha risposto: Parto da una ricerca di riferimento (linee guida su HUD, target, leggibilità su Steam Deck, hamburger menu), poi passo alla critica.
Analisi della gerarchia dei pulsanti e della sicurezza dell'HUD nascosto

Analisi della gerarchia dei pulsanti e della sicurezza dell'HUD nascosto

Parto da una ricerca di riferimento (linee guida su HUD, target, leggibilità su Steam Deck, hamburger menu), poi passo alla critica.

Cercato sul web

Cercato sul web
Design review: cluster HUD in basso a destra

Ho esaminato i tre dischi (menu, pannelli, occhio), i due popover e lo stato “HUD nascosto”. Le misure sono stimate dagli screenshot a 1440×900, e non vedo hover, focus o animazioni, quindi giudico solo ciò che è fermo sullo schermo.

Verdetto

L’estetica regge: l’oro e il teal sono coerenti con la mappa, la tipografia è seria, e l’hotkey allineata a destra su ogni riga è una scelta rara e giusta. L’architettura dell’informazione e il comportamento sono invece da rifare. Tre controlli con lo stesso peso nascondono tre funzioni molto diverse. Il popover più grande è un ripostiglio. Lo stato “UI nascosta” è una trappola.

Critica
P0: da non rilasciare così

1. I pannelli sono duplicati. La sezione “Panels” del menu hamburger ripete la lista del secondo bottone, con le stesse sei voci e le stesse lettere. L’utente non sa quale dei due sia “quello giusto” e il costo di manutenzione raddoppia. È il difetto più grave perché è strutturale.

2. “Nascondi HUD” è una trappola. Nei tuoi screenshot il cibo è a 0/20 con “0 d left”, quindi il villaggio sta morendo di fame. Se premo l’occhio sparisce tutto: pausa, velocità, risorse e allarmi, mentre la simulazione continua. Il pulsante per tornare indietro è un disco di ~40px, quasi mimetizzato sul mare, senza etichetta e con un’icona di occhio chiuso con ciglia che pochi riconosceranno. C’è anche ambiguità di stato: l’icona mostra lo stato (occhio aperto = visibile), non l’azione. Un toggle icon-only che cambia glifo è il pattern più frainteso che esista.

3. Il popover del menu è una discarica. Alto ~690px su 900 (circa il 77% dello schermo), contiene 20+ elementi di tre nature diverse: navigazione (Panels), sistema (Session) e preferenze (Options). Ne derivano quattro problemi:

A 1366×768, o a scala 125–150%, il popover esce dallo schermo. Non ha max-height né scroll.
Contiene “Interface size”, cioè il controllo che ridimensiona il popover stesso mentre ci clicchi sopra.
“Quit to title” ha lo stesso stile di “Save now” e sta a due righe da “Memorial…”. È un’azione distruttiva a un click di distanza e senza conferma visibile.
Le stringhe italiane sono più lunghe (“Village stash” diventa “Magazzino del villaggio”, 23 caratteri in maiuscolo con letter-spacing). In 190px utili insieme al badge hotkey troncherà o andrà a capo.
P1: gravi

4. Icone senza etichette, e hamburger su desktop. Le ricerche NN/g mostrano che nascondere la navigazione riduce la discoverability quasi della metà, e su desktop il danno è maggiore che su telefono. L’icona dei “due quadrati sovrapposti” in UI significa “copia”, non “pannelli”. Non c’è tooltip né hotkey sul trigger. Per un hamburger, la buona pratica minima è affiancargli la parola “Menu”.

5. Pesi uguali per frequenze diverse. I pannelli si aprono decine di volte a sessione, il menu di sistema poche volte, “nascondi UI” quasi mai. Qui hanno la stessa dignità, e il menu di sistema non vive dove i giocatori PC lo cercano: Esc. Anche le linee guida di Google per i giochi raccomandano la chiusura di menu e dialog con Esc.

6. Dimensioni dei target e del testo.

I dischi misurano ~40px con ~8px di gap. WCAG 2.5.8 richiede 24×24 CSS px o spaziatura sufficiente, quindi passate il minimo di legge, ma Material consiglia 48dp con 8dp di spazio per i touch.
Le righe del menu sono alte ~28px.
Il testo è ~12px in maiuscolo con tracking. Per Steam Deck Valve fissa 9px come minimo assoluto a 1280×800 e raccomanda 12px, con testo leggibile a 30 cm. Tu spedisci su Steam, quindi sei al limite proprio dove non puoi permettertelo.
Lo scaling deve poi arrivare al 200% senza perdere contenuto o funzione e senza costringere a scroll sui due assi.

7. Nessuno stato.

Il trigger non cambia aspetto quando il popover è aperto (hamburger identico tra immagine 2 e 4; il bottone Panels si accende appena).
Non ci sono badge per eventi non letti.
Non vedo focus ring né navigazione da gamepad, mentre le linee guida di accessibilità ai giochi chiedono che tutta la UI sia raggiungibile con lo stesso input del gameplay.
P2: rifiniture
Gerarchia piatta nel popover. “OPTIONS” e “LANGUAGE” hanno lo stesso stile oro maiuscolo. I chip “150% 200%” vanno a capo come orfani, e coesistono due linguaggi di bottone: pillole lunghe nere lucide e pillole piccole con bordo sottile.
Stile e punteggiatura incoerenti. Il lucido “plastico” dei bottoni stona con la mappa a inchiostro e acquarello. Inoltre “Load game…”, “Memorial…” e “All settings…” hanno l’ellissi (aprono un dialog), mentre “Quit to title”, che dovrebbe chiedere conferma, no.
Possibili pannelli di sviluppo esposti. Se “Director” e “Tuning” sono strumenti di bilanciamento, non devono stare in una lista player-facing accanto a Roster.
Hotkey M. In un gestionale M è quasi universalmente “Map”, qui è “Merchant” e la mappa è già un tab.
Cluster senza cornice. Gli altri tre gruppi HUD hanno una placca ornata, questo ha tre dischi nudi.
Proposta

Principio: un controllo, un lavoro.

I pannelli di gioco diventano un dock sempre visibile, con icona, hotkey, badge e tooltip.
Il menu di sistema vive su Esc ed è un dialog centrato con Resume, Save, Load, Memorial, Settings e, separato e rosso, Quit.
Lingua e dimensione UI escono dall’HUD e vanno in Settings.
Nascondi UI esce dal cluster: diventa un tasto (H) più una voce nel menu di pausa, con regole di sicurezza.
1. Fonte unica per pannelli e hotkey (elimina la duplicazione)

ts
// panels.ts
export const PANELS = [
  { id: 'roster',   code: 'KeyR', key: 'R', icon: 'users',   i18n: 'panel.roster' },
  { id: 'events',   code: 'KeyE', key: 'E', icon: 'scroll',  i18n: 'panel.events', badge: 'unreadEvents' },
  { id: 'stash',    code: 'KeyV', key: 'V', icon: 'chest',   i18n: 'panel.stash' },
  { id: 'merchant', code: 'KeyM', key: 'M', icon: 'coins',   i18n: 'panel.merchant' },
  { id: 'director', code: 'KeyD', key: 'D', icon: 'compass', i18n: 'panel.director', dev: true },
  { id: 'tuning',   code: 'KeyT', key: 'T', icon: 'sliders', i18n: 'panel.tuning',   dev: true },
] as const;
2. Dock con stati, tooltip e hotkey

tsx
export function HudDock() {
  const { openId, toggle } = usePanels();
  const counts = useGameStore(s => ({ unreadEvents: s.unreadEvents }));
  const dev = useSettings(s => s.devMode);

  useHotkeys(PANELS, p => toggle(p.id)); // stesso array: niente deriva

  return (
    <nav className="hud-dock" aria-label={t('hud.panels')}>
      {PANELS.filter(p => !p.dev || dev).map(p => (
        <DockButton
          key={p.id} icon={p.icon} label={t(p.i18n)} hotkey={p.key}
          pressed={openId === p.id} badge={p.badge ? counts[p.badge] : 0}
          onClick={() => toggle(p.id)}
        />
      ))}
      <span className="hud-dock__sep" role="separator" />
      <DockButton icon="menu" label={t('hud.menu')} hotkey="Esc"
                  pressed={useMenuOpen()} onClick={openPauseMenu} />
    </nav>
  );
}

function DockButton({ icon, label, hotkey, pressed, badge = 0, onClick }: Props) {
  return (
    <button className="dock-btn" aria-pressed={pressed}
            aria-keyshortcuts={hotkey} aria-label={`${label} (${hotkey})`}
            data-tip={label} onClick={onClick}>
      <Icon name={icon} />
      {badge > 0 && <span className="dock-btn__badge" aria-hidden>{badge > 9 ? '9+' : badge}</span>}
      <kbd className="dock-btn__key" aria-hidden>{hotkey}</kbd>
    </button>

  );
}

css
:root {
  --ui-scale: 1;
  --hud-btn: calc(44px * var(--ui-scale));
  --fs-ui: max(12px, calc(13px * var(--ui-scale)));   /* mai sotto 12px */
  --gold: #d9b45a; --ink: #0c1b24; --teal: #1f7f8a;
}
.hud-dock {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  display: flex; gap: 8px; padding: 6px;
  border: 1px solid color-mix(in srgb, var(--gold) 55%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--ink) 90%, transparent);
}
.dock-btn { position: relative; width: var(--hud-btn); height: var(--hud-btn);
            border-radius: 50%; font-size: var(--fs-ui); }
.dock-btn::before { content: ""; position: absolute; inset: -4px; } /* hit area 52px, look invariato */
.dock-btn[aria-pressed="true"] { background: var(--teal); box-shadow: inset 0 0 0 2px var(--gold); }
.dock-btn:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
.dock-btn__key { position: absolute; right: -2px; bottom: -2px; font: 600 12px/1 var(--font-ui);
                 padding: 2px 4px; border-radius: 4px; background: var(--ink); color: var(--gold); }
.dock-btn__badge { position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px;
                   border-radius: 9px; background: #c0392b; color: #fff; font: 700 12px/18px var(--font-ui); }
.dock-btn::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 10px); right: 0;
                   white-space: nowrap; opacity: 0; transition: opacity 120ms; pointer-events: none; }
.dock-btn:is(:hover, :focus-visible)::after { opacity: 1; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
3. Menu di pausa su Esc, con azione distruttiva gestita

tsx
function PauseMenu({ onClose }: { onClose: () => void }) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const lastSaved = useGameStore(s => s.lastSavedAgo);
  useHotkey('Escape', onClose);

  return (
    <Dialog onClose={onClose} aria-labelledby="pause-title">
      <h2 id="pause-title">{t('pause.title')}</h2>
      <MenuList>
        <Item autoFocus onSelect={onClose}>{t('pause.resume')}</Item>
        <Item onSelect={saveNow}>{t('pause.save')} <Meta>{lastSaved}</Meta></Item>
        <Item onSelect={openLoad}>{t('pause.load')}…</Item>
        <Item onSelect={openMemorial}>{t('pause.memorial')}…</Item>
        <Item onSelect={openSettings}>{t('pause.settings')}…</Item>
        <Item onSelect={hideUi}>{t('pause.hideUi')} <Kbd>H</Kbd></Item>
        <Separator />
        <Item danger onSelect={() => setConfirmQuit(true)}>{t('pause.quit')}…</Item>
      </MenuList>
      {confirmQuit && (
        <Confirm title={t('quit.title')} body={t('quit.body', { ago: lastSaved })}
                 confirmLabel={t('quit.confirm')} tone="danger"
                 onCancel={() => setConfirmQuit(false)} onConfirm={quitToTitle} />
      )}
    </Dialog>
  );
}
4. “Nascondi UI” sicuro (sketch)

ts
export function useHideUi() {
  const [hidden, setHidden] = useState(false);
  const wasPaused = useRef(false);
  const critical = useGameStore(selectCriticalAlerts);   // fame, attacco, ecc.
  const autoPause = useSettings(s => s.hideUiPausesGame); // default true

  const hide = useCallback(() => {
    wasPaused.current = sim.isPaused;
    if (autoPause) sim.pause();
    setHidden(true);
    toast.once(t('hideUi.hint'), { key: 'H / Esc', ms: 3000 });
  }, [autoPause]);

  const show = useCallback(() => {
    setHidden(false);
    if (autoPause && !wasPaused.current) sim.resume();
  }, [autoPause]);

  useEffect(() => { if (hidden && critical.length) show(); }, [hidden, critical.length, show]);
  useHotkey(['KeyH', 'Escape'], () => (hidden ? show() : undefined));
  return { hidden, hide, show };
}

css
.app.ui-hidden .hud { opacity: 0; pointer-events: none; transition: opacity 150ms; }
.reveal-zone { position: fixed; right: 0; bottom: 0; width: 120px; height: 120px; }
.reveal-chip { position: fixed; right: 16px; bottom: 16px; opacity: 0; transition: opacity 150ms; }
.reveal-zone:hover ~ .reveal-chip, .reveal-chip:focus-visible { opacity: 1; } /* testo: "Mostra UI · H" */

Un allarme critico riporta la UI da sola. Il tasto di ripristino ha testo e hotkey, non una sola icona.

5. Scala UI in Settings, non nell’HUD

ts
export function applyUiScale(setting: 'auto' | number) {
  // Auto: mai sotto 1, così a 1280×800 il testo non scende sotto i 12px
  const auto = Math.max(1, Math.min(2, Math.min(innerWidth / 1440, innerHeight / 900)));
  document.documentElement.style.setProperty('--ui-scale', String(setting === 'auto' ? auto : setting));
}

Usa uno slider (0.9–2, step 0.05) o un segmented control. Applica il valore al rilascio (pointerup) per non spostare i layout sotto il cursore. Su qualunque popover residuo imposta max-height: min(70dvh, 560px); overflow: auto; overscroll-behavior: contain;.

Ordine di intervento (ROI decrescente)
Fonte unica PANELS e rimozione della lista duplicata dal menu (mezza giornata).
Ripristino UI sicuro: pausa automatica, riapparizione sugli allarmi critici, chip con testo e H/Esc.
Esc apre il menu di pausa. “Session” esce dall’HUD e Quit ottiene separatore, stile danger e conferma.
Tooltip + hotkey sui trigger, stato aria-pressed, badge eventi, focus ring.
Dimensioni minime (12px, target ≥44px), poi collaudo a 1280×800 con scala 100–200%, stringhe italiane e gamepad.
Lingua e scala UI in Settings. Se Director e Tuning sono pannelli di sviluppo, nascondili dietro devMode.
Uniforma lo stile dei bottoni e valuta di togliere il lucido plastico.

Per misurare se il redesign funziona, tieni d’occhio il tempo al primo pannello aperto, quanti usano Esc e quanti restano con la UI nascosta oltre 30 secondi. Se vuoi, preparo un mockup interattivo del dock e del menu di pausa.






2 minuti fa