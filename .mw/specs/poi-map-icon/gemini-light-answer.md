This design solution provides a high-readability, low-detail (LOD) version of the POI marker that preserves the "Gilded Observatory" aesthetic while ensuring functional clarity at small scales.

### 1. Element Analysis: Survival vs. Reduction
*   **Survives: The South Tail.** Essential for the "map pin" utility. It will be simplified into a solid brass wedge to maintain the silhouette's orientation.
*   **Survives: The Core Sapphire Mass.** The blue dome is the primary color identifier. In the light version, this becomes a high-contrast gradient circle to maintain the "blue blob" recognition from a distance.
*   **Survives: The Brass Ring.** This maintains the material language. The internal engravings are dropped in favor of a clean, polished metallic rim with a high-specular highlight.
*   **Dropped: The 4 Sapphire Daggers.** At 24px, these create visual noise. They are replaced by four simple, raised brass "nubs" or tabs at the cardinal points to maintain the compass-rose silhouette.
*   **Dropped: Detailed Timer Channel.** The thin recessed ring disappears. Instead, the timer state is represented by a simple 1px outer glow or a color shift in the brass ring itself (e.g., the whole ring turns red for urgent).
*   **Dropped: Painted Icon.** The center is a pure, glowing sapphire/teal gradient. Icons are unreadable at far zoom and are better "discovered" during the zoom-in transition.

### 2. Visual Description: The Light Version
The Light version is a **bold teardrop-compass hybrid**. It features a thick, polished **sun-bronze rim** (2-3px weight) with a sharp, elongated triangular tail at the south and small triangular protrusions at North, East, and West. The center is a **solid sapphire-blue gem**, rendered with a single "hot" specular highlight at the top-left to indicate its spherical nature. To ensure visibility on both dark sea and bright land, the brass rim uses a **dark basalt-black inner stroke** for contrast against the blue, and a **bright sun-bronze outer bevel** that glints against dark backgrounds. The overall feel is that of a heavy, solid brass casting rather than a thin instrument.

### 3. The Transition (Morph Sequence)
The transition should feel like a mechanical "unfolding" or a lens coming into focus.
*   **0% (Light):** Solid brass teardrop with a simple sapphire circular inlay. Cardinal points are integrated into the ring's outer silhouette.
*   **50% (Transition):** The sapphire center gains depth and transparency as the internal icon fades in. The brass ring "splits" to reveal the recessed timer channel. The 4 cardinal tabs extend outward and sharpen, transforming from brass wedges into the sapphire-tipped daggers.
*   **100% (Full):** The ornate engravings "bloom" onto the brass surface via a shadow-map overlay. All micro-details (small blue gems, filigree) reach full opacity.

### 4. AI Prompt Fragment
> UI map icon, map pin silhouette, ornate sun-bronze metal frame, large central sapphire cabochon, compass rose shape with elongated bottom point, polished brass material, teal accents, dark fantasy aesthetic, clean edges, high contrast, painted game asset style, solid chroma background.

### The Single Biggest Risk
The greatest risk in a two-LOD system is **"Visual Identity Drift,"** where the Light version’s simplified silhouette or color balance differs enough from the Full version that the "pop" during the transition feels like an object swap rather than a focus shift. To avoid this, the **Center of Mass** must remain identical: the sapphire dome’s exact coordinate and diameter must not shift by even a single pixel during the morph. If the "blue" moves or changes size during the transition, the player’s eye will perceive a jitter, breaking the illusion of a single, physical brass instrument.
