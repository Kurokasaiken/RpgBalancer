# Scene Library — catalogo riuso cross-quest

Libreria condivisa di art dipinte in stile Wanderlust (bibbia
`src/docs/docs/plans/art_direction_plan.md`). I file sono **nominati per
soggetto, non per quest né per fase**: qualunque quest può usarli dove i
tag coincidono. Registro creato il 2026-10-13 (Director: «tutto quello
che possiamo riutilizzare è meglio riutilizzarlo»).

**Regole di catalogazione**
- Ogni file porta tag su setting / soggetto / figure / luce / creature —
  mai il nome della quest.
- Le scene con goblin portano il tag `goblin-*` esplicito
  (`goblin-swarm`, `goblin-distant`, `goblin-hidden`, `goblin-craft`):
  `combat`/`forest` da soli non bastano a distinguerle.
- `no-people`/`no-goblins` = asset wilderness generica, riusabile ovunque.
- Tutte le immagini sono 3168×1344 (21:9) JPEG q85 progressive.
- **Contratto formato (PLAN-061, R-231 #8):** il theatre stage renderizza a
  `theaterAspect` in `gameFrameConfig.questWindow` (oggi 2.4:1), cover-fit.
  21:9 (2.357) rientra nella tolleranza ±5% (`theaterAssetAspectTolerance`);
  le nuove generazioni/recodifiche puntano a 3168×1320 (2.4:1 esatto) con
  soggetto focale nella fascia verticale centrale. Gate:
  `npm run check:quest-art`.

## Inventario

| File | Soggetto | Goblin | Figure | Tags | Uso attuale |
|------|----------|--------|--------|------|-------------|
| `sentiero-tracce.jpg` | sentiero nel bosco che muore; solchi di ruota, straccio al rovo, fumo basso | no | nessuna | forest, trail, tracks, mystery, daylight, no-people, no-goblins, generic | gob-esplora, gob-tracce-per, gob-tracce-perfor |
| `carro-nascosto.jpg` | carro mercantile nascosto sotto frasche; forziere con trappola a campanelli | no | nessuna | ravine, wagon, strongbox, loot, trap-bells, midday, no-people, no-goblins, generic | gob-bottino |
| `mercante-strada.jpg` | mercante al bivio con carro coperto; mano alzata in saluto | no | 1 NPC (mercante) | road, fork, npc-merchant, wagon, midday, people-allowed, no-goblins, generic | evento mercante (nodo non ancora authored) |
| `accampamento-raider.jpg` | accampamento raider spiato tra le fronde: tende di pelle, focolai, palizzata | no | nessuna visibile | camp, palisade, tents, cookfires, dusk, pov-hidden-watcher, no-visible-inhabitants, no-goblins, generic-enemy-camp | gob-accampamento, gob-stealth, gob-assalto |
| `assalto-goblin.jpg` | campo notturno che erutta: sciame goblin esce dalle tende tra fiamme | **sì — sciame** | goblin (gruppo) | camp, night, fire, combat, goblin-swarm, pre-contact, eruption | gob-combattimento |
| `fuga-goblin.jpg` | gola rocciosa assolata; poche sagome goblin in fuga verso la treeline | **sì — lontani** | goblin (distanti) | defile, rocks, chase, afternoon, azure-sky, goblin-distant, escape-open | gob-incalzare, gob-incalza-check |
| `saccheggio.jpg` | campo conquistato all'alba: forziere spaccato, monete, ambra + tende non perquisite + corde con campanelli | no | nessuna | camp-ruined, morning, loot, treasure, coins, gold, traps, unsearched-tents, no-people, no-goblins, aftermath-lite, generic | gob-esplora-extra, gob-cerca |
| `agguato-foresta.jpg` | strada assolata nel bosco; arcieri goblin mezzi nascosti nella treeline | **sì — nascosti** | goblin (mezzi nascosti) | forest-road, sunlit, ambush, goblin-hidden, bows-drawn, trap-loaded | gob-agguato, gob-agguato-scelta, gob-ultimo-scontro |
| `totem-goblin.jpg` | totem da guerra: maschera lignea verde, strisce ocra-cremisi, stracci cinabro | no (oggetto) | nessuna | totem, object, goblin-craft, card-cover, wide, no-people | QuestSelectScreen card «Sterminio dei goblin» |
| `viaggio-andata.jpg` | cancello aperto del palisade all'alba visto da fuori: lanterna su palo, solchi che diventano sentiero verso foresta e vette; villaggio MAI in frame | no | nessuna | threshold, gate, palisade, dawn, departure, trail, peaks, no-people, no-goblins, generic | gamba andata journey (`JOURNEY_LEG_ART.andata`), viaggio (S1) |
| `viaggio-ritorno.jpg` | strada che scende verso il villaggio in valle dorata al tramonto: sacello con lanterna e pini a destra, fumi dai camini | no | nessuna | return, valley, village-distant, sunset, shrine, road, golden-hour, no-people, no-goblins, generic | gamba ritorno journey (`JOURNEY_LEG_ART.ritorno`), ritorno (S1), gob-ritorno |

## Provenance

Tutti i file derivano da generazioni AI del 2026-10-13 (prompt in
`.mw/specs/quest-goblin-scenes/scenes/<scena>/prompt.md`, formato
moodboard-library gate R8). Sorgenti: `~/Downloads/<nome>.jpeg`
(`esplorazione`, `bottino`, `accampamento`, `combattimento`, `incalzare`,
`spoglie`, `agguato`, `mercante`, `quest card`), ricodificati JPEG q85
progressive a risoluzione piena 3168×1344.

`viaggio-andata.jpg` / `viaggio-ritorno.jpg` derivano da generazioni AI del
2026-10-23 (prompt in `.mw/specs/quest-journey-legs/scenes/<scena>/prompt.md`,
formato scene-authoring R1–R7, anche in `prompt_library.md` §«Viaggio»).
Sorgenti: `~/Downloads/andata.jpeg` (1408×768 → crop 2.4:1 + upscale
3168×1320) e `~/Downloads/ritorno.jpeg` (1584×672 → crop 2.4:1 + upscale
3168×1320), ricodificati JPEG q85 progressive.

**Lavorazioni applicate**
- `mercante-strada.jpg` ← `mercante.jpeg`: rimosso il testo «HAND
  PAINTED» sul cartello appeso al carro (clone della fascia pulita della
  tavola, patch ~160×84px a x≈1876-2036 y≈743-827, feather 2px). Violava
  la kill list `NO text`.
- Nessun'altra lavorazione: le 21:9 si adattano al container Theater
  (aspect `theaterAspect` da config, `object-cover`,
  `object-position 50% 40%`) senza crop manuale.

**Mancanti / pending**
- Evento mercante: asset pronto (`mercante-strada.jpg`), nodo quest non
  ancora authored nello scenario.
- **Stale rispetto al manoscritto v3 (Director 2026-10-18):** `carro-nascosto.jpg`
  mostra un carro mercantile (fiction revocata: niente carri/strada) —
  in v3 il nascondiglio è un fagotto sotto tela cerata; `sentiero-tracce.jpg`
  mostra solchi di ruota (stessa fiction revocata). La rigenerazione
  richiede ruling Director — i file restano in uso finché non rimpiazzati.
