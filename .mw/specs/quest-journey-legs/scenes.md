# Quest Journey Legs — scene index (SSoT dei set)

Vignette generiche per le gambe di viaggio (andata/ritorno) di qualsiasi
quest — niente soggetto legato a una quest specifica (riuso R7).

| Scena | File | Beat | Tags riuso |
|---|---|---|---|
| `andata` | `scenes/andata/prompt.md` → `viaggio-andata.png` | partenza, strada che lascia il villaggio | `road, village-outskirts, morning, azure-sky, mountains, departure, wilderness, waymarker, reeds-foreground, parallax-planes, no-people, no-goblins, generic` |
| `ritorno` | `scenes/ritorno/prompt.md` → `viaggio-ritorno.png` | ritorno, strada in discesa verso il villaggio | `road, valley, village, sunset, golden, relief, shrine, pine-foreground, parallax-planes, no-people, no-goblins, generic` |

## Note

- Composizione parallasse dichiarata nei prompt: L1 occlusori foreground ai
  bordi (candidati `foregroundCutout`), L2 strada mid-ground, L3 sfondo
  monumentale — vedi `design-intent.md`.
- Party del giocatore MAI disegnato (R2); strade vuote per mood.
- Gate qualità: `python scripts/lint-scene-prompts.py .mw/specs/quest-journey-legs/scenes/`
