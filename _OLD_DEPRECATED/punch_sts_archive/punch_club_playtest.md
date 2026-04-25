# Guida Punch Club Lab Development

Questa guida spiega come usare Punch Club in ambiente di sviluppo locale (lab only) per testing, telemetria e sviluppo. Non è disponibile come PWA o per distribuzione pubblica.

## Prerequisiti

- Ambiente di sviluppo locale con Node.js 18+
- Browser moderno (Chrome, Firefox, Safari)
- Accesso al codice sorgente del progetto

## Lab Only Development

### Avvio Locale

1. Clona il repository del progetto:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   npm install
   ```

2. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

3. Apri `http://localhost:5173` nel browser

### Modalità Playtest

1. Nell'applicazione, vai alle impostazioni (icona ingranaggio).
2. Abilita "Modalità Playtest" e "Log Telemetria".
3. Riavvia l'applicazione per applicare le impostazioni.

Durante il gioco, l'applicazione registra eventi come tap, sessioni, errori automaticamente per analisi locale.

## Abilitare Log di Telemetria
3. Nota il percorso del file scaricato (solitamente Download folder).

   ![Screenshot export logs](docs/assets/playtest/export-logs.png)

## Esportare Log JSON

1. Nell'applicazione, vai a "Esporta Log" (in modalità playtest).
2. Tocca "Scarica Telemetria" per salvare `telemetry.json` sul dispositivo.
3. Nota il percorso del file scaricato (solitamente Download folder).

   ![Screenshot export logs](docs/assets/playtest/export-logs.png)

## Analisi Locale dei Log

Dopo aver scaricato `telemetry.json` sul computer, usa il CLI per generare report completi in locale:

```bash
# Import telemetria e genera report (usa telemetry.json di default)
npm run playtest:log -- --import telemetry.json --format json,markdown,csv

# Modalità interattiva per debug locale
npm run playtest:log:interactive --import telemetry.json
```

Il CLI genera automaticamente:

- **JSON**: dati strutturati per analisi
- **Markdown**: report leggibile con statistiche
- **CSV**: dati tabellari per fogli di calcolo

I file vengono salvati in `data/runs/mobile_playtests/` con timestamp.

### Replay di Sessioni Registrate

Per rivedere e analizzare una sessione già registrata, usa il replay interattivo:

```bash
# Replay non-interattivo (default)
npm run playtest:replay -- data/runs/mobile_playtests/2026-01-04T10-00-00-sample.json \
  --replay-mode all --format csv

# Replay interattivo (solo debug)
npm run playtest:replay:interactive -- data/runs/mobile_playtests/sample.json
```

Modalità disponibili:

- `summary` (default): stampa statistiche principali
- `samples`: mostra i campioni grezzi (cicli/tap/latency/risorse)
- `all`: stampa summary + samples ed esporta CSV se richiesto

La variante `:interactive` mantiene i prompt per workshop locali.

## Sviluppo e Testing Locale

### Testing con Playwright

Per test automatizzati in ambiente locale:

```bash
# Esegue suite Punch Club in locale
npm run test:punch-club

# Esegue singola specifica
npm run test -- tests/punch-club-landing.spec.ts
npm run test -- tests/punch-club-touch-mode.spec.ts
```

### Debug e Telemetria

1. Usa la console del browser per ispezionare eventi telemetria
2. Controlla `window.__punchClubTelemetry` per dati grezzi
3. Usa Chrome DevTools Performance per analisi delle prestazioni

### Configurazione Ambiente Lab

Per configurare l'ambiente di sviluppo locale:

1. Modifica `vite.config.ts` per impostazioni specifiche
2. Usa variabili d'ambiente `.env.local` per configurazioni sensibili
3. Configura `playwright.config.ts` per test automatizzati

## Note Importanti

- **Lab Only**: Punch Club è disponibile solo per sviluppo e testing locale
- **No PWA**: Non è prevista distribuzione come Progressive Web App
- **Telemetria Locale**: I log vengono salvati localmente per analisi
- **Sviluppo Continuo**: Usa il server di sviluppo per iterazioni rapide
- **Testing**: Usa Playwright per test automatizzati affidabili

## Supporto e Feedback

Per problemi o domande sullo sviluppo locale:

1. Controlla la documentazione tecnica nel repository
2. Usa i canali di comunicazione del team di sviluppo
3. Apri issue su GitHub per bug o richieste di funzionalità

## Note Importanti

- **Lab Only**: Punch Club è disponibile solo per sviluppo e testing locale
- **No PWA**: Non è prevista distribuzione come Progressive Web App
- **Telemetria Locale**: I log vengono salvati localmente per analisi
- **Sviluppo Continuo**: Usa il server di sviluppo per iterazioni rapide
- **Testing**: Usa Playwright per test automatizzati affidabili

## Supporto e Feedback

Per problemi o domande sullo sviluppo locale:

1. Controlla la documentazione tecnica nel repository
2. Usa i canali di comunicazione del team di sviluppo
3. Apri issue su GitHub per bug o richieste di funzionalità

---

## Appendice: Architettura Lab

### Componenti Principali

- **PunchClubPage**: Componente React principale per il gioco
- **TelemetryLogger**: Sistema di logging per eventi di gioco
- **PlaytestLogger**: CLI per analisi dei log telemetria
- **Config Store**: Gestione configurazioni di sviluppo

### Flusso Dati Lab

1. **Local Storage**: Dati salvati localmente su filesystem
2. **Session Storage**: Sessioni temporanee in browser
3. **Export Files**: File JSON/CSV generati localmente
4. **No External Dependencies**: Nessuna dipendenza da servizi esterni

### Sicurezza e Privacy

- **Local Only**: Nessun dato inviato a server esterni
- **No Tracking**: Nessun analytics o tracking di terze parti
- **Development Mode**: Configurazioni solo per ambiente di sviluppo
- **Data Control**: Controllo completo sui dati generati

```typescript
// usePWAInstall Hook Tests
test('should initialize with default state');
test('should handle beforeinstallprompt event');
test('should track install success');
test('should handle install dismissal');

// Validation Tests
test('should validate correct telemetry data');
test('should recover from invalid data');
test('should handle schema version compatibility');
```

### CLI Integration

#### Enhanced Export Commands

Nuovi comandi per validazione e monitoring:

```bash
# Export con validazione e recovery
npm run playtest:export -- --validate --retry --recovery

# Monitoring KPI in real-time
npm run playtest:monitor -- --kpi install,export,performance

# Report PWA metrics
npm run playtest:report -- --pwa-metrics --kpi-summary
```

#### Validation Reports

Report dettagliati per compliance KPI:

```json
{
  "validationSummary": {
    "totalExports": 150,
    "validExports": 150,
    "validationRate": 100,
    "recoveredExports": 12,
    "recoveryRate": 8.0
  },
  "pwaMetrics": {
    "installSuccessRate": 94.2,
    "coldStartAvgMs": 2450,
    "updateSuccessRate": 96.8
  },
  "kpiCompliance": {
    "installSuccess": true,
    "coldStart": true,
    "exportValidation": true,
    "updateStrategy": true
  }
}
```

### Troubleshooting PC-M2E

#### Common Issues

**Install Tracking**:
- Prompt non appare: Verifica manifest PWA e HTTPS
- Install non tracciata: Controlla `beforeinstallprompt` event
- Errori persistenti: Monitora console per SW errors

**Cold Start Performance**:
- Slow activation: Controlla cache strategy e asset size
- High first fetch: Verifica network-first strategy
- Metrics mancanti: Assicura performance marks enabled

**Telemetry Validation**:
- Export fallito: Controlla schema e data integrity
- Recovery non funziona: Verifica fallback values
- Validation rate <100%: Monitora error patterns

#### Debug Tools

Nuovi strumenti per debugging:

```bash
# Debug PWA install flow
npm run playtest:debug -- --pwa-install --verbose

# Validate telemetry schema
npm run playtest:validate -- --schema-check --strict

# Monitor SW performance
npm run playtest:monitor -- --sw-metrics --real-time
```

### Checklist Playtest PC-M2E

#### PWA Installation
- [ ] Installa PWA su Android/iOS
- [ ] Verifica install prompt detection
- [ ] Testa install success tracking
- [ ] Testa install dismissal tracking
- [ ] Monitora cold start performance (<3s)
- [ ] Verifica SW update notifications

#### Telemetry Export
- [ ] Genera telemetry data completo
- [ ] Testa export validation (100% success)
- [ ] Verifica data recovery functionality
- [ ] Testa retry logic per export falliti
- [ ] Controlla PWA metrics inclusion
- [ ] Verifica KPI compliance reporting

#### KPI Validation
- [ ] Install success rate ≥90%
- [ ] Cold start time <3s
- [ ] Export validation rate 100%
- [ ] Update success rate ≥95%
- [ ] All telemetry events tracked
- [ ] Error handling graceful

#### Test Coverage
- [ ] E2E tests pass (PWA + Export)
- [ ] Unit tests pass (Hooks + Validation)
- [ ] Performance tests pass (Cold start)
- [ ] Accessibility tests pass (Touch targets)
- [ ] Security tests pass (HTTPS + CSP)
- [ ] Compatibility tests pass (Android/iOS)
