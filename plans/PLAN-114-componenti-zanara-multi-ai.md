# PLAN-114 — Pipeline componenti Zanara: descrizione → discussione layout multi-AI web → mockup → pagine presentazione

**Stato:** bozza per il Director (da battezzare). Figlio di PLAN-113.
**Data:** 2026-11-06
**Origine:** ruling Director 2026-11-06 — i reskin testo-scambiato sono bocciati; i componenti vanno progettati sul metodo proposte-AI.

## 0. Scopo

Per OGNI superficie/componente di `/game` destinata alla nuova chiave Zanara: partire dalla **descrizione funzionale** (cosa è, cosa mostra, quali stati), **discutere il layout via multi-AI web** (ChatGPT + Gemini, Claude di riserva), **scegliere i layout col Director**, poi **generare i set di mockup** e presentarli su una **pagina dedicata per componente** dove il Director vede: componente di partenza (produzione `/game`), layout scelto con le modifiche e perché, e i mockup generati.

Non si genera più arte senza: (a) descrizione funzionale scritta; (b) layout discusso via multi-AI web; (c) ruling Director sul layout.

## 1. Pipeline per componente (obbligatoria, in ordine)

| Step | Cosa | Deliverable |
|---|---|---|
| **S1 Descrizione funzionale** | `LAYOUT-<id>-<nome>.md` (come `LAYOUT-B1-quest-window.md`): zone, cosa mostra ciascuna, dati veri, stati (min/tipico/max), i18n, comportamento produzione | spec contenuto |
| **S2 Ref estetici** | elenco allegati: cattura produzione della superficie + ref Zanara battezzate pertinenti (chrome/pf-3/cornice di tier, mai WIP non approvati) | pacco ref |
| **S3 Discussione layout multi-AI web** | stesso pacco a ChatGPT + Gemini (+Claude backup): "proponi N layout diversi per questo componente". Raccolta, confronto, **fork card al Director** | proposte + ruling |
| **S4 Set di mockup** | sul layout scelto: per ogni mockup richiesto, generazione ancorata su ref (E-26) — varianti fino a quota | set mockup |
| **S5 Pagina presentazione** | `plan113-comp/<componente>.html`: ① componente produzione (screenshot reale), ② layout scelto + modifiche + perché, ③ i mockup generati | pagina |

## 2. Ordine componenti (per importanza/vista)

1. **B1 quest run window** — la più vista (cluster + scelte + skill-check + verdetto). Già iniziata: layout spec fatta, 3 proposte Gemini raccolte (A/B/C), ChatGPT da recuperare.
2. **A triade** — mobile compagnia (roster+stash) + arredo planner+forecast (cornici già generate ma layout non discusso: rifare su metodo).
3. **B secondari** — skill-check column/astrolabio, verdict/epilogo, reward popup.
4. **E/D** — ledger, merchant (ora come componenti veri, non reskin).
5. **F cerimonie** — level-up, settlement-lost, game-over, invasion.
6. **G sistema** — menu, load, settings.
7. **C villaggio** — vista + pin + registry (spec firmata: solo elementi HUD).
8. **H transienti** — toast, tooltip, cartouche, menu minori.
9. **I Pixi** — marker, halo, route (route tecnica sprite atlas).

## 3. Regole

- **Libertà AI** (E-30 + ruling): prompt = funzionale; l'AI propone layout, non esegue una ricetta ornamentale. Constraints solo obbligatori (lingua Zanara, kill-list, campi piani, ortografica).
- **Layout discusso prima di ogni generazione** (E-31): niente cornice/mockup senza spec contenuto + layout ruling.
- **Multi-AI web obbligatorio** per il layout: ≥2 provider se disponibili; se solo 1 risponde, il Director decide se basta o aspettare.
- **Ref = reale, mai WIP**: catture di produzione e asset già battezzati, non bozze.
- **Mockup ≠ componente**: il mockup è proposta estetica; il componente nasce nel port su contratto (PLAN-113 F3) dopo il ruling.

## 4. Note operative

- **ChatGPT:** contesto browser morto a CDP (2026-11-06) — riattivare profilo condiviso o sostituire con Claude finché non torna.
- **Budget quota** (gen-budget.json): a 82/170 alla data; floor riserva ~30. Ogni mockup set dichiara il suo conteggio.
- **Chat separate per componente** in Gemini (regola scene-author: una chat per arte, edit ancorati).
- Le pagine vanno aperte col path completo `…/file.html` (il server Vite non risolve le directory).

## 5. Gate

- **GD per componente:** Director approva il layout proposto prima dei mockup.
- **GM per componente:** Director sceglie/aggrege il mockup set presentato.
- Nessun port a componente senza GD+GM.

## 6. Aperte

1. ChatGPT recovery: riavvio profilo o Claude come secondo votante?
2. Quota per mockup set per componente (proposta: 2-3 per T3/T4, 1-2 per T1/T2).
3. Le cornici già generate (qwin/mc/pa) restano come "esempi" della discussione layout o si rigenerano dopo il layout ruling?

## 7. Emendamenti dalla delibera multi-AI (2026-11-06, pre-battezzo)

- **E-37 Unit of work = pacchetto famiglia**, non superficie singola: coesistenza + contratto contenuto + matrice viewport + layout ruling insieme; pezzi asset solo dove il ruling li richiede (evita re-isolamento template).
- **E-38 Generazione per tipo**: anchored-edit (E-26) obbligatorio su superfici con contratto firmato; prompt-freedom (E-30) solo su hero T3/T4 senza contratto. Non si ri-deriva il kit.
- **E-39 B1 scope = solo chrome**: la finestra quest riceve layout spec + discussione; il teatro resta pista scene-author (B1 consuma il suo output, non lo produce).
- **E-40 Baseline regression prima di F3**: cattura baseline dello stato precedente di ogni superficie; i gate confrontano, non si valuta a occhio.
- **E-41 Gate di coesione cross-famiglia**: dopo ogni famiglia, screenshot `/game` completo contro il kit — anti-drift.
- **E-42 T2 merita più iterazioni di T4**: superfici di lavoro usate ogni giorno > cerimonie rare.

- **E-43 Port E2/E3/F1/F4 su /hud-compose (2026-11-08)**: le 4 superfici firmate (8-A caduti, reliquario 3-col corretto, 9-B luce ascendente, 10-B emblema prodotto) sono ora host `HudReal*` con dati/logica reali — vedi PLAN-113 E-37. Non più mockup-only.
