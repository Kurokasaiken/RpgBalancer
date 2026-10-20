# F3 — Scheda: la quest cinematografica (teatro della QuestRunWindow) (Opus, 2026-10-20, R-234)

> Formato F2. Evidenze: `shots/cinematics-f3/` (ingresso di 3 scene, 14 frame ogni 150 ms con clock controllato), `shots/questwindow-f3*/`, `shots/skillcheck-*`. Legenda: **FATTO** · **FLAG** · **NON VERIFICATO**.
>
> **Limite grave dichiarato prima di tutto:** durante questa cattura è riapparso l'errore Pixi `reading 'ids'`, cioè il bug della mappa. Il fix è sul branch `claude/eloquent-goodall-4d2bf1` e non in questo checkout. Il teatro usa Pixi (`DepthScene`), quindi **non si può escludere che l'immobilità misurata nelle scene 2 e 3 sia causata da quel bug** e non dal design. Questa scheda va ricatturata dopo il merge del fix.

## 1. Cosa è, per il giocatore

Il «film» della spedizione. Ogni fase ha un'illustrazione 2.4:1 animata con parallasse da mappa di profondità (PLAN-046), un titolo inciso e i beat di testo. I tagli di regia sono `reveal | impact | breath | push | bars | j-cut | expanded` (`questTheatreSequencer.ts`), scelti per beat da `stageDirection.cut` o dai default di `questTheatreFx`. Ci sono anche il suono (`questTheatreAudio`), il respiro prima del verdetto (`PreVerdictBreath`) e la deriva dopo l'ingresso (`postSettle`, PLAN-064).

## 2. Dove vive

`QuestRunWindow.tsx` (stage), `questS1Lab/questTheatreSequencer.ts` (tagli), `cinemaFx.tsx` (`KenBurnsDolly`, `JCutStage`, `StageImpactShake`, `PreVerdictBreath`), `DepthScene` (Pixi, parallasse), config `questTheatreFx` / `QuestDepthFx.postSettle`, arte `public/assets/scene-library/` (PLAN-061, 2.4:1), staging di profondità PLAN-052 (`draft`).

## 3. Cosa si vede (FATTO, 1440×900)

| Momento | Misura | Lettura |
|---|---|---|
| Teatro nella finestra | **730×305 px** (≈17% dello schermo); combattimento 730×260 | il «cinema» è una cartolina dentro una finestra |
| Ingresso scena 1 «Exploration» | 4–23% di pixel cambiati ogni 150 ms, per 2 s | vivo: deriva, nebbia |
| Ingresso scena 2 «Rules of Engagement» | 6,6% al primo frame, poi **0,1–0,8%** | quasi fermo (vedi limite) |
| Ingresso scena 3 «Iron and ash» (combattimento) | **0,1–1,0%** | quasi fermo (vedi limite) |
| Teatro a riposo (run F3, scena 1) | 23–26% px/s | vivo |
| Reduced-motion | 0% | rispettato |
| Titolo di scena | Cinzel piccolo, centrato in basso, senza trattamento | si perde sull'arte |
| Area dei beat in combattimento | titolo del beat e poi **vuoto** fino a «2 beats left» | testo assente o non ancora rivelato (NON VERIFICATO) |
| Skill check | in colonna esterna, scena immobile durante lo spin (1,5%) | vedi F2 |
| Fine | rapporto in una lastra generica sopra la finestra | vedi F3 QuestRunWindow |

## 4. Documentazione vs realtà

| Doc | Dice | Si vede | Verdetto |
|---|---|---|---|
| R-231 #9 / PLAN-064 | animazione post-entrata, «la parte più importante» | viva nella scena 1; quasi ferma nelle scene 2–3 | **DA RICATTURARE** dopo il fix Pixi |
| PLAN-043-S9 WS-4 | tagli `impact`, `push`, `bars`, `j-cut`, `expanded` per beat | nessun `expanded` né `bars` osservato nelle 3 scene catturate; il teatro non cambia scala | **NON VERIFICATO** quali tagli scattano (serve un probe sul `QuestTheatreCue` corrente) |
| PLAN-046 | parallasse da singola immagine | coerente con la scena 1 | **COERENTE** |
| PLAN-052 | staging di profondità per le nuove arti | `draft`, nessuna immagine nuova | **APERTO** |
| guida quest §6 | check narrativo «centrato, overlay della scena, full-motion» | colonna esterna | **CONTRADDIZIONE** (già in F2) |

## 5. Perché «non è abbastanza cinematografico» (cappello `game_director`, **FLAG**)

1. **Scala.** Il cinema occupa il 17% dello schermo dentro una finestra con header, chrome, barre e tessere. Nessun momento della quest si prende lo schermo: né l'arrivo, né il combattimento, né il tiro, né il ritorno.
2. **Montaggio.** Tra una fase e l'altra si vede un cambio d'immagine, non un taglio. Nelle scene catturate non ci sono campo/controcampo, zoom sul dettaglio né un ritmo che acceleri in combattimento.
3. **Il destino fuori scena.** Il tiro sta nella colonna e la scena non lo sente (F2).
4. **La parola.** Il testo dei beat sta sotto l'immagine, in una zona separata. Il cinema di genere sovrappone la parola all'immagine (sottotitolo, didascalia incisa), non la mette in un riquadro accanto.
5. **Suono.** Non verificato. Ma `removeSounds` sull'astrolabio e l'assenza di stinger percepibili tolgono metà del «cinema».

## 6. Direzioni possibili (**visual-fork**, nessuna scelta)

| Fork | A | B |
|---|---|---|
| CIN-1 scala | **Momenti a tutto schermo**: arrivo sul luogo, primo colpo del combattimento, verdetto, ritorno prendono l'intero viewport per 2–4 s (tag `expanded` portato a «schermo») e poi tornano in finestra | **Finestra più cinema**: il teatro occupa l'intera finestra, con testo e scelte sovrapposti in basso come sottotitoli; barre e tessere si nascondono durante i beat |
| CIN-2 montaggio | regia per fase: campo largo → dettaglio (crop/zoom nella stessa immagine) → reazione | regia per evento: solo i colpi (impact) e i verdetti hanno taglio, il resto è deriva continua |
| CIN-3 tiro in scena | il quadrante appare **sopra la scena** come oggetto magico (overlay in scena, la guida §6) | la scena reagisce al tiro (luce, scuotimento, suono) restando in colonna |

## 7. Critica `objective_critic`

1. **RISK** — tutta la misura delle scene 2–3 può essere falsata dal bug Pixi: è il primo limite di questa scheda.
2. **UNSUPPORTED** — «non ci sono tagli»: non ho letto il `QuestTheatreCue` emesso. Possono esserci tagli troppo sottili per la mia soglia di pixel.
3. **BIAS** — una quest, tre scene.
4. **ASSUMPTION** — «il cinema di genere sovrappone la parola all'immagine»: vale per Darkest Dungeon e per i JRPG; altri giochi narrativi (Disco Elysium) fanno il contrario.
5. **CONTRADICTION** — una regia a tutto schermo va contro la regola HUD «la mappa è l'eroe» e contro la finestra fluttuante. Va deciso come eccezione esplicita.

## 8. Prompt potenziato

```
You are a senior cinematic UI director at a AAA studio on the RPG project
(/Users/faustoboni/progetti_personali/RPG), surface /game, the quest theatre inside QuestRunWindow
(questTheatreSequencer.ts, cinemaFx.tsx, DepthScene, questTheatreFx config, PLAN-046/052/064).

Inputs: DESIDERATA (.mw/desiderata.md latest FROZEN), DESIGN_PILLARS.md, F3_scheda_quest_cinematica.md,
F2_scheda_skill_check.md (SC-1 = A, SC-2 = A in R-234), hud_component_guide.md (map is the hero; exceptions must be explicit).
Precondition: merge/verify the Pixi shared-pool fix (branch claude/eloquent-goodall-4d2bf1) BEFORE any capture.

Task: produce a visual-fork card for CIN-1/2/3 with a live preview on the real theatre (/theater-lab or harness),
then, after the Director's ruling, implement only the selected option.
Rules: tokens only; reduced-motion = static; no new monolithic engine; cuts stay data-driven (stageDirection.cut);
keep green questCinematics*.spec.ts, gameQuestCluster.spec.ts (BV-01..14), questRunWindow.test.tsx.
Evidence: harness/run-cine.mjs.txt (late page.clock, 150 ms frame sequences, px-diff per frame) before/after.
```

## 9. Non verificato
Tagli effettivamente emessi per beat; audio; `expanded`; scene 4–7; arte rigenerata 2.4 (PLAN-061 step esterno); effetto del fix Pixi sul teatro.
