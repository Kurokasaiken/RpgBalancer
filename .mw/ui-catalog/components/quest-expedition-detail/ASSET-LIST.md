# Planner «Dispatch Table» — elenco degli asset da produrre

Stato: **proposta per il Director, 2026-10-27**. Nasce dai mockup B5–B8. Nessun asset è ancora nel registro (`src/docs/docs/art-direction/icons/registry.yaml`) né generato.

## Come si produce (pipeline che esiste già)
- Livello **dipinta** (oggetti, bibbia §11 e `hud_component_guide.md` §11b): un soggetto per icona → `scripts/gen-icon-prompts.py` incolla il blocco di stile (`prompt_kit.yaml`, bronzo consumato + lacca teal, luce in alto a sinistra) → 3 candidati (GPT / Gemini / Grok) → scelta del Director → taglie 512 / 128 / 64 / 32 in `public/assets/ui/...` → voce nel registro (`needed → prompted → candidate → approved`).
- Livello **incisa** (comandi, navigazione, ruoli, stato): glifi SVG a 24 px in `engravedIcons.tsx`, un colore, niente teschi (regola D3).
- Regole del kit: soggetto simmetrico, ~80% del quadrato, deve reggere a 24 px e in scala di grigi; niente raggi, crepe, anelli, rigature; nessun testo nell'immagine; niente marrone, niente viola nella UI.
- Oggi nel registro: 19 icone (15 approvate: POI, minacce, oro/cibo/legna; 4 medaglioni del tempo ancora «prompted»).

## Priorità 1 — serve per rifare il planner (≈ 22 asset)

### A. Verdetto: il riquadro «% vittoria / pericolo» (sostituisce il quadratino scuro)
Proposta: due **sigilli** (oggetti dipinti, famiglia «medaglione» come quelli del tempo), non un riquadro. Niente scritte: le icone portano il significato, il numero sta nel sigillo.
| # | Asset | Note |
|---|---|---|
| 1 | Cornice del sigillo (anello d'ottone + campo lacca) | una sola, riusata dai due sigilli e dalle quattro fasce |
| 2 | Emblema **vittoria** | **deciso 2026-10-27: due spade incrociate su una corona d'alloro** (deroga `laurel-1`); sostituisce «Chance of victory» |
| 3 | **Teschio** del pericolo (uno solo) | **deciso 2026-10-27: cinque teschi in fila**, accesi = grado, spenti = la stessa immagine attenuata dal gioco (deroga `skull-1`). Al posto dei trattini e della parola «High». Sostituisce i 4 artigli |
| 7 | (opzionale) Tavola dei numeri: cifre 0–9 e «%» in metallo/lacca | solo se il numero in Cinzel verde continua a non piacere; altrimenti si lavora con il carattere e un filo d'ottone |

### B. Statistiche (6 + 1)
Corrispondenza voluta con il Balancer (danno, TxC, evasione, punti vita…). Oggi sono emoji di sistema (⚔️ 🎯 🌀 ❤️) o lucide: non vanno bene in gioco.
| # | Asset | Statistica del motore |
|---|---|---|
| 8 | Forza | `str` ← danno |
| 9 | Percezione | `perc` ← TxC |
| 10 | Destrezza | `agi` ← evasione |
| 11 | Costituzione | `con` ← punti vita |
| 12 | Intelligenza | `int` (canale finto, senza stat del Balancer) |
| 13 | Carisma | `cha` (specchia Intelligenza) |
| 14 | Pietra sigillata «?» (statistica ancora da scoprire) | stessa famiglia, per le secondarie nascoste |

### C. Ricompense (elenco completo, per categoria)
Voci reali che la quest goblin può dare (da `goblin.ts`, `questItems.ts`): oro (trofeo, +12 dal bottino), legna, cibo, equipaggiamento (arma, armatura, ciondolo, cavalcatura), titoli d'epilogo («Goblin Exterminators»). Il Director ha chiesto anche abilità e personaggi nuovi.
| # | Asset | Stato |
|---|---|---|
| — | Oro, legna, cibo | **esistono** (`res-gold`, `res-wood`, `res-food`) |
| 15 | Ferro (risorsa) | fuori registro, decisione aperta di PLAN-058 |
| 16 | Arma | nuovo |
| 17 | Armatura | nuovo |
| 18 | Ciondolo / gioiello | nuovo |
| 19 | Cavalcatura | nuovo |
| 20 | Abilità (pergamena o sigillo di tecnica) | nuovo; `ico-scroll` inciso esiste ma non basta come premio |
| 21 | Nuovo compagno (testa con cappuccio o bandiera) | nuovo |
| 22 | Titolo (alloro o corona) | nuovo |
| 23 | Casella «ricompensa nascosta» (pietra «?» come le statistiche) | nuovo |

**Dove mostrarle** (proposta, da decidere): una riga di caselle con icona + quantità sotto la descrizione, **una casella per ogni ricompensa certa**; quando sono più di quattro, le ultime si raccolgono in «+N» che apre un riquadro con l'elenco completo. Le ricompense che nascono da un nodo nascosto (come il bottino di guerra) compaiono come pietra «?» finché non sono scoperte: stessa logica delle statistiche sigillate, e niente spoiler.

## Priorità 2 — borsa e oggetti (≈ 14 asset)
I 12 oggetti reali di `questItems.ts`, oggi mostrati con glifi incisi o emoji. Quelli che compaiono nel planner della goblin sono i primi tre.
| # | Oggetto (id) |
|---|---|
| 24 | Bonus Forza (`quest_consumable_forza`) |
| 25 | Bonus Percezione (`quest_consumable_percezione`) |
| 26 | Pozione di cura (`quest_consumable_pozione`) / Cura (`quest_consumable_cura`) |
| 27 | Fumogeno |
| 28 | Corda |
| 29 | Infuso curativo (`quest_consumable_healing_draught`) |
| 30 | Moneta fortunata |
| 31–34 | Lama di ferro, armatura pesante, stendardo del guardiano, cavallo da tiro (condivisi con le ricompense: stessi file di 16–19) |
| 35 | Casella della borsa (castone vuoto + distintivo della quantità) |
| 36 | Icona della borsa (bisaccia dipinta; oggi `ico-pouch` incisa) |

## Priorità 3 — dopo il planner
- Quattro **fasce di pericolo** anche sulla mappa e nel rapporto finale (riuso dei 4 emblemi).
- Stelle della ricchezza: oggi stella disegnata in CSS; solo se non convince, stella dipinta piena e vuota.
- Illustrazioni di copertina per le altre quest (Rovine, Cassa): `totem-goblin` esiste.

## Non servono asset nuovi
- **Ghiera dello slot**: si migliora con tre valori di geometria (medaglione 52 px, denti 9, medaglione che resta in pressione), vedi `v8-B8-bezel.png`.
- Icone dei ruoli (capo, compagno, esploratore, guardia del corpo): esistono incise.
- Pulsanti, targhette, righe: lacca e ottone, nessuna immagine.

## Totali e costi (stime mie, non misurate)
- **≈ 36 asset unici**, 22 in priorità 1.
- Con tre candidati per icona sono circa 108 immagini da generare e vagliare; la scelta resta del Director.
- Ordine suggerito: prima i **sigilli e il pericolo (#1–6)** perché sono la parte più visibile, poi le **6 statistiche (#8–14)**, poi le **ricompense (#15–23)**.

## Decisioni che servono prima di generare
1. Soggetto dell'emblema **vittoria** (lama con alloro? vessillo? altro).
2. Sigilli al posto del riquadro: sì o no.
3. Statistiche: dipinte (come oro e legna) o incise (come i comandi). Il parere qui è **dipinte**, perché nel planner sono grandi (40–60 px).
4. Ferro: entra nel config canonico o no.
5. Ricompense: riga di caselle con «+N» e pietra «?» per i nascosti, come proposto sopra.
