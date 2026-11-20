This art direction for the **Gilded Observatory** Light LOD (Level of Detail) ensures the POI remains a tactile "instrument" even at the most punishing scales.

### 0. The Light-LOD Halo
In the Light version, the halo is stripped of its white runes to prevent sub-pixel "crawling" (shimmering noise). It becomes a **solid, 2-pixel wide luminous sapphire band** with a 10% outer glow. 
*   **Function:** Instead of a thin inner channel on the brass, the *entire halo* acts as the timer.
*   **Readability:** Against the dark sea, the sapphire luminosity provides the primary "hit." Against light land, the halo is given a 1px obsidian "edge-drop" shadow. By keeping the halo a saturated, slightly oversized ring, the marker gains a "buffer zone" that prevents the brass silhouette from being swallowed by complex terrain textures.

### 1. Elements: Survival vs. Reductions
*   **Survive: The "Anchor" Silhouette.** The elongated south tail and the N/E/W dagger-points are maintained but thickened. This "four-point star" shape is the unique identifier that separates it from generic circular buttons.
*   **Survive: The Blue Core.** The sapphire dome remains a single, high-saturation circular block.
*   **Drop: The Internal Timer Channel.** At 24px, a 1px channel is invisible. The halo takes over this duty.
*   **Drop: Engravings & Filigree.** All surface "noise" on the brass ring is flattened into a single, high-contrast sun-bronze gradient to preserve the "metalness" without the clutter.
*   **Drop: The Icon.** The specific POI icon is removed; at far zoom, the player cares about *what* (Quest) more than *which* (The Blacksmith).

### 2. Visual Description (Light LOD)
The Light version is a **bold-stroke distillation**. 
*   **Proportions:** The central sapphire dome is slightly enlarged (110%) relative to the ring to maximize the "color hit." 
*   **Materials:** The brass ring is rendered as a clean "doughnut" with a sharp top-down highlight (Sun-bronze) and a deep bottom shadow (Basalt). The four daggers become solid sapphire triangles with no internal facets. 
*   **Stroke Weights:** A 1px obsidian "keyline" separates the brass from the halo, ensuring the "instrument" looks like it is held *within* the magic, not bleeding into it.

### 3. The Transition (Morph)
The morph must feel like an iris opening or a lens focusing.
*   **0% (Light):** A saturated blue orb in a thick brass star, surrounded by a solid glowing sapphire ring.
*   **50% (Transition):** The brass ring "splits" into its dual-layered production frame; the solid blue core begins to become transparent as the internal icon fades in; the halo’s solid glow dims as the white runes begin to spark into existence.
*   **100% (Baptized):** Full engraved detail, sapphire daggers gain multifaceted highlights, and the timing function moves from the halo to the internal brass channel.

### 4. Image Generator Prompt Fragment
> "Game UI map icon, simplified ornate brass compass pin, elongated south point, central polished sapphire cabochon, thick sun-bronze metallic bevels, surrounded by a luminous saturated sapphire-blue circular energy ring, high contrast, dark fantasy 'Gilded Observatory' style, painted digital asset, solid chroma background --no purple --no text"

### The Single Biggest Risk
The greatest risk in a two-LOD system is **Spatial Jitter**, where the visual "weight" or center-point of the icon shifts during the transition, causing the marker to appear to "jump" or "wobble" as the player zooms. To avoid this, the Light LOD must be built strictly from the **exact geometric footprint** of the Baptized marker; the sapphire dome and the compass points must occupy the identical pixel-coordinates in both versions, ensuring the morph is a change in *density*, not a change in *position*.
