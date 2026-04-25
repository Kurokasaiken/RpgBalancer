# 🔧 Balancer UI Fix Plan

> **Priority:** 🔥 CRITICA (blocca usabilità)  
> **Status:** 📋 In Planning  
> **Effort stimato:** 4-6 ore  
> **Created:** 2025-12-02

---

## 📋 PROBLEMI IDENTIFICATI

### 1. Reset non funziona (Card e Stat)
**Sintomo:** I pulsanti ↺ nelle card e stat non ripristinano i valori iniziali.

**Causa Root:**
- Il pulsante reset della **card** (`ConfigurableCard.tsx:184`) ha `onClick={() => {}}` (vuoto)
- Il pulsante reset della **stat** (`ConfigurableStat.tsx:161`) chiama `onReset` ma il callback non aggiorna lo stato locale `mockValue`
- `resetCardToInitial` e `resetToInitialConfig` non sono collegati ai pulsanti

**Fix:**
1. **Card Reset:** Collegare `onResetCard` prop al pulsante ↺ in `ConfigurableCard.tsx`
2. **Stat Reset:** Dopo `onReset()`, resettare anche `mockValue` al `stat.defaultValue`
3. **Page Reset:** Collegare `resetToInitialConfig` al pulsante "Reset Defaults" in `ConfigToolbar.tsx`

**File coinvolti:**
- `src/ui/balancing/ConfigurableCard.tsx` (linea 184)
- `src/ui/balancing/ConfigurableStat.tsx` (linea 161)
- `src/ui/balancing/Balancer.tsx` (passare `onResetCard`)
- `src/ui/balancing/ConfigToolbar.tsx` (usare `resetToInitialConfig`)

---

### 2. Pulsante Elimina: posizione e stile
**Sintomo:** In modalità modifica, il pulsante 🗑 non è il più a sinistra e manca il cerchio rosso nelle card.

**Causa Root:**
- In `ConfigurableCard.tsx:233-267` il pulsante elimina è l'ultimo nel flex container
- Manca la classe `rounded-full bg-red-900/40 border border-red-500/70` presente nelle stat

**Fix:**
1. Riordinare i pulsanti: Elimina → Annulla → Salva (sinistra → destra)
2. Aggiungere stile cerchio rosso al pulsante elimina card

**File coinvolti:**
- `src/ui/balancing/ConfigurableCard.tsx` (linee 178-268)

---

### 3. Pulsante Occhio: posizione
**Sintomo:** L'icona 👁 (nascondi) non è il più a destra.

**Causa Root:**
- In `ConfigurableCard.tsx:222-231` l'occhio è prima del pulsante elimina
- In `ConfigurableStat.tsx:167-175` l'occhio è prima del pulsante edit

**Fix:**
1. Spostare il pulsante 👁 come ultimo elemento nel flex container (più a destra)

**File coinvolti:**
- `src/ui/balancing/ConfigurableCard.tsx`
- `src/ui/balancing/ConfigurableStat.tsx`

---

### 4. Icona Lock: stato visivo
**Sintomo:** Non si capisce quando il lock è aperto vs chiuso.

**Causa Root:**
- Usa sempre `🔐` (lucchetto chiuso) senza toggle visivo
- Manca stato `isLocked` e logica di toggle

**Fix:**
1. Aggiungere stato `isLocked` al componente
2. Usare `🔓` (aperto) quando unlocked, `🔐` (chiuso) quando locked
3. Cambiare colore: gold quando unlocked, rosso/grigio quando locked
4. Disabilitare slider/input quando locked

**File coinvolti:**
- `src/ui/balancing/ConfigurableStat.tsx`

---

### 5. Pulsanti non funzionanti
**Sintomo:** Lock, Hide, Reset (card) non fanno nulla.

**Causa Root:**
- Tutti hanno `onClick={() => {}}` (handler vuoti)

**Fix per ogni pulsante:**

#### 5.1 Lock (Stat)
- Aggiungere stato `isLocked`
- Toggle su click
- Quando locked: disabilitare slider, +/- buttons, input
- Persistere in `StatDefinition.locked?: boolean` (opzionale)

#### 5.2 Hide/Nascondi (Stat e Card)
- Aggiungere stato `isHidden`
- Quando hidden: collassare a una riga minima con solo titolo + 👁
- Click su 👁 riespande
- Riferimento: `CardWrapper.tsx` ha già questa logica funzionante

#### 5.3 Reset (Card)
- Collegare a `onResetCard` prop (già implementato nel hook)

**File coinvolti:**
- `src/ui/balancing/ConfigurableStat.tsx`
- `src/ui/balancing/ConfigurableCard.tsx`
- `src/balancing/config/types.ts` (aggiungere `locked?: boolean` a StatDefinition)

---

### 6. Icona Lock troppo grande
**Sintomo:** 🔐 è visivamente più grande delle altre icone.

**Causa Root:**
- Emoji 🔐 ha dimensioni native diverse da ↺, ✎, 👁
- Usa `text-base` come le altre ma l'emoji è intrinsecamente più grande

**Fix:**
1. Ridurre dimensione a `text-sm` per il lock
2. Oppure usare caratteri Unicode più uniformi: `⌖` o `⚿` per lock

**File coinvolti:**
- `src/ui/balancing/ConfigurableStat.tsx` (linea 154)

---

### 7. Import formule: valori secchi
**Sintomo:** Quando si importa un config, le formule derivate diventano valori numerici.

**Causa Root:**
- `BalancerConfigStore.import()` valida con Zod ma potrebbe non preservare `isDerived: true` e `formula`
- Possibile che il JSON esportato non includa correttamente questi campi
- Possibile che `mergeWithDefaults()` sovrascriva le formule

**Fix:**
1. Verificare che `export()` includa `isDerived` e `formula` per ogni stat
2. Verificare che `import()` non perda questi campi
3. Aggiungere test di round-trip: export → import → verify formulas intact

**File coinvolti:**
- `src/balancing/config/BalancerConfigStore.ts` (export/import)
- `src/balancing/config/schemas.ts` (verificare schema StatDefinition)

---

### 8. Import/Export non funzionano
**Sintomo:** I pulsanti Export e Import nella toolbar non sembrano fare nulla.

**Causa Root (da verificare):**
- `handleExport()` crea blob e link ma potrebbe non triggerare download
- `handleImportChange()` legge file ma `importConfig()` potrebbe fallire silenziosamente
- Manca feedback visivo (toast/alert) su successo/errore

**Fix:**
1. Aggiungere `console.log` per debug
2. Verificare che `exportConfig()` ritorni JSON valido
3. Verificare che `importConfig()` aggiorni lo stato
4. Aggiungere toast/feedback visivo su successo/errore
5. Aggiungere try/catch con error handling visibile

**File coinvolti:**
- `src/ui/balancing/ConfigToolbar.tsx`
- `src/balancing/hooks/useBalancerConfig.ts`

---

## 🎯 ORDINE DI IMPLEMENTAZIONE

### Fase 1: Fix Critici (2h)
1. [ ] **Reset Stat funzionante** - collegare callback + reset mockValue
2. [ ] **Reset Card funzionante** - collegare onResetCard
3. [ ] **Reset Page funzionante** - usare resetToInitialConfig
4. [ ] **Export/Import debug** - verificare e fixare

### Fase 2: UX Pulsanti (1.5h)
5. [ ] **Riordinare pulsanti card** - Elimina a sinistra, Occhio a destra
6. [ ] **Riordinare pulsanti stat** - Occhio a destra
7. [ ] **Stile elimina card** - cerchio rosso
8. [ ] **Dimensione lock** - ridurre a text-sm

### Fase 3: Funzionalità Mancanti (2h)
9. [ ] **Lock funzionante** - stato + toggle + disable inputs
10. [ ] **Hide funzionante** - collassa/espandi stat e card
11. [ ] **Feedback visivo** - toast su import/export/reset

### Fase 4: Verifica Formule (0.5h)
12. [ ] **Test round-trip formule** - export → import → verify
13. [ ] **Fix se necessario** - preservare isDerived e formula

---

## 📁 FILE DA MODIFICARE

| File | Modifiche |
|------|-----------|
| `ConfigurableStat.tsx` | Lock, Hide, Reset, riordino pulsanti, dimensione lock |
| `ConfigurableCard.tsx` | Reset, Hide, riordino pulsanti, stile elimina |
| `Balancer.tsx` | Passare onResetCard |
| `ConfigToolbar.tsx` | Usare resetToInitialConfig, feedback visivo |
| `useBalancerConfig.ts` | Verificare reset helpers |
| `BalancerConfigStore.ts` | Verificare export/import formule |
| `types.ts` | Aggiungere `locked?: boolean` a StatDefinition |

---

## ✅ CRITERI DI ACCETTAZIONE

- [ ] Click su ↺ stat → valore torna a quello iniziale (dal JSON caricato)
- [ ] Click su ↺ card → tutte le stat della card tornano ai valori iniziali
- [ ] Click su "Reset Defaults" → tutta la pagina torna allo stato iniziale
- [ ] Click su 🔐 → toggle lock, slider disabilitato quando locked
- [ ] Click su 👁 → collassa/espandi stat o card
- [ ] Pulsante 🗑 è il più a sinistra in edit mode, con cerchio rosso
- [ ] Pulsante 👁 è il più a destra
- [ ] Icona 🔐 ha dimensione uniforme alle altre
- [ ] Export scarica file JSON valido
- [ ] Import carica file e aggiorna UI
- [ ] Formule derivate preservate dopo import/export

---

## 🔗 RIFERIMENTI

- **Implementazione funzionante Hide:** `src/ui/components/CardWrapper.tsx` (linee 12-26, 55-61)
- **Hook reset helpers:** `src/balancing/hooks/useBalancerConfig.ts` (linee 349-404)
- **Store export/import:** `src/balancing/config/BalancerConfigStore.ts` (linee 134-144)

---

**Next Step:** Iniziare da Fase 1 - Fix Reset Stat
