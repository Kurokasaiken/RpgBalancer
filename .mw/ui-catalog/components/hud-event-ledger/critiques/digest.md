# Digest critiche — hud-event-ledger (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-hud-event-ledger`, turn T-001 (+retry T-002
chatgpt), prompt verbatim R-282, 2 shot allegati (ctx-a, iso-0).

**Provider failure dichiarati (2/3):**
- **chatgpt** — `ATTACH_FAILED` su T-001 e T-002. Pattern persistente.
- **claude** [RECUPERATO v. sezione merge] — T-001 POSTED (2 img) ma collect "did not stabilize";
  causa: rate limit piano Claude web (reset 12:20, dal DOM del failure
  bundle).

Un solo provider image-grounded (**deepseek**, fatti osservati
corretti: "Nothing on the horizon", bottoni DUE/TYPE/✕, HUD risorse
in alto a dx) → nessuna convergenza 2+/3 possibile. Riepilogo fedele
del singolo parere.

## Critica deepseek (unica fonte)

1. **Empty state "passivo-aggressivo".** «"Nothing on the horizon"… è
   un vicolo cieco emotivo e informativo: genera ansia ("Sto forse
   sbagliando qualcosa?") invece di respiro o anticipazione» → empty
   state proattivo: "Nessun evento imminente. Prossimo avviso stimato:
   tra N giorni" + CTA secondaria ("Vedi cronologia eventi").
2. **Bottoni fantasma nello stato vuoto.** DUE e TYPE sembrano
   interattivi ma senza eventi sono morti: «è come mettere il volante
   su un'auto parcheggiata» → filtri resi condizionali
   (`!isEmpty`), ✕ unico controllo nello stato vuoto.
3. **Pannello avulso dall'HUD.** Nessun collegamento con timer/risorse
   in alto a dx; il giocatore non sa quando arriva il prossimo evento
   → integrazione laterale/HUD o ETA dinamico legato alla sim.
4. **Contrasto del messaggio.** Grigio spento su scuro, faticoso dopo
   ore di gioco; look elegante ma "da RPG hardcore" più che da
   strategia leggibile a colpo d'occhio.
5. Soluzione: `isEventEmpty` che condiziona il rendering; codice
   React/TSX in `deepseek.md` (nota: usa un'emoji 🕊️ come icona —
   violerebbe il vincolo "mai emoji come icone" della house grammar,
   da scartare se adottato).

## Coerenza col pattern catalogo

Tema ricorrente confermato: **stati vuoti/controlli disabilitati non
dichiarati** (come i ghost tab di nav-bar e i locked del registry).
Quarto componente su cinque con il motif "l'UI non dice cosa succede
dopo / cosa fare adesso".


## Merge claude (refill T-002 su run -r2, post-reset quota 17:20)

claude GROUNDED (~13.6k chars, verbatim in `claude.md`; send postato su
conversazione reale, journaled CONVERSATION_MISMATCH per binding /new
avvelenato, recuperato via estrazione read-only + evento reseed).

**Convergenza (claude + deepseek):**
- **Empty state che non lavora**: deepseek «"Nothing on the horizon" è un
  vicolo cieco emotivo e informativo»; claude «P0 — il messaggio è in
  contraddizione col gioco (HUD mostra Food 0/−6d mentre il pannello dice
  "niente all'orizzonte")» + «chrome massimo per contenuto zero» e
  «"Nothing on the horizon" va bene come flavor, non come informazione».
- **DUE/TYPE opachi**: deepseek li chiama «bottoni fantasma»; claude
  «etichette opache — filtri, ordinamenti o toggle?» → entrambi vogliono
  segmented control con label parlanti.
- **X ambigua**: claude «la X è una trappola — come si riapre?»; concorda
  col punto deepseek sui controlli senza stato.
- **Contatore "EVENTS 0"**: claude «numero nudo, rumore»; deepseek
  coerente (spazio sprecato per zero eventi).

**Punti solo claude**: contraddizione evento-vs-crisi risorse (P0);
collasso a chip quando vuoto + pannello solo su richiesta; "Localizza"
con highlight del pin al hover; auto-pausa opzionale su eventi critici;
aria-live/annuncio all'arrivo evento; audit contrasto automatico.

**Rimedi concordi**: collassare l'idle in chip/pillola, segmented
control, badge contatore solo se >0, riapertura sempre evidente.
