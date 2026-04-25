# Agent Execution Guidelines

**Last updated**: 2026-01-07  
**Purpose**: Standardized execution rules for all agent prompts to ensure consistency, quality, and proper task completion.

---

## 📋 Mandatory Execution Flow

> **Parallel Prompt Rule (2026-01-11)**  
> Quando il coordinator richiede un batch di prompt, ogni voce consegnata deve poter essere eseguita in parallelo sia con gli altri prompt del batch sia con quelli già “In corso”. Se anche un solo prompt richiede serializzazione (dipendenze, stessi file/blocchi) bisogna dividerlo o rimandarlo prima di rispondere al coordinator. Documentare sempre eventuali motivi di non parallelizzabilità nelle note Kanban.

> **Prompt Fulfillment Protocol (2026-01-11)**  
> Quando il coordinator chiede *N* prompt da assegnare, rispondi nell’ordine seguente:
> 1. **Recupera prima i prompt già esistenti** nello stato “Non assegnato” (e non bloccati) dal Kanban, assicurandoti che siano compatibili con i task “In corso”.
> 2. **Verifica il conteggio**: se il numero di prompt disponibili non basta, crea solo i prompt mancanti, mantenendo la Parallel Prompt Rule.
> 3. **Specifica la provenienza**: nella risposta indica chiaramente quali prompt provengono dal backlog e quali sono nuovi, così il coordinator può assegnarli in modo immediato.
> 4. **Nessuna voce duplicata**: non riproporre prompt già “In corso” o “Completato”, e non creare nuove voci se esiste già un prompt equivalente nello stato corretto.
> 5. **Escludi i prompt bloccati**: non proporre task marcati come “Non assegnato (bloccato …)” o con guardie attive finché il blocco non viene rimosso; includili solo dopo che risultano realmente lockabili.
>
> **Backlog Pre-caricato (2026-01-13)**  
> Per rispondere istantaneamente a “dammi X prompt”, il Kanban principale deve mantenere **almeno 40 prompt** già inseriti con stato “Non assegnato”. I batch freschi (es. NP-101…NP-120) vengono prima redatti in `agent_assignments_new_prompts.md`, ma **appena approvati devono essere migrati** nel Kanban con le righe WS6 complete. Il file `agent_assignments_new_prompts.md` funge solo da staging temporaneo; ogni volta che la soglia di prompt disponibili scende sotto 20, il coordinator genera e fa approvare un nuovo blocco per riportare il Kanban in surplus.  
>
> **Ordine operativo**:
>
> 1. Staging batch nel file “new prompts”.
> 2. Approvazione coordinatore → immediato inserimento nel Kanban come “Non assegnato”.
> 3. Aggiornare il conteggio backlog per area (STS, Idle Village, Balancer, Coordinator) e riportarlo nel daily status.
> 4. Usare solo il Kanban per consegnare prompt agli agenti; il file di staging non va più consultato una volta migrato.

### 1. Lock Verification (BEFORE starting)
```bash
npm run prompt:check -- <PROMPT_ID>
```
- **If fails**: STOP immediately and report "prompt già assegnato"
- **If passes**: Continue with task execution
- **Evidence**: Include lock output in final report

### 2. Task Execution
- Follow prompt-specific operations
- Use config-first architecture principles
- Maintain code quality and existing patterns
- Log progress and any blockers encountered

### 2.5 Pre-Completion Quality Gates (NEW - 2026-01-21)

**OBIETTIVO**: Garantire che ogni prompt lasci il progetto in stato committabile e deployabile.

#### Quality Gates Obbligatorie

Prima di marcare il prompt come "Completato", DEVI verificare:

1. **Build Check** (CRITICO)
   ```bash
   npm run build
   ```
   - DEVE passare senza errori TypeScript
   - Se fallisce per errori NEI TUOI FILE → DEVI fixare
   - Se fallisce per errori PREESISTENTI → documenta (vedi sotto)

2. **Lint Scope** (CRITICO)
   ```bash
   npm run lint -- <tuoi file modificati>
   ```
   - DEVE avere 0 errori (warning ok)
   - Se fallisce per errori NEI TUOI FILE → DEVI fixare
   - Se fallisce per errori PREESISTENTI → documenta (vedi sotto)

3. **Test Scope** (CRITICO)
   ```bash
   npm run test -- <test del tuo modulo>
   ```
   - Test del modulo modificato DEVONO passare
   - Se falliscono per TUOI cambiamenti → DEVI fixare
   - Se falliscono per problemi PREESISTENTI → documenta (vedi sotto)

4. **Page Verification** (se modifichi UI)
   - Verifica manualmente che la pagina funzioni (browser o Playwright)
   - Se la pagina è rotta → DEVI fixare
   - Se test Playwright falliscono MA pagina funziona → documenta, OK procedere

#### Gestione Errori Preesistenti

Se trovi errori NON causati dal tuo prompt:

1. **NON tentare di fixarli** (fuori scope)
2. **Documenta nel log** nella sezione "Known Preexisting Issues":
   ```markdown
   ### Known Preexisting Issues
   - File: `src/path/to/file.ts`
   - Error: "Property X does not exist on type Y"
   - Lines: 123-456
   - Impact: Non blocca build production (warning only)
   - Recommended Action: Creare prompt dedicato "Tech Debt - <area>"
   ```
3. **Segnala al Coordinator** per creazione prompt Tech Debt
4. **Procedi con il completamento** se i tuoi cambiamenti sono corretti

#### Criteri di Blocco

Il prompt è **BLOCCATO** (non "Completato") se:

- ❌ Build fallisce per TUOI errori TypeScript
- ❌ Lint fallisce per TUOI errori
- ❌ Test del tuo modulo falliscono per TUOI cambiamenti
- ❌ Pagina UI è rotta per TUOI cambiamenti
- ❌ Non riesci a fixare gli errori che hai introdotto

**Azione se bloccato**: Marca prompt come "Bloccato", documenta il problema, chiedi aiuto al Coordinator.

#### Fail Fast Strategy

Esegui le verifiche in questo ordine (dal più veloce al più lento):

1. Lint (secondi) → fail immediato se errori
2. Build (1-2 minuti) → fail se non compila
3. Test unit (2-3 minuti) → fail se core rotto
4. Test E2E/Playwright (5+ minuti) → fail se UI rotta

Se uno step fallisce, fixa prima di procedere al successivo.

### 3. Safeguard Suite (AFTER completion)
```bash
# 3.1 Test suite (MUST PASS)
npm run test -- <relevant_spec>

# 3.2 Build check (MUST PASS - no TypeScript errors)
npm run build:check

# 3.3 Kanban validation (MUST PASS)
npm run kanban:lint
```

**Critical**: If ANY safeguard fails, the task is **BLOCKED** and cannot be marked as completed.

---

## 📊 Evidence Collection

### Required Evidence Files
- `test-results/<task>-safeguard-<date>.log` (combined test + build + lint output)
- Any additional logs specified in the prompt

### Evidence Content
Each evidence log must include:
- **Pre-Completion Quality Gates** (NEW):
  - Build check output (TypeScript compilation successful)
  - Lint scope output (0 errors on modified files)
  - Test scope output (module tests passing)
  - Page verification result (if UI modified)
  - Known Preexisting Issues section (if any)
- Test suite output (all tests passing)
- Build check output (TypeScript compilation successful)
- Kanban lint output (validation passed)
- Timestamps and exit codes for verification

---

## 🔄 Kanban Completion Steps

### Update Kanban Row
1. Change status to **"Completato"**
2. Set date to today's date
3. Add evidence note: `"Evidence: test-results/<task>-safeguard-<date>.log"`
4. Include brief summary of what was completed

### Final Validation
```bash
npm run kanban:lint
```
- **If passes**: Task is complete
- **If fails**: Fix Kanban formatting issues before finalizing

---

## 🚫 Block Conditions

A task is **BLOCKED** and cannot be completed if:
- `prompt:check` fails (prompt already assigned)
- Any test fails in the test suite
- `build:check` fails (TypeScript errors)
- `kanban:lint` fails (formatting/validation issues)
- Required evidence files are missing or incomplete

**When blocked**: Report the specific failure, include error output, and stop. Do not proceed to Kanban completion.

---

## 📝 Reporting Format

### Final Report Structure
```
## Task Completion Report
**Prompt ID**: <ID>
**Agent**: <Agent Name>
**Date**: <Date>

### Pre-Completion Quality Gates (NEW)
- Build (scope): ✅ PASSED (0 errors in modified files)
- Lint (scope): ✅ PASSED (0 errors in modified files)
- Tests (scope): ✅ PASSED (X/X module tests)
- Page Verification: ✅ PASSED (if UI modified)

### Known Preexisting Issues
<list any errors NOT caused by this prompt, or "None">

### Execution Summary
- Lock: ✅ PASSED
- Tests: ✅ PASSED (X/X tests)
- Build: ✅ PASSED
- Kanban Lint: ✅ PASSED

### Evidence Files
- test-results/<task>-safeguard-<date>.log

### Changes Made
<brief summary of key changes>

### Kanban Update
- Status: Completato
- Evidence: test-results/<task>-safeguard-<date>.log
```

---

## 🎯 Quality Standards

### Code Quality
- No TypeScript errors
- No ESLint warnings
- All tests passing
- Config-first architecture maintained
- No hardcoded values or magic numbers

### Documentation
- Updated relevant docs/plans
- Clear commit messages
- Evidence properly saved and referenced
- Kanban row correctly formatted

---

## 🔄 Continuous Improvement

This document evolves based on:
- New safeguard requirements
- Process improvements
- Agent feedback and issues
- Quality metrics and trends

**Version history**:
- v1.0 (2026-01-07): Initial version with lock, safeguards, and evidence collection
- Future versions will be documented here

---

## 🤖 Kanban Auto Audit

### Overview
The Kanban Auto Audit system provides automated validation of the Kanban board (agent_assignments.md) to ensure compliance with execution policies and evidence requirements.

### Purpose
- Automatically validate "In corso" entries have required agent/date information
- Verify "Completato" entries have proper evidence references
- Check KS-005 policy compliance (completed prompts in documentation, not Kanban)
- Generate comprehensive audit reports for coordinator review

### Usage

#### Run Full Audit
```bash
npx ts-node scripts/coord/kanbanAutoAudit.ts run
```

#### Validate Only (CI/CD)
```bash
npx ts-node scripts/coord/kanbanAutoAudit.ts validate
```

#### Custom File Path
```bash
npx ts-node scripts/coord/kanbanAutoAudit.ts run --file path/to/agent_assignments.md
```

### Audit Rules

#### "In corso" Validation
- ✅ **Required**: Assigned agent name
- ✅ **Required**: Start date
- ⚠️ **Warning**: Entries older than 30 days
- ❌ **Error**: Missing agent or date

#### "Completato" Validation
- ✅ **Required**: Evidence file/log reference
- ⚠️ **Warning**: Missing end date
- ❌ **Error**: No evidence reference

#### "Non assegnato" Validation
- ⚠️ **Warning**: Should not have agent or date

#### Policy Compliance (KS-005)
- ✅ **Compliant**: ≤10 completed entries in Kanban
- ❌ **Non-Compliant**: Too many completed entries
- ❌ **Non-Compliant**: Completed entries missing evidence
- ❌ **Non-Compliant**: "In corso" entries older than 60 days

### Report Output

#### Files Generated
- `test-results/coord-kanban-auto-audit-YYYY-MM-DD.json` - Machine-readable report
- `test-results/coord-kanban-auto-audit-YYYY-MM-DD.md` - Human-readable report

#### Report Contents
- Summary statistics (total entries, errors, warnings)
- Detailed validation results by rule
- Policy compliance status
- Specific recommendations for issues found

### Integration with CI/CD

#### GitHub Actions Example
```yaml
- name: Kanban Auto Audit
  run: |
    npx ts-node scripts/coord/kanbanAutoAudit.ts validate
  if: ${{ failure() }}
    echo "Kanban audit failed - check compliance"
    exit 1
```

#### Pre-commit Hook
```bash
#!/bin/sh
npx ts-node scripts/coord/kanbanAutoAudit.ts validate
```

### Troubleshooting

#### Common Issues
- **File not found**: Ensure agent_assignments.md exists in correct path
- **Parse errors**: Check markdown table formatting (proper pipe separators)
- **Missing evidence**: Verify "Evidence:" lines follow completed entries

#### Debug Mode
```bash
npx ts-node scripts/coord/kanbanAutoAudit.ts run --file path/to/agent_assignments.md --output debug/
```

### Maintenance

#### Regular Tasks
- Run audit weekly to ensure Kanban compliance
- Review audit reports for patterns or systemic issues
- Update validation rules as policies evolve
- Archive old completed entries to documentation

#### Rule Updates
When updating validation rules:
1. Modify validation functions in `scripts/coord/kanbanAutoAudit.ts`
2. Update unit tests in `tests/unit/coord/kanbanAutoAudit.test.ts`
3. Update this documentation section
4. Run full test suite to ensure compatibility

---

## 🔍 Storage Testing Audit Process

### Purpose
Ensure all modules with PersistenceService have proper test scenarios in the Storage Test Framework and generate Kanban compliance reports.

### When to Run
- **Before**: Any new persistence module implementation
- **During**: Code reviews for storage-related changes
- **After**: Major refactoring of persistence patterns
- **Scheduled**: Weekly compliance checks

### Audit Execution

#### 1. Run Storage Audit
```bash
# Generate audit report (markdown format)
tsx scripts/coord/storageAudit.ts

# Generate JSON report for CI/CD
tsx scripts/coord/storageAudit.ts --format json

# Save report to file
tsx scripts/coord/storageAudit.ts --output audit-report.md
```

#### 2. Review Coverage Metrics
- **Critical**: <50% coverage - Immediate action required
- **Warning**: 50-80% coverage - Priority for next sprint
- **Good**: 80-99% coverage - Plan for completion
- **Excellent**: 100% coverage - Maintain standards

#### 3. Remediation Checklist
For modules missing storage tests:

**High Priority (Config/Service modules)**:
- [ ] Create storage test file in `tests/storage/`
- [ ] Implement basic save/load test scenario
- [ ] Add error handling test scenario
- [ ] Include performance test scenario
- [ ] Update documentation

**Medium Priority (Hook/Component modules)**:
- [ ] Create storage test file in `tests/storage/`
- [ ] Implement basic save/load test scenario
- [ ] Add error handling test scenario

**Low Priority (Utility modules)**:
- [ ] Create storage test file if persistence used
- [ ] Implement basic test scenario

#### 4. Integration with Kanban
```bash
# Kanban validation will fail if:
npm run kanban:lint

# Critical issues detected:
# - High priority modules missing tests
# - Coverage <50%
# - Required test patterns not found
```

### Test Pattern Requirements

#### Naming Convention
- Test files: `tests/storage/<modulePath>.test.ts`
- Test functions: `test<ModuleName>Storage` or `storageTest<ModuleName>`
- Scenarios: `scenario<Description>Storage`

#### Required Test Scenarios
1. **Basic Save & Load**: Verify data persistence
2. **Data Integrity**: Ensure deep equality after save/load
3. **Error Recovery**: Handle save/load failures gracefully
4. **Performance**: Benchmark save/load operations
5. **Concurrent Operations**: Handle simultaneous access

---

## 13. React/Electron Performance Mandate (2026-02-08)

Per tutti i prompt React/Electron (Idle Village, Punch Club, Balancer UI) il coordinator deve verificare che:

1. **Offload obbligatorio** – Monte Carlo, telemetria, pathfinding o altri calcoli CPU-heavy devono girare in Web Workers/`worker_threads`/WASM. Il prompt deve citare i file worker e includere safeguard/test dedicati (`npm run test -- workers/...`).
2. **Layer grafico dedicato** – Sfondi animati, mappe e auto-battler usano canvas WebGL (Pixi.js, `react-pixi`, OffscreenCanvas). È vietato introdurre nuove animazioni DOM basate su `top/left`. Specificare i file canvas/Pixi nelle sezioni FILE TARGET e OPERAZIONI.
3. **Virtualizzazione & memo** – Liste >50 elementi devono usare `react-window`, `react-virtuoso` o equivalenti. Le card/HUD devono richiedere `React.memo`, `useMemo`, selettori granulari; includere acceptance test su re-render.
4. **Budget & telemetria** – Ogni prompt UI deve allinearsi a `src/docs/docs/analysis/react_electron_performance_guidelines.md`, citandola nel testo. La safeguard suite deve prevedere almeno un comando di profiling (es. `npm run perf:trace -- minimal-gameplay`) e allegare RAM/CPU nel log evidence.
5. **Scelta tecnologica** – Se emergono richieste di motori visivi alternativi (Unity, Godot, Bevy), il coordinator deve respingerle salvo approvazione strategica esplicita: lo stack ufficiale resta React + TypeScript + Pixi + workers.

I prompt che non rispettano queste regole vanno riscritti prima dell’assegnazione. Citare sempre la sezione pertinente quando si correggono o si contestano task non compliant.

#### Example Test Structure
```typescript
import StorageTestFramework from '@/shared/testing/StorageTestFramework';

describe('ConfigStore Storage Tests', () => {
  const testData = { key: 'value', nested: { data: true } };
  const alternateData = { key: 'alternate', nested: { data: false } };

  const adapter = {
    save: (data) => ConfigStore.save(data),
    load: () => ConfigStore.load(),
    clear: () => ConfigStore.clear(),
  };

  const tester = new StorageTestFramework('ConfigStore', adapter);
  
  test('should pass all storage tests', async () => {
    const results = await tester.runFullTest(testData, alternateData);
    expect(results.successRate).toBe(100);
  });
});
```

### Automated Integration

#### CI/CD Pipeline Integration
```yaml
# .github/workflows/storage-audit.yml
name: Storage Testing Audit
on: [push, pull_request]

jobs:
  storage-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Storage Audit
        run: |
          npm run storage:audit --format json --output audit-results.json
      - name: Check Coverage
        run: |
          node scripts/check-storage-coverage.js audit-results.json
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: storage-audit-report
          path: audit-results.json
```

#### Coverage Check Script
```javascript
// scripts/check-storage-coverage.js
const report = JSON.parse(readFileSync(process.argv[2]));
const coverage = report.summary.coveragePercentage;

if (coverage < 50) {
  console.error('❌ CRITICAL: Storage test coverage below 50%');
  process.exit(1);
} else if (coverage < 80) {
  console.warn('⚠️  WARNING: Storage test coverage below 80%');
  process.exit(0);
} else {
  console.log('✅ Storage test coverage acceptable');
  process.exit(0);
}
```

### Reporting & Documentation

#### Weekly Audit Report Template
```markdown
# Storage Testing Weekly Audit - [Date]

## Summary
- **Total Modules**: X
- **Coverage**: Y%
- **Critical Issues**: Z
- **New Modules Added**: N

## Coverage Trend
| Week | Coverage | Critical Issues |
|------|----------|----------------|
| W1    | 85%     | 0              |
| W2    | 92%     | 0              |
| W3    | 88%     | 1              |

## Action Items
- [ ] Create tests for high-priority modules
- [ ] Review coverage trends
- [ ] Update documentation
- [ ] Schedule remediation sprints

## Evidence
- Audit report: [link to report]
- Test results: [link to CI/CD]
- Kanban status: [link to board]
```

---

## 📚 Related Documents

- [Prompt Library](../prompts/prompt_library.md) - Template reference
- [Agent Assignments](agent_assignments.md) - Kanban board
- [Project Philosophy](../../philosophy.md) - Architecture principles
- [Storage Testing Framework](../../../shared/testing/StorageTestFramework.ts) - Testing utilities

---

## 🔄 CI/CD Integration Appendix

### Kanban Lint CI Integration
All kanban changes are automatically validated through CI/CD pipeline:

#### Pre-commit Validation
```bash
# Automatically runs before each commit
npm run kanban:lint
npx tsx scripts/coord/kanbanLintIntegration.ts validate-policy
```

#### GitHub Actions Validation
```bash
# Runs on PRs and pushes to main/develop
- Kanban lint validation
- KS-005 policy compliance check
- CI failure reporting
- Automated artifact upload
```

### CI Failure Resolution
1. **Check CI failure report**: `docs/coordinator/ci-failure-reports.md`
2. **Run local validation**: `npm run kanban:lint`
3. **Fix violations**: Update kanban entries following KS-005 policy
4. **Re-validate**: `npx tsx scripts/coord/kanbanLintIntegration.ts full-validation`
5. **Commit fixes**: CI will automatically validate again

### Policy KS-005 Integration
- **Agent workload limits**: Max 3 concurrent "In corso" tasks
- **Evidence requirements**: All "Completato" tasks need verifiable evidence
- **Stale task monitoring**: Automatic flagging of old "In corso" entries
- **Automated reporting**: Daily compliance and workload reports

### CI Tools Reference
- **kanbanLintIntegration.ts**: CI guardrails and policy enforcement
- **kanbanAutoAudit.ts**: Comprehensive auditing with CI status
- **KS-005_Policy_Refresh.md**: Complete policy documentation

---

**Note**: These guidelines are mandatory for all agent prompts. Deviations require explicit approval and documentation.
