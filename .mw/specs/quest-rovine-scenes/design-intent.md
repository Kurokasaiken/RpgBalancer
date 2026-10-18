# Quest «Le rovine sotto il fiume» — Scene Art — Design Intent

## Purpose

Sostituire le 8 foto di pubblico dominio di `public/assets/quest-robine/` (mercante, fiume, guardie, tesoro, crollo,
camera, strada, rovine-hero) con scene dipinte nello stile Wanderlust, **un'immagine per scena distinta** (stessa
granularità della quest dei goblin: i nodi che mostrano lo stesso luogo riusano la stessa immagine).

Perché: la copertina delle rovine nel planner è una **foto di piramidi con la sfinge** (cattura F0 `15-preview-quest-rovine-vuota`),
fuori dalla bibbia artistica — `art_direction_plan.md` (pilastri Wilderness / Solar Triumph, niente grigio né marrone) —
e accanto alle scene dipinte dei goblin rompe la famiglia visiva.

## Fonti

- Soggetti: nodi di `src/balancing/config/idleVillage/quests/scenarios/rovine.ts`.
- Regole di scena: `src/docs/docs/art-direction/scene_prompt_authoring_guide.md`; kill list e palette: `art_direction_plan.md`.
- Formato prompt e vincoli: quelli della quest dei goblin (`.mw/specs/quest-goblin-scenes/design-intent.md`), qui ereditati.
- Mappatura runtime da aggiornare dopo la generazione: `src/ui/idleVillage/questS1Lab/questArt.ts` (`NODE_ART`, righe `rv-*`).

## Vincoli (ereditati dai goblin, 2026-10-12)

1. **Il party del giocatore non è mai disegnato.** Mercante, guardie, uomo ferito sono NPC: ammessi dove il nodo li richiede.
2. **Immagine = beat pre-scelta / pre-check, mai esito.** La trappola non è scattata (lastre integre), il crollo non è avvenuto
   (polvere e crepe), nessun reveal.
3. **Niente creature** (le rovine non hanno bestiario in questa quest).
4. **Niente testo, cornici, UI, filigrane**; niente piramidi né sfingi (l'errore delle foto attuali).
5. Palette di bibbia: ultramarine, verde Veronese, cinabro, ambra/oro; ombre teal-smeraldo sature, mai nere né marroni.

## Copertura (8 immagini + il «ritorno» condiviso → 17 nodi)

| Immagine | Nodi |
|---|---|
| `r0-mercante` | rv-mercante, rv-check-osserva, rv-check-incalza |
| `r1-fiume` | rv-fiume |
| `r2-guardie` | rv-guardie, rv-check-sneak, rv-check-fight |
| `r3-tesoro` | rv-sala, rv-check-trappola, rv-tesoro-scelta, rv-check-prendi, rv-check-sicuro |
| `r4-crollo` | rv-attrito |
| `r5-camera` | rv-camera |
| `r6-strada` | rv-ritorno-evento |
| `r7-rovine-hero` | copertina del planner, rv-checkpoint |
| (condivisa con i goblin) `ritorno` | rv-fine |

Nota: `rv-check-trappola` («il pavimento cede») oggi mostra la stessa sala del tesoro; per un'immagine di crollo vero
servirebbe una decima scena post-impatto — non richiesta qui (regola: immagine pre-check).
