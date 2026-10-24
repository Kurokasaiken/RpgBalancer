# Quest «Sterminio dei goblin» — Scene Index & NODE_ART mapping

**7 immagini di fase + 2 art di transito (viaggio/ritorno) + 1 evento
(mercante) + 1 cover card = 11 asset.**
Decisione Director 2026-10-13: **i check sono pulsanti sulla stessa
schermata di fase — nessuna immagine per pulsante.** Una immagine per fase;
i nodi check riusano l'immagine della fase. I prompt dei pulsanti restano
su disco come riserva (marcati NON GENERARE).

**Ruoli runtime (chiarimento Director 2026-10-13):**
- **Fasi** = nodi choice/check/combat con schermata piena → art wide.
  **Contratto formato (PLAN-061, R-231 #8):** il theatre stage renderizza a
  `theaterAspect` dichiarato in `gameFrameConfig.questWindow` (oggi **2.4:1**),
  cover-fit — il formato entra nel prompt, non nel runtime. Generare ≥ 21:9
  (2.357, dentro la tolleranza ±5% di `theaterAssetAspectTolerance`); la
  ricodifica target è **3168×1320** per 2.4:1 esatto. Soggetto focale nella
  fascia verticale centrale. Gate meccanico: `npm run check:quest-art`.
- **Viaggio/Ritorno NON sono fasi**: sono tempo non skippabile
  (`TransitView`, banda `h-44` a opacità ridotta) con eventuali eventi
  minori. `viaggio.png`/`ritorno.png` sono **art di transito** — coprono
  anche `gob-inizio` (l'unica opzione è «Depart», la partenza è la scena)
  e `gob-ritorno`/`gob-fine` (info/end sulla strada di casa).
- **Mercante** = evento di viaggio che renderizza **come una fase** quando
  scatta (schermata piena), ma a metà quest durante un transito — non è la
  prima fase né una fase del flusso lineare.
- **Quest card** = la **cover della card nel picker** (`QuestSelectScreen`,
  `cards[].art`, banda `h-44` `object-cover`) — NON un'icona, NON 3:4:
  formato wide come le scene.

Regole: `src/docs/docs/art-direction/scene_prompt_authoring_guide.md`
(bibbia §10.7). In breve: beat pre-scelta/pre-check mai esito; party del
giocatore mai disegnato, NPC/party esterni ok; goblin da scheda
`creatures/goblin` v0.1.0 come sciame/sagome; luce libera per scena.

| # | Ruolo | Dir | Nodi coperti | File output | Goblin | Soggetto |
|---|-------|-----|--------------|-------------|--------|----------|
| 1 | *transito* andata + `gob-inizio` | `f0-viaggio` | `gob-inizio`, transit out | `viaggio.png` | no | strada fuori dal villaggio, vuota |
| — | *evento* Mercante (opt., mid-quest) | `f0-mercante` | nodo evento viaggio | `mercante.png` | no (NPC mercante) | ⚠ v3 revoca mercanti/strada nella fiction — nodo mai authored, spec da rivedere |
| 2 | **fase** Esplorazione | `f1-esplorazione` | `gob-esplora`, `gob-tracce-per`¹, `gob-tracce-perfor`¹ | `esplorazione.png` | no | ⚠ v3: segni sottili nel sottobosco (solchi di ruota revocati — regen pendente) |
| 3 | **fase** Il bottino | `f2-bottino` | `gob-bottino` | `bottino.png` | no | ⚠ v3: fagotto sotto tela cerata tra le fronde (carro revocato — regen pendente) |
| 4 | **fase** L'accampamento | `f3-accampamento` | `gob-accampamento`, `gob-stealth`¹, `gob-assalto`¹ | `accampamento.png` | no | il campo dalle fronde, vuoto |
| 5 | **fase** Combattimento | `f4-combattimento` | `gob-combattimento` | `combattimento.png` | **sì — sciame** | eruzione pre-contatto: goblin che escono dalle tende |
| 6 | **fase** Incalzare | `f5-incalzare` | `gob-incalzare`, `gob-incalza-check` | `incalzare.png` | **sì — fuga lontana** | gola tra le rocce, fuga aperta |
| 7 | **fase** Spoglie di guerra | `f6-spoglie-di-guerra` | `gob-esplora-extra`, `gob-cerca` | `spoglie.png` | no | campo conquistato: bottino visibile + tende non perquisite + trappole goblin |
| 8 | **fase** L'agguato | `f7-agguato` | `gob-agguato`, `gob-agguato-scelta`, `gob-ultimo-scontro`¹ | `agguato.png` | **sì — sagome nel bosco** | trappola carica: archi tesi nella treeline, palo pulito |
| 9 | *transito* ritorno + fine | `f8-ritorno` | `gob-ritorno`, `gob-fine` | `ritorno.png` | no | strada vuota che scende al villaggio |
| 10 | *cover* picker | `quest-card` | `QuestSelectScreen.cards[].art` | `quest-card.png` | no (totem) | totem da guerra — alt.: riusare `ART.goblinTotem` |

¹ nodi check = pulsanti sulla schermata di fase → riusano l'immagine di
fase. Prompt di riserva in `f1-tracce`, `f1-albero`, `f3-intrusi`,
`f3-assalto`, `f7-ultimo-scontro` (NON GENERARE).

## Tags per riuso cross-quest

Ogni asset porta una riga `Tags riuso` nel suo `prompt.md` (viaggia col
file). Regola: **i tag descrivono setting/soggetto/luce, non la quest** —
un'immagine senza elementi quest-specifici è riusabile ovunque i tag
coincidano. Il filtro pratico è `goblin-*`/`no-goblins`: le scene senza
goblin sono wilderness generica; quelle con goblin (`combattimento`,
`incalzare`, `agguato`, `ultimo-scontro`) riusabili in qualunque quest con
goblin. `quest-card` è la sola legata al tema.

| File | Tags |
|---|---|
| `viaggio.png` | road, village-outskirts, morning, azure-sky, mountains, departure, no-people, generic |
| `mercante.png` | road, fork, npc-merchant, wagon, midday, people-allowed, generic |
| `esplorazione.png` | forest, trail, tracks, mystery, daylight, no-people, generic |
| `bottino.png` | ravine, wagon, strongbox, loot, trap-bells, midday, no-people, generic |
| `accampamento.png` | camp, palisade, tents, cookfires, dusk, pov-hidden-watcher, no-visible-inhabitants, generic-enemy-camp |
| `combattimento.png` | camp, night, fire, goblin-swarm, pre-contact, eruption |
| `incalzare.png` | defile, rocks, chase, afternoon, azure-sky, goblin-distant, escape-open |
| `spoglie.png` | camp-ruined, morning, loot, treasure, coins, gold, traps, unsearched-tents, no-people, aftermath-lite, generic |
| `agguato.png` | forest-road, sunlit, ambush, goblin-hidden, bows-drawn, trap-loaded |
| `ritorno.png` | road, valley, village, sunset, golden, relief, no-people, generic |
| `quest-card.png` | totem, object, goblin-craft, card-cover, wide |

## NODE_ART applicato (2026-10-13) — scene-library riusabile

Asset in `public/assets/scene-library/` nominati per soggetto (non per
fase) per il riuso cross-quest; catalogo + tag in `CATALOG.md`. Mapping
reale in `src/ui/idleVillage/questS1Lab/questArt.ts`:

| Scena | File libreria | Nodi |
|---|---|---|
| Viaggio (transito) | — non generato | `gob-inizio` → placeholder PD `assegnazione.jpg` |
| Esplorazione | `sentiero-tracce.jpg` | `gob-esplora`, `gob-tracce-per`, `gob-tracce-perfor` |
| Bottino | `carro-nascosto.jpg` ⚠ stale v3 (carro) | `gob-bottino` |
| Accampamento | `accampamento-raider.jpg` | `gob-accampamento`, `gob-stealth`, `gob-assalto` |
| Combattimento | `assalto-goblin.jpg` | `gob-combattimento` |
| Incalzare | `fuga-goblin.jpg` | `gob-incalzare`, `gob-incalza-check` |
| Spoglie | `saccheggio.jpg` | `gob-esplora-extra`, `gob-cerca` |
| Agguato | `agguato-foresta.jpg` | `gob-agguato`, `gob-agguato-scelta`, `gob-ultimo-scontro` |
| Ritorno (transito) | — non generato | `gob-ritorno` → PD `ritorno.jpg`; `gob-fine` → `ART.village` |
| Card picker | `totem-goblin.jpg` | `QUEST_CARDS.goblin` in `QuestS1LabPage` |
| Mercante (evento) | `mercante-strada.jpg` | nodo non authored — asset pronto in catalogo |

`mercante-strada.jpg`: testo «HAND PAINTED» rimosso dal cartello in
post-produzione (dettagli in CATALOG.md).

## Delta necessari alla spec (manoscritto) — da ratificare

> **Nota 2026-10-18:** il manoscritto v3 (Director) ha superato questa
> lista — carri, solchi di ruota e guado sono fiction revocata. Le voci
> sotto restano come storia della ratifica 2026-10-13; la direzione
> corrente è nella spec §«Delta rimasti».

1. **F0:** titolo «Assegnazione» → «Viaggio»; il body del consiglio
   resta come briefing, ma il nodo diventa la marcia (allinea la quest al
   pattern S1 viaggio→…→ritorno e abilita eventi casuali tipo mercante).
2. **F1 body:** «un masso sbarra il passo — e da sotto spunta un lembo di
   straccio» → solchi di ruota che escono dal sentiero + straccio al rovo
   (il masso esce di scena — non reggeva come soggetto).
3. **F1 check STR+PER esiti:** «presso il masso, terra smossa» → «il terzo
   carro — quello che non è mai tornato — trascinato tra le felci».
4. **F2 body:** «Sotto il masso, un bottino avvolto in stracci» → il carro
   trascinato nella boscaglia, cassa ancora chiusa con trappola fisica
   (flavor «catene, laccio, un nodo da sciogliere»; l'allarme rumoroso era
   un'allucinazione — una trappola che suona non ha senso su un bottino
   incustodito, rimossa ovunque per ruling Director 2026-10-23).
   **SUPERSEDED v3 (2026-10-18):** niente carro né trappola — il
   nascondiglio è un fagotto sotto tela cerata avvistato solo dall'alto;
   `gob-bottino-scelta` non esiste più (nodo singolo a gesto unico).
5. **F3 stealth:** titolo check «Passare il filo» → **«Intrusi»**
   (ratificato Director 2026-10-12).
6. **F6:** titolo «Razzia / il campo conquistato» → **«Spoglie di guerra»**.
7. **F7/F8:** «Ritorno / Agguato» si spezza in **F7 L'agguato** (evento del
   ritorno) e **F8 Ritorno** (arrivo al villaggio, `gob-fine`).
8. **F4:** titolo da confermare col Director (nello scenario è
   *«Combat — the goblin camp»*).

## Coverage matrix — archetipi (PLAN-052 amendment 2026-10-24)

Tassonomia: `src/docs/docs/art-direction/composition_archetypes.md`.
Regole: mai adiacenti uguali, ritmo chiuso/aperto, rotazione bordo/occluder/
orizzonte/mossa/focale, escalation far-zone, flag lattice al brief.

| Scena | Stato | Archetype | Classe | Bordo occluder | Orizzonte | Shot | Focale |
|---|---|---|---|---|---|---|---|
| f0-viaggio | keep (viaggio-andata) | COULISSE+ARCH (cancello) | chiuso | sx+dx | basso | enter-sweep | far |
| f1-esplorazione | keep | VISTA-variant | aperto | — | medio | pan | far |
| f1-tracce | v2 generato (in valutazione) | COULISSE | chiuso | sx+dx | basso | enter-creep | mid |
| f2-bottino | regen (fiction: fagotto visto dall'alto) | TABLEAUX/ISLAND | ibrido | basso | nessuno | hold/push-down | near |
| f3-accampamento | keep→sostituire con gola | COULISSE | chiuso | sx+dx | basso | enter-settle-cover | mid |
| f3-gola | v2 live | COULISSE+CANOPY | chiuso | sx+dx+alto | basso | enter-creep | far |
| f3-intrusi | regen | SHOULDER | chiuso | sx o dx | basso | creep | mid |
| f4-combattimento | regen | CASCADE | ibrido | diagonale | medio | enter-direct | mid |
| f5-incalzare | regen | CASCADE | ibrido | diagonale | medio | enter-sweep | mid |
| f6-spoglie | regen | ISLAND | ibrido | basso/centro | medio | hold | near |
| f7-agguato | v2 brief scritto | SHOULDER | chiuso | sx+basso | basso | enter-creep | mid |
| f7-ultimo-scontro | keep | MONOLITH-variant | chiuso | — | medio | verdict-zoom | mid |
| f8-ritorno | keep (viaggio-ritorno) | SHOULDER+VISTA | ibrido | sx | medio | enter-sweep | far |

Sequenza (ordine di gioco): COULISSE(f0) → VISTA(f1a) → COULISSE(f1b,
ritorno rimato con knobs diversi) → TABLEAUX(f2, aperto verticale) →
COULISSE+CANOPY(f3g) → SHOULDER(f3i) → CASCADE(f4) → CASCADE(f5 — FLAG:
due CASCADE di fila, da mitigare con lato/pendenza/knobs diversi) →
ISLAND(f6, aperto) → SHOULDER(f7) → MONOLITH(f7b) → VISTA(f8).
Warning residuo: f4/f5 consecutivi CASCADE — il brief f5 dovrà invertire
il lato di entrata e cambiare pendenza+mossa.
