# COMPOSITION-SPEC — contratto di composizione a gruppi (PLAN-113 F1)

**Stato:** bozza per gate GC-1 (ruling Director). Prodotto da F1 — misure reali su `/game` @1920×1080 (probe DOM rects, 2026-11-06) + contratto stage-zone esistente.
**Vincoli:** pianta B1 (chrome persistente) intoccata; la Direzione 1 (famiglie convivono) è ruling Director; gli emendamenti E-12/E-19/E-20 §10 del plan valgono su questo documento.

## 0. Misure reali @1920×1080 (probe `data-stage-panel`/`data-testid`)

**Triade A composta** (stato: roster `r` + stash `v` + planner `openDetail`):

| Elemento | Rect (x,y,w,h) | Zona |
|---|---|---|
| roster aperto | 232,92 → **400×268** | leftWing (fill) |
| village stash | 242,450 → **380×288** | leftWing (sotto roster, stessa ala) |
| planner (floating quest-expedition) | 820,92 → **680×587** (inner 656×565) | centerStage |
| forecast column | 1554,100 → **340×382** | rightWing (occupa lo slot dx) |
| chrome utility | 1758–1894,1014 → 40×40 ×2 | overlay |

Occupazione deduplicata triade ≈ 745k px² = **~36% viewport** (+ chrome persistente ~8-10% misurato a parte in PLAN-112). Totale scena ≈ **~45%**. Il budget persistente (24%) non copre i gruppi → serve **cap di convivenza separato** (E-12).

**Run cluster** (quest attiva): `quest-cluster-window` 480,32 → **960×1036** (~48% viewport, regime `run` = occupante unico stage); teatro 932×388; footer 932×134; journey-route overlay full-map 1620×1081; + questPoi 55×55 sulla mappa. A 1920 `bothWings` possibili (≥1440): companionLeft 280–320 + skillCheckColumn 340–420 si affiancano al cluster (fino a ~1180+ exp).

**Base chrome**: solo utility 40×40 misurabili; le barre top/nav non hanno testid (misura dedicata PLAN-112 ~8–10%).

**Nota heroSheet**: shortcut `p` non l'ha aperta nello stato triade (rail-anchored, richiede hover su card) — da catturare in F2 con driver dedicato.

## 1. Cap di convivenza (E-12 — separato dal 24% persistente)

Proposta metrica (T-101b, pixel-ink deduplicato dei pannelli di gruppo, chrome escluso):

| Gruppo | Tetto convivenza proposto | Misura attuale @1920 | Note |
|---|---|---|---|
| A triade | **≤40%** | ~36% | sotto il tetto a 1920; a 1440 il forecast retrocede in tab/strip |
| B run cluster | **≤55%** (regime) | ~48% (+companion ≤+12%) | surface di regime, tetto proprio |
| C vista villaggio | **full-area by design** | vista = superficie, non gruppo | non è convivenza: è la scena |
| D+E ali | **≤30%** | merchant 360×420 + ledger 300×320 ≈ ~12% | ali una alla volta o coppia dx |
| F full-screen | **momento dedicato** | n/a | pre-empts la scena, non si somma |
| G sistema | **modale dedicato** | n/a | idem |

Al di sotto di 1440px: le ali si ripiegano in strip/tab secondo il meccanismo collassato esistente (`strip.wingTabPx`, `bothWingsBelowPx 1440`). Il cap si verifica **per viewport canonico** (1280×800, 1440×900, 1920×1080, 2560×1440).

## 2. Contratto di composizione per gruppo

### A — Compagnia (triade) — REGIME `gestione`

- **Elementi simultanei:** roster aperto (A1), stash (A2) in leftWing — planner (A3) in centerStage — forecast in rightWing (interno al planner: è colonna pin del dettaglio, non tenant). HeroSheet (A4) overlay rail-anchored, esente.
- **Ancoraggi:** ala sx = edge 24; planner centra nel corridor tra ali (gapPx 8); forecast occupa rightWing quando il planner è aperto, altrimenti libera lo slot.
- **Collisione/priorità:** heroSheet overlay sempre sopra (z panels+2); su <1440 il forecast collassa in tab nel planner prima di toccare le ali.
- **Zoom:** compone dentro hudScale — i pannelli seguono il budget zone, non scalano singolarmente.
- **Stati min/max:** roster 0/6/14 eroi, stash 0/24, planner vuoto/assegnato/con forecast.

### B — Quest in corso — REGIME `run`

- **Elementi:** cluster finestra (teatro+stage+footer) + companionLeft (party+belt, 280–320) + skillCheckColumn (340–420, astrolabio ≤480) + journey-route overlay su mappa + log/cronaca (dx, si apre quando entra). `bothWingsBelow 1440` → dx chiude prima; <1100 mai entrambe.
- **Ancoraggi:** cluster centra in centerStage, sovrapponibile al chrome sotto margine `questChromeOverlap` (84/88).
- **Priorità:** in `run` regime le superfici A/D/E si sospendono (`runPolicy suspend` tranne questDetail=retire). Popup reward/esito sopra tutto (z dedicated).
- **Stati:** teatro min 190 / tipico / stageMax 260; scelte ≤190; skill-check attivo (astrolabio); verdict/epilogo.

### C — Vista villaggio — REGIME `vista`

- Non convivenza: è la scena intera. Elementi: dipinto + pin edifici + overlay slot + drawer registro. Chrome persistente resta sopra (B1). Feasibility spec in §4.

### D+E — Commercio + cronaca — rightWing / ali

- Merchant (D1) e ledger (E1) convivono in rightWing solo uno alla volta (stesso slot home) — coppia possibile solo ledger sopra + merchant sotto se entra (280+? no: slot 340 condiviso, esclusi a meno di split). Composizione proposta: **un solo occupante dx alla volta**, l'altro in tab strip.
- Memorial/reliquario (E2/E3): pannelli dedicati stesso slot dx, esclusivi.

### F — Cerimonie/esiti — REGIME `momento`

- Full-screen dedicati (level-up, settlement-lost, game-over, invasion card): pre-empt la scena; il chrome si attenua/nasconde secondo `hudHide`. Non si compongono: si sostituiscono.

### G — Sistema — REGIME `modale`

- Menu/load/settings/modal: overlay dedicato sopra tutto, focus-trapped. Il menu già mostra (cattura 23-B1) di poter convivere sopra pannelli aperti — regola: sempre z-top, disattiva input sotto.

### H — Transienti — sopra tutto per natura

- Toast/tooltip/alert: sopra chrome e pannelli (z outcomeToast dedicata); si compongono con QUALUNQUE stato senza consumare budget (durata limitata).

### I — Mappa/Pixi — vedi §4

## 3. Varianti di composizione per il fork GC-1 (visual-fork card)

Tre rappresentazioni materialmente diverse per la triade A (il gruppo più delicato — centro-scena). Preview: composito su cattura `04-A-triad-roster-stash-planner.png` + varianti mock (kit+screenshot, E-01 — nessuna immagine Gemini necessaria per F1.2).

| Variante | Com'è | Pro | Contro |
|---|---|---|---|
| **V1 — Ali replicate** (faithful al 3-zone stage) | le tre zone come oggi: ali sx roster+stash, centro planner, dx forecast. Zanara = reskin dei frame/placche esistenti dal kit | fedele all'uso reale; nessuna novità IA; forecast resta nel suo slot storico | molta superficie spesa (~36%); il planner 680 è stretto per l'opulenza |
| **V2 — Fascia unificata** | una fascia unica basso-sinistra→centro che accorpa roster+stash come moduli di un unico mobile Zanara, planner resta centro con forecast integrato | composizione più ricca/scenica (un unico arredo); libera l'angolo dx; riduce seam | cambia l'IA (stash diventa modulo del mobile, non pannello separato); forecast integrato = modifica contratto planner |
| **V3 — Roster-anchored** | pannelli liberi ma **agganciati al roster ribbon** (la fascia C1 produzione): stash/planner si aprono come estensioni che sbocciano dalla ribbon, come il heroSheet fa dalla card | gestualmente coerente (il roster è la sorgente); occupazione minima in idle | più dinamismo da governare (ancore mobili); rischio overlap a viewport medi |

Per gli altri gruppi le varianti sono meno forti: B resta il cluster firmato WS-4/5 (le varianti sono solo di vestizione), C è la vista, F/G sono momenti/modali dedicati. Il fork GC-1 riguarda **soprattutto A**; per B–I il GC-1 firma la forma già contrattata + il reskin.

## 4. Spec di fattibilità C+I (OB-2c — firmata al GC-1)

**C — Vista villaggio:** NON è un pannello → non prende asset dal kit cornice. Mockup = il dipinto+pinnato composto da screenshot reali + reskin degli elementi DOM sopra (pin frame, slot overlay, drawer registry, tooltips) via kit. Decisione: il dipinto stesso **non si rigenera** (è world art, fuori scope Zanara-chrome); si trattano solo i suoi elementi HUD.

**I — Mappa/Pixi:** sprite, non DOM. Formato dichiarato:
- **POI marker + halo:** sprite atlas (texture da asset Zanara ridisegnato) — `MapQuestPoi` già disegna a 55px; il design nuovo produce un atlas `poi-*.png` + parametri halo; risoluzione @2x (110px) per DPR2; hit-test = bounds sprite (già presente).
- **Journey route:** overlay line/fx Pixi — reskin colore/pattern via config (niente asset art richiesti, solo token oro/brunitura).
- **Pin villaggio/POI edifici:** componenti gameFrame DOM sopra canvas (`MapBuildingPoi`/`MapDemoPoi`) — reskin dal kit (placchette), NON sprite.
- **Zoom:** i marker non scalano col zoom mappa (dimensione UI fissa 55px) → stessa regola dei futuri asset Zanara.

## 5. Domande per il gate GC-1

1. Cap di convivenza: i tetti proposti in §1 vanno firmati o ritoccati (es. A ≤40% è giusto o serve più aria?)
2. Triade A: quale variante — **V1 ali replicate / V2 fascia unificata / V3 roster-anchored**?
3. C: conferma "solo elementi HUD sopra il dipinto, il dipinto non si tocca".
4. I: conferma formato — POI marker = sprite atlas @2x, route = reskin token, pin edifici = reskin kit DOM.
5. GC-1 per gruppo (una firma per A + conferma forma per B–I) o unico?

## 6. GC-1 — rulings Director (2026-11-06)

- **Cap di convivenza:** firmato con **A ≤45%** (più largo del proposto 40%); B ≤55%, D+E ≤30%, C/F/G dedicati, H esenti come da §1. Triade oggi ~36% → dentro il cap.
- **Spec C+I:** confermate entrambe — C: solo elementi HUD sopra il dipinto (il dipinto non si rigenera); I: POI marker = sprite atlas @2x, route = reskin token, pin edifici = reskin kit DOM.
- **Forma della firma:** per gruppo — GC-1 firma la variante della triade A + conferme separate per B–I quando arrivano.
- **Triade A:** il Director ha chiesto **preview prima del ruling** → prodotte in `public/mockups/plan113-comp/` (servite da Vite: `/mockups/plan113-comp/` — compositi spaziali su catture reali, no arte nuova, E-20). **Ruling triade: PENDENTE** su preview V1/V2/V3.

### GC-1/A — RULING (2026-11-06): **V2 — Fascia unificata**

Il Director firma V2 per la triade A. Contratto che ne deriva:

- **Mobile compagnia (leftWing):** roster e stash diventano **moduli di un unico arredo** (stacked, stessa cornice — non più due pannelli co-espansi: `authorizedPairs` resta il modello funzionale, ma la forma è un solo mobile con moduli). Ingresso: roster in alto, stash sotto — ordine come nella cattura.
- **Arredo planner (centerStage):** planner + forecast fusi in **un solo arredo** — forecast = colonna interna dx dello stesso frame (già è colonna pin del detail: la forma si formalizza come cornice unica, non due elementi).
- **rightWing liberata:** libera per Voce/narrativa/vuoto — NON ripopolata di default con la triade aperta.
- **Baseline congelata:** `public/mockups/plan113-comp/v2.html` + `test-results/plan113-inventory/preview-v2.png` (hash registrati in RICHIESTE R-319). Emendamenti: l'occupazione del mobile unico va rimisurata su implementazione (target ≤45%).
- **Conseguenze strutturali:** lo stash smette di essere "secondo pannello dell'ala" → nel contratto stage il modulo è subordinato al mobile; forecast conferma la collocazione interna (DEF-02 coerente); a <1440 il mobile sx collassa a tab (strip) e l'arredo planner resta (priorità: planner > moduli).

## 7. Tassonomia cornici per importanza (emendamento E-25, proposto 2026-11-06)

La critica Director («il kit sta diventando un template ripetitivo — non abbastanza ricco») espone un buco: il kit E-01 contemplava UNA cornice condivisa. Da qui in poi le superfici si assegnano a un tier d'ornamento:

| Tier | Chi | Ornamento | Asset |
|---|---|---|---|
| **T0 utilità** | tooltip, badge, tab, divisori, stati bottone | minimo | kit già approvato |
| **T1 pannelli** | merchant, ledger, registry, stash drawer | cornice base, ornamento leggero | pf-3-class |
| **T2 superfici di lavoro** | mobile compagnia, arredo planner, hero sheet, menu sistema | cornice dedicata, ornamento medio-denso (statue/corona/gemme sui bordi, campi puliti) | hero medio per superficie (generati: `mobile-compagnia-{1,2}`, `planner-arredo-{1,2}`) |
| **T3 hero** | quest window, invasion window, verdict/epilogo | statue + drappo + corona + fregio + pendenti | classe qwinr (`qwinr-{1,2}`) |
| **T4 cerimonie** | level-up, game-over, settlement-lost | massimo, maxi-frame dedicato | uno a cerimonia (da fare) |

Regole: campi di contenuto SEMPRE piani (live content sopra); ornamento solo su bordi/spandrelli/angoli; la stessa famiglia può contenere tier diversi (es. B: cluster T3 + belt plaque T1). Mappatura proposta — il Director conferma o corregge.
