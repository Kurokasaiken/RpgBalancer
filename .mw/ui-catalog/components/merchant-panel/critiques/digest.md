# Digest critiche — merchant-panel (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-merchant-panel` (+ run `-r2` per il refill claude:
binding originale avvelenato su `claude.ai/new`), turn T-001 (+retry
T-002 mattina per claude; refill T-001 su -r2 post-reset quota 12:20,
2 shot ctx-a + iso-0), prompt verbatim R-282.

**Provider failure dichiarati:**
- **chatgpt** — `ATTACH_FAILED` su T-001 e T-002 ("no upload
  affordance"). Pattern persistente del giorno; retry esaurito.
- ~~**claude**~~ — RECUPERATO al refill (12:40 CET, run -r2, collect
  SUCCESS ~12k chars). T-001/T-002 del mattino: Enter timeout e collect
  «did not stabilize» sotto rate limit 5h. Vedi `claude.md`.

Convergenza = **2/2 provider image-grounded** (claude + deepseek).
Fatti corretti da entrambi: Trader Rowen, "Rowen restocks when the road
is kind", Healing Draughts, Field Rations, "preview only" ×N, bottoni
BUY tratteggiati, pill PREVIEW, popover "OPEN MERCHANT" sotto.

## Convergenza forte (2/2)

1. **Flavor text occupa lo slot dell'informazione decisionale.**
   - deepseek: «flavor 70% dello spazio, meccanica ai margini… prima
     cosa fa e quanto costa, poi la poesia».
   - claude: «gerarchia piatta: nome, prezzo, descrizione e stock hanno
     lo stesso peso… dopo 3 righe di prosa non so cosa fa uno Smoke
     bomb in numeri» + «"One crate left" è un dato funzionale
     travestito da flavor, nella zona a più basso contrasto».
2. **"preview only" ridondante.**
   - deepseek: «ridondante e fuorviante accanto a ogni BUY».
   - claude: «ripetuto 6 volte: pill PREVIEW + bottone tratteggiato +
     "preview only" ×4 — il rumore è altissimo e l'informazione è una
     sola»; in più «la pill PREVIEW sembra un bottone: è uno stato, non
     un'azione».
3. **Layout denso / icone insufficienti.**
   - deepseek: «icone piccole e simili, righe non nettamente divise,
     scrollbar invisibile oltre i 4 item».
   - claude: «icone da francobollo ~14px monocromatiche, allineate alla
     baseline anziché centrate → servono 48-64px con cornice e rarità»;
     pannello ~340px «troppo piccolo per uno shop su Steam/Deck; su
     390×844 va in sheet/full-screen».
4. **Manca il contesto economico della decisione.**
   - deepseek: «nessun feedback sul proprio inventario → contatore
     "Hai X"».
   - claude: «nessun portafoglio nel pannello: l'oro sta a ~600px di
     distanza… hai 15 gold e un oggetto da 16: un'occasione di
     storytelling gratis buttata via».
5. **Rimedi concordi**: riga a 3 colonne (icona | info meccanica |
   azione) — proposta identica nei due verbatim; flavor relegato a
   seconda lettura (deepseek: footer corsivo; claude: `flavorKey` con
   line-clamp 2); prezzo accanto a BUY con icona moneta come l'HUD.

## Disaccordi / punti di un solo provider (verbatim)

- **Prezzo lontano dal BUY + "9 gold" testuale vs icona moneta dell'HUD**
  — solo claude.
- **Layering pannello/popover** — solo claude: «il popover "OPEN
  MERCHANT" è ancora aperto sotto, testo tagliato dal pannello: due
  layer che competono… sembra un bug» → registry `exclusiveWith` +
  scrim leggero.
- **aria-disabled discussion** — solo claude: scelta giusta (resta
  focalizzabile per tooltip) ma «un disabled senza spiegazione
  frustra»; testo secondario ≥4.5:1 anche se WCAG esenta.
- **Wallet statico in config (demoWallet) con nota di governance** —
  solo claude: il wallet vero richiede store import → «decisione da far
  prendere al Director».
- **"Hai X" inventory counter** — solo deepseek.
- **Misattribution** — deepseek attribuisce il pannello ad *Against the
  Storm* (fatti comunque corretti); claude corretto.
- **Stack** — deepseek: HTML/CSS generico; claude: React+TSX+Zod config
  (`merchantOfferSchema` con stockKind last/few/plenty, packQty,
  effectKey/flavorKey separati) — direttamente applicabile.

## Quick-wins vs Structural

- Quick-wins: un solo segnale preview (ribbon `role="note"`, via i 4
  "preview only"); prezzo+BUY adiacenti con icona moneta; chiudere il
  popover edificio all'apertura; stock come chip funzionale.
- Structural: schema Zod con effect/flavor separati; icone 56px con
  cornice+rarità; footer portafoglio (demo statico, o vero previo OK
  Director); pannello più largo / sheet su mobile; master-detail stile
  Destiny come step P2.

## Note di grounding

- claude (-r2 T-001): fatti corretti — 4 offerte, "preview only" ×4 +
  pill, BUY disabilitati con bordo tratteggiato, oro 15 vs prezzo 16,
  cibo 0/−6d nell'HUD, popover sotto.
- deepseek (T-001): fatti corretti; misattribution Against the Storm.
