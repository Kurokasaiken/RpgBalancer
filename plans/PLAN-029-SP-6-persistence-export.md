---
title: 'PLAN-029 SP-6 — Persistence & export envelope'
status: active
created: 2026-10-12
parent: PLAN-029
debate: mw-web-debate `20261012-quest-gen-lab-sp6-persistence-export` — artifact
  r003 converged 2/2 eligible (deepseek ACCEPT; gemini ACCEPT; chatgpt
  provider_outage alla fase di acceptance — web outage, OBJECT r002 B-7 risolta
  verbatim in r003 con la sua stessa prescrizione, anticipated-accept
  documentato in turn_resolution T-0023; grok provider_dead ×4)
artifact_sha256: 1f8d9d99ad13eb073de590a729736f03d7c5472c2f7a28e293aafc0b56decb29
depends_on: PLAN-029 SP-1 (receipt shapes pinnate, canonicalize, gate OPEN
  version ownership — CHIUSO qui), SP-2 (LabCandidate + serialize/hydrate
  seam), SP-3 (report by scenarioHash), SP-5 (drafts session-scoped)
---

# SP-6 — Persistence & export envelope — artifact r003

> **AMEND-2(b,c) — ratifica 2026-10-23:** il journey-DAG check è gate al seam export/POI-targeting (qui), non run-entry; il freshness claim dei report è esplicito sullo scope — content hash = validità scenario-intrinseca, compatibilità POI dentro il claim o dichiarata fuori. Vedi PLAN-029 §7.

3 revisioni. r003 assorbe: chatgpt OBJECT B-7 (receiptError → discriminated
union tipata); r002 aveva assorbito chatgpt B-1..B-6 (flush async onesto, gate
versioni, storico report plurale, associazione receipt↔candidato, regola
scenarioHash, confine pickerSettings) + deepseek B-1/B-2 (pluralità
inconsistente, export-fail over-strict).

## 0. Scope

W6 di PLAN-029: durabilità del lab tra sessioni + envelope export/import +
policy versioni/migrazione. NON possiede: authoring (SP-5), validazione
(SP-3), MC (SP-4), UI chrome (SP-8), mutare shape pinnate SP-1/SP-2.

## 1. Persistence boundary

| Dato | Durable? | Chiave | Nota |
|------|----------|--------|------|
| `LabCandidate[]` | ✅ | `qgl:v1:candidates` | blob `{v:1, candidates}` strict |
| Report storici | ✅ | `qgl:v1:reports` | `Record<scenarioHash, ReportRecord[]>` **plurale**: `ReportRecord = {executedAt, reportVersion, report}`; TUTTE le esecuzioni distinte conservate; dedupe solo su record canonically-identici. STALE mai persistito |
| `pickerSettings` | ✅ | `qgl:v1:pickerSettings` | `{gimmickId, kitId, tuningPresetId}` — **solo selezioni di navigazione** (B-6): nessun override di drawer/what-if vi atterra mai |
| Draft overrides / what-if / drawer state | ❌ | — | test di esclusione |
| Receipts | ❌ derivati | — | computati all'export; mai tabella parallela |

Tutto via `PersistenceService`; quota/serialize failure → errore esplicito,
niente eviction/LRU.

## 2. Autosave — async flush onesto (B-1)

- Debounce FUORI dal reducer: effect keyed su snapshot serializzato stabile,
  timer in ref, StrictMode-safe. ~500ms, ogni commit resetta.
- `flush(): Promise<FlushResult>` — serializza le scritture per revisione.
  Stati: `requested | completed | failed`; un flush fallito lascia dirty +
  retry, MAI cancella un salvataggio pendente in silenzio.
- **Export**: await flush → poi export dello snapshot in memoria; flush
  fallito → export consentito con avviso "file exported, local save failed".
- **Unmount**: tenta flush senza dichiarare durabilità garantita — la
  durabilità deriva dall'autosave completato.
- Failure → banner persistente i18n + retry esplicito.

## 3. Version ownership — chiude il gate OPEN di SP-1

Costanti **co-locate** col dominio; `labVersions.ts` re-esporta + drift test:

| Campo | Owner | Bump rule |
|-------|-------|-----------|
| `generatorVersion` | costante nella riga GimmickRegistry | logica generazione → output deterministico |
| `schemaVersion` | costante nel modulo contratti/schema SP-1 | schema Zod incompatibile |
| `engineVersion` | costante nel modulo engine questRun | semantica motore |

- Semver esplicite, mai da package.json/timestamp/git. `gitSha`/`builtAt`
  solo in `provenanceMeta`, mai hash-coperti.
- **Due compatibilità distinte** (B-2): `v` = compatibilità strutturale
  envelope (gate); `schemaVersion`/`engineVersion` = strict reject su
  mismatch (policy v1 deliberata); `generatorVersion` = **mai gate globale**,
  risolto **per candidato** dalla sua provenance.
- Receipt underivable per un candidato → candidato esportato comunque con
  wrapper `status:"error"` — mai export-fail totale, mai riscrittura
  silenziosa.

## 4. Export envelope (v:1, Zod strict)

```ts
{
  v: 1,
  exportedAt: ISO8601,
  provenanceMeta: { gitSha?, builtAt? },
  versions: { generatorVersions: Record<gimmickId,string>, schemaVersion, engineVersion },
  candidates: LabCandidate[],
  reportsByHash: Record<scenarioHash, ReportRecord[]>,
  receipts: {
    generation: ({ candidateId, status:"ok", receipt: GenerationReceipt }
               | { candidateId, status:"error", errorCode: ReceiptErrorCode })[],
    run:        ({ candidateId, status:"ok", receipt: RunReceipt }
               | { candidateId, status:"error", errorCode: ReceiptErrorCode })[],
  }
}
// ReceiptErrorCode = 'underivable-provenance' | 'integrity-failed' (i18n)
```

- Wrapper `{candidateId, receipt}`: l'associazione vive nell'envelope, non
  nelle shape SP-1 pinnate (B-4). Wrapper error NON sono receipt validi;
  la distinzione unavailable/integrity-failed sopravvive all'import (B-7).
- Golden-vector test contro i vettori SP-1; niente seconda ricetta di hash.
- File `qgl-export-<ISO>.json`, azione esplicita, await flush prima.

## 5. Import — pipeline a stadi

`parse → schema v1 → v gate → versions gate (schema/engine strict) →
per-entry merge → summary`.

- **All-or-nothing**: JSON corrotto, schema invalid, `v !== 1`,
  `schemaVersion`/`engineVersion` mismatch → reject totale, stato invariato.
- **Per-entry candidati** (B-5): stesso id + provenance identica → skip
  dedupe; stesso id + provenance diversa → reject entry + suoi
  receipt-wrapper come unità (niente orfani); **id diverso + stesso
  scenarioHash → ENTRAMBI tenuti** (candidati distinti; provenance non si
  fonde mai).
- `reportsByHash`: union per hash; dedupe solo record canonically-identici;
  storici, STALE derivato dopo.
- Summary i18n con conteggi added/duplicated/conflicted.

## 6. Migration seam

`persistence/migrations/` — `MigrationFn` typed + registry vuoto + contract:
pure, pre-Zod, golden vector per shape precedente. v1 = strict
reject-and-surface (hydrate null → fresh + notice).

## 7. Honest-state matrix

| Fallimento | Stato | i18n |
|---|---|---|
| Quota/serialize | banner + retry; pending mai cancellato | `qgl.persistence.unsaved` |
| Export con save fallito | file prodotto + avviso | `qgl.export.unsavedWarning` |
| Receipt underivable | wrapper error + summary "K underivable" | `qgl.export.receiptError` |
| JSON/schema/v/versions invalid | reject totale + dialog | `qgl.import.*` |
| Collisione provenance | warning "N skipped, M receipts dropped" | `qgl.import.partialConflict` |
| Dedupe | toast | `qgl.import.deduped` |
| Hydrate null | notice + fresh state | `qgl.persistence.reset` |

## 8. Tasks

| T | Task | Test |
|---|------|------|
| T-1 | blobs + Zod strict + keys | round-trip; draft-exclusion; B-6: override mai serializzato in pickerSettings |
| T-2 | autosave + flush():Promise + revision serialization | StrictMode; flush awaited on export; flush-failed → dirty+retry; unmount non dichiara durabilità |
| T-3 | labVersions + co-locate + drift test | deep-equal re-export↔sorgenti |
| T-4 | export builder | golden vectors SP-1; per-candidato version resolve; underivable → wrapper error enum; wrapper candidateId |
| T-5 | import pipeline | ogni riga matrix; id diverso+stesso scenarioHash → entrambi tenuti; report union + dedupe identici |
| T-6 | migration seam | registry vuoto + contract |
| T-7 | e2e mutate→save→reload→export→import | loop completo; SP-2/3/5 intatti |

## 9. Non-goals

Cloud sync; LRU/compressione; forward-migration; receipt storage locale;
re-run gate all'import; mutare shape SP-1/SP-2; pickerSettings oltre le 3
selezioni; export dei baked entries; candidateId dentro le shape pinnate.

## 10. Rulings

- R-1: report persistiti come storici plurali (dedupe solo identici).
- R-2: pickerSettings = 3 selezioni di navigazione, chiave separata (B-6).
- R-3: `schemaVersion`/`engineVersion` strict-reject = policy deliberata v1,
  ammorbidibile con migration in v2.
