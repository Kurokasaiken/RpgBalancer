# P0-2 Baseline — primo run live con MW_LEDGER_CLAIMS=1
Date: 2026-10-28 · Run: mind-weaver/.mw/runs/20261028-p02-baseline-ledger (plan phase, 1 ciclo, provider API)

## Risultato
- Hook eseguito correttamente: `cycle-01/claims-source.md` scritto, extractor invocato.
- **Claim estratte: 0** — il provider B non ha emesso il blocco ```claims opzionale.
- rejected.jsonl: vuoto; evidence.jsonl: vuoto.

## Finding (onesto)
Il contratto CLAIMS_FORMAT_SPEC è *opzionale* ("omit the block if no sourced claims") → compliance 0% alla prima run. La risposta del provider citava di fatto file (PLAN-090, mw-ledger.py) ma non nel formato richiesto.

## Opzioni next (per il Director)
a) Rendere il blocco **obbligatorio-quando-citi**: "se citi un file/fonte, DEVI emettere la claim nel blocco" — più parser friction ma dati veri.
b) Estrazione post-hoc senza contratto: un passaggio locale che converte citazioni ref_file/ref_snippet già presenti nel testo in ledger entries — nessuna dipendenza dal formato del provider.
c) Accettare compliance bassa come baseline e misurare il miglioramento con (a).

Raccomandazione orchestrator: (b) poi (a) — (b) dà il baseline reale di citabilità del loop attuale (la domanda di deepseek C7), (a) alza il soffitto.

## Retro-extraction result (option b, same run)
`mw-ledger-extract.py --retro` sul B.md del ciclo 1:
- **1 citazione risolvibile** (scripts/mw-ledger.py) → E-200 citable:false (nessun line-range nel testo).
- Citazioni a file di altro repo (plans/PLAN-090 in RPG) non risolvono — legitimo: l'anchor contract dice repo locale o snapshot.

## Baseline conclusiva (P0-2)
Il loop attuale produce citazioni **informali e deboli**: menziona file ma quasi mai con righe o quote verificabili. Anchored-claim rate ≈ 0-20% senza contratto → conferma che il ledger è necessario, e che il contratto opzionale non basta: serve o l'obbligo "se citi, emetti" (a) o il retro-extract (b) come baseline permanente di citabilità.

## v2 — contratto obbligatorio (2026-10-28)
Run `20261028-p02-baseline-ledger-v2` con CLAIMS_FORMAT_SPEC rafforzato ("se citi, devi emettere"):
- **3 claim estratte, 0 rejected** — E-101..E-103, tutte con quote verbatim e source ancorata (kind=grounding: il candidato plan nel prompt; nessun file repo citato, coerente col contesto dato).
- Quote verificate come verbatim del testo del piano (substring check su grounding passabile).
- **Comparazione:** opzionale → 0 claim; obbligatorio → 3 claim ben formate. L'anchored-claim rate passa da ≈0% a ~100% delle citazioni fatte.
- Limite onesto: n = 1 provider B, 1 ciclo; kind=grounding non esercita il path/repo anchor check (quote substring vs file resta da provare su una run con citazioni repo reali).

## Pilota A/B (2026-10-28) — risultati parziali
- `20261028-ab-pilot-transcript` (arm transcript, 1 ciclo): 4 claim estratte, final.md 7.3KB
- `20261028-ab-pilot-ledger` (arm ledger, 1 ciclo): 0 claim, final.md 7.4KB
- `20261028-ab-pilot-ledger-2c` (arm ledger, stop a ciclo 1 per convergenza): 0 claim

## Findings onesti
1. **Arm ledger funziona** meccanicamente (evidence_mode=ledger, prompt compresso a last-position ≤15 righe + rendered ledger).
2. **Cold-start:** a ciclo 1 il ledger è vuoto per costruzione — il valore dell'arm appare da ciclo 2 in poi. Il pilota a 1 ciclo non misura il beneficio dell'handoff.
3. **Compliance non deterministica:** il contratto "mandatory when citing" ha prodotto 3 claim (v2 run) e 4 claim (transcript pilot) ma 0 claim nelle due run ledger-arm — il provider B può semplicemente non emettere il blocco. Serve o un gate hard (sospetti → extraction-suspect) o il retro-extract come fallback permanente.
4. Blind comparison preparata in /tmp/ab-blind/COMPARISON.md — attende valutazione Director sui 2 final.md.
