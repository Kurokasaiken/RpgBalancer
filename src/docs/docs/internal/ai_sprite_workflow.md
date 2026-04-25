# AI Sprite Workflow (Idle Tactical Prototype)

## Goals

- Massimizzare l'uso di AI + vibecoding per produrre animazioni (idle/move/attack/hit) stile high-fantasy LoL.
- Restare config-first: ogni output deve generare metadati salvabili in `src/balancing/config/idleVillage/animation.ts` (TODO).
- Pipeline ripetibile, documentata e versionabile.

## Toolchain Base

| Fase | Strumento | Note |
| --- | --- | --- |
| Prompt & stile | Prompt library locale (Obsidian/Notion) + template repo | Descrive silhouette, palette Gilded Observatory, arma. |
| Immagine base | Scenario (Flux, Imagen) o generator locale (ComfyUI/SDXL) | Output PNG 2048x2048. |
| Video guida | Scenario Seedance/Pixverse oppure Runway Gen-3 Alpha | Supporta primo/ultimo frame per gestire loop. |
| Estrazione frame | Script `scripts/extract_frames.ts` (TODO) + ffmpeg | Normalizza fps, naming `character_action_frameXX.png`. |
| Vettrorializzazione | Illustrator batch trace / Vectorizer.ai | Output SVG layered per futuro rig. |
| Spritesheet | Final Parsec / TexturePacker CLI | Restituisce PNG + JSON frames. |
| Config ingest | `scripts/register_animation.ts` (TODO) | Scrive timing/pesi in config. |

## Workflow Passo-Passo

1. **Setup prompt**
   - Compila template con: archetipo, pose iniziale, luce, effetti magici.
   - Salva in `docs/prompts/sprite_templates.md` (da creare) per audit.
   - **Prompt template & parameters (Phase 1 focus)**

     ```text
     Heroic [archetipo] [ruolo] in posa [pose], armatura laminata oro/teal, silhouette leggibile, painterly gradients stile League of Legends splash art, rim light teal, particelle arcane, background soft vignette obsidian, ultra-detailed, vector-friendly edges
     ```

   - **Seed management**: riutilizza lo stesso seed per ogni revisione legata al personaggio; cambia solo prompt secondari (fonte: FLUX.1 prompt tips, Skywork 2025).
   - **Palette tokens**: cita sempre “obsidian, teal, gold” per coerenza con Gilded Observatory.
   - **Negative prompt suggerito**: `muddy colors, flat lighting, photorealistic skin, busy background, watermark, text`.
   - **Parametri consigliati**: 2048×2048, steps 35–45, guidance medio (6–7). Per versioni multiple genera batch mantenendo seed e cambiando `pose`.

2. **Genera frame iniziale**
   - Scenario → modello Flux / custom-trained.
   - Parametri consigliati: 2048px, seed fissato, `style=glossy high fantasy`, `camera=isometric hero shot`.
   - Esporta PNG e carica su repo (`assets/concepts/characters/<name>/base.png`).
   - Se servono più soggetti coerenti, usa Multi-LoRA di Scenario o prompt library condivisa per mantenere tratti ricorrenti (fonti Scenario docs + FLUX prompt guide).

3. **Converti in video**
   - Scenario → "Convert to Video".
   - Seedance 1 Pro (loop), durata 5s, 24fps, Aspect 1:1, Motion "Smooth".
   - Prompt azione: es. "ornate mage idle breathing loop, cloak flutter".
   - Per attacchi complessi: usa doppio video (neutral→attack, attack→neutral) come da guida Scenario.
   - Parametri consigliati dal workflow Scenario: `camera fixed: off`, `quality: 1080p`, `motion mode: smooth`, `Rewrite Prompt` attivo per ottimizzare il testo.
   - Identifica subito i key pose (contact, lift-off, recoil) e annota i timestamp in `docs/internal/ai_sprite_workflow.md` per facilitare l’estrazione successiva.

4. **Estrai frame chiave**
   - Usa `node scripts/extract_frames.ts --input=video.mp4 --frames=8 --out=tmp/frames` (script da implementare con ffmpeg `-vf select='not(mod(n,3))'`).
   - Verifica allineamento e correggi in Krita/Photoshop se servono.

5. **Vector + cleanup**
   - Batch trace (Illustrator Image Trace high fidelity) o tool AI (Vectorizer.ai) per ottenere layer SVG.
   - Mantieni naming coerente: `idle_frame01.svg`, ecc.

6. **Build spritesheet + JSON**
   - TexturePacker CLI: `texturepacker tmp/frames --sheet dist/<name>_idle.png --data dist/<name>_idle.json --algorithm Basic --size-constraints POT --border-padding 2 --shape-padding 2 --extrude 1 --trim-mode Trim`.
   - Commit sia PNG sia JSON per reference.

7. **Registrazione config**
   - Script `scripts/register_animation.ts` (TODO) leggerà JSON e genererà entry tipo:
     ```ts
     {
       id: 'mage_idle_v1',
       frames: [...],
       fps: 12,
       blendPriority: 'idle',
       metadata: { source: 'scenario-seedance', seed: 1234 }
     }
     ```
   - Finché lo script non esiste, documentare manualmente in `docs/internal/tactical_sprite_animation_brief.md`.

8. **QA rapido**
   - Usa viewer (is.si Animator) per validare loop.
   - Import nel prototipo (IdleVillage page) e verificare determinismo con RNG seed.

## Automazioni Future

- **scripts/extract_frames.ts**: wrapper ffmpeg + rimappatura naming.
- **scripts/register_animation.ts**: scrive config + aggiorna changelog.
- **Preset ComfyUI**: pipeline locale per ridurre dipendenza SaaS.
- **Addon Scenario API**: esportazione diretta in spritesheet → ridurre passaggi manuali.

## Open Items

1. Definire formato definitivo di `animation.ts` (tipi, schema Zod).
2. Valutare training custom (LoRA) per stile Gilded Observatory.
3. Integrare check QA automatico (gif preview + differenze frame).

Last updated: 2025-12-17
