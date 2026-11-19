# PLAN-128 — Adattamento e giudizio nel contesto: da mockup a componente migliore del mockup

**Stato:** **rev.2 — BATTEZZATO 2026-11-19** (ruling Director «battezza plan 128»,
R-362) — `npm run plan:stamp -- note PLAN-128 --kind rebaptism` eseguito
(`context/plan-timing.jsonl`, 2026-11-19T09:05:30Z); stamp `open` rev.1:
2026-11-19T06:44Z. La rev.1 era stata battezzata il 2026-11-19; il Director ha poi
chiesto, lo stesso giorno, di snellirla e dividerla in nucleo generico + profilo RPG.
Il testo della rev.1 è conservato verbatim in
`mind-weaver/.mw/runs/20261119-hudreal-adaptation-layer/plan-128-rev1-battezzato.md`
(sha256 `301a0747…01425`).

**Parent:** R-361. Estensione dell'ask Director del 2026-11-19: l'output non deve essere fedele al mockup ma
**più bello del mockup** e coerente con la HUD reale, giudicato insieme alla HUD. Nuova richiesta
Director, sempre del 2026-11-19: il metodo deve servire **sia in generale sia per RPG Balancer**.

**Documentation Impact:** REQUIRED. Il metodo è in
`mind-weaver/docs/MOCKUP-TO-COMPONENT.md` (nucleo) e in `context/mockup-pipeline-profile.md`
(profilo RPG). Da allineare: `context/MOCKUP-TO-PRODUCTION-PIPELINE.md`,
`.mw/specs/hud-real/MOCKUP-TO-ASSET-GUIDE.md`, la skill painter e `plans/INDEX.md`.

**Visual-fork:** skipped. È un piano di metodo. I cambi T2 vengono decisi sulla tavola di Fase C,
che vale come fork per-superficie (PLAN-047).

---

## 1. Cosa fa questo piano

PLAN-127 copre la **Fase A**: riproduce fedelmente il mockup come componente scalabile.
Questo piano aggiunge:

- **Fase B — Adattamento:** i cambi sono divisi nei livelli T0–T3 e annotati in un registro.
  L'agente **propone attivamente** fino a 2 varianti con un miglioramento T2 ciascuna.
- **Fase C — Giudizio:** i candidati vengono montati sulla vera `/game`. Il Director riceve
  una tavola nella conversazione e dà uno dei 4 verdetti.

Le regole stanno nel nucleo generico. Le scelte RPG (route, token, divieti, percorsi,
pilota) stanno nel profilo. Questo piano contiene solo **cosa costruire e in che ordine**.

## 2. Cosa cambia rispetto alla rev.1

| rev.1 | rev.2 | Perché |
|---|---|---|
| Non diceva chi crea i candidati adattati | Candidato 0 = fedele, 1 = +T0/T1, 2–3 = +**un** T2 ciascuno (nucleo §3.4) | Senza questo passo la pipeline non produce nulla di migliore del mockup |
| T0/T1 automatici solo se un controllo "prova" l'equivalenza | T0 = lista chiusa nel profilo. T1 = cambi imposti dal contenitore, registrati con cattura prima/dopo | I controlli di prova non esistevano: tutto sarebbe finito in T2, cioè sul Director |
| T2 richiedeva un fork **prima** della tavola | Il verdetto sulla tavola **è** il ruling del T2 scelto | Un solo passaggio dal Director per componente, come prometteva la rev.1 |
| 6 metriche di armonia + inviluppo calibrato sulla HUD attuale | 2 misure informative (materiale, luminosità/saturazione). Le altre solo dopo 3 componenti | La HUD è in restyling: calibrare su di essa vuol dire calibrare su ciò che si sostituisce |
| Base anti-deriva fissa | Base rivedibile su parola del Director | Evita di congelare i primi errori |
| Mancava come montare le varianti su `/game` | Parametro di sviluppo `?hudVariant=` (profilo [P2]) | Senza questo la tavola va composta a mano |
| "Passo 2/3", in collisione con i Passi 1–7 di PLAN-127 | Fase A/B/C | Nomi non ambigui |
| Verdetti PICK / SYNTHESIZE / ITERATE / REJECT-ALL | SCEGLI / COMBINA / RIFAI / SCARTA | Stesso significato, in italiano |
| Consegna solo nel thread Devin | Devin e Claude Code (profilo [P10]) | Il Director usa entrambi |

Resta invariato: le tre classi di giudizio (meccanico, informativo, gusto); la regola prudente
sui livelli; l'arte dipinta preservata di default; il ΔE che segnala ma non boccia; il limite
di 3 giri; il giudizio solo sulla HUD montata; la cartella per componente. Resta invariato
anche l'ambito: solo HUD.

## 3. Ordine di lavoro

1. **Prerequisito:** Roster passa la Fase A di PLAN-127 (V1/V2/V3 verdi, minimo del testo compreso).
2. Registro dei cambi + lista T0 + regole `closure:lint` (OB-1).
3. Materiali di riferimento misurati sulla Nav + misura ΔE + campi `colorRole`/`colorTreatment` nella spec (OB-2). **Misura fatta il 2026-11-19, vedi profilo [P3]**; resta il confronto a pari composizione su ritagli della resa e i campi nella spec.
4. Parametro `?hudVariant=` + cattura automatica della tavola su `/game` (OB-3).
5. Roster attraverso A → B → C con verdetto registrato (OB-4, OB-6).
6. Stash attraverso A → B → C (OB-4).
7. Revisione dopo Roster + Stash + un terzo componente: si allarga la lista T0? servono altre
   misure di armonia? Se sì, si aggiornano il nucleo e il profilo (OB-5).

## 4. Contratto di chiusura

| ID | Obbligazione | Tipo | Bloccante |
|---|---|---|---|
| OB-1 | Registro dei cambi per componente (formato del nucleo §3.2) + lista T0 del profilo applicata. `closure:lint` rosso su: cambio T2 senza verdetto; «entro tolleranza» senza numero ΔE | `state` | sì |
| OB-2 | Materiali di riferimento misurati sulla Nav e scritti nel profilo [P3] (**fatto 2026-11-19**: `scripts/hud-real/material_palette.py`, `test-results/slicekit/material-palette-nav.{json,png}`); fasce ΔE per materiale riconfermate dopo 3 componenti; campi `colorRole` / `colorTreatment: preserve\|tokenized\|regrade` nella spec slice-kit | `state` | sì |
| OB-3 | `?hudVariant=<surface>:<n>` funzionante in sviluppo e ignorato in produzione; cattura automatica della tavola (1440×900 DPR 2, schermata intera + ritaglio) con le 2 misure di armonia annotate | `state` | sì |
| OB-4 | Roster e Stash passati da Fase A → B → C, con cartella del componente completa e verdetto registrato | `state` | sì |
| OB-5 | Revisione dopo 3 componenti registrata (lista T0, misure di armonia, soglie ΔE); nucleo e profilo aggiornati o motivato perché no | `docs` | sì |
| OB-6 | Testimone T-04: il Director giudica la tavola montata, non la pipeline | `human-eye` | sì |

## 5. Provenance

- **Dibattito rev.1:** `mind-weaver/.mw/runs/20261119-hudreal-adaptation-layer/`, status converged.
  2 round, 4/4 ACCEPT (chatgpt, gemini, grok, deepseek; claude non presente). Il report avverte che
  "converged" certifica l'accordo, non la verità.
- **rev.2:** revisione in sessione Claude Code del 2026-11-19, su richiesta del Director («Sì, riscrivilo»),
  dopo una critica della rev.1. La rev.2 **non** è passata da un dibattito multi-AI.
- **Relazione con PLAN-127:** PLAN-127 è la Fase A. Il formato completo
  della spec slice-kit è nello standard `context/shared/SLICEKIT.md`
  (nucleo generico, `mind-weaver/docs/`; spostato da PLAN-127 §3 con la
  rev.2 del 2026-11-19).
