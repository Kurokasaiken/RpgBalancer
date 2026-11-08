# G2 — pacchetto per il Director (PLAN-112 F3, 2026-11-05) — **G2 CHIUSO il 2026-11-05: G2-1 pf-3 · G2-2 slot 340×520 · G2-3 medaglione approvato · G2-4 oro A + smalto B · G2-5 nessun cimiero · G2-6 soglie per pezzo (vedi plans/PLAN-112 §25)**
> Cosa guardare e cosa decidere per chiudere F3. Nessun asset in produzione è stato modificato; le candidate sono in `f3/cand/` e `f3/gen/`. Quota Gemini: **65/170 usate**; la generazione è ferma (2 immagini non uscite per quota, saltate).

## Da guardare (a schermo, headless già verificato)
1. **Cornice del pannello, tre a confronto con contenuto vero:** `http://localhost:5173/hud-panel-compare` (attuale | pf-1 | pf-3). Per le immagini isolate: `f3/gen/pf-1-0.png`, `pf-2-0.png` (scartata), `pf-3-0.png`.
2. **Medaglione:** `f3/gen/med-1-0.png`, `med-2-0.png` accanto all'anello approvato (`approved/C1-ring.png`); prova dell'arco di salute a scala reale in `f3/` (non salvata come file: si rifà con la pipeline).
3. **Colori:** `f3/color-proof.png` (nav e placca in attuale / A / B su mare, giungla, terra chiara) e `f3/COLOR-TARGETS.md` (misure).

## Da decidere (tue)
| # | Decisione | Opzioni | Dato che ho | Raccomandazione del planner (non è un ruling) |
|---|---|---|---|---|
| G2-1 | **Cornice del pannello** | attuale / pf-1 / pf-3 | pf-1 e pf-3: 8/9 tratti, più presenza, **più alte (533/513 contro 433)**; testo 16 px comodo; **sforano lo slot 340×470**; nessuna ha la finestra ad arco | pf-3 (alabastro più uniforme) **se** accetti di alzare lo slot a ~520 (amend G1 #3); altrimenti l'attuale. Dipende da quanto peso visivo vuoi nel pannello |
| G2-2 | **Slot del pannello** | tenere 340×470 (comprimere/ritagliare la cornice) / alzare a 340×520 (amend G1 #3) | a 100% su 1440×810 entra; a 125/150% già scorre; il pannello è contestuale (non pesa sui fissi) | alzare a 520 se scegli pf-1/pf-3 |
| G2-3 | **Medaglione del roster** | tenere l'approvato (g4 + mezzaluna fusa) / med-1 | med-1: 5/6 tratti, anello non più sottile; **non migliora** l'approvato; scanalatura per l'arco inutile (l'arco si disegna sul foro) | **tenere l'approvato**; lo spike si riduce a gemma di stato + arco in codice |
| G2-4 | **Colore** | attuale / A (fedele al mockup: smalto 196°/L22/C17, oro −20% sat) / B (compromesso: smalto 182°/L22/C18, oro −10%) | smalto nostro più scuro e verde del mockup (L 15,8 contro 21,6; 168° contro 196°); **oro più saturo e con luci più alte** (C 37,9 contro 30,1; p90 91,5 contro 78,5); sulla giungla lo smalto del mockup ha la stessa luminosità dello sfondo | **oro di A** (è la differenza più grande e causa l'effetto «plastica»); **smalto di B** se la giungla preoccupa. I candidati sono solo misurati, non applicati ai pezzi |
| G2-5 | **Cimiero del roster** (aperta da prima) | fenice / altro dalla libreria / nessuno | nella pianta B il roster compatto non ha cimiero; l'emblema è tolto (D2) | **nessun cimiero** nella panoramica: la decisione non serve più per la pianta; resta nella libreria |
| G2-6 | **Soglie di coerenza** | quelle proposte in `COLOR-TARGETS.md` | smalto L p50 19–25, tinta 175–205°, C 14–20; oro L p50 52–60, C 28–36, p90 ≤ 82; alabastro L 80–84; vetro L ≤ 9 | confermare dopo G2-4 |

## Cosa NON è stato verificato
- Le candidate sono **valutate a occhio** su immagini singole e nella pagina di prova; **nessuna misura automatica dei tratti**; la pagina di prova ha un'etichetta del bottone **non centrata nelle due candidate** (errore di allineamento di prova, non delle cornici).
- **Medaglione:** nessuna prova con l'arte vera del ritratto; arco di salute provato con un ritratto finto.
- **Colore:** A e B sono solo misure e una tavola di prova su due pezzi (nav e placca), **non applicati** a tutti i pezzi; le soglie sono proposte, non verificate sul resto della HUD.
- **Pannello:** nessuna prova con 14 eroi, testo lungo o i18n inglese nella cornice nuova.

## Dopo G2
Se scegli una cornice nuova: costruzione dell'asset con la geometria vera (campo, finestra, bottone), colore unificato, test di rettangolo (slot, ev. amend G1 #3), cattura headless a 3 zone e viste; **solo allora** F4 (componenti). Se tieni l'attuale: F3 si chiude senza nuovi asset e si passa a F4 con la sola unificazione del colore.
