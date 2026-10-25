# DECLARED FAILURE — chatgpt

Provider: chatgpt — run `20261025-critique-village-registry`.

Nessuna critica prodotta. Due tentativi, entrambi falliti lato transport/percezione:

- **T-001**: send POSTED con `image_attached: 3`, ma la conversation URL registrata
  era `https://chatgpt.com/c/local-chatgpt%3A…` (conversazione locale non persistita);
  il collect è atterrato su `https://chatgpt.com/` → `CONVERSATION_MISMATCH`,
  risposta scartata.
- **T-002** (unico retry consentito): send fallito con `ATTACH_FAILED` —
  "no upload affordance found" per gli screenshot. Terzo episodio del giorno di
  failure image-perception/attach su chatgpt web (pattern già osservato su
  nav-bar e hud-top-tabs); nessun ulteriore retry per istruzione.

Errore T-002 verbatim: 'no upload affordance found for /Users/faustoboni/progetti_personali/RPG/.mw/ui-catalog/components/village-registry/shots/V1/default-ctx-a.png'
Errore T-001 verbatim: 'collect landed on https://chatgpt.com/, expected https://chatgpt.com/c/local-chatgpt%3Ae1abd53e-7240-4268-8449-b16139339f38 — response discarded.'

Failure bundle: `.mw/runs/20261025-critique-village-registry/failures/T-002-A-001-chatgpt`
(mind-weaver repo).
