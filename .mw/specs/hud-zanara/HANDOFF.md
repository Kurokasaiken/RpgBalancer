# HUD Zanara — Handoff completo (2026-11-02)

Documento di passaggio: obiettivo, selezioni del Director, protocollo di ricostruzione,
asset prodotti, stato dell'implementazione, decisioni prese e gap aperti.

---

## 1. Obiettivo (ruling Director)

> "Non cambierei più la direzione artistica. Abbiamo trovato l'identità di Wanderlust.
> Ma smetterei di lavorare sulla schermata intera e inizierei a perfezionare i singoli
> manufatti. È il passaggio che ci manca per arrivare a una UI veramente professionale."

- La mappa resta la protagonista; la HUD incornicia senza invadere il centro.
- Materiali: **metallo dipinto oro, smalto/laccato smeraldo, alabastro, gemme smeraldo**.
- Ogni componente ha identità propria; **evitare** la ripetizione di astrolabi/rose dei venti decorative.
- Barra di qualità del Director: **"non deve avvicinarsi, deve essere identico o meglio"**.
- Ogni pezzo deve diventare un componente reale: esportabile, ricostruibile, riusabile — non un'immagine appiccicata.
- Piano di riferimento: `plans/PLAN-107-hud-zanara-real-components.md` (dibattuto, emendato, accettato).

## 2. Componenti selezionati dal Director (da quale mockup)

Mockup sorgente in `public/mockups/hud-lab/sources/`, crop per-componente in
`public/mockups/hud-lab/crops/<componente>/<variante>.webp`.

| Componente | Mockup selezionato | Note Director |
|---|---|---|
| Roster (colonna eroi) | **zanara-v2** | stato chiuso simile al mockup; bottone per espandere al roster grande; supporta MOLTI più pg dei 4 del mockup → lista scrollabile |
| Pannello contestuale | **zanara-v3** (o board-palette) | cornice alabastro + contenuto + bottone CTA |
| Nav bar | **zanara-v1** (provvisorio) | barra con bottoni icona etichettati reali, non socket vuoti |
| Risorse | **zanara-v3** | barra oro+smalto con slot + valori |
| Corner BL | **zanara-v1**, ma con domanda aperta | bussola/strumento + piastrina coordinate; una delle due "rose" sostituibile |
| Corner BR | **board-breakdown** | cluster di roundels oro |
| Sigillo vittoria | **mockup1-classic** | UN solo sigillo, eroe |
| Logo/brand | **board-palette** | placca WANDERLUST |

Struttura del roster zanara-v2 (dall'originale completo, NON da crop):
1. emblema alato (compass-rose + ali aquila + gemma smeraldo) in cima;
2. banda laterale verticale smalto-oro con edera e gemme ai giunti (pezzo riutilizzabile/tileable, NON un componente fisso con X cerchi);
3. righe ripetute (UN asset riga per eroe: anello oro inciso con ritratto + inserto smalto asimmetrico + placca ornata + freccia oro + losanga-gemma);
4. pendente-gemma sotto l'ultima riga.
L'inserto asimmetrico al giunto anello-placca è **smalto VERDE, non oro** (errore già commesso una volta, corretto).
Le viti/ornamenti **avvolgono** i bordi degli anelli — righe e banda sono intrecciate, non affiancate.

## 3. Il protocollo di ricostruzione (r002 — esito dibattito multi-AI)

Formalizzato in `.mw/specs/hud-zanara/component-reconstruction.md`.
Dibattito a 4 provider (chatgpt, claude, deepseek, gemini) → convergenza 4/4 ACCEPT su artifact-r002.

**Invariante**: nessun asset diventa canonico per bellezza — deve passare bellezza + geometria + rendering contro il mockup. Ogni deviazione di design richiede amendment firmato dal Director.

Pipeline a 6 fasi:
- **F0** spec YAML per componente: geometria intesa E reale + deviazione, slice-regions, layer stack (content < inner-shadow < frame < gem), stati.
- **F1** anchor-first: il primo componente riuscito (roster) si promuove a kit canonico; ogni generazione futura usa il kit come ref materiale. Kit si congela solo dopo validation board.
- **F2** component sheet + gate scripted (conta elementi, pitch ≤2%, margini; tagliare TUTTE le N righe — "best row" solo fallback registrato).
- **F3** misura automatica mount zones (fit cerchio foro / poligono placca — numeri a mano vietati).
- **F4** montaggio tolerance-by-design (ritratto 3-4px bleed sotto l'anello; maschere dagli alpha).
- **F5** gate numerici provvisori fino a calibrazione sui pilot; eyeball = lista bloccanti.
- **F6** provenance completa + "fidelity debt" se il budget iteraioni si esaurisce.

Tassonomia fallimenti: GENERATION / EXTRACTION / GEOMETRY / LAYOUT — loop mirato per tipo.
Loop Gemini: prompt compilato (ref roles + blocco spec + vincoli), 4 varianti → gate → ≤3 riparazioni ancorate ("keep everything, change only X") → ≤3 chat fresche.

### Errori di pipeline già commessi (non ripetere)
- **CSS/SVG per ornamenti pittorici**: insufficiente → raster generato dedicato.
- **Crop da screenshot come asset**: fragile, bassa risoluzione → generazione dedicata.
- **Chroma-key a soglia sul navy**: mangiava lo **smalto smeraldo scuro** (troppo vicino al navy) → i "verdi cancellati". Fix canonico: **flood-fill dai bordi** — trasparente solo il navy connesso all'esterno; smalto interno resta opaco.
- **Posizioni a percentuali stimate**: decentrava tutto → mount zones misurate via script sulle sheet (ring center, placca interior).
- **Prompt "HEADER/COMPONENT BLOCK"**: Gemini li legge come testo → prompt che iniziano con "Generate an image:" instradano alla generazione.
- **Gemini in foreground**: vietato; tab via CDP `Target.createTarget {background:true}` su :9222.

## 4. Asset prodotti (run notturna)

Generazione via `scripts/gen-mappa2-sprite.mjs` (Gemini web, CDP :9222, background).
Sorgenti + log + compositi in `.mw/specs/hud-zanara/overnight/<id>/` (2 varianti + repair).
Asset pronti (alpha flood-fill) in `public/mockups/hud-lab/attach/`:

| File | Pezzo |
|---|---|
| `emblem-alato.png` | medaglione alato (rosa dei venti + ali + smeraldo) |
| `pillar-band-tile.png` | tile opaco 314×426 banda smalto-oro-edera+gemma, `repeat-y` |
| `sheet-row-0.png` | riga roster (768×304); mount zones: anello centro 26.5%x/70.4%y, d≈25%w; placca opaca x 45-89%, y 42-89% |
| `panel-alabastro-alpha.png` | cornice alabastro + filigrana oro + gemme |
| `nav-plinth-alpha.png` | barra smalto-oro + astrolabio + 8 socket vuoti |
| `resources-bar-alpha.png` | barra risorse + caps gemmate + 4 slot |
| `corner-bl-alpha.png` | sestante oro + placca smalto + piastrina coordinate |
| `corner-br-alpha.png` | cluster 4 roundels oro + medaglione |
| `seal-alpha.png` | sigillo alloro oro + smalto (repair: smeraldi, non rubini) |
| `brand-plaque-alpha.png` | placca titolo ornata (banda smalto ~55-62% altezza immagine) |
| `cta-button-alpha.png` | bottone pill smalto+oro con rosa dei venti |
| `gem-cut.png` | gemma smeraldo con bezel oro (pendente roster) |
| `filigree-vine-0.png`, `medallion-ring-v2-0.png` | pezzi kit generati precedenti |

## 5. Stato implementazione (file)

- `src/pages/hud-lab.tsx` — lab interattivo su mappa Pixi vera; rail controlli + iterazioni.
- `src/pages/hud-lab/spikes/RosterSpike.tsx` — colonna roster v7: emblema + banda tile repeat-y + righe ripetute scrollabili + pendente; mount zones misurate.
- `src/pages/hud-lab/spikes/PanelFrameSpike.tsx`, `MedallionSpike.tsx` — spike meno maturi.
- `src/pages/hud-compare.tsx` — pagina verdetto: mockup selezionato vs ricostruzione, per OGNI pezzo (in cima: composizione intera zanara-v2 vs `/hud-compose` live in iframe).
- `src/pages/hud-compose.tsx` — **composizione completa su mappa2**: layer HUD 1600×900 scalato al viewport (`transform: scale`), tutti gli 11 pezzi posizionati nei loro slot.
- Route registrate in `src/App.tsx`: `/hud-lab`, `/hud-compare`, `/hud-compose`.
- `scripts/hud-recon-loop.mjs` — runner autonomo (config JSON → genera → flood-cut → side-by-side → report); wait-for/relaunch CDP, resume via DONE, heartbeat shutdown-registry.
- `scripts/capture-hud-production.mjs`, `scripts/build-hud-lab-crops.mjs` — cattura e crop pipeline.
- Report/log: `.mw/specs/hud-zanara/overnight/OVERNIGHT-REPORT.md`, `loop*.log`.

## 6. Decisioni prese (Director + dibattito + AI review)

**Director**: smalto non oro nell'inserto; banda = pezzo unico tileable non componente fisso; righe ripetute + scroll; map visibile attraverso le trasparenze; niente Gemini in foreground (background CDP); componenti veri, non immagini ("nn sn componenti veri, nn sn cliccabili").

**Dibattito r002** (4/4 accept): anchor-first non kit-first; soglie numeriche provvisorie fino a calibrazione; tutte le N righe si tagliano.

**AI review su `/hud-compose`** (claude+deepseek+gemini, immagine mandata via mw-web-turn, run `hud-compose-review`):
- convergenza: pannello illeggibile (fixato: interno alabastro opaco), risorse troppo deboli (fixato: testo +peso), roundels competono col plinth (aperto), WANDERLUST debole (fixato: corpo maggiore+ombra), "tre oro diversi" (aperto → kit canonico risolve), roster senza indizio di scroll (aperto).
- nota deepseek: "troppa corona e poco trono" — ornamenti competono con la funzione.

## 7. Gap aperti (onesti)

- **Componenti NON ancora veri**: sono `<img>` posizionate. Mancano data-binding (eroi/risorse dallo store Zustand), interazioni (click eroe, nav→route, INIZIA→azione), stati (hover/pressed/focus/disabled), a11y, indizio di scroll.
- **Oro non uniforme** tra pezzi (generati separatamente) → kit canonico da congelare sui pezzi approvati.
- **Nav**: socket vuoti generati, manca la variante con bottoni etichettati veri.
- **Roundels BR** vs plinth: peso da riequilibrare.
- **Placca righe**: backing smalto = rettangolo semplice; la placca generata con interno opaco sarebbe la soluzione asset-level.
- **INIZIA**: agganciato al pannello ma non ancora handler reale.
- Safeguard di repo non ancora corsi sullo scope finale (`npm run lint -- <scope>`, `test`, `build:check`, `closure:lint`).

## 8. Prossimo passo concordato

Convertire gli asset in **pelle di componenti React reali** (`src/ui/`):
`ZanaraRoster` (eroi dallo store, righe cliccabili, scroll, stato expanded),
`ZanaraNav` (bottoni → route vere), `ZanaraResources` (bind risorse),
`ZanaraPanel` (POI reale + handler INIZIA), `ZanaraCorners` (bottoni funzionali),
poi montaggio su `/game` o `/hud-live` di prova.

## 9. Convenzioni tecniche da rispettare

- Vite dev `http://localhost:5173`; pagine: `/hud-lab`, `/hud-compare`, `/hud-compose`.
- Node da `.nvmrc`; niente `localStorage` diretto (PersistenceService); Zustand per stato dominio, Context solo presentazione locale; i18n `react-i18next` per stringhe; JSDoc su nuove funzioni.
- Nessuna finestra in foreground: browser automatizzati headless/background; Gemini via CDP :9222 con `Target.createTarget {background:true}` o l'instanza shared di mind-weaver (`browser-runtime`, profilo `.mw/providers/profiles/shared`).
- Alpha-cut canonico: **flood-fill dai bordi** (navy #0a1622 → trasparente solo connesso all'esterno; erode 1px anti-frange).
- Montaggio: SOLO su mount zones misurate via script; mai percentuali a occhio.
- Layout: design-space 1600×900 + `transform: scale` al viewport.
- Aggiornare plan/spec/manifest quando il lavoro avanza; nessun "identico" dichiarato senza prova visiva.
