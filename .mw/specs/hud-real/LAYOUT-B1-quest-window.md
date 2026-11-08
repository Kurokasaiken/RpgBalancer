# LAYOUT SPEC — B1 QuestRunWindow (v2, completa — dalla cattura produzione)

Ref produzione canonica: `refs/quest-window-production.jpg`. Tutte le 8 zone devono sopravvivere.

## Zone (top→bottom, dalla cattura reale)

| # | Zona | Contenuto vero | Note |
|---|---|---|---|
| 1 | **Title rail** | nome quest (serif grande) + 5 bottoni tondi dx (party, messaggi, log, minimizza, chiudi) | i bottoni sono controlli vivi |
| 2 | **Flavor line** | 1 riga corsiva sottotitolo | i18n |
| 3 | **Teatro** | scena dipinta ~45% altezza — visuale dominante | asset scena = pista scene-author separata |
| 4 | **Beat text** | paragrafo narrativo SCROLLABILE, scrollbar sul bordo dx | lunghezza variabile |
| 5 | **Indicator icons** | 2–4 icone tonde piccole (stato/loot/party) | opzionali per beat |
| 6 | **Choice plaques** | 1–3 placche numerate (badge n., label bold, riga effetto) | conteggio variabile |
| 7 | **Journey phase strip** | barra progresso segmentata + gambe OUTBOUND / xD AT SITE / ~xD RETURNING / xD + "AWAITING ORDERS" + "PHASE n OF 7" | fascia intera |
| 8 | **Action tiles** | 2–4 tile quadrate (SAFE/NOW/locked ?) + flag abbandono in basso dx | NOW = stato corrente |

## Stati di transizione (regola convergente multi-AI)
Scelte / skill-check / verdetto si scambiano in UNA zona fissa (Action Deck) — niente modal floating, niente dashboard permanente. Forecast/intel vivono solo dentro lo stato check.

## Regole
- Campi smalto scuro piani per contenuto vivo; ornamento solo su cornice/bordi
- Party ambient (medaglioni/rail), mai roster duplicato (GC-1 V2 intatto)
- Scroll/overflow come produzione; i18n su tutto; matrice stati min/tipico/max

## 9. Sotto-superfici aperte dai bottoni del title rail (v3 — da catturare)
I 5 bottoni aprono superfici/stati che fanno parte della base:
| Bottone | Apre | Contenuto |
|---|---|---|
| party | party in viaggio | resident assegnati alla run: nome/LV/HP/stato in transito, slot |
| messaggi | log/messaggi della run | eventi/beat passati della spedizione |
| scroll/log | diario/dettagli quest | testo quest, note |
| zaino | oggetti/consumabili portati | gli item della stash in uso (tile + qty) — si apre anche durante check per consumare |
| minimizza/chiudi | controlli finestra | collassa/abbandona |

**Cattura necessaria:** queste superfici aperte vanno screenshotate da produzione (stato reale) — come la cattura principale — così la spec copre anche gli stati aperti, non solo la vista idle.
