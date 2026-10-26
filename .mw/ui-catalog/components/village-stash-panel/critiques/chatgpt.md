# DECLARED FAILURE — chatgpt

Provider: chatgpt — run `20261025-critique-village-stash-panel`.

Nessuna critica prodotta. Due tentativi, entrambi falliti in fase di attach:

- **T-001**: send fallito con `ATTACH_FAILED` — "no upload affordance found"
  per `default-ctx-a.png` (failure bundle T-001-A-001-chatgpt).
- **T-002** (unico retry consentito): identico `ATTACH_FAILED`
  (failure bundle T-002-A-001-chatgpt).

Quarto episodio consecutivo del giorno di failure attach/percezione immagini
su chatgpt web (village-registry T-002, stash-panel T-001+T-002, più i due
episodi precedenti segnalati nel task). Pattern persistente: l'upload
affordance di chatgpt.com non è raggiungibile dal transport. Nessun ulteriore
retry per istruzione del Director.

---

## Secondo pass serale (2026-10-25, PLAN-086 fill-gap)

La finestra di quota upload si è riaperta verso le ~20:56 CET (il refill di
village-registry su run `-r2` è atterrato POSTED + grounded con 3 immagini) e
si è richiusa entro ~5 minuti. Nuovi tentativi su questo componente:

- **T-003** (~21:01): `ATTACH_FAILED` — "no upload affordance".
- **T-004** (probe 22:04): `ATTACH_FAILED`.
- **T-005** (probe 23:05): `ATTACH_FAILED` — secondo probe fallito, condizione
  di stop raggiunta: chatgpt ancora bloccato lato quota immagini.

Il componente resta senza critica chatgpt. Nessun retry ulteriore: la regola
"2 probe falliti → blocked" è stata applicata.
