---
type: visual-fork-card
status: ruled
plan: PLAN-076-dn7-game-menu-save-load-settings-title
desiderata: v35
---

# Visual Fork Card — LOAD-1 elenco dei salvataggi

## Scope
- LoadGamePanel — src/ui/idleVillage/components/gameFrame (nuovo)

## Condizioni della decisione
- Viewport di ruling: 1280×720 (fotogrammi 1:1 di `mockups/menu-fork-v1.html`); il ruling non si estende ad altre viewport.
- Stato: dati segnaposto; skin base, nessun viola, nessuna placca CTA (azione primaria = pillola neutra, BTN-1 aperto), nessun testo sopra immagini.

## Opzioni
| id | nome | riferimento | provenienza | argomento | costo |
|----|------|-------------|-------------|-----------|-------|
| A | lastra centrale con velo | vedi mockup | `mockups/menu-fork-v1.html` sez. #load | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |
| B | pagina intera con anteprima grande | vedi mockup | `mockups/menu-fork-v1.html` sez. #load | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |
| C | lastra laterale senza velo | vedi mockup | `mockups/menu-fork-v1.html` sez. #load | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |

Matrice completa: `src/docs/docs/game_surface_audit/F8_menu_carica_impostazioni_titolo.md` §4 e tabella nel mockup.

## Superficie di preview
- #1 galleria PNG + #2 harness HTML (`mockups/menu-fork-v1.html`), headless.

## Ruling
- `selected: A`
- `ruling_id: DN-7-2026-10-22` (Director via sessione madre, 2026-10-22)
- baseline_kind: png
- baseline_frozen_at: DN-7-2026-10-22
- baseline: `src/docs/docs/game_surface_audit/mockups/menu-v1-png/load-A.png` sha256 `372196ec4d55461132acf8f36c1c173b72ace8299cad9dba5ce79f86e06f8017`
- Vincoli verbatim: «Azione primaria = pillola neutra (BTN-1 ancora aperto), niente viola, niente placca CTA, niente testo su immagini.»

## Ledger
- amendments: nessuno
- incidental_deviations: (compilare a chiusura)
