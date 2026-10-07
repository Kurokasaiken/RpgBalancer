# Guida: creare componenti HUD ("Lacquer Atlas")

Per chi (persona, skill o agente) deve creare o modificare un componente che sta **sopra la mappa** di `/game`: pannelli, cartigli, controlli, marker. Leggila prima di scrivere codice. Vale insieme a `primitive_composition_rules.md` (primitive `Materic*`) e alla bibbia (`../plans/art_direction_plan.md`, v0.11, 383 righe: NON la copia da 89 righe in `src/docs/plans/`).

Stato al 2026-10-07: tutto il lavoro descritto qui è **non committato** e in parte provvisorio (vedi §10).

---

## 1. Regole che non si negoziano

Vengono dalla bibbia, dalle richieste esplicite del proprietario e dalle regole del progetto.

**Estetica**
1. Niente foglie, niente "oggettini", niente legno/corde/paglia usati alla lettera come UI. Il proprietario li ha bocciati due volte ("orridi").
2. Oro e bronzo **mai lucidi e puliti**: bronzo consumato (NMM), opaco.
3. Ombre mai grigie o marroni: **teal profondo** (`rgba(3,26,30,…)`). Niente marrone nei controlli.
4. Niente oro semitrasparente sopra la lacca: diventa kaki. I metalli sono colori **opachi**; l'alpha vale solo per ombre e bagliori.
5. Niente pannelli monumentali. La mappa è l'eroe: la HUD a riposo copre circa il 18% dello schermo, tetto duro 1/3.
6. Nessun flat design: ogni superficie ha luce, grana e peso (bibbia §8, §9).

**Layout**
7. I componenti **fissi** (ribbon in alto, nav in basso, coin) **non coprono la terra**. I **fluttuanti** (Roster, registro eventi, Director, dettaglio quest) possono coprirla, ma devono essere chiudibili o spostabili.
8. Nessuna sovrapposizione a 1440×900 e a 1280×800 (Steam Deck).
9. Testo minimo **12px**. Corpo 16px dove c'è spazio.

**Progetto**
10. Colori solo da token `--skin-*` / `--skin-hud-*`. Niente letterali colore nei componenti nuovi.
11. Ogni stringa visibile passa da `react-i18next` (namespace `idleVillage`, chiavi sotto `gameFrame.*`), in `en` **e** `it-IT`.
12. Numeri di layout e soglie in config con schema Zod (`gameFrameConfig.ts`), mai nei componenti.
13. Un nuovo tema è un **preset** in `skinConfigRegistry` + override in `skinCssVariables.ts`. Mai un `.css` standalone per un tema.
14. I kit certificati (Roster `rosterKit` 1.1.0) **non si modificano**: si copia in una versione V2 (vedi `rosterV2/`) e si certifica dopo.

---

## 2. Cosa esiste già (riusalo, non reinventare)

| Cosa | Dove | Note |
|---|---|---|
| Cornice unica | `src/ui/idleVillage/skins/primitives/HudPlaque.tsx` | `shape`: `hang` (appeso in alto), `plinth` (in piedi in basso), `panel` (rettangolo arrotondato) |
| Geometria | `src/ui/designSystem/primitives/geometry/cartouchePath.ts` | Funzione pura `cartouchePath(geom, w, h)`, testata |
| Token del materiale | `skinCssVariables.ts` → `BASE_SKIN_CSS_VARS` (`--skin-hud-*`) | Valori diversi per preset (`base` = obsidian, `lacquer_atlas` = teal) |
| Skin | `skinConfigRegistry.ts` (`base` predefinita, `lacquer_atlas`) | In dev: `?skin=base\|lacquer_atlas` o pulsante nel Director |
| Controlli a pillola | `skinScope.css`, attributo `data-hud-controls` | Bottoni, menu, icone, chip |
| Trascinamento | `components/gameFrame/useHudPanelDrag.ts` | `handleProps` sull'intera barra del titolo |
| Chiudi e riapri | `useHudPanels.ts`, `HudPanelsMenu.tsx` | Visibilità salvata, menù "Pannelli", tasti rapidi |
| Shell e slot | `components/gameFrame/GameFrame.tsx` | Slot: `whenWhereSlot`, `resourcesSlot`, `objectiveSlot`, `hangingSlot`, `rosterSlot`, `recenterSlot`… |
| Riga alta | `GameFrame.tsx` | Griglia a 3 colonne: obiettivo \| tempo \| risorse |
| Config | `src/balancing/config/idleVillage/gameFrameConfig.ts` | `identity`, `hud`, `questDetail`, `zLayers`, `breakpoints`, `edgeWash`, `debug`, `worldDressing` |
| Hook | `useHudMaterial`, `useCompactTop`, `resolveInitialSkinPresetId`, `resolveWorldManifestPath` | Interruttori dev e responsive |
| Pezzi pronti | `ObjectiveCartouche`, `HudRecenterButton`, `WhenWhereCluster` (con striscia velocità), `ResourceReadout`, `HudEventLedger`, `MapQuestPoi` | Prendili come esempi |
| Roster V2 | `src/ui/idleVillage/rosterV2/` | Copia del Roster certificato con materiale HUD |
| Geometria del tempo | `questAvailability.ts` | Scadenza di un'opportunità sul clock di gioco, funzione pura testata |

Il pannello **Director** (solo dev) usa anch'esso `HudPlaque`.

Gli unici **primitive Materic** compatibili con la HUD sono `WellBronzeBezel` (come costruzione del bordo, già riprodotta in `HudPlaque`) e `MatericGrain`. Sono **bocciati** per la HUD: `MatericFrame variant="molding"` (patina a macchie, oro lucido), `MatericSurface`/`MatericInset` in giada (fuori palette), l'usura fatta con `stroke-dasharray` (si legge come un righello).

---

### Bordo standard: lo stesso per **ogni** lastra

Ogni pezzo di HUD che ha una cornice usa `HudPlaque`, quindi ha lo **stesso bordo oro-bronzo** del Roster V1 (misurato sugli screenshot: oro caldo di tonalità circa 35-43°, luce `#9f854b` sul lato sinistro, ombra `#6d5433` in basso). Costruzione, dal basso: ombra teal, lacca, grana, riflesso interno, gradino scuro, **banda NMM da 2px** (cresta `#d8bd78` → `#71501f`), linea di contorno scura. Regole:

1. **Non fare bordi a mano** (`border`, `box-shadow` come cornice, filetti in alpha): niente "quasi uguale". Un pezzo con la cornice sottile semitrasparente (il vecchio `HudPanel`/`HudRibbon`) stona accanto agli altri.
2. **La linea di contorno e il gradino sono scuri neutri** (`--skin-hud-seat` `#0b0a08`, `--skin-hud-step` `rgba(3,3,3,.8)`), **mai blu-verdi**: un contorno teal tinge i pixel antialias della banda e l'oro vira all'oliva (misurato: tonalità 51° invece di 38°).
3. **Niente veli verdi sotto la banda** (il vecchio velo "verdigris" è stato tolto per lo stesso motivo).
4. **Spessore**: 2px per tutte. Per alleggerire lo si cambia per tutte insieme (`BAND_PX` in `HudPlaque.tsx`), non pezzo per pezzo.
5. **Il contenitore dentro la lastra non ha bordo, raggio, fondo né `overflow: hidden`.**
6. Sono pezzi **con eccezione dichiarata**: i controlli a pillola (`data-hud-controls`) hanno un filetto proprio, più sottile e dal token `--skin-surface-border`, perché sono controlli dentro una lastra, non lastre.

Per verificare che un pezzo nuovo abbia lo stesso oro: ingrandiscilo e campiona i pixel del bordo più luminosi (tonalità tra 35° e 45°, non oltre 50°).

---

## 3. Ricetta: un nuovo componente HUD

1. **Decidi la famiglia.** Fisso sul bordo → `hang`/`plinth`. Fluttuante → `panel`. Marker sulla mappa → vedi §7.
2. **Usa `HudPlaque`** come unica cornice. Non fare mai `clip-path` sul contenuto, né ombra sullo stesso nodo del clip.
3. **Padding per le spalle curve**: per `hang` lascia circa 20-22px sotto il contenuto, per `plinth` circa 20px sopra (le curve mordono i bordi).
4. **Mettilo in uno slot** di `GameFrame` (o aggiungine uno), non con `position: absolute` sparso.
5. **Testi**: `font-size >= 12px`, famiglia `var(--skin-font-display)` per etichette, `var(--skin-font-serif)` per frasi, `font-variant-numeric: tabular-nums` per i numeri.
6. **Stringhe** con `useTranslation('idleVillage')`; chiavi in `public/locales/en/idleVillage.json` e `it-IT`.
7. **Config**: dimensioni, soglie, interruttori in `gameFrameConfig.ts` (schema + default).
8. **Test**: logica pura in un file testabile (come `questAvailability.ts`) con test in `tests/unit/idleVillage/`.
9. **Verifica visiva** secondo §9.

Scheletro di un cartiglio appeso:

```tsx
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';

export function ExampleCartouche({ value }: { value: number }) {
  const { t } = useTranslation('idleVillage');
  return (
    <HudPlaque
      shape="hang"
      as="section"
      aria-label={t('gameFrame.example.label')}
      style={{ padding: '10px 34px 20px', pointerEvents: 'auto' }}
    >
      <span style={{ font: '600 12px var(--skin-font-display)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--skin-label-primary)' }}>
        {t('gameFrame.example.label')}
      </span>
      <span style={{ font: '600 20px var(--skin-font-serif)', color: 'var(--skin-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </HudPlaque>
  );
}
```

---

## 4. Token e skin

I token del materiale (tutti in `BASE_SKIN_CSS_VARS`, ridefiniti per preset):

`--skin-hud-lacquer-lift|base|deep`, `--skin-hud-lacquer-alpha`, `--skin-hud-seat`, `--skin-hud-step`, `--skin-hud-highlight` (+`-alpha`), `--skin-hud-grain-alpha`, `--skin-hud-shadow-filter`, `--skin-hud-brass-crest|hi|mid|low|base|foot`, `--skin-hud-parchment`, `--skin-hud-parchment-ink`.

Per il resto usa i token generali: `--skin-surface-base`, `--skin-surface-border`, `--skin-title-color`, `--skin-label-primary`, `--skin-text-primary`, `--skin-icon-color`, `--skin-icon-accent`, `--skin-font-display`, `--skin-font-serif`.

- Per sfumature derivate usa `color-mix(in srgb, var(--token) N%, …)`, non letterali.
- Nuovo token: aggiungilo a `BASE_SKIN_CSS_VARS` (così una skin che non lo ridefinisce non resta senza) e ridefiniscilo in `SKIN_CSS_VAR_OVERRIDES.<preset>` solo se cambia.
- Nuova skin: oggetto `SkinPresetConfig` in `skinConfigRegistry.ts` + override in `skinCssVariables.ts`. La predefinita è `DEFAULT_SKIN_PRESET_ID` (oggi `base`).
- Gli stili di ruolo (come `data-hud-controls`) vivono in `skinScope.css`, usando **solo** `var()`.

---

## 5. Controlli e interazioni

**Controlli (bottoni, menu, chip, icone)**: metti `data-hud-controls=""` sul contenitore e usa elementi nativi (`button`, `label > select`). Forme a pillola da 26px, testo 12px, colori da token, stato `aria-pressed="true"` evidenziato, focus visibile con doppio anello (seat + accento). I bottoni con solo un'icona SVG diventano tondi da soli. Non mettere stili inline di colore o bordo. Non usare `data-roster-controls="compact"`: è lo stile legacy marrone.

**Trascinamento** (vedi anche §5b): spargi `handleProps` di `useHudPanelDrag()` sull'**intera riga del titolo** (cursore `grab`, tooltip da `gameFrame.panel.dragHint`). I controlli nella riga non avviano il trascinamento; il doppio clic riporta il pannello al suo posto. Niente icone "maniglia".

**Focus e tastiera**: ogni elemento interattivo raggiungibile da tastiera, `aria-label` tradotto, `role="radiogroup"`/`radio` per scelte esclusive (vedi striscia di velocità).

**Stati**: pausa, in scadenza, scaduto, bloccato si leggono con colore **più** forma o testo (mai solo colore).

---

## 5b. Regole comuni a ogni pannello che sta sulla mappa

Valgono per **tutti** i pannelli fluttuanti (Roster, registro eventi, Director, dettaglio quest, e quelli futuri). Il Roster V2 le implementa tutte: copialo come riferimento.

1. **Testata**: titolo e contatore a **sinistra**, controlli a **destra** (`justify-between`). Ordine dei controlli: filtri e ordinamenti, poi collassa (occhio), poi chiudi (X) per ultimo. Tutti dentro un contenitore `data-hud-controls=""`.
2. **Collassato**: restano visibili solo il titolo e i controlli marcati `data-keep` (occhio e X). Il **bordo alto resta dov'è**: il pannello si accorcia dal basso, non scivola verso il fondo. Per un pannello ancorato in basso usa l'ancora del Roster (`RosterAnchor` in `GameFrame.tsx`, che tiene l'altezza da aperto e non cattura i clic nell'area vuota). Un pannello appeso dall'alto cresce già verso il basso.
3. **Trascinamento**: dall'**intera riga della testata**; i controlli nella riga non lo avviano; doppio clic = torna al suo posto. Niente icona "maniglia".
4. **Durante il trascinamento**: opacità piena, nessuna scala. Non rendere il pannello semitrasparente.
5. **Chiusura**: ogni pannello fluttuante ha la **X** *e* una voce nel menù **Pannelli** (bottone in basso a destra) con un **tasto rapido** (R = Roster, E = Eventi). Un pannello senza via di ritorno non si può chiudere. La visibilità è salvata da `useHudPanels` tramite `PersistenceService`.
6. **I pezzi fissi** (ribbon in alto, nav, coin) **non** si chiudono e non compaiono nel menù.

Aggiungere un pannello al sistema: aggiungi l'id a `HudPanelId` e a `HUD_PANEL_SHORTCUTS` (`useHudPanels.ts`), la chiave `gameFrame.panels.names.<id>` in `en` e `it-IT`, poi collega `panels.visible.<id>` e `panels.set(id, false)` in `GameFrameScreen` (`pages/game-frame.tsx`), passando `onClose` al pannello.

---

## 6. Layout

- **Griglia alta** (`GameFrame`): `minmax(0,1fr) auto minmax(0,1fr)`. Sotto `breakpoints.compactTopPx` (1400) `useCompactTop()` sposta trend e nome del luogo nei tooltip.
- **Livelli**: usa `config.zLayers` (`wash`, `floating`, `panels`, `chrome`, `dressing`). Niente numeri sparsi.
- **Fissi vs fluttuanti**: i soli margini di sicurezza della mappa (`worldDressing.safeFit.insets`) sono calcolati sui fissi. Se cambi l'altezza di un pezzo fisso, aggiorna gli insets (altezza + circa 8-23px) e **rimisura** (§9).
- **Ombra**: `filter: drop-shadow()` mai sullo stesso elemento di un `clip-path` o di un `overflow: hidden`. `HudPlaque` mette l'ombra sull'SVG fratello, quindi il contenitore non deve tagliare con `overflow`.
- **Dettaglio quest**: si apre nel corridoio tra Roster e registro (`config.questDetail`), mai sopra il Roster (è la sorgente del drag).

---

## 7. Mappa, POI, asset

- **Mappa ritoccata**: `scripts/bake-map-grade.py` produce `*.graded.webp` e `manifest-flat-graded.json`. `worldDressing.grade` sceglie; in dev `?map=original|graded`. Mai un filtro CSS a runtime sulla mappa.
- **Mare esteso**: `PixiWorldMap` specchia il livello del mare di lato e in verticale (`seaMarginPx`, `seaMarginYPx`). In verticale **solo** il livello `sea`: specchiare la terra riflette le isole. Gli specchi si sovrappongono di 6px e lo stage ha il colore del mare (`stageColor`), per evitare la riga scura.
- **Zoom**: lo zoom è già al minimo permesso dall'altezza del canvas; per dare spazio ai pezzi fissi serve **più mare**, non un inset più grande da solo.
- **Eventi di mondo (es. invasione goblin)**: si usa la sequenza della pagina World Surface, non un modale: `WorldSurfaceEventShroud` (le due tende di pergamena a tutto schermo, sotto la HUD) e `WorldSurfaceEventCard` (scheda in coordinate del mondo, che segue pan e zoom). Su `/game` la scheda vive nello strato `worldLayer` di `PixiWorldMap` (un div grande quanto il canvas, trasformato dalla camera; lascia passare i clic, quindi avvolgi i contenuti interattivi in un elemento con `pointer-events: auto`). Conferma = le tende si riaprono, l'adesivo cade sulla foresta e marcia verso il villaggio, e la minaccia entra nel registro eventi (il promemoria in alto a destra è spento con `showReminder={false}`, perché il registro porta già il conto alla rovescia).
- **POI**: usa `PoiMatericV3_5` (scelta del proprietario), 55px (`questPois.sizePx`). **Nessun testo visibile sul marker** (il nome sta solo nell'`aria-label`). L'alone della scadenza è un **liquido che si riempie in senso orario**: nessuna traccia/binario (compare solo con il liquido), parte vuoto, avanza in modo **continuo** (`LiquidHalo` in `MapQuestPoi.tsx`: estrapola tra un tick e l'altro, con un'ammorbidita, scrivendo direttamente sull'SVG a ogni frame; fermo in pausa), con una piccola goccia in testa. Mentre la quest è aperta il marker resta intero; il suo anello interno (a lettere, a scatti) segue l'orologio solo a quest in corso. Un nuovo POI e il cartiglio obiettivo **entrano con una transizione** (dissolvenza e crescita, 0,5-0,8 s), mai di colpo; alla scadenza il POI sfuma e viene rimosso. Il tempo è sempre il **clock di gioco** (ticks), non il tempo reale: si ferma in pausa, corre a ×2/×4. La scadenza passa da `questAvailability()`.
- **Asset generati**: fondo trasparente, luce unica in alto a sinistra, ombre teal, niente testo, niente legno/corde/foglie. Cartelle: `public/assets/ui/hud/`. Descrivi sempre l'uso (dimensione a schermo) nel prompt.

---

## 8. Config: dove stanno le cose

`gameFrameConfig.ts` (tutto con schema Zod):

`identity.showTitle` (off), `hud.material` (`lacquer`|`legacy`), `questDetail`, `questPois` (`sizePx`, `availableDays`), `zLayers`, `breakpoints`, `edgeWash` (spento: mancano `edge_wash_left.webp` e `edge_wash_bottom.webp` in `public/assets/ui/hud/`), `debug.directorPanel` (solo dev, F10), `worldDressing` (`grade`, `stageColor`, `motion`, `safeFit`…).

---

## 9. Come verificare

1. **Tipi**: `npx tsc --noEmit -p tsconfig.app.json` e filtra sui tuoi file. Il progetto ha errori di sintassi preesistenti in altri file (`GuardianDryRunAnalyzer.ts`, `idleVillageMapAssetTelemetry.ts`) che interrompono il resto.
2. **Test**: `npx vitest run tests/unit/idleVillage/hudGuards.test.ts` controlla da solo le regole verificabili da una macchina: ogni `--skin-hud-*` letto dai file HUD è definito, niente colori scritti a mano nei file nuovi (`HudPlaque`, cartiglio obiettivo, coin, menù Pannelli, `WhenWhereCluster`, `MapQuestPoi`, ruolo `data-hud-controls`), nessun testo sotto 12px. **Aggiungi i tuoi file alla lista `STRICT_FILES`** quando ne crei di nuovi. Poi `npx vitest run <file>` sui tuoi test. Ci sono fallimenti preesistenti non tuoi: due in `useSkinPreferences.test.ts`, `WLSTY011ActivityCapsuleDetail`, `poiDetailSkinWrapper`.
3. **Nel browser** (`preview_start` o il dev server su 5173): `/game` a **1440×900** e a **1280×800**. Confronta con `?hud=legacy`, `?skin=base`/`lacquer_atlas`, `?map=original`.
4. **Misura, non fidarti dell'occhio**: per la terra coperta usa la maschera (alpha di `base_flat` più i livelli isola con i loro `rect`), non solo `base_flat`. Per i colori campiona i pixel con PIL.
5. **Limiti dell'anteprima**: il riquadro spesso ha `visibilityState = hidden`, quindi `requestAnimationFrame` gira circa 1 volta al secondo e le animazioni non si vedono. Il clock di gioco usa un timer e funziona. Lo zoom dello strumento non ingrandisce davvero: per i dettagli ingrandisci l'elemento con `transform: scale()` oppure misura i pixel.
6. **Non** usare `git stash` in questo repo: contiene lavoro di altre sessioni non committato.

---

## 10. Errori già fatti (non ripeterli)

| Errore | Conseguenza | Regola |
|---|---|---|
| `clip-path` e `box-shadow`/`filter` sullo stesso nodo | Ombra cancellata, lastra "stampata" | Ombra su SVG fratello non ritagliato (`HudPlaque`) |
| `overflow: hidden` sulla radice di un pannello | Taglia l'ombra | Metti l'overflow su un contenitore interno |
| Oro con alpha sopra lacca teal | Kaki/oliva | Metalli opachi |
| Dedurre la terra coperta solo da `base_flat` | Isola coperta dalla nav | Includi i livelli isola |
| Spazio alla nav senza più mare | Lo zoom è già al minimo, la terra non si sposta | Estendi il mare |
| Specchi del mare appena affiancati | Riga scura di 1px | Overlap e `stageColor` |
| Token `--hud-*` senza definizione | Fallback letterali sparsi | Definisci in `BASE_SKIN_CSS_VARS` |
| Stringhe italiane nel codice o nella config | UI mista it/en | Chiavi i18n |
| Dichiarare "ereditato ovunque" senza guardare | Molti componenti hanno colori scritti dentro | Una skin cambia solo ciò che legge i token |
| Valutare un bordo ingrandito 2,4× | Differenze invisibili a 1× | Confronta sempre a dimensione reale |
| Linea di contorno o gradino blu-verdi sotto la banda oro | L'oro vira all'oliva (tonalità 51° invece di 38°) | Contorno e gradino neutri scuri |
| Contenitore con `border`, `rounded` o `overflow: hidden` dentro una `HudPlaque` | Il bordo grigio copre la banda oro e l'overflow taglia l'ombra: il Roster V2 sembrava "senza oro" | Dentro una lastra il contenitore non ha bordo, raggio, fondo né overflow: la cornice la disegna solo `HudPlaque` |
| Attribuire alla HUD un difetto dell'atmosfera | Ombre nuvole al 2-4% sono invisibili per config | Controlla prima la config generata |

---

## 11. Stato e cose provvisorie

- Tutto quanto sopra **non è committato**.
- `?hud=legacy` mantiene il vecchio percorso (`HudRibbon`, `HudPanel`) solo per il confronto. Astrolabio, bussola ritagliata, `EdgeDressing`, `SpeedControl`, `HudHangingTag` e `ResourceMedallion` sono stati eliminati.
- Roster V2 non è un kit certificato.
- Il dettaglio quest (`ActivityCapsuleDetailSkinAware`) ha la cornice HUD ma va rifatto compatto **dopo** il rework delle quest.
- Il livello `edgeWash` (pennellate sui bordi) è pronto ma manca l'immagine.
- Restano: ruoli in `skinScope.css` per il resto della HUD, font EB Garamond incorporati, movimento e prestazioni, regioni cliccabili.

---

## 12. Frase da dare a un agente

> Prima di creare o modificare un componente HUD di `/game` leggi `src/docs/docs/design/hud_component_guide.md`. Usa `HudPlaque`, i token `--skin-hud-*`, `data-hud-controls` e `useHudPanelDrag`. Niente letterali colore, niente testo sotto 12px, niente stringhe fisse, niente modifiche ai kit certificati. Verifica a 1440×900 e 1280×800 e riporta cosa hai misurato.
