# Guida: creare componenti HUD ("Lacquer Atlas")

Per chi (persona, skill o agente) deve creare o modificare un componente che sta **sopra la mappa** di `/game`: pannelli, cartigli, lastre, controlli, marker. Leggila prima di scrivere codice. Vale insieme a `primitive_composition_rules.md` (primitive `Materic*`) e alla bibbia (`../plans/art_direction_plan.md`: NON la copia ridotta in `src/docs/plans/`).

Aggiornata il 2026-10-13 (PLAN-058 Fase 0, R-177). Misure di partenza: `test-results/plan-058-2026-10-13-T0.1-roster-measure.md`.

---

## 1. La regola madre: il risultato deve sembrare il Roster

**Il Roster V2 (`src/ui/idleVillage/rosterV2/`, montato su `/game`, tasto R) è il riferimento di tutta la HUD.** Ogni lastra, pannello e controllo deve avere lo stesso bordo, la stessa lacca, gli stessi raggi, la stessa scala tipografica e la stessa densità del Roster. In caso di dubbio vince il Roster (Director, 2026-10-13: *"il Roster deve essere la base x gli altri componenti, le guide devono mirare a quello come risultato"*).

In pratica:

1. **Prova del confronto.** Apri `/game` a 1440×900, apri il Roster e mettici accanto il tuo componente. Se a colpo d'occhio sembrano due prodotti diversi (bordo più sottile, testo più grande, righe più ariose, colore diverso), il componente è sbagliato, non il Roster.
2. **Si copia dai token, non dai numeri.** Le misure del Roster sono token `--skin-hud-*` (§4). Un componente HUD legge quei token; non riscrive `12px`, `26px` o `rgba(…)` a mano.
3. **Si copiano le scelte, non i difetti.** Il Roster ha difetti noti (§4.5): non vanno replicati.
4. **Il Roster V1 certificato** (`rosterKit` 1.1.0, `MatericFrame`/`WellBronzeBezel`) resta byte-identico. Si lavora solo sul V2.

### Regole che non si negoziano

Vengono dalla bibbia, dalle richieste esplicite del Director e dalle regole del progetto.

**Estetica**
1. Niente foglie, niente "oggettini", niente legno/corde/paglia usati alla lettera come UI. Bocciati due volte ("orridi").
2. Oro e bronzo **mai lucidi e puliti**: bronzo consumato (NMM), opaco.
3. Ombre mai grigie o marroni: **teal profondo** (`rgba(3,26,30,…)`). Niente marrone nei controlli.
4. Niente oro semitrasparente sopra la lacca: diventa kaki. I metalli sono colori **opachi**; l'alpha vale solo per ombre, bagliori e filetti sottili già a token.
5. Niente pannelli monumentali. La mappa è l'eroe: la HUD a riposo copre circa il 18% dello schermo, tetto duro 1/3.
6. Nessun flat design: ogni superficie ha luce, grana e peso (bibbia §8, §9).
6b. **Fantasy, mai generico** (Director, 2026-10-13: *"il pallino davanti alla freccia è orribile, ci serve qualcosa di fantasy, non un coso generico così schifoso"*). Niente pallini, anelli, dischetti di stato, spunte e croci da UI kit, niente semaforo verde/rosso. Uno stato si dice con la **sagoma di un oggetto** (scintilla, occhio, clessidra, lucchetto di ferro, lame incrociate) tagliato nella materia del componente: ottone e inchiostro; il ferro è l'unico neutro, per ciò che è chiuso o rifiutato. Vale per cursori, badge, indicatori e icone: se è un cerchio con dentro un simbolo, rifallo.

**Layout**
7. I componenti **fissi** (ribbon in alto, nav in basso, coin) **non coprono la terra**. I **fluttuanti** (Roster, registro eventi, Director, dettaglio quest) possono coprirla, ma devono essere chiudibili o spostabili.
8. Nessuna sovrapposizione a 1440×900 e a 1280×800 (Steam Deck).
9. Se cambi l'altezza di una lastra fissa, aggiorna gli insets in `gameFrameConfig` e rimisura che i fissi non coprano la terra (trappola T-01, §6 e §9).

**Progetto**
10. Colori e misure solo da token `--skin-*` / `--skin-hud-*`. Niente letterali nei componenti nuovi.
11. Ogni stringa visibile passa da `react-i18next` (namespace `idleVillage`, chiavi sotto `gameFrame.*`), in `en` **e** `it-IT`.
12. Numeri di layout e soglie di gioco in config con schema Zod (`gameFrameConfig.ts`), mai nei componenti.
13. Un nuovo tema è un **preset** in `skinConfigRegistry` + override in `skinCssVariables.ts`. Mai un `.css` standalone per un tema.
14. I kit certificati (Roster `rosterKit` 1.1.0) **non si modificano**: si copia in una versione V2 (vedi `rosterV2/`) e si certifica dopo.

---

## 2. Cosa esiste già (riusalo, non reinventare)

| Cosa | Dove | Note |
|---|---|---|
| **Riferimento visivo** | `src/ui/idleVillage/rosterV2/` (`DragTestContainerV2`, `WanderlustRosterCardV2`) | Il Roster V2: lastra `panel`, testata, righe compatte |
| Cornice unica | `src/ui/idleVillage/skins/primitives/HudPlaque.tsx` | `shape`: `hang` (appeso in alto), `plinth` (in piedi in basso), `panel` (rettangolo arrotondato, quello del Roster) |
| Spessore della banda | `src/ui/idleVillage/skins/primitives/hudBand.ts` | `DEFAULT_HUD_BAND_PX` (3,5 px), uno per tutte le lastre; slider nel pannello Tuning (T) |
| Geometria | `src/ui/designSystem/primitives/geometry/cartouchePath.ts` | Funzione pura `cartouchePath(geom, w, h)`, testata |
| Token | `skinCssVariables.ts` → `BASE_SKIN_CSS_VARS` (`--skin-hud-*`) | Materiale + misure del Roster (§4) |
| Skin | `skinConfigRegistry.ts` (`base` predefinita, `lacquer_atlas`) | In dev: `?skin=base\|lacquer_atlas` o pulsante nel Director |
| Controlli a pillola | `skinScope.css`, attributo `data-hud-controls` | Bottoni, menu, icone, chip: già sui token del Roster |
| Trascinamento | `components/gameFrame/useHudPanelDrag.ts` | `handleProps` sull'intera barra del titolo |
| Chiudi e riapri | `useHudPanels.ts`, `hudPanelRegistry.ts`, `HudPanelsMenu.tsx` | Menù "Pannelli", tasti rapidi |
| Shell e slot | `components/gameFrame/GameFrame.tsx` | Slot: `whenWhereSlot`, `resourcesSlot`, `objectiveSlot`, `hangingSlot`, `rosterSlot`, `recenterSlot`… |
| Riga alta | `GameFrame.tsx` | Griglia a 3 colonne: obiettivo \| tempo \| risorse |
| Config | `src/balancing/config/idleVillage/gameFrameConfig.ts` | `identity`, `hud`, `questDetail`, `zLayers`, `breakpoints`, `edgeWash`, `debug`, `worldDressing` |
| Hook | `useHudMaterial`, `useCompactTop`, `resolveInitialSkinPresetId`, `resolveWorldManifestPath` | Interruttori dev e responsive |
| Pezzi pronti | `ObjectiveCartouche`, `HudRecenterButton`, `WhenWhereCluster`, `ResourceReadout`, `HudEventLedger`, `MapQuestPoi` | Da allineare al Roster in PLAN-058 Fase 1 |
| Geometria del tempo | `questAvailability.ts` | Scadenza di un'opportunità sul clock di gioco, funzione pura testata |

Il pannello **Director** (solo dev) usa anch'esso `HudPlaque`.

Gli unici **primitive Materic** compatibili con la HUD sono `WellBronzeBezel` (come costruzione del bordo, già riprodotta in `HudPlaque`) e `MatericGrain`. Sono **bocciati** per la HUD: `MatericFrame variant="molding"` (patina a macchie, oro lucido), `MatericSurface`/`MatericInset` in giada (fuori palette), l'usura fatta con `stroke-dasharray` (si legge come un righello).

### Bordo standard: lo stesso per **ogni** lastra

Ogni pezzo di HUD che ha una cornice usa `HudPlaque`, quindi ha lo **stesso bordo** del Roster. Costruzione, dal basso (misurata sul Roster, T0.1): ombra teal (`--skin-hud-shadow-filter`), lacca a tre stop (`--skin-hud-lacquer-*`), grana al 6%, riflesso interno (banda + 3 px), gradino scuro (banda + 1 px), **banda NMM da 3,5 px** (cresta `#d8bd78` → piede `#71501f`, con maschera d'usura), linea di contorno scura da 1,25 px. Raggio della lastra `panel`: 18 px. Regole:

1. **Non fare bordi a mano** (`border`, `box-shadow` come cornice, filetti in alpha): niente "quasi uguale". Un pezzo con la cornice sottile semitrasparente (il vecchio `HudPanel`/`HudRibbon`) stona accanto al Roster.
2. **La linea di contorno e il gradino sono scuri neutri** (`--skin-hud-seat` `#0b0a08`, `--skin-hud-step` `rgba(3,3,3,.8)`), **mai blu-verdi**: un contorno teal tinge i pixel antialias della banda e l'oro vira all'oliva (misurato: tonalità 51° invece di 38°).
3. **Niente veli verdi sotto la banda** (il vecchio velo "verdigris" è stato tolto per lo stesso motivo).
4. **Spessore**: uguale per tutte. Per cambiarlo si cambia `DEFAULT_HUD_BAND_PX` in `hudBand.ts`, mai lastra per lastra.
5. **Il contenitore dentro la lastra non ha bordo, raggio, fondo né `overflow: hidden`.**
6. **Eccezioni dichiarate**: i controlli a pillola (`data-hud-controls`) e le righe di una lista hanno un filetto proprio, più sottile e a token (`--skin-surface-border`, `--skin-hud-row-filet`), perché sono oggetti dentro una lastra, non lastre.

Per verificare che un pezzo nuovo abbia lo stesso oro: ingrandiscilo e campiona i pixel del bordo più luminosi (tonalità tra 35° e 45°, non oltre 50°).

---

## 3. Ricetta: un nuovo componente HUD

1. **Guarda il Roster** e decidi quale sua parte stai rifacendo: lastra (`panel`), testata, riga, controllo, etichetta.
2. **Decidi la famiglia.** Fisso sul bordo → `hang`/`plinth`. Fluttuante → `panel`. Marker sulla mappa → vedi §7.
3. **Usa `HudPlaque`** come unica cornice. Non fare mai `clip-path` sul contenuto, né ombra sullo stesso nodo del clip.
4. **Spaziature dai token**: dal bordo della lastra al contenuto `--skin-hud-plaque-clearance` + `--skin-hud-panel-padding` (22 px in tutto, come il Roster). Per `hang` e `plinth` le spalle curve mordono di più: circa 20-22 px sotto il contenuto per `hang`, circa 20 px sopra per `plinth`.
5. **Mettilo in uno slot** di `GameFrame` (o aggiungine uno), non con `position: absolute` sparso.
6. **Testi**: solo la scala di §4.3, `font-variant-numeric: tabular-nums` per i numeri.
7. **Stringhe** con `useTranslation('idleVillage')`; chiavi in `public/locales/en/idleVillage.json` e `it-IT`.
8. **Config**: dimensioni di gioco, soglie, interruttori in `gameFrameConfig.ts` (schema + default).
9. **Test**: logica pura in un file testabile (come `questAvailability.ts`) con test in `tests/unit/idleVillage/`; aggiungi il file a `STRICT_FILES` in `hudGuards.test.ts`.
10. **Verifica visiva** secondo §9, con il Roster aperto accanto.

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
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 'var(--skin-hud-inline-gap)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--skin-font-display)',
            fontSize: 'var(--skin-hud-caps-size)',
            fontWeight: 'var(--skin-hud-caps-weight)',
            letterSpacing: 'var(--skin-hud-caps-tracking)',
            textTransform: 'uppercase',
            color: 'var(--skin-label-primary)',
          }}
        >
          {t('gameFrame.example.label')}
        </span>
        <span
          style={{
            fontFamily: 'var(--skin-font-display)',
            fontSize: 'var(--skin-hud-name-size)',
            fontWeight: 'var(--skin-hud-name-weight)',
            color: 'var(--skin-text-primary)',
            textShadow: 'var(--skin-hud-engrave)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </span>
    </HudPlaque>
  );
}
```

---

## 4. Token, tipografia e densità del Roster

Tutti i token stanno in `BASE_SKIN_CSS_VARS` (`skinCssVariables.ts`), così una skin che non li ridefinisce non resta senza. Il guardiano `hudGuards.test.ts` fallisce se un file HUD legge un `--skin-hud-*` non definito, e se il Roster V2 o `data-hud-controls` smettono di leggere un token di misura.

### 4.1 Materiale della lastra (letti da `HudPlaque`)

| Token | `base` | `lacquer_atlas` | Ruolo |
|---|---|---|---|
| `--skin-hud-lacquer-lift` / `-base` / `-deep` | `#0f2a35` / `#09202a` / `#060f16` | `#24484b` / `#173436` / `#0f2627` | Lacca, dall'alto in basso |
| `--skin-hud-lacquer-alpha` | `0.9` | `0.94` | Opacità della lacca |
| `--skin-hud-seat` | `#0b0a08` | = | Linea di contorno |
| `--skin-hud-step` | `rgba(3,3,3,0.8)` | = | Gradino sotto la banda |
| `--skin-hud-highlight` (+ `-alpha`) | `#fff0cd` · `0.12` | = | Riflesso interno |
| `--skin-hud-grain-alpha` | `0.06` | = | Grana |
| `--skin-hud-shadow-filter` | due `drop-shadow` teal | = | Ombra della lastra |
| `--skin-hud-brass-crest\|hi\|mid\|low\|base\|foot` | `#d8bd78` … `#71501f` | = | Banda NMM |
| `--skin-hud-parchment` / `-ink` | `#e8d6ae` / `#3a2a18` | = | Cartiglio obiettivo |

### 4.2 Misure del Roster (PLAN-058 T0.2: il Roster le legge da qui)

Uguali in ogni skin. Fonte: misura T0.1.

| Token | Valore | Dove si vede nel Roster |
|---|---|---|
| `--skin-hud-plaque-clearance` | `12px` | Dal bordo della lastra al contenuto |
| `--skin-hud-panel-padding` | `10px` | Padding interno (22 px in tutto dal bordo) |
| `--skin-hud-stack-gap` | `8px` | Testata ↔ lista; titolo ↔ contatore ↔ controlli |
| `--skin-hud-control-gap` | `4px` | Tra un controllo e l'altro |
| `--skin-hud-control-height` | `26px` | Pillole e testata; lato del bottone solo-icona |
| `--skin-hud-control-icon-size` | `14px` | Icona dentro un controllo |
| `--skin-hud-inline-gap` | `6px` | Valore attaccato: nome ↔ stato, icona ↔ etichetta |
| `--skin-hud-row-gap` | `4px` | Tra una riga e l'altra (passo 44 px con righe da 40) |
| `--skin-hud-row-padding` | `4px 8px` | Dentro la riga |
| `--skin-hud-row-column-gap` | `8px` | Colonne della riga (ritratto · nome · barre) |
| `--skin-hud-row-radius` | `8px` | Raggio della riga |
| `--skin-hud-row-filet` / `--skin-hud-row-filet-hover` | `rgba(223,184,87,0.16)` / `rgba(223,184,87,0.42)` | Filetto della riga; al passaggio = "si può prendere" |
| `--skin-hud-bar-gap` | `3px` | Tra due barre impilate |
| `--skin-hud-title-size` / `-weight` / `-tracking` | `12px` / `600` / `0.2em` | Titolo del pannello |
| `--skin-hud-name-size` / `-weight` / `-tracking` | `13px` / `700` / `0.02em` | Voce di riga (nome) e valore principale |
| `--skin-hud-caps-size` / `-weight` / `-tracking` | `12px` / `600` / `0.06em` | Etichette maiuscole: stati, controlli, didascalie |
| `--skin-hud-engrave` | `0 1px 1px rgba(0,0,0,0.5)` | Incisione del testo chiaro su lacca |

Restano numeri nel codice, non token CSS (sono geometria letta da JavaScript): raggio della lastra 18 px (`HudPlaque.tsx`, `SHAPES.panel`), banda 3,5 px (`hudBand.ts`), ritratto di riga 22 px (prop `size` di `WanderlustPortrait`), barre `xs` alte 4 px (`WanderlustStatBar`, primitivo condiviso con il V1).

### 4.3 Scala tipografica

| Ruolo | Famiglia | Token | Maiuscolo | Colore |
|---|---|---|---|---|
| Titolo di pannello ("Roster") | Cinzel (`--skin-font-display`) | `--skin-hud-title-*` | no: il maiuscoletto lo fa Cinzel da solo | `--skin-title-color` |
| Voce di riga, valore principale | Cinzel | `--skin-hud-name-*` + `--skin-hud-engrave` | no | `--skin-text-primary` |
| Etichetta breve (stato, controllo, didascalia sotto un valore) | Cinzel nei controlli; `--skin-font-sans` per le etichette di stato nelle righe | `--skin-hud-caps-*` | sì (`uppercase`) | `--skin-label-primary`; stato = tono dello stato |
| Frase (descrizione, voce del registro, tooltip lungo, esito) | EB Garamond (`--skin-font-serif`) | dimensione ≥ 12 px, corpo 15-16 px dove c'è spazio | **mai** | `--skin-body-color` |
| Contatori e numeri secondari ("4/4") | come il testo a cui stanno accanto | — | — | `--skin-body-color` |

Regole:

1. **Maiuscoletto Cinzel solo per etichette di 3 parole al massimo.** Una frase in Cinzel o in maiuscolo si legge male: va in EB Garamond, minuscolo.
2. **Minimo 12 px per qualunque testo**, valori delle barre compresi (il guardiano controlla `fontSize`, `font-size` e `text-[Npx]`).
3. **Numeri allineati**: `font-variant-numeric: tabular-nums`.
4. **Colori del testo** solo dai ruoli: `--skin-title-color` (titoli), `--skin-text-primary` (voci), `--skin-body-color` (frasi, numeri), `--skin-label-primary` (etichette, controlli), `--skin-text-secondary` (secondario). Valori per skin in `test-results/plan-058-2026-10-13-T0.1-roster-measure.md`.

### 4.4 Densità e valori

1. **Icona attaccata al valore**: icona, numero ed etichetta formano un gruppo unico con gap 6-8 px (`--skin-hud-inline-gap` … `--skin-hud-stack-gap`). Mai icona a un capo della lastra e numero all'altro.
2. **Il normale non parla, l'eccezione sì.** Nel Roster l'etichetta di stato compare solo se il residente non è attivo. Allo stesso modo **il numero pieno ("100/100") si mostra solo se il valore non è al massimo**: a pieno basta la barra piena; il valore resta nel `title`/`aria-label`.
3. **Righe come il Roster**: alte circa 40 px, passo 44 px, padding `--skin-hud-row-padding`, filetto `--skin-hud-row-filet`, nessuna sotto-scatola dentro la riga.
4. **Testata alta come un controllo** (`--skin-hud-control-height`): titolo a sinistra, controlli a destra (§5b).
5. **Barre etichettate**: una barra senza etichetta visibile dice cosa misura nel `title`/`aria-label` (il Roster usa `title` sulla riga della barra).

### 4.5 Difetti del Roster da non copiare

Il Roster è il riferimento di stile, ma oggi ha questi difetti (misurati in T0.1, si correggono in PLAN-058 T1.6):

- valori delle barre a 9 px e "100/100" visibile anche a pieno (viola §4.3 regola 2 e §4.4 regola 2);
- menu filtro troncato ("A…") e pulsante di direzione schiacciato a 12 px di larghezza quando la testata non ci sta;
- le icone dentro i menu a tendina della testata (imbuto, elenco) sono 12 px (`h-3 w-3`), quelle dei bottoni 14 px (`--skin-hud-control-icon-size`): il ruolo `data-hud-controls` regola solo `button svg`;
- `--skin-event-danger` / `--skin-event-warning` non definiti: gli stati ferito/esausto usano letterali di riserva;
- il contatore chiede `--skin-title-color` con una classe che Tailwind v4 non applica e resta in `--skin-body-color`.

### 4.6 Aggiungere o cambiare un token

- Per sfumature derivate usa `color-mix(in srgb, var(--token) N%, …)`, non letterali.
- Nuovo token: aggiungilo a `BASE_SKIN_CSS_VARS` e ridefiniscilo in `SKIN_CSS_VAR_OVERRIDES.<preset>` solo se cambia.
- Nelle classi Tailwind v4 un token si legge con `p-(--skin-hud-panel-padding)`, `gap-(--skin-hud-stack-gap)`, `space-y-(--skin-hud-row-gap)`. Per colori e dimensioni del testo usa lo `style` (`text-[var(…)]` è ambiguo in v4 e può non applicarsi).
- Nuova skin: oggetto `SkinPresetConfig` in `skinConfigRegistry.ts` + override in `skinCssVariables.ts`. La predefinita è `DEFAULT_SKIN_PRESET_ID` (oggi `base`).
- Gli stili di ruolo (come `data-hud-controls`) vivono in `skinScope.css`, usando **solo** `var()`.

---

## 5. Controlli e interazioni

**Controlli (bottoni, menu, chip, icone)**: metti `data-hud-controls=""` sul contenitore e usa elementi nativi (`button`, `label > select`). Sono le pillole della testata del Roster: alte `--skin-hud-control-height` (26 px), testo `--skin-hud-caps-*` in Cinzel maiuscolo, colori da token, stato `aria-pressed="true"` evidenziato, focus visibile con doppio anello (seat + accento). I bottoni con solo un'icona SVG diventano tondi da soli (26 × 26, icona `--skin-hud-control-icon-size`). Non mettere stili inline di colore o bordo. Non usare `data-roster-controls="compact"`: è lo stile legacy marrone.

> **Trappola icona+testo**: la regola CSS che rende tondo da 26px un pill-icona è `:has(> svg:only-child)` — e `:only-child` conta solo i nodi **elemento**, non i nodi testo. Un bottone `<button><Icon/>Testo</button>` (testo nudo) viene trattato come icon-only e schiacciato a 26px, col testo che straborda sul vicino. **Se un bottone ha icona + etichetta, avvolgi sempre l'etichetta in un `<span>`** (o qualsiasi elemento). Vedi `ContextStrip`/`StashPicker` del lab quest (PLAN-024).

> **Trappola menu a tendina (T-03)**: anche le voci dentro la lastra aperta da un menu sono controlli. Il `data-hud-controls` deve stare sul **contenitore che racchiude sia il grilletto sia il dropdown** (pattern `HudPanelsMenu`: attributo sul root del componente). Se copre solo il bottone che apre, le voci del menu restano fuori scope e prendono il bottone bronze-CTA di default — barre d'oro piene al posto delle pill da 26px. È il bug di `HudGameMenu` corretto in R-138. Vale per ogni portal o popover: lo scope va sul root del componente.

> **Testata che non ci sta**: se i controlli non entrano nella testata, il flex li schiaccia (il Roster oggi stringe il pulsante di direzione a 12 px). Riduci le etichette o sposta i controlli secondari in un menu; un controllo non scende mai sotto 26 × 26.

**Trascinamento** (vedi anche §5b): spargi `handleProps` di `useHudPanelDrag()` sull'**intera riga del titolo** (cursore `grab`, tooltip da `gameFrame.panel.dragHint`). I controlli nella riga non avviano il trascinamento; il doppio clic riporta il pannello al suo posto. Niente icone "maniglia".

**Focus e tastiera**: ogni elemento interattivo raggiungibile da tastiera, `aria-label` tradotto, `role="radiogroup"`/`radio` per scelte esclusive (vedi striscia di velocità).

**Stati**: pausa, in scadenza, scaduto, bloccato si leggono con colore **più** forma o testo (mai solo colore). Un elemento bloccato resta leggibile (velato), non grigio illeggibile.

---

## 5b. Regole comuni a ogni pannello che sta sulla mappa

Valgono per **tutti** i pannelli fluttuanti (Roster, registro eventi, Director, dettaglio quest, e quelli futuri). Il Roster V2 le implementa tutte: copialo come riferimento.

1. **Testata**: titolo e contatore a **sinistra**, controlli a **destra** (`justify-between`). Ordine dei controlli: filtri e ordinamenti, poi collassa (occhio), poi chiudi (X) per ultimo. Tutti dentro un contenitore `data-hud-controls=""`.
2. **Collassato**: restano visibili solo il titolo e i controlli marcati `data-keep` (occhio e X). Il **bordo alto resta dov'è**: il pannello si accorcia dal basso, non scivola verso il fondo. Per un pannello ancorato in basso usa l'ancora del Roster (`RosterAnchor` in `GameFrame.tsx`, che tiene l'altezza da aperto e non cattura i clic nell'area vuota). Un pannello appeso dall'alto cresce già verso il basso.
3. **Trascinamento**: dall'**intera riga della testata**; i controlli nella riga non lo avviano; doppio clic = torna al suo posto. Niente icona "maniglia".
4. **Durante il trascinamento**: opacità piena, nessuna scala. Non rendere il pannello semitrasparente.
5. **Chiusura**: ogni pannello fluttuante ha la **X** *e* una voce nel menù **Pannelli** (bottone in basso a destra) con un **tasto rapido** (R = Roster, E = Eventi). Un pannello senza via di ritorno non si può chiudere. La visibilità **non** è salvata (PLAN-031): all'apertura della mappa tutti i pannelli partono chiusi.
6. **I pezzi fissi** (ribbon in alto, nav, coin) **non** si chiudono e non compaiono nel menù.
7. **La mappa non si muove mai per un pannello** (Director, 2026-10-14). Ogni pannello che il giocatore può spostare o chiudere (Roster, Eventi, dettaglio quest, Director, Tuning, ...) può coprire la terra: aprirlo o chiuderlo non cambia zoom né posizione della mappa. Solo i pezzi fissi riservano spazio (insets alto/basso di `worldDressing.safeFit`). Nel codice `safeFit` della pagina è `baseSafeFit`: non rimettere insets laterali legati ai pannelli. Prova: apri e chiudi R ed E e misura la traslazione della mappa (deve essere 0).
7. **Tooltip e preview a comparsa (hover/focus):** ogni pannello aperto dal passaggio del mouse o dal focus **resta aperto mentre il puntatore è sopra il pannello stesso** — mai `pointer-events-none` sul contenuto, e la chiusura al `pointerleave` del trigger è **ritardata (~140 ms)** così il mouse può attraversare lo spazio tra trigger e pannello senza perderlo. In alto a destra, dentro `data-hud-controls`, il pannello mostra sempre due controlli: **pin** (📌 lo fissa aperto finché non viene sbloccato o chiuso — mentre è pinnato gli hover degli altri trigger non lo sostituiscono) e **X** (chiusura immediata, vale sempre). La forma deve stare addosso al contenuto: il pannello si dimensiona per mostrare tutto quello che deve leggere, con scroll interno solo come ripiego su viewport corti — e quello scroll dev'essere raggiungibile col mouse. Riferimenti canonici: `XRayPopover` in `questS1Lab/hud/ActionZone.tsx` (preview analitica delle opzioni) e `SchedaPergamena` (scheda PG su hover delle `PgCard`). Vale per ogni hover-card presente e futura: tooltip worker, schede locazione, dettagli PG.

Aggiungere un pannello al sistema: una riga in `components/gameFrame/hudPanelRegistry.ts` (id, tasto, visibilità iniziale) e la chiave `gameFrame.panels.names.<id>` in `en` e `it-IT` (un test di guardia fallisce se manca), poi collega `panels.visible.<id>` e `panels.set(id, false)` in `GameFrameScreen` (`pages/game-frame.tsx`), passando `onClose` al pannello.

### 5c. Cursori di `/game` (PLAN-058 T5.1–T5.2)

**Il puntatore è un guanto d'arme, non una freccia** (Director, 2026-10-13: *"usiamo la freccia e non qualcosa di più carino e fantasy? tipo un guanto d'arme?"*): l'indice teso e inclinato di circa 30° verso l'alto a sinistra, come una freccia normale, bracciale svasato con fascia, giunture a lame sul dito. Anche le mani sono guanti. Dieci cursori ottone-e-inchiostro, disegnati da `scripts/draw-cursors.py` (32/48/64 px + `public/assets/ui/cursors/game-cursors.json` con gli hotspot) e mappati in `components/gameFrame/gameFrameCursors.css`.

| Stato | Cursore | Emblema (sagoma, non colore) |
|---|---|---|
| riposo | guanto che indica | — |
| interagisci | guanto che indica, dorato | scintilla a quattro punte |
| ispeziona | guanto che indica | occhio |
| attesa | guanto che indica | clessidra |
| disabilitato | guanto di ferro che indica | lucchetto di ferro |
| afferrabile | guanto aperto | — |
| trascina | pugno corazzato | — |
| rilascio sì | guanto aperto | scintilla |
| rilascio no | guanto aperto | lame di ferro incrociate |
| sposta mappa | pugno corazzato | quattro punte di bussola |

- **Regola 6b vale qui per prima:** nessuna freccia da UI kit, nessun pallino o anello sulla punta, nessun dischetto verde/rosso. Il cursore non cambia colore mentre trascini: cambia la forma. Un nuovo stato = un nuovo emblema in `EMBLEMS` dello script, mai un disco con un simbolo dentro.
- **Precedenza** (l'ordine dei blocchi nel CSS): riposo < interagisci < afferra < ispeziona < disabilitato < attesa < sposta mappa < trascina < rilascio sì < rilascio no. Il drag batte l'hover; il rifiutato batte l'accettato.
- **Hook:** `data-cursor="interact | grab | inspect | wait | disabled"` per codice nuovo; il CSS riconosce anche i `cursor` inline già presenti. Il drag è il flag `html[data-game-drag]` di `GameFrameDragCursor` (dentro il `DndContext` di `/game`); il rilascio sì/no legge `data-drop-state="valid | invalid"` che slot e POI ricavano dallo stesso drag.
- **Hotspot:** puntatore sulla punta del dito teso (3, 3); mani al centro del palmo. Il test `gameFrameCursors.test.ts` li confronta col manifest e controlla che il pixel sotto l'hotspot non sia trasparente.
- **Da provare a mano:** la build Tauri su Mac Retina (bug WebKit sui cursori `image-set` @2x, T5.3).

---

## 6. Layout e interazione (PLAN-058 T0.4)

Grammatica comune a ogni lastra e pannello di `/game`. Ogni valore ha la sua fonte: **[Roster]** = misurato sul Roster V2 (T0.1, §4.2), **[codice]** = già in config o CSS, **[deciso]** = scelto qui in assenza di un riferimento. Un valore [deciso] diventa token o config quando il primo task di Fase 1 lo usa, non prima.

### 6.1 Allineamento

| Cosa | Regola | Fonte |
|---|---|---|
| Testo (nomi, frasi, etichette) | a **sinistra** | [Roster] nomi e testata |
| Numeri in colonna (barre, contatori in lista) | a **destra**, `tabular-nums` | [Roster] valori barra |
| Valore singolo in una lastra (giorno, una risorsa) | gruppo icona+numero+etichetta allineato a sinistra **dentro** il gruppo; il gruppo può stare centrato nella sua cella | [deciso] |
| Centrato | solo titoli di 1-3 parole su lastre senza testata (cartiglio, schermate) e valori singoli in un medaglione | [deciso] |
| Icona ↔ testo sulla stessa riga | centro verticale del box (`align-items: center`); se il testo è su due righe, icona allineata alla **prima** riga | [Roster] riga |
| Numero ↔ etichetta sotto | stesso bordo sinistro, mai etichetta centrata sotto un numero allineato a sinistra | [deciso] |
| Testata | titolo e contatore a sinistra, controlli a destra (§5b.1) | [Roster] |

### 6.2 Spaziatura

- **Griglia a 2 px, passi preferiti 4 · 8 · 12 · 16.** Il Roster usa 3, 6 e 10 px in alcuni punti (barre, gruppi, padding): restano come token di misura (§4.2), ma i valori **nuovi** stanno sui multipli di 4. [Roster] + [deciso]
- **Dentro una lastra:** `--skin-hud-plaque-clearance` 12 px + `--skin-hud-panel-padding` 10 px dal bordo al contenuto; gruppi separati da `--skin-hud-stack-gap` 8 px; elementi di un gruppo da `--skin-hud-inline-gap` 6 px. [Roster]
- **Dal bordo dello schermo:** `insets.edgeInsetPx` 18 px. [codice]
- **Tra due lastre affiancate:** almeno 8 px; tra una lastra fissa e un pannello fluttuante almeno 12 px. [deciso]
- **Una lastra è larga quanto il suo contenuto più il padding.** Niente spazio vuoto dentro per "riempire" una colonna della griglia: la cella si centra, la lastra no. [deciso; causa: lastra risorse da 440 px per tre numeri]

### 6.3 Testo

- **Scala chiusa:** 12 · 13 · 14 · 16 · 20 · 24 px. Niente altre dimensioni nell'HUD. 12 = etichette, controlli, titoli pannello; 13 = voce di riga e valore in lista; 14-16 = frasi; 20-24 = valore principale di una lastra (giorno, risorse). [Roster per 12/13; deciso il resto]
- **Interlinea:** 1,2 per etichette e numeri su una riga; 1,4 per frasi. [deciso]
- **Maiuscolo** solo su etichette di ≤ 3 parole e sempre con tracking (`--skin-hud-caps-tracking` 0,06 em; titoli 0,2 em). [Roster]
- **Troncamento:** una riga + ellissi solo se il testo intero è nel `title` o nel tooltip. Un controllo con etichetta troncata ("A…") è un bug: accorcia l'etichetta o spostala in un menu (§5). [deciso]
- **Numeri:** sotto 10 000 interi con separatore locale; da 10 000 abbreviati (12,4k / 12.4k); delta sempre col segno (−6/g, +3/g). [deciso]
- **Lunghezze:** progetta sull'**italiano**, che è circa il 30% più lungo dell'inglese; prova ogni lastra con lo pseudo-locale (`public/locales/pseudo`). [deciso]
- Nessun testo sotto 12 px (§4.3 regola 2). [Roster + guardiano]

### 6.4 Stati di ogni controllo

| Stato | Come si vede | Fonte |
|---|---|---|
| Riposo | pillola `data-hud-controls` | [Roster] |
| Hover | bottoni: fondo più chiaro, alzata 2 px; righe: filetto `--skin-hud-row-filet-hover`; 120-140 ms | [codice] `skinScope.css` |
| Premuto | l'alzata dell'hover (−2 px) torna a 0, ombra di pressione, `brightness(1.15)`; 80-140 ms | [codice] `skinScope.css:97-119` |
| Focus da tastiera | doppio anello seat + accento, **sempre visibile** con `:focus-visible` | [Roster] §5 |
| Selezionato | `aria-pressed="true"` / `aria-checked`, fondo accento | [Roster] |
| Disabilitato | velato con contrasto **≥ 3:1** (≈ opacità 0,65, mai 0,4: a 0,4 scende a ~2:1) + lucchetto o motivo nel tooltip ("Serve la Locanda") | [deciso; misura su lacca] |

- **Difetto attuale:** `--skin-btn-disabled-opacity` vale `0.4` (`skinCssVariables.ts:126`) e viola questa regola; si porta a ~0,65 in Fase 1 (primo task che tocca un controllo disabilitato), con prova di contrasto.
- **Area cliccabile minima 32 × 32 px**, anche quando la pillola o l'icona disegnata è 26 px: si allarga con padding trasparente o pseudo-elemento, non ingrandendo il disegno. [deciso]
- Il cursore segue lo stato (§5c): disabilitato → guanto con lucchetto; mai `cursor: pointer` su un controllo disabilitato. [codice]

### 6.5 Feedback

- **Tooltip:** compare dopo **400 ms** di sosta (i tooltip di dettaglio già usati in `QuestRunWindow` a 120 ms restano: sono richiesti, non scoperti); si chiude con 140 ms di tolleranza (§5b.7). Stessa materia della lastra, testo in Garamond se è una frase, mai sopra l'oggetto che descrive: si apre dal lato verso il centro dello schermo. [deciso + codice]
- **Stato vuoto:** ogni lista ha una frase scritta ("Nessun evento", "Nessun residente libero"), mai un riquadro vuoto. [codice: `gameFrame.events.empty`]
- **Conferma:** un'azione che spende risorse o persone mostra cosa cambia **prima** del clic (anteprima), non un popup "Sei sicuro?" dopo. Popup di conferma solo per azioni irreversibili. [deciso, coerente con R2.2]
- **Errore / rifiuto:** il controllo rifiutato fa un micro-scuotimento (≤ 200 ms) e dice il motivo in una riga accanto o nel tooltip. Il drop rifiutato lo dice già il cursore (§5c). [deciso]
- **Caricamento:** oltre 300 ms di attesa compare il cursore attesa; oltre 1 s un indicatore nella lastra. Sotto 300 ms niente. [deciso]

### 6.6 Livelli

Ordine unico da `config.zLayers` [codice]: `wash` 7 < `floating` 8 < `chrome` 10 < `dressing` 11 < `panels` 12 < `boot` 40. Tooltip e menu aperti vivono sopra il loro pannello (portal nello stesso `data-hud-controls`, T-03). Un pannello trascinato non cambia livello. Ombre: solo `--skin-hud-shadow-filter`, mai un'ombra nera nuova. Niente scrim scuro sulla mappa per i pannelli fluttuanti; lo scrim è solo per le schermate d'azione a pagina intera (§6b).

### 6.7 Movimento

| Uso | Durata | Curva | Fonte |
|---|---|---|---|
| Hover, colore, filetto | 120-140 ms | `ease-out` | [codice] |
| Premuto | 80 ms | `ease-out` | [codice] |
| Apertura pannello / menu | 200 ms | `ease-out` | [deciso] |
| Chiusura | 140 ms | `ease-in` | [deciso] |
| Scivolata HUD (nascondi) | 520 ms | `ease-in-out` | [codice] `hudHide.slideMs` |
| Pulsazione di attesa (halo finito, decisione in attesa) | ciclo 2 s | sinusoidale | [deciso, D4] |

Una sola famiglia: niente rimbalzi, niente scale > 1,04. Con `prefers-reduced-motion` le durate vanno a 0 e le pulsazioni diventano una luce fissa.

### 6.8 Scala e risoluzioni

- Viewport supportati: da **1280 × 720** a **2560 × 1440**, rapporti 16:9, 16:10 e 21:9. Si prova a 1280 × 720, 1440 × 900 e 2560 × 1440. [deciso]
- Sotto `breakpoints.compactTopPx` (1400 px) la riga alta si compatta (§6.11). [codice]
- **Scala UI 100 / 125 / 150 %** come opzione del giocatore: ogni misura in px dell'HUD deve poter essere moltiplicata da un unico fattore. Per ora è una regola di scrittura (niente px fuori dai token), l'opzione arriverà dopo. [deciso]
- A 1280 nessun testo sotto 12 px e nessuna lastra fissa che copre la terra (§9, T-01). [codice + guardiano]

### 6.9 Accessibilità

- **Contrasto del testo ≥ 4,5:1** sulla lacca. Misurato: titoli 6,5-9,9:1, etichette 5,5-8,2:1, secondario 4,9-7,3:1 (sulla lacca più chiara, `lift`) → i token attuali passano. Un testo disabilitato a opacità 0,4 scende a ~2:1: vietato (§6.4). [misura T0.4]
- **Mai il colore come unico canale** (§5): forma, icona o testo insieme al colore.
- **Tastiera:** ogni controllo raggiungibile con Tab, ordine = ordine visivo (alto-sinistra → basso-destra). Scorciatoie esistenti [codice]: `R` Roster, `E` Eventi, `Q` Quest, `H` nascondi HUD, `F10` Regia (DEV). Ogni scorciatoia compare nel tooltip del suo controllo ("Roster (R)").

### 6.10 Audio UI (solo aggancio)

Quattro eventi con un nome fisso, da collegare quando esisterà il suono: `ui.hover`, `ui.click`, `ui.confirm`, `ui.reject`. I componenti li emettono; produrre i suoni è fuori da PLAN-058. [deciso]

### 6.11 Struttura di `/game` (esistente)

- **Griglia alta** (`GameFrame`): `minmax(0,1fr) auto minmax(0,1fr)`. Sotto `breakpoints.compactTopPx` (1400) `useCompactTop()` sposta trend e nome del luogo nei tooltip.
- **Fissi vs fluttuanti**: i soli margini di sicurezza della mappa (`worldDressing.safeFit.insets`) sono calcolati sui fissi. Se cambi l'altezza di un pezzo fisso, aggiorna gli insets (altezza + circa 8-23px) e **rimisura** (§9).
- **Ombra**: `filter: drop-shadow()` mai sullo stesso elemento di un `clip-path` o di un `overflow: hidden`. `HudPlaque` mette l'ombra sull'SVG fratello, quindi il contenitore non deve tagliare con `overflow`.
- **Dettaglio quest**: si apre nel corridoio tra Roster e registro (`config.questDetail`), mai sopra il Roster (è la sorgente del drag).

### 6.12 Checklist da incollare nel report di ogni task di Fase 1

```
[ ] 1. Sembra il Roster: stessi token di §4.2, nessun letterale di colore o misura nuovo
[ ] 2. Allineamento §6.1: testo a sinistra, numeri in colonna a destra tabular-nums, centrato solo dove ammesso
[ ] 3. Spaziatura §6.2: valori nuovi su 4/8/12/16, lastra larga quanto il contenuto
[ ] 4. Testo §6.3: solo 12/13/14/16/20/24, maiuscolo solo ≤3 parole, troncamenti con tooltip, provato in italiano/pseudo
[ ] 5. Stati §6.4: hover, premuto, focus visibile, selezionato, disabilitato ≥3:1 con motivo; area cliccabile ≥32×32
[ ] 6. Feedback §6.5: tooltip 400 ms dal lato giusto, stato vuoto scritto, rifiuto con motivo
[ ] 7. Livelli §6.6: solo zLayers, solo --skin-hud-shadow-filter
[ ] 8. Movimento §6.7: durate della tabella, reduced-motion verificato
[ ] 9. Risoluzioni §6.8: screenshot a 1280×720, 1440×900, 2560×1440; fissi non coprono la terra
[ ] 10. Accessibilità §6.9: contrasto ≥4,5:1, colore mai da solo, Tab nell'ordine visivo, scorciatoia nel tooltip
```

---

## 6b. Schermate d'azione a pagina intera

La guida nasce per i pannelli **sopra la mappa** di `/game`, ma il materiale vale anche per schermate d'azione a pagina intera senza mappa (es. il lab quest `/quest-s1-lab`, PLAN-024). Regole tradotte:

1. **L'eroe cambia**: su `/game` è la mappa; su una schermata d'azione è **il dipinto di scena**. Va a pieno schermo (full-bleed, `object-fit: cover`) dietro le lastre, mai in un francobollo al centro. Bordi ammorbiditi con scrim `linear-gradient` in teal profondo (`SCRIM` in `questS1Lab/hud/atoms.tsx`), non con `mask-image` se le righe ci devono stare sopra.
2. **Il telaio è sempre `HudPlaque`**, tre lastre e non di più: `hang` in alto (stessa costruzione del cartiglio obiettivo: contesto, progresso, controlli `data-hud-controls`), `panel` implicito per lo stage (il dipinto stesso, senza cornice propria: gli scrim bastano), `plinth` in basso che sale dal fondo (stessa costruzione della nav: decisioni, opzioni, verdetto). Contenitori interni senza bordo/raggio/fondo (regola §2).
3. **Le liste sono righe, non sotto-scatole**: la formazione usa le card roster canoniche (`WanderlustRosterCard` da `ui/idleVillage/roster`, modo `compact`) come righe dentro lo stage, con i dati extra del gioco (exposure, chip danno) come overlay, mai come fork della card. Stesso principio di §5b: riusa la superficie trusted.
4. **Uno stile di pillola**: controlli di pagina, di pannello e toolbar di oggetti passano tutti per `data-hud-controls` — niente pill ad hoc.
5. **Gli overlay narrativi** (cinematica, verdetto) stanno nel plinth o sopra lo stage con scrim; non aprire drawer/pannelli ad hoc fuori dal telaio.

File di riferimento: `src/ui/idleVillage/questS1Lab/hud/*` (già dentro `STRICT_FILES` della guardia).

---

## 7. Mappa, POI, asset

- **Mappa ritoccata**: `scripts/bake-map-grade.py` produce `*.graded.webp` e `manifest-flat-graded.json`. `worldDressing.grade` sceglie; in dev `?map=original|graded`. Mai un filtro CSS a runtime sulla mappa.
- **Mare esteso**: `PixiWorldMap` specchia il livello del mare di lato e in verticale (`seaMarginPx`, `seaMarginYPx`). In verticale **solo** il livello `sea`: specchiare la terra riflette le isole. Gli specchi si sovrappongono di 6px e lo stage ha il colore del mare (`stageColor`), per evitare la riga scura.
- **Zoom**: lo zoom è già al minimo permesso dall'altezza del canvas; per dare spazio ai pezzi fissi serve **più mare**, non un inset più grande da solo.
- **Eventi di mondo (es. invasione goblin)**: si usa la sequenza della pagina World Surface, non un modale: `WorldSurfaceEventShroud` (le due tende di pergamena a tutto schermo, sotto la HUD) e `WorldSurfaceEventCard` (scheda in coordinate del mondo, che segue pan e zoom). Su `/game` la scheda vive nello strato `worldLayer` di `PixiWorldMap` (un div grande quanto il canvas, trasformato dalla camera; lascia passare i clic, quindi avvolgi i contenuti interattivi in un elemento con `pointer-events: auto`). Conferma = le tende si riaprono, l'adesivo cade sulla foresta e marcia verso il villaggio, e la minaccia entra nel registro eventi (il promemoria in alto a destra è spento con `showReminder={false}`, perché il registro porta già il conto alla rovescia).
- **POI**: usa `PoiMatericV3_5` (scelta del proprietario), 55px (`questPois.sizePx`). **Nessun testo visibile sul marker** (il nome sta solo nell'`aria-label`). L'alone (anello a lettere) prende stato e progresso **solo** da `mapQuestPoiView` in `MapQuestPoi.tsx`, mai da un loop proprio (trappola T-07): un POI solo disponibile non ha alone; a quest in corso l'anello si scrive in senso orario seguendo il progresso della spedizione e resta intero a fine corsa; nell'ultimo tratto della finestra (`expiring`) l'anello compare intero nel colore d'avviso e si svuota in senso antiorario fino a zero alla scadenza. All'apparizione l'anello nasce vuoto e si scrive fino al valore reale (con `prefers-reduced-motion` salta subito al valore). Archi che possono valere 0: niente `strokeLinecap="round"` (trappola T-02). Il nuovo contratto dell'alone (un tempo in due modi, pulsazione a fine) arriva con PLAN-058 Fase 4. Un nuovo POI e il cartiglio obiettivo **entrano con una transizione** (dissolvenza e crescita, 0,5-0,8 s), mai di colpo; alla scadenza il POI sfuma e viene rimosso. Il tempo è sempre il **clock di gioco** (ticks), non il tempo reale: si ferma in pausa, corre a ×2/×4. La scadenza passa da `questAvailability()`.
- **Asset generati**: fondo trasparente, luce unica in alto a sinistra, ombre teal, niente testo, niente legno/corde/foglie. Cartelle: `public/assets/ui/hud/`. Descrivi sempre l'uso (dimensione a schermo) nel prompt.

---

## 8. Config: dove stanno le cose

`gameFrameConfig.ts` (tutto con schema Zod):

`identity.showTitle` (off), `hud.material` (`lacquer`|`legacy`), `questDetail`, `questPois` (`sizePx`, `availableDays`), `zLayers`, `breakpoints`, `edgeWash` (spento: mancano `edge_wash_left.webp` e `edge_wash_bottom.webp` in `public/assets/ui/hud/`), `debug.directorPanel` (solo dev, F10), `worldDressing` (`grade`, `stageColor`, `motion`, `safeFit`…).

---

## 9. Come verificare

1. **Tipi**: `npx tsc --noEmit -p tsconfig.app.json` e filtra sui tuoi file. Il progetto ha errori di sintassi preesistenti in altri file (`GuardianDryRunAnalyzer.ts`, `idleVillageMapAssetTelemetry.ts`) che interrompono il resto.
2. **Test**: `npx vitest run tests/unit/idleVillage/hudGuards.test.ts` controlla da solo le regole verificabili da una macchina: ogni `--skin-hud-*` letto dai file HUD è definito, niente colori scritti a mano nei file nuovi (`HudPlaque`, cartiglio obiettivo, coin, menù Pannelli, `WhenWhereCluster`, `MapQuestPoi`, ruolo `data-hud-controls`), nessun testo sotto 12px, e il Roster V2 legge tutti i token di misura di §4.2. **Aggiungi i tuoi file alla lista `STRICT_FILES`** quando ne crei di nuovi. Poi `npx vitest run <file>` sui tuoi test. Ci sono fallimenti preesistenti non tuoi (es. `useSkinPreferences.test.ts`, `poiDetailSkinWrapper.test.tsx`): verifica che falliscano anche senza le tue modifiche.
3. **Nel browser** (`preview_start` o il dev server su 5173): `/game` a **1440×900** e a **1280×800**, **con il Roster aperto (R) accanto al tuo componente** (§1). Confronta con `?hud=legacy`, `?skin=base`/`lacquer_atlas`, `?map=original`.
4. **Misura, non fidarti dell'occhio**: per la terra coperta usa la maschera (alpha di `base_flat` più i livelli isola con i loro `rect`), non solo `base_flat`. Per i colori campiona i pixel con PIL.
4b. **Contratto map/HUD**: il chrome fisso non interseca mai il rettangolo della terra a riposo — il metodo di misura meccanico (`__worldCam`, land bbox in screen-space vs `getBoundingClientRect` del chrome) e la diagnosi del fit sono in `game_map_fit_contract.md`, con lo script `scripts/probe-game-map-fit.cjs`.
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
| `<button><Icon/>Testo</button>` in `data-hud-controls` | Il pill viene trattato come icon-only (26px) e il testo straborda sui vicini | Avvolgi l'etichetta in un `<span>`: `svg:only-child` ignora i nodi testo |
| Attribuire alla HUD un difetto dell'atmosfera | Ombre nuvole al 2-4% sono invisibili per config | Controlla prima la config generata |

---

## 11. Stato e cose provvisorie

- `?hud=legacy` mantiene il vecchio percorso (`HudRibbon`, `HudPanel`) solo per il confronto. Astrolabio, bussola ritagliata, `EdgeDressing`, `SpeedControl`, `HudHangingTag` e `ResourceMedallion` sono stati eliminati.
- Roster V2 non è un kit certificato.
- Il dettaglio quest (`ActivityCapsuleDetailSkinAware`) ha la cornice HUD ma va rifatto compatto **dopo** il rework delle quest.
- Il livello `edgeWash` (pennellate sui bordi) è pronto ma manca l'immagine.
- Restano: ruoli in `skinScope.css` per il resto della HUD, font EB Garamond incorporati, movimento e prestazioni, regioni cliccabili.

---

## 12. Frase da dare a un agente

> Prima di creare o modificare un componente HUD di `/game` o una schermata d'azione a pagina intera leggi `src/docs/docs/design/hud_component_guide.md`. Il risultato deve sembrare il Roster V2. Usa `HudPlaque`, i token `--skin-hud-*`, `data-hud-controls` e `useHudPanelDrag`. Niente letterali colore, niente testo sotto 12px, niente stringhe fisse, niente modifiche ai kit certificati. Verifica a 1440×900 e 1280×800 e riporta cosa hai misurato.

## Catture e debug (`/game`)

- `?capture=1`: niente Director e niente menu pannelli, per screenshot e trailer puliti (F10 nasconde il Director anche senza).
- `?skin=base|lacquer_atlas`: skin iniziale. `?map=graded|original`: mappa graduata o originale.
- Mappa: `worldDressing.seabed` (fondale con parallasse sotto il mare), `motion.cloudShadowOpacity` (ombre delle nuvole: gli sprite forniti sono nuvole chiare, vengono tinti di scuro), `regions` su `PixiWorldMap` (regioni da `region_ids.png`, rigenerabile con `scripts/bake-region-ids.py`).

## Pannelli chiudibili e menu Pannelli

Ogni pannello flottante che il giocatore può chiudere si registra in `components/gameFrame/hudPanelRegistry.ts` (id, tasto, visibilità iniziale, `devOnly` per gli strumenti di test). Il menu Pannelli (bottone in basso a destra, con un contatore dei pannelli chiusi) si genera da quella lista: **per aggiungere un pannello basta una riga nel registro e la stringa `gameFrame.panels.names.<id>` nei due locale** (un test di guardia fallisce se manca). Il pannello deve avere un pulsante di chiusura che chiama `panels.set(id, false)`. In sviluppo ci sono anche Director (D) e Tuning (T): Tuning mostra a schermo i valori di tuning della mappa, con slider, e la riga da incollare in `gameFrameConfig.ts`.

## Pulsanti

Solo tre ruoli, tutti dai token (nessun colore scritto a mano, **mai viola** — il vecchio CTA azzurro-viola è stato sostituito):

| Ruolo | Come si ottiene | Aspetto |
|---|---|---|
| **Azione primaria** (AVVIA, Conferma) | `<SkinButton variant="cta">` (o `data-skin="cta"`) dentro `<SkinScope>` | placca smalto verde acqua con cornice d'ottone, bisello; uno solo per schermata |
| **Comando di testata** (ordina, filtri, chiudi, menu) | un normale `<button>` dentro un contenitore `data-hud-controls` | pillola 26 px nel materiale della placca; `aria-pressed="true"` = attiva (oro) |
| **Utilità/secondario** (fuori dalle testate) | `<SkinButton>` (`utility` / `secondary`) | placca in bronzo battuto / ardesia incisa |

Regole: (1) un `<button>` nudo non va mai in un pannello HUD, perché eredita lo stile del browser; (2) i controlli nativi (slider, select) prendono `accent-color: var(--skin-title-color)`; (3) l'icona sola sta in un bottone 26×26 con `aria-label` e `title`; (4) stato attivo ≠ hover: l'attivo cambia fondo e bordo, l'hover solo luminosità; (5) un'azione che parte con un tasto lo scrive nel `title` (es. `Pausa [Spazio]`).

## Vita della mappa (effetti leggeri, tutti in `PixiWorldMap`)

Tutto gira su uno shader o su pochi sprite, senza ricostruire la scena e senza muovere la geometria della terra (niente bordi fantasma):
chiome delle foreste che ondeggiano al vento (mesh `canopySway`), fumo dai tetti del villaggio (`VILLAGE_CHIMNEYS`), luccichii di sole sul mare (punti `sea` di `points.json`),
mostri marini rari, onde distanziate, nuvole su tre strati con parallasse e deriva con scostamento di vento, ombre morbide sul suolo e fondale trasparente
mentre si trascina. `prefers-reduced-motion` spegne vento, fumo e luccichii. Per rifare i ritagli di isole e foreste: `scripts/defringe-layers.py`.
