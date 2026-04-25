# 🛡️ Weekly Code Health Check

> Copia questo template e salva il report come `docs/reports/weekly_review_YYYY-MM-DD.md` ogni venerdì.

## 1. Debt Radar

- Classi/funzioni >100 righe o con troppe responsabilità:
  - `TODO`
- Azione proposta / owner:
  - `TODO`

## 2. Config Check (Magic Numbers)

- File / riga con costanti hardcoded:
  - `TODO`
- Spostare in `src/balancing/config/...` o `config/*.ts`?
  - `TODO`

## 3. UI Isolation Violations

- UI script che chiamano direttamente l'engine invece di usare driver/eventi:
  - `TODO`
- Fix suggerito (es. nuovo event buffer, hook dedicato):
  - `TODO`

## 4. Context Update

- `docs/architecture_state.md` è ancora allineato (S/N)?
  - `TODO`
- Note da applicare al router o ai piani:
  - `TODO`

## 5. Checklist & Follow-up

- Ticket aperti dal review:
  - `TODO`
- Bloccanti per il prossimo sprint?
  - `TODO`
