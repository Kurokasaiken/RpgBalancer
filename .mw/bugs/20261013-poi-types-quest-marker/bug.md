# BUG — /game: «POI types» non mostra il POI quest dorato

**Data:** 2026-10-13
**Segnalazione (verbatim Director):** *"in /game quando in director clicco su POI types nn esce quello d'orato delle quest, che dovrebe far partire quando cliccato la schermata di preparazione alla quest"*

## Passi per riprodurre

1. `npm run dev`, aprire `http://localhost:5173/game`.
2. F10 → Director panel.
3. Click «POI types» (`[data-action-id="poitypes"]`).

## Comportamento attuale (riprodotto live via Puppeteer)

- «POI types» monta solo i 2 marker demo (job + event); nessun POI dorato.
- Il POI dorato reale (`poi-goblin`, `poi-rovine`) compare solo con «Show quest»
  (`[data-action-id="quest"]`).
- Click sul POI dorato → `quest-expedition-detail` (schermata di preparazione)
  si apre correttamente.

## Comportamento atteso (Director)

«POI types» = rassegna della famiglia di marker: deve comparire ANCHE il POI
dorato delle quest, e cliccandolo deve aprirsi la schermata di preparazione.

## Storia / vincoli

- R-129 (2026-10-11): il Director chiedeva il POI quest sotto «POI types» come
  le altre 2.
- R-143 (2026-10-12): «un marker quest non è mai un esemplare demo» — l'esemplare
  goblin finto è stato tolto da `poiDemo`; «Show quest» ripristinata come gate
  dei POI reali.

## Fix scelto

`poiDemo` rivela anche i marker quest REALI (gate `questShown || poiDemo`):
il dorato sotto «POI types» è l'offerta vera (non un esemplare finto → R-143
rispettato) e il click apre il vero `QuestExpeditionDetail`.

## File coinvolti

- `src/pages/game-frame-pixi.tsx` — gate anchor + extraEvents + commenti.
- `src/docs/docs/testing/e2e_game_quest_lifecycle_guide.md` — nota R-143.
- `RICHIESTE.md` — voce R-180.
