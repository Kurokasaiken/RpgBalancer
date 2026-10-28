
## Beauty layer (scorecard aggiuntiva, 2026-10-27)

La pipeline garantisce immagini *corrette*; la bellezza è un asse separato.
Gate qualitativo aggiuntivo, punteggio 0-8, approva >=6:

| Voce | 0 | 1 | 2 |
|---|---|---|---|
| **Notan** — masse tonali | valori sparsi ovunque | 5+ masse | 3-4 masse leggibili |
| **Figure-ground** | soggetto fuso col fondo | separato solo per dettaglio | separato per valore/saturazione |
| **Peso visivo** | simmetria o centro morto | squilibrio casuale | asimmetria intenzionale (massa piccola calda bilancia grande fredda) |
| **Momento** | "un posto", luce generica | luce coerente | un attimo leggibile (luce che sta per sparire, brace che muore) |

Mappa classica (già nel contratto runtime): repoussoir=occludente,
spazio negativo=banda riservata, gerarchia tonale=anchor<5%,
prospettiva aerea=lontano freddo, leading line=sentiero/corsia.

## Ablation protocol (era §9, ora attivo)

Stesso brief, 3 armi: A astratto / B piani nominati / C B+scala+contrasto+
bande+beauty vocabulary. Stesso chat/ratio, 1 candidato per braccio.
Si registrano: prompt-version, scores (0-20 runtime + 0-8 beauty), gate, decisione.

## Beauty layer addendum — subject craft (2026-10-27, post-ablation)

I gate numerici misurano il colore, NON il soggetto. Aggiungere allo
scorecard 0-8 una quinta voce (scala a 0-10):

| Voce | 0 | 1 | 2 |
|---|---|---|---|
| **Subject craft** | soggetto = massa liscia senza materia | struttura generica | materia dipinta: corteccia scolpita, chioma a pennellate, luci che modellano |

Regola: un soggetto eroico (quercia, torre, cancello) deve avere
superficie lavorata visibile — se è un blob liscio è FAIL anche con
tutti i gate numerici verdi.

## Rude-beauty life vocabulary (obbligatorio, 2026-10-28)

**Funghi** — mai amanita col puntino (cliché "puffi"). Scegliere da:
- Lactarius indigo — indigo/ultramarino
- Chlorociboria — calici turchese-veronese su legno marcio
- Sarcoscypha — calici scarlet su rami caduti
- Clavaria zollingeri — corallo amethyst
- Calocera — cornetti topazio/lime gelatinosi
- Mycena — micro-cluster ice-blue sul muschio

**Sottobosco vario** — mai "tutte felci scure". Mescolare ≥3 tipologie:
- basse: wood sorrel (trifoglio pallido), dog's mercury, ground ivy
- fiorite: bluebell, bugle (spighe blu), foxglove, sweet violet, wood anemone
- rampicanti/coprenti: bramble, ivy, honeysuckle, wild clematis
- erbe/grani: yorkshire fog (lanugine grigio-verde), soft rush, wood melick
- pungenti/strutturali: holly (aperto a roveto), horsetail

Regola: 1 massa dominante + 2-3 tipologie secondarie con colori diversi.

## Regola acqua/riflessi (Director, 2026-10-28)

In notturna e in ogni scena con corpi d'acqua: **l'acqua è lo specchio
della luce** — deve essere dichiarata esplicitamente brillante e
luminosa ("the river runs bright and luminous, mirroring the moonlight"
/ "catches the light source"). Mai lasciare l'acqua al buio del campo:
è la superficie che amplifica la chiave di luce e dà il secondo piano
luminoso.

## Vocabolario accenti notturni (Director, 2026-10-28)

- **fuochi fatui / will-o'-the-wisps**: sfere eteree che fluttuano
  lente — accento notturno preferito, più "di mondo" delle lucciole
- **lucciole**: scintille ambra-fredde in aria (cold-amber pinpoints)
- Regola materiali notturni: ogni materiale mantiene il COLORE della sua
  identità attenuato, mai sbiadito — paglia = oro smorzato lunare, non
  grigio; legno = umber profondo, non marrone-morto.

## Vegetazione/roccia in notturna (Director, 2026-10-28)

- Alberi: verde PROFONDO SATURO (emerald/veronese scuro) con rim d'argento
  lunare — il verde resta vivo, mai "blu triste" né spruce spento.
- Montagne/roccia: viola-ardesia o roccia calda attenuata con creste
  argentee — mai un monocromo blu: serve una seconda tinta dentro il
  materiale.

## Impasto come vettore di colore (Director, 2026-10-28)

L'impasto NON è decorazione: è il meccanismo con cui la famiglia porta
colore nelle superfici piatte. Ogni campo piatto è dichiarato come
"built from broken visible impasto strokes carrying neighboring hues"
— cielo = cobalto+violetto+teal a pennellate, mai gradiente liscio;
prato = verdi spezzati; acqua = tratti argento-turchese. Se una
superficie è liscia/gradiente, è un FAIL del registro RB.

## Varianti di famiglia (zero-shot > ancora) — prova empirica 2026-10-28

Per generare una variante della famiglia (notte/dusk/alba di una scena):
**prompt completo da zero**, non "same image" ancorato. La ref ancorata
trascina lo stile del pixel (incluse lisciature e debolezze); il prompt
completo impone il registro dichiarato. Verificato su villaggio-night
(zero-shot impasto 22.6 vs edit 17-21, composizione asimmetrica migliore)
e f1-night-zero (intera scheda notturna in un colpo).

## Momento `gloom` (penombra di bosco, Director 2026-10-28)

Quinto momento oltre dawn/day/golden/dusk/night: il buio della foresta
fitta DI GIORNO. La luce non è "assente" — filtra come lame/pozze calde
tra le chiome; l'ombra è la massa verde stessa. Soglie: green_lum>=8%
(i punti illuminati devono essere luminosi), min_val 0.22. Nel prompt
vietato vocabolario notturno (luna/aurora/argento): la luce è ambra
diurna in pozze, non argento lunare. Nei boschi: scuri SATURI veronese/
emerald + lame che portano luce — mai murk lavato.

## Fauna-gemma per scena (Director, 2026-10-28)

Ogni scena nomina 1-2 accenti di vita SPECIFICI (mai "uccelli/fiori"
generici). Vocabolario bosco:
- serpente corallo (bande ruby-gold-nero) — accento vip
- salamandra nera a pois citrine
- ragno/tela catturata da una lama di luce
- mantide su fiore amethyst
- scarabeo iridescente emerald-copper sul muschio
- farfalla sapphire, lucertola lime-veronese, lumaca a conchiglia
  ambra su tronco
- insetti/vita debbono stare sotto soglia di salienza: dettaglio
  ricompensa, non soggetto.
