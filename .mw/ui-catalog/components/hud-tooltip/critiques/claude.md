# claude — hud-tooltip (T-001 refill, image-grounded)

Run `20261025-critique-hud-tooltip`, turn T-001 (critique-refill dopo il reset quota delle 17:20),
prompt verbatim R-282, shot allegati (default-ctx-a, default-iso-0), POSTED+collect SUCCESS
(~10k chars). Conversazione: https://claude.ai/chat/7c9abf04-b118-44bf-af3b-cd3487a72391.

Nessun binding claude preesistente: nuova conversazione creata dal refill.

---

## Risposta T-001 (verbatim)

Claude ha risposto: Critica: pulsante "HIDE HUD [H]"
Cercato sul web, memoria letta

Cercato sul web, memoria letta
Critica: pulsante “HIDE HUD [H]”

Giudico da un ritaglio di circa 134 px, quindi dove stimo (dimensioni, contrasto) ti do un’indicazione da verificare, non una misura.

Voto: 5/10. Non è brutto. È un componente fatto a metà: la skin è coerente con il resto, ma comportamento, stati e accessibilità non ci sono, o almeno non si vedono.

Cosa dice la ricerca
Nascondere l’interfaccia è un modo di gioco, non un bottone. In Company of Heroes 3 esiste sia un’opzione nelle impostazioni sia un tasto rapido. Il gioco avverte anche che senza HUD devi ricordarti gli hotkey a memoria (la modalità screenshot rimuove tutta l’interfaccia, ma poi bisogna memorizzare i comandi). 
pcinvasion

Su console non c’è un pulsante a schermo. In FFXIV il tasto è configurabile, e su gamepad si usa una combinazione di tasti (L1 più click sul touchpad su DualSense, LB più Select sugli altri pad). 
rpgsite

Il cursore va trattato a parte. In My Summer Car la community ha ottenuto che il primo F2 nasconda l’HUD e un secondo ne nasconda anche il cursore, per gli screenshot (il comportamento in due passaggi è stato poi implementato). 
steamcommunity

Gli screenshot sono una modalità distinta. War Thunder distingue lo scatto con HUD da quello senza (un tocco breve su F12 scatta senza HUD, tenendolo premuto con HUD). 
steamcommunity

Gli standard di accessibilità sono noti. Si cita comunemente un rapporto di contrasto di 4.5:1 per il testo normale e 3:1 per i componenti UI. L’hover non deve essere mai l’unico modo per attivare qualcosa (gli elementi attivati dall’hover devono rispondere anche a focus e click). 
outlookindia

filamentgames

La critica
P0: bloccanti
Lo stato “nascosto” non è definito. Dallo screenshot non si capisce dove vada il pulsante quando l’HUD sparisce. Se sparisce anche lui, il giocatore può recuperare l’interfaccia solo con un tasto che ha già dimenticato. È l’errore peggiore che questo componente può fare.
[H] mente su touch e gamepad. Un keycap hardcoded è una promessa valida solo su tastiera. Su mobile mostra un tasto che non esiste. Ogni hotkey deve avere un percorso UI, e ogni hint deve seguire il dispositivo di input.
Ambiguità con il pulsante occhio. Subito sotto c’è un tondo con un occhio. Se fa la stessa cosa, uno dei due è rumore. Se fa altro, l’icona dell’occhio entra in collisione con il significato di “nascondi”. In entrambi i casi il cluster non si legge.
P1: gravi
“HUD” è gergo da programmatori. In un’interfaccia che si veste da mappa fantasy rompe la finzione. Il giocatore non pensa “HUD”, pensa “interfaccia” o “vista libera”.
Tipografia da nota a piè di pagina. Maiuscoletto spaziato, serif sottile, probabilmente 11-12 px. Il contrasto oro su blu notte con ogni probabilità regge. Il problema è la dimensione. A 1440 px di larghezza è già al limite, su un monitor 4K a 27" o su Steam Deck sparisce.
Keycap che non sembra un keycap. La “H” è un quadratino con bordo identico a quello del pulsante: cornice dentro cornice. Un keycap ha volume (un bordo inferiore più spesso) e un peso visivo diverso dal contenitore.
Stati invisibili. Non vedo né un hover, né un pressed, né un focus ring. Se non ci sono, la navigazione da tastiera è cieca. Se ci sono, non fanno parte dello screenshot.
Linguaggio visivo spezzato. Nel cluster hai tre medaglioni circolari con icona, e sopra una pillola rettangolare solo testo. Sono due grammatiche. Le barre in alto e in basso hanno cornici a sbalzo e angoli ornati, la pillola è un rettangolo arrotondato nudo.
P2: rifinitura
Peso gerarchico sbagliato. Una funzione di utilità non dovrebbe avere la stessa luminosità delle risorse (oro, cibo, legno). A riposo deve stare un gradino sotto.
Un solo livello. Per screenshot e video servirebbe un secondo passaggio che nasconda anche cursore e hint. Serve solo se vi interessa l’uso per il marketing, ma su una pagina Steam ci interessa.
Nessun feedback di transizione. La scomparsa istantanea di tutto l’HUD è brusca. Uno sfumare di 150-200 ms comunica “l’ho fatto io”, non “si è rotto qualcosa”.
La proposta
Specifica di design
Elemento	Decisione
Etichetta	“Nascondi interfaccia” (chiave i18n, mai hardcoded); icona occhio barrato a sinistra
Dimensioni	altezza 36 px desktop, 44 px con pointer: coarse; testo 13 px minimo
Keycap	22×22, con bordo inferiore più spesso, visibile solo con input da tastiera
Touch	niente keycap, hit area 44 px
Gamepad	keycap sostituito da un glifo del controller
A riposo	luminosità sotto il resto dell’HUD, sale su hover/focus
Stato nascosto	resta solo un “fantasma”: icona occhio da 44 px, opacità 0.35, che si riaccende al movimento del mouse o al tocco e torna a riposo dopo circa 2.5 s
Focus	anello visibile da 2 px, colore chiaro con offset 3 px

Se il componente va a catalogo, dichiarate questi stati: default, hover, pressed, focus-visible, touch, hidden-ghost, hidden-peek.

Codice (React + TypeScript)

tsx
// HudToggle.tsx
import { useCallback, useEffect, useRef, useState } from "react";

type Device = "kbm" | "touch";

function useDevice(): Device {
  const [d, setD] = useState<Device>(() =>
    matchMedia("(pointer: coarse)").matches ? "touch" : "kbm"
  );
  useEffect(() => {
    const mq = matchMedia("(pointer: coarse)");
    const on = () => setD(mq.matches ? "touch" : "kbm");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return d;
}

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

export function HudToggle({
  hidden, onToggle, hotkey = "h", t,
}: {
  hidden: boolean;
  onToggle: () => void;
  hotkey?: string;
  t: (k: "hud.hide" | "hud.show") => string;
}) {
  const device = useDevice();

  const [peek, setPeek] = useState(false);
  const timer = useRef<number>();

  // Hotkey: ignora ripetizioni, modificatori e campi di testo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key.toLowerCase() === hotkey) { e.preventDefault(); onToggle(); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [hotkey, onToggle]);

  // Quando l'HUD è nascosto, il "fantasma" si riaccende al movimento o al tocco
  const wake = useCallback(() => {
    setPeek(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPeek(false), 2500);
  }, []);
  useEffect(() => {
    if (!hidden) return;
    addEventListener("pointermove", wake);
    addEventListener("pointerdown", wake);
    return () => {
      removeEventListener("pointermove", wake);
      removeEventListener("pointerdown", wake);
      clearTimeout(timer.current);
    };
  }, [hidden, wake]);

  const label = hidden ? t("hud.show") : t("hud.hide");


  return (
    <button
      type="button"
      className="hud-toggle"
      data-hidden={hidden}
      data-peek={peek}
      aria-pressed={hidden}
      aria-keyshortcuts={hotkey.toUpperCase()}
      onClick={onToggle}
    >
      <EyeIcon off={!hidden} aria-hidden />
      <span className="hud-toggle__label">{label}</span>
      {device === "kbm" && (
        <kbd className="hud-toggle__key" aria-hidden>
          {hotkey.toUpperCase()}
        </kbd>
      )}
    </button>
  );
}

css
/* hud-toggle.css */
.hud-toggle {
  --gold: #e3c27a;
  --gold-dim: #b79a5c;
  --ink: #0b1b2b;
  --focus: #fff4d6;

  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  padding: 0 8px 0 12px;
  background: color-mix(in srgb, var(--ink) 88%, transparent);
  border: 1px solid var(--gold-dim);
  border-radius: 10px;
  color: var(--gold-dim);          /* a riposo: un gradino sotto le risorse */
  font: 600 13px/1 "Cinzel", serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color .15s, border-color .15s, background .15s,
              opacity .2s, transform .08s;
}
.hud-toggle:hover {
  color: var(--gold);
  border-color: var(--gold);
  background: color-mix(in srgb, var(--ink) 96%, var(--gold) 4%);
}
.hud-toggle:active { transform: translateY(1px); }
.hud-toggle:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;

}

/* keycap con volume */
.hud-toggle__key {
  display: grid; place-items: center;
  width: 22px; height: 22px;
  border-radius: 5px;
  background: #13293f;
  border: 1px solid var(--gold-dim);
  border-bottom-width: 3px;        /* il "volume" del tasto */
  color: var(--gold);
  font: 700 12px/1 ui-monospace, monospace;
}

/* touch: target a norma */
@media (pointer: coarse) {
  .hud-toggle { min-height: 44px; padding: 0 14px; }
}

/* stato nascosto: resta solo il fantasma */
.hud-toggle[data-hidden="true"] {
  opacity: .35;
  min-height: 44px;
}
.hud-toggle[data-hidden="true"] .hud-toggle__label,
.hud-toggle[data-hidden="true"] .hud-toggle__key { display: none; }
.hud-toggle[data-hidden="true"][data-peek="true"],
.hud-toggle[data-hidden="true"]:hover,
.hud-toggle[data-hidden="true"]:focus-visible { opacity: 1; }
.hud-toggle[data-hidden="true"][data-peek="true"] .hud-toggle__label {
  display: inline;
}


@media (prefers-reduced-motion: reduce) {
  .hud-toggle { transition: none; }
}

css
/* l'HUD che scompare: sfuma, non sparisce di colpo */
.hud-chrome { transition: opacity .18s ease, transform .18s ease; }
[data-hud="hidden"] .hud-chrome {
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;   /* non intercetta click sulla mappa */
}
Se vuoi il secondo livello (screenshot e marketing)

ts
type HudMode = "full" | "clean" | "photo";
const next: Record<HudMode, HudMode> = { full: "clean", clean: "photo", photo: "full" };
// clean = HUD nascosto, cursore visibile
// photo = HUD + cursore + hint nascosti (cursor: none sul root)

Il tasto resta uno solo e cicla tra i tre livelli, come nel pattern di My Summer Car. Aggiungi il livello photo solo se vi serve davvero per i trailer.

Ordine di intervento
Definire e implementare lo stato nascosto, con il fantasma.
Rendere il keycap dipendente dal dispositivo, con il percorso touch.
Risolvere la ridondanza con il pulsante occhio.
Alzare la tipografia a 13 px o più, aggiungere gli stati e il focus ring.
Cambiare la terminologia (“HUD” in “interfaccia”) e il peso visivo a riposo.

Posso rifarti il mockup visivo del cluster in basso a destra (pillola più i tre medaglioni) con un’unica grammatica, oppure scrivere il test Playwright che verifica la raggiungibilità dell’HUD nascosto.






ora
