# Componente Eventi — brief di composizione (PLAN-125 Fase 4/OB-8)

**Metodo:** mockup composto in DOM su token reali (`public/mockups/eventi-lab/`,
stesso canale della banda di scorrimento `.mw/runs/20261120-scroll-band/` —
visual-fork surface #2, harness HTML/CSS, `spike: remove`). Nessuna nuova
generazione AI: ogni parte deriva da un golden **già registrato** in
`.mw/specs/expedition-ui/refs/`.

## Sorgenti (provenance)

| Parte | Golden | Stato del ruling |
|---|---|---|
| Cornice (4 lati: angoli ad acanto + gemma a griffe, bordi incisi, fermaglio al centro del bordo alto, pendente rombo smeraldo sotto) | `mockup-r357-cornici-aperta.png` | **battezzata** (ruling v4b «Molto belle le cornici così, le battezzo»; pezzi estratti `panel-frame5/*` + ritagli `eventi-lab/assets/`) |
| Toolbar header (titolo + contatore + controlli tondi: filtro, ordina, vista, riduci, chiudi — identica a Roster/Stash) | `mockup-r357-hud-aperta-v4c.png` | **approvata** (ruling v4d «I filtri nuovi sn buoni, approvati»; «il world ledger dovrebbe essere come quello d roster») |
| Voci evento (vignetta dipinta, titolo, countdown in giorni, descrizione, chevron, barra di avanzamento per % events, riga «OTHER EVENTS • N» collassabile) | `mockup-r357-cornici-aperta.png` + `mockup-r357-hud-aperta-v4c.png` | contenuto approvato in entrambe |
| Banda di scorrimento | `scroll-band-oro-inciso.png` (fork card `.mw/runs/20261120-scroll-band/`, ruling B «Oro inciso» 2026-11-20) | **battezzata** |
| Stato ridotto a striscia (3 mini-righe icona+titolo+giorni) | `mockup-r357-cornici-chiusa.png` | riferimento |
| Palette | nav / placca risorse (golden standard colori, ruling 2026-11-17) | battezzata |

## Regole strutturali (desiderata + ruling)

- **D-8:** fascia alta = tempo a sinistra, risorse al centro, **Eventi a destra**.
- **D-1 / regola di copertura:** Eventi e cassetto condividono la colonna
  destra. A riposo si vedono gli Eventi; il cassetto aperto li copre
  **interamente**. Stessa larghezza o più stretto del cassetto (512 px @
  1440×900; `drawer.columnAspect` 0.5689 × altezza, cap 613), stesso bordo
  destro — niente sporge, il cambio è pulito.
- **Cornice su tutti i 4 lati** (gli Eventi non sono il cassetto estratto:
  bordo destro corniciato, non a filo schermo).
- **Segno positivo/negativo senza solo colore** (PLAN-117 F5): sagoma o glifo
  diverso per pericolo/buono/neutro.
- **Nessuna modale** (veto GX-0042): Event Detail in sezione dedicata, non
  popup — fuori da questo mockup (mockup Detail a parte, PLAN-125 §9).
- **Tipi** da `gameFrameConfig.events.types`: threat(danger) · quest ·
  expedition · construction · harvest · visit; ordine per scadenza; minaccia
  entro 5 giorni = allarme (`nextEvent.ts`).

## Cosa il mockup NON copre

- Event Detail (sezione dedicata) — mockup a parte.
- Icone definitive — programma icone D-6 (plan proprio); qui si usano i
  ritagli del golden come segnaposto pittorici.
- Dati reali — voci fittizie fedeli al golden (Invasion/Tournament/
  Fortification/Other), mapping sui type-id reali in produzione.

---

## Ruling Director 2026-11-21 (eye-check su lab + GPT/Gemini mockups)

**DIREZIONE BLOCCATA. I lab/GPT-mockup sono spike usa-e-getta — il deliverable è il DOM vivo a qualità produzione.**

### Composizione approvata — stato APERTO
- Frame: `PanelFrameOrnaments` manifest `panelFrame5` (cornici battezzate, fermaglio top + pendente bottom).
- Header COMPATTO (niente scritta enorme): `World Ledger <count>` ~14-15px + controlli round `data-ctl="round"` → sort, collapse, close (toolbar v4c già approvata).
- Filtri = **tab-pill stile Roster** (`HudRealRosterOpen` nav role=tablist): riga wrap di pill piccole, label + count, `.on` evidenziata — tipi da `gameFrameConfig.eventLedger.types` + tab "All".
- Voci = **card con vignetta dipinta a sfondo** (bordino oro, icona, titolo Cinzel, countdown tono, riga desc, chevron `›`, progress bar se construction).
- Banda `HudScrollBand` variante B nel gutter destro.
- Riga «OTHER EVENTS · n» collassata in coda.
- Titolo + countdown non devono collimare: title con ellipsis, countdown a larghezza fissa.

### Stato CHIUSO — diverso dall'aperta (ruling: A non va bene per la chiusa)
- Strip sotto la stessa cornice: 3 mini-righe (icona + titolo + giorni, threat pinnata da `pinTypesWhenCollapsed`) + chevron riapertura. Raffinarla in produzione, non copiare il lab.

### Asset registrati disponibili
- Slice-kit: `/assets/ui/hud-real/slicekit/panel-frame5/` (manifest `src/generated/slicekit/panelFrame5Frame.ts` — NON hand-tune geometry).
- Estratti golden (in `public/mockups/eventi-lab/assets/` — copiare in public/assets registrati se usati in prod): `vignette-invasion.png`, `vignette-tournament.png`, `icon-swords.png`, `icon-trophy.png`, `icon-hammer.png`, `icon-castle.png`, `clasp-top.png`, `pendant-bottom.png`.
- Vignette mancanti per: expedition, harvest, visit → fallback card su lacca con icona incisa (ruling provvisorio mio, confermare).

### Layout/copertura
- Larghezza ~360-376px (`topChrome.chronicleReservePx=360`), docked top-right ~18px dal bordo; cassetto aperto (flush, ~512px) copre TUTTO (D-1). Verificare aperto+chiuso.
- Top chrome resta left/center, non invade la riserva.

### File da toccare
- `src/ui/idleVillage/hudReal/HudRealLedgerPanel.tsx` — rewrite (oggi prototipo con HudRealPanel + C hardcoded + native scroll).
- Modello/logica da `src/ui/idleVillage/hudReal/HudEventLedger.tsx` (HudEvent, sort, maxVisible, controls).
- Mount: `src/pages/game-mappa2.tsx` ~L1593 StagePanelFrame panelId="events" — width/dock da allineare alla colonna cassetto.
- i18n: namespace `idleVillage`, chiavi eventLedger esistenti + nuove (tab labels, otherEvents).
- Tests: invariant tags `// INV:chronicle.INV-n`.

### Verifica finale (T-04 + gates)
- mw-pw captures `/game` 1440×900 + 1920×1080 + 390×844: ledger visibile vs cassetto aperto = zero pixel.
- `npm run lint/test/build:check/closure:lint` scoped + `verify:bundle`.
- Occhio Director su capture live prima di "done". NESSUN commit.

### Note processo
- GPT/Gemini mockups in `.mw/runs/20261120-eventi-mockup/gpt/` (gen-02=A approvata come riferimento mood; gen-04 timeline; gem-b-01 compatta) — spike, non asset prod.
- Guida mockup-web-requests: `context/mockup-web-request-guide.md`.

## 2026-11-21/22 — Riferimento TEMPORANEO 3 stati (ultimo mockup Director)

`refs/mockup-eventi-3stati-tmp.png` (1024×682) — incollato dal Director, **da lavorare ancora** (non battezzato). Mostra i tre stati insieme:

- **Chiusa** (in alto): banda — medaglione dipinto goblin a sx + titolo threat oro + `5 d` rosso + bottone ottone chevron-giù + ornamento centro-fondo.
- **Aperta compatta** (centro): medaglione a sx **sporgente dal bordo frame**; header `EVENTS 3` (icona pergamena + conteggio) + chevron-su (collapse) a dx; pill `All 3 | Threat 2 | Quest 1 | Work 0`; 3 righe icona-tonda-smalto + titolo + giorni + chevron dx (righe semplici, NON card vignetta).
- **Aperta piena** (sotto): stessa forma con 10 righe **numerate** + banda scroll oro sul bordo dx con cap-frecce.

Delta vs implementazione corrente: medaglione sx sporgente dal frame; righe = icona tonda smalto + testo (niente vignetta di sfondo); numerazione quando molte; chevron-up di collapse in header; tipo "Work" nelle pill.

## 2026-11-21 sera — direzione "uniformato barre top" (in iterazione)

Richiesta Director: eventi uniformati al componente risorse/tempo — stessa famiglia
visiva (nero/verde petrolio/oro inciso), riuso componenti esistenti.
Mockup DOM (non AI) nel lab `public/mockups/eventi-lab/index.html` sez. `uni-*`:
- **UNI chiusa**: `resources/bar-slim.webp` 758×124 scalata a 380×62 come strip intera
  (punte oro-smeraldo laterali incluse) + medaglione circolare (vignetta threat in
  circle-mask) + titolo serif oro + countdown + chevron ottone.
- **UNI aperta**: stessa slim bar come header (`EVENTS · N` + medaglione + chevron-up),
  corpo = panel lacca con bordo oro 1.5px, righe = capsule "stadium" tipo slot
  risorse (CSS: radius 999px, border #a8833c, bg petrolio scuro), icona smalto
  per tipo, numeri oro, banda scroll oro dx.
- Witness: `.mw/runs/20261121-eventi-chiusa/uni-{chiusa,aperta}.png`.
- Trade-off vs 3-stati: perde frame5+pendente (famiglia barre, non pannelli).
- Alternativa non provata: `time/bar-slim.webp` (filigrana sx + pozzetti).
- Ruling: IN ATTESA.
- Resume: se approvato → nuovo DOM vivo `HudRealLedgerPanel` forma "bar": strip
  chiusa = img bar-slim + overlay; aperta = header bar + stadium rows CSS.
  Asset da registrare: nessuno nuovo (riuso bar-slim + vignette + medallion kit).

## 2026-11-25 — Riferimento Director barra speculare al Tempo (R-386)

`refs/ref-eventi-bar-specular-time-2026-11-25.png` è il riferimento vincolante
più recente. Richiesta verbatim: *«componente eventi: salva questo come
referenza e usalo, speculare al compoente tempo. la gemma rossa è x i
pericoli, altri colori saranno x altro»*.

### Contratto visivo derivato

- La forma chiusa degli Eventi è una **barra orizzontale della famiglia
  Tempo/Risorse**, non un pannello frame5: fascia petrolio/nero, oro inciso,
  ornamento/medaglione a sinistra e grande gemma tonda a destra.
- La gemma rossa nativa significa **pericolo/threat**. Gli altri toni evento
  ricolorano solo la gemma (warning/good/neutral) secondo la mappa in config;
  il segno resta leggibile anche senza colore tramite glifo del tipo nel
  medaglione sinistro.
- La barra è il collapsed strip: mostra l'evento rappresentativo (threat
  pinnato se presente, altrimenti scadenza più vicina), il suo countdown e
  apre/chiude il pannello Eventi esistente. Non introduce una seconda lista né
  una modale.
- Il riferimento magenta non si edita mai. La derivazione produzione è
  deterministicamente rigenerabile con `scripts/hud-real/build-events-bar.py`
  → `public/assets/ui/hud-real/events/bar.webp`.

### Implementazione corrente

- `HudRealEventsBar` montato da `GameTopChrome` nella riserva top-right già
  prevista da D10 (`chronicleReservePx`), a destra della resource bar; su
  canvas troppo stretti la riserva cede e la barra si nasconde invece di
  sovrapporsi.
- Il pannello `HudRealLedgerPanel` resta la superficie aperta esistente;
  questa fase non riscrive ancora il suo corpo.
- Esito 2026-11-25: implementato e verificato su `/game` headless WebGL.
  Witness finali in `test-results/r386-events-bar/`: empty, threat nativo
  con gemma rossa, pannello reale aperto, 1920×1080 e narrowing (visibile a
  980, nascosto senza overlap a 900 e sotto). Probe: `final-probe.json`/`postrefactor-probe.json`,
  `narrow-probe.json`; confronto visivo: `final-comparison-board.png`.

### Correzione Director 2026-11-25 — gemma verde Time, una sola riga

Dopo il primo witness il Director ha corretto la lettura: la versione con gemma
verde non deve essere un repaint/scrivente sopra la gemma rossa, ma deve usare
proprio l'asset verde del componente Tempo (`time/dial-frame.webp`) in swap.
Il testo vivo sta su una sola riga; il countdown compatto (`5d`) viene messo
alla fine, immediatamente prima della gemma. Witness aggiornato:
`test-results/r386-events-bar/swap-empty-bar.png`,
`swap-threat-bar.png`, probe `swap-probe.json`.
