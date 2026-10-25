# Digest critiche — director-panel (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-director-panel`,
turn T-001 (+retry T-002 per claude e chatgpt; **refill claude T-003** post-reset
quota 12:20, stessa conversazione bound, 2 shot default-ctx-a + default-iso-0),
prompt verbatim R-282, 3 shot allegati al mattino (default-ctx-a, default-ctx-b,
default-iso-0).

**Provider failure dichiarati:**
- **chatgpt** — T-001 POSTED su URL `local-chatgpt:` mai persistito
  (reconcile ABSENT, `user_count: 0`); dopo reseed, T-002 fallisce
  `ATTACH_FAILED` ×2 — account Free senza affordance di upload visibile
  (quota immagini giornaliera plausibilmente esaurita). Vedi `chatgpt.md`.
- ~~**claude**~~ — RECUPERATO al refill T-003 (12:25 CET): T-001/T-002 erano
  fallite server-side (quota free). Verbatim grounded in `claude.md`.

Convergenza effettiva = **2/2 provider image-grounded** (claude + deepseek;
chatgpt ancora assente). Fatti osservati corretti da entrambi: titolo
"DIRECTOR", pulsanti "Goblin invasion", "Show quest", "Initial state",
"Skin: Layout Primitives", "RESET SCENE" in fondo, mappa dietro.

## Convergenza forte (2/2)

1. **Gerarchia piatta / rischio invertito.**
   - deepseek: «Tutti i pulsanti hanno lo stesso peso visivo… Non c'è una
     gerarchia che distingua azioni distruttive (Reset Scene)».
   - claude: «RESET SCENE è l'azione più distruttiva ed è la più invisibile…
     Hai invertito la gerarchia: il rischio massimo ha il peso visivo minimo»
     + «Struttura piatta… 6 categorie mescolate in una colonna sola».
2. **Zero feedback di stato.**
   - deepseek: «"Goblin invasion" è un pulsante per attivarla o un'indicazione
     che è già attiva?».
   - claude: «Premi "Goblin invasion" e il pannello non ti dice nulla… Tutti
     gli 11 bottoni sembrano sempre "idle"».
3. **Manca lo stato live del sim.**
   - deepseek: «pannello di comando, non di controllo… manca la possibilità
     di vedere i parametri correnti (es. "Food: 2/20")».
   - claude propone esattamente quello: riga `day 2 · quest: goblin ·
     food 2/20` in testa al pannello ridisegnato.
4. **Tipografia/contrasto sotto soglia.** deepseek: font troppo piccolo;
   claude: label ~11px, «RESET SCENE a occhio è sotto 3:1… misuralo» (rif.
   Game Accessibility Guidelines 4.5:1, Xbox scaling 200%).
5. **Rimedi concordi**: sezioni/accordion invece di lista monolitica
   (deepseek: progressive disclosure; claude: accordion Scenario/Events/
   Progression/Preview), danger zone con conferma esplicita (deepseek:
   reset rosso + conferma; claude: hold-to-confirm 600ms), colori semantici,
   comando generato da dati (deepseek: UXML; claude: registry TS dichiarativo).

## Disaccordi / punti di un solo provider (verbatim)

- **Identità del pannello — letture opposte dello stesso difetto.** deepseek:
  «corpo estraneo… blu piatto da framework UI generico» contro l'estetica
  fantasy; claude: «hai riusato la cornice dorata smussata dell'HUD per uno
  strumento da dev… compete con l'HUD reale». Entrambi: incoerenza
  strutturale; divergono sul rimedio — deepseek «rendilo bello» (più
  integrato), claude «dagli una pelle da tool, sobria e fuori palette
  (magenta)» (più separato).
- **Occlusione** — solo claude: il pannello «taglia la costa est e
  l'isoletta… stai testando un gioco di cui il tuo tool nasconde un pezzo»
  → bottom-left + pill collassata + backtick.
- **Naming/precondizioni** — solo claude: «"Goblin invasion", "Start goblin
  quest" e "Show quest" sembrano la stessa cosa»; verbo+oggetto, `enabled:
  s => … || 'Prima: …'`, hint con side effect.
- **Undo/snapshot, command palette (Ctrl+K), hotkey, posizione persistita,
  rischio leak in produzione** — solo claude.
- **Font monospaziato per i numeri, 14–16px minimo** — solo deepseek.
- **Stack proposto** — deepseek scrive Unity UXML/USS+C# (pattern
  trasferibili, codice no); claude scrive React/TS+CSS (direttamente
  applicabile al progetto).

## Quick-wins vs Structural

- Quick-wins: per-item state dot/hover/focus/disabled, danger zone separata
  con conferma, riga di stato live, rename verbo+oggetto, misura contrasto.
- Structural: registry dichiarativo dei comandi (aggiunta = 1 riga),
  accordion + filtro/command palette, tool-skin fuori palette + esenzione
  art-direction dichiarata, esclusione dalle build di produzione, undo.

## Note di grounding

- claude (T-003): fatti corretti — 11 bottoni, "RESET SCENE" ~8px in fondo,
  "Skin: Layout Primitives", posizione bordo destro a metà altezza, glifi
  minimize/close affiancati ~8-10px.
- deepseek (T-001): fatti corretti — vedi sopra; assunzione Unity.
