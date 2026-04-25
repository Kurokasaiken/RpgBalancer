AGENT
Idle Village Skin Deployment Specialist – POI Capsule

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Convertire `slot-v12-skin.json` in TemporarySkinConfig, registrarla nel sistema e montarla su Rack A/B + Activity Capsule Detail per la skin Wilderness Bronze.

PROMPT READINESS
FILE TARGET
- [esistente] /Users/faustoboni/progetti personali/slot-v12-skin.json (fonte dati)
- [esistente] src/ui/idleVillage/skins/temporarySkinConfig.ts (da estendere)
- [esistente] src/ui/idleVillage/skins/temporarySkinRegistry.ts (da aggiornare)
- [esistente] src/ui/idleVillage/TestRosterPage.tsx (da integrare)
- [esistente] src/ui/idleVillage/components/ActivityCapsuleDetail.tsx (da integrare)
- [nuovo] src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig.ts (config convertita)

STYLE LAB PRESET
- Preset: frontier-bronze (definito in metadata.styleLabPreset)
- Overrides/Tokens: Tutti i token definiti in colorTokens, animations, e filters

TEST ROUTE QA
- Inserisci esplicitamente nel prompt che l'agente deve seguire `src/docs/docs/QA/test-route-drag-guidelines.md` (mouse reale Playwright, Pixelmatch/Applitools, Trace Viewer, evidence log `test-results/test-route-drag-vrt-<data>.log`).

DATO DI ORIGINE
- Documento: slot-v12-skin.json – skin Wilderness Bronze per slot v12 con geometria, colorTokens, animations, e componentSlots

DIPENDENZE
- IV-SLOT-SKIN-REGISTRY (dipende da questo)

OPERAZIONI DA ESEGUIRE
1. **Analisi slot-v12-skin.json**:
   - Leggere e comprendere la struttura della skin
   - Identificare geometry parameters (SZ, R_CAV, R_RING1, etc.)
   - Mappare colorTokens in sezioni: cavity, seal, collar, bezel, tooth, medal, halo
   - Estrarre animations (arcane-breathe, seal-pulse, seg-spin, rim-idle, lock, halo-fill)
   - Analizzare states (empty, occupied, locking)
   - Verificare componentSlots per SlotComponent

2. **Creazione TemporarySkinConfig**:
   - Creare `src/ui/idleVillage/skins/converted/slotWildernessBronzeConfig.ts`
   - Convertire la struttura JSON in TypeScript interfaces
   - Mappare colorTokens a CSS variables e Style Lab tokens
   - Definire geometry constants
   - Convertire animations in CSS keyframes
   - Implementare states come varianti del componente

3. **Registro TemporarySkinRegistry**:
   - Importare la nuova config in `temporarySkinRegistry.ts`
   - Registrare con ID 'slot_wilderness_bronze'
   - Assicurare che `getTemporarySkinConfig('slot_wilderness_bronze')` restituisca la config
   - Aggiungere type checking per la nuova skin

4. **Integrazione TestRosterPage**:
   - Identificare Rack A/B in TestRosterPage
   - Avvolgere i ResidentSlotRack con SkinSlot
   - Passare temporary skin config come prop
   - Aggiungere telemetry `slot_skin_rendered` con payload:
     ```typescript
     {
       skinId: 'slot_wilderness_bronze',
       rackType: 'A' | 'B',
       slotCount: number,
       renderTimestamp: Date.now()
     }
     ```

5. **Integrazione ActivityCapsuleDetail**:
   - Applicare SkinSlot anche ai slot nella ActivityCapsuleDetail
   - Usare la stessa temporary skin config
   - Assicurare coerenza visiva tra Rack e Detail
   - Aggiungere telemetry per detail rendering

6. **Validazione e Testing**:
   - Verificare rendering corretto su /test
   - Testare stati empty/occupied/locking
   - Validare animations e transitions
   - Controllare telemetry events emission
   - Verificare Style Lab token application

OPERAZIONI VIETATE
- Non modificare direttamente slot-v12-skin.json (è la fonte di verità)
- Non hardcodare valori dalla skin nei componenti
- Non creare duplicati di config esistenti
- Non skippare telemetry integration
- Non modificare altri skin system esistenti

ASSUNZIONI
- slot-v12-skin.json è la fonte di verità per la skin
- TemporarySkinConfig system è già implementato
- Style Lab preset frontier-bronze esiste
- TestRosterPage ha Rack A/B identificabili
- ActivityCapsuleDetail ha slot componenti

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/skins/converted/ src/ui/idleVillage/skins/temporarySkinRegistry.ts`
- `npm run test:unit -- src/ui/idleVillage/skins/converted/`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia Alta; procedi con conversione e integrazione completa
- Check-in solo se incontri problemi critici con il TemporarySkinConfig system

KANBAN COMPLETION
1. Stato Kanban → "Completato" con data.
2. Evidence `test-results/iv-slot-skin-v12-2026-03-06.log`.
3. Config convertita e registrata nel sistema.
4. Skin applicata su Rack A/B e ActivityCapsuleDetail.
5. Telemetry events funzionanti.

NOTE
- Questa skin ha una geometria complessa con molti parametri radiali
- Le animations includono lock sequence con 3 fasi
- Il sistema componentSlots usa data attributes per binding
- Verifica compatibilità con browser per canvas halo animations

ANTI-STALL DIRECTIVE
- Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

ANTICIPATED QUESTIONS
Q: Come gestire i canvas animations per halo?
A: Implementare useEffect che inizializza canvas context e anima arco halo usando requestAnimationFrame

Q: Cosa fare se Style Lab preset non esiste?
A: Creare il preset frontier-bronze basandosi sui colorTokens definiti nella skin

Q: Come testare states transitions?
A: Usa React state per simulare empty→occupied→locking e verifica CSS transitions

CONFIG STRUCTURE
```typescript
interface SlotWildernessBronzeConfig {
  id: 'slot_wilderness_bronze';
  name: string;
  version: string;
  geometry: {
    SZ: number;
    R_CAV: number;
    R_RING1: number;
    // ... altri parametri geometrici
  };
  colorTokens: {
    cavity: Record<string, any>;
    seal: Record<string, any>;
    // ... altre sezioni colori
  };
  animations: Record<string, AnimationConfig>;
  states: Record<string, StateConfig>;
  componentSlots: ComponentSlotConfig;
}
```

EVIDENCE LOG
- test-results/iv-slot-skin-v12-2026-03-06.log
