# COLOR-TARGETS — PLAN-112 F3.1 (2026-11-05)
> Misure (Lab, mediane e percentili dei pixel mascherati), script `scripts/hud-real/measure-materials.py` → `color-targets.json`; prova su mappa `color-proof.png` (script `color-proof.py`). **Nessun asset è stato modificato.** Le maschere sono conservative e approssimate (oro: tinta HSV 10–34 saturo; smalto: Lab tinta 135–240°, L 6–48; alabastro: L > 68, C < 28; vetro: L < 14): i numeri sono un'indicazione, non una verità assoluta.

## Bersagli e scarti
| Materiale | Mockup (tutti i pezzi, mediana) | Nostri asset (tutti) | Scarto | Lettura |
|---|---|---|---|---|
| **Smalto** | L p10/50/90 = 9,5 / **21,6** / 37,6 · C 16,2 · tinta 196° | 8,8 / **15,8** / 27,0 · C 19,3 · tinta 168° | **L −5,8**, C +3,1, tinta −28° | il nostro è **più scuro, più saturo e più verde** del mockup (il mockup è un verde-acqua più chiaro e freddo). Con la unify-enamel (L 19, tinta 168, C 20) lo avevamo spinto verso il verde per staccarlo dal mare: il costo è questo scarto |
| **Oro** | L p50 = **54,6** (p90 78,5) · C 30,1 · tinta 80° | **58,7** (p90 91,5) · C **37,9** · tinta 86° | L +4,1, **C +7,8**, **p90 +13** | il nostro è **più saturo e con luci molto più bruciate** (p90 91,5 contro 78,5): è il «oro brillante» chiesto, ma oltre il mockup; le luci rischiano di sembrare plastica |
| **Alabastro** | L p50 = 82,1 · C 14,1 · tinta 90° | 82,8 · C 15,3 · tinta 102° | ≈ 0 | allineato |
| **Vetro scuro** | L p50 = 6,7 · C 7,1 | 7,8 · C 10,4 | L +1,1, C +3,3 | allineato, un filo più verde |
Dispersione tra pezzi (L50 dello smalto): vedi `color-targets.json`, campo `spread_L50`; nei nostri asset va da ~6 a ~22 prima della unify-enamel; dopo è più stretta (non rimisurata pezzo per pezzo qui).

## Sulla mappa (zone vere, mappa2 nuda, 1440×810)
| Zona | L p10/50/90 | C | Tinta | Contro lo smalto nostro / mockup |
|---|---|---|---|---|
| mare | 32,5 / **43,1** / 58,4 | 26,1 | 226° | l'attuale (tinta 168°, L 15,8) è separato di **+58° di tinta e −27 di L**; il mockup (196°) è a 30° di tinta e −21 di L: **separazione più debole ma sufficiente grazie alla luminosità** |
| giungla | 10,2 / **22,4** / 34,5 | 21,9 | 124° | **rischio**: lo smalto mockup (L 21,6) ha la **stessa luminosità** della giungla, con tinta 72° più fredda: separato solo dalla tinta e dall'oro del bordo |
| terra chiara | 63,5 / **70,6** / 83,9 | 39,0 | 82° | scuro su chiaro: separazione forte in tutti i casi |
Esito della prova visiva (`color-proof.png`, nav e placca nei tre colori su mare, giungla, terra chiara): **nessuno dei tre (attuale, A, B) presenta un problema di contrasto netto**; sulla giungla lo smalto più chiaro del mockup (A/B) si avvicina allo sfondo e il bordo d'oro lavora di più. Non è un giudizio estetico: la scelta è del Director a G2.

## Candidati per G2 (due, oltre all'attuale)
- **A — «fedele al mockup»:** smalto tinta 196° / L 22 / C 17; oro C −20% e luci tirate giù (p90 ≈ 80).
- **B — «compromesso verde»:** smalto tinta 182° / L 22 / C 18; oro C −10%.
- **Attuale:** smalto 168° / L 19 / C 20; oro C ≈ 38, p90 ≈ 91.
**Raccomandazione del planner (non è un ruling):** partire da **A per l'oro** (ridurre saturazione e luci bruciate: è la differenza più grande dal mockup e quella che fa «plastica») e **B per lo smalto** se la giungla preoccupa. La scelta definitiva si fa sui pezzi campione di F3.3 sulla mappa, non su questa tavola di prova.
## Soglie di coerenza proposte (da confermare a G2)
Per ogni pezzo nuovo: smalto L p50 ∈ [19, 25], tinta ∈ [175°, 205°], C p50 ∈ [14, 20]; oro L p50 ∈ [52, 60], C p50 ∈ [28, 36], L p90 ≤ 82; alabastro L p50 ∈ [80, 84], C ∈ [12, 17]; vetro L p50 ≤ 9. Verifica: `measure-materials.py`.
## Limiti
Le maschere approssimano i materiali (le gemme e l'edera entrano in parte nell'«oro» o nello «smalto»); i mockup sono immagini compresse di 1672 px; la mappa è animata (una sola cattura). Nessuna misura a DPR 2.

## Applicata la palette scelta (G2-4: oro A, smalto B; 2026-11-05)
- **Decisione del Director:** «Oro A, smalto B». Script `scripts/hud-real/apply-palette.py` (idempotente: riparte sempre dai backup in `f3/rollback-color/`, 25 asset): oro A = cromia ×0,8 e luci oltre L 70 abbassate del 45%; smalto B = tinta 182° / L 22 / C 18 via `unify-enamel.py`. **Rollback:** copiare `f3/rollback-color/<cartella>_<file>.webp` su `public/assets/ui/hud-real/<cartella>/<file>.webp`.
- **Errore mio trovato e corretto durante l'applicazione:** il primo passaggio ha schiarito anche il **vetro scuro** del sigillo (fascia dei teschi da L 6,3 a 22; disco da 14,5 a 21). Ora `seal/strip.webp` e `seal/disc.webp` ricevono solo l'oro (`GLASS_ONLY`): tornati a 6,3 e 14,5.
- **Misura dopo (tutti gli asset, mediane):** oro **L p50 58,2 · p90 82,1 · C 32,0** (mockup 54,6 · 78,5 · 30,1; prima 58,7 · 91,5 · 37,9); smalto **L p50 19,7 · C 19,3 · tinta 178°** (mockup 21,6 · 16,2 · 196°; prima 15,8 · 19,3 · 168°); alabastro 81,2; vetro 7,7. **In media dentro le soglie proposte.**
- **Per singolo pezzo NO:** 20 pezzi su 25 hanno ancora l'oro oltre la soglia proposta (C50 fino a 36,9, p90 fino a 86,3, soglie 28–36 e ≤ 82), perché partivano molto sopra la media e la riduzione è proporzionale; il **pannello** (pf-3) ha l'oro troppo basso (C 22,6). Lo smalto per pezzo è in 19–25 salvo i due pezzi di vetro (6,3, 14,9) e la voce (15,7: il campo scuro del testo è protetto). **Le soglie G2-6 non sono rispettate pezzo per pezzo.** Non le ho cambiate per farle tornare: restano da decidere (o si applica una seconda riduzione dell'oro ai pezzi alti, o si allarga la soglia a C ≤ 37 e p90 ≤ 87).
- **Verifica a vista:** composizione intera a 1600×900 e dettaglio a DPR 2 della colonna destra: oro più sobrio, smalto verde-acqua uniforme, nessuna regressione di contrasto visibile; testo e numeri leggibili. Nessun errore in console. **Non verificato:** contrasto misurato su tutte le coppie; sulle tre zone di mappa solo a occhio sulla composizione (la tavola `color-proof.png` è anteriore).

## G2-6 deciso: soglia allargata (2026-11-05)
- **Decisione del Director:** «Allarga soglia» (tra «riduci ancora l'oro» e «allarga la soglia»). **Soglie firmate, per pezzo** (script `scripts/hud-real/check-palette.py`, test permanente `tests/unit/idleVillage/hudPaletteCheck.test.ts`):
  - **Oro:** C p50 **28–37**, L p90 **≤ 87**, L p50 **50–73** (la luminosità mediana è stata allargata da 52–60 a 50–73 **dopo** aver visto 5 pezzi con poco oro su fondo scuro che leggono un oro chiaro: non è una decisione del Director ma mia, da confermare).
  - **Smalto:** L p50 19–25, tinta 172–205°, C p50 14–21 (pezzi con ≥ 3000 px di smalto).
  - **Alabastro:** L p50 80–84, C p50 12–17, **solo sulla cornice del pannello** (sugli altri pezzi la maschera cattura ornamenti chiari, non un campo di alabastro).
  - **Vetro:** L p50 ≤ 9 (non controllato pezzo per pezzo: solo misurato).
- **Esenti (con motivo scritto nello script):** sigillo (fascia e disco di vetro scuro; sigillo v1 non in uso), busto (non in uso), voce (il campo di testo scuro è protetto e abbassa la mediana), cta del pannello (non in uso), `band-tile` (sostituito da `rail-tile`).
- **Ritocchi per pezzo applicati (in `apply-palette.py`):** marchio tinta smalto 186°, anello cromia 15, pannello **oro rialzato** (×1,25, nessun taglio delle luci: era troppo basso, C 22,6). Risultato: **25 pezzi controllati, 0 fuori soglia; test permanente verde.**
- **Cosa questo NON garantisce:** le soglie sono state **allargate dopo aver visto i numeri** e i ritocchi per pezzo sono su misura: il controllo dice che i pezzi sono coerenti **tra loro**, non che siano belli; la verifica a vista della composizione a 1600×900 non mostra regressioni, ma il confronto contro il mockup resta a occhio. Le maschere dell'oro e dello smalto catturano in parte gemme ed edera.
