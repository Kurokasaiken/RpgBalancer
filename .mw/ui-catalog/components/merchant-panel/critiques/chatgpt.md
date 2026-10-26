# DECLARED FAILURE — chatgpt

Provider: chatgpt — run `20261025-critique-merchant-panel`.

Nessuna critica prodotta. Due tentativi, entrambi falliti in fase di attach:

- **T-001**: send `ATTACH_FAILED` — "no upload affordance found" per
  `default-ctx-a.png` (failure bundle T-001-A-001-chatgpt).
- **T-002** (unico retry consentito): identico `ATTACH_FAILED`
  (failure bundle T-002-A-001-chatgpt).

Quinto episodio consecutivo del giorno di failure attach/percezione
immagini su chatgpt web. Nessun ulteriore retry per istruzione del
Director.

---

## Secondo pass serale (2026-10-25, PLAN-086 fill-gap)

- **T-003** (~21:01): `ATTACH_FAILED` — "no upload affordance". La quota
  upload, riapertasi per ~5 minuti (village-registry ricaricato con successo),
  era già esaurita. Probes di controllo a 22:04 e 23:05 su
  village-stash-panel: entrambe `ATTACH_FAILED` → declared blocked.
