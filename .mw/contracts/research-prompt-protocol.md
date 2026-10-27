
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
