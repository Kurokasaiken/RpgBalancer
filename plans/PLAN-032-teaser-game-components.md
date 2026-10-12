---
title: PLAN-032 — Componenti teaser su /game: scheda PG, magazzino, mercante, consumabili in quest, level-up
status: draft
owner: Mind Weaver (planner)
created: 2026-10-12
source_request: R-167 (contesto: R-072 teaser, R-166 standard AAA /game)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (esito R-167)
  - src/docs/docs/design/hud_component_guide.md §2 (nuovi pezzi pronti, se approvati)
  - src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md (righe draft dei nuovi componenti)
  - test-results/plan-032-<sp>-<date>.log (evidence per sub-plan)
---

# PLAN-032 — Componenti mancanti su `/game` per il teaser trailer

## Mandato del Director (R-167, 2026-10-12)

> *"per il teaser trailer gli elementi che ancora ci mancano nella pagina /game
> alcuni componenti. la scheda del personaggio ben fatta [...] che si apre se
> clicchi (e rilasci, nn trascini) la pgCard. Poi ci serve un componente dove ci
> sn i consumables della base, il picker per portarteli nella quest e un
> componente dove mostrare i consumabili durante il viaggio e durante le
> scelte/skill check durante la quest."*

Decisioni ratificate in sessione (registrate in RICHIESTE.md R-167):

1. **Gesto scheda PG:** `mouseOver` sulla pgCard apre la scheda; `click` resta
   auto-assegnazione (comportamento `handleResidentSelect` invariato).
2. **Scheda = HudPlaque:** `PgDetailCard` non è conforme alla guida HUD
   (Materic* bocciati, hex letterali) — si ri-esprime il contenuto dentro
   `HudPlaque` + `useHudPanelDrag` + `SkinScope` + `data-hud-controls`.
3. **Magazzino** tra gli edifici del villaggio: il sistema inventario **non
   deve esistere** — serve la schermata che lo mostra (mock config-backed).
4. **Mercante**: schermata HudPlaque; il sistema **non deve esistere** — solo
   la superficie che lo mostra.
5. **Level-up eroe**: non esiste (verificato). Per il teaser basta la
   *presentazione* (anello + cue + badge), livelli mock da config.

## Stato reale rilevante (FACT verificati)

- `PgDetailCard` (`src/ui/idleVillage/components/PgDetailCard.tsx`): contenuto
  già buono — stat dinamiche da `STAT_DESCRIPTORS`, equip + skill concesse via
  `useResidentHeroState`, portrait `resolveResidentPortrait`, i18n. Guscio
  Materic fuori standard HUD; cablata solo in `/primitives` e
  `/hero-components-lab`. **Resta dove è** (lab); la scheda `/game` è un
  componente nuovo che ne riusa il view-model.
- Click su pgCard = auto-assign (`onResidentSelect` → `handleResidentSelect` in
  `useQuestPoiSession`/`useQuestExpeditionSession`, `game-frame-pixi.tsx:572`).
  La pgCard è trusted (`pgcardKit`) — **non si modifica**: il wiring hover va
  nel container `rosterV2` (V2 è la copia non certificata, modificabile).
- Consumabili: `QUEST_STASH` (Zod, `bagSlots: 3`), `questItems.ts`
  (`engineFlag` bridge), `StashPicker` (lab), loadout inline in
  `QuestExpeditionDetail`, `ConsumableBelt` in `QuestRunWindow` (renderizza
  solo `waiting && !presenting`), popover «bag» nella title row.
- Villaggio dipinto ≈ (0.486, 0.554) di 4240×2828 → ~(2061, 1567) world
  (coordinate usate dall'evento invasione in `extraEvents`).
- Level-up: `level_up` cue già nel registry audio; `SlottedMedal` ring pronto;
  XP solo `village-xp` (settlement); `MissingHub` marca `levelUp` = missing;
  dominio in `PROGRESSION.md` (draft). `DamageFloater` esiste in
  `skins/primitives` per i floater numerici.
- Marker POI reali sulla mappa: pattern `MapQuestPoi`/`MapDemoPoi` ancorati via
  `anchors` di `PixiWorldMap`; uscita/entrata via `anchorGhosts` (R-127).

## Invarianti e trappole onorate

- **HUD idiom (obbligatorio):** `HudPlaque` unica cornice; token `--skin-*` /
  `--skin-hud-*` mai hex; testo ≥12px; `data-hud-controls` sul root che copre
  ogni superficie aperta (**T-03**); i18n `idleVillage` ns (`gameFrame.*`), en +
  it-IT; config Zod in `gameFrameConfig.ts` o moduli dedicati; ogni pannello
  fluttuante ha X + voce menù Pannelli + shortcut (`useHudPanels`, guida §5b).
- **Persistenza:** `PersistenceService` per ogni dato mock che sopravvive ai
  reload (inventario magazzino, livelli mock).
- **State management:** stato dominio condiviso (inventario mock, livello
  visualizzato) → Zustand o config+persistence; stato pannelli (hover, aperto,
  posizione) → Context/locale + `useHudPanels`.
- **T-01 (map fit):** tutti i nuovi pezzi sono **fluttuanti** — non toccano
  `safeFit.insets` (riservato ai fissi). Vietato introdurre elementi fissi.
- **T-02 (archi):** l'anello level-up non usa `strokeLinecap="round"` se può
  avere lunghezza 0.
- **T-04 (percettivo):** animazioni level-up/hover verificate a occhio in
  browser reale prima del «Completato».
- **T-05 (scope):** nessuna riscrittura di componenti con desiderata FROZEN;
  `PgDetailCard` non si tocca, `QuestRunWindow` solo estensione additiva.
- **T-07 (derivati):** badge/anello livello e strip consumabili leggono il
  view-model del proprietario (resident/run), mai una simulazione parallela.
- **Frozen kits:** `rosterKit` 1.1.0 e `pgcardKit` non si modificano — wiring
  in `rosterV2` e a livello pagina.
- **Telemetria:** `trackTelemetryEvent` su apertura scheda, apertura magazzino/
  mercante, acquisto mock, level-up mock (nomi `feature_action`).

## Non-goals (espliciti)

- Sistema inventario/economia reale (magazzino e mercante sono **schermate**:
  dati mock da config; l'economia è di `VILLAGE_ECONOMY.md`, draft).
- Progressione eroe reale (level system vero = `PROGRESSION.md`, draft).
- Modifica di `MarketEngine`, `StashPicker` lab, `ConsumableBelt` logica arm.
- Schermata villaggio completa (edifici multipli — progettata, fuori scope).

---

## SP-1 — Scheda personaggio (hover → HudPlaque)

**Esito:** passando il mouse su una pgCard del roster (senza trascinare), dopo
un hover-intent si apre `HeroSheetPanel`: pannello fluttuante `HudPlaque` con
la scheda completa del residente. Il click continua ad assegnare.

### Task

- **T-1 · View-model condiviso.** Estrarre la logica dati di `PgDetailCard`
  (raggruppamento `STAT_DESCRIPTORS`, equip via `useResidentHeroState`, vitals,
  status) in `src/ui/idleVillage/components/heroSheet/heroSheetViewModel.ts`
  puro + test unit. `PgDetailCard` può migrare dopo — non richiesto.
- **T-2 · `HeroSheetPanel`.** `HudPlaque shape="panel"`, drag via
  `useHudPanelDrag` sulla testata, `SkinScope`, controlli `data-hud-controls`,
  chiusura X + voce menù Pannelli + shortcut (`useHudPanels`, guida §5b).
  Sezioni: portrait + nome + archetipo; vitals (HP/fatica) con barre token;
  gruppi stat per categoria con icone e colori da token; equip + skill
  concesse; stato (ferito/in spedizione). Testo ≥12px, i18n `gameFrame.heroSheet.*`.
- **T-3 · Hover wiring in `rosterV2`.** Prop `onResidentHover(id|null)` su
  `DragTestContainerV2` (V2 — tocchibile): pointer enter/leave sul wrapper
  della card. Gate: niente hover-sheet mentre `draggingResidentId` è attivo o
  `dragVisualState.mode !== 'idle'`. Nessuna modifica a `PgCard`/`pgcardKit`.
- **T-4 · Hover state machine a livello pagina.** In `game-frame-pixi.tsx`:
  hover-intent `hoverIntentMs` da config → apre panel singleton che si
  *ri-targetta* a ogni nuovo hover; resta aperto finché il puntatore è sulla
  card o sul pannello; `graceMs` di tolleranza prima di chiudere. Config
  `gameFrameConfig.heroSheet` (Zod: `widthPx`, `hoverIntentMs` ~350,
  `graceMs` ~400, anchor default accanto al roster).
- **T-5 · Integrazione sistema pannelli + guard.** Id `heroSheet` in
  `HudPanelId`/`HUD_PANEL_SHORTCUTS`, chiavi i18n, file in `STRICT_FILES`
  (`hudGuards.test.ts`), telemetry `hero_sheet_open`.
- **T-6 · Verifica occhio + evidence.** Browser reale: hover apre, drag non
  apre, click assegna ancora, pannello trascinabile/riducibile, nessun hex,
  nessun testo <12px. Log `test-results/plan-032-sp1-<date>.log`.

**Aperto (default proposto):** la scheda chiude al mouse-out con grace
(comportamento hover-card standard). Alternativa pinnabile: click su pin la
fissa — rimandata a feedback Director dopo la prima visione.

## SP-2 — Magazzino del villaggio (schermata, mock)

**Esito:** un marker edificio sul villaggio dipinto apre `VillageStashPanel`:
la schermata del magazzino — scorta di consumabili della base, quantità,
capienza. Solo presentazione: dati da config, persistenza opzionale del
contenuto mock.

### Task

- **T-1 · Config `villageStashConfig.ts`** (Zod, `src/balancing/config/idleVillage/`):
  `capacity`, `items: [{ itemId (da questItems), qty }]` — riusa il vocabolario
  `questItems`/`QUEST_STASH` (stesso `engineFlag`, stesse `labelKey`/`descKey`)
  così magazzino, picker e belt parlano la stessa lingua. Seed mock credibile
  per il teaser (3-6 item, qty varie).
- **T-2 · `VillageStashPanel`** (`HudPlaque`): titolo, griglia consumabili
  (icona lucide via `getStatIconComponent`, nome, qty, tooltip effetto),
  riga capienza `used/capacity`, nota diegetica. Idioma HUD completo, i18n
  `gameFrame.stash.*`, `data-hud-controls`. Nessun bottone «usa»: il magazzino
  mostra la scorta, il pick avviene nel planner (già esistente).
- **T-3 · Marker edificio `MapBuildingPoi`.** Marker POI sulla mappa ancorato
  al villaggio dipinto (~2061,1567 world, da verificare a occhio sul quadro):
  icona edificio-magazzino nel linguaggio `MapDemoPoi`, click → apre il
  pannello. Entrata/uscita via pattern `anchorGhosts`. Posizione e tipo in
  config (`villageStashConfig.marker`), niente testo sul marker (guida §7).
- **T-4 · Integrazione pannelli + guard.** Voce menù Pannelli + shortcut;
  `STRICT_FILES`; telemetry `stash_open`.
- **T-5 · Verifica + evidence.** Marker visibile a zoom normale, click apre,
  pannello conforme (sampling bordo oro se serve), log evidence.

**Aperto (default proposto):** sorgente apertura = marker sul villaggio
(diegetico, «tra gli edifici»); la voce nel menù Pannelli resta comunque
obbligatoria per §5b. Alternativa: solo menù HUD, niente marker — da decidere
dopo prima visione.

## SP-3 — Mercante (schermata, mock)

**Esito:** un marker mercante sulla mappa (o toggle Director) apre
`MerchantPanel`: offerte con prezzo, scorte, countdown alla partenza. Solo
superficie — niente economia, niente `MarketEngine`.

### Task

- **T-1 · Config `merchantConfig.ts`** (Zod): `offers: [{ itemId, price,
  stock }]`, `daysLeft`, `goldOnHand` mock. Offerte riusano `questItems` (i
  consumabili comprabili coincidono col magazzino — coerenza di mondo).
- **T-2 · `MerchantPanel`** (`HudPlaque`): titolo + countdown («riparte tra N
  giorni», da config o clock di gioco via `questAvailability`-style),
  lista offerte (icona, nome, effetto, prezzo, stock), readout oro mock,
  bottone «Compra» **presentational**: click → stato `sold`/decrementa solo la
  vista mock in sessione (o aggiorna il mock persistito — da decidere,
  proposta: sessione, niente economia finta persistente). i18n `gameFrame.merchant.*`.
- **T-3 · Marker/ingresso.** `MapBuildingPoi` tipo mercante accanto al
  villaggio, **oppure** azione Director «Show merchant» per staging trailer
  (proposta: entrambi — Director toggle che mostra/nasconde il marker, come
  «Show quest»). In config `merchantConfig.marker`.
- **T-4 · Integrazione pannelli + guard + telemetry `merchant_open` /
  `merchant_buy_mock`.**
- **T-5 · Verifica + evidence.**

**Aperto (default proposto):** marker sempre presente vs gated dal Director —
per il trailer il toggle Director è più controllabile; in gioco vero il
mercante sarà un'offerta a tempo (pillar «Mercante con countdown»). Il countdown
v1 è da config statica, non agganciato al clock — valutare se legarlo al day
tick è quasi gratis.

## SP-4 — Consumabili visibili durante il viaggio (oltre alle scelte)

**Esito:** nella `QuestRunWindow` la sacca del party è **sempre leggibile**
durante la run — anche mentre i beat/transit scorrono — non solo ai nodi di
scelta. La `ConsumableBelt` interattiva resta com'è ai nodi decisione.

### Task

- **T-1 · `BagStrip` read-only.** Riga compatta (icone + stato armed + qty)
  che renderizza ogni volta che `run.flags` contiene item — durante
  `presenting`, transit e ended (consegna visiva di «cosa resta nella sacca»).
  Sotto la title row o sopra la time bar — posizione da config `questWindow`.
- **T-2 · Cinta interattiva invariata ai nodi decisione.** `ConsumableBelt`
  resta `waiting && !presenting`: niente cambio di semantica arm/healing —
  è la decisione sicura (armare durante un beat è permesso ma non necessario;
  la strip read-only copre il «durante il viaggio»).
- **T-3 · Config + i18n + STRICT_FILES** (`QuestRunWindow` già dentro).
- **T-4 · Verifica + evidence** (run avviata: strip visibile nei transit,
  belt ai nodi, coerenza armata).

**Aperto (default proposto):** strip read-only durante viaggio/beat. Se il
Director vuole *usare* consumabili in viaggio (es. curare durante il ritorno),
è un cambio di semantica motore — secondo giro, fuori da questo SP.

## SP-5 — Level-up eroe (presentazione mock)

**Esito:** per il teaser, il level-up **si vede**: badge livello sulla pgCard,
anello `SlottedMedal` che si accende, cue `level_up`, floater «Livello N».
Trigger da Director panel; livelli mock da config. Il sistema vero resta
`PROGRESSION.md` (draft).

### Task

- **T-1 · Config `heroLevelConfig.ts`** (Zod): mock `levels: {residentId|role →
  level}`, `xpToNext` finto, timing effetto (`ringMs`, `floaterMs`).
- **T-2 · Badge + anello livello sulla pgCard (via `rosterV2`, mai su
  `pgcardKit`).** Badge «Lv N» nel layer decorativo della card nel V2;
  accensione anello al level-up (attenzione T-02: cap arco a 0). Il livello
  arriva dal view-model del residente (T-07): `useHeroLevelView` che legge la
  config mock + eventi.
- **T-3 · Momento level-up.** Cue `level_up` (già in registry) + `DamageFloater`
  variant testo «Livello N» sopra la card + micro-flash anello. Trigger:
  azione Director «Level up» (per il trailer) + hook `useHeroLevelUp`
  predisposto per il wiring futuro al settlement (oggi no-op oltre il mock).
- **T-4 · Config + i18n + STRICT_FILES + telemetry `hero_levelup_mock`.**
- **T-5 · Verifica a occhio (T-04)** + evidence.

**Aperto (default proposto):** livello solo su hero (`isHero`) o su tutti i
residenti? Proposta: hero only nel teaser (è il protagonista della scena).

---

## Dipendenze e ordine

```
SP-1 ─┐
SP-2 ─┼─ indipendenti; SP-2/SP-3 condividono MapBuildingPoi (fare SP-2 prima,
SP-3 ─┤   SP-3 riusa il marker component)
SP-4 ─┼─ indipendente, piccolo
SP-5 ─┘─ indipendente
```

Ordine proposto (valore teaser): **SP-1 → SP-2 → SP-3 → SP-5 → SP-4**.
`MapBuildingPoi` nasce in SP-2 T-3 e si riusa in SP-3 T-3.

## Rischi

| Rischio | Mitigazione |
|---|---|
| Hover-sheet flicker durante sweep del mouse sul roster | `hoverIntentMs` + `graceMs` da config; gate su drag attivo |
| Marker sul villaggio copre pixel dipinti (Pillar 1) | Solo marker piccolo da config, entrata con fade; verifica occhio |
| Mock confusi col sistema vero | Prefisso `mock` in config + commento «S2 infrastructure» ereditato da `questStash.ts`; telemetria `_mock` |
| La strip consumabili sporca la finestra quest | Posizione da config, niente reflow dei beat; verifica in run reale |
| Badge livello su card trusted | Layer nel V2, mai dentro `pgcardKit` |

## Safeguard & chiusura (per ogni SP)

- `npm run lint -- <scope>` (120s), `npm run test -- <scope>` (300s),
  `npm run build:check` (180s), `npm run kanban:lint` (30s).
- `hudGuards.test.ts` verde con i nuovi file in `STRICT_FILES`.
- Smoke runtime: route `/game` 200, niente errori console.
- Verifica a occhio Director (T-04) su gesti e animazioni.
- Evidence log per SP; Kanban aggiornato; R-167 avanzata.
