# claude — title-screen (T-003 refill, image-grounded)

Run `20261025-critique-title-screen`, turn T-003 (critique-refill dopo il reset quota delle 17:20),
prompt verbatim R-282, shot allegati (default-ctx-a, default-iso-0), POSTED+collect SUCCESS
(~12k chars). Conversazione: https://claude.ai/chat/0f5d4e02-62fb-4e49-963c-4621fe86c524.

T-001/T-002 mattina falliti (tab/renderer crash). T-003 e' il refill post-reset-17:20.

---

## Risposta T-003 (verbatim)

Claude ha risposto: Una premessa: le due immagini sono identiche pixel per pixel.
Cercato sul web

Cercato sul web

Una premessa: le due immagini sono identiche pixel per pixel. Non vedo quindi nessuno stato di hover, focus, pressed o disabled, e quella è già la prima critica (più sotto). Il resto si basa sullo screenshot a 1440×900 e su una ricerca sulle linee guida di settore.

Critica spietata

1. La scala è sbagliata, e di molto. Logo e menu occupano un rettangolo di circa 540×290 px in uno schermo da 1440×900. Il resto è teal vuoto. I bottoni sono larghi circa 260 px e alti circa 34 px, con etichette che stimo sui 12-13 px. È una UI da pagina web, non da gioco. Su Steam Deck, TV o 4K diventa illeggibile. Steam suggerisce di permettere un ridimensionamento del testo fino a circa 38 px di altezza a 1080p (è il valore indicato nella documentazione sull’accessibilità), e Xbox chiede che le icone e i glifi scalino insieme al testo fino al 200%. Qui non c’è margine di scala. 
steamgames

xbox


2. Nessuna gerarchia: tre pillole clonate. “New Game”, “Load Game” e “Settings” hanno lo stesso peso. Nessuna è l’azione primaria. Per la gerarchia visiva servono, tra le altre cose, un colore diverso e una dimensione maggiore per l’elemento da far notare. Il principio è che un solo elemento deve essere più grande di quelli che lo circondano. Mancano anche “Continue” (la voce che il 90% dei giocatori ricorrenti vuole) ed “Exit”. Se è un’app desktop, l’assenza di Quit è un difetto, non una scelta di stile. 
gameanalytics


3. Scontro di stili tra logo e bottoni. Il logo è fantasy materico: bronzo, rivetti, bagliore dorato. I bottoni sono pillole nere lucide da UI kit generico. Il logo promette un’avventura e i bottoni sembrano un’app di login. Il teal contro l’oro è invece una buona scelta cromatica, e va tenuta.

4. Sfondo senza vita. Un gradiente piatto con vignetta non è un’atmosfera. Il primo schermo è la vetrina del gioco, e qui non c’è né key art, né profondità, né movimento. Se la schermata è statica, il logo splendente è l’unica cosa che respira, e nemmeno quella si muove.

5. Tipografia debole dove serve di più. Maiuscoletto serif sottile, con spaziatura larga, a 12 px su sfondo scuro. Le linee guida chiedono almeno 4.5:1 di contrasto per testo di dimensioni standard. Il colore crema sul nero probabilmente lo rispetta, ma tratti sottili e corpo piccolo rendono comunque il testo fragile. 
xbox


6. Dettagli orfani. La linea sotto il logo è quasi invisibile: o diventa un ornamento vero (con una terminazione, un rombo centrale) o va tolta. Non c’è nessun footer: versione, copyright, studio, aiuto ai comandi. Una schermata iniziale senza questi elementi sembra non finita.

7. Stati e input non dimostrati. Non vedo focus, quindi non so se esiste. Per una UI web la navigazione da tastiera richiede un sistema di focus esplicito, perché il comportamento predefinito del browser non rispetta le convenzioni dei menu di gioco. Il Gamepad API inoltre non genera eventi DOM, quindi lo stato va letto in polling a ogni frame. “Load Game” senza salvataggi deve inoltre risultare disabilitato, e qui non c’è modo di saperlo. 
abratabia

abratabia


8. Cose che non posso giudicare dallo screenshot. Feedback audio (hover, conferma), transizioni di ingresso e risoluzione del logo su 4K (serve un SVG o un PNG ad alta risoluzione).

Proposta

Layout. Logo spostato più in alto (terzo superiore), largo circa il 45-55% dello schermo. Colonna del menu sotto, con l’azione primaria in evidenza. Footer con versione e legenda comandi. Tutto in rem, con font-size della radice che scala con il viewport. L’ordine delle voci è: Continue (solo se esiste un salvataggio), New Game, Load Game, Settings, Exit.

Componente React

tsx
// MainMenu.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import "./MainMenu.css";

type Item = {
  id: string;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

function useGamepadNav(onMove: (d: 1 | -1) => void, onConfirm: () => void) {
  const cb = useRef({ onMove, onConfirm });
  cb.current = { onMove, onConfirm };

  useEffect(() => {
    let raf = 0;
    let prev = { up: false, down: false, a: false };
    const tick = () => {
      const pad = navigator.getGamepads().find(Boolean);
      if (pad) {
        const y = pad.axes[1] ?? 0;
        const cur = {
          up: !!pad.buttons[12]?.pressed || y < -0.6,
          down: !!pad.buttons[13]?.pressed || y > 0.6,
          a: !!pad.buttons[0]?.pressed,
        };
        // solo sul fronte di salita (niente auto-repeat in questo esempio)
        if (cur.up && !prev.up) cb.current.onMove(-1);
        if (cur.down && !prev.down) cb.current.onMove(1);
        if (cur.a && !prev.a) cb.current.onConfirm();

        prev = cur;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}

export function MainMenu({ items }: { items: Item[] }) {
  const enabled = items.map((i) => !i.disabled);
  const firstEnabled = Math.max(0, enabled.indexOf(true));
  const [active, setActive] = useState(firstEnabled);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = useCallback(
    (dir: 1 | -1) => {
      setActive((cur) => {
        let n = cur;
        for (let k = 0; k < items.length; k++) {
          n = (n + dir + items.length) % items.length;
          if (!items[n].disabled) return n;
        }
        return cur;
      });
    },
    [items]
  );

  const confirm = useCallback(() => items[active]?.onSelect(), [items, active]);

  // un solo modello di focus per mouse, tastiera e pad

  useEffect(() => refs.current[active]?.focus(), [active]);
  useGamepadNav(move, confirm);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    if (e.key === "ArrowUp")   { e.preventDefault(); move(-1); }
  };

  return (
    <main className="mm-root">
      <header className="mm-logo">
        <img src="/ui/logo.svg" alt="Wanderlust Triumph" />
      </header>

      <nav className="mm-menu" onKeyDown={onKeyDown} aria-label="Menu principale">
        {items.map((it, i) => (
          <button
            key={it.id}
            ref={(el) => (refs.current[i] = el)}
            className={`mm-btn ${it.primary ? "mm-btn--primary" : ""}`}
            data-active={i === active}
            aria-disabled={it.disabled || undefined}
            tabIndex={i === active ? 0 : -1}
            style={{ "--i": i } as React.CSSProperties}
            onMouseEnter={() => !it.disabled && setActive(i)}
            onClick={() => !it.disabled && it.onSelect()}
          >
            {it.label}
          </button>
        ))}
      </nav>


      <footer className="mm-footer">
        <span>v0.1.0</span>
        <span className="mm-hints">↑↓ Naviga &nbsp;·&nbsp; Invio Seleziona</span>
        <span>© Studio</span>
      </footer>
    </main>
  );
}
CSS

css
/* MainMenu.css */
:root {
  --gold-hi: #f6d27a;
  --gold: #d79a2b;
  --bronze: #6b4519;
  --text: #f2e6c9;
  font-size: clamp(16px, 1.25vw, 30px); /* 1440w ≈ 18px, 4K ≈ 30px */
}

.mm-root {
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
  background:
    radial-gradient(60% 45% at 50% 30%, #1f5a60 0%, transparent 70%), /* alone dietro il logo */
    radial-gradient(120% 90% at 50% 50%, transparent 55%, #000b 100%), /* vignetta */
    linear-gradient(#143538, #0a1719);
}

.mm-logo { margin-top: 12svh; width: min(50vw, 52rem); }
.mm-logo img { width: 100%; height: auto; filter: drop-shadow(0 0 2rem #f0a83055); }

.mm-menu {
  margin-top: 5svh;
  display: flex; flex-direction: column; align-items: center; gap: .75rem;
}

/* --- bottone: placca di metallo, non pillola --- */
.mm-btn {
  position: relative;
  width: min(22rem, 80vw); height: 3.4rem;

  font: 600 1.15rem/1 "Cinzel", "Trajan Pro", serif;
  letter-spacing: .14em; text-transform: uppercase;
  color: var(--text); text-shadow: 0 1px 0 #000a;
  background: linear-gradient(#1c2c30, #0b1416);
  border: 1px solid var(--bronze);
  border-radius: .3rem;
  box-shadow:
    inset 0 1px 0 #f6d27a26,          /* filo di luce superiore */
    inset 0 0 0 3px #0008,            /* incavo */
    inset 0 0 0 4px #6b451966,        /* filetto bronzo interno */
    0 .5rem 1rem #0009;
  cursor: pointer;
  opacity: 0; translate: 0 .75rem;
  animation: mm-in .5s cubic-bezier(.2,.7,.2,1) forwards;
  animation-delay: calc(.25s + var(--i) * 70ms);
  transition: color .15s, box-shadow .2s, background .2s, scale .12s;
}

/* marcatori laterali: il focus non dipende solo dal colore */
.mm-btn::before, .mm-btn::after {
  content: "◆"; position: absolute; top: 50%; translate: 0 -50%;
  font-size: .6rem; color: var(--gold-hi); opacity: 0;
  transition: opacity .15s, transform .2s;
}
.mm-btn::before { left: 1rem;  transform: translateX(.6rem); }
.mm-btn::after  { right: 1rem; transform: translateX(-.6rem); }

.mm-btn[data-active="true"] {
  color: #fff;
  background: linear-gradient(#2a4247, #101d20);
  border-color: var(--gold);
  box-shadow:

    inset 0 1px 0 #f6d27a55, inset 0 0 0 3px #0006, inset 0 0 0 4px var(--gold),
    0 0 1.5rem #f0a83055, 0 .5rem 1rem #000a;
  scale: 1.03;
}
.mm-btn[data-active="true"]::before,
.mm-btn[data-active="true"]::after { opacity: 1; transform: none; }
.mm-btn:active { scale: .985; }

/* azione primaria: più larga, oro pieno */
.mm-btn--primary {
  width: min(26rem, 85vw); height: 4rem; font-size: 1.35rem;
  color: #2a1706; text-shadow: 0 1px 0 #ffe9a8aa;
  background: linear-gradient(#f6d27a, #c98a1e 60%, #a56a12);
  border-color: #fbe3a0;
}
.mm-btn--primary[data-active="true"] { color: #1a0e03; background: linear-gradient(#ffe29a, #dba02b 60%, #b57516); }
.mm-btn--primary::before, .mm-btn--primary::after { color: #3a2208; }

.mm-btn[aria-disabled="true"] { opacity: .4; cursor: not-allowed; filter: saturate(.4); }

.mm-footer {
  width: 100%; padding: 1rem 2rem; box-sizing: border-box;
  display: flex; justify-content: space-between;
  font: .8rem/1 system-ui, sans-serif; color: #f2e6c9b0;
}

@keyframes mm-in { to { opacity: 1; translate: 0 0; } }
@media (prefers-reduced-motion: reduce) {
  .mm-btn { animation: none; opacity: 1; translate: none; transition: none; }
}

Nota: le animazioni di ingresso partono con opacity: 0. Se prefers-reduced-motion è attivo, il blocco finale le annulla e i bottoni restano visibili.

Uso

tsx
<MainMenu
  items={[
    { id: "continue", label: "Continua", primary: true, disabled: !hasSave, onSelect: continueGame },
    { id: "new",      label: "Nuova partita", onSelect: newGame },
    { id: "load",     label: "Carica partita", disabled: !hasSave, onSelect: openLoad },
    { id: "settings", label: "Impostazioni", onSelect: openSettings },
    { id: "exit",     label: "Esci", onSelect: quit },
  ]}
/>
Cosa aggiungerei oltre al codice
Sfondo vivo. Una key art dipinta (la stessa del tuo store page, se esiste) con parallasse lenta di 2-3 layer, più braci o polvere luminosa come particelle. Se il progetto ha già Pixi, fai le particelle lì, in un canvas dietro al DOM, invece di aggiungere altro CSS.
Respiro del logo. Pulsazione lenta (6-8 s) del glow dietro il medaglione centrale, con ampiezza minima.
Audio. Un tick breve al cambio di focus, un suono più pieno alla conferma. Senza audio, il menu sembra “muto” quanto lo sfondo sembra fermo.
Accessibilità minima. Slider “Dimensione UI” in Settings che modifica il font-size della radice. Il testo dovrebbe restare a almeno 4.5:1 di contrasto. Un’opzione ad alto contrasto è un buon complemento. 
xbox

Meno livelli. Le linee guida di accessibilità consigliano di permettere di avviare il gioco senza passare per più livelli di menu: ecco perché “Continua” va in cima e in oro. 
gameaccessibilityguidelines


Se mi mandi uno screenshot con hover e focus attivi, posso verificare gli stati e rifinire i valori (spaziature, contrasto reale, dimensioni) contro il tuo design attuale.






ora
