# Digest critiche — memorial-panel (round 1, 1/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-memorial-panel`,
turn T-001 (+**refill claude T-002** post-reset quota 12:20, stessa run,
nuova conversazione bound, 2 shot: default-ctx-a, default-iso-0),
prompt verbatim R-282, 3 shot al mattino (default-ctx-a, default-ctx-b,
default-iso-0).

**Provider failure dichiarati (2/3 restano):**
- **chatgpt** — `ATTACH_FAILED` ("no upload affordance found", 145s):
  fallimento sistematico account Free, quota upload immagini esaurita.
- **deepseek** — 5 tentativi fisici su T-001, tutti failure di
  trasporto/infrastruttura sotto browser condiviso congestionato
  (~190 target CDP da worker paralleli): tab mai attachato, ATTACH_FAILED
  sulla 3a immagine, composer selector mancante dopo attach, CDP timeout
  120s, target chiuso mid-attach, infine binding avvelenato
  (`conversation_url = home`) — gap di tooling documentato in `deepseek.md`.
- ~~**claude**~~ — RECUPERATO al refill T-002 (12:38 CET): al mattino il
  composer era assente (pausa quota fino alle 12:20). Verbatim grounded in
  `claude.md` (~13.4k chars).

Unico provider image-grounded: **claude** (fatti corretti: «No one has
fallen yet.», bottone dorato "Cancel" sulla riga del titolo, pannello
a striscia ~4:1 al centro mappa, HUD Food a 0 con bordo rosso dietro).

## Punti della critica (claude, unico grounded)

1. **Gerarchia invertita (P0)** — «il bottone dorato con bevel è l'oggetto
   più saturo dello schermo… un gioco ha un solo "gold-fill" per
   schermata, riservato alla decisione che conta»; rif. all'empty-state
   guideline (no CTA primario negli stati vuoti) e al caso "Press F to
   Pay Respects" (l'azione in primo piano svuota la scena).
2. **"Cancel" è la parola sbagliata (P0)** — «non c'è niente da
   annullare… un dialogo solo informativo con un unico bottone di
   chiusura non annulla azioni» (rif. W3C); mancano X, hint Esc/B,
   click-fuori.
3. **Empty state che non lavora (P0)** — la riga è bella ma sola:
   «spiegare a cosa serve lo stato, perché lo si vede e cosa si può fare
   dopo»; lo stato vuoto qui è una buona notizia e non è trattato come
   tale (rif. memorial wall XCOM).
4. **Posizione/layering (P1)** — galleggia al centro senza scrim né
   ancoraggio; con Food a 0 dietro, «il componente deve decidere se è
   un'interruzione o una consultazione» → consultazione: non-modale,
   scrim sotto l'HUD, HUD cliccabile. Progettare per lo stato PIENO.
5. **Proporzioni da toast (P1)** — striscia 4:1; un memoriale merita
   altezza e vuoto; i18n lunga schiaccia il bottone in riga.
6. **Tipografia (P1)** — titolo con stesso trattamento delle label HUD;
   corpo corsivo ~12-13px (Xbox: ≥18px corpo a 1080p; WCAG 4.5:1).
7. **Nessun emblema/materiale (P2)** — manca un segno (stele, cairn,
   candela) che lo renda «un posto»; gradiente vettoriale liscio contro
   la mappa ink-and-watercolor.
8. **Nessuna struttura per i contenuti reali (P2)** — niente riga-tipo
   del caduto (nome, ruolo, giorno, causa) né scroll.

## Soluzioni proposte (claude)

- Pannello 480px non-modale con scrim-vignetta sotto l'HUD; X 40px +
  Esc + click-scrim, ghost "Close" (mai "Cancel"); bottom-sheet su
  390×844.
- Titolo 18px tracking moderato, riga principale serif 18px non corsivo,
  contesto 14-15px, contrasto ≥7:1; emblema inciso + filo ornamentale.
- `MemorialPanel.tsx` React completo (focus management, restore focus
  all'opener, `role="dialog"`), stato pieno con lista scrollabile
  (giorno/nome/ruolo/causa/epitaffio).

## Raccomandazione residua

Con un solo provider grounded non c'è convergenza misurabile: i punti
sopra sono la singola critica claude. Se si vuole il parere di deepseek,
va ripetuto il dispatch quando il browser condiviso non è saturato (la
quota claude è rientrata e usata; chatgpt resta senza upload immagini).

## Note

- Nessun disaccordo registrabile: un solo provider grounded.
