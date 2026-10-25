# Digest critiche — settings-panel (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-settings-panel`,
turn T-001 (+**refill claude T-002** post-reset quota 12:20, stessa
conversazione bound, 4 shot: in-game-menu-ctx-a/iso-0 + title-ctx-a/iso-0),
prompt verbatim R-282, 5 shot al mattino (title-ctx-a, title-ctx-b,
title-iso-0, in-game-menu-ctx-a, in-game-menu-iso-0).

**Provider failure dichiarati:**
- **chatgpt** — `ATTACH_FAILED` ("no upload affordance found");
  fallimento sistematico account Free (quota upload immagini esaurita).
  Vedi `chatgpt.md`.
- ~~**claude**~~ — RECUPERATO al refill T-002 (12:32 CET): al mattino la
  generazione era partita e poi bloccata dalla pausa quota
  («disponibile alle 12:20»). Verbatim grounded in `claude.md` (~19k chars,
  contrasti misurati dai pixel degli shot).

Convergenza effettiva = **2/2 provider image-grounded** (claude + deepseek).
Fatti corretti: titolo "SETTINGS", "CLOSE", "Language ENGLISH/ITALIANO",
slider audio, "AUTO/100%/125%/150%", "Reduced motion" sotto "Interface",
pills teal, banner/footer.

## Convergenza forte (2/2)

1. **Stato selezionato quasi invisibile (teal su teal).**
   - deepseek: «i bottoni selezionati usano un colore teal identico al
     colore di sfondo del pannello, creando un contrasto insufficiente.
     Non c'è un indicatore di focus chiaro».
   - claude (misurato): pill selezionata 1.66:1, non selezionata 1.28:1,
     bottone SETTINGS della title 1.15:1 — «hai invertito la gerarchia:
     l'elemento attivo appare più spento di quelli inattivi»; colore come
     UNICO segnale di stato (manca forma/marcatore).
2. **Accessibilità sepolta.**
   - deepseek: «"Reduced motion" è sepolto sotto "Interface" come se fosse
     un'opzione di layout».
   - claude: «"Reduced motion" è accessibilità, ma sta sotto INTERFACE. Il
     suo default dovrebbe leggere prefers-reduced-motion dal sistema».
3. **Gerarchia piatta / liste senza respiro.**
   - deepseek: «"SETTINGS" e "CLOSE" hanno lo stesso peso visivo. Non c'è
     separazione tra le macro-categorie e le singole voci… effetto
     "tabella Excel"».
   - claude: «"SETTINGS" e "GENERAL/AUDIO/INTERFACE" hanno quasi lo stesso
     stile… linee sotto ogni titolo, riga e footer: sovra-rigato, le linee
     fanno il lavoro che dovrebbe fare lo spazio».
4. **Navigazione controller/tastiera non risolta.**
   - deepseek: focus ring luminoso per gamepad/tastiera come rimedio.
   - claude: «navigazione da controller invisibile… nessun suggerimento di
     tasti, nessun focus ring verificabile; all'apertura il focus va
     spostato sul primo azionabile; la direzionale deve ripetersi».
5. **Rimedi concordi**: sezione Accessibilità dedicata (deepseek: tab;
   claude: tab "Audio · Video · Interface · Accessibility · Controls" in
   `<dialog>` modale), segmented control per scelte mutualmente esclusive,
   focus visibile multi-canale (non solo colore).

## Disaccordi / punti di un solo provider (verbatim)

- **Title screen è nel perimetro (claude la critica, deepseek no).**
  Solo claude: focus iniziale su SETTINGS invece di Continue/New Game;
  menu incompleto (mancano Continue/Quit/Credits, Load Game non mostra
  salvataggi); «schermata morta» mentre la mappa dipinta esiste; logo
  bronzo vs capsule glossy = «tre linguaggi di forma in due schermate».
- **Slider**: entrambi li criticano; claude aggiunge il misurato — fill
  10.9:1 «la cosa più luminosa del pannello per i controlli meno
  importanti», thumb ~14px, valore a 350px di distanza, nessun feedback
  sonoro.
- **Scrim/contesto** — solo claude: «lo scrim è debole: HUD e mappa restano
  leggibili e competono col modale. Non si capisce se il gioco è in pausa»
  → `::backdrop` radiale + `game.pause()`.
- **Restore defaults distruttivo senza conferma** — solo claude.
- **"Interface size: AUTO" opaco + larghezza fissa ~640px che rischia
  overflow a 200% su 1280×800** — solo claude.
- **Gap di contenuto desktop** — solo claude: canali audio separati,
  Fullscreen/VSync, rimappatura, sottotitoli, text-size separato da
  UI-scale, modalità alto contrasto (7:1).
- **Anteprima live UI scale + icona test audio + salvataggio persistente
  delle opzioni** — solo deepseek.
- **Stack** — deepseek: Unity UI Toolkit (pattern trasferibili, codice no);
  claude: React+CSS (rem/ui-scale JS, `dialog.showModal()`, radiogroup).

## Quick-wins vs Structural

- Quick-wins: accento oro + marcatore di forma su selected (non solo
  fill), focus ring, righe ≥44-48px, "AUTO" → valore risolto («Auto
  (125%)»), conferma su Restore defaults, scrim più scuro + pausa.
- Structural: `<dialog>` modale con focus trap, segmented
  `role="radiogroup"` con roving tabindex, `--ui-scale` in rem + clamp,
  sezione Accessibilità dedicata collegata a prefers-reduced-motion,
  split dei canali audio.

## Note di grounding

- claude (T-002): contrasti pixel-misurati (tabella in `claude.md`);
  dichiara onestamente di non poter verificare hover/focus dagli shot
  statici.
- deepseek (T-001): fatti corretti; ha letto il pannello nel contesto
  title-screen senza distinguere la variante in-game-menu.
