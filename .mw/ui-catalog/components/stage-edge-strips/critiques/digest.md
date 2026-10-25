# Digest critiche — stage-edge-strips (round 1, 1/3 raccolta ma OFF-TARGET)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-stage-edge-strips`, turn T-001 (+retry T-002 chatgpt),
prompt verbatim R-282, 2 shot allegati (ctx-a, iso-0).

**Provider failure dichiarati:**

- **chatgpt** — `ATTACH_FAILED` ×2 (T-001, T-002). `chatgpt.md`.
- **claude** — quota free esaurita fino a 12:20 CET; nessun send.
  `claude.md`.

**Risposta raccolta:** deepseek (T-001 SUCCESS, 7.8k chars, italiano) —
verbatim in `deepseek.md`.

## ⚠️ Misread strutturale (flagged, non colpa del modello)

Il componente `stage-edge-strips` è un **layer fullscreen vuoto**
(`pointer-events:none`, `aria-hidden` quando non popolato): allo stato
`default` della capture c'erano `0` `data-hud-strip-tab` e `0`
`data-stage-rail` (documentato in `page.md`/`fixes.md`). Gli shot
mostrano quindi la **schermata del quest expedition planner** con il
layer invisibile sopra — e deepseek ha correttamente descritto ciò che
vedeva: «Roster a sinistra, griglia MARCHING ORDER al centro, pannello
Intel a destra, SEND EXPEDITION disabilitato».

Di fatto la critica riguarda **quest-expedition-detail**, non gli strip:
è sostanzialmente una seconda critica dello stesso schermo di
`quest-expedition-detail` (stessi fatti: 4 slot, BAG slots, Intel
"Amid smoke and flame", PRIMARY: STRENGTH).

**Contenuto recuperabile:** le osservazioni su pannello Intel "muro di
testo", slot vuoti senza affordance, CTA senza empty-state e ritratti
roster troppo piccoli sono valide — ma vanno accorpate al dominio di
`quest-expedition-detail`, non a questo componente.

**Perché non è un misread del modello:** il prompt dice "questo
componente" ma gli allegati non mostrano il componente (è invisibile
quando vuoto). Una critica grounded di stage-edge-strips richiede uno
shot dello stato *popolato* (pannello collassato → strip tab visibile;
wing squeezed → rail visibile) — driver non ancora implementato
(`fixes.md`: "optional assertion strengthening toward the populated
regime").

## Convergenza

N/A — unica risposta raccolta ed è off-target sul componente.

## Note operative

- Per un round 2 utile su questo componente serve: capture di uno stato
  popolato (collapse driver) OPPURE prompt che nomini esplicitamente i
  tabs/rails (violerebbe il vincolo prompt-verbatim).
- claude giù fino a 12:20 CET; chatgpt attach rotto tutto il giorno.
