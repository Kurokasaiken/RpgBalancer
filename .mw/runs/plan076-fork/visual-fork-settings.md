---
type: visual-fork-card
status: ruled
plan: PLAN-076-dn7-game-menu-save-load-settings-title
desiderata: v35
---

# Visual Fork Card — SET-1 forma delle impostazioni

## Scope
- SettingsPanel — gameFrame (nuovo)

## Condizioni della decisione
- Viewport di ruling: 1280×720 (fotogrammi 1:1 di `mockups/menu-fork-v1.html`); il ruling non si estende ad altre viewport.
- Stato: dati segnaposto; skin base, nessun viola, nessuna placca CTA (azione primaria = pillola neutra, BTN-1 aperto), nessun testo sopra immagini.

## Opzioni
| id | nome | riferimento | provenienza | argomento | costo |
|----|------|-------------|-------------|-----------|-------|
| A | una lastra, sezioni in colonna | vedi mockup | `mockups/menu-fork-v1.html` sez. #settings | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |
| B | pagina intera con binario categorie | vedi mockup | `mockups/menu-fork-v1.html` sez. #settings | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |
| C | dentro la tendina | vedi mockup | `mockups/menu-fork-v1.html` sez. #settings | famiglia di superficie distinta (F8 §4) | vedi mockup | vedi F8 |

Matrice completa: `src/docs/docs/game_surface_audit/F8_menu_carica_impostazioni_titolo.md` §4 e tabella nel mockup.

## Superficie di preview
- #1 galleria PNG + #2 harness HTML (`mockups/menu-fork-v1.html`), headless.

## Ruling
- `selected: A`
- `ruling_id: DN-7-2026-10-22` (Director via sessione madre, 2026-10-22)
- baseline_kind: png
- baseline_frozen_at: DN-7-2026-10-22
- baseline: `src/docs/docs/game_surface_audit/mockups/menu-v1-png/set-A.png` sha256 `f86dd4462f14bd1ed04eb47afe8add41792054a5f1222622874b4abc746ff3c2`
- Vincoli verbatim: «Azione primaria = pillola neutra (BTN-1 ancora aperto), niente viola, niente placca CTA, niente testo su immagini.»

## Ledger
- amendments: nessuno
- incidental_deviations (dichiarate a chiusura, nessuna tocca un asse compilato come materiale): Nessuna riga Autosalvataggio (O-5) né Musica (nessuna sorgente); «Movimento ridotto» è un interruttore On/Off invece della spunta.
- evidenza: `.mw/runs/plan076-witness/side-by-side.png`
