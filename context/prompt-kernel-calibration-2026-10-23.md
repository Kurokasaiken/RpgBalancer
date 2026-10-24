# Calibrazione lint kernel pittorico (PLAN-080, T-002)

**Snapshot corpus**: pre-migrazione, commit base `57c5994c` (worktree).
**Escluso**: `f3-accampamento-dusk` = failure noto (caso scatenante R-272).
**Corpus**: 26 prompt in `.mw/specs/*/scenes/` — goblin-scenes (14),
journey-legs (2), rovine-scenes (8).

## Esito pre-migrazione (check Q13–Q17)

| Esito | Prompt | Note |
|---|---|---|
| PASS | andata, ritorno, f1-albero, f1-tracce, f3-assalto*, f3-intrusi*, f7-ultimo-scontro* | formato denso «Verso Mordor» (*RISERVA, saltate di default) |
| FAIL Q13+Q15 | f0-mercante, f0-viaggio, f1-esplorazione, f2-bottino, f3-accampamento, f4-combattimento, f5-incalzare, f6-spoglie-di-guerra, f7-agguato, f8-ritorno, quest-card | apertura narrativa (no medium-first), 2 token stile |
| FAIL Q13+Q15+Q3 | r0–r7 rovine (r2, r4 anche Q5 deep teal) | prosa pittorica senza ancora SUBJECT |
| FAIL Q13+Q14+Q15 | f3-accampamento-dusk (failure noto) | + `18%` residuo REG-NUM |

## Triage (regola corpus-invariance r003)

Classificazione: **(b) violazioni reali in prompt approvati** — i check non
sono difettosi (misurano la convenzione degli esemplari); i prompt legacy
precedono la convenzione kernel. → **migrazione** (T-004a/b), nessuna
demotion: nessun prompt del corpus usa legittimamente linguaggio camera o
coordinate nel blocco prompt.

Soglia Q16 warn: riferimento dusk-v1 ~30% parole in run espliciti.
