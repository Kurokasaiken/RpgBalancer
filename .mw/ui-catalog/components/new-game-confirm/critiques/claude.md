# claude — new-game-confirm (T-002 refill, image-grounded)

Run `20261025-critique-new-game-confirm`, turn T-002 (critique-refill dopo il reset quota delle 17:20),
prompt verbatim R-282, shot allegati (default-ctx-a, default-iso-0), POSTED+collect SUCCESS
(~12k chars). Conversazione: https://claude.ai/chat/bade88e2-5998-406a-af9d-00c2ed904953.

T-001 mattina: immagini attachate ma submit impossibile (composer disabilitato, quota). T-002 e' il refill post-reset-17:20.

---

## Risposta T-002 (verbatim)

Claude ha risposto: Parto con una ricerca su best practice per menu principali nei giochi AAA, poi ti do la critica.
Critiquing menu button design for a mobile game interface.
Critiquing menu button design for a mobile game interface.

Parto con una ricerca su best practice per menu principali nei giochi AAA, poi ti do la critica.

Cercato sul web

Cercato sul web
Critica del main menu di Wanderlust Triumph

Ho cercato linee guida su menu di gioco, gerarchia visiva e navigazione. Le uso come riferimento dove servono, il resto viene dall’analisi dello screenshot (1440×900).

Cosa funziona
La palette: il teal profondo e l’oro del logo sono complementari. Il bagliore arancio del sole sul logo si stacca bene dal fondo freddo.
Il logo: ha materia, peso e una luce propria. È l’unico elemento della schermata con un’identità.
Il tracking delle maiuscole serif: la direzione tipografica è giusta per il fantasy.

Il resto è un problema.

Critica spietata
1. La gerarchia dice il contrario di quello che vuole

Continue è l’azione primaria: ha il testo oro e il bordo oro. Ma è il bottone più scuro, piatto e incassato, quindi sembra spento o disabilitato. New Game è l’unico con un riempimento cromatico (teal lucido, rialzato), quindi l’occhio va lì. La regola è semplice: per creare gerarchia si usa un colore diverso per il bottone che il giocatore deve notare, e un elemento deve essere più grande degli altri. Qui la dimensione è quasi uguale e il colore premia il bottone sbagliato. 
gameanalytics


2. Quattro bottoni, tre linguaggi visivi
Continue è un rettangolo con raggio piccolo, piatto.
New Game è una pillola con gradiente teal e riflesso in alto.
Load Game e Settings sono pillole nere lucide.

Non è una gerarchia, è incoerenza. Sembra che i componenti siano stati fatti in momenti diversi senza un sistema di stati.

3. Lo stile non c’entra col logo

Il logo è metallo battuto, con rilievi e gemme. I bottoni sono pillole lucide con riflesso alla “Web 2.0 / iOS 6”. Nessun materiale in comune, nessuna cornice, nessun ornamento. Il menu sembra un tema CSS appoggiato su un gioco. In un AAA il bottone appartiene allo stesso mondo del logo.

4. Il testo è minuscolo

Le etichette sono circa 12–13 px su una schermata da 1440 px, con tratti sottili e tracking largo. Su un 1080p a due metri, o su una Steam Deck, sono quasi illeggibili. Un menu principale si legge da lontano, non da 40 cm come un form. I bottoni (circa 260×34 px) sono anche piccoli come bersagli per un controller o per un dito.

5. Il ritmo verticale è rotto

Misurando dallo screenshot, gli spazi tra i bottoni sono circa 8, 12 e 10 px, e l’altezza di Continue (circa 35) differisce dagli altri (circa 32). Non c’è una griglia. Il separatore sopra Continue è una linea quasi invisibile, quindi è rumore e non struttura.

6. Lo sfondo è un vuoto

Circa il 60% della schermata è un gradiente teal piatto. Non c’è scena, profondità, parallasse, particelle o luce che esca dal sole del logo. Per uno studio con ambizioni AAA, la prima schermata è un posto dove il gioco dovrebbe già vendersi.

7. Mancano elementi di struttura
Stato Continue: senza salvataggio dovrebbe essere nascosto o disabilitato in modo chiaro. Non si capisce come si comporta.
Quit (su desktop con Tauri è atteso), Credits, versione/build, copyright: non ci sono.
Stati di interazione: lo screenshot non mostra hover, focus, pressed. Se Continue è “focalizzato” tramite il bordo oro, allora il focus coincide con lo stile del primario e le due cose sono indistinguibili.
8. Navigazione e accessibilità

Le linee guida Xbox chiedono che l’UI sia navigabile interamente da tastiera e da controller, con un focus order logico e prevedibile, e consigliano di offrire l’opzione di attivare o disattivare il looping nei menu lineari. Per i giochi web il sistema di focus va implementato esplicitamente, perché il comportamento di default del browser non corrisponde alle convenzioni dei menu di gioco. Senza vedere il codice non so se lo hai fatto, ma se il focus ring è quello del browser, è un problema. Inoltre il touch non ha hover, quindi qualsiasi feedback che dipende dal mouseover va duplicato. 
devdocs.xbox.com
 +2


Proposta

Principio: un solo primario, vistosamente più grande e luminoso. Il secondario è una cornice sobria. Il terziario (Settings, Quit) è quasi solo testo. Tutti condividono la stessa cornice “bronzo/oro” del logo, con stati completi.

Gerarchia
Livello	Bottone	Altezza	Trattamento
Primario	Continue (o New Game se non c’è salvataggio)	56 px	Cornice oro piena, riempimento scuro caldo, glow attivo
Secondario	New Game, Load Game	44 px	Cornice oro sottile, riempimento trasparente
Terziario	Settings, Credits, Quit	36 px	Solo testo con linea sotto al focus

Spaziatura su griglia a 8 px: 16 px tra i bottoni dello stesso livello, 24 px tra i livelli. Testo con clamp() perché scali con il viewport.

Componente React

tsx
// MainMenu.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import "./MainMenu.css";

type Variant = "primary" | "secondary" | "tertiary";
export type MenuItem = {
  id: string;
  label: string;
  variant: Variant;
  disabled?: boolean;
  onSelect: () => void;
};

export function MainMenu({ items }: { items: MenuItem[] }) {
  const enabled = items.filter(i => !i.disabled);
  const [focusId, setFocusId] = useState(enabled[0]?.id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = useCallback((dir: 1 | -1) => {
    const idx = enabled.findIndex(i => i.id === focusId);
    const next = enabled[(idx + dir + enabled.length) % enabled.length];
    setFocusId(next.id);
    refs.current[next.id]?.focus();
  }, [enabled, focusId]);

  // Tastiera: frecce, W/S
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (["ArrowDown", "s", "S"].includes(e.key)) { e.preventDefault(); move(1); }
    if (["ArrowUp", "w", "W"].includes(e.key))   { e.preventDefault(); move(-1); }
  };

  // Gamepad: D-pad + stick sinistro + A

  useEffect(() => {
    let raf = 0, cooldown = 0;
    const tick = (t: number) => {
      const pad = navigator.getGamepads?.()[0];
      if (pad && t > cooldown) {
        const y = pad.axes[1];
        if (pad.buttons[13]?.pressed || y > 0.6) { move(1);  cooldown = t + 180; }
        else if (pad.buttons[12]?.pressed || y < -0.6) { move(-1); cooldown = t + 180; }
        else if (pad.buttons[0]?.pressed) {
          enabled.find(i => i.id === focusId)?.onSelect(); cooldown = t + 300;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [move, enabled, focusId]);

  return (
    <nav className="mm" aria-label="Menu principale" onKeyDown={onKeyDown}>
      <ul className="mm__list">
        {items.map(item => (
          <li key={item.id} className={`mm__row mm__row--${item.variant}`}>
            <button
              ref={el => (refs.current[item.id] = el)}
              className={`mm-btn mm-btn--${item.variant}`}
              disabled={item.disabled}
              aria-disabled={item.disabled}
              data-focused={focusId === item.id}
              onFocus={() => setFocusId(item.id)}
              onMouseEnter={() => !item.disabled && setFocusId(item.id)}
              onClick={item.onSelect}

            >
              <span className="mm-btn__label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

Nota: onMouseEnter sposta il focus, così mouse, tastiera e pad condividono lo stesso stato e non hai due “selezioni” contemporanee.

CSS con token e stati completi

css
/* MainMenu.css */
:root {
  --gold-100: #f6e2a6;
  --gold-300: #e0b84f;
  --gold-500: #b8862b;
  --gold-700: #6e4a14;
  --ink-900: #0a1517;
  --ink-800: #101f22;
  --teal-glow: rgba(224, 184, 79, .35);

  --step: 8px;
  --fs-primary: clamp(20px, 1.5vw + 8px, 28px);
  --fs-secondary: clamp(16px, 1vw + 8px, 22px);
  --fs-tertiary: clamp(14px, .8vw + 7px, 18px);
  --ease: cubic-bezier(.2, .8, .2, 1);
}

.mm__list { display: grid; justify-items: center; margin: 0; padding: 0; list-style: none; }
.mm__row--primary   { margin-bottom: calc(var(--step) * 2); }
.mm__row--secondary { margin-bottom: calc(var(--step) * 2); }
.mm__row--secondary + .mm__row--tertiary { margin-top: calc(var(--step) * 1.5); }

.mm-btn {
  position: relative;
  min-width: clamp(260px, 22vw, 380px);
  font-family: "Cinzel", serif;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--gold-100);
  background: none; border: 0; cursor: pointer;
  transition: transform .12s var(--ease), color .12s var(--ease);
  -webkit-tap-highlight-color: transparent;

}

/* --- PRIMARIO: cornice a doppio filo + sheen --- */
.mm-btn--primary {
  height: 56px; font-size: var(--fs-primary); font-weight: 700;
  background:
    linear-gradient(180deg, rgba(255,255,255,.06), transparent 40%),
    linear-gradient(180deg, var(--ink-800), var(--ink-900));
  border: 1px solid var(--gold-300);
  box-shadow:
    inset 0 0 0 3px var(--ink-900),
    inset 0 0 0 4px var(--gold-500),
    0 0 24px var(--teal-glow);
  clip-path: polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px),
                     calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px);
}

/* --- SECONDARIO: cornice sottile, fondo trasparente --- */
.mm-btn--secondary {
  height: 44px; font-size: var(--fs-secondary); font-weight: 600;
  background: rgba(10, 21, 23, .35);
  border: 1px solid var(--gold-500);
  color: var(--gold-100);
}

/* --- TERZIARIO: solo testo --- */
.mm-btn--tertiary {
  height: 36px; font-size: var(--fs-tertiary);
  color: color-mix(in srgb, var(--gold-100) 70%, transparent);
}
.mm-btn--tertiary::after {
  content: ""; position: absolute; left: 20%; right: 20%; bottom: 4px; height: 1px;

  background: var(--gold-300); transform: scaleX(0); transition: transform .2s var(--ease);
}

/* --- STATI: hover == focus == selezione (via data-focused) --- */
.mm-btn[data-focused="true"] { color: #fff; transform: translateY(-1px); }
.mm-btn--primary[data-focused="true"]   { box-shadow:
    inset 0 0 0 3px var(--ink-900), inset 0 0 0 4px var(--gold-300), 0 0 36px rgba(224,184,79,.55); }
.mm-btn--secondary[data-focused="true"] { border-color: var(--gold-300);
    background: rgba(224,184,79,.12); box-shadow: 0 0 18px var(--teal-glow); }
.mm-btn--tertiary[data-focused="true"]::after { transform: scaleX(1); }

/* Indicatore di selezione, riconoscibile anche in daltonismo: due rombi laterali */
.mm-btn[data-focused="true"]::before {
  content: "◆"; position: absolute; left: -28px; top: 50%; translate: 0 -50%;
  color: var(--gold-300); font-size: .6em;
}

/* Focus visibile da tastiera, mai rimosso */
.mm-btn:focus-visible { outline: 2px solid var(--gold-100); outline-offset: 4px; }

.mm-btn:active { transform: translateY(1px) scale(.99); }

.mm-btn:disabled {
  opacity: .4; cursor: not-allowed; filter: saturate(.4);
}

@media (prefers-reduced-motion: reduce) {
  .mm-btn, .mm-btn--tertiary::after { transition: none; }
}
Sfondo e struttura (le parti che portano la scena)
Sole del logo come sorgente di luce: un radial-gradient caldo dietro il logo, con raggi lenti (conic-gradient animato con mix-blend-mode: screen).
Parallasse a 3 strati (sfondo, mezzo, primo piano) che reagisce al mouse con 6–10 px di spostamento. Nel gioco hai già Pixi, quindi si fa con un container e tre sprite.
Particelle (polvere dorata o lucciole), poche e lente.
Footer: versione/build a sinistra, copyright al centro, Quit nel terziario.
Continue: se non c’è salvataggio, non va mostrato, e New Game diventa il primario. Se c’è, mostra sotto l’etichetta una riga piccola con “Villaggio X · Giorno 14 · 2 h fa”. Costa poco e rende il menu vivo.
Audio e motion
Tick breve al cambio focus, conferma più calda alla selezione.
Transizione di entrata sfalsata (60–80 ms per bottone), mai più di 400 ms in totale.
Usa prefers-reduced-motion, già incluso sopra.
Priorità
#	Intervento	Impatto	Costo
1	Gerarchia a tre livelli (primario/secondario/terziario)	Altissimo	Basso
2	Dimensione testo e target	Alto	Basso
3	Un solo linguaggio visivo, in linea col logo	Alto	Medio
4	Stati completi + focus unificato mouse/tastiera/pad	Alto	Medio
5	Sfondo con scena, luce e parallasse	Alto	Alto
6	Footer, Quit, stato di Continue	Medio	Basso

Dalle immagini non vedo hover, focus e pressed. Se mi mandi quelli, o il codice attuale, ti dico dove l’incoerenza è nei token e dove nel componente. Se vuoi, posso anche costruire un prototipo HTML interattivo per vedere il confronto prima/dopo.






ora
