# Digest critiche — title-screen (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-title-screen`,
turn T-001 (+retry T-002 chatgpt, +retry T-002 claude), prompt verbatim
R-282, 2 shot allegati (ctx-a, iso-0).

**Provider failure dichiarati (2/3):**
- chatgpt — `ATTACH_FAILED` su T-001 e T-002. Pattern persistente del
  giorno (quota upload free / affordance assente nel composer).
- claude [RECUPERATO v. merge] — T-001 `FAILED` (tab CDP chiuso prima del turno); T-002
  `FAILED` (renderer crash dopo `image_attached: 2`). Sulla run
  precedente il DOM segnalava anche il cap free-tier «messaggi gratuiti
  fino alle 12:20». Nessuna critica ottenibile.

**Convergenza = n/a (solo deepseek grounded).** Fatti corretti: logo
«Wanderlust Triumph», bottoni «New Game, Load Game, Settings», sfondo
teal scuro piatto. Risposta in cinese, ~5k char, verbatim in
`deepseek.md`.

## Punti critici deepseek (unico provider)

1. **Disconnessione materica logo↔bottoni (P0):** logo «极其繁复的金属浮雕
   与光效» vs bottoni «极其扁平、死板的黑色胶囊配细金边» — «仿佛是从两个
   不同的游戏里抠出来的素材». Anche border-radius pill vs spigoli vivi del
   logo non dialogano.
2. **Sfondo morto (P0):** «纯色深青绿，没有任何渐变、噪点或动态粒子…像
   一张没做完的PSD». Un main menu 2026 deve dare «氛围感»: volumetric fog,
   dust particles, vignette.
3. **Tipografia bottoni debole:** font-weight troppo sottile → «光晕效应
   (Halation)» su fondo scuro; tutti i bottoni uguali, nessuna gerarchia
   per «New Game» come primary action.
4. **Zero state feedback:** nessun hover/focus visibile — fatale per
   navigazione da gamepad («玩家会感到极其困惑和疲劳»).
5. **Manca diegetic design:** il menu «只是"贴"在屏幕上的UI» — non racconta
   il mondo (confronto: Dead Space, Wolverine). «只是一个功能面板，不是
   世界的入口».

## Soluzioni proposte (deepseek)

Bottoni in brushed metal/pelle con bevel + inner highlight per unificare
il linguaggio del logo; sheen sweep via `::before`; primary action
differenziata (`.menu-btn.primary` più larga/luminosa); hover con
`translateY(-2px)` + gold glow + bg che si scalda; divider dorati;
letter-spacing + serif scolpito sul titolo. Codice HTML/CSS completo
fornito.

## Priorità emersa

P0: unificare materiali logo/bottoni, stati hover/focus, differenziare
primary. P1: atmosfera dello sfondo (gradienti/particelle/vignette),
gerarchia tipografica. P2: accessibilità/contrasto, narratività del menu.


## Merge claude (refill T-003, post-reset quota 17:20)

claude GROUNDED (~12.1k chars, verbatim in `claude.md`). Fatti corretti:
logo «Wanderlust Triumph», bottoni New Game/Load Game/Settings, sfondo
teal piatto.

**Convergenza (claude + deepseek)**: entrambi rilevano gerarchia piatta
(tre pillole identiche, nessuna primaria, manca Continue/Quit) e lo
scontro logo-materico vs bottoni «pillole nere lucide da UI kit
generico» (deepseek lo chiamava incoerenza stilistica). Sfondo piatto
senza vita: entrambi — claude aggiunge «il primo schermo è la vetrina».

**Punti solo claude**: scala misurata (logo+menu ~540×290px su 1440×900;
bottoni ~260×34px, label ~12-13px — illeggibile su Deck/TV/4K, rif.
Steam ~38px a 1080p e Xbox scaling 200%); hairline orfana; footer assente
(versione/copyright); stati e input non dimostrati (focus esplicito,
Gamepad API in polling, Load Game disabilitato senza salvataggi); note
oneste su ciò che gli shot non provano (audio, transizioni, res 4K logo).
