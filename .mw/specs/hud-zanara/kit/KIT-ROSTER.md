# Kit Zanara: pezzi per il roster (primo componente, anchor-first)

Fonte delle regole: `../LINGUAGGIO-v1.md` (approvato 2026-11-02, ruling `zanara-Z1…Z8`).
Chi genera: il Director (assets-1). L'AI prepara specifiche e prompt, poi scontorna, misura e monta.
I mockup **non** si copiano: nessun prompt allega un ritaglio di mockup come forma da riprodurre.

## Il componente: `ZanaraRoster` chiuso (colonna)

Proposta di misure nello spazio 1600×900 (Z-1: scala reale e budget 18%). Si confermano su `/hud-target` prima di generare.

| Parte | Misura a schermo | Famiglia |
|---|---|---|
| Colonna | ~170 × ~430 px (≈5,1% dello schermo) | — |
| Passo tra le righe | 62 px | — |
| Anello del ritratto | Ø 56 px, foro Ø 42 px | F3 |
| Placca del nome | altezza 44 px, lunghezza variabile (3 fette) | F1 |
| Banda verticale | larghezza 14 px, ripetuta | F7 |
| Castone di stato | 10–12 px | F4 |
| Testo | nome 14 px Cinzel, LV 12 px, barra 4 px | — |

Righe visibili: 5, le altre scorrono. In cima l'emblema (K5), in fondo il terminale della banda (K6).

### Stati reali del residente
Fonte: `DragTestContainerV2.describeStatus` (`available`, `away`, `exhausted`, `injured`, `dead`, più "bloccato"). Il mockup ne mostrava uno solo.

| Stato | Castone | Sagoma incisa | Etichetta |
|---|---|---|---|
| available | smeraldo acceso | — | nessuna (il normale non parla) |
| away (in spedizione) | spento | stivale/sentiero | «In viaggio» |
| exhausted | spento | clessidra | «Esausto» |
| injured | spento | scudo incrinato | «Ferito» |
| dead | borchia di ferro freddo `#93a4ad`, ritratto velato | — | «Caduto» |
| bloccato | spento | lucchetto di ferro | requisito |

Le sagome incise (comandi e stati, icons-1) sono un set a parte: SVG in oro inciso, non generato qui.

## Pezzi da generare

Regole comuni a ogni prompt:
- il prompt inizia con «Generate an image:», così Gemini lo instrada alla generazione;
- fondo piatto blu notte `#0a1622` (scontorno con flood-fill dai bordi);
- vista frontale ortografica, pezzo isolato, nessun testo;
- 4 varianti per prompt.

| # | Pezzo | File prompt | Formato | Allegati |
|---|---|---|---|---|
| K1 | Anello medaglione (ancora del kit) — **fatto**: v2 = F3a ritratto, v4 = F3b insegna (`approved/`) | `prompts/K1-ring.txt` | 1:1 | nessuno |
| K2 | Placca a 3 fette | `prompts/K2-plaque.txt` | 3:1 | `approved/K1-ring-ritratto-raw.png` (solo materiale) |
| K3 | Banda verticale ripetibile | `prompts/K3-band.txt` | 1:3 | `approved/K1-ring-ritratto-raw.png` |
| K4 | Castoni: 3 forme × acceso/spento | `prompts/K4-gems.txt` | 3:2 | `approved/K1-ring-ritratto-raw.png` |
| K5 | Emblema del sole nascente | `prompts/K5-emblem.txt` | 1:1 | `approved/K1-ring-insegna-raw.png` (F3b) + `refs/emblem-subject-sun.png` (solo soggetto) |
| K6 | Terminale della banda con pendente | `prompts/K6-band-end.txt` | 1:2 | `approved/K1-ring-ritratto-raw.png` + K3 approvato |

**Generazione in blocco:** tutti i pezzi (K2–K15, anche oltre il roster) si generano insieme secondo `plans/PLAN-109-hud-zanara-kit-generation.md`. K6 ora è autonomo e non aspetta più K3.

**Ordine:** K1 fatto (2026-11-02): il Director ha tenuto due varianti per due ruoli, F3a ritratto (v2) e F3b insegna (v4), con lo stesso oro (creste 42,7° e 41,8°). I pezzi del roster (K2, K3, K4, K6) allegano il ritratto, perché devono legarsi a lui; l'emblema K5 allega l'insegna. Poi K2…K6.

## Accettazione di ogni pezzo (prima del montaggio)

1. Lo scontorno flood-fill lascia lo smalto interno opaco (errore già commesso: i verdi cancellati).
2. Oro: i pixel di cresta più luminosi stanno a tonalità 35–45°, mai oltre 50° (Z-8).
3. Nessun testo, foglia, edera, viola o marrone.
4. A dimensione di schermo (downscale da 4×) i dettagli restano leggibili, senza rumore.
5. K2 e K3: la fetta centrale o il periodo si ripete senza cucitura visibile (verifica con script).
6. Verdetto finale: il tuo occhio, sulla pagina di confronto.

## Dopo la generazione (lavoro AI)

1. Scontorno, misura dei punti di montaggio (foro, interno placca, periodo della banda), 3 fette.
2. `ZanaraRoster` in `src/ui/`:
   - eroi dallo store, stati reali, scroll, espansione al roster completo;
   - i18n, focus e tastiera;
   - preset `zanara` nel registro skin.
3. Prova su `/hud-target` e su `/game` dietro il preset, a 1440×900 e 1280×800.
