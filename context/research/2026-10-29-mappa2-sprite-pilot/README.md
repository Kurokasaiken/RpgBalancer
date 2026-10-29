# Pilota di stile A2 — stormo su mappa2 (Gemini web, 2026-10-29)

Primo asset della sezione A prodotto in sessione. Obiettivo: verificare che lo
stile dipinto regga su sprite piccoli PRIMA di produrre il resto (ordine
consigliato in `plans/ASSETS-mappa2.md`). **Niente è integrato: attende
battesimo Director.**

## Pipeline usata

- `scripts/gen-mappa2-sprite.mjs` (nuovo, durevole): Playwright su Chrome CDP
  :9222 → nuova chat Gemini per famiglia → attach ref → prompt → capture per
  incremento `GENERATED-IMAGE` → download bottone / canvas-read fallback.
- Ref: `refs/meadow-forest-ref.png` (crop prateria+foresta da `base_flat.webp`).
- Cut magenta → alpha con la stessa logica di `scripts/mount-icon.py`.

## Bug trovati e fissati nel runner

1. `locator.first` è un **metodo** in questa versione di Playwright → ogni
   selettore falliva in silenzio. Fix: `.first()` ovunque.
2. **Prompt spezzato dagli `\n`**: `keyboard.type` manda un messaggio per riga
   (Enter = invio). Solo la prima riga arrivava → generazioni fuori spec
   (ranger, tileset, drake). Fix: prompt appiattito a riga singola.
3. Rilevamento immagini generate: usare `GENERATED-IMAGE`/`SINGLE-IMAGE`
   (custom element, locale-agnostico), non `img` generici (avatar inclusi).
4. Download bottone `saveAs` va in ENOENT su CDP a volte → fallback canvas.

## Candidati prodotti (chat `d421750996f038c5`)

| File | Contenuto | Note |
|---|---|---|
| `a2-stormo-v4-0.png` | uccello singolo, vista 3/4 con petto ambrato | design battezzabile come base |
| `a2-stormo-v5strip-0.png` | 6 pose, vista dall'alto, stesso uccello | strip consistente ottenuta dopo lock del design + edit ancorato |
| `a2-pose-1..6.png` | pose ritagliate con alpha | pose 1 e 3 simili; ciclo usabile 1→2→4→5 |
| `a2-sticker-test.png` | 6 pose a 14px su patch mappa | **quasi invisibili** |
| `a2-size-compare.png` | stesso uccello a 14/20/26px | leggibilità ok solo da ~20px |
| `a2-flightline-20px.png` | 4 pose a 20px su foresta | si legge "qualcosa che vola" |

## Finding di stile (il vero esito del pilota)

1. **Stile: PASS.** La tecnica dipinta regge — pigmenti saturati, niente
   adesivo (diversamente dai vecchi birds ardesia di `atmosphere/`).
2. **Taglia spec troppo piccola.** A 10–14px (spec PLAN-097) l'uccello è un
   puntino che scompare. **Proposta: 20–24px in mappa** (chiome ~40px, un
   uccello = mezza chioma si legge ancora come lontano). Decide il Director.
3. **Vista dall'alto = camuffamento.** Il dorso teal sparisce sul verde;
   la vista 3/4 col petto ambrato si legge molto meglio. Proposta: vista
   dall'alto ma con accento caldo sul dorso/coda (wing-bar ambrata o flash
   chiaro), oppure spawn preferenziale su prateria/fiumi e non sulla selva.
4. **Metodo di generazione che funziona:** (a) blocco del design con un
   singolo soggetto, (b) edit ancorato nella stessa chat per la strip di pose.
   "sprite sheet"/"animation strip" come termine → produce concept-sheet con
   titoli/griglie: da evitare nel prompt.
5. Le pose Gemini non sono a celle uniformi: il montaggio atlante richiede
   ritaglio per componenti (già fatto: `a2-pose-*.png`).

## Prossimi passi (se battezzato)

- Edit ancorato per strip definitiva (8 pose volo + 3 decollo + 3 atterraggio)
  con accento caldo sul dorso, poi montaggio atlante a celle uniformi.
- Stessa pipeline per A3 (coda di balena), A4 (sirena), A5–A7.
- Decisione Director: taglia in-mappa, specie A1 (branco fantasy), mapping
  `coral_reef`→Prismatic.

## A3 — coda di balena lontana (2026-10-29)

Chat `561738eb981e7a02`, ref `refs/sea-open-ref.png`.

- `a3-whale-v1-0.png` — design: pinna blu-grigia, cirripedi, riflessi teal. PASS stile.
- `a3-whale-v3strip-0.png` — strip 7 pose emersione→tuffo (richieste 8: Gemini
  tende a darne 7 e le pose si toccano ai bordi → ritaglio a box manuali
  `a3-pose-1..7.png`, perdita minima sulle punte).
- `a3-emerge-cycle-35px.png`, `a3-size-compare.png` — a 30–40px leggibile e non
  adesivo: spec confermata. Attende battesimo Director.

**A3 BOCCIATA** (Director 2026-10-29): design+strip archiviati, non integrati.
