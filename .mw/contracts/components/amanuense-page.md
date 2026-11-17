---
id: amanuense-page
kind: component
role: ui-component
tier: 2
root_file: "src/ui/idleVillage/components/gameFrame/AmanuensePage.tsx"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/AmanuensePage.tsx"
  - "src/ui/idleVillage/quests/amanuenseMarkup.ts"
fast_checks:
  - tests/unit/idleVillage/amanuenseSchema.test.ts
  - tests/unit/idleVillage/amanuensePage.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: amanuense-page.INV-1
    source: plan
    source_ref: PLAN-085
    statement: >-
      Un blocco `longForm` valido è accettato su un nodo quest dallo schema di scenario (variant, tier,
      incipitKey, paragraphKeys, marginalia, colophon, explicitKey).
    test_refs:
      - tests/unit/idleVillage/amanuenseSchema.test.ts
  - id: amanuense-page.INV-2
    source: plan
    source_ref: PLAN-085
    statement: >-
      Lo schema `longForm` è strict: campi sconosciuti o `paragraphKeys` malformati vengono rifiutati,
      mai coerti.
    test_refs:
      - tests/unit/idleVillage/amanuenseSchema.test.ts
  - id: amanuense-page.INV-3
    source: plan
    source_ref: PLAN-085
    statement: >-
      `longForm` è opzionale: un nodo senza il campo resta valido.
    test_refs:
      - tests/unit/idleVillage/amanuenseSchema.test.ts
  - id: amanuense-page.INV-4
    source: plan
    source_ref: PLAN-085
    statement: >-
      Il tokenizer di `amanuenseMarkup` produce i segmenti giusti per i token `{r|}`, `{g|}` e `{m|}`
      (rubric, gilt, gloss).
    test_refs:
      - tests/unit/idleVillage/amanuenseSchema.test.ts
  - id: amanuense-page.INV-5
    source: plan
    source_ref: PLAN-085
    statement: >-
      Markup malformato (token sbilanciati, sconosciuti o annidati) restituisce `null` — fallback al
      testo grezzo, mai resa parziale.
    test_refs:
      - tests/unit/idleVillage/amanuenseSchema.test.ts
  - id: amanuense-page.INV-6
    source: plan
    source_ref: PLAN-085
    statement: >-
      La lettera capitale dipinta deriva dalla prima lettera del testo localizzato, non da una
      costante.
    test_refs:
      - tests/unit/idleVillage/amanuenseSchema.test.ts
  - id: amanuense-page.INV-7
    source: plan
    source_ref: PLAN-085
    statement: >-
      Il preset skin amanuense è config-driven (contratto token del folio) — nessun css standalone.
    test_refs:
      - tests/unit/idleVillage/amanuenseSchema.test.ts
  - id: amanuense-page.INV-8
    source: plan
    source_ref: PLAN-085
    statement: >-
      Il folio renderizza incipit, paragrafi, nota di glossa, colophon e il controllo di chiusura a
      sigillo di cera dentro una `region`.
    test_refs:
      - tests/unit/idleVillage/amanuensePage.test.tsx
  - id: amanuense-page.INV-9
    source: plan
    source_ref: PLAN-085
    statement: >-
      Il controllo di chiusura (`amanuense-close`) invoca `onClose` una sola volta per click.
    test_refs:
      - tests/unit/idleVillage/amanuensePage.test.tsx
  - id: amanuense-page.INV-10
    source: plan
    source_ref: PLAN-085
    statement: >-
      Il drop-cap deriva dal primo paragrafo: la prima lettera è consumata dall'iniziale dipinta, non
      ripetuta nel testo.
    test_refs:
      - tests/unit/idleVillage/amanuensePage.test.tsx
---
# amanuense-page

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/AmanuensePage.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/AmanuensePage.tsx`
- `src/ui/idleVillage/quests/amanuenseMarkup.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
