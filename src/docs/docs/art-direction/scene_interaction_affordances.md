# Scene Interaction Affordances — catalogo (v1, 2026-10-24)

Fonte: R-278 + ricerca `2026-10-24-scene-variants-and-reveal`. Ogni scena
può ospitare UNO o più affordance — dichiarati nel brief (campo
`interaction hooks`) accanto ad archetipo/shot/ambient. Il prompt deve
dipingere ciò che l'affordance richiede: un segreto cliccabile va dipinto
*leggibile-ma-camuffato*, non nascosto del tutto (se non si trova mai, non
è un affordance — è un easter egg frustrante).

## Il catalogo

| # | Affordance | Il player… | Il gioco restituisce | Il prompt dipinge | Costo |
|---|---|---|---|---|---|
| A1 | **Discovery bonus** | clicca il segreto prima del reveal auto | bonus sul check collegato (PER→stealth, vantaggio tattico) | il segreto leggibile-se-visto (sagome, filo, riflesso anomalo) | T1 |
| A2 | **Hidden object** | trova un oggetto dipinto (fagotto, arma, indizio) | l'oggetto entra nel loot/inventario o sblocca info | l'oggetto a un terzo, semi-visibile | T1 |
| A3 | **Intel unlock** | clicca un dettaglio che dà informazione | sblocca un'opzione nel choice seguente ("ho visto la via di fuga") | il dettaglio intel chiaramente dipinto | T1 |
| A4 | **Wrong-spot cost** | tocca qualcosa che non doveva | la scena "reagisce" male (foglia cade, gufo spaventato → guardia si volta) | l'elemento fragile presente | T1 |
| A5 | **Foreshadow pickup** | nota un dettaglio che tornerà | payoff più tardi (hai visto le impronte → sai la direzione) | il dettaglio riutilizzabile a beat successivi | T0 |
| A6 | **Sequence order** | scopre in ordine (filo → sentinella → campo) | bonus crescente o check semplificato | i punti in relazione visiva | T1 |
| A7 | **Persistent mark** | lascia una traccia | la scena rivisitata mostra il segno (forziere aperto, trofeo appeso) | slot di stato dipinto o delta plate | T2 |
| A8 | **Timed pressure** | ha poco tempo per trovare | se tarda, il reveal auto fa comunque ma senza bonus | il segreto + ambient che segnala il tempo | T1 |

## Regole d'uso

- **Un affordance per scena di default** — due solo se uno è T0
  (foreshadow) e l'altro è la meccanica principale.
- **Il segreto dipinto deve esistere davvero** — niente hotspot su
  vuoto: se il click premia, il dipinto deve contenere la cosa
  trovabile. Regola anti-frustrazione: chi non trova non deve pensare
  "era impossibile".
- **L'affordance serve il beat** — non si decora una scena con un
  minigioco se il beat non lo chiede: l'agguato = scoprire le sagome
  (A1/A3); il bottino = non toccare prima di disarmare (A4) o trovare
  il fagotto (A2); le tracce = foreshadow (A5).
- **Gameplay coupling**: il bonus si scrive come flag consumabile dal
  check (`revealedAmbush` → +percezione/stealth, `lootUntouched` →
  niente trappola, `sawEscape` → opzione sbloccata). Config-first:
  i valori bonus stanno nel config della quest, non nel manifest FX.
- **Cosa il prompt DEVE chiedere** (correlazione, come archetipo):
  A1/A3 → il segreto ha contorno leggibile a mezza occhiata, mai
  completamente invisibile; A2 → l'oggetto ha un colore/lume che lo
  distingue dal fondale; A4 → l'elemento fragile ha segnali di
  fragilità (foglia secca, volatile posato); A6 → i punti formano una
  linea logica; A7 → lo slot è dipinto "vuoto" nella versione base.
