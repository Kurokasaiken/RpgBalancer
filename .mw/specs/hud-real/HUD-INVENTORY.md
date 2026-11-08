# HUD-INVENTORY — F0 output (PLAN-112, 2026-11-05)

> Prodotto di F0 (congelamento e inventario). 0 immagini generate.
> Fonti: HUD-108-AUDIT, STATUS.md, DECISIONI-APERTE.md, queue.json, gen-budget.json, git.

## 0. Baseline fedele (E-24)

- **Commit baseline:** `574902c1` (worktree sporco per altra sessione — R-318 sea-sapphire; i file hudReal toccati da quella sessione non fanno parte di questo inventario). Ultimo commit di dominio HUD: `4e406fbc` (zanara kit → hudReal).
- **Avvio riproducibile:** `npm run dev` → `http://localhost:5173/hud-compose` (varianti: `?stress`, `/hud-defects`, `/hud-library`, `/hud-lab`).
- **Dipendenze route:** `src/pages/hud-compose.tsx` → `src/ui/idleVillage/hudReal/*` (12 componenti + 14 geometry modules + `hudType.ts`) → asset `public/assets/ui/hud-real/{C1,brand,bust,compass,globe,library,nav,panel,resources,round,seal,time,voce}/`.
- **Provenance asset:** generazione Gemini via `scripts/hud-real/gen-queue.mjs` con ledger `runs.jsonl` (hash prompt+zona+variante, resume su finestra quota); grade/unificazione via `regrade-assets.py`, `retint-enamel.py`, `unify-enamel.py`.
- **Errori runtime noti:** nessuno (audit: render pulito a 3 viewport). Eslint: `src/ui/idleVillage/hudReal` coperto da ignore pattern (decisione aperta D-A #10).
- **Ownership:** tutti i 12 componenti sono React DOM overlay (nessun Pixi canvas). Su `/game` monterebbero via slot HUD esistenti; `/hud-compose` li monta sopra la mappa in pagina lab.
- **Verificato-riusabile vs esistente:**
  - *Verificato-riusabile:* metodo T-101b + script misura (audit), `compile-prompt.py` (vocabolario vietato), `hud-gen-gate.py` calibrato (E-03 PLAN-110), `quota-runner.mjs` + `quota.json`, pagina `/hud-defects`, `gen-queue.mjs` + `runs.jsonl` (dedupe/resume), `unify-enamel.py`, `hudType.ts` (scala tipografica v1).
  - *Esistente, NON verificato:* i 12 componenti React e i loro asset (audit: «nessun componente è verified»). Il prototipo è congelato come R2 e **non è baseline di accettazione**.

## 1. Inventario componenti (F0.1)

| # | Componente | File | Stato proposto* | Perché |
|---|---|---|---|---|
| C1 | Roster | `HudRealRoster.tsx` + `C1/*` | **rifare** su contratto pianta | ingombro/gerarchia sbagliati (audit §3); asset medaglione/placca = riferimento spike F3.3 |
| C2 | Risorse | `HudRealResources.tsx` + `resources/*` | **tenere**, adattare a contratto | dati reali, bar asset buona; riallineare a barra superiore unica |
| C3 | Nav | `HudRealNav.tsx` + `nav/*` | **rifinire** su contratto | voci reali; astrolabio da ridurre, tondi vuoti da eliminare |
| C4 | Pannello | `HudRealPanel.tsx` + `panel/*` | **rifare** | testo fisso + finestra vuota; prima il contratto contenuto F2 |
| C5 | Bussola | `HudRealCompass.tsx` | **declassare** | nessun dato reale → contestuale/assente (P5, E-09) |
| C6 | Globo | `HudRealGlobe.tsx` | **eliminare** | nessuna azione (decisione §7.3) |
| C7 | Sigillo | `HudRealSeal.tsx` + `seal/*` | **contestuale** dentro pannello | % spedizione esiste solo in dettaglio spedizione |
| C8 | Marchio | `HudRealBrand.tsx` + `brand/*` | **decisione** (ridotto/assente) | Director: toglierlo dalla schermata → default assente |
| C9 | Busto | `HudRealBust.tsx` | **eliminare** | ornamento dead (già tolto dal pannello in STATUS) |
| C10 | Voce | `HudRealVoce.tsx` + `voce/*` | **rifare** come notifica narrativa | testo fisso, manca dato; protocollo notifica E-15 |
| C11 | Tempo | `HudRealTime.tsx` + `time/*` | **tenere**, cablare | sorgente reale esiste (`currentDay`, `speed`); demo-locale → store |
| C12 | Comandi | `HudRealRoundButton.tsx` | **tenere**, azioni reali | menu/pannelli/nascondi esistono su /game; posizione basso dx (D-A #7) |

*Proposta dell'orchestratore; il Director conferma/cambia nella lista decisioni §3.

## 2. Audit esistenza dati (E-09) — tabella reale / contestuale / assente

| Elemento | Dato oggi | Fonte | Verdetto F1 |
|---|---|---|---|
| Roster | reale | `useRosterKitData` | persistente |
| Risorse+cibo | reale | `selectResourceOutlook` (−6/d, giorni) | persistente |
| Nav | reale | config voci | persistente |
| Tempo | sorgente reale, componente demo | `WhenWhereCluster` (`currentDay`,`speed`) | persistente dopo wiring |
| Pannello | fisso | nessuna | contestuale (apre su selezione luogo/spedizione) |
| Sigillo | nessuna fissa | % solo in dettaglio spedizione | contestuale dentro pannello |
| Voce | fissa | nessuna sorgente | temporaneo (notifica su evento) |
| Bussola | fissa | nessuna sorgente | assente finché non ha dato |
| Globo | nessuna azione | — | assente/eliminato |
| Comandi | azioni parziali | menu/pannelli/hide su /game | persistente (azioni da verificare) |
| Marchio | nessun dato | — | decisione Director (default assente) |

## 3. Inventario famiglie pannelli (E-40) — seed per fit check F1

| Famiglia | Membri (file reali) | Slot ospite proposto | Nota |
|---|---|---|---|
| quest | QuestRunWindow/theatre, `QuestRewardPopup` (placca page-level), `QuestSkillCheckOverlay`, `QuestOutcomeToast`, `QuestAssignmentPreview` | slot pannello + overlay fuori slot | theatre/cockpit = variante più larga candidata |
| table | registry, `MerchantPanel`, `VillageStashPanel`, `TradeRoutePanel` | slot pannello | |
| editorial | `HeroSheetPanel`, `ActivityLogPanel`/`EventLogPanel`, `MemorialPanel`, `LegacyReliquaryPanel`, `SettingsPanel`, `LoadGamePanel` | slot pannello | |
| transient | Voce/notifica, `FatigueAlertToast`, `RestOverlay`, `SettlementLostOverlay`, `TheaterOverlay`, `GoblinInvasionWindow` | matrice E-15 (fuori slot) | priorità collisione da dichiarare |
| menu/sistema | `TitleScreen`, `GameMenuDialog`, `GameMenuConfirm` | fuori HUD (boot/menu) | |

Il fit check di F1 compila per ogni voce: ingombro minimo reale (l×a), comportamento nella vista contestuale, partecipazione al tetto simultaneo E-15. **G1 non firma uno slot pannello che la variante più larga in-scope non entra.**

## 4. Decisioni aperte — classificate (E-08)

### (i) BLUEPRINT-SHAPING — da chiudere prima di G1 (default a una riga)

| # | Decisione | Default proposto |
|---|---|---|
| D1 | Pianta A/B/C (fork visivo F1.5) | **B** (roster compatto, più mappa) — ruling su card |
| D2 | Emblema/marchio in HUD | **assente** in panoramica (titolo solo boot/title) |
| D3 | Bussola + globo | **fuori** (declassati finché non hanno dato/azione) |
| D4 | Sigillo | **dentro il pannello** (riga probabilità spedizione) |
| D5 | Righe roster a riposo | **4** + stato ridotto a gemma/placca a passaggio |
| D6 | Scala di riferimento + «dimensione interfaccia» | **1440×900** canonica; step 100/125/150% dichiarati in contratto |
| D7 | Consumo cibo a vista | **nel chip**, forma breve, pericolo in evidenza |
| D8 | Posizione comandi tondi | **basso a destra** (già applicato nel prototipo) |
| D9 | Mappa di riferimento per lab/misure | **mappa2** (la HUD nasce per la mappa nuova) |
| D10 | <768px | **fallback preset `base`** (E-33) |

### (ii) SPIKE-DEFERRED — si chiudono a G2 (card)

Cimiero (fenice vs crest-roman: aquila/galea/corona — R-315 in attesa), stella a 4 punte ripetuta, icone nav incise oro, saturazione smalto risorse/sigillo, scelta varianti materiali F3.3.

### (iii) INTEGRATION-DEFERRED — si chiudono a G3/F6

Inclusione eslint di `hudReal` (default: includere), promozione token `--hud-*`, verifica Tauri.

## 5. Stato quota (lettura live, E-35)

`gen-budget.json` @2026-11-05: **60/170 usate → ~110 residui**. Budget PLAN-112: F3 ≤30, F4 ≤60. F1/F2 a quota zero.
