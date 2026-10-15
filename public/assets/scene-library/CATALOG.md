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

## Inventario

| File | Soggetto | Goblin | Figure | Tags | Uso attuale |
|------|----------|--------|--------|------|-------------|
| `sentiero-tracce.jpg` | sentiero nel bosco che muore; solchi di ruota, straccio al rovo, fumo basso | no | nessuna | forest, trail, tracks, mystery, daylight, no-people, no-goblins, generic | gob-esplora, gob-tracce-per, gob-tracce-perfor |
| `carro-nascosto.jpg` | carro mercantile nascosto sotto frasche; forziere con trappola a campanelli | no | nessuna | ravine, wagon, strongbox, loot, trap-bells, midday, no-people, no-goblins, generic | gob-bottino-scelta, gob-bottino |
| `mercante-strada.jpg` | mercante al bivio con carro coperto; mano alzata in saluto | no | 1 NPC (mercante) | road, fork, npc-merchant, wagon, midday, people-allowed, no-goblins, generic | evento mercante (nodo non ancora authored) |
| `accampamento-raider.jpg` | accampamento raider spiato tra le fronde: tende di pelle, focolai, palizzata | no | nessuna visibile | camp, palisade, tents, cookfires, dusk, pov-hidden-watcher, no-visible-inhabitants, no-goblins, generic-enemy-camp | gob-accampamento, gob-stealth, gob-assalto |
| `assalto-goblin.jpg` | campo notturno che erutta: sciame goblin esce dalle tende tra fiamme | **sì — sciame** | goblin (gruppo) | camp, night, fire, combat, goblin-swarm, pre-contact, eruption | gob-combattimento |
| `fuga-goblin.jpg` | gola rocciosa assolata; poche sagome goblin in fuga verso la treeline | **sì — lontani** | goblin (distanti) | defile, rocks, chase, afternoon, azure-sky, goblin-distant, escape-open | gob-incalzare, gob-incalza-check |
| `saccheggio.jpg` | campo conquistato all'alba: forziere spaccato, monete, ambra + tende non perquisite + corde con campanelli | no | nessuna | camp-ruined, morning, loot, treasure, coins, gold, traps, unsearched-tents, no-people, no-goblins, aftermath-lite, generic | gob-esplora-extra, gob-cerca |
| `agguato-foresta.jpg` | strada assolata nel bosco; arcieri goblin mezzi nascosti nella treeline | **sì — nascosti** | goblin (mezzi nascosti) | forest-road, sunlit, ambush, goblin-hidden, bows-drawn, trap-loaded | gob-agguato, gob-agguato-scelta, gob-ultimo-scontro |
| `totem-goblin.jpg` | totem da guerra: maschera lignea verde, strisce ocra-cremisi, stracci cinabro | no (oggetto) | nessuna | totem, object, goblin-craft, card-cover, wide, no-people | QuestSelectScreen card «Sterminio dei goblin» |

## Provenance

Tutti i file derivano da generazioni AI del 2026-10-13 (prompt in
`.mw/specs/quest-goblin-scenes/scenes/<scena>/prompt.md`, formato
moodboard-library gate R8). Sorgenti: `~/Downloads/<nome>.jpeg`
(`esplorazione`, `bottino`, `accampamento`, `combattimento`, `incalzare`,
`spoglie`, `agguato`, `mercante`, `quest card`), ricodificati JPEG q85
progressive a risoluzione piena 3168×1344.

**Lavorazioni applicate**
- `mercante-strada.jpg` ← `mercante.jpeg`: rimosso il testo «HAND
  PAINTED» sul cartello appeso al carro (clone della fascia pulita della
  tavola, patch ~160×84px a x≈1876-2036 y≈743-827, feather 2px). Violava
  la kill list `NO text`.
- Nessun'altra lavorazione: le 21:9 si adattano al container Theater
  (aspect 2.76, `object-cover`, `object-position 50% 40%`) senza crop
  manuale.

**Mancanti / pending**
- `viaggio` (transito andata, copre `gob-inizio`) — non ancora generato;
  `gob-inizio` resta sul placeholder public-domain `assegnazione.jpg`.
- `ritorno` (transito ritorno, copre `gob-ritorno`/`gob-fine`) — non
  ancora generato; `gob-ritorno` resta su `ritorno.jpg` public-domain.
- Evento mercante: asset pronto (`mercante-strada.jpg`), nodo quest non
  ancora authored nello scenario.
