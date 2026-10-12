---
title: Recurring Traps
type: preflight-checklist
updated: 2026-10-11
---

# Recurring Traps — regole preventive lette in pre-flight

Regole per errori **ricorrenti** (≥2 istanze documentate). Non un registro:
questo file esiste per essere *letto al momento del lavoro* — `mw-executor` e
`mw-planner` lo consultano nel pre-flight quando il task tocca una superficie
taggata nella tabella sotto.

Una trappola entra qui solo dopo ≥2 istanze documentate in `.mw/bugs/`,
`.mw/observation.jsonl` o `.mw/runs/*/pattern-candidate.md` (soglia `learn`).
Un caso singolo resta un pattern-candidate: non viene promosso.

## Indice per superficie

| Se il task tocca… | leggi |
|---|---|
| `PixiWorldMap`, `refit`, `floorZoom`, `seaMargin*`, layout `/game`, HUD su mappa | T-01 |
| archi SVG progressivi, `stroke-dasharray`, `strokeLinecap`, halo/timer radiali | T-02 |
| `data-hud-controls`, `skin-scope`, dropdown/popover/menu su `/game` | T-03 |
| claim percettivi ("si vede", "è percepibile"), verifica di animazioni/effetti | T-04 |
| "migliora X" / "fixa X" su componente coperto da desiderata FROZEN o workflow canonico | T-05 |
| sintesi, spec o mappe prodotte sopra ledger/requisiti atomici | T-06 |
| derivati visuali legati a un'entità sorgente (ombre, halo, countdown) | T-07 |

---

## T-01 — Coverage-floor vs content-fit: pinna il bordo protetto, non allargare il mare

**Surface:** layout `/game`, `PixiWorldMap.refit()`, `floorZoom`, `seaMarginPx`/`seaMarginYPx`, chrome HUD (nav plinth, placca giorno).

- **Cosa succede:** la mappa diventa troppo grande e la terra scivola sotto
  l'HUD. Il fix "aumenta il mare" abbassa `floorZoom` e **sposta solo la
  soglia** del conflitto — esiste sempre una finestra viewport che rompe — e
  le bande di mare aggiunte producono cuciture visibili tra texture vecchia e
  nuova.
- **Istanze:** fix margini `8254e8e1` (260/300→700/400: spostò la soglia, non
  risolse); `.mw/bugs/2026-10-10-game-island-under-hud/` (fix strutturale: pin
  del bordo sud sull'area libera quando `landH > freeH`); segnalazione Director
  2026-10-11 (ricorrenza + "linee tra il mare vecchio e quello nuovo").
- **Regola:** quando il floor di copertura (mare a tutto schermo) e il fit del
  contenuto (terra nell'area libera) confliggono, **pinna il bordo che il
  design protegge** (isola poggiata sopra il nav); l'eccesso va dalla parte non
  protetta. MAI risolvere allargando la decorazione: sposta la soglia e aggiunge
  artefatti.
- **Risoluzione (R-148, `.mw/bugs/2026-10-11-game-map-fit-seams/`):** il floor
  vinceva su tutti i viewport larghi/bassi e stretti. Fix: i margini sono
  diventati la *portata* del mare aperto (`3600/1800`), oltre la quale lo shader
  è già nebbia piatta → il floor scende sotto il fit a tutti i viewport target;
  `SEA_QUAD_PAD` estende i quad mare oltre i bound di pan → il bordo quad non
  raggiunge mai lo schermo (causa probabile delle "linee": sliver dello stage
  `#489397`, più chiaro del mare profondo, quando il pan clappava il bordo quad
  esattamente sul bordo schermo; la rottura di texture alla riga dipinto↔generato
  resta morbida — profilo RGB continuo, verificato). `cameraConfig.minZoom`
  (0.18, prima ignorato) ora vale solo sullo zoom-out utente; il recenter resetta
  `userMoved` così i resize rifanno il fit. Contratto e misura:
  `src/docs/docs/design/game_map_fit_contract.md`.

## T-02 — Arco progressivo da 0 + `strokeLinecap="round"` = punto alle 12

**Surface:** halo, timer radiali, gauge: `stroke-dasharray`, `stroke-dashoffset`, `strokeLinecap`, `sealProgress`, `LiquidHalo`, `MagicCircleHalo`.

- **Cosa succede:** un arco la cui lunghezza è pilotata dal progresso e parte
  da 0, con cap tondo, disegna un puntino/bolla all'inizio dell'arco anche a
  progresso zero — non appartiene al disegno e la gravità cresce con
  `strokeWidth`.
- **Istanze:** `DayNightPoiSkin` + `HaloProgressComponent` (2026-08-15),
  `GenericPoiSkin` + `MagicCircleHalo` (2026-08-15), **reintrodotto** in
  `PoiMatericV4` (2026-08-28) dopo due registrazioni — il caso che dimostra
  perché questo file esiste.
- **Regola:** nessun `strokeLinecap="round"` su archi che possono avere
  lunghezza 0; clamp del cap o soglia minima di visibilità. Verifica a
  progresso 0, non solo a progresso pieno.

## T-03 — Scope CSS a discendenti: il bordo è invisibile finché non apri una seconda superficie

**Surface:** `data-hud-controls`, `skin-scope`, `SkinScope`, dropdown, popover, portal, submenu su `/game`.

- **Cosa succede:** il trigger sta dentro lo scope e sembra giusto; gli elementi
  di una seconda superficie (dropdown, popover, portal) restano **fuori** dallo
  scope ed ereditano il default (es. voci menu come barre bronze-CTA invece di
  pill 26px). Nessun errore: solo look sbagliato, invisibile finché la
  superficie non si apre.
- **Istanze:** icona+testo nudo schiacciato a 26px (`:has(> svg:only-child)`);
  dropdown di `HudGameMenu` fuori scope (R-138, 2026-10-11). Regola già
  promossa in `hud_component_guide.md` §5.
- **Regola:** lo scope va sul **root del componente** e copre ogni superficie
  che il componente apre (dropdown/popover/portal). Test: `menu.closest('[data-hud-controls]')` non-null.

## T-04 — Claim percettivi: verifica a occhio nel browser reale, non solo a metrica

**Surface:** animazioni, effetti visivi, "si vede / non si vede", diff pixel, `readPixels`, screenshot-based acceptance.

- **Cosa succede:** la metrica misura la cosa sbagliata (deriva accumulata
  invece di velocità di cambiamento; settle-time non escluso; nuvole contate
  come mare) e l'occhio del Director la contraddice — quattro tentativi sul
  mare respinti prima di trovare la forma giusta.
- **Istanze:** saga moto del mare R-056 (metrica errata in 3 modi, *"l'ho detto
  due volte e mi sono sbagliato"*); correzione Director 2026-09-10: *"prima di
  dire che hai finito devi vederlo tu a schermo se è percepibile da occhio
  umano"*; animazioni non osservabili in browser pane con `document.hidden`
  (rAF bloccato).
- **Regola:** un claim percettivo si chiude solo con verifica a occhio in un
  browser reale e viewport realistico. La metrica è supporto, non verdetto. Se
  metrica e occhio divergono, crede l'occhio — e la metrica va corretta prima
  di riusarla.

## T-05 — "Migliora X" ≠ "riscrivi X": la desiderata decide lo scope

**Surface:** task worded come improve/fix/polish su componente con desiderata FROZEN, frozen kit, o workflow canonico (mockup→componente, spec-driven).

- **Cosa succede:** l'istinto "serve una riscrittura" parte senza leggere la
  desiderata: 3000+ LOC di fork (V1→V5) scoperti solo a metà; oppure si genera
  fuori dal workflow canonico (mockup senza spec → R-024 ha dovuto aggiungere
  il gate `--enforce-canon`); oppure si "copia" un esempio invece di seguire il
  linguaggio di design (bocciatura Director 2026-09-21: *"ti avevo dato un
  esempio, hai fatto una copia"*).
- **Istanze:** `.mw/pattern-big-rewrite-without-authority.md` (2026-08-17);
  R-024 enforce-canon (mockup fuori workflow); R-012 V4 "inguardabile" fuori
  foundation recipe.
- **Regola:** prima di codare, grep della desiderata FROZEN sul nome del
  componente — una frase di scope. Se l'istinto è "rewrite" e la desiderata
  non lo approva: fermarsi e chiedere ("patch o revisione desiderata?"). Se
  esiste un workflow canonico per quell'artefatto, si passa da lì. Max ~200
  LOC prima della prima verifica nel browser.

## T-06 — Sintesi sopra un ledger: coverage check per-ID alla scrittura

**Surface:** mappe, spec, riassunti strutturati prodotti sopra Extraction Ledger, RICHIESTE, liste di requisiti o contratti enumerati.

- **Cosa succede:** riorganizzando un ledger atomico per un'altra chiave
  (meccanica, fase, componente), i dettagli senza slot nello schema di
  destinazione diventano orfani e cadono in silenzio — ~20% di perdita
  misurata (18 ledger → 12 schede). Ogni passaggio di sintesi senza invariante
  perde risoluzione.
- **Istanze:** `.mw/runs/20261007-learn-coverage-invariant/` (NARRATIVE §5);
  `KNOWLEDGE_INVENTORY.md` con 648 file "pending canonical review" mai
  rivisti; `KNOWLEDGE_CONFLICTS.md` falso negativo su conflitti reali
  (`KNOWLEDGE_AUDIT.md` §C).
- **Regola:** ogni ID sorgente ha uno sbarco esplicito o un motivo di
  esclusione scritto — **alla scrittura**, non a verifica richiesta. La copertura
  si dimostra per-ID, non a impressione.

## T-07 — Derivati visuali: lifecycle e progresso dal proprietario, mai da una simulazione parallela

**Surface:** ombre, halo, countdown, anelli di stato legati a entità sorgente (nuvole, offerte quest, POI).

- **Cosa succede:** un derivato animato da un loop indipendente perde la
  corrispondenza con la sorgente (ombre orfane al 100%, invisibili sulla
  terra) o inverte il contratto (halo countdown che si riempie in senso
  orario invece di scaricarsi antiorario).
- **Istanze:** `.mw/bugs/2026-10-10-game-cloud-shadows/` (ombra creata nel
  factory della nuvola, stesso `t0`/progress/envelope); `.mw/bugs/2026-10-10-game-poi-halo-state/`
  (stato semantico vs progress numerico — `mapQuestPoiView` unico punto di
  coerenza).
- **Regola:** il derivato nasce dentro il proprietario, condivide
  lifecycle/progress normalizzato, muore con esso. Stati semantici del
  contratto (`available`/`expiring`…) si mappano nel view-model, non passando
  progress numerico a casaccio.
