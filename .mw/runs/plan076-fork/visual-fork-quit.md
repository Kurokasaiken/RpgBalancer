---
type: visual-fork-card
status: ruled
plan: PLAN-076-dn7-game-menu-save-load-settings-title
desiderata: v35
---

# Visual Fork Card — QUIT-1 conferma di uscita (e di Nuova partita, O-2)

## Scope
- QuitConfirmPanel — gameFrame (nuovo)
- HudGameMenu — voce Esci al titolo

## Condizioni della decisione
- Viewport di ruling: 1280×720 (fotogrammi 1:1 di `mockups/menu-fork-v1.html`); il ruling non si estende ad altre viewport.
- Stato: dati segnaposto; skin base, nessun viola, nessuna placca CTA (azione primaria = pillola neutra, BTN-1 aperto), nessun testo sopra immagini.

## Opzioni
| id | nome | riferimento | provenienza | argomento | costo |
|----|------|-------------|-------------|-----------|-------|
| A | conferma sempre | vedi mockup | `mockups/menu-fork-v1.html` sez. #quit | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |
| B | conferma solo se c è qualcosa da perdere | vedi mockup | `mockups/menu-fork-v1.html` sez. #quit | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |
| C | salva da solo | vedi mockup | `mockups/menu-fork-v1.html` sez. #quit | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |

Matrice completa: `src/docs/docs/game_surface_audit/F8_menu_carica_impostazioni_titolo.md` §4 e tabella nel mockup.

## Superficie di preview
- #1 galleria PNG + #2 harness HTML (`mockups/menu-fork-v1.html`), headless.

## Ruling
- `selected: B`
- `ruling_id: DN-7-2026-10-22` (Director via sessione madre, 2026-10-22)
- baseline_kind: png
- baseline_frozen_at: DN-7-2026-10-22
- baseline: `src/docs/docs/game_surface_audit/mockups/menu-v1-png/quit-B.png` sha256 `a06ba5fa5085f07336793445405009f7818a56ad162d9a28bcc4cbcf5e02b3f5`
- Vincoli verbatim: «Azione primaria = pillola neutra (BTN-1 ancora aperto), niente viola, niente placca CTA, niente testo su immagini.»

## Ledger
- amendments: nessuno
- incidental_deviations (dichiarate a chiusura, nessuna tocca un asse compilato come materiale): Il caso «salvato» non mostra dialogo (esce subito, come da QUIT-1 B); solo il dialogo del caso «modificato» ha una lastra, centrata anziché accanto alla voce.
- evidenza: `.mw/runs/plan076-witness/side-by-side.png`
