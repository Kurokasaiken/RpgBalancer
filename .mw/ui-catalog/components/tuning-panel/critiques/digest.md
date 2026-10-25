# Digest critiche — tuning-panel (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-tuning-panel`,
turn T-001 (+retry T-002 mattina per claude; **refill claude T-003** post-reset
quota 12:20, stessa conversazione bound, 2 shot default-ctx-a + default-iso-0),
prompt verbatim R-282, 3 shot allegati al mattino (default-ctx-a, default-ctx-b,
default-iso-0).

**Provider failure dichiarati:**
- **chatgpt** — `ATTACH_FAILED` ("no upload affordance found") al primo
  tentativo; stesso fallimento sistematico di director-panel (account Free,
  quota upload immagini plausibilmente esaurita). Vedi `chatgpt.md`.
- ~~**claude**~~ — RECUPERATO al refill T-003 (12:28 CET): T-001/T-002 erano
  generazioni interrotte server-side (quota free). Verbatim grounded in
  `claude.md` (~18.4k chars, pixel-sampling colori + ricerca web).

Convergenza effettiva = **2/2 provider image-grounded** (claude + deepseek).
Fatti corretti: sezioni "Clouds"/"Sea", slider con valori ("Cloud shadow
opacity 0.42", "Sea wave spacing 900"), banner "Reduce motion" arancione,
overlay laterale sulla mappa.

## Convergenza forte (2/2)

1. **Slider senza semantica.** deepseek: «un utente non sa cosa significhi
   spostare "Cloud shadow opacity" da 0.42 a 0.50… manca reset per voce»;
   claude: scale illeggibili («Cloud speed vale 1 col thumb a 0%, Cloud
   parallax vale 1 a ~50%»), valore non digitabile, niente min/max né tacca
   del default né reset → entrambi chiedono reset-per-riga + default
   visibile + value label/tick (claude cita la guideline Microsoft).
2. **Gerarchia piatta / muro di controlli.** deepseek: «muro di testo e
   slider identici… nessuna separazione tra gruppi»; claude: «TUNING,
   CLOUDS e SEA hanno peso quasi uguale… i gruppi non si collassano, header
   non sticky» + riga "Wave spacing" tagliata senza cue di scroll.
3. **Accessibilità sotto soglia.** deepseek: colore slider troppo simile al
   valore, SR deve dire "42 percent", focus da controller; claude (misurato
   dai pixel): icone ⓘ ~2.4:1, track vuoto 1.37:1, thumb ~14px sotto il
   minimo 24×24 WCAG, testo ~12-13px.
4. **Identità dev-vs-giocatore ambigua.** deepseek: «pannello debug
   mascherato da menu… dovrebbe essere una modalità anteprima»; claude:
   «pannello dev travestito da UI di gioco… se è per il giocatore, "Cloud
   shape drift" è il modello mentale di un engineer» → split dev/giocatore.
5. **Occlusione della scena in tuning.** deepseek implicito (overlay su
   gioco live); claude esplicito: «lastra opaca che copre foresta e mare
   ovest — esattamente dove stai tarando sway e schiuma» → ghost mode
   durante lo scrub / pannello stretto in angolo.
6. **Rimedi concordi**: reset per voce + globale, gruppi collassabili,
   valori digitabili, preview live del tuning.

## Disaccordi / punti di un solo provider (verbatim)

- **Banner "Reduce motion" = affordance falsa** — solo claude: gli slider
  motion restano interattivi mentre il banner dice che sono spenti; colore
  `#d98a4a` nella famiglia semantica dell'allarme Food; nessun override
  → segmented control System/Reduced/Full + badge testuale "off".
- **Numeri proporzionali / tabular-nums** — solo claude: «le cifre
  "ballano" mentre trascini».
- **Vettore spezzato** — solo claude: Shadow offset X+Y → XY pad.
- **Export soli valori modificati, preset, esclusione da build prod,
  ghost-mode 28%, suggestion Leva/Tweakpane** — solo claude.
- **Screen reader "42 percent" non "0.42", menu looping, tasti −/+** —
  solo deepseek.
- **Pausa del gioco durante tuning** — solo deepseek («modalità anteprima
  che mette in pausa»); claude propone invece ghost mode senza pausa.
- **Stack** — deepseek: Unreal MVVM (pattern trasferibile, codice no);
  claude: React hook + `<input type=range>` con token di contrasto già
  verificati su `#0f2832`.

## Quick-wins vs Structural

- Quick-wins: reset ↺ per riga + tacca default, valore numerico editabile
  con unità, badge testuale disabled, header sticky + cue scroll, contrasto
  icone/track, thumb ≥18px + anello.
- Structural: split dev/player (segmented Motion + ≤2 slider vs pannello
  completo gated `import.meta.env.DEV`), schema-driven params (min/max/
  step/def/unit), ghost mode su scrub, export dirty-only, footer fisso
  Reset/Copy.

## Note di grounding

- claude (T-003): misurato dai pixel — ink `#e8dfc6` 10-11.5:1, icone ⓘ
  `#546260` su `#0f2832` ≈2.4:1, track `#3b3b3b` ≈1.37:1, thumb ~14px,
  label ~12-13px, ultima riga clippata ("Wave spacing (px)").
- deepseek (T-001): fatti corretti; assunzione Unreal/MVVM.
