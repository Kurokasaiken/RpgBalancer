# Istruzioni per Cleanup Prompt Bloccati

## Problema
Il Kanban contiene ~40 prompt con dipendenze non risolte che bloccano gli agenti.

## Soluzione
Rimuovere temporaneamente i prompt bloccati dal Kanban principale e tracciarli in `blocked_prompts.md`.

---

## Lista Prompt da Rimuovere

### Gruppo 1: Dipendenti da E2E-VRT-001 (8 prompt)
```
NP-078 – Idle Village Visual Baseline Wave 2
NP-081 – Visual Regression Orchestrator CLI
NP-082 – Idle Village Interaction Mode Accessibility Sweep
NP-084 – Idle Village Theater Mini-Card Sync
NP-091 – Punch Club Surge Tutorial Visual Baseline
NP-095 – STS Deck Consistency Visual Regression Suite
NP-112 – Idle Village Drop Feedback Visual Baseline Suite
NP-120 – STS Intent Overlay Interaction Logger
```

### Gruppo 2: Dipendenti da GT-3 (4 prompt, alcuni overlap con Gruppo 1)
```
NP-089 – Punch Club Consent Heatmap & KPI Dashboard
NP-107 – Punch Club Consent Flow Analytics Dashboard
NP-117 – Punch Club Consent Copy Localization Config
```

### Gruppo 3: Dipendenti da PC-M3 (6 prompt, alcuni overlap)
```
NP-126 – Punch Club Telemetry Evidence Dashboard
NP-137 – Punch Club Quest Copy Telemetry Mapper
NP-158 – Punch Club Install Acceptance Analytics Hook
```

### Gruppo 4: Dipendenti da WS6.3-S2 (6 prompt)
```
NP-064 – Idle Village Interaction Touch Optimizer
NP-102 – Idle Village ActivitySlot Telemetry Mirror
NP-149 – Idle Village Phase E Drag Stress Replay CLI
NP-150 – Idle Village Phase E Scenario Export CLI
NP-151 – Idle Village Drag Telemetry Drift Monitor
```

### Gruppo 5: Dipendenti da Phase 12 Map (20 prompt)
```
NP-111 – Active HUD Compact Mode
NP-113 – Idle Village Risk Display Stress Harness
NP-114 – Idle Village Active HUD Accessibility Suite
NP-115 – Idle Village ActivitySlot Palette Consistency Checker
NP-118 – Idle Village Theater Mini-Card Visual Parity Tests
NP-119 – Idle Village Maintenance Needs Telemetry Aggregator
NP-127 – Idle Village ActivitySlot Persistence Recovery Tests
NP-129 – Idle Village Quest Decision Heatmap Dashboard
NP-130 – Idle Village Quest Decision Telemetry CLI
NP-131 – Idle Village Quest Decision Feed Toolbar UX Polish
NP-132 – Idle Village Quest Decision Feed Header Analytics
NP-133 – Idle Village Quest Decision Feed Hook Hardening
NP-134 – Idle Village Quest Decision Feed Analytics Exporter
NP-135 – Idle Village Quest Decision Feed Evidence Buffer
NP-136 – Idle Village Active HUD Mini-Card Accessibility Doc
NP-139 – Idle Village Quest Decision Feed Notification Badges
NP-140 – Idle Village Quest Decision Incident Reporter CLI
```

---

## Comando per Rimozione Automatica

**ATTENZIONE**: Backup del Kanban prima di eseguire!

```bash
# Backup
cp src/docs/docs/coordinator/agent_assignments.md src/docs/docs/coordinator/agent_assignments.md.backup-$(date +%Y%m%d)

# Script Python per rimozione selettiva (da creare)
python scripts/coordinator/removeBlockedPrompts.py \
  --input src/docs/docs/coordinator/agent_assignments.md \
  --blocked-list src/docs/docs/coordinator/blocked_prompts.md \
  --output src/docs/docs/coordinator/agent_assignments.md
```

---

## Alternativa Manuale (Più Sicura)

1. Aprire `agent_assignments.md`
2. Cercare ogni prompt ID dalla lista sopra
3. Rimuovere l'intera entry (dalla riga `| NP-XXX` fino alla riga `EVIDENCE LOG`)
4. Salvare e verificare con `npm run kanban:lint`

---

## Verifica Post-Rimozione

```bash
# Contare prompt rimasti
grep -c "| NP-" src/docs/docs/coordinator/agent_assignments.md

# Verificare integrità
npm run kanban:lint

# Dovrebbe riportare ~60 prompt invece di ~103
```

---

## Quando Riassegnare i Prompt Bloccati

### Trigger: E2E-VRT-001 Completato
- Riassegnare: NP-078, NP-081, NP-082, NP-084, NP-091, NP-095, NP-112, NP-120

### Trigger: GT-3 Completato
- Riassegnare: NP-089, NP-107, NP-117

### Trigger: PC-M3 Implementato
- Riassegnare: NP-126, NP-137, NP-158

### Trigger: WS6.3-S2 Implementato
- Riassegnare: NP-064, NP-102, NP-149, NP-150, NP-151

### Trigger: Phase 12 Map Completato
- Riassegnare: NP-111, NP-113-115, NP-118-119, NP-127, NP-129-136, NP-139-140

---

**Creato**: 2026-01-23
**Prompt totali da rimuovere**: ~40
**Prompt che rimarranno attivi**: ~60
