# Digest critiche — game-boot-screen (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-game-boot-screen`, turn T-001 (+retry T-002 chatgpt),
prompt verbatim R-282, 2 shot allegati (ctx-a, ctx-b; nessun iso shot in
V1).

**Provider failure dichiarati:**

- **chatgpt** — `ATTACH_FAILED` ×2 (T-001, T-002). `chatgpt.md`.
- **claude** [RECUPERATO v. merge] — quota free esaurita fino a 12:20 CET; nessun send.
  `claude.md`.

**Grounded:** solo deepseek (T-001 SUCCESS, 7.6k chars, italiano).
Verbatim in `deepseek.md`. Fatti corretti: schermata boot con logo
centrale + «Preparing the world» + barra di caricamento lineare; HUD con
Oro 15, Cibo 8/20, Legno 0, barra «DAY 1» con pause/velocità, nav
inferiore Village/Map/Workshop/Tavern, mappa painterly con vulcano.

## Niente convergenza misurabile

Un solo provider grounded; i temi sotto sono della singola critica.

## Punti della critica (deepseek, 1/1)

1. **Boot screen: gerarchia rovesciata.** «Il logo attira tutta
   l'attenzione, ma l'utente ha bisogno di sapere quanto manca e cosa
   sta succedendo»: testo «Preparing the world» «talmente piccolo e
   grigio da risultare quasi illeggibile»; barra lineare «non comunica
   alcun progresso reale». Proposta: loading come momento tematico,
   Image fill + testo dinamico (`"Preparing the world... N%"` →
   `"Ready to explore!"`), esempio Unity C#.

2. **HUD: overload + confusione cromatica.** «Il colore arancione del
   cibo è troppo simile a quello dell'oro»; legno a «0» col grigio
   «troppo spento, sembra disabilitato»; font risorse troppo sottile su
   barra scura.

3. **Time bar squilibrata.** «La barra "DAY 1" con i pulsanti di pausa
   e velocità è troppo grande e visivamente pesante rispetto al resto»;
   pulsanti velocità generici.

4. **Nav inferiore "app mobile".** «Pulsanti tutti uguali, senza una
   gerarchia… bordi dorati troppo spessi e carichi mentre le icone sono
   piccole e poco dettagliate» — mismatch di peso fra chrome e glifi.

5. **Mappa sotto-sfruttata.** «Il componente migliore… ma la UI non la
   supporta»: nessun cursore/indicatore di selezione, confini regione
   solo cromatici senza bordi, elementi decorativi (vulcano) senza
   funzione visibile.

## Note di scope (non misread)

La critica spazia sull'intera schermata (boot + HUD + mappa), non solo
sul componente boot: conseguenza naturale degli shot ctx. Le
osservazioni su HUD/nav/mappa sono extra-scope ma utili ai componenti
corrispondenti (hud-*, nav-bar, pixi-world-map).

## Misread

Nessuno rilevato: label, valori risorse e layout corrispondono agli
shot.

## Note operative

- claude giù fino a 12:20 CET; chatgpt attach rotto tutto il giorno.


## Merge claude (refill T-001, post-reset quota 17:20)

claude GROUNDED (~9.6k chars, verbatim in `claude.md`; onesto: un frame
statico, animazioni non giudicabili).

**Convergenza (claude + deepseek)**: fatti corretti («Preparing the
world», barra lineare, logo centrale). Entrambi rilevano la schermata
povera/piatta; claude la porta a diagnosi: «hai una schermata di brand,
non una loading screen — l'80% del canvas è gradiente vuoto e il mondo
dipinto non si vede». Copy placeholder e barra debole (~3px, track sotto
3:1 stimato) sono P0 condivisi.

**Punti solo claude**: stile incoerente (logo iper-renderizzato vs UI da
SaaS dashboard); doppia orizzontale confusa (hairline vs barra);
gradiente a rischio banding 8-bit; nessun controllo di fine caricamento
(né flash da 300ms né «Press any key» che sblocca anche l'audio webview);
dimensionamento fisso; a11y zero (progressbar, aria-live, reduced-motion).
Fonti: Apple HIG (mai schermata statica), studi tempi percepiti (lineare
> ciclica), Game Developer (indicatore di progresso obbligatorio;
transizione controllata dal giocatore).

**Proposta claude**: key art sfocata/scurita con parallasse lenta +
vignetta + grana; barra 6-8px «metallo fuso» con scintilla; fase
narrativa («Inking the map», «Raising the village») + percentuale
discreta; minima persistenza; «Press any key».
