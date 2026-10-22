# PLAN-069: chiusura totale — prima il review round, poi tutto ciò che resta aperto (R-235)

**Status:** `baptized` — Director 2026-10-20 («crea un macro plan che copra prima questo, poi tutto quello che è rimasto aperto/inconcluso»).
**Richiesta:** `R-235`. Continua R-233 (inventario riconciliato dei non-terminali) e PLAN-049 (coda sequenziale — questo plan è la sua istanziazione sul residuo reale).
**Regole ereditate:** nessun plan si dichiara concluso senza acceptance + gate umani passati; i `kind: backfill` del timing ledger non sono chiusure; T-13 sul worktree condiviso (mai commit che catturano lavoro altrui); niente finestre in primo piano.

---

## Onda 0 — sblocco umano (prima di tutto)

| Task | Plan | Acceptance |
|---|---|---|
| T-001 | **PLAN-068 Director review round** | tutte le voci G-01..G-10 con ruling; difetti disposti |

> Perché prima: il collo di bottiglia del "100%" non è l'implementazione ma i gate umani sparsi. Una sessione sola del Director sblocca a valle ~7 piani.

## Onda 1 — chiusure meccaniche (appena `contracts:check`/`closure:lint` verdi)

| Task | Plan | Residuo | Blocco attuale |
|---|---|---|---|
| T-010 | PLAN-033 → `completato` | re-run `plan033-bv36` OB-4/5 + `plan:stamp close` | drift attivo sessione parallela (UNMAPPED, ref R-234, inventory.json) |
| T-011 | PLAN-054 → `completato` | `plan:stamp close` (task+bundle già PASS) | stesso gate |
| T-012 | PLAN-063 → `completato` | bundle + stamp; residui già → PLAN-067 | stesso gate |
| T-013 | PLAN-062 | già `superseded → PLAN-067 T-B3` — solo verifica contabile | — |

## Onda 2 — implementazione attiva (sequenziale per PLAN-049)

| Task | Plan | Residuo |
|---|---|---|
| T-020 | PLAN-053 | T-007 + OB-7 (gate → G-02/G-03 in PLAN-068) |
| T-021 | PLAN-067 | onde A/B/C → T-Z (in corso, sessione dedicata) |
| T-022 | PLAN-026 | T6 (motore quest gen; dopo atterraggio 053) |
| T-023 | PLAN-051 | T-005 completamento + T-007 |
| T-024 | PLAN-059 | T-003 dogfood metriche |

## Onda 3 — disposizioni e figli del round

| Task | Plan | Residuo |
|---|---|---|
| T-030 | PLAN-028, PLAN-029, PLAN-052, PLAN-066, PLAN-070 | battezzo o disposizione esplicita (candidate/draft non si eseguono; 070 = delezioni file morti corrotti) |
| T-031 | PLAN-039 | sospeso — ripresa o archiviazione solo su ordine Director |
| T-032 | difetti `DF-NNN` da PLAN-068 | fix qui o plan figli battezzati |
| T-033 | PLAN-043-S1/S2 dopo F1 (G-06/G-07) | chiusura post-ruling |
| T-034 | PLAN-027 dopo D6 (G-08) | chiusura post-ruling |
| T-035 | PLAN-050 dopo G-09 + OB-8 | chiusura post-ruling |
| T-036 | PLAN-019-S1 dopo G-10 | chiusura post-playtest |

## Onda 4 — aggregati (chiudono quando i figli chiudono)

| Task | Plan | Condizione |
|---|---|---|
| T-040 | PLAN-043 master | tutti i figli S* terminali (S11/S12 dopo D9 + audit) |
| T-041 | PLAN-046 | residuo già → PLAN-050; segue 050 |
| T-042 | PLAN-019 master | S1 + figli |
| T-043 | PLAN-049 | metaplan: si chiude quando la coda è svuotata o sostituito |

## Note operative

- **Gate governance condiviso:** `contracts:check` fallisce su file di sessioni parallele in volo (T-13). La regola: ritenta a finestra verde; non "aggiustare" mai file altrui per sbloccare il gate. L'unica eccezione registrata a carico di questo lavoro: `EXC-20261020180919-8b83` su `PoiMarkerLabPage.tsx`.
- **Ordine dentro le onde:** una voce alla volta (PLAN-049); niente skip di gate.
- **Debito noto fuori scope:** file morti corrotti (`src/analytics/*`, `PgCardTS002.tsx`, `mapPerformanceProfilerConfig.ts`, …) con `\n` letterali — task di ripulitura da valutare come plan figlio o DF nel round.

## Contratto di chiusura

PLAN-069 si chiude quando ogni plan citato è in uno stato terminale (`completato`/`superseded`/`deprecated`/`archiviato` per disposizione esplicita) **oppure** trasferito a un macro-successore battezzato dal Director. Verifica: riconciliazione INDEX ↔ frontmatter ↔ ledger, `closure:lint` verde, stamp.
