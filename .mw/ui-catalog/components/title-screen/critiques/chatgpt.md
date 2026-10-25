# DECLARED FAILURE — chatgpt

Provider: chatgpt — run `20261025-critique-title-screen`.

Nessuna critica prodotta. Due tentativi, entrambi falliti in fase di attach:

- **T-001**: send fallito con `ATTACH_FAILED` — "no upload affordance found"
  per `default-ctx-a.png` (failure bundle T-001-A-001-chatgpt). Il DOM
  catturato mostra il composer ridotto (solo "Pensa"), nessun affordance
  upload raggiungibile.
- **T-002** (unico retry consentito): identico `ATTACH_FAILED`
  (failure bundle T-002-A-001-chatgpt).

Pattern persistente del giorno sull'attach immagini di chatgpt web
(village-screen-view T-001+T-002, stash-panel T-001+T-002, pixi-world-map
con quota upload free-tier esaurita). Nessun ulteriore retry.
