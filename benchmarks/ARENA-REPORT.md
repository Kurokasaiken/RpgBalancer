# ARENA-REPORT — model arena v2 (PLAN-041)

**Run:** `model-arena-2026-10-16T10-02-01` · 18 run (3 casi × 6 lane × contract)
**Dati:** `test-results/bench-replay/model-arena-2026-10-16T10-02-01/`
**Verdetto d'insieme:** nessuna lane free ha prodotto un patch che supera il
contratto. La maggior parte dei fallimenti è **infrastrutturale** (quota/saturazione),
non una prova di incompetenza del modello — con l'eccezione di nemotron, che ha
lavorato davvero e ha comunque fallito il gate.

## Verdetto per lane

| lane | esito | causa | INCLUDE/EXCLUDE |
|---|---|---|---|
| gemini-3.8-flash (google) | FAIL ×3, 0 file | HTTP 503 bursts (saturazione free tier; il backoff 8×45s non basta contro finestre lunghe) | EXCLUDE oggi — riprovabile quando le burst passano |
| gpt-oss-120b (groq) | FAIL ×3, 0 file | HTTP 429 — quota giornaliera già bruciata dai test | **INCONCLUSIVE** — mai eseguito davvero |
| qwen3.8-27b (groq) | FAIL ×3, 0 file | HTTP 429 idem | **INCONCLUSIVE** |
| gpt-oss-120b (cerebras) | FAIL ×3 in ~3s | HTTP 402 — billing richiesto | EXCLUDE (lane morta fino a billing) |
| nemotron-3-super-120b (openrouter) | FAIL ×3, 3 file su B1, 11% golden | ha davvero lavorato (tool call reali, 1051s) ma non ha chiuso il contratto | EXCLUDE al gate di correttezza |
| mistral-small-latest | FAIL ×3 | HTTP 429 — quota experiment tier | **INCONCLUSIVE** |

## Cosa risponde davvero ai 6 punti del Director

1. **Baseline locale senza contratto:** B2 risolto in ~3 min + 20s verify,
   contratto verde al primo colpo. Nessuna lane si avvicina.
2. **Contratto + locale:** il pacchetto contratto B2 è costato ~8 min —
   leverage inversion confermata su task piccoli: il contratto si ripaga solo
   se riusato ×N lane o come artefatto di chiusura R-189 (il suo vero ruolo
   nel workflow v31).
3. **Modelli free:** nessuno ha prodotto risultato corretto. Capacità free =
   vincolo dominante (429/503/402 ovunque); la competenza del modello è
   misurabile solo su nemotron, che fallisce.
4. **Esclusione:** applicata — 4 lane su 6 escluse, 2 inconclusive per cause
   ambientali (riprovare quando le quote tornano, non come corsia primaria).
5. **Parallelizzazione:** le lane free non possono oggi scaricare lavoro in
   modo affidabile. Cosa resta parallelizzabile in sicurezza: verifiche
   meccaniche (lint/test/bundle in background), generazione context-pack,
   telemetria — non implementazione.
6. **Agente locale:** confermato come unico executor affidabile; il suo ruolo
   alto resta contract/planner/reviewer + implementazione dei task non
   meccanici — cioè quasi tutti, su questo repo.

## Conclusione operativa

Coerente con v31 (dispatch in pausa): **il locale lavora da solo**. Le lane
esterne si riattivano solo se il volume di task meccanici in coda supera la
capacità della conversazione — e solo dopo un re-probe delle quote (Groq è il
candidato da ri-testare per primo: 429 oggi era quota bruciata, non prova di
fallimento). Il valore duraturo dell'arena non sono le lane ma l'impianto:
contratti come oracoli, worktree isolati, telemetria onesta dei fallimenti.
