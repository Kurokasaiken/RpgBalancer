# DNA PRISMATIC WANDERLUST – BIBBIA DI DIREZIONE ARTISTICA (v0.10)

Core Philosophy: Antitesi del dark fantasy. Energia cinetica, libertà, e trionfo solare. Il mondo non è "sporco", è materico. La povertà non è "miseria", è rude bellezza.

---

## 1. I DUE PILASTRI DEL MONDO

### A. IL WILDERNESS (Il Cuore del Progetto)

- **Mood:** Rude Bellezza, avventura, potenziale inespresso.
- **Geografia:** Valli montane (Dolomiti style), fiumi cristallini, praterie lussureggianti.
- **Materiali:** Legno grezzo (Timber), Pietra alpina, Paglia dorata (Golden Thatch).
- **Sky Color:** Azure Vibrante (Azzurro terso e intenso).

### B. L'IMPERO (Verticale del Sud)

- **Mood:** Solar Triumph, monumentalità barocca, nobiltà pesante.
- **Geografia:** Deserti basaltici, architetture colossali sospese.
- **Materiali:** Basalto Nero venato, Bronzo Barocco (Sun-Bronze), Sete iridescenti.
- **Sky Color:** Indaco profondo / Vuoto Prismatico.

---

## 2. PILASTRI TECNICI (I GENI DEL DNA)

### 🧱 Lo Split-Rendering

Ogni asset deve mostrare un contrasto violento tra due stili di rendering:

- **Punto Focale (Volti/Icone):** Iper-pulito, scultoreo, stile Ruan Jia. Pelle impeccabile, subsurface scattering, zero pennellate.
- **Corpo e Materia:** Materico, "croccante", stile Jaime Jones/Jeff Easley. Pennellate d'olio larghe, impasto spesso e visibile.

### 🎨 La Palette e le Ombre

- **Regola SSoT:** Le ombre non sono mai grigie o marroni.
- **Colore Ombre:** Deep & Cool Teal / Smeraldo / Turchese.
- **Luce:** Bianco accecante (Solar Triumph), lens flare prismatici, polvere dorata (dust motes).
- **Pigmenti Primari:** Blu Oltremare, Verde Veronese, Rosso Cinabro, Ambra.

---

## 3. LO STACK ARTISTICO (Ruoli Specifici)

| Artista | Ruolo nel DNA | Cosa "rubare" |
| --- | --- | --- |
| **Ruan Jia** | Volti | Bellezza scultorea, pulizia digitale, luce divina sulla pelle. |
| **Jaime Jones** | Materia | Pennellate larghe, impasto d'olio, texture di legno e pietra. |
| **Sparth** | Silhouette | Monumentalità, architetture asimmetriche, scala eroica. |
| **Araki** | Cromia/Posa | Saturazione Azure/Veronese, pose "Alta Moda" (Vogue aesthetic). |
| **Justin Gerard** | Creature | Whimsy (estro), mistero della foresta, forme grottesche ma vibranti. |
| **Jeff Easley** | Mostri/Armature | Peso del bronzo, mostri leggendari, eroicismo anni '80 modernizzato. |

---

## 4. REGOLE DI CREAZIONE PROMPT (Prompt Engineering v0.10)

1. **Zone-Based Instruction:** Separare esplicitamente il trattamento del volto (Clean) dal resto (Impasto).
2. **Specificità Materica:** Mai usare termini generici. Usare “Golden Thatch” invece di “Roof”, “Baroque Sun-Bronze” invece di “Armor”.
3. **Terminologia Anti-Sci-Fi:** Vietato usare: pipes, exoskeleton, wires, tech. Usare: structural ribs, ceremonial plates, artisan carvings.
4. **Guardrail Cromatici:** Inserire sempre “Deep Teal shadows” e “No grey, no brown”.

> **IMPORTANTE – Prompt Authoring per l'AI:** Usa sempre la Bibbia v0.10 come manuale tecnico. Costruisci il prompt dividendo le istruzioni in ZONE (Focal Point vs Matter) e applica la “Kill List” per bloccare automaticamente Sci-Fi e Grim.

---

## 5. MASTER PROMPT VALIDATI (Copiare/Incollare)

### 🌲 Master Prompt: Wilderness (Cuore del Progetto)

A majestic, wide-angle landscape of a frontier village in a lush mountain valley (21:9 aspect ratio). ARCHITECTURE: Simple but sturdy timber and stone houses with golden thatched roofs. GEOGRAPHY: A crystal-clear river reflecting a vibrant Azure sky. Background: monumental jagged mountain peaks (Dolomites style) and a sun-drenched, ancient forest. LIGHTING: “Solar Triumph”—brilliant, clean white sunlight, deep and cool Teal shadows. STYLE: Jaime Jones broad oil brushstrokes, thick impasto textures on wood and stone. Mood: Adventurous, inviting, Rude Beauty.

### 👤 Master Prompt: Eroe (Split-Rendering)

Elite character portrait of a noble male hero. THE FACE: Ruan Jia sculptural perfection, flawless skin, no brushstrokes. THE BODY: Baroque Sun-Bronze armor, scratched and weathered, rendered with thick Jaime Jones impasto brushwork. LIGHTING: Blinding white light, saturated teal shadows. STYLE: Contrast between digital polish and oil painting texture.

---

## 7. COMPONENTI UI WANDERLUST (WL-STY-007)

### ActionCardBase – Il Dettaglio Narrativo

**Filosofia**: L'ActionCard è il "dettaglio" dell'azione, la finestra che rivela la sostanza di un'attività o interazione.

#### Wilderness Pillar – Rude Bellezza Organica
- **Materiali**: Legno grezzo con texture impasto, paglia dorata, pietra alpina
- **Colori**: Verde foresta (rgba(44, 116, 66)), marroni caldi, accenti ambra
- **Animazioni**: Movimenti leggeri, scale 1.02, pulse delicati (2.5s)
- **Game Feel**: "Chiara, naturale, accessibile" – come una porta di legno che si apre con facilità
- **Audio**: Chime armonici, whoosh leggeri, ronzio naturale

#### Empire Pillar – Trionfo Solare Monumentale
- **Materiali**: Basalto nero venato, bronzo barocco, sete iridescenti
- **Colori**: Sun-bronze (rgba(205, 127, 50)), indaco profondo, accenti dorati
- **Animazioni**: Movimenti ponderati, scale 1.03, pulse più forti (2s)
- **Game Feel**: "Potente, permanente, imperiale" – come un portale bronze che richiede attenzione
- **Audio**: Campane bronze, whoosh caldi, ronzio metallico

### ActionHalo – Il Richiamo sulla Mappa

**Filosofia**: L'ActionHalo è il "richiamo" sulla mappa, il segnale che attira l'attenzione verso un punto di interesse.

#### Wilderness Pillar – Energia Vitale Naturale
- **Visual**: Anelli verdi con pulse leggero, glow organico, dimensioni 48-60px
- **Animazioni**: Pulse 1.1x scale, opacity 0.6-0.9, ciclo 2.5s
- **Game Feel**: "Vitale, pulsante, naturale" – come il respiro della foresta
- **Interazione**: Click produce ripple verde, chime armonico, feedback leggero

#### Empire Pillar – Aura Monumentale
- **Visual**: Anelli bronze con pulse forte, glow imponente, dimensioni 56-72px
- **Animazioni**: Pulse 1.15x scale, opacity 0.7-1.0, ciclo 2s
- **Game Feel**: "Maestoso, costante, imperiale" – come il battito del cuore dell'impero
- **Interazione**: Click produce ripple bronze, campana, feedback più marcato

### Differenza Fondamentale: Mappa vs Dettaglio

| Caratteristica | ActionHalo (Mappa) | ActionCardBase (Dettaglio) |
|---------------|-------------------|---------------------------|
| **Scopo** | Attenzione, scoperta | Informazione, azione |
| **Scala** | POI, overview | Activity, dettaglio |
| **Interazione** | Hover + click | Hover + collect CTA |
| **Animazione** | Pulse continuo | Event-driven |
| **Informazioni** | Icona + stato | Props + progress + assignees |
| **Contesto** | Esplorazione | Decisione |

### Telemetry Integration

**Eventi Tracciati**:
- `wanderlust_pillar_switch`: Cambio pillar con context e timestamp
- `action_halo_render`: Rendering POI con pillar e count
- `action_card_base_render`: Rendering card con pillar e count
- `action_card_collect`: CTA collect con pillar e success/failure

**Payload Standard**:
```typescript
{
  context: 'test_roster' | 'village_sandbox' | 'minimal_gameplay',
  pillar: 'wilderness' | 'empire',
  componentCount: number,
  timestamp: number,
  sessionId: string
}
```

---

## 8. I NEMICI DEL DNA (Kill List)

1. **NO GRIM:** Niente sporcizia fine a se stessa, niente miseria, niente teschi o decadenza.
2. **NO MUD:** Niente colori fangosi, terra marrone o nebbia grigia.
3. **NO SYMMETRY:** L'architettura e le pose devono essere asimmetriche e dinamiche.
4. **NO FLAT DESIGN:** Niente superfici lisce digitali (tranne i volti). Tutto deve avere “peso” tattile.

---

Versione controllata e approvata per il rollout artistico v0.10.
