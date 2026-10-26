# quest-reward-popup — fixes

## Diagnosi dei driver (2026-10-26)

Build congelata `c6600bc1` (dopo la fusione del fix TDZ), `vite preview` su
`127.0.0.1:5199`, reduced-motion, 1440×900. Il documenter chiama il nodo
`GAME_SURFACE_GRAPH` corrispondente; quando il nodo lancia, il documenter
lo registra come «driver unreachable/unimplemented».

Prova diretta del nodo `S10_QuestSkillCheckArmed` (276 s):
- `demoLaunch` apre la finestra quest; il driver avanza i beat con Enter,
  clicca le scelte e avanza i tick;
- **la colonna del tiro (`quest-check-column`, `.da-tira`) non compare mai**;
- la spedizione arriva alla fine con **wipe** («Nobody came back») e si apre il
  rapporto di spedizione: `quest-window` presente, nessun errore di pagina,
  nessun ErrorBoundary.

Ipotesi da verificare (non verificate): (a) Enter sul beat che contiene il
check lo salta (`cursor.skip`), quindi il presenter non monta mai; (b) con
reduced-motion il check scorre come beat a tempo; (c) regressione reale del
gioco. Prova: `evidence/diag-2026-10-26-wipe-report.png` in
`quest-reward-popup` (cattura diagnostica, **non** uno shot V1).

Fix proposto: driver che attende `quest-check-column` senza premere Enter
sui beat di tipo check; ripetere con `reducedMotion: no-preference`.

